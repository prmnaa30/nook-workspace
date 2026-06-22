import { dbPromise } from "./db";

export interface Note {
	id: number;
	workspace_id: number;
	title: string;
	filename: string;
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
): Promise<void> {
	const db = await dbPromise;
	await db.execute(
		"INSERT INTO notes (workspace_id, title, filename) VALUES ($1, $2, $3)",
		[workspaceId, title, filename],
	);
}

export async function updateNoteService(noteId: number, title: string, filename: string) {
	const db = await dbPromise;
	await db.execute("UPDATE notes SET title = $1, filename = $2 WHERE id = $3", [
		title,
		filename,
		noteId,
	]);
}

export async function deleteNoteService(noteId: number) {
	const db = await dbPromise;
	await db.execute("DELETE FROM notes WHERE id = $1", [noteId]);
}
