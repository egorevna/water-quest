# Architecture

## Overview

Water Quest is split into a static PWA frontend and a Cloudflare Worker backend.

```text
iPhone PWA
  -> GitHub Pages static assets
  -> localStorage for water history and invite state
  -> Service Worker for offline cache and push notification display
  -> Cloudflare Worker for invite validation, push subscription storage, progress sync, and scheduled sends
  -> Cloudflare KV for subscription records
```

## Frontend

Hosted at:

```text
https://egorevna.github.io/water-quest/
```

Important files:

- `index.html` defines the invite gate, water quest UI, reminder controls, and stats panels.
- `styles.css` contains the Game Victory visual system and responsive mobile layout.
- `app.js` wires UI events to water tracking and push reminder sync.
- `sw.js` caches app assets, handles `push`, and opens/focuses the app from notification clicks.
- `manifest.webmanifest` makes the app installable as a PWA.

## Local State

Water history is stored in browser/PWA `localStorage` under:

```text
water-quest-state-v1
```

The state shape is:

```js
{
  days: {
    "YYYY-MM-DD": {
      totalMl: 2100,
      additions: [500, 400, 300]
    }
  }
}
```

Invite and push client state:

- `water-quest-invite-v1`: accepted invite code stored locally.
- `water-quest-push-endpoint-v1`: saved PushSubscription endpoint.

## Domain Logic

Pure modules:

- `src/water-core.js`
  - adding intake;
  - undo;
  - daily victory;
  - current and best streak;
  - 7-day and 30-day progress;
  - recent-day stats.
- `src/reminder-rules.js`
  - reminder window from 07:00 through 21:00;
  - stop sending once current local day has 4000 ml;
  - treat stale progress from another date as 0 ml for the new day.
- `src/invite-core.js`
  - invite code trimming and minimum length check.
- `src/push-client.js`
  - invite validation;
  - PushManager subscription;
  - reuse existing subscriptions before creating new ones;
  - progress sync to Worker.

## Cloudflare Worker

Worker URL:

```text
https://water-quest-push.egorevna-water.workers.dev
```

Worker file:

```text
workers/push-worker.js
```

Endpoints:

- `GET /vapid-public-key`: returns VAPID public key.
- `POST /validate-invite`: validates invite code against secret `INVITE_CODE`.
- `POST /subscribe`: stores a valid PushSubscription in KV.
- `POST /progress`: updates `todayMl`, `dateKey`, and timezone for an endpoint.
- `POST /unsubscribe`: removes a subscription by endpoint.
- `GET /debug`: temporary diagnostic endpoint for subscription count and last event.

Cron:

```toml
[triggers]
crons = ["0 * * * *"]
```

The scheduled handler runs hourly. It lists `sub:` KV records, computes each subscription's local hour/date, checks `shouldSendReminder`, and sends a no-payload Web Push. The PWA service worker renders the notification text locally.

## Cloudflare KV

Binding:

```text
WATER_REMINDERS
```

Subscription keys:

```text
sub:<sha256 endpoint hash>
```

Diagnostic key:

```text
debug:last-event
```

Record fields include:

- `enabled`
- `subscription`
- `timezone`
- `quietStartHour`
- `quietEndHour`
- `dailyGoalMl`
- `lastProgressDate`
- `todayMl`
- `createdAt`
- `updatedAt`

## Security Notes

- GitHub Pages is public and cannot hide static app code.
- The app is gated by an invite code checked by the Worker.
- The invite protects push subscription and normal UI access from casual users, but it is not a full authentication system.
- Do not commit `wrangler.toml`, `.wrangler/`, `VAPID_PRIVATE_KEY`, or `INVITE_CODE`.
- Temporary `/debug` should be removed or protected after push delivery is confirmed.
