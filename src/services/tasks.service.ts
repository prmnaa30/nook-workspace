import { dbPromise } from "./db";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface Task {
  id: number;
  workspace_id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  due_date?: string;
  created_at: string;
  workspace_name?: string;
}

export async function getTasksByWorkspaceService(workspaceId: number): Promise<Task[]> {
  const db = await dbPromise;
  return db.select(
    "SELECT * FROM tasks WHERE workspace_id = $1 ORDER BY id DESC",
    [workspaceId]
  );
}

export async function getAllGlobalTasksService(): Promise<Task[]> {
  const db = await dbPromise;
  return db.select(`
    SELECT t.*, w.name as workspace_name
    FROM tasks t
    JOIN workspaces w ON t.workspace_id = w.id
    WHERE (w.show_in_global_tasks = 1 OR w.show_in_global_tasks IS NULL)
    ORDER BY
      t.due_date ASC,
      t.id DESC
  `);
}

export async function getAllTasksForTimelineService(): Promise<Task[]> {
  const db = await dbPromise;
  return db.select(`
    SELECT t.*, w.name as workspace_name
    FROM tasks t
    JOIN workspaces w ON t.workspace_id = w.id
    WHERE w.show_in_global_tasks = 1 OR w.show_in_global_tasks IS NULL
    ORDER BY
      t.due_date ASC,
      t.id DESC
  `);
}

export async function createTaskService(
  workspaceId: number,
  title: string,
  description?: string,
  dueDate?: string
): Promise<void> {
  const db = await dbPromise;
  await db.execute(
    "INSERT INTO tasks (workspace_id, title, description, due_date) VALUES ($1, $2, $3, $4)",
    [workspaceId, title, description || null, dueDate || null]
  );
  await db.execute(
    "UPDATE workspaces SET updated_at = CURRENT_TIMESTAMP WHERE id = $1",
    [workspaceId]
  );
}

export async function updateTaskStatusService(
  taskId: number,
  status: TaskStatus
): Promise<void> {
  const db = await dbPromise;
  await db.execute(
    "UPDATE workspaces SET updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT workspace_id FROM tasks WHERE id = $1)",
    [taskId]
  );
  await db.execute("UPDATE tasks SET status = $1 WHERE id = $2", [
    status,
    taskId,
  ]);
}

export async function updateTaskService(
  taskId: number,
  title: string,
  description?: string,
  dueDate?: string,
  status?: TaskStatus
): Promise<void> {
  const db = await dbPromise;
  await db.execute(
    "UPDATE workspaces SET updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT workspace_id FROM tasks WHERE id = $1)",
    [taskId]
  );
  if (status) {
    await db.execute(
      "UPDATE tasks SET title = $1, description = $2, due_date = $3, status = $4 WHERE id = $5",
      [title, description || null, dueDate || null, status, taskId]
    );
  } else {
    await db.execute(
      "UPDATE tasks SET title = $1, description = $2, due_date = $3 WHERE id = $4",
      [title, description || null, dueDate || null, taskId]
    );
  }
}

export async function deleteTaskService(taskId: number): Promise<void> {
  const db = await dbPromise;
  await db.execute(
    "UPDATE workspaces SET updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT workspace_id FROM tasks WHERE id = $1)",
    [taskId]
  );
  await db.execute("DELETE FROM tasks WHERE id = $1", [taskId]);
}
