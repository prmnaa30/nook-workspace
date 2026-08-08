# 0004. Startup Notifications

**Date**: 2026-08-06
**Status**: In Progress

## Summary

Nook will display a notification to the user upon application startup to summarize their tasks. The application checks for operating system permissions, queries the database for tasks, and triggers a native notification as well as an in app toast. If there are no tasks, a friendly message will tell the user they are caught up.

## Requirements

**User stories**:
- As a Nook user, I want to see a summary of my tasks when Nook starts so that I know what needs my attention today.
- As a Nook user, I want the summary to display as a native notification on boot so that I do not miss it even when the application starts minimized.

**Acceptance criteria**:
- **AC-1**: Upon application startup, Nook checks for native notification permissions.
- **AC-2**: Upon application startup, Nook queries all global tasks and computes the count of tasks due today and total remaining tasks.
- **AC-3**: If there are tasks due today or remaining, Nook triggers a native operating system notification showing "You have X tasks due today out of Y total tasks.".
- **AC-4**: If there are no tasks due today and no remaining tasks, Nook triggers a native operating system notification saying "You are all caught up! Have a great day!".
- **AC-5**: Startup task summaries are delivered exclusively via native OS-level notifications. In-app toast notifications are omitted on startup to avoid visual overlap in the bottom right corner.
- **AC-6**: A task is defined as due today if its due date falls within the current local calendar day.
- **AC-7**: During autostart (when Nook starts hidden in the tray), Nook only triggers the native notification if permission is already granted. It does not prompt for permission on boot.
- **AC-8**: If permission is not granted, Nook defers requesting notification permission until the window is first opened or focused manually.
- **AC-9**: If notification permission is denied, Nook skips sending startup notifications without prompting again or throwing errors.
- **AC-10**: Clicking the native OS notification focuses the main Nook window and navigates the active view to "All Tasks" (global-tasks).
- **AC-11**: The Settings Modal provides a toggle switch for "Show agenda on startup". This preference is stored in SQLite under key `startup_notification_enabled`.
- **AC-12**: If the startup notification preference is set to "disabled", Nook does not send native notifications at startup.

## Decision

**Chosen option**: Option 1: Frontend query and trigger

We will handle task querying and notification triggers inside the Vue application frontend on startup.

**Implementation skills**: `tauri-v2` (`nodnarbnitram/claude-code-extensions`, `.agents/skills/tauri-v2/`) · `vue` (`antfu/skills`, `.agents/skills/vue/`)

## Rationale

Reasoning and options: see [rationale.md](rationale.md)

## Feature design

**Data model sketch**:
No new database tables or fields are needed. We use the existing tasks table.

**API surface**:
- Command `show_startup_agenda(today_date: String)` in Rust queries SQLite and triggers native Windows Toast via `winrt-notification`.
- Click Activation (AC-10): Rust `winrt-notification` registers an `.on_activated(...)` handler that unminimizes, shows, and focuses the main window, then emits a Tauri event `"navigate-view"` with payload `"global-tasks"`. Vue `App.vue` listens for `"navigate-view"` and calls `workspaceStore.selectView("global-tasks")`.

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Startup check | Active task list & due counts | Rust command `show_startup_agenda(today_str)` querying SQLite |
| Startup check | Today date | Client local date string passed from Vue `App.vue` |
| Notification | Task summary toast | Rust `winrt-notification` Toast Builder |
| Notification click | Focus & view navigation | Rust `winrt-notification` `on_activated` handler emitting `"navigate-view"` event |
| Settings preference | Toggle preference state | `getAppSetting("startup_notification_enabled")` / `setAppSetting("startup_notification_enabled")` |

**Key invariants**:
- Notification is triggered exactly once per application run.
- Tasks are only counted as remaining if their status is not DONE.
- Tasks are only counted as due today if they are remaining and their due date is today.
- Native notification permission prompts are never shown when the application is started hidden via `--autostart`.
- Startup notifications are only sent if the startup notification preference in app settings is not set to "disabled".

**Security model**:
Tauri permissions restrict notification requests. Only the application is allowed to trigger notifications.

**Configuration required**:
No new configuration or environment variables are needed.

**Critical test scenarios**:
- Main flow with tasks: Opening Nook with remaining tasks triggers a native notification showing the correct counts, verifies **AC-1**, **AC-2**, **AC-3**, **AC-5**, **AC-8**
- Main flow without tasks: Opening Nook with zero tasks triggers a native notification saying the user is caught up, verifies **AC-4**
- Timezone correctness: A task due at 11pm local time is correctly counted as due today, verifies **AC-6**
- Autostart background behavior: Launching with `--autostart` triggers the native notification only if permission was previously granted, and does not show any permission request dialog, verifies **AC-7**
- Permission denied fallback: Denying notification permission prevents native prompts on subsequent startups without throwing errors, verifies **AC-9**
- Notification click navigation: Clicking the native notification opens and focuses the Nook window and switches the view to All Tasks, verifies **AC-10**
- Disable startup notifications: Toggling off "Show agenda on startup" in Settings prevents notifications from being triggered on subsequent startups, verifies **AC-11**, **AC-12**

## Build plan

1. [x] Update `src-tauri/capabilities/default.json` to include permissions for the notification plugin (`notification:allow-notify`, `notification:allow-request-permission`, `notification:allow-is-permission-granted`), satisfies **AC-1**, **AC-3**, **AC-4**, **AC-7**, **AC-8**
2. [x] Create a notification utility service (`src/services/notification.service.ts`) to wrap the permission check, permission request, click listener registration, and send notification calls, satisfies **AC-1**, **AC-3**, **AC-4**, **AC-7**, **AC-8**, **AC-9**, **AC-10**
3. [x] Create a startup check function and register click listener in `App.vue` that runs once when the app is mounted, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**, **AC-9**, **AC-10**
4. [x] Implement the logic to filter tasks due today and tasks remaining using browser timezone date comparison, satisfies **AC-2**, **AC-6**
5. [x] Update startup notification check in `App.vue` to only trigger native OS notifications and omit in-app toast notifications on startup, satisfies **AC-3**, **AC-4**, **AC-5**, **AC-8**
6. [x] Add a "Show agenda on startup" switch in `SettingsModal.vue` that reads and writes the `startup_notification_enabled` preference, satisfies **AC-11**
7. [x] Update the startup notification check in `App.vue` to check the `startup_notification_enabled` setting before sending native notifications, satisfies **AC-12**

## Consequences

**Positive**:
- Users get a summary of their work immediately upon booting their system.
- Notification permissions are requested gracefully.

**Negative / tradeoffs**:
- Webview must be initialized for the notification to show.

**Neutral**:
- Relies on the operating system notification settings of the user.
