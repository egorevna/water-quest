import test from 'node:test';
import assert from 'node:assert/strict';

import { ensurePushSubscription } from '../src/push-client.js';

test('reuses an existing push subscription before creating a new one', async () => {
  const existing = { endpoint: 'https://push.example/existing' };
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

  const subscription = await ensurePushSubscription(registration, 'BAKE_KEY');

  assert.equal(subscription, existing);
  assert.equal(subscribeCalled, false);
});

test('creates a push subscription when none exists', async () => {
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
