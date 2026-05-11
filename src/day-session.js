export function createDaySession(getCurrentDateKey) {
  let todayKey = getCurrentDateKey();

  return {
    getTodayKey() {
      return todayKey;
    },
    refreshTodayKey() {
      const nextTodayKey = getCurrentDateKey();
      const previousTodayKey = todayKey;
      const changed = nextTodayKey !== previousTodayKey;
      todayKey = nextTodayKey;

      return {
        changed,
        previousTodayKey,
        todayKey
      };
    }
  };
}
