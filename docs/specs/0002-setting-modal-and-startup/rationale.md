# 0002. Setting Modal and Startup - Rationale

## Context

Currently, Nook starts hidden and relies on the user clicking the tray icon or using a shortcut to reveal the main window. There is no user interface for application configuration, and the version badge is hardcoded in the sidebar. Users want Nook to run in the background on system startup without manually launching it, but they also expect the main window to be visible immediately when they launch the application manually.

## Options considered

### Option 1: Official autostart plugin (tauri-plugin-autostart)

This option adds the official Tauri v2 plugin. It provides a simple Javascript API to query and toggle the registry state on Windows and handles launcher setup on other platforms. It supports custom command line arguments.

**Pros**:
- Standard cross-platform solution maintained by the Tauri team.
- Exposes direct JavaScript bindings for the frontend.
- Built-in support for passing arguments like `--autostart`.

**Cons**:
- Adds a new dependency in Cargo.toml and package.json.

### Option 2: Custom registry manipulation in Rust

This option implements custom registry code in the Rust backend to manage the Windows Run key.

**Pros**:
- No additional plugin dependencies needed.

**Cons**:
- Windows-specific, meaning we have to write platform-specific code.
- Must expose custom Tauri command handlers to the frontend.

## Rationale

The official autostart plugin provides a clean, pre-built abstraction that integrates directly into Tauri v2's system. It handles OS-level setup safely on Windows, macOS, and Linux, which aligns with Nook's cross-platform architecture. By using this plugin, we avoid writing custom registry manipulation code, reducing security risks and maintenance overhead. The `--autostart` command-line argument will be used to detect whether the app was opened by the system startup, allowing the backend to conditionally show the main window on manual boot.
