# 0003. Update Checker (Manual and Auto) - Rationale

## Context

Nook is distributed as standalone binaries via GitHub Releases (`prmnaa30/nook-workspace`). Users currently have no in-app mechanism to know when a new version is released. We need a lightweight, non-intrusive update checker that notifies users when a new release is available and links them directly to the release page.

## Options considered

### Option 1: Direct GitHub Releases API query with SQLite timestamp throttling

This option queries `https://api.github.com/repos/prmnaa30/nook-workspace/releases/latest` directly over HTTPS. The timestamp of the last check is saved in SQLite (`workstation.db`) to ensure automatic checks occur at most once per 24 hours. Clicking the update notification or toast uses `@tauri-apps/plugin-opener` to open the GitHub Release page in the default web browser.

**Pros**:
- Zero additional server infrastructure required.
- Uses public, official GitHub Releases API.
- Respects rate limits by throttling automatic checks to 1x per day via SQLite.
- Simple, reliable link-out user experience.

**Cons**:
- Does not download or install the binary automatically (user clicks link to download installer).

### Option 2: Full automatic update downloader (tauri-plugin-updater)

This option configures `tauri-plugin-updater` with a custom JSON manifest host to download and install updates in the background.

**Pros**:
- Automatic silent background downloads.

**Cons**:
- Requires self-hosted update server/manifest or signature keys.
- Complex setup for single-developer open source distribution.
- User explicitly requested release link redirect instead of silent autoupdate.

## Rationale

Option 1 is the cleanest and simplest fit for Nook's current distribution model. By querying GitHub's public API directly and redirecting users to the release page, Nook avoids complex auto-updater signatures and server infrastructure while still providing a smooth update notification experience. Storing check timestamps in SQLite ensures automatic checks are strictly throttled to at most once per 24 hours.
