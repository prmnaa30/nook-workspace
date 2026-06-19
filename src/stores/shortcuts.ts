import { defineStore } from "pinia";
import {
	addShortcut,
	deleteShortcut,
	editShortcut,
	getShortcuts,
	type Shortcut,
} from "../services/shortcuts";
import { ref } from "vue";

export const useShortcutStore = defineStore("shortcut", () => {
	const shortcuts = ref<Shortcut[]>([]);
	const currentWorkspaceId = ref<number | null>(null);

	async function fetchShortcuts(workspaceId: number) {
		currentWorkspaceId.value = workspaceId;
		shortcuts.value = await getShortcuts(workspaceId);
	}

	async function createShortcut(
		workspaceId: number,
		title: string,
		type: "web" | "folder" | "file",
		path: string,
		browserPath: string | null,
	) {
		await addShortcut(workspaceId, title, type, path, browserPath);

		if (currentWorkspaceId.value === workspaceId) {
			await fetchShortcuts(workspaceId);
		}
	}

	async function updateShortcut(
		workspaceId: number,
		shortcutId: number,
		title: string,
		type: "web" | "folder" | "file",
		path: string,
		browserPath: string | null,
	) {
		await editShortcut(shortcutId, title, type, path, browserPath);

		if (currentWorkspaceId.value === workspaceId) {
			await fetchShortcuts(workspaceId);
		}
	}

	async function removeShortcut(id: number) {
		await deleteShortcut(id);

		if (currentWorkspaceId.value !== null) {
			await fetchShortcuts(currentWorkspaceId.value);
		}
	}

	return {
		shortcuts,
		currentWorkspaceId,
		fetchShortcuts,
		createShortcut,
		updateShortcut,
		removeShortcut,
	};
});
