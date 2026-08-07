import { commands } from "../bindings";

export interface TaskSummary {
	tasksDueToday: number;
	totalTasksRemaining: number;
}

/**
 * Invokes Rust backend to process startup agenda, trigger Windows native notification,
 * and return task summary for in-app Vue toast.
 */
export async function getStartupTaskSummary(): Promise<TaskSummary> {
	try {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, "0");
		const day = String(now.getDate()).padStart(2, "0");
		const todayStr = `${year}-${month}-${day}`;

		const raw = await commands.showStartupAgenda(todayStr);
		const res = (raw as any).data ?? raw;
		return {
			tasksDueToday: res.tasks_due_today ?? res.tasksDueToday ?? 0,
			totalTasksRemaining: res.total_tasks_remaining ?? res.totalTasksRemaining ?? 0,
		};
	} catch (error) {
		console.error("Failed to fetch startup task summary from Rust backend:", error);
		return {
			tasksDueToday: 0,
			totalTasksRemaining: 0,
		};
	}
}

export async function checkNotificationPermission(): Promise<boolean> {
	return true;
}

export async function requestNotificationPermission(): Promise<boolean> {
	return true;
}

export async function registerNotificationClickListener(): Promise<void> {
	// Handled natively
}

export function sendStartupNativeNotification(_summary: TaskSummary): void {
	// Native Windows notification sent directly in Rust via winrt-notification
}
