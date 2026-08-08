# 0002. Setting Modal and Startup

**Date**: 2026-08-06
**Status**: Accepted

## Summary

Nook needs a settings panel and a launch at startup preference. This decision adds a setting modal to the sidebar footer and handles startup launch behavior. The main window will show immediately on manual launches but will start hidden in the system tray when opened by the operating system startup sequence.

## Requirements

**User stories**:
- As a Nook user, I want the application to automatically start when my computer boots so that I do not have to open it manually.
- As a Nook user, I want to open a settings dialog from the sidebar footer so that I can toggle startup preferences and view the current version.
- As a Nook user, I want manual launches to show the main window immediately, while startup launches remain hidden in the tray, so that my desktop remains clear on boot.

**Acceptance criteria**:
- **AC-1**: The sidebar footer contains a Settings button with an icon and text, replacing the hardcoded version badge.
- **AC-2**: Clicking the Settings button opens a modal showing the application version and a toggle switch for Launch at startup.
- **AC-3**: The Launch at startup toggle reads and writes its state directly to the operating system startup registry using the autostart plugin.
- **AC-4**: If Nook is opened automatically during operating system boot (via the `--autostart` command line flag), both the main and floating windows remain hidden.
- **AC-5**: If Nook is opened manually (without the `--autostart` flag), the main window is shown and focused immediately during startup.

## Decision

**Chosen option**: Option 1: Official autostart plugin (tauri-plugin-autostart)

We will use the official Tauri autostart plugin with the `--autostart` argument.

**Implementation skills**: `tauri-v2` (`nodnarbnitram/claude-code-extensions`, `.agents/skills/tauri-v2/`) · `vue` (`antfu/skills`, `.agents/skills/vue/`)

## Rationale

Reasoning and options: see [rationale.md](rationale.md)

## Feature design

**Data model sketch**:
No database tables or fields are needed since the autostart setting is stored directly in the operating system registry.

**API surface**:
No custom endpoints are needed. The frontend communicates with the Rust backend via the `@tauri-apps/plugin-autostart` package APIs. We will need to update Tauri capabilities in `capabilities/default.json` to allow the following permissions:
- `autostart:allow-enable`
- `autostart:allow-disable`
- `autostart:allow-is-enabled`
- `core:app:allow-version`

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Load Settings Modal | Application version | Dynamic value from Tauri `getVersion()` |
| Load Settings Modal | Launch at startup toggle status | Dynamic query from Tauri autostart plugin `isEnabled()` |
| Toggle autostart switch | Registry entry state | Autostart plugin `enable()` / `disable()` |
| Startup check | Main window visibility | Command line arguments parsed in Rust `std::env::args()` |

**Key invariants**:
- The autostart registry entry path must point to the current executable path of Nook.
- If `--autostart` is in the startup arguments, the main window must not be shown.

**Security model**:
Tauri permissions restrict autostart registry writes. Only the settings modal and the autostart plugin are allowed to modify the startup status.

**Configuration required**:
No new environment variables are needed.

**Critical test scenarios**:
- Happy path: Opening the settings modal shows the correct app version and allows toggling the autostart switch, verifies **AC-1**, **AC-2**, **AC-3**
- Startup launch: Launching the app with the `--autostart` command line flag keeps the main window hidden, verifies **AC-4**
- Manual launch: Launching the app without the `--autostart` flag shows and focuses the main window immediately, verifies **AC-5**

## Build plan

1. Add `@tauri-apps/plugin-autostart` to `package.json` dependencies and `tauri-plugin-autostart` to `Cargo.toml` dependencies, satisfies **AC-3**
2. Register the autostart plugin in `src-tauri/src/lib.rs` and pass the `--autostart` argument to its initialization, satisfies **AC-3**, **AC-4**
3. Update `src-tauri/capabilities/default.json` to allow permissions for autostart (`autostart:allow-enable`, `autostart:allow-disable`, `autostart:allow-is-enabled`) and app info (`core:app:allow-version`), satisfies **AC-2**, **AC-3**
4. Update `setup` hook in `src-tauri/src/lib.rs` to parse CLI arguments, showing and focusing the main window if `--autostart` is absent, satisfies **AC-5**
5. Create a Vue settings modal component (`SettingsModal.vue`) using Nuxt UI components containing the version badge and autostart toggle, satisfies **AC-2**, **AC-3**
6. Update `WorkspaceSidebar.vue` to replace the version badge with a settings button that opens the settings modal, satisfies **AC-1**

## Consequences

**Positive**:
- Users can choose to run the app in the background from startup.
- Settings are cleanly triggered from the footer of the sidebar.
- Windows are hidden appropriately on boot.

**Negative / tradeoffs**:
- New plugin dependency added.

**Neutral**:
- Registry manipulation happens implicitly via Tauri plugins.
