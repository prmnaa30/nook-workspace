use crate::db::DbState;
use crate::models::Workspace;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn get_workspaces(state: State<'_, DbState>) -> Result<Vec<Workspace>, String> {
    sqlx::query_as::<_, Workspace>(
        "SELECT * FROM workspaces ORDER BY is_favorite DESC, COALESCE(updated_at, created_at) DESC, id DESC"
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn create_workspace(
    state: State<'_, DbState>,
    name: String,
    description: String,
    show_in_global_tasks: Option<bool>,
) -> Result<(), String> {
    let show_in_global = if show_in_global_tasks.unwrap_or(true) { 1 } else { 0 };
    sqlx::query(
        "INSERT INTO workspaces (name, description, show_in_global_tasks, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)"
    )
    .bind(name)
    .bind(description)
    .bind(show_in_global)
    .execute(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn update_workspace(
    state: State<'_, DbState>,
    id: i64,
    name: String,
    description: String,
    show_in_global_tasks: Option<bool>,
) -> Result<(), String> {
    if let Some(show_in_global) = show_in_global_tasks {
        let flag = if show_in_global { 1 } else { 0 };
        sqlx::query(
            "UPDATE workspaces SET name = ?, description = ?, show_in_global_tasks = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        )
        .bind(name)
        .bind(description)
        .bind(flag)
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    } else {
        sqlx::query(
            "UPDATE workspaces SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        )
        .bind(name)
        .bind(description)
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn delete_workspace(state: State<'_, DbState>, id: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM workspaces WHERE id = ?")
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn toggle_workspace_favorite(
    state: State<'_, DbState>,
    id: i64,
    is_favorite: bool,
) -> Result<(), String> {
    let flag = if is_favorite { 1 } else { 0 };
    sqlx::query("UPDATE workspaces SET is_favorite = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(flag)
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn toggle_workspace_global_visibility(
    state: State<'_, DbState>,
    id: i64,
    is_visible: bool,
) -> Result<(), String> {
    let flag = if is_visible { 1 } else { 0 };
    sqlx::query("UPDATE workspaces SET show_in_global_tasks = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(flag)
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}
