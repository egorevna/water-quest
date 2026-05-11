# Changelog

## 2026-05-11

### Fixed

- Added versioned `styles.css` and `app.js` URLs to prevent installed iPhone PWAs from mixing a fresh HTML shell with stale cached CSS/JS.

### Added

- Added a daily goal selector with 3 l, 3.5 l, and 4 l options.
- Added localStorage persistence for the selected goal under `water-quest-daily-goal-ml-v1`.
- Added Worker progress sync for `dailyGoalMl`, so reminders stop at the selected goal.

### Changed

- Recalculated today percent, remaining water, daily victory, streaks, and last-30-days success markers from the selected goal.
- Updated service worker cache to `water-quest-v6` so installed PWAs pick up the goal selector assets.

## 2026-05-10

### Fixed

- Fixed active-day rollover in an installed PWA that stays open across midnight. The app now refreshes the current date on focus, visibility return, every minute, and before water/reminder actions, so a new day starts at 0 ml without reinstalling or manually clearing data.

### Added

- Created Water Quest PWA for iPhone.
- Added 4 liter daily target.
- Added quick add buttons: 300 ml, 400 ml, 500 ml.
- Added undo for last water addition.
- Added daily victory, 7-day victory, and 30-day super cup.
- Added current streak, best streak, and last 30 days stats.
- Added PWA manifest, icon, and service worker.
- Published static app through GitHub Pages.
- Added Cloudflare Worker for Web Push reminders.
- Added Cloudflare KV storage for push subscriptions.
- Added VAPID key generation script.
- Added hourly reminder schedule from 07:00 through 21:00.
- Added stop condition after 4000 ml for the current local day.
- Added invite gate backed by Cloudflare secret `INVITE_CODE`.
- Added tests for water logic, reminder rules, invite logic, and push subscription reuse.
- Added temporary Worker `/debug` endpoint for push diagnostics.

### Changed

- Updated service worker cache from cache-first to network-first fallback so installed PWAs refresh changed assets more reliably.
- Updated push client to reuse existing `PushSubscription` before creating a new one.
- Updated Cloudflare Worker URL in `src/push-config.js` to `https://water-quest-push.egorevna-water.workers.dev`.

### Fixed

- Fixed stale installed PWA assets after GitHub Pages updates by bumping cache versions and changing fetch strategy.
- Fixed likely push registration issue where an existing iOS subscription was not being sent to the Worker.

### Known Issues

- Actual iPhone push delivery has not yet been confirmed after subscription registration.
- Worker `/debug` sees one subscription, while `wrangler kv key list --binding WATER_REMINDERS` has returned an empty list. Needs investigation.
- Temporary `/debug` endpoint is public until removed or protected.
