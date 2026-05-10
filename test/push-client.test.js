import test from 'node:test';
import assert from 'node:assert/strict';

import { ensurePushSubscription } from '../src/push-client.js';

test('reuses an existing push subscription before creating a new one', async () => {
  global.localStorage = memoryStorage();
  const existing = {
    endpoint: 'https://push.example/existing',
    options: { applicationServerKey: Uint8Array.from([1, 2, 3]).buffer }
  };
  let subscribeCalled = false;
  const registration = {
    pushManager: {
      async getSubscription() {
        return existing;
      },
      async subscribe() {
        subscribeCalled = true;
        return { endpoint: 'https://push.example/new' };
      }
    }
  };

  const subscription = await ensurePushSubscription(registration, 'AQID');

  assert.equal(subscription, existing);
  assert.equal(subscribeCalled, false);
});

test('creates a push subscription when none exists', async () => {
  global.localStorage = memoryStorage();
  const created = { endpoint: 'https://push.example/new' };
  const registration = {
    pushManager: {
      async getSubscription() {
        return null;
      },
      async subscribe(options) {
        assert.equal(options.userVisibleOnly, true);
        return created;
      }
    }
  };

  const subscription = await ensurePushSubscription(registration, 'BAKE_KEY');

  assert.equal(subscription, created);
});

test('replaces an existing push subscription when the VAPID key changed', async () => {
  global.localStorage = memoryStorage();
  let unsubscribed = false;
  const created = { endpoint: 'https://push.example/new' };
  const registration = {
    pushManager: {
      async getSubscription() {
        return {
          endpoint: 'https://push.example/old',
          options: { applicationServerKey: Uint8Array.from([1, 2, 3]).buffer },
          async unsubscribe() {
            unsubscribed = true;
            return true;
          }
        };
      },
      async subscribe() {
        return created;
      }
    }
  };

  const subscription = await ensurePushSubscription(registration, 'BAQE');

  assert.equal(unsubscribed, true);
  assert.equal(subscription, created);
});

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}
