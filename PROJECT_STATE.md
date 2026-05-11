# Project State

Last updated: 2026-05-10

## Summary

Water Quest is a GitHub Pages hosted iPhone PWA for tracking daily water intake. The app stores water history locally on the device, awards daily/weekly/monthly progress, and has a Cloudflare Worker backend for hourly Web Push reminders.

## What Changed

- Built the core PWA:
  - 4 liter daily goal.
  - Quick add buttons for 300 ml, 400 ml, and 500 ml.
  - Undo last intake.
  - Last 30 days statistics.
  - Current streak, best streak, 7-day victory, and 30-day super cup.
- Published the app through GitHub Pages:
  - `https://egorevna.github.io/water-quest/`
- Added Cloudflare Worker push infrastructure:
  - Worker URL: `https://water-quest-push.egorevna-water.workers.dev`
  - KV namespace binding: `WATER_REMINDERS`
  - VAPID public key in `wrangler.toml`
  - VAPID private key stored as Cloudflare secret.
  - Invite code stored as Cloudflare secret `INVITE_CODE`.
- Added invite gate:
  - Public GitHub Pages site remains reachable.
  - App UI and push subscription require a valid invite code.
- Added temporary Worker diagnostics:
  - `GET /debug` returns subscription count and the last subscribe/progress event.

## What Works

- App UI renders on GitHub Pages.
- Installed PWA keeps water totals in `localStorage`.
- Closing or swiping the app out of memory does not reset data.
- Active day now refreshes after midnight without deleting history.
- Daily goal and streak logic are covered by tests.
- Invite code validation works against Cloudflare Worker.
- PWA can sync progress to Worker after invite and push enable flow.
- Worker `/debug` currently reports one subscription and the latest progress event:
  - `subscriptionCount: 1`
  - `dateKey: 2026-05-10`
  - `todayMl: 2100`

## What Does Not Work / Not Yet Proven

- Actual hourly push delivery to iPhone is not confirmed yet.
- Earlier 12:00 push did not arrive because KV had no subscription at that time.
- `npx wrangler kv key list --binding WATER_REMINDERS` returned `[]` even while Worker `/debug` reported one `sub:...` key. The Worker debug endpoint is the more relevant runtime evidence, but this mismatch still needs investigation.
- `/debug` is intentionally temporary and should not remain public long term.

## Current Main Blocker

Confirm that Cloudflare scheduled cron actually sends a Web Push notification to the registered iPhone at the next hourly run between 07:00 and 21:00 local device time.

## Next Concrete Step

Wait for the next top-of-hour cron run while today's synced total is below 4000 ml. If no push arrives within a few minutes after the hour, inspect Worker diagnostics/logs for the scheduled run and add delivery-result logging for `sendWebPush()` response status.

## Latest Bugfix Note

On 2026-05-11, the installed PWA did not reset the visible counter at the start of a new day because `app.js` previously computed `todayKey` once at module load. The fix introduced `src/day-session.js` and dynamic refresh hooks so the app switches from yesterday's key to today's key while preserving yesterday's history.
