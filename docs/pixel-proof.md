# My executed interface proof

**Ayo Ahmed — Independent concept for Trybe. Unofficial; synthetic only.**

I verified the running local Cloudflare Worker/SQLite Durable Object interface at **320, 390, 540 and 1440 CSS pixels**. The complete flow covers competing stale availability, explicit changed time/price, coherent hold, stale held price recovery, edit-invalidated validation, submitted/not-settled fulfilment blocking, receipt recovery, failed simulated settlement and owned handoff. There was no horizontal page overflow or uncaught JavaScript/CSP error. Expected domain rejection responses are reported as 409.

Additional checks exercised keyboard activation, actual simulated expiry and fresh re-hold, generated synthetic import preview/commit, downloadable audit, and a lost response after a committed reservation. That last check kept reserve/submit blocked across reload until a receipt recovered exactly one booking.

The evidence panel showed **34/34 scenarios and 108 assertions**. Actual broken expiry injection showed **32/34, two failures**, with expected and actual rows visible. These checks demonstrate rules, not commercial uplift.

- [Full provenance, scope and limitations](pixel-proof/README.md).
- [320px conflict and changed-choice controls](pixel-proof/conflict-crop-320.png).
- [390px owned exception](pixel-proof/exception-crop-390.png).
- [Desktop running interface](pixel-proof/initial-1440.png).
- [Executed evidence at 390px](pixel-proof/evidence-crop-390.png).
- [Browser results by width](pixel-proof/results.json) and [recovery results](pixel-proof/recovery-results.json).

These original screenshots show the actual local application. They are neither vendor screenshots nor the requested public HTTPS recording. Public deployment and recording remain pending.

## Reproduce

With `npm start` running, Python Playwright and Chromium installed:

```sh
python scripts/verify-ui.py
python scripts/verify-recovery.py
```

Use `--url` to target another development origin. The scripts save screenshots in `docs/pixel-proof/` and scratch results in `work/ui/`. They wait for application/rendering evidence; expiry uses the fixed simulation-clock control. They do not create a video or connect to vendor booking APIs.
