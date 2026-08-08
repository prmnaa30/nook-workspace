# Rationale: Scheduled Task Reminders · spec 0006

## Context

Nook users need scheduled task reminders to bring important tasks to their attention at specific times during the workday.

## Options considered

### Option 1: Rust Background Polling Loop & WinRT Notifications (Chosen)
- **Description**: Rust runs an async Tokio loop every 30 seconds querying SQLite for due reminders (`reminder_at <= CURRENT_TIMESTAMP AND reminder_sent = 0 AND status != 'DONE'`). When a reminder matures, Rust dispatches a Windows Toast notification using `winrt-notification` and marks `reminder_sent = 1`.
- **Pros**: 100% native background delivery in Rust even when Nook is minimized in system tray; low CPU usage; simple schema migration.
- **Cons**: Up to 30-second delay in alert delivery based on polling interval.

### Option 2: Windows System Scheduler / Task Scheduler API
- **Description**: Register individual Windows OS Task Scheduler events for every scheduled reminder.
- **Pros**: Exact second precision.
- **Cons**: High complexity, requires elevated OS permissions and complex cleanup when tasks are deleted or edited.

## Decision rationale

Option 1 provides the best trade-off between reliability, cross-process simplicity, and performance. A 30-second polling interval in Tokio overhead is negligible (under 0.1% CPU) and avoids complex OS scheduler interactions.
