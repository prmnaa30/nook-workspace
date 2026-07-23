import { defineStore } from "pinia";
import {
	searchAllShortcutsService,
	createShortcutService,
	deleteShortcutService,
	updateShortcutService,
	moveShortcutService,
	getShortcutsService,
	type Shortcut,
	type SearchShortcut,
} from "../services/shortcuts.service";
import { ref } from "vue";
import { useWorkspaceStore } from "./workspaces";

export const useShortcutStore = defineStore("shortcut", () => {
	const workspaceStore = useWorkspaceStore();
	const shortcuts = ref<Shortcut[]>([]);
	const allShortcuts = ref<SearchShortcut[]>([]);
	const currentWorkspaceId = ref<number | null>(null);

	async function getAllShortcuts() {
		allShortcuts.value = await searchAllShortcutsService();
	}

	async function getShortcuts(workspaceId: number) {
		currentWorkspaceId.value = workspaceId;
		shortcuts.value = await getShortcutsService(workspaceId);
	}

	async function createShortcut(
		workspaceId: number,
		title: string,
		type: "web" | "folder" | "file",
		path: string,
		browserPath: string | null,
	) {
		await createShortcutService(workspaceId, title, type, path, browserPath);

		if (currentWorkspaceId.value === workspaceId) {
			await getShortcuts(workspaceId);
		}
		await workspaceStore.getWorkspaces();
	}

	async function updateShortcut(
		workspaceId: number,
		shortcutId: number,
		title: string,
		type: "web" | "folder" | "file",
		path: string,
		browserPath: string | null,
	) {
		await updateShortcutService(shortcutId, title, type, path, browserPath);

		if (currentWorkspaceId.value === workspaceId) {
			await getShortcuts(workspaceId);
		}
		await workspaceStore.getWorkspaces();
	}

	async function moveShortcut(shortcutId: number, targetWorkspaceId: number) {
		await moveShortcutService(shortcutId, targetWorkspaceId);

		if (currentWorkspaceId.value !== null) {
			await getShortcuts(currentWorkspaceId.value);
		}
		await workspaceStore.getWorkspaces();
	}

	async function deleteShortcut(id: number) {
		await deleteShortcutService(id);

		if (currentWorkspaceId.value !== null) {
			await getShortcuts(currentWorkspaceId.value);
		}
		await workspaceStore.getWorkspaces();
	}

	return {
		allShortcuts,
		shortcuts,
		currentWorkspaceId,
		getAllShortcuts,
		getShortcuts,
		createShortcut,
		updateShortcut,
		moveShortcut,
		deleteShortcut,
	};
});
