use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone, Type)]
pub struct Task {
    pub id: i64,
    pub workspace_id: i64,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub due_date: Option<String>,
    pub reminder_at: Option<String>,
    pub reminder_sent: Option<i64>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone, Type)]
pub struct TaskWithWorkspace {
    pub id: i64,
    pub workspace_id: i64,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub due_date: Option<String>,
    pub reminder_at: Option<String>,
    pub reminder_sent: Option<i64>,
    pub created_at: Option<String>,
    pub workspace_name: Option<String>,
}
