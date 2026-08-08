# Verify: Setting Modal and Startup · spec 0002 · updated 2026-08-06
_Steps derived from spec 0002 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [x] Open Nook -> Verify Settings button appears in sidebar footer replacing version badge -> AC-1
- [x] Click Settings button -> Verify modal opens with current app version and Launch at startup toggle -> AC-2
- [x] Toggle Launch at startup switch -> Verify toggle state changes and autostart registry updates -> AC-3

## Commands
- [x] Launch app without args (`nook.exe`) -> Verify main window is shown and focused -> AC-5
- [x] Launch app with `--autostart` (`nook.exe --autostart`) -> Verify app starts hidden in tray -> AC-4

## Acceptance-criteria coverage
- AC-1 covered by UI step 1
- AC-2 covered by UI step 2
- AC-3 covered by UI step 3
- AC-4 covered by Command step 2
- AC-5 covered by Command step 1
