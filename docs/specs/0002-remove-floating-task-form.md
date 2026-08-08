# 0002. Remove quick task creation from floating command bar

**Date**: 2026-08-08
**Status**: Accepted

## Summary

This decision simplifies the Floating Command Bar by removing the quick task creation form and mode toggle. The Floating Command Bar will now exclusively function as a fast quick access launcher and search interface for notes and shortcuts. Removing unused secondary modes keeps the floating window light, fast, and focused on instant search.

## Context

The Floating Command Bar originally supported two modes: global search and quick task creation. In actual daily usage, task creation is handled primarily within workspace task boards and timeline views in the main application. The quick task mode in the floating window added unnecessary UI complexity, such as mode indicators, dynamic height resizing, transition animations, and extra hotkey handlers. Removing this feature stream-lines the floating launcher and reduces maintenance overhead.

## Requirements

**User stories**:
- As a user, I want the Floating Command Bar to open directly into search and quick access without any mode distraction.
- As a user, I want a clean floating interface with streamlined keyhints and fixed compact window dimensions.

**Acceptance criteria**:
- **AC-1**: Delete `FloatingTaskForm.vue` component and all unused quick task state (task title, description, due date, target workspace selection).
- **AC-2**: Simplify `FloatingHeader.vue` by removing mode indicator buttons and mode switching transitions, displaying only the search input field.
- **AC-3**: Simplify `FloatingFooter.vue` by removing the `Ctrl+Tab` mode switch keyhint and mode props.
- **AC-4**: Simplify `FloatingCommandBar.vue` to always operate in search mode, removing `mode` state, `toggleMode`, and dynamic height calculations.
- **AC-5**: Keep the floating window fixed at 420px height for optimal search display.

## Options considered

### Option 1: Remove Quick Task mode and simplify Floating Command Bar

Completely remove `FloatingTaskForm.vue` and mode switching logic, dedicated 100% to search and quick access launcher.
**Pros**:
- Cleans up unused code and eliminates dynamic resizing complexity.
- Streamlines header and footer UI for faster keyboard interaction.
**Cons**:
- Users can no longer create tasks directly from the floating window (tasks must be created in the main window).

### Option 2: Retain Quick Task mode behind a settings toggle

Keep the code in place but allow users to hide/show the quick task mode via application settings.
**Pros**:
- Retains feature for hypothetical future use.
**Cons**:
- Increases code complexity and dead weight without real user demand.

## Decision

**Chosen option**: Option 1: Remove Quick Task mode and simplify Floating Command Bar

We will completely remove the unused quick task mode from the Floating Command Bar and focus it exclusively on search and quick launcher capabilities.

**Implementation skills**: `vue` (`antfu/skills`, `.agents/skills/vue/`)

## Rationale

The primary value proposition of the Floating Command Bar (accessed via `Alt+W`) is instant access to pinned notes and shortcuts. Task management is fundamentally a context-rich activity best performed inside workspace boards. Removing the quick task mode eliminates clutter, reduces bundle size, and simplifies keyboard shortcuts.

## Feature design

**Component simplification**:
- Delete `src/components/floating/FloatingTaskForm.vue`
- Update `FloatingHeader.vue`: Remove `mode` prop, `animationName` prop, `toggle-mode` emit, and transition wrappers. Render search input directly.
- Update `FloatingFooter.vue`: Remove `mode` prop and `Ctrl+Tab` shortcut display. Show `Ctrl+W` and `Enter` key hints only.
- Update `FloatingCommandBar.vue`: Remove `mode`, `taskTitle`, `taskDescription`, `taskDueDate`, `targetWorkspaceId`, `submitQuickTask`, `toggleMode`, and `useTaskStore` import. Fixed window height at 420px.

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Floating Header | Search input string | Vue `v-model` binding |
| Floating Footer | Keyhints | Static UI template |

**Key invariants**:
- The Floating Command Bar strictly operates in search mode.
- `Alt+W` opens the floating window directly focused on the search input.

**Security model**:
Local desktop interface only.

## Migration plan

**Strategy**: no migration needed (pure UI code cleanup).
**Phases**:
1. Remove component file and refactor Vue components.
**Rollback**: Revert git commits.
**Risks**: None.

## Build plan

1. Delete `src/components/floating/FloatingTaskForm.vue`, satisfies **AC-1**
2. Update `src/components/floating/FloatingHeader.vue` to remove mode toggle UI and transitions, satisfies **AC-2**
3. Update `src/components/floating/FloatingFooter.vue` to remove mode switch keyhint, satisfies **AC-3**
4. Refactor `src/components/floating/FloatingCommandBar.vue` to strip task form logic and set fixed window height, satisfies **AC-4, AC-5**

## Consequences

**Positive**:
- Simpler, cleaner, and faster Floating Command Bar.
- Reduced maintenance burden and less code weight.

**Negative / tradeoffs**:
- Quick task creation from `Alt+W` popup is no longer available (tasks are created via Main Window dashboard/workspace view).

**Neutral**:
- `taskStore` is still used in the main window for all task board capabilities.
