use std::fs;
use tauri::Manager;

#[tauri::command]
pub async fn read_note(app: tauri::AppHandle, filename: String) -> Result<String, String> {
    if let Ok(home_dir) = app.path().home_dir() {
        let note_path = home_dir
            .join(".nook")
            .join("notes")
            .join(&filename);

        if note_path.exists() {
            return fs::read_to_string(note_path)
                .map_err(|e| format!("Failed to read note: {}", e));
        } else {
            return Ok(String::new());
        }
    }
    Err("Access to Home Directory denied.".to_string())
}

#[tauri::command]
pub async fn write_note(
    app: tauri::AppHandle,
    filename: String,
    content: String,
) -> Result<(), String> {
    if let Ok(home_dir) = app.path().home_dir() {
        let note_path = home_dir
            .join(".nook")
            .join("notes")
            .join(&filename);
        return fs::write(note_path, content).map_err(|e| format!("Failed to create note: {}", e));
    }
    Err("Access to Home Directory denied.".to_string())
}

#[tauri::command]
pub async fn rename_note_file(
    app: tauri::AppHandle,
    old_filename: String,
    new_filename: String,
) -> Result<(), String> {
    if let Ok(home_dir) = app.path().home_dir() {
        let notes_dir = home_dir.join(".nook").join("notes");
        let old_path = notes_dir.join(&old_filename);
        let new_path = notes_dir.join(&new_filename);
        if old_path.exists() {
            return fs::rename(old_path, new_path)
                .map_err(|e| format!("Failed to rename file name: {}", e));
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn delete_note_file(app: tauri::AppHandle, filename: String) -> Result<(), String> {
    if let Ok(home_dir) = app.path().home_dir() {
        let note_path = home_dir
            .join(".nook")
            .join("notes")
            .join(&filename);
        if note_path.exists() {
            return fs::remove_file(note_path).map_err(|e| format!("Failed to delete file: {}", e));
        }
    }
    Ok(())
}
