use crate::db::DbState;
use crate::models::TaskSummary;
use tauri::{AppHandle, Emitter, Manager, State};

#[cfg(target_os = "windows")]
use tauri_winrt_notification::{Duration, Toast};

#[tauri::command]
#[specta::specta]
pub async fn get_app_setting(
    state: State<'_, DbState>,
    key: String,
) -> Result<Option<String>, String> {
    let row = sqlx::query_scalar::<_, String>("SELECT value FROM app_settings WHERE key = ?")
        .bind(key)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(row)
}

#[tauri::command]
#[specta::specta]
pub async fn set_app_setting(
    state: State<'_, DbState>,
    key: String,
    value: String,
) -> Result<(), String> {
    sqlx::query(
        "INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .bind(&key)
    .bind(&value)
    .execute(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn show_startup_agenda(
    app: AppHandle,
    state: State<'_, DbState>,
    today: String,
) -> Result<TaskSummary, String> {
    let pref = get_app_setting(state.clone(), "startup_notification_enabled".to_string())
        .await?
        .unwrap_or_else(|| "enabled".to_string());

    let is_enabled = pref != "disabled";

    let total_remaining: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM tasks t JOIN workspaces w ON t.workspace_id = w.id WHERE t.status != 'DONE' AND (w.show_in_global_tasks = 1 OR w.show_in_global_tasks IS NULL)"
    )
    .fetch_one(&state.pool)
    .await
    .unwrap_or(0);

    let due_pattern = format!("{}%", today);
    let tasks_due_today: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM tasks t JOIN workspaces w ON t.workspace_id = w.id WHERE t.status != 'DONE' AND (w.show_in_global_tasks = 1 OR w.show_in_global_tasks IS NULL) AND t.due_date LIKE ?"
    )
    .bind(due_pattern)
    .fetch_one(&state.pool)
    .await
    .unwrap_or(0);

    #[cfg(target_os = "windows")]
    if is_enabled {
        let body_text = if total_remaining == 0 {
            "You are all caught up! Have a great day!".to_string()
        } else {
            format!(
                "You have {} tasks due today out of {} total tasks.",
                tasks_due_today, total_remaining
            )
        };
        let app_handle = app.clone();
        let _ = Toast::new("com.nook")
            .title("Nook Agenda")
            .text1(&body_text)
            .duration(Duration::Short)
            .on_activated(move || {
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.emit("navigate-view", "global-tasks");
                }
                Ok(())
            })
            .show();
    }

    Ok(TaskSummary {
        tasks_due_today,
        total_tasks_remaining: total_remaining,
    })
}

#[tauri::command]
#[specta::specta]
pub async fn show_update_notification(
    app: AppHandle,
    version: String,
    url: String,
) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let target_url = url.clone();
        let app_handle = app.clone();
        let _ = Toast::new("com.nook")
            .title("Nook Update Available")
            .text1(&format!(
                "Version {} is now available on GitHub! Click to view release.",
                version
            ))
            .duration(Duration::Short)
            .on_activated(move || {
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                }
                let _ = tauri_plugin_opener::open_url(&target_url, None::<&str>);
                Ok(())
            })
            .show();
    }

    Ok(())
}

