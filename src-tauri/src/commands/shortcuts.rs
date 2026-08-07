use crate::db::DbState;
use crate::models::{Shortcut, ShortcutWithWorkspace};
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn get_shortcuts(
    state: State<'_, DbState>,
    workspace_id: i64,
) -> Result<Vec<Shortcut>, String> {
    sqlx::query_as::<_, Shortcut>(
        "SELECT * FROM shortcuts WHERE workspace_id = ? ORDER BY id ASC"
    )
    .bind(workspace_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn search_all_shortcuts(
    state: State<'_, DbState>,
) -> Result<Vec<ShortcutWithWorkspace>, String> {
    sqlx::query_as::<_, ShortcutWithWorkspace>(
        "SELECT s.*, w.name as workspace_name FROM shortcuts s JOIN workspaces w ON s.workspace_id = w.id ORDER BY s.title ASC"
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn create_shortcut(
    state: State<'_, DbState>,
    workspace_id: i64,
    title: String,
    shortcut_type: String,
    path: String,
    browser_path: Option<String>,
    is_pinned: Option<bool>,
) -> Result<(), String> {
    let pinned_flag = if is_pinned.unwrap_or(false) { 1 } else { 0 };
    sqlx::query(
        "INSERT INTO shortcuts (workspace_id, title, type, path, browser_path, is_pinned) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(workspace_id)
    .bind(title)
    .bind(shortcut_type)
    .bind(path)
    .bind(browser_path)
    .bind(pinned_flag)
    .execute(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn update_shortcut(
    state: State<'_, DbState>,
    shortcut_id: i64,
    title: String,
    shortcut_type: String,
    path: String,
    browser_path: Option<String>,
    is_pinned: Option<bool>,
) -> Result<(), String> {
    if let Some(pinned) = is_pinned {
        let flag = if pinned { 1 } else { 0 };
        sqlx::query(
            "UPDATE shortcuts SET title = ?, type = ?, path = ?, browser_path = ?, is_pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        )
        .bind(title)
        .bind(shortcut_type)
        .bind(path)
        .bind(browser_path)
        .bind(flag)
        .bind(shortcut_id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    } else {
        sqlx::query(
            "UPDATE shortcuts SET title = ?, type = ?, path = ?, browser_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        )
        .bind(title)
        .bind(shortcut_type)
        .bind(path)
        .bind(browser_path)
        .bind(shortcut_id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn toggle_shortcut_pin(
    state: State<'_, DbState>,
    shortcut_id: i64,
    is_pinned: bool,
) -> Result<(), String> {
    let flag = if is_pinned { 1 } else { 0 };
    sqlx::query(
        "UPDATE shortcuts SET is_pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
    .bind(flag)
    .bind(shortcut_id)
    .execute(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn move_shortcut(
    state: State<'_, DbState>,
    shortcut_id: i64,
    target_workspace_id: i64,
) -> Result<(), String> {
    sqlx::query(
        "UPDATE shortcuts SET workspace_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
    .bind(target_workspace_id)
    .bind(shortcut_id)
    .execute(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query(
        "UPDATE workspaces SET updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
    .bind(target_workspace_id)
    .execute(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn delete_shortcut(state: State<'_, DbState>, id: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM shortcuts WHERE id = ?")
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}
