import {
  addIntake,
  buildSummary,
  createEmptyState,
  getDay,
  getRecentDays,
  toDateKey,
  undoLastIntake
} from './src/water-core.js';

const STORAGE_KEY = 'water-quest-state-v1';
const todayKey = toDateKey(new Date());

let state = loadState();

const elements = {
  rewardBanner: document.querySelector('#reward-banner'),
  waterLevel: document.querySelector('#water-level'),
  todayPercent: document.querySelector('#today-percent'),
  todayLiters: document.querySelector('#today-liters'),
  currentStreak: document.querySelector('#current-streak'),
  bestStreak: document.querySelector('#best-streak'),
  weekProgress: document.querySelector('#week-progress'),
  monthProgress: document.querySelector('#month-progress'),
  weekBar: document.querySelector('#week-bar'),
  monthBar: document.querySelector('#month-bar'),
  undoButton: document.querySelector('#undo-button'),
  statsToggle: document.querySelector('#stats-toggle'),
  statsPanel: document.querySelector('#stats-panel'),
  daysGrid: document.querySelector('#days-grid')
};

document.querySelectorAll('[data-amount]').forEach((button) => {
  button.addEventListener('click', () => {
    state = addIntake(state, todayKey, Number(button.dataset.amount));
    saveState(state);
    render();
  });
});

elements.undoButton.addEventListener('click', () => {
  state = undoLastIntake(state, todayKey);
  saveState(state);
  render();
});

elements.statsToggle.addEventListener('click', () => {
  elements.statsPanel.classList.toggle('hidden');
});

render();
registerServiceWorker();

function render() {
  const summary = buildSummary(state, todayKey);
  const today = getDay(state, todayKey);

  elements.waterLevel.style.height = `${summary.todayPercent}%`;
  elements.todayPercent.textContent = `${summary.todayPercent}%`;
  elements.todayLiters.textContent = `${formatLiters(summary.todayMl)} / 4 л`;
  elements.currentStreak.textContent = pluralDays(summary.currentStreak);
  elements.bestStreak.textContent = String(summary.bestStreak);
  elements.weekProgress.textContent = `${summary.weekProgress}/7`;
  elements.monthProgress.textContent = `${summary.monthProgress}/30`;
  elements.weekBar.style.width = `${(summary.weekProgress / 7) * 100}%`;
  elements.monthBar.style.width = `${(summary.monthProgress / 30) * 100}%`;
  elements.undoButton.disabled = today.additions.length === 0;

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
    elements.rewardBanner.textContent = 'Победа дня! 4 литра взяты. Завтра серия продолжится.';
    return;
  }

  elements.rewardBanner.textContent = `До победы дня осталось ${summary.remainingMl} мл.`;
}

function renderRecentDays() {
  elements.daysGrid.replaceChildren(
    ...getRecentDays(state, todayKey, 30).reverse().map((day) => {
      const node = document.createElement('div');
      node.className = `day-dot${day.successful ? ' success' : ''}${day.dateKey === todayKey ? ' today' : ''}`;
      node.title = `${day.dateKey}: ${formatLiters(day.totalMl)}`;
      node.textContent = day.dateKey.slice(-2);
      return node;
    })
  );
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
