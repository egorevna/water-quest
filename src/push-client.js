import { PUSH_WORKER_URL } from './push-config.js';

const PUSH_ENDPOINT_KEY = 'water-quest-push-endpoint-v1';

export function getPushAvailability() {
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  return { supported, standalone, configured: Boolean(PUSH_WORKER_URL) };
}

export async function enableReminders(progress) {
  const availability = getPushAvailability();
  if (!availability.configured) {
    return { ok: false, message: 'Worker URL пока не настроен.' };
  }
  if (!availability.supported) {
    return { ok: false, message: 'Этот браузер не поддерживает push.' };
  }
  if (!availability.standalone) {
    return { ok: false, message: 'Сначала добавь приложение на экран Домой и открой его оттуда.' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, message: 'Разрешение на уведомления не выдано.' };
  }

  const registration = await navigator.serviceWorker.ready;
  const { publicKey } = await requestJson('/vapid-public-key');
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey)
  });

  await postJson('/subscribe', {
    subscription: subscription.toJSON(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    progress
  });

  localStorage.setItem(PUSH_ENDPOINT_KEY, subscription.endpoint);
  return { ok: true, message: 'Напоминания включены: каждый час с 07:00 до 21:00.' };
}

export async function disableReminders() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  const endpoint = subscription?.endpoint || localStorage.getItem(PUSH_ENDPOINT_KEY);

  if (subscription) {
    await subscription.unsubscribe();
  }
  if (endpoint) {
    await postJson('/unsubscribe', { endpoint });
  }
  localStorage.removeItem(PUSH_ENDPOINT_KEY);

  return { ok: true, message: 'Напоминания выключены.' };
}

export async function syncReminderProgress(progress) {
  const endpoint = localStorage.getItem(PUSH_ENDPOINT_KEY);
  if (!endpoint || !PUSH_WORKER_URL) return;

  await postJson('/progress', {
    endpoint,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ...progress
  });
}

export async function getReminderStatus() {
  if (!getPushAvailability().supported) return 'Уведомления недоступны в этом браузере.';
  if (!getPushAvailability().standalone) return 'Для пушей открой приложение с экрана Домой.';
  if (Notification.permission === 'granted' && localStorage.getItem(PUSH_ENDPOINT_KEY)) {
    return 'Напоминания включены.';
  }
  return 'Напоминания можно включить.';
}

async function requestJson(path) {
  const response = await fetch(`${PUSH_WORKER_URL}${path}`);
  if (!response.ok) throw new Error(`Worker request failed: ${response.status}`);
  return response.json();
}

async function postJson(path, body) {
  const response = await fetch(`${PUSH_WORKER_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`Worker request failed: ${response.status}`);
  return response.json();
}

function urlBase64ToUint8Array(value) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replaceAll('-', '+').replaceAll('_', '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }
  return outputArray;
}
