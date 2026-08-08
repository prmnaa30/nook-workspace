# Tauri Backend

## Overview

This area houses the Rust backend code for the desktop app. It handles operating system integrations including window visibility, tray menus, database migrations, and global hotkeys.

## Key files

| File | Owns |
|---|---|
| [src/lib.rs](src/lib.rs) | Core Tauri application builder, plugin setup, window event handling |
| [src/commands.rs](src/commands.rs) | Custom Rust command handlers invoked from the frontend |
| [src/notes.rs](src/notes.rs) | File system operations for reading, writing, and organizing markdown notes |
| [src/ws_server.rs](src/ws_server.rs) | WebSocket server implementation for communication with the browser extension |
| [migrations/](migrations/) | SQL migration scripts executed sequentially by tauri-plugin-sql |

## Commands

```bash
# Run backend dev mode
cargo tauri dev

# Build production app
cargo tauri build
```

## Conventions

- Add new commands in `src/commands.rs` or specialized modules like `src/notes.rs`.
- Register all commands in `src/lib.rs` under the generate_handler macro.
- Execute database migrations sequentially using tauri-plugin-sql builder setup.
- Run desktop specific logic behind conditional compilation flags.
- Return result types matching JSON serializable structures from all public command handlers.

## Gotchas

- Window close requests are intercepted and hidden instead of destroyed (see window event handler).
- The WebSocket server attempts to bind to fallback ports in order (from 14231 to 14235).
- Alt + W shortcut is registered globally to toggle visibility of the floating search window.

## Agent skills

- [tauri-v2](../.agents/skills/tauri-v2/): `nodnarbnitram/claude-code-extensions`, tauri v2 backend and permissions configuration

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
