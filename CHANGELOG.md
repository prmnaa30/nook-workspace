# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.5.0] - 2026-08-09

### Added
- Scheduled task reminder feature with background timer support and native system notifications.
- Automatic scroll positioning in task date time picker to center previously chosen hour and minute when opened.
- Native Windows Calendar Reminder sound for task reminder notification alerts.

### Changed
- Streamlined Floating Command Bar by removing quick task creation form (`FloatingTaskForm.vue`) and mode toggle, focusing exclusively on quick access launcher and search.
- Fixed Floating Command Bar window height at 420px for consistent search display.
- Refined Dashboard upcoming deadlines stat card to strictly count active tasks that are not overdue.

### Fixed
- Resolved note fetching deserialization error by handling nullable pinned fields (`Option<i64>`) and adding legacy file path fallbacks (`~/.workstation_data/notes/`).
- Fixed Rust backend database pool initialization to execute all SQLite migrations automatically on startup.
- Fixed frontend data service unwrapping to safely handle IPC error responses and prevent component rendering glitches.

### Removed
- Removed quick task creation mode, mode transition animations, and `Ctrl+Tab` mode switch shortcut from Floating Command Bar header and footer.

## [1.4.0] - 2026-08-07

### Added
- Pinning capability for individual notes and shortcuts to show directly in the Floating Command Bar without search (see spec [0001](docs/specs/0001-pin-notes-shortcuts.md)).
- Toggle switch "Pin to Quick Access" in creation and edit modals for notes and shortcuts.
- Interactive pin icon button and context menu item on note and shortcut cards.
- Grouped display by workspace name in the Floating Command Bar results list.
- Helpful empty state message in Floating Command Bar when no items are pinned.
- Settings modal triggered from the sidebar footer, replacing the hardcoded version badge with dynamic version info and system preferences (see spec [0002](docs/specs/0002-setting-modal-and-startup/index.md)).
- "Launch at startup" switch using `@tauri-apps/plugin-autostart` to automatically start Nook on system boot.
- Automatic update checker running on startup (throttled to max 1x per 24 hours) querying GitHub Releases for new versions (see spec [0003](docs/specs/0003-update-checker/index.md)).
- Manual "Check for updates" button inside the Settings modal with instant status toast feedback.
- OS notifications and in app toasts for new release alerts with direct browser link navigation via `@tauri-apps/plugin-opener`.
- App Startup Notifications summarizing tasks due today and total remaining tasks via native OS notifications and in app toasts upon app launch (see spec [0004](docs/specs/0004-startup-notifications/index.md)).
- Toggle switch "Show agenda on startup" in the Settings modal to allow users to turn off startup task summary notifications.
- Click action on in app toast to navigate directly to the All Tasks view.
- Type safe TypeScript IPC bindings auto generated via `tauri-specta` (`src/bindings.ts`, see spec [0005](docs/specs/0005-backend-architecture-refactor/index.md)).
- Native Windows toast notifications dispatched directly from Rust using `tauri-winrt-notification`.
- Unit test suite configured via `vitest` covering all refactored frontend data service IPC wrappers.
- Centralized app version service `src/services/app-version.ts` dynamically fetching runtime app version from Tauri.
- Version bump automation script `scripts/bump-version.js` (`npm run version:bump <version>`) syncing `package.json`, `Cargo.toml`, and `tauri.conf.json`.
- Inline update status feedback UI in `SettingsModal.vue` replacing floating toast banners.
- Rust command `show_update_notification` using native Windows WinRT Toast API for update alerts.

### Changed
- Refactored update checker to use Specta bindings `commands.showUpdateNotification` instead of raw `invoke` calls.
- Startup behavior: Nook opens hidden in the system tray when started via OS boot (`--autostart`), but opens and focuses the main window immediately on manual launch.
- Refactored architecture to treat Rust as a full Backend API (`sqlx` SQLite pool, domain models, business logic) and Vue 3 as a Dumb UI using Pinia state management (see spec [0005](docs/specs/0005-backend-architecture-refactor/index.md)).
- Reorganized Rust backend code into a modular domain driven directory structure (`src-tauri/src/db.rs`, `models/`, `commands/`).
- Restricted frontend webview permissions by removing raw SQL (`sql:*`) and notification (`notification:*`) permissions from `src-tauri/capabilities/default.json`.

### Fixed
- Fixed esbuild destructuring error during `npm run tauri dev` by configuring `esbuild` and `optimizeDeps` target to `esnext` in `vite.config.ts`.
- Explicitly declared `build = "build.rs"` in `src-tauri/Cargo.toml` to prevent `OUT_DIR` environment variable missing errors in IDE macro expansion.
- Added comprehensive Windows binary metadata (publisher, copyright, description) in `tauri.conf.json` to prevent Windows Defender false positive flags.
- Fixed SQLite database initialization by adding `?mode=rwc` to create `workstation.db` automatically if missing on fresh installs.
- Fixed Tokio runtime context requirement in `src-tauri/src/lib.rs` setup hook by wrapping `sqlx::SqlitePool::connect` in `tauri::async_runtime::block_on`.
