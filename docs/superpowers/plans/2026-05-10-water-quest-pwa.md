# Water Quest PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a localStorage-backed iPhone PWA for water tracking with daily, 7-day, and 30-day victories.

**Architecture:** Keep domain logic in `src/water-core.js` so streaks and totals can be tested without a browser. Use `app.js` for DOM rendering and persistence, `styles.css` for the Game Victory interface, and static PWA files for installation and offline use.

**Tech Stack:** Vanilla HTML, CSS, JavaScript ES modules, `localStorage`, service worker, Node built-in test runner.

---

### Task 1: Core Hydration Logic

**Files:**
- Create: `src/water-core.js`
- Create: `test/water-core.test.js`
- Modify: `package.json`

- [ ] Write tests for adding intake, undoing the last addition, successful day detection, current streak, best streak, 7-day progress, and 30-day progress.
- [ ] Run `npm test` and confirm the tests fail because `src/water-core.js` does not exist yet.
- [ ] Implement the pure functions in `src/water-core.js`.
- [ ] Run `npm test` and confirm all tests pass.

### Task 2: PWA Shell

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `app.js`
- Create: `manifest.webmanifest`
- Create: `sw.js`
- Create: `icons/icon.svg`

- [ ] Build the one-screen app shell with installable PWA metadata.
- [ ] Render today's quest state, quick-add controls, undo, stats toggle, and reward banners.
- [ ] Persist all changes in `localStorage`.
- [ ] Register the service worker.

### Task 3: Visual Polish And Verification

**Files:**
- Modify: `styles.css`
- Modify: `app.js`

- [ ] Tune the Game Victory styling for a 390px iPhone viewport.
- [ ] Run `npm test`.
- [ ] Run a local static server.
- [ ] Open the app in the browser and verify that the UI renders, add buttons update progress, undo works, and the stats view shows recent days.
