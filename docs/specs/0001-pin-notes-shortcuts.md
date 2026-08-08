# 0001. Pin notes and shortcuts to floating command bar

**Date**: 2026-08-06
**Status**: Accepted

## Summary

This enhancement introduces a "pin" toggle for notes and shortcuts to declutter the default state of the Floating Command Bar. By default, the command bar will only show items that the user has explicitly pinned, making it a true quick-access launcher. Users can still find all unpinned notes and shortcuts by typing a search query.

## Context

As the number of notes and shortcuts grows, the default view of the Floating Command Bar (when opened without a search query) becomes extremely cluttered. This degrades its primary utility as an instant, fast launcher for frequently used items. Without a mechanism to filter the default view, users are forced to sift through an unfiltered list of all items across all workspaces. A pinning mechanism resolves this by allowing users to curate their quick-access list while keeping the global search functional.

## Requirements

**User stories**:
- As a user, I want to pin my most frequently used notes and shortcuts so that they appear immediately in the Floating Command Bar when I open it.
- As a user, I want the default view of the Floating Command Bar to remain clean, showing only pinned items or a helpful empty state if none exist.
- As a user, I want to still be able to search for any note or shortcut, whether pinned or not, by simply typing a query.

**Acceptance criteria**:
- **AC-1**: Note and shortcut creation/edit modals include a "Pin to Quick Access" toggle switch (default: false for new items).
- **AC-2**: When the Floating Command Bar is opened and the search query is empty, only notes and shortcuts with `is_pinned = true` are displayed.
- **AC-3**: When the Floating Command Bar has an empty query and no pinned items exist, it displays the text: "No pinned items. Click the pin icon in the main window to add quick access items here."
- **AC-4**: When a search query is entered in the Floating Command Bar, all matching notes and shortcuts are displayed regardless of their pin status.
- **AC-5**: Clicking a pin icon on the main notes/shortcuts list view toggles the pin status directly.
- **AC-6**: Items displayed in the Floating Command Bar (both pinned in default view and searched items) must be visually grouped by their respective workspaces.

## Options considered

### Option 1: Pinning per individual item (Note/Shortcut)

Add a boolean flag (`is_pinned`) to each note and shortcut.
**Pros**:
- High granularity; users curate exactly what they need.
- Directly solves clutter within a single large workspace.
**Cons**:
- Requires updating the database schema for notes and shortcuts.

### Option 2: Pinning per entire Workspace

Filter the Floating Command Bar to only show items from active or "pinned" workspaces.
**Pros**:
- Simpler to implement on the frontend.
**Cons**:
- Fails to solve clutter if a pinned workspace contains many notes or shortcuts.
- All-or-nothing approach lacks the necessary precision.

## Decision

**Chosen option**: Option 1: Pinning per individual item (Note/Shortcut)

We will add a pinning toggle to individual notes and shortcuts, storing this state as a boolean flag in the database, to give users precise control over their Floating Command Bar default view.

**Implementation skills**: `vue` (`antfu/skills`, `.agents/skills/vue/`)

## Rationale

Pinning at the item level is the only approach that effectively solves the clutter problem as workspaces grow. While pinning a whole workspace might seem easier, it quickly breaks down when a workspace accumulates dozens of items. The per-item approach mirrors established paradigms (like browser bookmarks or pinned tabs) and guarantees a clean, intention-driven default view in the command bar.

## Feature design

**Data model sketch**:
- Table `notes`: Add column `is_pinned` (BOOLEAN DEFAULT 0 NOT NULL)
- Table `shortcuts`: Add column `is_pinned` (BOOLEAN DEFAULT 0 NOT NULL)
- Rust structs `Note`, `SearchNote`, `Shortcut`, `SearchShortcut`: Add `is_pinned: bool`
- Frontend stores `notes.ts`, `shortcuts.ts`: Add `is_pinned: boolean`

**API surface**:
| Endpoint (Tauri Command) | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `toggle_note_pin` | INVOKE | note_id, is_pinned | success | N/A | SQL Error |
| `toggle_shortcut_pin` | INVOKE | shortcut_id, is_pinned | success | N/A | SQL Error |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Floating Command Bar default view | List of items | Filtered from frontend stores based on `is_pinned` flag |
| Search results view | List of matching items | Filtered from frontend stores regardless of `is_pinned` flag |

**Key invariants**:
- The empty state text only appears if the search query is strictly empty and the filtered pinned list has 0 items.
- A search query overrides the `is_pinned` filter, executing a match against the full list.

**Security model**:
Local SQLite access only.

## Migration plan

**Strategy**: no migration needed (simple SQL schema alteration on local DB via tauri-plugin-sql migration).
**Phases**:
1. Add a new `.sql` file in `src-tauri/migrations/` (e.g., `4_add_is_pinned_flags.sql`) containing:
   `ALTER TABLE notes ADD COLUMN is_pinned BOOLEAN DEFAULT 0 NOT NULL;`
   `ALTER TABLE shortcuts ADD COLUMN is_pinned BOOLEAN DEFAULT 0 NOT NULL;`
**Rollback**: Standard SQLite downgrade if supported by the migration runner, otherwise fallback to local backup.
**Risks**: Minor risk of sqlite altering table lock if the app is heavily reading during startup, but negligible for this scale.

## Build plan

1. Create database migration `4_add_is_pinned.sql` in `src-tauri/migrations/` to add `is_pinned` column to `notes` and `shortcuts`, satisfies **AC-1, AC-2**
2. Update Rust commands and structs in `src-tauri/src/commands.rs` (and modules) to handle reading and toggling `is_pinned`, satisfies **AC-1, AC-5**
3. Update frontend services (`notes.service.ts`, `shortcuts.service.ts`) and stores to manage `is_pinned` state, satisfies **AC-1, AC-5**
4. Update UI modals (`ShortcutFormModal.vue`, `NoteFormModal.vue` / note creation) to include the pin toggle switch, satisfies **AC-1**
5. Update Main UI lists (Notes tab, Shortcuts tab) to display a toggleable pin icon next to items, satisfies **AC-5**
6. Modify `FloatingCommandBar.vue` filtering logic: return only `is_pinned` items when query is empty, and return all matching items when query exists, satisfies **AC-2, AC-4**
7. Add empty state UI text in `FloatingSearchResults.vue` (or Command Bar) when no query and no pinned items, satisfies **AC-3**
8. Update `FloatingSearchResults.vue` UI to group the rendered items by workspace name, rather than displaying a flat list, satisfies **AC-6**

## Consequences

**Positive**:
- The Floating Command Bar becomes a highly efficient, curated launcher.
- Resolves the clutter problem permanently.

**Negative / tradeoffs**:
- Users must manually curate (pin) items they want in the launcher; otherwise, it will appear empty by default.

**Neutral**:
- Requires a database migration on user update.
