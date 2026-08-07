use sqlx::SqlitePool;

pub struct DbState {
    pub pool: SqlitePool,
}
