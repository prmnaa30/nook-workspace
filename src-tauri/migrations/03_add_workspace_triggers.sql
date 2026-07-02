-- Trigger for notes insert
CREATE TRIGGER IF NOT EXISTS update_workspace_timestamp_on_note_insert
AFTER INSERT ON notes
BEGIN
    UPDATE workspaces
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.workspace_id;
END;

-- Trigger for notes update
CREATE TRIGGER IF NOT EXISTS update_workspace_timestamp_on_note_update
AFTER UPDATE ON notes
BEGIN
    UPDATE workspaces
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.workspace_id;
END;

-- Trigger for notes delete
CREATE TRIGGER IF NOT EXISTS update_workspace_timestamp_on_note_delete
AFTER DELETE ON notes
BEGIN
    UPDATE workspaces
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.workspace_id;
END;

-- Trigger for shortcuts insert
CREATE TRIGGER IF NOT EXISTS update_workspace_timestamp_on_shortcut_insert
AFTER INSERT ON shortcuts
BEGIN
    UPDATE workspaces
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.workspace_id;
END;

-- Trigger for shortcuts update
CREATE TRIGGER IF NOT EXISTS update_workspace_timestamp_on_shortcut_update
AFTER UPDATE ON shortcuts
BEGIN
    UPDATE workspaces
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.workspace_id;
END;

-- Trigger for shortcuts delete
CREATE TRIGGER IF NOT EXISTS update_workspace_timestamp_on_shortcut_delete
AFTER DELETE ON shortcuts
BEGIN
    UPDATE workspaces
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.workspace_id;
END;
