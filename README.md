# Water Quest

PWA счетчик воды для iPhone: выбираемая дневная цель 3 / 3.5 / 4 литра, быстрые добавления 300/400/500 мл, история в `localStorage`, серия успешных дней, промежуточная победа за 7 дней подряд и суперкубок за 30 дней подряд.

Production URL:

```text
https://egorevna.github.io/water-quest/
```

Worker URL:

```text
https://water-quest-push.egorevna-water.workers.dev
```

## Current Checkpoint

Detailed checkpoint files:

- `PROJECT_STATE.md`: current facts, working state, known gaps, blocker, next step.
- `TODO.md`: immediate and follow-up tasks.
- `ARCHITECTURE.md`: frontend, Worker, KV, and data flow.
- `CHANGELOG.md`: project history.

Current main blocker: iPhone push delivery is not yet confirmed after subscription registration. Worker `/debug` reports one subscription and latest progress, but the next hourly push still needs to be observed.

Temporary diagnostic endpoint:

```text
https://water-quest-push.egorevna-water.workers.dev/debug
```

Remove or protect this endpoint after push delivery is confirmed.

## Локальный запуск

```bash
npm run serve
```

Открыть:

```text
http://localhost:4173/
```

## Публикация на GitHub Pages

1. Создай пустой репозиторий на GitHub, например `water-quest`.
2. В этой папке выполни:

```bash
git remote add origin https://github.com/YOUR_USERNAME/water-quest.git
git branch -M main
git push -u origin main
```

3. На GitHub открой `Settings` -> `Pages`.
4. В `Build and deployment` выбери:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
5. Нажми `Save`.

Через минуту приложение будет доступно по адресу:

```text
https://YOUR_USERNAME.github.io/water-quest/
```

На iPhone открой этот адрес в Safari: `Поделиться` -> `На экран "Домой"` -> `Добавить`.

## Push-напоминания через Cloudflare Workers

Пуши работают только для PWA, добавленного на экран Домой iPhone. Напоминание отправляется каждый час с 07:00 до 21:00 по локальному времени телефона и останавливается на текущий день после выбранной дневной цели.

Приложение закрыто инвайт-кодом. Сам сайт на GitHub Pages остаётся публичным технически, но интерфейс и push-подписка требуют код, который хранится в Cloudflare Worker secret `INVITE_CODE`.

### 1. Сгенерировать VAPID-ключи

```bash
npm run vapid
```

Сохрани оба значения:

```text
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

### 2. Подготовить Wrangler config

```bash
cp workers/wrangler.toml.example wrangler.toml
```

В `wrangler.toml` замени:

```text
PASTE_PUBLIC_KEY_HERE
```

на `VAPID_PUBLIC_KEY`.

### 3. Создать KV namespace

```bash
npx wrangler login
npx wrangler kv namespace create WATER_REMINDERS
```

Wrangler покажет `id`. Вставь его в `wrangler.toml` вместо:

```text
PASTE_KV_NAMESPACE_ID_HERE
```

### 4. Добавить приватный ключ как secret

```bash
npx wrangler secret put VAPID_PRIVATE_KEY
```

Когда спросит значение, вставь `VAPID_PRIVATE_KEY`.

Добавь инвайт-код:

```bash
npx wrangler secret put INVITE_CODE
```

Когда спросит значение, введи код, которым будут пользоваться допущенные люди. Не коммить этот код в репозиторий.

### 5. Задеплоить Worker

```bash
npx wrangler deploy
```

Если Cloudflare выдаст URL не `https://water-quest-push.egorevna.workers.dev`, обнови `src/push-config.js`:

```js
export const PUSH_WORKER_URL = 'https://ТВОЙ_WORKER_URL';
```

Потом запушь изменения:

```bash
git add .
git commit -m "feat: add push reminders"
git push
```

### 6. Включить пуши на iPhone

1. Открой установленный `Water Quest` с экрана Домой.
2. Нажми `Включить` в блоке `Пуши`.
3. Разреши уведомления.

Если открыть сайт просто в Safari, iPhone не даст включить Web Push. Нужно именно приложение с экрана Домой.

## Verification

Run local tests:

```bash
npm test
```

Run syntax checks for key JavaScript files:

```bash
node --check app.js
node --check sw.js
node --check src/push-client.js
node --check workers/push-worker.js
```

## Current Known Status

Works:

- Water tracking and local history.
- Installed PWA shell and offline cache.
- Invite code validation.
- Push subscription/progress sync path as observed by Worker `/debug`.

Not yet proven:

- Actual scheduled iPhone notification delivery from Cloudflare cron.
- Push stop after syncing the selected daily goal.

Next step:

Wait for the next top-of-hour cron while `todayMl < 4000`. If no push arrives, add delivery-result logging around `sendWebPush()` in `workers/push-worker.js`.
