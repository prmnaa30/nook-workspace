use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone, Type)]
pub struct Note {
    pub id: i64,
    pub workspace_id: i64,
    pub title: String,
    pub filename: String,
    pub is_pinned: Option<i64>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone, Type)]
pub struct NoteWithWorkspace {
    pub id: i64,
    pub workspace_id: i64,
    pub title: String,
    pub filename: String,
    pub is_pinned: Option<i64>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub workspace_name: String,
}
