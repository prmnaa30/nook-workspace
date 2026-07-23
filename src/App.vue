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
import WorkspaceSidebar from "./components/workspace/WorkspaceSidebar.vue";
import WorkspaceDetails from "./components/workspace/WorkspaceDetails.vue";
import Dashboard from "./components/common/Dashboard.vue";
import GlobalTasks from "./components/tasks/GlobalTasks.vue";
import GlobalTimeline from "./components/timeline/GlobalTimeline.vue";
import FloatingCommandBar from "./components/floating/FloatingCommandBar.vue";

import { useWorkspaceStore } from "./stores/workspaces";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";

const workspaceStore = useWorkspaceStore();

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
		listen<{ workspaceId: number; noteId: number }>("open-note", async (event) => {
			const { workspaceId, noteId } = event.payload;

			workspaceStore.selectWorkspace(workspaceId);

			setTimeout(() => {
				if (workspaceDetailsRef.value) {
					workspaceDetailsRef.value.switchToNotesTabAndOpen(noteId);
				}
			}, 100);
		});
	}

	await workspaceStore.getWorkspaces();
});

onUnmounted(() => {
	window.removeEventListener("keydown", handleKeyDown);
	window.removeEventListener("contextmenu", handleContextMenu);
});
</script>
