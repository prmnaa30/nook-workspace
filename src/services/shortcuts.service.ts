import { dbPromise } from "./db";

export interface Shortcut {
	id: number;
	workspace_id: number;
	title: string;
	type: "web" | "folder" | "file";
	path: string;
	browser_path: string | null;
}

export interface SearchShortcut extends Shortcut {
	workspace_name: string;
}

export async function searchAllShortcutsService(): Promise<SearchShortcut[]> {
	const db = await dbPromise;
	return db.select(`
		SELECT s.*, w.name as workspace_name 
		FROM shortcuts s 
		JOIN workspaces w ON s.workspace_id = w.id 
		ORDER BY s.title ASC
	`);
}

export async function getShortcutsService(workspadeId: number): Promise<Shortcut[]> {
	const db = await dbPromise;
	return await db.select(
		"SELECT * FROM shortcuts WHERE workspace_id = $1 ORDER BY id ASC",
		[workspadeId],
	);
}

export async function createShortcutService(
	workspaceId: number,
	title: string,
	type: string,
	path: string,
	browserPath: string | null = null,
): Promise<void> {
	const db = await dbPromise;
	await db.execute(
		"INSERT INTO shortcuts (workspace_id, title, type, path, browser_path) VALUES ($1, $2, $3, $4, $5)",
		[workspaceId, title, type, path, browserPath],
	);
}

export async function updateShortcutService(
	shortcutId: number,
	title: string,
	type: string,
	path: string,
	browserPath: string | null = null,
): Promise<void> {
	const db = await dbPromise;
	await db.execute(
		"UPDATE shortcuts SET title = $1, type = $2, path = $3, browser_path = $4 WHERE id = $5",
		[title, type, path, browserPath, shortcutId],
	);
}

export async function deleteShortcutService(id: number): Promise<void> {
	const db = await dbPromise;
	await db.execute("DELETE FROM shortcuts WHERE id = $1", [id]);
}
