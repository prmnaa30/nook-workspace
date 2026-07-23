# 🚀 Nook v1.2.0 - Active Workspaces, UI Polish & Code Modularization 🌟

We are excited to release **Nook v1.2.0**! This version brings significant architectural improvements, a cleaner UI, improved UX patterns, and a dynamic workspace sorting system based on activity.

---

### ✨ What's New in v1.2.0

#### 📅 Dynamic Workspace Sorting (Activity-Based)
* **Database Triggers (Migration v3)**: Added SQLite triggers to automatically update a workspace's `updated_at` timestamp whenever its associated notes or shortcuts are added, modified, or deleted.
* **Auto-refresh UI**: Refactored Pinia stores to reload workspace data on any note or shortcut mutation, keeping the UI instantly updated.
* **Active-First Sorting**: Workspaces in the sidebar are now automatically sorted by their latest activity (`updated_at`), bubbling your most recently used workspaces to the top.

#### 🧱 Modular Component Architecture
* **Refactored Sidebar**: Split the monolithic `Sidebar.vue` into a modular directory (`Sidebar/`), separating layouts for cleaner code maintenance.
* **Workspace & Shortcut Cards**: Extracted workspace item layouts into `WorkspaceCard.vue` and shortcut item layouts into `ShortcutCard.vue` for modularity and contextual action support.
* **Programmatic Modals**: Cleaned up inline slots in `ShortcutFormModal.vue` and `WorkspaceFormModal.vue`, exposing programmatic `openModal` triggers instead.

#### 🎨 UI & UX Polish
* **Context Menu Handling**: Implemented a global handler in `App.vue` to disable default browser context menus cleanly, and fixed stuck hover states that occurred when context menus were triggered.
* **Smart Escape Key Logic**: Improved the `Escape` key navigation so that any open popovers or dialogs close first before resetting the active workspace.

#### 🐛 Bug Fixes
* **SQL Syntax Fix**: Corrected a database query syntax issue within the `updateNoteService` function.

---

### 💻 Installation & Update

Download the latest package for your OS below. If you already have Nook installed, running the new installer will automatically upgrade your version while preserving your local database.

> **Feedback & Support**: If you find any issues, feel free to report them on our GitHub Issues page!
