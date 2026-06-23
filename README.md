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
   - Full CRUD management for each workspace.

2. **Smart Shortcuts**
   - Add quick shortcuts to various resource types:
     - **Web URL**: Open web links.
     - **Local Directory/Folder**: Open local folders or file explorers.
     - **Application/File**: Execute specific files or applications.
   - **Custom Browser**: Configure web shortcuts to open in a specific browser (e.g., work links in Brave, entertainment links in Edge).

3. **Markdown Notes Integration**
   - Each workspace comes with built-in Markdown notes (*GitHub Flavored Markdown*).
   - *Auto-save* functionality directly to the local filesystem in the user's directory (`~/.nook/notes/`).

4. **Nook Bar (Dock Toggle)**
   - Instant access to smart search via a transparent *floating command bar* panel using a global shortcut.
   - Real-time search and execution of shortcuts from the SQLite database.

### 🛠️ Tech Stack

- **Frontend**: Vue 3 (Composition API), TypeScript, Vite, Tailwind CSS / Nuxt UI.
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
   - Manajemen siklus hidup penuh (CRUD) untuk setiap *workspace*.

2. **Smart Shortcuts**
   - Menambahkan pintasan cepat ke berbagai tipe sumber daya:
     - **Web URL**: Membuka tautan web.
     - **Direktori/Folder Lokal**: Membuka berkas atau explorer lokal.
     - **Aplikasi/File**: Mengeksekusi berkas atau aplikasi tertentu.
   - **Custom Browser**: Konfigurasi pintasan web agar terbuka pada peramban tertentu secara spesifik (misalnya link kerja di Brave, link hiburan di Edge).

3. **Markdown Notes Integration**
   - Setiap *workspace* dilengkapi dengan catatan berbasis Markdown (*GitHub Flavored Markdown*).
   - Fitur *auto-save* langsung ke sistem berkas lokal pada direktori pengguna (`~/.nook/notes/`).

4. **Nook Bar (Dock Toggle)**
   - Akses instan ke pencarian pintar melalui panel *floating command bar* transparan dengan menekan tombol pintas global (*global shortcut*).
   - Melakukan pencarian dan eksekusi pintasan (*shortcuts*) secara real-time dari database SQLite.

### 🛠️ Tech Stack

- **Frontend**: Vue 3 (Composition API), TypeScript, Vite, Tailwind CSS / Nuxt UI.
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
├── src-tauri/              # Backend Rust (Tauri, SQLite Migrations, Window/Tray Handling)
│   ├── src/                # Sumber kode Rust / Rust source code
│   ├── migrations/         # Migrasi Database SQLite / SQLite migrations
│   ├── tauri.conf.json     # Konfigurasi aplikasi Tauri / Tauri app config
│   └── Cargo.toml          # Dependensi Rust / Rust dependencies
├── package.json            # Dependensi Node.js & Skrip build / Node.js dependencies & build scripts
└── README.md               # Dokumentasi proyek ini / Project documentation
```
