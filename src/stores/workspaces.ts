import { defineStore } from "pinia";
import { ref } from "vue";
import {
	Workspace,
	getWorkspacesService,
	deleteWorkspaceService,
	createWorkspaceService,
	updateWorkspaceService,
	toggleFavoriteService,
	toggleWorkspaceGlobalVisibilityService,
} from "../services/workspaces.service";

export type ActiveView = "dashboard" | "global-tasks" | "global-timeline" | "workspace";

export const useWorkspaceStore = defineStore("workspace", () => {
	const workspaces = ref<Workspace[]>([]);
	const currentWorkspaceId = ref<number | null>(null);
	const currentView = ref<ActiveView>("dashboard");
	const lastWorkspaceId = ref<number | null>(
		Number(localStorage.getItem("nook_last_workspace_id")) || null
	);

	async function getWorkspaces() {
		try {
			workspaces.value = await getWorkspacesService();
			if (lastWorkspaceId.value && !workspaces.value.some((w) => w.id === lastWorkspaceId.value)) {
				lastWorkspaceId.value = workspaces.value[0]?.id || null;
			}
		} catch (error) {
			console.error("Failed to load workspaces:", error);
		}
	}

	async function deleteWorkspace(id: number) {
		await deleteWorkspaceService(id);
		if (currentWorkspaceId.value === id) {
			selectView("dashboard");
		}
		await getWorkspaces();
	}

	async function createWorkspace(name: string, description: string, showInGlobalTasks: boolean = true) {
		await createWorkspaceService(name, description, showInGlobalTasks);
		await getWorkspaces();
	}

	async function updateWorkspace(id: number, name: string, description: string, showInGlobalTasks?: boolean) {
		await updateWorkspaceService(id, name, description, showInGlobalTasks);
		await getWorkspaces();
	}

	async function toggleFavorite(id: number, isFavorite: boolean) {
		await toggleFavoriteService(id, isFavorite);
		await getWorkspaces();
	}

	async function toggleGlobalVisibility(id: number, isVisible: boolean) {
		await toggleWorkspaceGlobalVisibilityService(id, isVisible);
		await getWorkspaces();
	}

	function selectWorkspace(id: number | null) {
		currentWorkspaceId.value = id;
		if (id !== null) {
			lastWorkspaceId.value = id;
			localStorage.setItem("nook_last_workspace_id", String(id));
			currentView.value = "workspace";
		} else {
			currentView.value = "dashboard";
		}
	}

	function selectView(view: ActiveView) {
		currentView.value = view;
		if (view !== "workspace") {
			currentWorkspaceId.value = null;
		}
	}

	return {
		workspaces,
		currentWorkspaceId,
		currentView,
		lastWorkspaceId,
		getWorkspaces,
		deleteWorkspace,
		createWorkspace,
		updateWorkspace,
		toggleFavorite,
		toggleGlobalVisibility,
		selectWorkspace,
		selectView,
	};
});
