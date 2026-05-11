import {
  DAILY_GOAL_ML,
  DAILY_GOAL_OPTIONS_ML,
  addIntake,
  buildSummary,
  createEmptyState,
  getDay,
  getRecentDays,
  toDateKey,
  undoLastIntake
} from './src/water-core.js';
import { createDaySession } from './src/day-session.js';
import {
  disableReminders,
  enableReminders,
  hasSavedInviteCode,
  getReminderStatus,
  syncReminderProgress,
  validateInviteCode
} from './src/push-client.js';

const STORAGE_KEY = 'water-quest-state-v1';
const GOAL_STORAGE_KEY = 'water-quest-daily-goal-ml-v1';
const daySession = createDaySession(() => toDateKey(new Date()));

let state = loadState();
let dailyGoalMl = loadDailyGoalMl();

const elements = {
  inviteGate: document.querySelector('#invite-gate'),
  inviteForm: document.querySelector('#invite-form'),
  inviteCode: document.querySelector('#invite-code'),
  inviteStatus: document.querySelector('#invite-status'),
  rewardBanner: document.querySelector('#reward-banner'),
  waterLevel: document.querySelector('#water-level'),
  todayPercent: document.querySelector('#today-percent'),
  todayLiters: document.querySelector('#today-liters'),
  goalButtons: document.querySelectorAll('[data-goal]'),
  currentStreak: document.querySelector('#current-streak'),
  bestStreak: document.querySelector('#best-streak'),
  weekProgress: document.querySelector('#week-progress'),
  monthProgress: document.querySelector('#month-progress'),
  weekBar: document.querySelector('#week-bar'),
  monthBar: document.querySelector('#month-bar'),
  undoButton: document.querySelector('#undo-button'),
  reminderStatus: document.querySelector('#reminder-status'),
  enableReminders: document.querySelector('#enable-reminders'),
  disableReminders: document.querySelector('#disable-reminders'),
  statsToggle: document.querySelector('#stats-toggle'),
  statsPanel: document.querySelector('#stats-panel'),
  daysGrid: document.querySelector('#days-grid')
};

elements.inviteForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  elements.inviteStatus.textContent = 'Проверяю код...';
  try {
    const result = await validateInviteCode(elements.inviteCode.value);
    elements.inviteStatus.textContent = result.message;
    if (result.ok) {
      elements.inviteGate.classList.add('hidden');
      await updateReminderStatus();
    }
  } catch (error) {
    elements.inviteStatus.textContent = `Не получилось проверить код: ${error.message}`;
  }
});

elements.goalButtons.forEach((button) => {
  button.addEventListener('click', () => {
    dailyGoalMl = Number(button.dataset.goal);
    saveDailyGoalMl(dailyGoalMl);
    render();
    syncProgress();
  });
});

document.querySelectorAll('[data-amount]').forEach((button) => {
  button.addEventListener('click', () => {
    refreshDayIfNeeded();
    const todayKey = daySession.getTodayKey();
    state = addIntake(state, todayKey, Number(button.dataset.amount));
    saveState(state);
    render();
    syncProgress();
  });
});

elements.undoButton.addEventListener('click', () => {
  refreshDayIfNeeded();
  const todayKey = daySession.getTodayKey();
  state = undoLastIntake(state, todayKey);
  saveState(state);
  render();
  syncProgress();
});

elements.statsToggle.addEventListener('click', () => {
  elements.statsPanel.classList.toggle('hidden');
});

elements.enableReminders.addEventListener('click', async () => {
  refreshDayIfNeeded();
  await updateReminderStatus('Запрашиваю разрешение...');
  try {
    const result = await enableReminders(getProgressPayload());
    await updateReminderStatus(result.message);
    if (result.ok) await syncProgress();
  } catch (error) {
    await updateReminderStatus(`Не получилось включить: ${error.message}`);
  }
});

elements.disableReminders.addEventListener('click', async () => {
  try {
    const result = await disableReminders();
    await updateReminderStatus(result.message);
  } catch (error) {
    await updateReminderStatus(`Не получилось выключить: ${error.message}`);
  }
});

render();
registerServiceWorker();
updateReminderStatus();
renderInviteGate();
window.addEventListener('focus', refreshDayIfNeeded);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refreshDayIfNeeded();
});
setInterval(refreshDayIfNeeded, 60 * 1000);

function render() {
  const todayKey = daySession.getTodayKey();
  const summary = buildSummary(state, todayKey, dailyGoalMl);
  const today = getDay(state, todayKey);

  elements.waterLevel.style.height = `${summary.todayPercent}%`;
  elements.todayPercent.textContent = `${summary.todayPercent}%`;
  elements.todayLiters.textContent = `${formatLiters(summary.todayMl)} / ${formatLiters(summary.dailyGoalMl)}`;
  elements.currentStreak.textContent = pluralDays(summary.currentStreak);
  elements.bestStreak.textContent = String(summary.bestStreak);
  elements.weekProgress.textContent = `${summary.weekProgress}/7`;
  elements.monthProgress.textContent = `${summary.monthProgress}/30`;
  elements.weekBar.style.width = `${(summary.weekProgress / 7) * 100}%`;
  elements.monthBar.style.width = `${(summary.monthProgress / 30) * 100}%`;
  elements.undoButton.disabled = today.additions.length === 0;

  renderGoalButtons();
  renderReward(summary);
  renderRecentDays();
}

function renderReward(summary) {
  elements.rewardBanner.className = 'reward-banner';

  if (summary.hasSuperCup) {
    elements.rewardBanner.classList.add('super');
    elements.rewardBanner.textContent = 'Суперкубок! 30 дней подряд без сбоя. Абсолютная водная легенда.';
    return;
  }

  if (summary.hasWeeklyVictory) {
    elements.rewardBanner.classList.add('week');
    elements.rewardBanner.textContent = 'Промежуточная победа! 7 успешных дней подряд уже в кармане.';
    return;
  }

  if (summary.hasDailyVictory) {
    elements.rewardBanner.classList.add('daily');
    elements.rewardBanner.textContent = `Победа дня! ${formatLiters(summary.dailyGoalMl)} взяты. Завтра серия продолжится.`;
    return;
  }

  elements.rewardBanner.textContent = `До победы дня осталось ${summary.remainingMl} мл.`;
}

function renderRecentDays() {
  const todayKey = daySession.getTodayKey();
  elements.daysGrid.replaceChildren(
    ...getRecentDays(state, todayKey, 30, dailyGoalMl).reverse().map((day) => {
      const node = document.createElement('div');
      node.className = `day-dot${day.successful ? ' success' : ''}${day.dateKey === todayKey ? ' today' : ''}`;
      node.title = `${day.dateKey}: ${formatLiters(day.totalMl)}`;
      node.textContent = day.dateKey.slice(-2);
      return node;
    })
  );
}

function getProgressPayload() {
  const todayKey = daySession.getTodayKey();
  return {
    dateKey: todayKey,
    todayMl: getDay(state, todayKey).totalMl,
    dailyGoalMl
  };
}

function refreshDayIfNeeded() {
  const result = daySession.refreshTodayKey();
  if (!result.changed) return false;

  render();
  syncProgress();
  return true;
}

async function syncProgress() {
  try {
    await syncReminderProgress(getProgressPayload());
  } catch {
    await updateReminderStatus('Прогресс сохранён на телефоне, но пуш-сервер сейчас недоступен.');
  }
}

async function updateReminderStatus(message) {
  elements.reminderStatus.textContent = message || await getReminderStatus();
}

function renderInviteGate() {
  elements.inviteGate.classList.toggle('hidden', hasSavedInviteCode());
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed && typeof parsed === 'object' && parsed.days) {
      return parsed;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return createEmptyState();
}

function saveState(nextState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

function loadDailyGoalMl() {
  const savedGoalMl = Number(localStorage.getItem(GOAL_STORAGE_KEY));
  return DAILY_GOAL_OPTIONS_ML.includes(savedGoalMl) ? savedGoalMl : DAILY_GOAL_ML;
}

function saveDailyGoalMl(nextGoalMl) {
  localStorage.setItem(GOAL_STORAGE_KEY, String(nextGoalMl));
}

function renderGoalButtons() {
  elements.goalButtons.forEach((button) => {
    const selected = Number(button.dataset.goal) === dailyGoalMl;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

function formatLiters(amountMl) {
  return `${(amountMl / 1000).toFixed(1)} л`;
}

function pluralDays(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} день`;
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return `${count} дня`;
  return `${count} дней`;
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
  }
}
