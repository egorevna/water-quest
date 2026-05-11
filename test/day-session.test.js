import test from 'node:test';
import assert from 'node:assert/strict';

import { createDaySession } from '../src/day-session.js';

test('keeps the same day key before midnight changes', () => {
  const session = createDaySession(() => '2026-05-10');

  const result = session.refreshTodayKey();

  assert.equal(result.changed, false);
  assert.equal(result.todayKey, '2026-05-10');
});

test('updates the active day key after midnight', () => {
  let currentDateKey = '2026-05-10';
  const session = createDaySession(() => currentDateKey);
  currentDateKey = '2026-05-11';

  const result = session.refreshTodayKey();

  assert.equal(result.changed, true);
  assert.equal(result.previousTodayKey, '2026-05-10');
  assert.equal(result.todayKey, '2026-05-11');
  assert.equal(session.getTodayKey(), '2026-05-11');
});
