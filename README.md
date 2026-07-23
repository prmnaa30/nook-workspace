# Nook (Workstation Dock)

[![Tauri](https://img.shields.io/badge/Tauri-v2-blue.svg)](https://tauri.app/)
[![Vue](https://img.shields.io/badge/Vue-3-green.svg)](https://vuejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-Database-lightblue.svg)](https://sqlite.org/)

[English](#english) | [Bahasa Indonesia](#bahasa-indonesia)

---

## English

**Nook** (or *Workstation Dock*) is a productivity desktop application that acts as a "Command Center" and workflow manager. Built using **Tauri (Rust)** for maximum performance and **Vue 3 / TypeScript** for a modern, responsive user interface.

The application runs in the background (*daemon*) via the *System Tray* and can be summoned at any time as a *floating panel* (similar to Spotlight/Raycast), and features a main Dashboard for workspace management.

### 🚀 Key Features

1. **Workspace Manager**
   - Group projects or tasks into virtual workspaces.
   - Full CRUD management for each workspace with custom global visibility toggles (`show_in_global_tasks`).
   - Favorites marking and workspace context menus.

2. **Kanban Task Board**
   - Interactive Task Kanban Board with **To Do**, **In Progress**, and **Done** columns.
   - Smooth **Drag-and-Drop** status movements & quick action buttons.
   - Task DateTime picker for due dates with status indicators.
   - Dynamic searching and persistent sorting preferences saved in `localStorage` (by Title, Due Date, or Created Date).
   - Available per-workspace and in a unified **All Tasks (Global Tasks)** view.
   - Modular reusable `TaskFormModal` component.

3. **Timeline & Interactive Calendar View**
   - Timeline scheduling in dual modes: **List View** & **Interactive Month Calendar View**.
   - Calendar popover date navigator with header month picker: `( < Month Year > ) [Today]`.
   - Out-of-month date cell dimming and month navigation.
   - Real-time task completion toggle & day tasks modal inspector.

4. **Smart Shortcuts**
   - Add quick shortcuts to various resource types:
     - **Web URL**: Open web links in default browser.
     - **Local Directory/Folder**: Open local folders in system file explorer.
     - **Application/File**: Execute specific files or applications.
   - "Move to Workspace..." support to transfer shortcuts between workspaces.

5. **Markdown Notes Integration**
   - Rich Markdown notes editor (*GitHub Flavored Markdown*) powered by TipTap.
   - Direct file storage in dedicated workspace subfolders (`~/.nook/notes/<workspace_id>/<filename>.md`).
   - "Move to Workspace..." support and missing file detection prompt (`NoteMissingModal`).

6. **Nook Bar (Floating Command Bar)**
   - Instant access to smart search via a transparent *floating command bar* panel using a global shortcut (`Alt+Space` or custom).
   - **Keyboard Navigation**: Use `Tab` / `Shift + Tab` or `ArrowDown` / `ArrowUp` to cycle through search results with smooth auto-scrolling.
   - Mode switcher between 🔍 **Search** and ⚡ **Quick Task Creation** (`Ctrl+Tab`).

7. **Unified Design System**
   - Consistent modern UI using **Nuxt UI** and **Lucide Icons** (`i-lucide-*`).

### 🛠️ Tech Stack

- **Frontend**: Vue 3 (Composition API), TypeScript, Vite, Nuxt UI, Lucide Icons, TipTap Editor, Pinia.
- **Backend**: Rust (Tauri v2).
- **Database**: SQLite (via `@tauri-apps/plugin-sql`).
- **File Storage**: Hybrid (configurations & metadata in SQLite, Markdown notes stored in local `.md` files).

### 📦 Prerequisites

Before running or building the project, ensure your system has:
- **Rust** (latest MSRV via rustup)
- **Node.js** (LTS/v18+) and npm/pnpm/yarn
- Tauri build tools configured for your operating system (see [Tauri Prerequisites Guide](https://tauri.app/start/prerequisites/)).

### 💻 How to Run Locally

1. **Clone the Repository**
   ```bash
   git clone https://github.com/username/workstation-dock.git
   cd workstation-dock
   ```

2. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

3. **Run in Development Mode**
   ```bash
   npm run tauri dev
   ```
   *This command runs the Vite frontend server and opens the desktop application in debug mode.*

4. **Build for Production Release**
   ```bash
   npm run tauri build
   ```
   *The standalone installer (e.g., `.msi` for Windows) will be saved in `src-tauri/target/release/bundle/`.*

---

## Bahasa Indonesia

**Nook** (atau *Workstation Dock*) adalah aplikasi desktop produktivitas yang bertindak sebagai "Command Center" dan pengelola alur kerja (*workspace manager*). Dibangun menggunakan arsitektur **Tauri (Rust)** untuk performa maksimal dan **Vue 3 / TypeScript** untuk UI yang modern dan responsif.

Aplikasi ini berjalan di latar belakang (*daemon*) melalui *System Tray* dan dapat dipanggil kapan saja sebagai *floating panel* (layaknya Spotlight/Raycast), serta memiliki antarmuka utama (Dashboard) untuk manajemen *workspace*.

### 🚀 Fitur Utama

1. **Workspace Manager**
   - Mengelompokkan proyek atau tugas ke dalam ruang kerja (*workspace*) virtual terpisah.
   - Manajemen siklus hidup penuh (CRUD) untuk setiap *workspace* dengan kontrol visibilitas global (`show_in_global_tasks`).
   - Penandaan favorit (*favorites*) dan menu konteks workspace.

2. **Kanban Task Board**
   - Task Kanban Board interaktif dengan kolom **To Do**, **In Progress**, dan **Done**.
   - Fitur **Drag-and-Drop** untuk pemindahan status task dengan mudah & tombol status cepat.
   - DateTime picker untuk tenggat waktu (*due date*) dilengkapi indikator status visual.
   - Pencarian cepat dan preferensi pengurutan (*sorting*) yang tersimpan otomatis di `localStorage` (berdasarkan Judul, Due Date, atau Tanggal Dibuat).
   - Tersedia pada setiap workspace maupun tampilan terpadu **All Tasks (Global Tasks)**.
   - Komponen modal `TaskFormModal` yang modular dan dapat digunakan kembali (*reusable*).

3. **Timeline & Interactive Calendar View**
   - Penjadwalan alur waktu (Timeline) dengan dua mode: **List View** & **Interactive Month Calendar View**.
   - Navigasi bulan interaktif pada header kalender: `( < Month Year > ) [Today]`.
   - Efek visual redup (*dimming*) pada tanggal di luar bulan aktif dan navigasi bulan otomatis.
   - Toggle status penyelesaian task secara real-time & modal inspeksi daftar task harian.

4. **Smart Shortcuts**
   - Menambahkan pintasan cepat ke berbagai tipe sumber daya:
     - **Web URL**: Membuka tautan web di browser bawaan.
     - **Direktori/Folder Lokal**: Membuka berkas atau explorer lokal.
     - **Aplikasi/File**: Mengeksekusi berkas atau aplikasi tertentu.
   - Fitur "Move to Workspace..." untuk memindahkan pintasan antar-workspace.

5. **Markdown Notes Integration**
   - Editor catatan berbasis Markdown (*GitHub Flavored Markdown*) berbasis TipTap.
   - Penyimpanan file catatan teratur dalam subfolder workspace (`~/.nook/notes/<workspace_id>/<filename>.md`).
   - Fitur "Move to Workspace..." serta deteksi otomatis file catatan hilang/missing (`NoteMissingModal`).

6. **Nook Bar (Floating Command Bar)**
   - Akses instan ke pencarian pintar melalui panel *floating command bar* transparan dengan tombol pintas global (`Alt+Space` atau kustom).
   - **Navigasi Keyboard**: Gunakan `Tab` / `Shift + Tab` atau `ArrowDown` / `ArrowUp` untuk berpindah daftar item secara mulus dengan *auto-scroll*.
   - Perpindahan mode antara 🔍 **Search** dan ⚡ **Quick Task Creation** (`Ctrl+Tab`).

7. **Design System Terpadu**
   - Tampilan antarmuka modern yang seragam menggunakan **Nuxt UI** dan **Lucide Icons** (`i-lucide-*`).

### 🛠️ Tech Stack

- **Frontend**: Vue 3 (Composition API), TypeScript, Vite, Nuxt UI, Lucide Icons, TipTap Editor, Pinia.
- **Backend**: Rust (Tauri v2).
- **Database**: SQLite (via `@tauri-apps/plugin-sql`).
- **Penyimpanan Berkas**: Hybrid (konfigurasi & metadata disimpan di SQLite, dokumen catatan Markdown disimpan dalam file `.md` lokal).

### 📦 Persyaratan Sistem (Prerequisites)

Sebelum menjalankan atau membangun proyek ini, pastikan sistem Anda telah terpasang:
- **Rust** (MSRV/Rust terbaru melalui rustup)
- **Node.js** (LTS/v18+) dan npm/pnpm/yarn
- Alat bantu build Tauri untuk sistem operasi Anda (lihat [Panduan Tauri](https://tauri.app/start/prerequisites/)).

### 💻 Cara Menjalankan Secara Lokal

1. **Klon Repositori**
   ```bash
   git clone https://github.com/username/workstation-dock.git
   cd workstation-dock
   ```

2. **Instal Dependensi Frontend**
   ```bash
   npm install
   ```

3. **Jalankan Mode Pengembangan (Development)**
   ```bash
   npm run tauri dev
   ```
   *Perintah ini akan menjalankan server Vite frontend dan membuka aplikasi desktop dalam mode debug.*

4. **Build untuk Rilis (Production)**
   ```bash
   npm run tauri build
   ```
   *Hasil build berupa installer mandiri (seperti `.msi` untuk Windows) akan tersimpan di dalam folder `src-tauri/target/release/bundle/`.*

---

## 📂 Struktur Folder Proyek / Project Structure

```text
├── src/                    # Frontend Vue 3 (Halaman, Komponen, Router, State)
│   ├── components/         # Komponen UI (Tasks, Timeline, Notes, Shortcuts, Common, Floating)
│   ├── services/           # Service layer untuk komunikasi IPC Tauri & SQLite
│   └── stores/             # Pinia state management (Workspaces, Tasks, Notes, Shortcuts)
├── src-tauri/              # Backend Rust (Tauri, SQLite Migrations, Notes I/O, Window/Tray)
│   ├── src/                # Sumber kode Rust / Rust source code
│   ├── migrations/         # Migrasi Database SQLite / SQLite migrations
│   ├── tauri.conf.json     # Konfigurasi aplikasi Tauri / Tauri app config
│   └── Cargo.toml          # Dependensi Rust / Rust dependencies
├── package.json            # Dependensi Node.js & Skrip build / Node.js dependencies & build scripts
└── README.md               # Dokumentasi proyek ini / Project documentation
```
