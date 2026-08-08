# 0007. Fix Notes Deserialization and Legacy Path Resolution

**Date**: 2026-08-08
**Status**: Accepted

## Summary

This decision resolves an issue where notes disappeared for users upgrading from version 1.3.2 to 1.4.0. The root cause was twofold: a Rust type mismatch where nullable database columns failed deserialization in sqlx, and incomplete directory path fallbacks during file resolution. By setting `is_pinned` as `Option<i64>` in Rust models with a fallback value of `0` (`false`) and adding multi-path fallback resolution, notes will load reliably across version upgrades without data loss and without needing manual DB startup queries.

## Context

During the version 1.4.0 refactor, data management was migrated from Vue/frontend plugins to a native Rust backend using sqlx. In this refactor, the `Note` struct in `src-tauri/src/models/note.rs` defined `is_pinned` as a non-optional `i64`. However, existing SQLite databases created in version 1.3.2 or earlier lacked non-null values for `is_pinned` across all rows. When sqlx queried the database using `sqlx::query_as::<_, Note>`, encountering a `NULL` value resulted in a runtime deserialization error. Because the frontend error handler `unwrapArrayResult` swallowed IPC error responses silently, the UI received an empty array and displayed zero notes to the user.

Additionally, file path resolution in `resolve_and_migrate_note` checked for legacy files only within `~/.nook/notes/`, omitting the older `~/.workstation_data/notes/` directory path used in earlier releases.

## Requirements

**User stories**:
- As a user upgrading from version 1.3.2 to 1.4.0+, I want all my existing notes to appear in the workspace UI so that no notes are lost or hidden.
- As a user opening a note created in an older version, I want the note content to load correctly regardless of whether the file was stored under legacy directories or new workspace subfolders.

**Acceptance criteria**:
- **AC-1**: `Note` and `NoteWithWorkspace` Rust structs deserialize `is_pinned` as `Option<i64>` with a default fallback of `0` (`false`) so that legacy rows containing `NULL` decode cleanly without query failure.
- **AC-2**: `resolve_and_migrate_note` checks both `~/.nook/notes/` and `~/.workstation_data/notes/` legacy directory paths when searching for note files on disk.
- **AC-3**: Frontend service helper `unwrapArrayResult` logs backend error payloads to console before returning fallback defaults so that IPC errors are observable during development and debugging.

## Options considered

### Option 1: Struct optionality (`Option<i64>`) with default fallback and multi-path file resolution (Recommended)

Update Rust model structs to use `Option<i64>` for `is_pinned` (which treats `NULL` as `None` / `0` automatically), and extend `resolve_and_migrate_note` to check `~/.workstation_data/notes/` as well as `~/.nook/notes/`. Also update `unwrapArrayResult` to log IPC errors to console.

**Pros**:
- Completely backward-compatible with any database state or folder layout.
- No extra startup SQL queries or database write overhead on app launch.
- Prevents silent failures in the frontend.

**Cons**:
- Requires minor updates across Rust models and path resolution functions.

### Option 2: Run a manual SQL backfill UPDATE query on every app startup

Execute an `UPDATE notes SET is_pinned = 0 WHERE is_pinned IS NULL;` query during backend setup on app startup.

**Pros**:
- Forces DB values to non-null integers.

**Cons**:
- Unnecessary write overhead on app startup.
- Unneeded if Rust models use `Option<i64>` with `unwrap_or(0)` / `None` fallback.

## Decision

**Chosen option**: Option 1: Struct optionality (`Option<i64>`) with default fallback and multi-path file resolution

Update `src-tauri/src/models/note.rs` to use `pub is_pinned: Option<i64>`, update path resolution in `src-tauri/src/commands/notes.rs`, and improve IPC error logging in `src/services/notes.service.ts`.

## Rationale

Option 1 is cleaner and more efficient. By declaring `is_pinned: Option<i64>`, Rust's `sqlx` safely deserializes legacy rows containing `NULL` as `None`, which defaults to `0` (`false`) in application logic. This completely avoids the need for extra startup SQL update queries while ensuring full backward compatibility. Adding `~/.workstation_data/notes/` to `resolve_and_migrate_note` ensures legacy markdown files are detected and migrated cleanly.

## Feature design

**Data model sketch**:
```rust
pub struct Note {
    pub id: i64,
    pub workspace_id: i64,
    pub title: String,
    pub filename: String,
    pub is_pinned: Option<i64>, // Handles NULL safely, unwrap_or(0) -> false
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}
```

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| get_notes | IPC | workspace_id: i64 | Vec<Note> | Local | DB_ERROR |
| search_all_notes | IPC | none | Vec<NoteWithWorkspace> | Local | DB_ERROR |
| read_note | IPC | workspace_id: i64, filename: String | String | Local | NOTE_FILE_MISSING |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| get_notes | list of notes | SELECT * FROM notes WHERE workspace_id = ? |
| read_note | raw markdown content | file on disk resolved via resolve_and_migrate_note |

**Key invariants**:
- Deserialization of `Note` must never fail due to `NULL` in `is_pinned` or optional columns.
- File resolution must check workspace folder first, then `~/.nook/notes/`, then `~/.workstation_data/notes/`.

**Security model**:
Local desktop storage; operations constrained to home directory path resolution.

**Critical test scenarios**:
- Existing note row with `is_pinned = NULL` deserializes cleanly into `Note` struct with `is_pinned: None` (evaluated as `0` / `false`), verifies **AC-1**
- File residing in `~/.workstation_data/notes/file.md` is detected, migrated to `~/.nook/notes/<workspace_id>/file.md`, and read successfully, verifies **AC-2**
- Backend IPC error is logged to browser console when unwrapArrayResult handles an error response, verifies **AC-3**

## Build plan

1. Update `Note` and `NoteWithWorkspace` structs in `src-tauri/src/models/note.rs` to set `pub is_pinned: Option<i64>`, satisfies **AC-1**
2. Update `resolve_and_migrate_note` in `src-tauri/src/commands/notes.rs` to check legacy path `~/.workstation_data/notes/` if file is not found in `~/.nook/notes/`, satisfies **AC-2**
3. Update `unwrapArrayResult` in `src/services/notes.service.ts` to output `console.error` on IPC error responses, satisfies **AC-3**

## Consequences

**Positive**:
- Clean, zero-overhead solution for legacy database rows.
- Users upgrading from v1.3.2 see all notes load properly.
- Legacy notes are seamlessly migrated to workspace subfolders on disk.
- Frontend IPC errors become visible in devtools console.

**Negative / tradeoffs**:
- Requires `is_pinned` handling in frontend to fall back to `0` or `false` if `null`/`undefined`.

**Neutral**:
- Legacy `.workstation_data` folder remains readable for seamless backward migration.

## Migration plan

**Strategy**: Fix in place with safe schema fallback
**Phases**:
1. Update Rust `Note` model struct to use `Option<i64>` for `is_pinned`.
2. Add legacy path checking for `~/.workstation_data/notes/` in Rust file resolver.
3. Update frontend unwrap helper to log errors.
**Rollback**: Revert code changes; database schema remains compatible.
**Risks**: Low risk since changes add optionality and fallbacks rather than removing data.

## References

**Project sources**:
- `AGENTS.md`
- `docs/specs/0005-backend-architecture-refactor/index.md`
