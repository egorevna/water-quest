# TODO

## Now

- [ ] Confirm the next hourly push arrives on iPhone while today's total is below the selected daily goal.
- [ ] If no push arrives, add scheduled-send diagnostics:
  - log when cron runs;
  - log local time window decision;
  - log push endpoint origin;
  - log Web Push response status and body.
- [ ] Reconcile why Worker `/debug` sees one subscription while `wrangler kv key list --binding WATER_REMINDERS` returns `[]`.

## Before Calling Push Done

- [ ] Confirm push stops after the app syncs the selected daily goal for the current date.
- [ ] Confirm push resumes the next local day when today's progress is treated as 0 ml.
- [ ] Remove or protect public `/debug`.
- [ ] Remove `debug:last-event` from KV if it is no longer needed.

## Product Polish

- [ ] Add a visible "last synced" state for push reminders.
- [ ] Add a "send test reminder" admin/debug-only endpoint or local test button.
- [ ] Add clearer iPhone instructions for refreshing an installed PWA after deploy.
- [ ] Consider exporting/importing local water history before changing storage model.
- [ ] Consider whether historical streaks should use today's selected goal or each day's saved goal if per-day goals become important later.

## Maintenance

- [ ] Keep `wrangler.toml` and `.wrangler/` ignored.
- [ ] Keep secrets out of GitHub:
  - `VAPID_PRIVATE_KEY`
  - `INVITE_CODE`
- [ ] Rotate exposed tokens immediately if any are pasted into chat or git.
