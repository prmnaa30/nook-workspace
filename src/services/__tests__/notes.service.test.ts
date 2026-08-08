import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { commands } from "../../bindings";
import {
	getNotesService,
	searchAllNotesService,
	createNoteService,
	updateNoteService,
} from "../notes.service";

vi.mock("../../bindings", () => ({
	commands: {
		getNotes: vi.fn(),
		searchAllNotes: vi.fn(),
		createNote: vi.fn(),
		updateNote: vi.fn(),
		toggleNotePin: vi.fn(),
		deleteNote: vi.fn(),
	},
}));

describe("notes.service", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("covers AC-1 & AC-3: unwraps successful notes array from backend result", async () => {
		const mockNotes = [
			{
				id: 1,
				workspace_id: 10,
				title: "Test Note",
				filename: "test.md",
				is_pinned: null, // AC-1: Nullable is_pinned from legacy database row
				created_at: "2026-08-08",
				updated_at: "2026-08-08",
			},
		];

		vi.mocked(commands.getNotes).mockResolvedValue({
			status: "ok",
			data: mockNotes,
		} as any);

		const notes = await getNotesService(10);
		expect(notes).toEqual(mockNotes);
		expect(commands.getNotes).toHaveBeenCalledWith(10);
	});

	it("covers AC-3: logs console.error and returns empty array on backend IPC error", async () => {
		const spyConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});

		vi.mocked(commands.getNotes).mockResolvedValue({
			status: "error",
			error: "Database error occurred",
		} as any);

		const notes = await getNotesService(10);
		expect(notes).toEqual([]);
		expect(spyConsoleError).toHaveBeenCalledWith(
			"[notes.service] IPC command error:",
			"Database error occurred",
		);
	});

	it("unwraps searchAllNotes result correctly", async () => {
		const mockSearchNotes = [
			{
				id: 2,
				workspace_id: 10,
				title: "Global Search Note",
				filename: "global.md",
				is_pinned: 1,
				created_at: "2026-08-08",
				updated_at: "2026-08-08",
				workspace_name: "Default Workspace",
			},
		];

		vi.mocked(commands.searchAllNotes).mockResolvedValue({
			status: "ok",
			data: mockSearchNotes,
		} as any);

		const searchResult = await searchAllNotesService();
		expect(searchResult).toEqual(mockSearchNotes);
		expect(commands.searchAllNotes).toHaveBeenCalled();
	});

	it("invokes createNote command with correct parameters", async () => {
		vi.mocked(commands.createNote).mockResolvedValue(undefined as any);

		await createNoteService(1, "New Note", "new_note.md", true);
		expect(commands.createNote).toHaveBeenCalledWith(1, "New Note", "new_note.md", true);
	});

	it("invokes updateNote command with null fallback for optional isPinned", async () => {
		vi.mocked(commands.updateNote).mockResolvedValue(undefined as any);

		await updateNoteService(5, "Updated Title", "note_5.md");
		expect(commands.updateNote).toHaveBeenCalledWith(5, "Updated Title", "note_5.md", null);
	});
});
