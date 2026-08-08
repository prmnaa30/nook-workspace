# Verify: Backend Architecture Refactor · spec 0005 · updated 2026-08-07

_Steps derived from spec 0005 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [ ] Open application and verify workspace CRUD operations work smoothly → AC-1, AC-2
- [ ] Verify native Windows toast notification is displayed on application boot without latency → AC-4, AC-5
- [ ] Check settings modal toggle for autostart and startup notification → AC-6

## Commands
- [x] `cargo check` passes with 0 compiler errors → AC-1, AC-7
- [x] `npm run build` passes with 0 TypeScript compilation errors → AC-2, AC-8, AC-9

## Acceptance-criteria coverage
- AC-1: Covered by `cargo check` and workspace CRUD UI testing.
- AC-2: Covered by `npm run build` typechecking services.
- AC-3: Covered by capabilities restriction verification in `default.json`.
- AC-4: Covered by Windows native toast notification dispatch in Rust.
- AC-5: Covered by `show_startup_agenda` command response and toast rendering.
- AC-6: Covered by boot autostart sync in `lib.rs`.
- AC-7: Covered by modular Rust folder structure (`db.rs`, `models/`, `commands/`).
- AC-8: Covered by cleanup of frontend database/notification imports.
- AC-9: Covered by `tauri-specta` auto-generated type bindings in `src/bindings.ts`.
