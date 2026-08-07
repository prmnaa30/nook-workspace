import { commands } from "../bindings";

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
  const res = await commands.getTasksByWorkspace(workspaceId);
  return ((res as any).data ?? res) as Task[];
}

export async function getAllGlobalTasksService(): Promise<Task[]> {
  const res = await commands.getAllGlobalTasks();
  return ((res as any).data ?? res) as Task[];
}

export async function getAllTasksForTimelineService(): Promise<Task[]> {
  const res = await commands.getAllTasksForTimeline();
  return ((res as any).data ?? res) as Task[];
}

export async function createTaskService(
  workspaceId: number,
  title: string,
  description?: string,
  dueDate?: string
): Promise<void> {
  await commands.createTask(workspaceId, title, description || null, dueDate || null);
}

export async function updateTaskStatusService(
  taskId: number,
  status: TaskStatus
): Promise<void> {
  await commands.updateTaskStatus(taskId, status);
}

export async function updateTaskService(
  taskId: number,
  title: string,
  description?: string,
  dueDate?: string,
  status?: TaskStatus
): Promise<void> {
  await commands.updateTask(taskId, title, description || null, dueDate || null, status || null);
}

export async function deleteTaskService(taskId: number): Promise<void> {
  await commands.deleteTask(taskId);
}
