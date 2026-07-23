import { defineStore } from "pinia";
import { ref } from "vue";
import {
	createNoteService,
	deleteNoteService,
	getNotesService,
	moveNoteService,
	searchAllNotesService,
	SearchNote,
	updateNoteService,
	updateNoteTimestampService,
	type Note,
} from "../services/notes.service";
import { invoke } from "@tauri-apps/api/core";
import { useWorkspaceStore } from "./workspaces";

export const useNoteStore = defineStore("notes", () => {
	const workspaceStore = useWorkspaceStore();
	const notes = ref<Note[]>([]);
	const allNotes = ref<SearchNote[]>([]);
	const activeNote = ref<Note | null>(null);

	function sanitizeFilename(title: string): string {
		return title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/(^-|-$)+/g, "");
	}

	async function getAllNotes() {
		allNotes.value = await searchAllNotesService();
	}

	async function getNotes(workspaceId: number) {
		notes.value = await getNotesService(workspaceId);

		if (
			activeNote.value &&
			!notes.value.find((note) => note.id === activeNote.value!.id)
		) {
			activeNote.value = null;
		}
	}

	async function createNote(workspaceId: number, title: string) {
		const cleanTitle = title.trim();
		if (!cleanTitle) return;

		const sanitized = sanitizeFilename(cleanTitle);
		const filename = `${Date.now()}_${sanitized || "untitled-note"}.md`;

		try {
			await createNoteService(workspaceId, cleanTitle, filename);

			await invoke("write_note", {
				workspaceId,
				filename,
				content: `# ${cleanTitle}\n\n`,
			});

			await getNotes(workspaceId);
			await workspaceStore.getWorkspaces();

			const newNote = notes.value.find((note) => note.filename === filename);
			if (newNote) {
				activeNote.value = newNote;
			}
		} catch (error) {
			console.error("Failed to create new note: ", error);
		}
	}

	async function updateNote(
		workspaceId: number,
		noteId: number,
		newTitle: string,
	) {
		const cleanTitle = newTitle.trim();
		if (!cleanTitle) return;

		const oldNote = notes.value.find((n) => n.id === noteId);
		if (!oldNote) return;

		const prefixMatch = oldNote.filename.match(/^(\d+_)/);
		const prefix = prefixMatch ? prefixMatch[1] : `${Date.now()}_`;
		const sanitized = sanitizeFilename(cleanTitle);
		const newFilename = `${prefix}${sanitized || "untitled-note"}.md`;

		try {
			if (oldNote.filename !== newFilename) {
				await invoke("rename_note_file", {
					workspaceId,
					oldFilename: oldNote.filename,
					newFilename: newFilename,
				});
			}

			await updateNoteService(noteId, cleanTitle, newFilename);

			await getNotes(workspaceId);
			await workspaceStore.getWorkspaces();

			if (activeNote.value && activeNote.value.id === noteId) {
				activeNote.value.title = cleanTitle;
				activeNote.value.filename = newFilename;
			}
		} catch (error) {
			console.error("Failed to rename note:", error);
		}
	}

	async function moveNote(
		fromWorkspaceId: number,
		toWorkspaceId: number,
		noteId: number,
		filename: string,
	) {
		try {
			await moveNoteService(noteId, toWorkspaceId);

			await invoke("move_note_file", {
				fromWorkspaceId,
				toWorkspaceId,
				filename,
			});

			if (activeNote.value?.id === noteId) {
				activeNote.value = null;
			}

			await getNotes(fromWorkspaceId);
			await workspaceStore.getWorkspaces();
		} catch (error) {
			console.error("Failed to move note:", error);
		}
	}

	async function touchNote(workspaceId: number, noteId: number) {
		try {
			await updateNoteTimestampService(noteId);
			await getNotes(workspaceId);
			await workspaceStore.getWorkspaces();
		} catch (error) {
			console.error("Failed to update note timestamp:", error);
		}
	}

	async function deleteNote(
		workspaceId: number,
		noteId: number,
		filename: string,
	) {
		try {
			await deleteNoteService(noteId);

			await invoke("delete_note_file", {
				workspaceId,
				filename,
			});

			await getNotes(workspaceId);
			await workspaceStore.getWorkspaces();
		} catch (error) {
			console.error("Failed to delete note:", error);
		}
	}

	async function checkNoteFileExists(workspaceId: number, filename: string): Promise<boolean> {
		try {
			return await invoke<boolean>("check_note_file_exists", {
				workspaceId,
				filename,
			});
		} catch (error) {
			console.error("Failed to check note file exists:", error);
			return false;
		}
	}

	async function recreateNoteFile(workspaceId: number, filename: string, title: string) {
		try {
			await invoke("write_note", {
				workspaceId,
				filename,
				content: `# ${title}\n\n`,
			});
		} catch (error) {
			console.error("Failed to recreate note file:", error);
		}
	}

	return {
		allNotes,
		notes,
		activeNote,
		getAllNotes,
		getNotes,
		createNote,
		updateNote,
		moveNote,
		touchNote,
		deleteNote,
		checkNoteFileExists,
		recreateNoteFile,
		sanitizeFilename,
	};
});
