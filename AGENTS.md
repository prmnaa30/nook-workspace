# Nook

## Stack

- **Language / Runtime**: TypeScript, Node 22, Rust 1.75 or later
- **Framework**: Vue 3, Vite, Tauri 2
- **Key dependencies**: @tauri-apps/api, @tauri-apps/plugin-notification, @nuxt/ui, Pinia, Yjs, tauri-plugin-sql
- **Package manager**: npm

## Build approach

- Tracer Bullet (prove the whole pipe works before building any part of it fully).

## Commands

```bash
# Install
npm install

# Dev server
npm run dev
npm run tauri dev

# Build
npm run build
npm run tauri build

# Test
# No test runner configured yet
```

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title.md`.

## Rules

- Use Vue 3 Composition API with script setup and TypeScript.
- Keep state in Pinia stores, call services directly from stores, not components.
- Use Nuxt UI components and Tailwind CSS classes for application styling.
- Query SQLite database via tauri-plugin-sql in frontend services.
- Define Tauri commands in Rust src-tauri, register them in lib.rs handler.
- Manage desktop windows, system tray, and shortcuts in the Rust backend.
- Connect the Chrome extension via the WebSocket server running on fallback ports.

## Agent skills

- [tauri-v2](.agents/skills/tauri-v2/): `nodnarbnitram/claude-code-extensions`, tauri v2 configuration and commands
- [vue](.agents/skills/vue/): `antfu/skills`, vue 3 composition and pinia store conventions
- [tailwindcss](.agents/skills/tailwindcss/): `hairyf/skills`, tailwind css layout and styling utilities

Declined: sqlite
MCP servers: tailwindcss-mcp-server (recommended), tauri-plugin-mcp (recommended), vite-plugin-vue-mcp (recommended)

## Context files

- [src-tauri/AGENTS.md](src-tauri/AGENTS.md): Tauri backend in Rust managing system tray, global hotkeys, database migrations, and WebSocket communication

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
