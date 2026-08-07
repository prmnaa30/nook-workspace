use crate::db::DbState;
use crate::models::{Task, TaskWithWorkspace};
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn get_tasks_by_workspace(
    state: State<'_, DbState>,
    workspace_id: i64,
) -> Result<Vec<Task>, String> {
    sqlx::query_as::<_, Task>(
        "SELECT * FROM tasks WHERE workspace_id = ? ORDER BY id DESC"
    )
    .bind(workspace_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn get_all_global_tasks(
    state: State<'_, DbState>,
) -> Result<Vec<TaskWithWorkspace>, String> {
    sqlx::query_as::<_, TaskWithWorkspace>(
        "SELECT t.*, w.name as workspace_name FROM tasks t JOIN workspaces w ON t.workspace_id = w.id WHERE (w.show_in_global_tasks = 1 OR w.show_in_global_tasks IS NULL) ORDER BY t.due_date ASC, t.id DESC"
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn get_all_tasks_for_timeline(
    state: State<'_, DbState>,
) -> Result<Vec<TaskWithWorkspace>, String> {
    sqlx::query_as::<_, TaskWithWorkspace>(
        "SELECT t.*, w.name as workspace_name FROM tasks t JOIN workspaces w ON t.workspace_id = w.id WHERE (w.show_in_global_tasks = 1 OR w.show_in_global_tasks IS NULL) ORDER BY t.due_date ASC, t.id DESC"
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn create_task(
    state: State<'_, DbState>,
    workspace_id: i64,
    title: String,
    description: Option<String>,
    due_date: Option<String>,
) -> Result<(), String> {
    sqlx::query(
        "INSERT INTO tasks (workspace_id, title, description, due_date) VALUES (?, ?, ?, ?)"
    )
    .bind(workspace_id)
    .bind(title)
    .bind(description)
    .bind(due_date)
    .execute(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query(
        "UPDATE workspaces SET updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
    .bind(workspace_id)
    .execute(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn update_task_status(
    state: State<'_, DbState>,
    task_id: i64,
    status: String,
) -> Result<(), String> {
    sqlx::query(
        "UPDATE workspaces SET updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT workspace_id FROM tasks WHERE id = ?)"
    )
    .bind(task_id)
    .execute(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query("UPDATE tasks SET status = ? WHERE id = ?")
        .bind(status)
        .bind(task_id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn update_task(
    state: State<'_, DbState>,
    task_id: i64,
    title: String,
    description: Option<String>,
    due_date: Option<String>,
    status: Option<String>,
) -> Result<(), String> {
    sqlx::query(
        "UPDATE workspaces SET updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT workspace_id FROM tasks WHERE id = ?)"
    )
    .bind(task_id)
    .execute(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    if let Some(st) = status {
        sqlx::query(
            "UPDATE tasks SET title = ?, description = ?, due_date = ?, status = ? WHERE id = ?"
        )
        .bind(title)
        .bind(description)
        .bind(due_date)
        .bind(st)
        .bind(task_id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    } else {
        sqlx::query(
            "UPDATE tasks SET title = ?, description = ?, due_date = ? WHERE id = ?"
        )
        .bind(title)
        .bind(description)
        .bind(due_date)
        .bind(task_id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn delete_task(state: State<'_, DbState>, task_id: i64) -> Result<(), String> {
    sqlx::query(
        "UPDATE workspaces SET updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT workspace_id FROM tasks WHERE id = ?)"
    )
    .bind(task_id)
    .execute(&state.pool)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query("DELETE FROM tasks WHERE id = ?")
        .bind(task_id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}
