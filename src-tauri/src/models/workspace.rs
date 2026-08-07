use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone, Type)]
pub struct Workspace {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub is_favorite: i64,
    pub show_in_global_tasks: Option<i64>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}
