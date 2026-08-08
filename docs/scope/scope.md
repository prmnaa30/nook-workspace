# Scope: Nook

Nook is a workstation dock application featuring tasks, notes, timeline, and browser extension integrations, accessible via a floating command bar.

**Build approach:** Tracer Bullet (prove the whole pipe works before building any part of it fully).
**Workflow:** Beta (check verify, then test). 

_You are in charge. Every box below is a **suggestion**, not a gate: run any, skip any, and mark a feature `done` when you decide it is. The workflow records what you actually did (including "skipped"), it never requires a step. The one thing it asks is that a load bearing decision be written down (a spec), not that any check be run._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Workstation Dock Architecture | Foundation | existing |
| 2 | Tasks Management | Foundation | in-progress |
| 3 | Notes Management | Foundation | existing |
| 4 | Chrome Extension Integration | Foundation | existing |
| 5 | App Startup Notifications | Slice 1 | in-progress |
| 6 | Scheduled Task Reminders | Slice 2 | in-progress |
| 7 | Setting Modal & Launch Behavior | Slice 3 | done |
| 8 | Update Checker (Manual & Auto) | Slice 3 | done |
| 9 | Backend-Frontend Architecture Refactor | Slice 4 | done |
| 10 | Notes Migration & Deserialization Bugfix | Slice 4 | done |

## Foundations

### 1. Workstation Dock Architecture · existing
Core Tauri architecture including system tray, global hotkeys (Alt+W), floating command bar, and SQLite database setup. code in `src-tauri/src/` and `src/components/floating/`

### 2. Tasks Management · in-progress
Core task model and UI components. Needs completion. code in `src/components/tasks/`

### 3. Notes Management · existing
File system-backed markdown notes. code in `src-tauri/src/notes.rs` and `src/components/notes/`

### 4. Chrome Extension Integration · existing
WebSocket server for communicating with browser extension. code in `src-tauri/src/ws_server.rs`

## Slice 1: App Startup Notifications

### 5. App Startup Notifications · in-progress
Display a notification when the user opens Nook for the first time (manual or startup) to summarize their agenda.
**Done when:** Nook displays an OS-level notification and an in-app toast with text "You have X tasks due today out of Y total tasks." upon startup. Clicking the OS notification focuses Nook and opens the All Tasks view.
- [x] Design it (spec): `/architect startup notifications`
- [x] Build it: `/develop startup notifications`
   - [x] Update capabilities permissions for notification plugin (satisfies AC-1, AC-3, AC-4, AC-7, AC-8)
   - [x] Create notification utility service and event listeners (satisfies AC-1, AC-3, AC-4, AC-7, AC-8, AC-9, AC-10)
   - [x] Filter tasks and calculate counts using local browser timezone (satisfies AC-2, AC-6)
   - [x] Update App.vue startup check to trigger native OS notification exclusively and omit in-app toast (satisfies AC-3, AC-4, AC-5, AC-10)
   - [x] Add a "Show agenda on startup" switch in SettingsModal.vue (satisfies AC-11)
   - [x] Update App.vue to check the startup_notification_enabled setting (satisfies AC-12)
- [x] Verify it: `/check verify startup notifications`
- [ ] Test it: `/test startup notifications`
[0004](../specs/0004-startup-notifications/index.md) · code in `src/services/notification.service.ts`, `src/components/common/SettingsModal.vue`, and `src/App.vue`

## Slice 2: Scheduled Task Reminders

### 6. Scheduled Task Reminders · in-progress
Allow users to set a specific reminder time when adding a new task, triggered via a background timer in the Rust backend.
**Done when:** Users can set a reminder time for a task, and the Tauri backend triggers an OS-level notification at that time even when minimized.
- [x] Design it (spec): `/architect scheduled reminders`
- [x] Build it: `/develop scheduled reminders`
   - [x] Add migration 07 for task reminders schema in SQLite (satisfies AC-2)
   - [x] Add setTaskReminder and clearTaskReminder Specta IPC commands in Rust (satisfies AC-7)
   - [x] Implement background Tokio polling loop in Rust for WinRT Toast alerts (satisfies AC-3, AC-4, AC-5, AC-6)
   - [x] Add Date/Time picker UI in TaskModal.vue and task card options (satisfies AC-1)
- [ ] Verify it: `/check verify scheduled reminders`
- [ ] Test it: `/test scheduled reminders`
[0006](../specs/0006-scheduled-task-reminders/index.md) · code in `src-tauri/src/lib.rs`, `src-tauri/src/commands/tasks.rs`, and `src/components/tasks/TaskModal.vue`

## Slice 3: Settings & Auto Update

### 7. Setting Modal & Launch Behavior · done
A new settings modal triggered from the sidebar footer (replacing the version badge). Includes a "launch at startup" switch (default on) and the version badge. Startup behavior: if launched via OS startup, Nook opens in the background (no main window); if launched manually or fresh install, it shows the main window.
**Done when:** Sidebar footer has a Setting trigger. Modal contains the version and a startup switch. App respects the startup flag to hide/show the main window accordingly.
- [x] Design it (spec): `/architect setting modal and startup`
- [x] Build it: `/develop setting modal and startup`
   - [x] Install and configure tauri-plugin-autostart (Rust backend & permissions) (satisfies AC-3, AC-4)
   - [x] Implement conditional main window startup visibility in lib.rs (satisfies AC-4, AC-5)
   - [x] Build frontend settings modal and sidebar settings trigger (Vue components) (satisfies AC-1, AC-2, AC-3)
- [x] Verify it: `/check verify setting modal and startup`
- [x] Test it: `/test setting modal and startup` (skipped)
[0002](../specs/0002-setting-modal-and-startup/index.md) · code in `src/components/common/SettingsModal.vue` and `src-tauri/src/lib.rs`

### 8. Update Checker (Manual & Auto) · in-progress
Checks against GitHub Releases (`prmnaa30/nook-workspace`) for new versions. Manual check via a button in the Setting Modal. Automatic check runs on app startup (max once per 24 hours).
**Done when:** User can click "Check for update" in Settings. App checks once a day on startup automatically. Finding an update shows a Windows notification and inline status text without floating toasts.
- [x] Design it (spec): `/architect update checker`
- [x] Build it: `/develop update checker`
   - [x] Register Rust command show_update_notification using tauri-winrt-notification (satisfies AC-4)
   - [x] Remove @tauri-apps/plugin-notification frontend package dependency (satisfies AC-4)
   - [x] Update update.service.ts to invoke Rust winrt notification command (satisfies AC-4)
   - [x] Update SettingsModal.vue with inline status feedback text (satisfies AC-1, AC-5)
   - [x] Update App.vue to use OS-level notification exclusively (satisfies AC-2, AC-4)
- [ ] Verify it: `/check verify update checker`
- [ ] Test it: `/test update checker`
[0003](../specs/0003-update-checker/index.md) · code in `src/services/update.service.ts` and `src-tauri/src/lib.rs`

## Slice 4: Architecture Refactor

### 9. Backend-Frontend Architecture Refactor · done
Refactor data layer so Rust serves as the full Backend API (using sqlx for database operations and tauri-winrt-notification for Windows notifications) and Vue operates purely as a Dumb UI using Pinia state management and Tauri command invocations.
**Done when:** All frontend SQL queries are replaced with Tauri command invocations, OS notifications are dispatched directly from Rust, capabilities permissions are restricted to Rust, and Rust backend code is organized into a modular domain-driven folder structure.
- [x] Design it (spec): `/architect backend architecture refactor`
- [x] Build it: `/develop backend architecture refactor`
   - [x] Configure Cargo.toml dependencies and remove notification plugin (satisfies AC-1, AC-4)
   - [x] Implement database pool & models in Rust (satisfies AC-1, AC-7)
   - [x] Create domain command modules for Workspaces, Shortcuts, Notes, Tasks, Settings (satisfies AC-1, AC-4, AC-5, AC-6, AC-7)
   - [x] Refactor Vue services to invoke Tauri commands and restrict capabilities permissions (satisfies AC-2, AC-3, AC-5)
   - [x] Generate end-to-end type-safe TypeScript bindings in src/bindings.ts using tauri-specta (satisfies AC-9)
   - [x] Clean up residual data processing logic and direct OS/DB imports in Vue (satisfies AC-8)
- [x] Verify it: `/check verify backend architecture refactor`
- [x] Test it: `/test backend architecture refactor`
[0005](../specs/0005-backend-architecture-refactor/index.md) · code in `src-tauri/src/` and `src/services/`

### 10. Notes Migration & Deserialization Bugfix · done
Fix deserialization error on legacy `is_pinned` column in Rust SQLite queries and ensure backward compatibility for note files across versions.
**Done when:** `Note` struct in Rust accepts nullable/legacy `is_pinned` data without deserialization failure, note file resolution falls back to legacy directory paths, and frontend array unwrap logs backend errors appropriately.
- [x] Design it (spec): `/architect notes migration bugfix`
- [x] Build it: `/develop notes migration bugfix`
   - [x] Update Note struct in note.rs to use Option<i64> for is_pinned (satisfies AC-1)
   - [x] Add legacy path fallback ~/.workstation_data/notes/ in notes.rs (satisfies AC-2)
   - [x] Add error logging to unwrapArrayResult in notes.service.ts (satisfies AC-3)
- [x] Verify it: `/check verify notes migration bugfix`
- [x] Test it: `/test notes migration bugfix`
[0007](../specs/0007-notes-migration-bugfix.md) · code in `src-tauri/src/commands/notes.rs` and `src/services/notes.service.ts`

## Legend

**The decision box.** Every feature carries exactly one, the sub-task whose label ends with `(spec)`. Its wording varies (`Design it (spec)` normally, `Decide the stack (spec)` on Stack & architecture), so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

**Feature lifecycle**: the scope updates as a feature moves; each row is what it shows and who sets it:

| State | Set by | The feature shows |
|---|---|---|
| `planned` · needs a decision | `/scope` | one box: `Design it (spec): /architect <feature>` |
| `in-progress` (designed) | **`/architect` at spec capture** | `Design it` ticked; spec linked; `Build it: /develop <feature>` + **2 to 5 milestones**; the tier's closing boxes (`Verify it` Alpha+, `Test it` Beta+, `Review it` + `Document it` GA); any surfaced follow-up enrolled |
| `in-progress` (building) | `/develop` | milestone sub-boxes tick one by one; code pointer filled |
| `in-progress` (verified) | `/check verify` | `Build it` + milestones ticked; `Verify it` ticked |
| `done` | **you, when you decide it is** (any skill sets it when you say so); `/sync` reconciles | the boxes you ran are ticked, ones you skipped are recorded as skipped; the tier's last stage (`Prototype` → after `/develop`; `Alpha` → after `/check verify`; `Beta`/`GA` → after `/test`) is the *suggested* point to call it done, never a gate; `/sync` captures conventions |

- **Next step** = the first unticked box (always a command or a tracked milestone).
- **needs a decision** = run `/architect` first; otherwise straight to `/develop` (or `/audit` for standards & tooling). The tag drops once the spec is captured.
- **Atomic build tasks live in the spec's `## Build plan`, not here**: the scope carries only the milestone rollup.
- **Status** `planned` → `in-progress` → `done`, plus `existing` (pre-workflow) and `dropped` (de-scoped, kept for history).
- **Approach tag** beside a heading (e.g. `· Facade`) overrides the project default for that feature; no tag = inherits it.
- **Workflow tier tag** beside a heading (e.g. `· GA`, `· Prototype`) overrides the project default `**Workflow:**` tier for that one feature; no tag = inherit. The **effective tier** (tag if set, else default) is the *recommended* verification depth; every skill reads it the same way to suggest the next step and to shape the closing boxes. Those boxes are suggestions you run or skip; skipping never blocks `done`. The single rigor dial (no separate "weight").
- **Workflow** (header line) is the project default tier, the stages each feature *suggests* running **after** `/develop`: **Prototype** = nothing (rely on its build time self check); **Alpha** = `/check verify`; **Beta** = `/check verify` then `/test`; **GA** = adds a fresh model `/check review` then `/document`. `done` is your call, not gated on these; a skipped stage is recorded as skipped. An `Assumed` spec is flagged on the feature (its decision still owes ratification) but does not block you from marking `done`; `/architect` still records any load bearing decision, the one thing the workflow asks. A feature's own tier tag overrides the default.
- **Pointer line** (`spec <n> · code in <path>`): the spec link added by `/architect`, the code path by `/develop`.
