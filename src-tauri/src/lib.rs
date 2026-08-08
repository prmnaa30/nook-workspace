mod commands;
mod db;
mod models;
mod ws_server;

#[cfg(debug_assertions)]
use specta_typescript::Typescript;
use std::fs;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Listener, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri_plugin_sql::{Migration, MigrationKind};
use tauri_specta::collect_commands;
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
        Migration {
            version: 3,
            description: "add triggers to update workspace updated_at on note or shortcut changes",
            sql: include_str!("../migrations/03_add_workspace_triggers.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "add tasks table and workspace visibility column",
            sql: include_str!("../migrations/04_add_tasks_table.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "add is_pinned columns to notes and shortcuts",
            sql: include_str!("../migrations/05_add_is_pinned_flags.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "add app_settings table for system key-value storage",
            sql: include_str!("../migrations/06_add_app_settings.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 7,
            description: "add reminder_at and reminder_sent columns to tasks",
            sql: include_str!("../migrations/07_add_task_reminders.sql"),
            kind: MigrationKind::Up,
        },
    ];

    let (tx, _rx) = broadcast::channel::<String>(10);
    let tx_state = tx.clone();
    let tx_server = tx.clone();

    ws_server::spawn_server(tx_server);

    let builder = tauri_specta::Builder::<tauri::Wry>::new().commands(collect_commands![
        commands::greet,
        commands::execute_shortcut,
        commands::open_main_window,
        commands::resize_floating_window,
        commands::get_workspaces,
        commands::create_workspace,
        commands::update_workspace,
        commands::delete_workspace,
        commands::toggle_workspace_favorite,
        commands::toggle_workspace_global_visibility,
        commands::get_shortcuts,
        commands::search_all_shortcuts,
        commands::create_shortcut,
        commands::update_shortcut,
        commands::toggle_shortcut_pin,
        commands::move_shortcut,
        commands::delete_shortcut,
        commands::get_notes,
        commands::search_all_notes,
        commands::create_note,
        commands::update_note,
        commands::toggle_note_pin,
        commands::update_note_timestamp,
        commands::move_note,
        commands::delete_note,
        commands::check_note_file_exists,
        commands::read_note,
        commands::write_note,
        commands::rename_note_file,
        commands::delete_note_file,
        commands::move_note_file,
        commands::get_tasks_by_workspace,
        commands::get_all_global_tasks,
        commands::get_all_tasks_for_timeline,
        commands::create_task,
        commands::update_task_status,
        commands::update_task,
        commands::delete_task,
        commands::set_task_reminder,
        commands::clear_task_reminder,
        commands::get_app_setting,
        commands::set_app_setting,
        commands::show_startup_agenda,
        commands::show_update_notification,
    ]);

    #[cfg(debug_assertions)]
    builder
        .export(
            Typescript::default()
                .bigint(specta_typescript::BigIntExportBehavior::Number)
                .header("// @ts-nocheck\n"),
            "../src/bindings.ts",
        )
        .expect("Failed to export specta bindings");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
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
                        }
                    }
                })
                .build(),
        )
        .manage(ws_server::AppState {
            ws_sender: tx_state,
        })
        .setup(move |app| {
            // Setup SQLite pool for Rust backend
            let app_config = app
                .path()
                .app_config_dir()
                .expect("Failed to get app config dir");
            if !app_config.exists() {
                let _ = fs::create_dir_all(&app_config);
            }
            let db_path = app_config.join("workstation.db");
            let db_url = format!("sqlite:{}?mode=rwc", db_path.to_string_lossy());

            let pool = tauri::async_runtime::block_on(async {
                let p = sqlx::SqlitePool::connect(&db_url)
                    .await
                    .expect("Failed to connect to SQLite database");

                let sql_scripts = vec![
                    include_str!("../migrations/01_init-schema.sql"),
                    include_str!("../migrations/02_add_notes_table.sql"),
                    include_str!("../migrations/03_add_workspace_triggers.sql"),
                    include_str!("../migrations/04_add_tasks_table.sql"),
                    include_str!("../migrations/05_add_is_pinned_flags.sql"),
                    include_str!("../migrations/06_add_app_settings.sql"),
                    include_str!("../migrations/07_add_task_reminders.sql"),
                ];

                for script in sql_scripts {
                    for statement in script.split(';') {
                        let stmt = statement.trim();
                        if !stmt.is_empty() {
                            let _ = sqlx::query(stmt).execute(&p).await;
                        }
                    }
                }

                p
            });
            app.manage(db::DbState { pool: pool.clone() });

            // Sync autostart preference on boot in Rust
            let app_handle = app.handle().clone();
            let pool_autostart = pool.clone();
            tauri::async_runtime::spawn(async move {
                let row = sqlx::query_scalar::<_, String>(
                    "SELECT value FROM app_settings WHERE key = 'autostart_preference'",
                )
                .fetch_optional(&pool_autostart)
                .await
                .ok()
                .flatten();

                let preference = row.unwrap_or_else(|| "enabled".to_string());
                use tauri_plugin_autostart::ManagerExt;
                let autostart_manager = app_handle.autolaunch();

                if preference == "disabled" {
                    if let Ok(true) = autostart_manager.is_enabled() {
                        let _ = autostart_manager.disable();
                    }
                } else {
                    if let Ok(false) = autostart_manager.is_enabled() {
                        let _ = autostart_manager.enable();
                    }
                    if preference != "enabled" {
                        let _ = sqlx::query(
                            "INSERT INTO app_settings (key, value, updated_at) VALUES ('autostart_preference', 'enabled', CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = 'enabled', updated_at = CURRENT_TIMESTAMP",
                        )
                        .execute(&pool_autostart)
                        .await;
                    }
                }
            });

            // Spawn background task reminder polling loop (every 30 seconds)
            let app_handle_reminders = app.handle().clone();
            let pool_reminders = pool.clone();
            tauri::async_runtime::spawn(async move {
                let mut interval = tokio::time::interval(std::time::Duration::from_secs(30));
                loop {
                    interval.tick().await;

                    #[derive(sqlx::FromRow)]
                    struct DueReminder {
                        id: i64,
                        title: String,
                        workspace_name: Option<String>,
                    }

                    let rows: Vec<DueReminder> = sqlx::query_as::<_, DueReminder>(
                        "SELECT t.id, t.title, w.name as workspace_name FROM tasks t JOIN workspaces w ON t.workspace_id = w.id WHERE t.status != 'DONE' AND t.reminder_at IS NOT NULL AND t.reminder_at <= strftime('%Y-%m-%dT%H:%M:%S', 'now', 'localtime') AND t.reminder_sent = 0"
                    )
                    .fetch_all(&pool_reminders)
                    .await
                    .unwrap_or_default();

                    for item in rows {
                        let _ = sqlx::query("UPDATE tasks SET reminder_sent = 1 WHERE id = ?")
                            .bind(item.id)
                            .execute(&pool_reminders)
                            .await;

                        #[cfg(target_os = "windows")]
                        {
                            use tauri_winrt_notification::{Duration, Sound, Toast};
                            let app_handle_inner = app_handle_reminders.clone();
                            let body = format!(
                                "Workspace: {}",
                                item.workspace_name.as_deref().unwrap_or("General")
                            );
                            let _ = Toast::new("com.nook")
                                .title(&format!("Reminder: {}", item.title))
                                .text1(&body)
                                .sound(Some(Sound::Reminder))
                                .duration(Duration::Short)
                                .on_activated(move || {
                                    if let Some(window) = app_handle_inner.get_webview_window("main") {
                                        let _ = window.unminimize();
                                        let _ = window.show();
                                        let _ = window.set_focus();
                                        let _ = window.emit("navigate-view", "global-tasks");
                                    }
                                    Ok(())
                                })
                                .show();
                        }
                    }
                }
            });

            let show_i = MenuItem::with_id(app, "show", "Open Dashboard", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit Dock", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Nook")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.unminimize();
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.unminimize();
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
                    let _ = main_window.unminimize();
                    let _ = main_window.show();
                    let _ = main_window.set_focus();
                });
            }

            let args: Vec<String> = std::env::args().collect();
            let is_autostart = args.iter().any(|arg| arg == "--autostart");

            if !is_autostart {
                if let Some(main_window) = app.get_webview_window("main") {
                    let _ = main_window.unminimize();
                    let _ = main_window.show();
                    let _ = main_window.set_focus();
                }
            }

            if let Ok(home_dir) = app.path().home_dir() {
                let notes_dir = home_dir.join(".nook").join("notes");
                if !notes_dir.exists() {
                    fs::create_dir_all(&notes_dir).expect("Failed to create notes directory.")
                }
            }

            #[cfg(desktop)]
            {
                let alt_w = Shortcut::new(Some(Modifiers::ALT), Code::KeyW);
                if let Err(e) = app.global_shortcut().register(alt_w) {
                    eprintln!("Failed to register shortcut Alt+W: {}", e);
                }
            }

            Ok(())
        })
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                window.hide().unwrap();
                api.prevent_close();
            }
            tauri::WindowEvent::Focused(focused) => {
                if window.label() == "floating" && !focused {
                    let _ = window.hide();
                }
            }
            _ => {}
        })
        .invoke_handler(builder.invoke_handler())
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}

#[cfg(test)]
mod tests {
    use specta_typescript::Typescript;

    #[test]
    fn test_specta_export_header() {
        let _ts = Typescript::default()
            .bigint(specta_typescript::BigIntExportBehavior::Number)
            .header("// @ts-nocheck\n");
    }
}

