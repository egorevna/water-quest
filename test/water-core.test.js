import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DAILY_GOAL_ML,
  addIntake,
  buildSummary,
  createEmptyState,
  getDay,
  isSuccessfulDay,
  undoLastIntake
} from '../src/water-core.js';

test('adds intake to the selected date and keeps an addition history', () => {
  const state = createEmptyState();
  const updated = addIntake(state, '2026-05-10', 500);

  assert.equal(getDay(updated, '2026-05-10').totalMl, 500);
  assert.deepEqual(getDay(updated, '2026-05-10').additions, [500]);
  assert.equal(getDay(state, '2026-05-10').totalMl, 0);
});

test('undo removes only the latest intake for that date', () => {
  const state = addIntake(addIntake(createEmptyState(), '2026-05-10', 300), '2026-05-10', 500);
  const updated = undoLastIntake(state, '2026-05-10');

  assert.equal(getDay(updated, '2026-05-10').totalMl, 300);
  assert.deepEqual(getDay(updated, '2026-05-10').additions, [300]);
});

test('marks a day successful only at four liters or more', () => {
  assert.equal(isSuccessfulDay({ totalMl: DAILY_GOAL_ML - 1, additions: [] }), false);
  assert.equal(isSuccessfulDay({ totalMl: DAILY_GOAL_ML, additions: [] }), true);
});

test('marks a day successful against a custom daily goal', () => {
  assert.equal(isSuccessfulDay({ totalMl: 3499, additions: [] }, 3500), false);
  assert.equal(isSuccessfulDay({ totalMl: 3500, additions: [] }, 3500), true);
});

test('recalculates today percent and victory against a custom daily goal', () => {
  const state = addIntake(createEmptyState(), '2026-05-11', 3000);

  const summary = buildSummary(state, '2026-05-11', 3000);

  assert.equal(summary.todayPercent, 100);
  assert.equal(summary.remainingMl, 0);
  assert.equal(summary.dailyGoalMl, 3000);
  assert.equal(summary.hasDailyVictory, true);
});

test('changing the daily goal recalculates the same intake without changing history', () => {
  const state = addIntake(createEmptyState(), '2026-05-11', 3000);

  const fourLiterSummary = buildSummary(state, '2026-05-11', 4000);
  const threeLiterSummary = buildSummary(state, '2026-05-11', 3000);

  assert.equal(getDay(state, '2026-05-11').totalMl, 3000);
  assert.equal(fourLiterSummary.todayPercent, 75);
  assert.equal(fourLiterSummary.hasDailyVictory, false);
  assert.equal(threeLiterSummary.todayPercent, 100);
  assert.equal(threeLiterSummary.hasDailyVictory, true);
});

test('builds streak, best streak, and reward progress from consecutive successful days', () => {
  let state = createEmptyState();
  for (const date of ['2026-05-04', '2026-05-05', '2026-05-06', '2026-05-07', '2026-05-08', '2026-05-09', '2026-05-10']) {
    state = addIntake(state, date, DAILY_GOAL_ML);
  }
  state = addIntake(state, '2026-05-02', DAILY_GOAL_ML);

  const summary = buildSummary(state, '2026-05-10');

  assert.equal(summary.todayMl, DAILY_GOAL_ML);
  assert.equal(summary.currentStreak, 7);
  assert.equal(summary.bestStreak, 7);
  assert.equal(summary.weekProgress, 7);
  assert.equal(summary.monthProgress, 7);
  assert.equal(summary.hasDailyVictory, true);
  assert.equal(summary.hasWeeklyVictory, true);
  assert.equal(summary.hasSuperCup, false);
});

test('super cup appears after any thirty successful days in a row', () => {
  let state = createEmptyState();
  for (let day = 1; day <= 30; day += 1) {
    state = addIntake(state, `2026-04-${String(day).padStart(2, '0')}`, DAILY_GOAL_ML);
  }

  const summary = buildSummary(state, '2026-04-30');

  assert.equal(summary.currentStreak, 30);
  assert.equal(summary.monthProgress, 30);
  assert.equal(summary.hasSuperCup, true);
});

test('a missed day breaks the current streak but preserves the best streak', () => {
  let state = createEmptyState();
  for (const date of ['2026-05-01', '2026-05-02', '2026-05-03', '2026-05-05']) {
    state = addIntake(state, date, DAILY_GOAL_ML);
  }

  const summary = buildSummary(state, '2026-05-05');

  assert.equal(summary.currentStreak, 1);
  assert.equal(summary.bestStreak, 3);
  assert.equal(summary.weekProgress, 1);
});
