# Verify: App Startup Notifications · spec 0004 · updated 2026-08-06
_Steps derived from spec 0004 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [x] Launch Nook manually → expect native OS notification "You have X tasks due today out of Y total tasks." without duplicate in-app toast → AC-1, AC-2, AC-3, AC-5
- [x] Launch Nook manually with 0 tasks → expect native notification "You are all caught up! Have a great day!" → AC-4
- [x] Click native OS notification → expect main Nook window to be unminimized, shown, focused, and view switched to All Tasks (global-tasks) → AC-10
- [x] Launch Nook in background via `--autostart` flag when notification permission was not granted → expect NO native permission prompt on system boot → AC-7, AC-8
- [x] Launch Nook in background via `--autostart` flag when notification permission was previously granted → expect native OS notification delivered silently → AC-3, AC-7
- [x] Create a task due at 11:59 PM today → expect it to be counted under tasks due today → AC-6
- [x] Deny OS notification permission when prompted → expect silent skip without errors or repetitive permission dialogs → AC-9
- [x] Toggle off "Show agenda on startup" in SettingsModal → relaunch Nook → expect NO native notification regardless of remaining tasks → AC-11, AC-12
- [x] Toggle on "Show agenda on startup" in SettingsModal → relaunch Nook → expect notification behavior restored → AC-11, AC-12

## Commands
- [x] `npm run build` → typecheck and vite build succeed with code 0 → AC-1..12

## Acceptance-criteria coverage
- AC-1 covered by manual launch permission check & build command
- AC-2 covered by task count computation step
- AC-3 covered by native notification summary step
- AC-4 covered by zero tasks friendly notification step
- AC-5 covered by native notification exclusive delivery check
- AC-6 covered by local timezone 11:59 PM due date test
- AC-7 covered by autostart background launch test
- AC-8 covered by deferred permission prompt test
- AC-9 covered by permission denied silent skip test
- AC-10 covered by native notification click navigation test
- AC-11 covered by settings toggle action step
- AC-12 covered by setting disabled verification step
