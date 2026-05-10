import test from 'node:test';
import assert from 'node:assert/strict';

import { isInviteCodePresent, normalizeInviteCode } from '../src/invite-core.js';

test('normalizes invite codes before sending them to the worker', () => {
  assert.equal(normalizeInviteCode('  aqua-777  '), 'aqua-777');
});

test('requires at least four characters for an invite code', () => {
  assert.equal(isInviteCodePresent('abc'), false);
  assert.equal(isInviteCodePresent('abcd'), true);
});
