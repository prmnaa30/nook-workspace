# 0006. Scheduled Task Reminders

**Date**: 2026-08-07
**Status**: Proposed

## Summary

Nook will support scheduled task reminders allowing users to pick a specific date and time for task alerts. A background polling timer in the Rust backend checks SQLite for matured reminders, dispatches native Windows Toast notifications, and marks reminders as delivered. Clicking a reminder notification focuses Nook and opens the All Tasks view.

## Requirements

**User stories**:
- As a Nook user, I want to set a specific date and time reminder for a task so that I am notified when it needs my attention.
- As a Nook user, I want to receive a native OS notification at the exact scheduled reminder time even when Nook is running in the background or system tray.

**Acceptance criteria**:
- **AC-1**: Users can set, edit, or clear a `reminder_at` date and time when creating or editing a task in the Task Modal or Task Card.
- **AC-2**: Database migration `07_add_task_reminders.sql` adds `reminder_at DATETIME` and `reminder_sent INTEGER DEFAULT 0` columns to the `tasks` table.
- **AC-3**: The Rust backend runs a background interval task (polling every 30 seconds) that queries for tasks where `reminder_at <= CURRENT_TIMESTAMP` and `reminder_sent = 0` and status is not `DONE`.
- **AC-4**: When a reminder matures, Rust triggers a native Windows Toast notification (`winrt-notification`) configured with `Sound::Reminder` (Windows Calendar Reminder sound) displaying the task title and workspace name.
- **AC-5**: Upon successfully dispatching the OS notification, Rust updates `reminder_sent = 1` in SQLite for that task.
- **AC-6**: Clicking the reminder notification unminimizes, shows, and focuses the main Nook window and emits the `"navigate-view"` event with payload `"global-tasks"`.
- **AC-7**: Specta TypeScript bindings export `setTaskReminder(taskId, reminderAt)` and `clearTaskReminder(taskId)` commands for the Vue frontend.

## Decision

**Chosen option**: Option 1: Rust Background Polling Loop & WinRT Notifications

We use Rust async Tokio task in `lib.rs` to run a 30-second polling timer against SQLite, combined with `winrt-notification` for OS alerts and `specta` IPC commands.

**Implementation skills**: `tauri-v2` (`nodnarbnitram/claude-code-extensions`, `.agents/skills/tauri-v2/`) · `vue` (`antfu/skills`, `.agents/skills/vue/`)

## Rationale

Reasoning and options: see [rationale.md](rationale.md)

## Feature design

**Data model sketch**:
SQLite Migration `07_add_task_reminders.sql`:
```sql
ALTER TABLE tasks ADD COLUMN reminder_at DATETIME NULL;
ALTER TABLE tasks ADD COLUMN reminder_sent INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_tasks_reminder ON tasks(reminder_at, reminder_sent, status);
```

**API surface**:
Tauri commands added to Rust backend:
- `set_task_reminder(task_id: i64, reminder_at: Option<String>) -> Result<(), String>`
- `clear_task_reminder(task_id: i64) -> Result<(), String>`

Tauri event emitted to Vue frontend on click:
- Event: `"navigate-view"`, Payload: `"global-tasks"`

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Set reminder | `reminder_at` datetime string | Vue Date/Time picker in Task Modal |
| Poll reminders | List of due reminder tasks | Rust background Tokio loop executing SQL query |
| Send notification | Windows Toast notification | Rust `winrt-notification` Toast Builder |
| Notification click | Focus & view navigation | Rust `on_activated` handler emitting `"navigate-view"` event |

**Key invariants**:
- Reminders are only sent for tasks whose status is not DONE.
- Reminders are dispatched at most once (`reminder_sent = 1` set immediately after dispatch).
- Polling timer runs every 30 seconds with low CPU overhead.
- Clearing a reminder sets `reminder_at = NULL` and resets `reminder_sent = 0`.

**Security model**:
Database operations scoped to local SQLite. IPC permissions managed via Specta commands.

**Critical test scenarios**:
- Setting a reminder: Creating a task with a reminder populates `reminder_at` in SQLite, satisfies **AC-1**, **AC-2**
- Polling and dispatching: Setting a reminder 30 seconds in the future triggers a native Windows notification when mature and sets `reminder_sent = 1`, satisfies **AC-3**, **AC-4**, **AC-5**
- Click navigation: Clicking the reminder notification focuses Nook and opens All Tasks view, satisfies **AC-6**
- Clearing reminder: Editing a task to clear the reminder sets `reminder_at = NULL`, satisfies **AC-1**, **AC-7**

## Build plan

1. [ ] Create database migration `07_add_task_reminders.sql` adding `reminder_at` and `reminder_sent` columns and index to `tasks` table, satisfies **AC-2**
2. [ ] Add `set_task_reminder` and `clear_task_reminder` Specta commands in Rust backend `src-tauri/src/commands/tasks.rs`, satisfies **AC-7**
3. [ ] Implement background Tokio polling loop in Rust `src-tauri/src/lib.rs` checking due reminders every 30 seconds and triggering `winrt-notification` Toast alerts with `.sound(Some(Sound::Reminder))` and `on_activated` click handlers, satisfies **AC-3**, **AC-4**, **AC-5**, **AC-6**
4. [ ] Update TypeScript bindings (`src/bindings.ts`) via specta export, satisfies **AC-7**
5. [ ] Add Date/Time picker in `src/components/tasks/TaskModal.vue` and task action menus to allow setting and clearing reminders, satisfies **AC-1**

## Consequences

**Positive**:
- Users receive timely task reminders even when Nook is minimized in the system tray.
- Zero extra heavy dependencies; reuses `winrt-notification` and Tokio async timers in Rust.

**Negative / tradeoffs**:
- 30-second polling interval means notifications may trigger up to 30 seconds after the exact scheduled time.

**Neutral**:
- Requires Windows notification permissions enabled.
