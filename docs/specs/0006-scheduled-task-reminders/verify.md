# Verify: Scheduled Task Reminders · spec 0006 · updated 2026-08-07
_Steps derived from spec 0006 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [ ] Create a task with a reminder set 30 seconds in the future → expect `reminder_at` saved in SQLite → AC-1, AC-2
- [ ] Wait 30 seconds with Nook minimized to tray → expect native Windows Toast notification to pop up displaying task title → AC-3, AC-4, AC-5
- [ ] Click native Windows Toast notification → expect Nook window to be unminimized, focused, and view switched to All Tasks (global-tasks) → AC-6
- [ ] Edit a task to clear the reminder → expect `reminder_at` set to NULL in SQLite → AC-1, AC-7

## Commands
- [x] `npm run build` → typecheck and vite build succeed with code 0 → AC-1..7

## Acceptance-criteria coverage
- AC-1 covered by task reminder UI creation and clearing tests
- AC-2 covered by migration 07 database schema check
- AC-3 covered by Rust background Tokio polling timer test
- AC-4 covered by Windows Toast notification dispatch test
- AC-5 covered by `reminder_sent = 1` SQLite flag update test
- AC-6 covered by notification click activation test
- AC-7 covered by Specta IPC command bindings check
