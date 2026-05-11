export const DAILY_GOAL_OPTIONS_ML = [3000, 3500, 4000];
export const DAILY_GOAL_ML = 4000;
export const WEEK_STREAK_DAYS = 7;
export const SUPER_CUP_DAYS = 30;

export function createEmptyState() {
  return { days: {} };
}

export function getDay(state, dateKey) {
  return state.days?.[dateKey] ?? { totalMl: 0, additions: [] };
}

export function addIntake(state, dateKey, amountMl) {
  const day = getDay(state, dateKey);
  return {
    ...state,
    days: {
      ...state.days,
      [dateKey]: {
        totalMl: day.totalMl + amountMl,
        additions: [...day.additions, amountMl]
      }
    }
  };
}

export function undoLastIntake(state, dateKey) {
  const day = getDay(state, dateKey);
  if (day.additions.length === 0) {
    return state;
  }

  const additions = day.additions.slice(0, -1);
  const removed = day.additions.at(-1);
  return {
    ...state,
    days: {
      ...state.days,
      [dateKey]: {
        totalMl: Math.max(0, day.totalMl - removed),
        additions
      }
    }
  };
}

export function isSuccessfulDay(day, dailyGoalMl = DAILY_GOAL_ML) {
  return day.totalMl >= dailyGoalMl;
}

export function buildSummary(state, todayKey = toDateKey(new Date()), dailyGoalMl = DAILY_GOAL_ML) {
  const today = getDay(state, todayKey);
  const currentStreak = countCurrentStreak(state, todayKey, dailyGoalMl);
  const bestStreak = countBestStreak(state, dailyGoalMl);
  const todayMl = today.totalMl;
  const todayPercent = Math.min(100, Math.round((todayMl / dailyGoalMl) * 100));

  return {
    dailyGoalMl,
    todayMl,
    todayLiters: todayMl / 1000,
    todayPercent,
    remainingMl: Math.max(0, dailyGoalMl - todayMl),
    currentStreak,
    bestStreak,
    weekProgress: Math.min(WEEK_STREAK_DAYS, currentStreak),
    monthProgress: Math.min(SUPER_CUP_DAYS, currentStreak),
    hasDailyVictory: isSuccessfulDay(today, dailyGoalMl),
    hasWeeklyVictory: currentStreak >= WEEK_STREAK_DAYS,
    hasSuperCup: currentStreak >= SUPER_CUP_DAYS
  };
}

export function getRecentDays(state, todayKey = toDateKey(new Date()), count = 30, dailyGoalMl = DAILY_GOAL_ML) {
  const dates = [];
  let cursor = parseDateKey(todayKey);
  for (let index = 0; index < count; index += 1) {
    const dateKey = toDateKey(cursor);
    const day = getDay(state, dateKey);
    dates.push({
      dateKey,
      totalMl: day.totalMl,
      successful: isSuccessfulDay(day, dailyGoalMl)
    });
    cursor = addDays(cursor, -1);
  }
  return dates;
}

export function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function countCurrentStreak(state, todayKey, dailyGoalMl) {
  let streak = 0;
  let cursor = parseDateKey(todayKey);

  while (isSuccessfulDay(getDay(state, toDateKey(cursor)), dailyGoalMl)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function countBestStreak(state, dailyGoalMl) {
  const successfulDates = Object.keys(state.days ?? {})
    .filter((dateKey) => isSuccessfulDay(getDay(state, dateKey), dailyGoalMl))
    .sort();

  let best = 0;
  let current = 0;
  let previous = null;

  for (const dateKey of successfulDates) {
    const date = parseDateKey(dateKey);
    current = previous && daysBetween(previous, date) === 1 ? current + 1 : 1;
    best = Math.max(best, current);
    previous = date;
  }

  return best;
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function daysBetween(left, right) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((right - left) / msPerDay);
}
