-- Add show_in_global_tasks column to workspaces table
ALTER TABLE workspaces ADD COLUMN show_in_global_tasks INTEGER DEFAULT 1;

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK(status IN ('TODO', 'IN_PROGRESS', 'DONE')) DEFAULT 'TODO',
    due_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- Trigger for task insert
CREATE TRIGGER IF NOT EXISTS update_workspace_timestamp_on_task_insert
AFTER INSERT ON tasks
BEGIN
    UPDATE workspaces
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.workspace_id;
END;

-- Trigger for task update
CREATE TRIGGER IF NOT EXISTS update_workspace_timestamp_on_task_update
AFTER UPDATE ON tasks
BEGIN
    UPDATE workspaces
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.workspace_id;
END;

-- Trigger for task delete
CREATE TRIGGER IF NOT EXISTS update_workspace_timestamp_on_task_delete
AFTER DELETE ON tasks
BEGIN
    UPDATE workspaces
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.workspace_id;
END;
