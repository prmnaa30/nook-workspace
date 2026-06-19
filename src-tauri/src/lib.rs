mod commands;
mod notes;
mod ws_server;

use std::fs;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};
use tokio::sync::broadcast;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "init_schema",
            sql: include_str!("../migrations/01_init-schema.sql"),
            kind: MigrationKind::Up,
        },
    ];

    let (tx, _rx) = broadcast::channel::<String>(10);
    let tx_state = tx.clone();
    let tx_server = tx.clone();

    ws_server::spawn_server(tx_server);

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:workstation.db", migrations)
                .build(),
        )
        .manage(ws_server::AppState {
            ws_sender: tx_state,
        })
        .setup(|app| {
            if let Ok(home_dir) = app.path().home_dir() {
                let notes_dir = home_dir.join(".workstation_data").join("notes");
                if !notes_dir.exists() {
                    fs::create_dir_all(&notes_dir)
                        .expect("Gagal membuat direktori penyimpanan notes")
                }
            }

            let show_i = MenuItem::with_id(app, "show", "Open Dashboard", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit Dock", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            window.show().unwrap();
                            window.set_focus().unwrap();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::execute_shortcut
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
