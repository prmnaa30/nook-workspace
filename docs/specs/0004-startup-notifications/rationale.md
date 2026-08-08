# Rationale: Startup Notifications

## Context

When Nook opens, users need a quick way to know their agenda. Because the application can run hidden in the system tray at system boot, the frontend window is not always visible to the user. Showing a native operating system notification allows the user to see their task status immediately without opening the application window. If they launch the application manually, they should see both the native notification and a visual toast in the user interface.

## Options considered

### Option 1: Frontend query and trigger

The Vue application queries the database via the database service and triggers notifications using the Tauri notification plugin upon mounting.

**Pros**:
- Simplifies development by reusing the existing database service and local timezone logic in JavaScript.
- Avoids writing custom SQL query code or date parsing logic in the Rust backend.

**Cons**:
- The webview must load and run JavaScript in the background for the notification to trigger during autostart.

### Option 2: Rust backend query and trigger

The Rust backend parses startup arguments, queries SQLite directly, and triggers notifications before the webview is fully initialized.

**Pros**:
- Slightly faster notification delivery on startup.

**Cons**:
- Requires duplicating the task selection query and timezone handling logic in Rust.

## Rationale

This approach requires minimal backend changes because Tauri already provides the notification plugin. Triggering the checks on the frontend allows us to reuse the existing database service. The database service already retrieves global tasks. Processing the dates in JavaScript is easier because we can use the local date functions of the browser.
