# Water Quest Push Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Cloudflare Worker backed hourly push reminders for the iPhone PWA.

**Architecture:** Browser code handles permission, PushManager subscription, and progress sync. Worker code handles subscription storage, hourly cron filtering, VAPID authentication, and push delivery. Shared reminder-window logic is kept pure and tested with Node.

**Tech Stack:** Vanilla JavaScript, Service Worker Push API, Cloudflare Workers, Cloudflare KV, Cron Triggers, VAPID Web Push.

---

### Task 1: Reminder Rules

**Files:**
- Create: `src/reminder-rules.js`
- Create: `test/reminder-rules.test.js`

- [ ] Test that reminders are allowed from 07:00 through 21:00 local time.
- [ ] Test that reminders stop when today's synced total is at least 4000 ml.
- [ ] Test that a stale progress date is treated as 0 ml for a new day.
- [ ] Implement `shouldSendReminder`.

### Task 2: Push Worker

**Files:**
- Create: `workers/push-worker.js`
- Create: `workers/wrangler.toml.example`
- Create: `scripts/generate-vapid-keys.mjs`
- Modify: `package.json`

- [ ] Implement CORS HTTP endpoints: `/vapid-public-key`, `/subscribe`, `/progress`, `/unsubscribe`.
- [ ] Implement hourly `scheduled()` handler.
- [ ] Implement no-payload Web Push send with VAPID JWT.
- [ ] Add a script for generating VAPID keys.

### Task 3: PWA Client

**Files:**
- Create: `src/push-client.js`
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `sw.js`

- [ ] Add reminder UI and status text.
- [ ] Subscribe/unsubscribe through the Worker.
- [ ] Sync progress after every water change.
- [ ] Show local notification from service worker `push`.

### Task 4: Docs And Verification

**Files:**
- Modify: `README.md`

- [ ] Document Cloudflare KV, secrets, worker deploy, GitHub Pages config, and iPhone enable flow.
- [ ] Run `npm test`.
- [ ] Run `node --check` for app, worker, and service worker files.
