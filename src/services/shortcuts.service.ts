import { commands, Shortcut as ShortcutType, ShortcutWithWorkspace } from "../bindings";

export type Shortcut = Omit<ShortcutType, "type"> & { type: "web" | "folder" | "file" };
export type SearchShortcut = Omit<ShortcutWithWorkspace, "type"> & { type: "web" | "folder" | "file" };

export async function searchAllShortcutsService(): Promise<SearchShortcut[]> {
	const res = await commands.searchAllShortcuts();
	return ((res as any).data ?? res) as SearchShortcut[];
}

export async function getShortcutsService(workspaceId: number): Promise<Shortcut[]> {
	const res = await commands.getShortcuts(workspaceId);
	return ((res as any).data ?? res) as Shortcut[];
}

export async function createShortcutService(
	workspaceId: number,
	title: string,
	type: string,
	path: string,
	browserPath: string | null = null,
	isPinned: boolean = false,
): Promise<void> {
	await commands.createShortcut(workspaceId, title, type, path, browserPath, isPinned);
}

export async function updateShortcutService(
	shortcutId: number,
	title: string,
	type: string,
	path: string,
	browserPath: string | null = null,
	isPinned?: boolean,
): Promise<void> {
	await commands.updateShortcut(shortcutId, title, type, path, browserPath, isPinned ?? null);
}

export async function toggleShortcutPinService(shortcutId: number, isPinned: boolean): Promise<void> {
	await commands.toggleShortcutPin(shortcutId, isPinned);
}

export async function moveShortcutService(
	shortcutId: number,
	targetWorkspaceId: number,
): Promise<void> {
	await commands.moveShortcut(shortcutId, targetWorkspaceId);
}

export async function deleteShortcutService(id: number): Promise<void> {
	await commands.deleteShortcut(id);
}
