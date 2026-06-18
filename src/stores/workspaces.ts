import { defineStore } from "pinia";
import { ref } from "vue";
import {
	Workspace,
	getWorkspaces,
	deleteWorkspace,
	addWorkspace,
	updateWorkspace,
	toggleFavorite,
} from "../services/workspaces";

export const useWorkspaceStore = defineStore("workspace", () => {
	const workspaces = ref<Workspace[]>([]);
	const currentWorkspaceId = ref<number | null>(null);

	async function fetchWorkspaces() {
		try {
			workspaces.value = await getWorkspaces();
		} catch (error) {
			console.error("Failed to load workspaces:", error);
		}
	}

	async function removeWorkspace(id: number) {
		await deleteWorkspace(id);
		await fetchWorkspaces();
	}

	async function createWorkspace(name: string, description: string) {
		await addWorkspace(name, description);
		await fetchWorkspaces();
	}

	async function editWorkspace(id: number, name: string, description: string) {
		await updateWorkspace(id, name, description);
		await fetchWorkspaces();
	}

	async function toggleWorkspaceFavorite(id: number, isFavorite: boolean) {
		await toggleFavorite(id, isFavorite);
		await fetchWorkspaces();
	}

	function selectWorkspace(id: number) {
		currentWorkspaceId.value = id;
	}

	return {
		workspaces,
		currentWorkspaceId,
		fetchWorkspaces,
		removeWorkspace,
		createWorkspace,
		editWorkspace,
		toggleWorkspaceFavorite,
		selectWorkspace,
	};
});
