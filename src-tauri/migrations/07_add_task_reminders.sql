ALTER TABLE tasks ADD COLUMN reminder_at DATETIME NULL;
ALTER TABLE tasks ADD COLUMN reminder_sent INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_tasks_reminder ON tasks(reminder_at, reminder_sent, status);
