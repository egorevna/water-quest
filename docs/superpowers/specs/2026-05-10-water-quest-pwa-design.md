# Water Quest PWA Design

## Goal

Build an installable iPhone-friendly PWA that tracks daily water intake toward a 4 liter goal and turns consistency into a light game.

## Core Rules

- Daily goal is 4000 ml.
- Quick add amounts are 300 ml, 400 ml, and 500 ml.
- A successful day is any date with at least 4000 ml recorded.
- A weekly victory is any 7 successful days in a row.
- A super cup is any 30 successful days in a row.
- History is local-only and stored in `localStorage`.

## Experience

The visual direction is Game Victory: a daily quest screen, bright water progress, bold reward states, and trophy moments. The main screen shows today's liters, percent progress, current streak, best streak, 7-day progress, and 30-day progress. A stats screen shows the last 30 days so missed and successful days are visible at a glance.

## Data Model

Store one object under a single `localStorage` key. It contains a `days` map keyed by local `YYYY-MM-DD`. Each day stores total milliliters and an additions array so the last action can be undone.

## PWA Requirements

The app should run without a build step. It needs `index.html`, CSS, JavaScript, a web manifest, app icons, and a service worker for offline caching. It should be usable from Safari's Add to Home Screen flow on iPhone.

## Testing

Pure streak and history logic should be tested with Node's built-in test runner. UI behavior will be verified by running a local static server and checking the rendered app at a mobile viewport.
