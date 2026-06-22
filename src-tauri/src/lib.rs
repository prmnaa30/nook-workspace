mod commands;
mod notes;
mod ws_server;

use std::fs;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{Listener, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
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
        Migration {
            version: 2,
            description: "add notes table to handle multiple notes",
            sql: include_str!("../migrations/02_add_notes_table.sql"),
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
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        let alt_w = Shortcut::new(Some(Modifiers::ALT), Code::KeyW);
                        let ctrl_w = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyW);
                        if shortcut == &alt_w {
                            if let Some(window) = app.get_webview_window("floating") {
                                if window.is_visible().unwrap_or(false) {
                                    window.hide().unwrap();
                                } else {
                                    window.show().unwrap();
                                    window.set_focus().unwrap();
                                    window.center().unwrap();
                                }
                            }
                        } else if shortcut == &ctrl_w {
                            if let Some(float_win) = app.get_webview_window("floating") {
                                let _ = float_win.hide();
                            }
                            if let Some(main_win) = app.get_webview_window("main") {
                                let _ = main_win.show();
                                let _ = main_win.set_focus();
                            }
                        }
                    }
                })
                .build(),
        )
        .manage(ws_server::AppState {
            ws_sender: tx_state,
        })
        .setup(|app| {
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

            if let Some(main_window) = app.get_webview_window("main") {
                app.listen_any("open-note", move |_event| {
                    let _ = main_window.show();
                    let _ = main_window.set_focus();
                });
            }

            if let Ok(home_dir) = app.path().home_dir() {
                let notes_dir = home_dir.join(".workstation_data").join("notes");
                if !notes_dir.exists() {
                    fs::create_dir_all(&notes_dir).expect("Failed to create notes directory.")
                }
            }

            #[cfg(desktop)]
            {
                let alt_w = Shortcut::new(Some(Modifiers::ALT), Code::KeyW);
                if let Err(e) = app.global_shortcut().register(alt_w) {
                    eprintln!("Gagal mendaftarkan shortcut Alt+W: {}", e);
                }
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            match event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    window.hide().unwrap();
                    api.prevent_close();
                }
                tauri::WindowEvent::Focused(focused) => {
                    if window.label() == "floating" {
                        #[cfg(desktop)]
                        {
                            use tauri_plugin_global_shortcut::{
                                Code, GlobalShortcutExt, Modifiers, Shortcut,
                            };
                            let app = window.app_handle();
                            let ctrl_w = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyW);
                            if *focused {
                                let _ = app.global_shortcut().register(ctrl_w);
                            } else {
                                let _ = window.hide();
                                let _ = app.global_shortcut().unregister(ctrl_w);
                            }
                        }
                    }
                }
                _ => {}
            }
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::execute_shortcut,
            notes::read_note,
            notes::write_note,
            notes::rename_note_file,
            notes::delete_note_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
