import { commands } from "../bindings";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface Task {
  id: number;
  workspace_id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  due_date?: string;
  reminder_at?: string;
  reminder_sent?: number;
  created_at: string;
  workspace_name?: string;
}

function unwrapArrayResult<T>(res: any, commandName: string): T[] {
  if (res && typeof res === "object" && "status" in res) {
    if (res.status === "ok") {
      return Array.isArray(res.data) ? res.data : [];
    }
    console.error(`[IPC Error in ${commandName}]:`, res.error);
    return [];
  }
  return Array.isArray(res) ? res : [];
}

function unwrapVoidResult(res: any, commandName: string): void {
  if (res && typeof res === "object" && "status" in res) {
    if (res.status === "error") {
      console.error(`[IPC Error in ${commandName}]:`, res.error);
      throw new Error(res.error || `Command ${commandName} failed`);
    }
  }
}

export async function getTasksByWorkspaceService(workspaceId: number): Promise<Task[]> {
  const res = await commands.getTasksByWorkspace(workspaceId);
  return unwrapArrayResult<Task>(res, "getTasksByWorkspace");
}

export async function getAllGlobalTasksService(): Promise<Task[]> {
  const res = await commands.getAllGlobalTasks();
  return unwrapArrayResult<Task>(res, "getAllGlobalTasks");
}

export async function getAllTasksForTimelineService(): Promise<Task[]> {
  const res = await commands.getAllTasksForTimeline();
  return unwrapArrayResult<Task>(res, "getAllTasksForTimeline");
}

export async function createTaskService(
  workspaceId: number,
  title: string,
  description?: string,
  dueDate?: string,
  reminderAt?: string
): Promise<void> {
  const res = await commands.createTask(
    workspaceId,
    title,
    description || null,
    dueDate || null,
    reminderAt || null
  );
  unwrapVoidResult(res, "createTask");
}

export async function updateTaskStatusService(
  taskId: number,
  status: TaskStatus
): Promise<void> {
  const res = await commands.updateTaskStatus(taskId, status);
  unwrapVoidResult(res, "updateTaskStatus");
}

export async function updateTaskService(
  taskId: number,
  title: string,
  description?: string,
  dueDate?: string,
  status?: TaskStatus,
  reminderAt?: string
): Promise<void> {
  const res = await commands.updateTask(
    taskId,
    title,
    description || null,
    dueDate || null,
    status || null,
    reminderAt || null
  );
  unwrapVoidResult(res, "updateTask");
}

export async function setTaskReminderService(
  taskId: number,
  reminderAt?: string
): Promise<void> {
  const res = await commands.setTaskReminder(taskId, reminderAt || null);
  unwrapVoidResult(res, "setTaskReminder");
}

export async function clearTaskReminderService(taskId: number): Promise<void> {
  const res = await commands.clearTaskReminder(taskId);
  unwrapVoidResult(res, "clearTaskReminder");
}

export async function deleteTaskService(taskId: number): Promise<void> {
  const res = await commands.deleteTask(taskId);
  unwrapVoidResult(res, "deleteTask");
}
