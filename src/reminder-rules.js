export const DEFAULT_REMINDER_START_HOUR = 7;
export const DEFAULT_REMINDER_END_HOUR = 21;

export function shouldSendReminder(subscription, context) {
  if (!subscription?.enabled) return false;

  const startHour = subscription.quietStartHour ?? DEFAULT_REMINDER_START_HOUR;
  const endHour = subscription.quietEndHour ?? DEFAULT_REMINDER_END_HOUR;
  if (context.localHour < startHour || context.localHour > endHour) return false;

  const dailyGoalMl = subscription.dailyGoalMl ?? 4000;
  const currentDayMl = subscription.lastProgressDate === context.localDateKey
    ? subscription.todayMl ?? 0
    : 0;

  return currentDayMl < dailyGoalMl;
}

export function getLocalReminderContext(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    localDateKey: `${values.year}-${values.month}-${values.day}`,
    localHour: Number(values.hour)
  };
}
