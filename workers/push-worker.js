import { getLocalReminderContext, shouldSendReminder } from '../src/reminder-rules.js';

const SUBSCRIPTION_PREFIX = 'sub:';
const DEBUG_KEY = 'debug:last-event';
const DAILY_GOAL_ML = 4000;
const REMINDER_START_HOUR = 7;
const REMINDER_END_HOUR = 21;

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(env) });
    }

    const url = new URL(request.url);
    try {
      if (request.method === 'GET' && url.pathname === '/vapid-public-key') {
        return json({ publicKey: env.VAPID_PUBLIC_KEY }, env);
      }

      if (request.method === 'GET' && url.pathname === '/debug') {
        return handleDebug(env);
      }

      if (request.method === 'POST' && url.pathname === '/validate-invite') {
        return handleValidateInvite(request, env);
      }

      if (request.method === 'POST' && url.pathname === '/subscribe') {
        return handleSubscribe(request, env);
      }

      if (request.method === 'POST' && url.pathname === '/progress') {
        return handleProgress(request, env);
      }

      if (request.method === 'POST' && url.pathname === '/unsubscribe') {
        return handleUnsubscribe(request, env);
      }

      return json({ error: 'Not found' }, env, 404);
    } catch (error) {
      return json({ error: error.message }, env, 500);
    }
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(sendScheduledReminders(env, new Date(controller.scheduledTime)));
  }
};

async function handleValidateInvite(request, env) {
  const body = await request.json();
  return json({ ok: isValidInvite(body.inviteCode, env) }, env);
}

async function handleSubscribe(request, env) {
  const body = await request.json();
  await writeDebug(env, {
    type: 'subscribe-attempt',
    hasInviteCode: Boolean(body.inviteCode),
    hasSubscription: Boolean(body.subscription),
    endpointPrefix: body.subscription?.endpoint?.slice(0, 48) || null
  });
  if (!isValidInvite(body.inviteCode, env)) {
    await writeDebug(env, { type: 'subscribe-rejected', reason: 'invalid invite code' });
    return json({ error: 'invalid invite code' }, env, 403);
  }
  validateSubscription(body.subscription);

  const key = await subscriptionKey(body.subscription.endpoint);
  const record = {
    enabled: true,
    subscription: body.subscription,
    timezone: body.timezone || 'UTC',
    quietStartHour: REMINDER_START_HOUR,
    quietEndHour: REMINDER_END_HOUR,
    dailyGoalMl: DAILY_GOAL_ML,
    lastProgressDate: body.progress?.dateKey || null,
    todayMl: Number(body.progress?.todayMl || 0),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await env.WATER_REMINDERS.put(key, JSON.stringify(record));
  await writeDebug(env, { type: 'subscribe-saved', key, timezone: record.timezone, todayMl: record.todayMl });
  return json({ ok: true }, env);
}

function isValidInvite(inviteCode, env) {
  return Boolean(env.INVITE_CODE) && String(inviteCode || '').trim() === env.INVITE_CODE;
}

async function handleProgress(request, env) {
  const body = await request.json();
  await writeDebug(env, {
    type: 'progress-attempt',
    hasEndpoint: Boolean(body.endpoint),
    dateKey: body.dateKey || null,
    todayMl: body.todayMl ?? null
  });
  if (!body.endpoint || !body.dateKey) {
    return json({ error: 'endpoint and dateKey are required' }, env, 400);
  }

  const key = await subscriptionKey(body.endpoint);
  const existing = await readSubscription(env, key);
  if (!existing) return json({ ok: false, reason: 'subscription not found' }, env, 404);

  existing.lastProgressDate = body.dateKey;
  existing.todayMl = Number(body.todayMl || 0);
  existing.timezone = body.timezone || existing.timezone || 'UTC';
  existing.updatedAt = new Date().toISOString();
  await env.WATER_REMINDERS.put(key, JSON.stringify(existing));

  return json({ ok: true }, env);
}

async function handleDebug(env) {
  const keys = await env.WATER_REMINDERS.list({ prefix: SUBSCRIPTION_PREFIX });
  const lastEvent = await env.WATER_REMINDERS.get(DEBUG_KEY, 'json');
  return json({ subscriptionCount: keys.keys.length, keys: keys.keys.map((key) => key.name), lastEvent }, env);
}

async function writeDebug(env, data) {
  await env.WATER_REMINDERS.put(DEBUG_KEY, JSON.stringify({
    ...data,
    at: new Date().toISOString()
  }));
}

async function handleUnsubscribe(request, env) {
  const body = await request.json();
  if (!body.endpoint) return json({ error: 'endpoint is required' }, env, 400);

  await env.WATER_REMINDERS.delete(await subscriptionKey(body.endpoint));
  return json({ ok: true }, env);
}

async function sendScheduledReminders(env, date) {
  let cursor;
  do {
    const listed = await env.WATER_REMINDERS.list({ prefix: SUBSCRIPTION_PREFIX, cursor });
    cursor = listed.cursor;
    await Promise.all(listed.keys.map((key) => sendReminderForKey(env, key.name, date)));
  } while (cursor);
}

async function sendReminderForKey(env, key, date) {
  const record = await readSubscription(env, key);
  if (!record) return;

  const context = getLocalReminderContext(date, record.timezone);
  if (!shouldSendReminder(record, context)) return;

  const response = await sendWebPush(record.subscription, env);
  if (response.status === 404 || response.status === 410) {
    await env.WATER_REMINDERS.delete(key);
  }
}

async function sendWebPush(subscription, env) {
  const audience = new URL(subscription.endpoint).origin;
  const jwt = await createVapidJwt({
    audience,
    subject: env.VAPID_SUBJECT || 'mailto:water-quest@example.com',
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY
  });

  return fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      Authorization: `vapid t=${jwt}, k=${env.VAPID_PUBLIC_KEY}`,
      TTL: '3600',
      Urgency: 'normal'
    }
  });
}

async function createVapidJwt({ audience, subject, publicKey, privateKey }) {
  const header = base64UrlEncode(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const claims = base64UrlEncode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: subject
  }));
  const token = `${header}.${claims}`;

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    vapidPrivateJwk(privateKey, publicKey),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(token)
  );

  return `${token}.${base64UrlEncode(signature)}`;
}

function vapidPrivateJwk(privateKey, publicKey) {
  const publicBytes = base64UrlDecode(publicKey);
  if (publicBytes[0] !== 0x04 || publicBytes.length !== 65) {
    throw new Error('VAPID public key must be an uncompressed P-256 key');
  }

  return {
    kty: 'EC',
    crv: 'P-256',
    d: privateKey,
    x: base64UrlEncode(publicBytes.slice(1, 33)),
    y: base64UrlEncode(publicBytes.slice(33, 65)),
    ext: true
  };
}

async function readSubscription(env, key) {
  const value = await env.WATER_REMINDERS.get(key);
  return value ? JSON.parse(value) : null;
}

async function subscriptionKey(endpoint) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  return `${SUBSCRIPTION_PREFIX}${base64UrlEncode(digest)}`;
}

function validateSubscription(subscription) {
  if (!subscription?.endpoint) {
    throw new Error('subscription.endpoint is required');
  }
}

function json(data, env, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(env),
      'Content-Type': 'application/json'
    }
  });
}

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function base64UrlEncode(input) {
  const bytes = typeof input === 'string'
    ? new TextEncoder().encode(input)
    : new Uint8Array(input);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function base64UrlDecode(value) {
  const padded = `${value}${'='.repeat((4 - (value.length % 4)) % 4)}`;
  const binary = atob(padded.replaceAll('-', '+').replaceAll('_', '/'));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
