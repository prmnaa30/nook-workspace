import { dbPromise } from "./db";

export interface Note {
	id: number;
	workspace_id: number;
	title: string;
	filename: string;
	is_pinned: number;
}

export interface SearchNote extends Note {
	workspace_name: string;
}

export async function searchAllNotesService(): Promise<SearchNote[]> {
	const db = await dbPromise;
	return db.select(`
		SELECT n.*, w.name as workspace_name 
		FROM notes n 
		JOIN workspaces w ON n.workspace_id = w.id 
		ORDER BY n.title ASC
	`);
}

export async function getNotesService(workspaceId: number): Promise<Note[]> {
	const db = await dbPromise;
	return db.select(
		"SELECT * FROM notes WHERE workspace_id = $1 ORDER BY id DESC",
		[workspaceId],
	);
}

export async function createNoteService(
	workspaceId: number,
	title: string,
	filename: string,
	isPinned: boolean = false,
): Promise<void> {
	const db = await dbPromise;
	await db.execute(
		"INSERT INTO notes (workspace_id, title, filename, is_pinned) VALUES ($1, $2, $3, $4)",
		[workspaceId, title, filename, isPinned ? 1 : 0],
	);
}

export async function updateNoteService(
	noteId: number,
	title: string,
	filename: string,
	isPinned?: boolean,
) {
	const db = await dbPromise;
	if (isPinned !== undefined) {
		await db.execute(
			"UPDATE notes SET title = $1, filename = $2, is_pinned = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4",
			[title, filename, isPinned ? 1 : 0, noteId],
		);
	} else {
		await db.execute(
			"UPDATE notes SET title = $1, filename = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
			[title, filename, noteId],
		);
	}
}

export async function toggleNotePinService(noteId: number, isPinned: boolean) {
	const db = await dbPromise;
	await db.execute(
		"UPDATE notes SET is_pinned = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
		[isPinned ? 1 : 0, noteId],
	);
}

export async function updateNoteTimestampService(noteId: number) {
	const db = await dbPromise;
	await db.execute(
		"UPDATE notes SET updated_at = CURRENT_TIMESTAMP WHERE id = $1",
		[noteId],
	);
}

export async function moveNoteService(
	noteId: number,
	targetWorkspaceId: number,
) {
	const db = await dbPromise;
	await db.execute(
		"UPDATE notes SET workspace_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
		[targetWorkspaceId, noteId],
	);
	await db.execute(
		"UPDATE workspaces SET updated_at = CURRENT_TIMESTAMP WHERE id = $1",
		[targetWorkspaceId],
	);
}

export async function deleteNoteService(noteId: number) {
	const db = await dbPromise;
	await db.execute("DELETE FROM notes WHERE id = $1", [noteId]);
}
