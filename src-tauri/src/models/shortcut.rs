use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone, Type)]
pub struct Shortcut {
    pub id: i64,
    pub workspace_id: i64,
    pub title: String,
    #[sqlx(rename = "type")]
    #[serde(rename = "type")]
    pub shortcut_type: String,
    pub path: String,
    pub browser_path: Option<String>,
    pub is_pinned: i64,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone, Type)]
pub struct ShortcutWithWorkspace {
    pub id: i64,
    pub workspace_id: i64,
    pub title: String,
    #[sqlx(rename = "type")]
    #[serde(rename = "type")]
    pub shortcut_type: String,
    pub path: String,
    pub browser_path: Option<String>,
    pub is_pinned: i64,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub workspace_name: String,
}
