# 0003. Update Checker (Manual and Auto)

**Date**: 2026-08-07
**Status**: In Progress

## Summary

Nook requires a manual and automatic update checking mechanism using GitHub Releases. The application queries the GitHub Release API to determine if a newer version is available. When a new version is detected, Nook notifies the user via native Windows OS-Level Notifications (`tauri-winrt-notification` crate in Rust backend) without cluttering the UI with floating in-app toasts. For manual checks in the Settings Modal, inline status text displays instant feedback.

## Requirements

**User stories**:
- As a Nook user, I want the application to automatically check for updates on startup (at most once per day) so that I stay informed about new releases via native Windows notifications.
- As a Nook user, I want a manual "Check for updates" button in the Settings Modal with clear inline status feedback so that I can immediately check for updates anytime without toast popups.
- As a Nook user, I want OS-level notifications powered by Windows WinRT toast to notify me when an update is available so that clicking it opens the release download page.

**Acceptance criteria**:
- **AC-1**: Clicking "Check for updates" in Settings Modal queries `https://api.github.com/repos/prmnaa30/nook-workspace/releases/latest` and displays inline status text next to the button ("Up to date (v1.4.0)" or "v1.5.0 Available").
- **AC-2**: On app startup, Nook checks the `last_update_check_at` timestamp in SQLite database `workstation.db`. If more than 24 hours have passed (or on first check), it queries the GitHub Releases API automatically.
- **AC-3**: After an automatic or manual check, the `last_update_check_at` timestamp in SQLite database `workstation.db` is updated.
- **AC-4**: If a newer version string is returned by the release API (e.g. `v1.5.0` > current app version `v1.4.0`), Nook triggers an OS-Level Notification using native `tauri-winrt-notification` in the Rust backend. No floating in-app toasts are displayed.
- **AC-5**: Clicking the update notification or release button uses Tauri `opener:open_url` to open the GitHub Release URL in the user's default web browser (`https://github.com/prmnaa30/nook-workspace/releases/tag/<tag_name>`).

## Decision

**Chosen option**: Native Windows WinRT OS Notification (`tauri-winrt-notification`) + Direct GitHub Releases API query with SQLite timestamp throttling.

We will query `https://api.github.com/repos/prmnaa30/nook-workspace/releases/latest` from the update service, store check timestamps in SQLite (`workstation.db`), trigger native Windows Toast Notifications directly via `tauri-winrt-notification` (single Rust package in backend), and use `@tauri-apps/plugin-opener` to open release links in default browser. In-app toasts are removed in favor of OS notifications for background checks and inline status text for manual modal checks.

**Implementation skills**: `tauri-v2` (`nodnarbnitram/claude-code-extensions`, `.agents/skills/tauri-v2/`) · `vue` (`antfu/skills`, `.agents/skills/vue/`)

## Rationale

Reasoning and options: see [rationale.md](rationale.md)

## Feature design

**Data model sketch**:
Table: `app_settings` (Migration 06)
- `key` (TEXT PRIMARY KEY)
- `value` (TEXT)
- `updated_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

Keys used:
- `last_update_check_at`: ISO-8601 timestamp string of last check
- `latest_known_version`: Version string of latest release found
- `autostart_preference`: User explicit autostart setting ('enabled' | 'disabled')

**API surface**:
| Endpoint / Command | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `https://api.github.com/repos/prmnaa30/nook-workspace/releases/latest` | GET | Header `Accept: application/vnd.github.v3+json` | `tag_name`, `html_url`, `published_at` | None | 404, 403 (rate limit), Network Error |
| `show_update_notification` | Tauri Command (Rust) | `version: String, url: String` | `Result<(), String>` | Local | WinRT API Error |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Query update API | Latest release tag & html_url | GitHub API `tag_name`, `html_url` |
| Frequency check | Hours since last check | SQLite `app_settings.last_update_check_at` |
| Version comparison | Has update boolean | Semver comparison (`latest_version` > `app_version`) |
| OS Notification | Native Windows WinRT Toast | Rust `tauri-winrt-notification` command |
| Open release link | Browser navigation | `@tauri-apps/plugin-opener` `openUrl(html_url)` |

**Key invariants**:
- Automatic update checks must not run more than once per 24-hour period.
- Version string comparison must strip leading `v` prefixes (e.g. `v1.5.0` vs `1.4.0`).
- Notifications must be OS-level only using `tauri-winrt-notification` single Rust package; no floating frontend toast banners.

**Security model**:
No authentication required for public GitHub Releases. Requests are read-only GET requests over HTTPS.

**Configuration required**:
No new environment variables required. Repository path is target `prmnaa30/nook-workspace`.

**Critical test scenarios**:
- Manual check when up-to-date: Displays inline text "Up to date (v1.4.0)", verifies **AC-1**, **AC-3**
- Manual check when new version exists: Displays inline text "v1.5.0 Available" with direct link button and triggers OS notification, verifies **AC-1**, **AC-4**, **AC-5**
- Automatic check throttling: Does not query API if less than 24 hours elapsed since `last_update_check_at`, verifies **AC-2**
- Automatic check trigger: Queries API and triggers native Windows OS Notification when >24 hours elapsed and update is available, verifies **AC-2**, **AC-3**, **AC-4**

## Build plan

1. Register Tauri command `show_update_notification` in `src-tauri/src/lib.rs` using `tauri-winrt-notification` crate (single Rust package, zero extra frontend notification plugins), satisfies **AC-4**
2. Remove `@tauri-apps/plugin-notification` npm package and capability permissions, keeping frontend dependency clean, satisfies **AC-4**
3. Update `src/services/update.service.ts` to invoke `show_update_notification` for OS-level alerts, satisfies **AC-4**
4. Update `SettingsModal.vue` to replace floating toast with inline status text next to the check button, satisfies **AC-1**, **AC-5**
5. Update `App.vue` startup check to use OS-level notification exclusively (no toast banners), satisfies **AC-2**, **AC-4**

## Consequences

**Positive**:
- 100% native Windows OS-Level Notifications using single `tauri-winrt-notification` Rust package.
- Clean UI without unwanted floating toast popups on the main window.
- In-line feedback inside Settings Modal is elegant and distraction-free.

**Negative / tradeoffs**:
- Notifications are Windows OS-specific via WinRT API.

**Neutral**:
- GitHub API rate limit is 60 requests/hour per IP, ideal for daily checks.

