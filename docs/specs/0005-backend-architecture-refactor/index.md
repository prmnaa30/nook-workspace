# 0005. Backend Architecture Refactor and Frontend Decoupling

**Date**: 2026-08-07
**Status**: Accepted

## Summary

Refactor Nook application data access and OS integration architecture. Move all SQLite database queries and mutations from the Vue frontend to the Rust backend using `sqlx`. Move Windows native toast notifications to Rust using `tauri-winrt-notification`. Vue functions purely as a dumb UI driven by Pinia stores and Tauri command invocations.

## Context

Previously, the Vue frontend executed SQL queries directly using `@tauri-apps/plugin-sql` and triggered OS notifications via IPC calls back to Rust. This led to business logic leaking into the frontend, heavier bundle size, potential security permissions risks in capabilities, and unnecessary IPC hops for native OS notifications. Refactoring establishes a clear fullstack boundary where Rust acts as the Backend API and Vue acts as the Frontend SPA.

## Requirements

**User stories**:
- As a developer, I want Rust to handle all database queries and OS integrations so that business logic is centralized and the frontend remains lightweight.
- As a user, I want instant native OS notifications on Windows without delays so that my agenda reminders are delivered reliably.

**Acceptance criteria**:
- **AC-1**: All SQLite database operations (select, insert, update, delete) for workspaces, shortcuts, notes metadata, tasks, and app settings are executed exclusively in Rust via `sqlx`.
- **AC-2**: All frontend services (`workspaces.service.ts`, `shortcuts.service.ts`, `notes.service.ts`, `tasks.service.ts`, `update.service.ts`) invoke Tauri commands instead of running direct SQL queries.
- **AC-3**: `db.ts` direct `@tauri-apps/plugin-sql` connection is removed from frontend, and SQL permissions are revoked in `src-tauri/capabilities/default.json`.
- **AC-4**: Native OS toast notifications on Windows are sent directly from Rust using `tauri-winrt-notification`, replacing `tauri-plugin-notification`.
- **AC-5**: Startup agenda task count summary and OS notification are processed in Rust via command `show_startup_agenda(today: String)` and returned to Vue for in-app toast rendering.
- **AC-6**: Autostart preference is read from SQLite database and synchronized directly during Rust backend startup.
- **AC-7**: Rust codebase is organized modularly into `db.rs`, `models/`, and `commands/` domain modules.
- **AC-8**: All residual frontend data processing (e.g. agenda date calculations, task filtering for startup notifications) and direct OS communication logic are removed from Vue services and components. Frontend strictly handles UI state management (Pinia), user reactions, and component rendering.
- **AC-9**: End-to-end TypeScript type-safety is established using `tauri-specta` to automatically generate TypeScript models and typed command wrappers in `src/bindings.ts`.

## Options considered

### Option 1: Retain Frontend SQL Queries and Refactor Only Notifications
Keep direct frontend SQL queries via `@tauri-apps/plugin-sql` and only move notification triggers to Rust.

**Pros**:
- Smaller immediate change set.

**Cons**:
- Does not solve data access leaks in frontend.
- Capabilities still expose full raw SQL execution permissions to webview.

### Option 2: Full Separation with `sqlx` in Rust and `tauri-winrt-notification` on Windows (Chosen)
Migrate all SQL operations to Rust using `sqlx`, send Windows notifications natively via `tauri-winrt-notification`, and restrict webview permissions.

**Pros**:
- Clean separation of concerns (Fullstack pattern: Rust API + Vue SPA).
- Direct native Windows toast notifications with zero IPC bridge latency.
- Restricts webview permissions by removing raw SQL capability.
- Highly scalable domain module folder layout in Rust.

**Cons**:
- Requires writing Rust model structs and command handlers for all entities.

## Decision

**Chosen option**: Option 2: Full Separation with `sqlx` in Rust and `tauri-winrt-notification` on Windows.

## Rationale

Option 2 enforces a clean architecture, secures database access by stripping raw SQL permissions from the webview, eliminates unnecessary IPC roundtrips for Windows notifications, and establishes a modular, domain-driven Rust folder layout.

## Feature design

**Data model sketch**:
- `Workspace`: `id` (INTEGER PK), `name` (TEXT), `description` (TEXT), `is_favorite` (INTEGER), `show_in_global_tasks` (INTEGER), `created_at` (DATETIME), `updated_at` (DATETIME)
- `Shortcut`: `id` (INTEGER PK), `workspace_id` (INTEGER FK), `title` (TEXT), `type` (TEXT), `path` (TEXT), `browser_path` (TEXT), `is_pinned` (INTEGER), `created_at` (DATETIME), `updated_at` (DATETIME)
- `Note`: `id` (INTEGER PK), `workspace_id` (INTEGER FK), `title` (TEXT), `filename` (TEXT UNIQUE), `is_pinned` (INTEGER), `created_at` (DATETIME), `updated_at` (DATETIME)
- `Task`: `id` (INTEGER PK), `workspace_id` (INTEGER FK), `title` (TEXT), `description` (TEXT), `status` (TEXT), `due_date` (DATETIME), `created_at` (DATETIME)
- `AppSetting`: `key` (TEXT PK), `value` (TEXT), `updated_at` (DATETIME)

**API surface (Tauri Commands)**:

| Command Name | Module | Inputs | Outputs | Purpose |
|---|---|---|---|---|
| `get_workspaces` | `workspaces` | - | `Vec<Workspace>` | Fetch all workspaces |
| `create_workspace` | `workspaces` | `name`, `description`, `show_in_global_tasks` | `Workspace` | Create workspace |
| `update_workspace` | `workspaces` | `id`, `name`, `description`, `show_in_global_tasks` | `()` | Update workspace |
| `delete_workspace` | `workspaces` | `id` | `()` | Delete workspace |
| `toggle_workspace_favorite` | `workspaces` | `id`, `is_favorite` | `()` | Toggle favorite |
| `toggle_workspace_global_visibility` | `workspaces` | `id`, `is_visible` | `()` | Toggle global tasks visibility |
| `get_shortcuts` | `shortcuts` | `workspace_id` | `Vec<Shortcut>` | Fetch workspace shortcuts |
| `search_all_shortcuts` | `shortcuts` | - | `Vec<ShortcutWithWorkspace>` | Fetch all shortcuts with workspace name |
| `create_shortcut` | `shortcuts` | `workspace_id`, `title`, `type`, `path`, `browser_path`, `is_pinned` | `()` | Create shortcut |
| `update_shortcut` | `shortcuts` | `id`, `title`, `type`, `path`, `browser_path`, `is_pinned` | `()` | Update shortcut |
| `toggle_shortcut_pin` | `shortcuts` | `id`, `is_pinned` | `()` | Toggle shortcut pin |
| `move_shortcut` | `shortcuts` | `id`, `target_workspace_id` | `()` | Move shortcut |
| `delete_shortcut` | `shortcuts` | `id` | `()` | Delete shortcut |
| `get_notes` | `notes` | `workspace_id` | `Vec<Note>` | Fetch workspace notes metadata |
| `search_all_notes` | `notes` | - | `Vec<NoteWithWorkspace>` | Fetch all notes metadata |
| `create_note` | `notes` | `workspace_id`, `title`, `filename`, `is_pinned` | `()` | Create note metadata |
| `update_note` | `notes` | `id`, `title`, `filename`, `is_pinned` | `()` | Update note metadata |
| `toggle_note_pin` | `notes` | `id`, `is_pinned` | `()` | Toggle note pin |
| `update_note_timestamp` | `notes` | `id` | `()` | Touch note updated_at |
| `move_note` | `notes` | `id`, `target_workspace_id` | `()` | Move note metadata |
| `delete_note` | `notes` | `id` | `()` | Delete note metadata |
| `get_tasks_by_workspace` | `tasks` | `workspace_id` | `Vec<Task>` | Fetch tasks for a workspace |
| `get_all_global_tasks` | `tasks` | - | `Vec<TaskWithWorkspace>` | Fetch global tasks |
| `get_all_tasks_for_timeline` | `tasks` | - | `Vec<TaskWithWorkspace>` | Fetch timeline tasks |
| `create_task` | `tasks` | `workspace_id`, `title`, `description`, `due_date` | `()` | Create task |
| `update_task_status` | `tasks` | `id`, `status` | `()` | Update task status |
| `update_task` | `tasks` | `id`, `title`, `description`, `due_date`, `status` | `()` | Update task |
| `delete_task` | `tasks` | `id` | `()` | Delete task |
| `show_startup_agenda` | `settings` | `today` (String: YYYY-MM-DD) | `TaskSummary` | Send Windows OS notification & return counts |
| `get_app_setting` | `settings` | `key` | `Option<String>` | Get app setting key |
| `set_app_setting` | `settings` | `key`, `value` | `()` | Set app setting key |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Startup Agenda | `tasksDueToday` & `totalTasksRemaining` | SQLite `tasks` table query in Rust |
| Startup Agenda Notification | Windows OS Toast Notification | `tauri-winrt-notification` crate on Windows |
| Autostart preference sync | Enables/disables autostart | SQLite `app_settings` table key `autostart_preference` |

**Security model**:
- Raw SQL execution permissions removed from frontend capabilities (`capabilities/default.json`).
- Webview can only invoke explicitly registered Tauri commands.

**Critical test scenarios**:
- Workspaces CRUD: Create, read, update, delete workspace via Tauri command, verifies **AC-1**, **AC-2**.
- Startup agenda notification: Call `show_startup_agenda("2026-08-07")`, verifies Windows toast is displayed and summary struct is returned, verifies **AC-4**, **AC-5**.
- Autostart sync: App startup reads autostart preference from SQLite in Rust, verifies **AC-6**.

## Migration plan

**Strategy**: Big bang refactor across data service boundary, maintaining Pinia store method signatures.
**Phases**:
1. Add `sqlx` and `tauri-winrt-notification` to `Cargo.toml` and remove `tauri-plugin-notification`.
2. Create Rust `db.rs`, `models/`, and `commands/` domain modules.
3. Update `lib.rs` to initialize `sqlx` pool, register `DbState`, sync autostart on boot, and export commands.
4. Refactor frontend service files (`src/services/*.ts`) to call Tauri `invoke`.
5. Remove `@tauri-apps/plugin-sql` direct calls in `db.ts` and restrict `capabilities/default.json`.

## Build plan

1. [x] Configure `Cargo.toml` with `sqlx = { version = "0.8", features = ["runtime-tokio", "sqlite"] }` and `tauri-winrt-notification = "0.2"` (Windows target), remove `tauri-plugin-notification`, satisfies **AC-1**, **AC-4**.
2. [x] Implement `src-tauri/src/db.rs` for `SqlitePool` connection and `DbState`, satisfies **AC-1**, **AC-7**.
3. [x] Implement model structs in `src-tauri/src/models/` (`workspace.rs`, `shortcut.rs`, `note.rs`, `task.rs`, `setting.rs`), satisfies **AC-1**, **AC-7**.
4. [x] Implement domain commands in `src-tauri/src/commands/` (`workspaces.rs`, `shortcuts.rs`, `notes.rs`, `tasks.rs`, `settings.rs`, `window.rs`), satisfies **AC-1**, **AC-4**, **AC-5**, **AC-6**, **AC-7**.
5. [x] Update `src-tauri/src/lib.rs` setup block and invoke handler, satisfies **AC-1**, **AC-6**, **AC-7**.
6. [x] Refactor frontend services in `src/services/` to use Tauri `invoke`, satisfies **AC-2**, **AC-3**, **AC-5**.
7. [x] Update `src-tauri/capabilities/default.json` to remove raw SQL and notification permissions, satisfies **AC-3**.
8. [x] Clean up unused frontend helper functions and direct OS/DB imports (`@tauri-apps/plugin-sql`, `@tauri-apps/plugin-notification`), satisfying **AC-8**.
9. [x] Generate end-to-end type-safe TypeScript bindings in `src/bindings.ts` using `tauri-specta`, satisfying **AC-9**.

## Consequences

**Positive**:
- Pure separation of concerns between Rust backend and Vue frontend.
- Direct native Windows toast notifications with zero IPC bridge overhead.
- Restricts webview permissions by removing raw SQL capability.
- Scalable, modular domain folder layout in Rust.

**Negative**:
- All data access functions require a Rust command handler and `sqlx` query mapping.
