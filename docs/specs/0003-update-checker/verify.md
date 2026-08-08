# Verify: Update Checker (Manual and Auto) · spec 0003 · updated 2026-08-07
_Steps derived from spec 0003 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [ ] Open Settings Modal -> Click "Check for updates" -> Verify API call runs and inline status text feedback appears -> AC-1
- [ ] Verify `last_update_check_at` timestamp is updated in SQLite `app_settings` table after check -> AC-3
- [ ] When new version exists -> Verify native Windows OS Notification Toast appears via Rust backend (no floating toasts) -> AC-4
- [ ] Click release notification -> Verify browser opens `https://github.com/prmnaa30/nook-workspace/releases` -> AC-5

## Automated / Logic
- [ ] Verify automatic check on app startup respects 24-hour throttling based on SQLite `last_update_check_at` -> AC-2

## Acceptance-criteria coverage
- AC-1 covered by UI step 1
- AC-2 covered by Logic step 1
- AC-3 covered by UI step 2
- AC-4 covered by UI step 3
- AC-5 covered by UI step 4
