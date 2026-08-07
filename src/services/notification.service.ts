import {
	isPermissionGranted,
	requestPermission,
	sendNotification as sendTauriNotification,
	onAction,
} from "@tauri-apps/plugin-notification";
import type { PluginListener } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useWorkspaceStore } from "../stores/workspaces";
import { Task, getAllGlobalTasksService } from "./tasks.service";

let actionListener: PluginListener | null = null;

/**
 * Checks if native notification permissions are granted.
 */
export async function checkNotificationPermission(): Promise<boolean> {
	try {
		return await isPermissionGranted();
	} catch (error) {
		console.warn("Failed to check notification permission:", error);
		return false;
	}
}

/**
 * Requests native notification permission from the user.
 */
export async function requestNotificationPermission(): Promise<boolean> {
	try {
		const granted = await isPermissionGranted();
		if (granted) return true;
		const permission = await requestPermission();
		return permission === "granted";
	} catch (error) {
		console.warn("Failed to request notification permission:", error);
		return false;
	}
}

/**
 * Registers click listener on notifications to focus Nook and open All Tasks view.
 */
export async function registerNotificationClickListener(): Promise<void> {
	if (actionListener) return;
	try {
		actionListener = await onAction(async () => {
			try {
				const currentWindow = getCurrentWindow();
				if (currentWindow.label === "main") {
					await currentWindow.unminimize();
					await currentWindow.show();
					await currentWindow.setFocus();

					const workspaceStore = useWorkspaceStore();
					workspaceStore.selectView("global-tasks");
				}
			} catch (e) {
				console.warn("Error handling notification click focus:", e);
			}
		});
	} catch (error) {
		console.warn("Failed to register notification click listener:", error);
	}
}

/**
 * Checks if a task is due today in the client's local timezone.
 */
export function isTaskDueToday(dueDateStr?: string): boolean {
	if (!dueDateStr) return false;
	const due = new Date(dueDateStr);
	if (isNaN(due.getTime())) return false;

	const now = new Date();
	return (
		due.getFullYear() === now.getFullYear() &&
		due.getMonth() === now.getMonth() &&
		due.getDate() === now.getDate()
	);
}

export interface TaskSummary {
	tasksDueToday: number;
	totalTasksRemaining: number;
}

/**
 * Computes task statistics: tasks due today and total remaining tasks.
 */
export async function getStartupTaskSummary(): Promise<TaskSummary> {
	try {
		const tasks: Task[] = await getAllGlobalTasksService();
		const remainingTasks = tasks.filter((t) => t.status !== "DONE");
		const tasksDueToday = remainingTasks.filter((t) => isTaskDueToday(t.due_date));

		return {
			tasksDueToday: tasksDueToday.length,
			totalTasksRemaining: remainingTasks.length,
		};
	} catch (error) {
		console.error("Failed to compute task summary:", error);
		return {
			tasksDueToday: 0,
			totalTasksRemaining: 0,
		};
	}
}

/**
 * Sends a native OS notification with the startup summary.
 */
export function sendStartupNativeNotification(summary: TaskSummary): void {
	try {
		let bodyText = "";
		if (summary.totalTasksRemaining === 0) {
			bodyText = "You are all caught up! Have a great day!";
		} else {
			bodyText = `You have ${summary.tasksDueToday} tasks due today out of ${summary.totalTasksRemaining} total tasks.`;
		}

		sendTauriNotification({
			title: "Nook Agenda",
			body: bodyText,
		});
	} catch (error) {
		console.warn("Failed to send native notification:", error);
	}
}
