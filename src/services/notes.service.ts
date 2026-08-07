import { commands, Note as NoteType, NoteWithWorkspace } from "../bindings";

export type Note = NoteType;
export type SearchNote = NoteWithWorkspace;

export async function searchAllNotesService(): Promise<SearchNote[]> {
	const res = await commands.searchAllNotes();
	return ((res as any).data ?? res) as SearchNote[];
}

export async function getNotesService(workspaceId: number): Promise<Note[]> {
	const res = await commands.getNotes(workspaceId);
	return ((res as any).data ?? res) as Note[];
}

export async function createNoteService(
	workspaceId: number,
	title: string,
	filename: string,
	isPinned: boolean = false,
): Promise<void> {
	await commands.createNote(workspaceId, title, filename, isPinned);
}

export async function updateNoteService(
	noteId: number,
	title: string,
	filename: string,
	isPinned?: boolean,
): Promise<void> {
	await commands.updateNote(noteId, title, filename, isPinned ?? null);
}

export async function toggleNotePinService(noteId: number, isPinned: boolean): Promise<void> {
	await commands.toggleNotePin(noteId, isPinned);
}

export async function updateNoteTimestampService(noteId: number): Promise<void> {
	await commands.updateNoteTimestamp(noteId);
}

export async function moveNoteService(
	noteId: number,
	targetWorkspaceId: number,
): Promise<void> {
	await commands.moveNote(noteId, targetWorkspaceId);
}

export async function deleteNoteService(noteId: number): Promise<void> {
	await commands.deleteNote(noteId);
}
