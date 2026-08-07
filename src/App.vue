<template>
	<UApp>
		<div
			v-if="windowLabel === 'floating'"
			class="w-full h-full"
		>
			<FloatingCommandBar />
		</div>
		<div v-else class="flex w-screen h-screen overflow-hidden bg-neutral-900 text-neutral-100">
			<WorkspaceSidebar />
			<main class="flex-1 h-full overflow-hidden bg-white dark:bg-neutral-950">
				<Dashboard v-if="workspaceStore.currentView === 'dashboard'" />
				<GlobalTasks v-else-if="workspaceStore.currentView === 'global-tasks'" />
				<GlobalTimeline v-else-if="workspaceStore.currentView === 'global-timeline'" />
				<WorkspaceDetails
					v-else-if="workspaceStore.currentView === 'workspace' && workspaceStore.currentWorkspaceId"
					ref="workspaceDetailsRef"
					:workspace-id="workspaceStore.currentWorkspaceId"
				/>
			</main>
		</div>
	</UApp>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useToast } from "@nuxt/ui/composables";
import WorkspaceSidebar from "./components/workspace/WorkspaceSidebar.vue";
import WorkspaceDetails from "./components/workspace/WorkspaceDetails.vue";
import Dashboard from "./components/common/Dashboard.vue";
import GlobalTasks from "./components/tasks/GlobalTasks.vue";
import GlobalTimeline from "./components/timeline/GlobalTimeline.vue";
import FloatingCommandBar from "./components/floating/FloatingCommandBar.vue";

import { useWorkspaceStore } from "./stores/workspaces";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import {
	checkForUpdates,
	notifyUpdateAvailable,
	openReleasePage,
	syncAutostartPreferenceOnBoot,
	getAppSetting,
} from "./services/update.service";
import {
	checkNotificationPermission,
	requestNotificationPermission,
	registerNotificationClickListener,
	getStartupTaskSummary,
	sendStartupNativeNotification,
} from "./services/notification.service";

const workspaceStore = useWorkspaceStore();
const toast = useToast();

const windowLabel = ref("main");
const workspaceDetailsRef = ref<any>(null);

const handleKeyDown = (event: KeyboardEvent) => {
	if (event.key === "Escape") {
		const hasActiveModal = document.querySelector(
			'[role="dialog"], [role="alertdialog"], [role="menu"], [data-radix-popper-content-wrapper]'
		);
		if (hasActiveModal) {
			return;
		}

		if (workspaceStore.currentView !== "dashboard") {
			workspaceStore.selectView("dashboard");
		}
	}

	if ((event.ctrlKey || event.metaKey) && (event.key === "a" || event.key === "A")) {
		const target = event.target as HTMLElement;
		const isInput =
			target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

		if (!isInput) {
			event.preventDefault();
		}
	}
};

const handleContextMenu = (event: MouseEvent) => {
	event.preventDefault();
};

onMounted(async () => {
	window.addEventListener("keydown", handleKeyDown);
	window.addEventListener("contextmenu", handleContextMenu);
	try {
		const currentWindow = getCurrentWindow();
		windowLabel.value = currentWindow.label;
	} catch (error) {
		console.warn("Not in the Tauri desktop environment: ", error);
	}

	if (windowLabel.value === "main") {
		// Sync autostart setting on boot (respects user's explicit disabled/enabled preference across updates)
		syncAutostartPreferenceOnBoot();

		listen<{ workspaceId: number; noteId: number }>("open-note", async (event) => {
			const { workspaceId, noteId } = event.payload;

			workspaceStore.selectWorkspace(workspaceId);

			setTimeout(() => {
				if (workspaceDetailsRef.value) {
					workspaceDetailsRef.value.switchToNotesTabAndOpen(noteId);
				}
			}, 100);
		});

		// Register notification click listener
		registerNotificationClickListener();

		// Startup agenda notification check
		setTimeout(async () => {
			try {
				const pref = await getAppSetting("startup_notification_enabled");
				if (pref === "disabled") {
					return;
				}

				const currentWindow = getCurrentWindow();
				const isVisible = await currentWindow.isVisible();

				let permissionGranted = await checkNotificationPermission();

				// If window is visible (manual launch) and permission not granted, request permission
				if (isVisible && !permissionGranted) {
					permissionGranted = await requestNotificationPermission();
				}

				const summary = await getStartupTaskSummary();

				// Send native OS notification if permission is granted
				if (permissionGranted) {
					sendStartupNativeNotification(summary);
				}

				// Display in-app toast if window is visible
				if (isVisible) {
					const toastDescription =
						summary.totalTasksRemaining === 0
							? "You are all caught up! Have a great day!"
							: `You have ${summary.tasksDueToday} tasks due today out of ${summary.totalTasksRemaining} total tasks.`;

					toast.add({
						title: "Today's Agenda",
						description: toastDescription,
						icon: "i-lucide-bell",
						color: summary.tasksDueToday > 0 ? "warning" : "primary",
						actions:
							summary.totalTasksRemaining > 0
								? [
										{
											label: "View Tasks",
											onClick: () => workspaceStore.selectView("global-tasks"),
										},
								  ]
								: [],
					});
				}
			} catch (e) {
				console.warn("Startup notification check error:", e);
			}
		}, 1000);

		// Run 24h throttled automatic update check on startup
		setTimeout(async () => {
			try {
				const res = await checkForUpdates(true);
				if (res?.hasUpdate && res.latestVersion) {
					await notifyUpdateAvailable(res.latestVersion);
					toast.add({
						title: `Nook v${res.latestVersion} Available!`,
						description: "A new version of Nook is available on GitHub Releases.",
						icon: "i-lucide-arrow-up-circle",
						color: "primary",
						actions: [
							{
								label: "View Release Page",
								onClick: () => openReleasePage(res.releaseUrl),
							},
						],
					});
				}
			} catch (e) {
				console.warn("Automatic update check error:", e);
			}
		}, 2000);
	}

	await workspaceStore.getWorkspaces();
});

onUnmounted(() => {
	window.removeEventListener("keydown", handleKeyDown);
	window.removeEventListener("contextmenu", handleContextMenu);
});
</script>
