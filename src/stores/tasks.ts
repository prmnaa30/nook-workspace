import { defineStore } from "pinia";
import { ref } from "vue";
import {
  Task,
  TaskStatus,
  getTasksByWorkspaceService,
  getAllGlobalTasksService,
  getAllTasksForTimelineService,
  createTaskService,
  updateTaskStatusService,
  updateTaskService,
  setTaskReminderService,
  clearTaskReminderService,
  deleteTaskService,
} from "../services/tasks.service";
import { useWorkspaceStore } from "./workspaces";

export const useTaskStore = defineStore("task", () => {
  const workspaceTasks = ref<Task[]>([]);
  const globalTasks = ref<Task[]>([]);
  const timelineTasks = ref<Task[]>([]);
  const loading = ref<boolean>(false);

  async function refreshWorkspaces() {
    const workspaceStore = useWorkspaceStore();
    await workspaceStore.getWorkspaces();
  }

  async function getTasksByWorkspace(workspaceId: number) {
    loading.value = true;
    try {
      workspaceTasks.value = await getTasksByWorkspaceService(workspaceId);
    } catch (error) {
      console.error("Failed to load workspace tasks:", error);
    } finally {
      loading.value = false;
    }
  }

  async function getGlobalTasks() {
    loading.value = true;
    try {
      globalTasks.value = await getAllGlobalTasksService();
    } catch (error) {
      console.error("Failed to load global tasks:", error);
    } finally {
      loading.value = false;
    }
  }

  async function getTimelineTasks() {
    loading.value = true;
    try {
      timelineTasks.value = await getAllTasksForTimelineService();
    } catch (error) {
      console.error("Failed to load timeline tasks:", error);
    } finally {
      loading.value = false;
    }
  }

  async function createTask(
    workspaceId: number,
    title: string,
    description?: string,
    dueDate?: string,
    reminderAt?: string
  ) {
    await createTaskService(workspaceId, title, description, dueDate, reminderAt);
    await getTasksByWorkspace(workspaceId);
    await getGlobalTasks();
    await getTimelineTasks();
    await refreshWorkspaces();
  }

  async function updateTaskStatus(
    taskId: number,
    status: TaskStatus,
    workspaceId?: number
  ) {
    await updateTaskStatusService(taskId, status);
    if (workspaceId) {
      await getTasksByWorkspace(workspaceId);
    }
    await getGlobalTasks();
    await getTimelineTasks();
    await refreshWorkspaces();
  }

  async function updateTask(
    taskId: number,
    title: string,
    description?: string,
    dueDate?: string,
    status?: TaskStatus,
    workspaceId?: number,
    reminderAt?: string
  ) {
    await updateTaskService(taskId, title, description, dueDate, status, reminderAt);
    if (workspaceId) {
      await getTasksByWorkspace(workspaceId);
    }
    await getGlobalTasks();
    await getTimelineTasks();
    await refreshWorkspaces();
  }

  async function setTaskReminder(
    taskId: number,
    reminderAt?: string,
    workspaceId?: number
  ) {
    await setTaskReminderService(taskId, reminderAt);
    if (workspaceId) {
      await getTasksByWorkspace(workspaceId);
    }
    await getGlobalTasks();
    await getTimelineTasks();
    await refreshWorkspaces();
  }

  async function clearTaskReminder(taskId: number, workspaceId?: number) {
    await clearTaskReminderService(taskId);
    if (workspaceId) {
      await getTasksByWorkspace(workspaceId);
    }
    await getGlobalTasks();
    await getTimelineTasks();
    await refreshWorkspaces();
  }

  async function deleteTask(taskId: number, workspaceId?: number) {
    await deleteTaskService(taskId);
    if (workspaceId) {
      await getTasksByWorkspace(workspaceId);
    }
    await getGlobalTasks();
    await getTimelineTasks();
    await refreshWorkspaces();
  }

  return {
    workspaceTasks,
    globalTasks,
    timelineTasks,
    loading,
    getTasksByWorkspace,
    getGlobalTasks,
    getTimelineTasks,
    createTask,
    updateTaskStatus,
    updateTask,
    setTaskReminder,
    clearTaskReminder,
    deleteTask,
  };
});
