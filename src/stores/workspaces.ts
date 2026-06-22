import { defineStore } from "pinia";
import { ref } from "vue";
import {
	Workspace,
	getWorkspacesService,
	deleteWorkspaceService,
	createWorkspaceService,
	updateWorkspaceService,
	toggleFavoriteService,
} from "../services/workspaces.service";

export const useWorkspaceStore = defineStore("workspace", () => {
	const workspaces = ref<Workspace[]>([]);
	const currentWorkspaceId = ref<number | null>(null);

	async function getWorkspaces() {
		try {
			workspaces.value = await getWorkspacesService();
		} catch (error) {
			console.error("Failed to load workspaces:", error);
		}
	}

	async function deleteWorkspace(id: number) {
		await deleteWorkspaceService(id);
		await getWorkspaces();
	}

	async function createWorkspace(name: string, description: string) {
		await createWorkspaceService(name, description);
		await getWorkspaces();
	}

	async function updateWorkspace(id: number, name: string, description: string) {
		await updateWorkspaceService(id, name, description);
		await getWorkspaces();
	}

	async function toggleFavorite(id: number, isFavorite: boolean) {
		await toggleFavoriteService(id, isFavorite);
		await getWorkspaces();
	}

	function selectWorkspace(id: number | null) {
		currentWorkspaceId.value = id;
	}

	return {
		workspaces,
		currentWorkspaceId,
		getWorkspaces,
		deleteWorkspace,
		createWorkspace,
		updateWorkspace,
		toggleFavorite,
		selectWorkspace,
	};
});
