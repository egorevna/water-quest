import test from 'node:test';
import assert from 'node:assert/strict';

import { shouldSendReminder } from '../src/reminder-rules.js';

const baseSubscription = {
  enabled: true,
  quietStartHour: 7,
  quietEndHour: 21,
  dailyGoalMl: 4000,
  lastProgressDate: '2026-05-10',
  todayMl: 0
};

test('allows reminders from 07:00 through 21:00 local time', () => {
  assert.equal(shouldSendReminder(baseSubscription, { localHour: 6, localDateKey: '2026-05-10' }), false);
  assert.equal(shouldSendReminder(baseSubscription, { localHour: 7, localDateKey: '2026-05-10' }), true);
  assert.equal(shouldSendReminder(baseSubscription, { localHour: 21, localDateKey: '2026-05-10' }), true);
  assert.equal(shouldSendReminder(baseSubscription, { localHour: 22, localDateKey: '2026-05-10' }), false);
});

test('stops reminders when the current day has reached four liters', () => {
  const subscription = { ...baseSubscription, todayMl: 4000 };

  assert.equal(shouldSendReminder(subscription, { localHour: 12, localDateKey: '2026-05-10' }), false);
});

test('treats stale progress from a previous date as zero for the new local day', () => {
  const subscription = { ...baseSubscription, lastProgressDate: '2026-05-09', todayMl: 4000 };

  assert.equal(shouldSendReminder(subscription, { localHour: 12, localDateKey: '2026-05-10' }), true);
});

test('does not send when reminders are disabled', () => {
  const subscription = { ...baseSubscription, enabled: false };

  assert.equal(shouldSendReminder(subscription, { localHour: 12, localDateKey: '2026-05-10' }), false);
});
