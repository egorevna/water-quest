# Water Quest Push Upgrade Design

## Goal

Add hourly iPhone PWA push reminders using Cloudflare Workers on the free tier.

## Behavior

- The installed PWA asks the user to enable reminders from a direct button tap.
- Reminders are sent once per hour from 07:00 through 21:00 in the user's local timezone.
- Reminders stop for the current local day once the app has synced at least 4000 ml to the Worker.
- The next local day starts at 0 ml until the PWA syncs new progress.
- Notifications are generic and sent without an encrypted payload. The service worker renders the notification text locally.

## Architecture

- The PWA fetches a VAPID public key from the Worker and subscribes through `PushManager`.
- The PWA stores the push subscription endpoint locally and sends progress updates to the Worker after add/undo/render changes.
- The Worker stores subscriptions in Cloudflare KV under `sub:<endpoint hash>`.
- A Cloudflare Cron Trigger runs hourly and sends a Web Push request to each active subscription that is within reminder hours and below the daily goal.
- The Worker removes expired subscriptions when push endpoints respond with 404 or 410.

## Deployment

The GitHub Pages app remains static. Cloudflare Worker deployment requires a Cloudflare account, a KV namespace, a generated VAPID key pair, and one secret named `VAPID_PRIVATE_KEY`.
