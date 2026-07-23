use std::fs;
use std::path::PathBuf;
use tauri::Manager;

fn resolve_and_migrate_note(
    home_dir: &std::path::Path,
    workspace_id: i64,
    filename: &str,
) -> PathBuf {
    let base_notes_dir = home_dir.join(".nook").join("notes");
    let ws_dir = base_notes_dir.join(workspace_id.to_string());
    let target_path = ws_dir.join(filename);

    if !target_path.exists() {
        let legacy_path = base_notes_dir.join(filename);
        if legacy_path.exists() {
            let _ = fs::create_dir_all(&ws_dir);
            let _ = fs::rename(&legacy_path, &target_path);
        }
    }

    target_path
}

#[tauri::command]
pub async fn check_note_file_exists(
    app: tauri::AppHandle,
    workspace_id: i64,
    filename: String,
) -> Result<bool, String> {
    if let Ok(home_dir) = app.path().home_dir() {
        let note_path = resolve_and_migrate_note(&home_dir, workspace_id, &filename);
        return Ok(note_path.exists());
    }
    Err("Access to Home Directory denied.".to_string())
}

#[tauri::command]
pub async fn read_note(
    app: tauri::AppHandle,
    workspace_id: i64,
    filename: String,
) -> Result<String, String> {
    if let Ok(home_dir) = app.path().home_dir() {
        let note_path = resolve_and_migrate_note(&home_dir, workspace_id, &filename);

        if note_path.exists() {
            return fs::read_to_string(note_path)
                .map_err(|e| format!("Failed to read note: {}", e));
        } else {
            return Err("NOTE_FILE_MISSING".to_string());
        }
    }
    Err("Access to Home Directory denied.".to_string())
}

#[tauri::command]
pub async fn write_note(
    app: tauri::AppHandle,
    workspace_id: i64,
    filename: String,
    content: String,
) -> Result<(), String> {
    if let Ok(home_dir) = app.path().home_dir() {
        let ws_dir = home_dir
            .join(".nook")
            .join("notes")
            .join(workspace_id.to_string());
        if !ws_dir.exists() {
            fs::create_dir_all(&ws_dir)
                .map_err(|e| format!("Failed to create workspace notes directory: {}", e))?;
        }
        let note_path = ws_dir.join(&filename);
        return fs::write(note_path, content).map_err(|e| format!("Failed to create note: {}", e));
    }
    Err("Access to Home Directory denied.".to_string())
}

#[tauri::command]
pub async fn rename_note_file(
    app: tauri::AppHandle,
    workspace_id: i64,
    old_filename: String,
    new_filename: String,
) -> Result<(), String> {
    if let Ok(home_dir) = app.path().home_dir() {
        let old_path = resolve_and_migrate_note(&home_dir, workspace_id, &old_filename);
        if old_path.exists() {
            let ws_dir = home_dir
                .join(".nook")
                .join("notes")
                .join(workspace_id.to_string());
            if !ws_dir.exists() {
                let _ = fs::create_dir_all(&ws_dir);
            }
            let new_path = ws_dir.join(&new_filename);
            return fs::rename(old_path, new_path)
                .map_err(|e| format!("Failed to rename file name: {}", e));
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn delete_note_file(
    app: tauri::AppHandle,
    workspace_id: i64,
    filename: String,
) -> Result<(), String> {
    if let Ok(home_dir) = app.path().home_dir() {
        let note_path = resolve_and_migrate_note(&home_dir, workspace_id, &filename);
        if note_path.exists() {
            return fs::remove_file(note_path).map_err(|e| format!("Failed to delete file: {}", e));
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn move_note_file(
    app: tauri::AppHandle,
    from_workspace_id: i64,
    to_workspace_id: i64,
    filename: String,
) -> Result<(), String> {
    if let Ok(home_dir) = app.path().home_dir() {
        let source_path = resolve_and_migrate_note(&home_dir, from_workspace_id, &filename);
        let target_dir = home_dir
            .join(".nook")
            .join("notes")
            .join(to_workspace_id.to_string());

        if !target_dir.exists() {
            fs::create_dir_all(&target_dir)
                .map_err(|e| format!("Failed to create target notes folder: {}", e))?;
        }

        let target_path = target_dir.join(&filename);

        if source_path.exists() {
            return fs::rename(source_path, target_path)
                .map_err(|e| format!("Failed to move note file: {}", e));
        }
    }
    Ok(())
}
