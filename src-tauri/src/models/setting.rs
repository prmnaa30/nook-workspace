use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::FromRow;

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize, FromRow, Clone, Type)]
pub struct AppSetting {
    pub key: String,
    pub value: String,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct TaskSummary {
    pub tasks_due_today: i64,
    pub total_tasks_remaining: i64,
}
