import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @tauri-apps/api/core
const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: any[]) => mockInvoke(...args),
}));

// Import services to test
import {
  getWorkspacesService,
  createWorkspaceService,
  updateWorkspaceService,
  deleteWorkspaceService,
  toggleFavoriteService,
  toggleWorkspaceGlobalVisibilityService,
} from "../workspaces.service";

import {
  getShortcutsService,
  searchAllShortcutsService,
  createShortcutService,
  updateShortcutService,
  toggleShortcutPinService,
  moveShortcutService,
  deleteShortcutService,
} from "../shortcuts.service";

import {
  getNotesService,
  searchAllNotesService,
  createNoteService,
  updateNoteService,
  toggleNotePinService,
  updateNoteTimestampService,
  moveNoteService,
  deleteNoteService,
} from "../notes.service";

import {
  getTasksByWorkspaceService,
  getAllGlobalTasksService,
  getAllTasksForTimelineService,
  createTaskService,
  updateTaskStatusService,
  updateTaskService,
  deleteTaskService,
} from "../tasks.service";

import {
  getAppSetting,
  setAppSetting,
  isNewerVersion,
} from "../update.service";

import { getStartupTaskSummary } from "../notification.service";

describe("Refactored Frontend Data Services (Tauri IPC Wrappers)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Workspaces Service (AC-1, AC-2)", () => {
    it("fetches workspaces via get_workspaces command", async () => {
      const mockWorkspaces = [
        { id: 1, name: "Default", description: "Default workspace", is_favorite: 1 },
      ];
      mockInvoke.mockResolvedValueOnce(mockWorkspaces);

      const res = await getWorkspacesService();
      expect(mockInvoke).toHaveBeenCalledWith("get_workspaces");
      expect(res).toEqual(mockWorkspaces);
    });

    it("creates workspace via create_workspace command", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      await createWorkspaceService("Project A", "Desc", true);

      expect(mockInvoke).toHaveBeenCalledWith("create_workspace", {
        name: "Project A",
        description: "Desc",
        showInGlobalTasks: true,
      });
    });

    it("updates workspace via update_workspace command", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      await updateWorkspaceService(1, "Updated Name", "Updated Desc", false);

      expect(mockInvoke).toHaveBeenCalledWith("update_workspace", {
        id: 1,
        name: "Updated Name",
        description: "Updated Desc",
        showInGlobalTasks: false,
      });
    });

    it("deletes workspace via delete_workspace command", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      await deleteWorkspaceService(1);

      expect(mockInvoke).toHaveBeenCalledWith("delete_workspace", { id: 1 });
    });

    it("toggles workspace favorite state", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      await toggleFavoriteService(1, true);

      expect(mockInvoke).toHaveBeenCalledWith("toggle_workspace_favorite", {
        id: 1,
        isFavorite: true,
      });
    });

    it("toggles workspace global visibility", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      await toggleWorkspaceGlobalVisibilityService(1, false);

      expect(mockInvoke).toHaveBeenCalledWith("toggle_workspace_global_visibility", {
        id: 1,
        isVisible: false,
      });
    });
  });

  describe("Shortcuts Service (AC-1, AC-2)", () => {
    it("fetches shortcuts for a workspace", async () => {
      const mockShortcuts = [
        { id: 1, workspace_id: 10, title: "GitHub", type: "web", path: "https://github.com", is_pinned: 0 },
      ];
      mockInvoke.mockResolvedValueOnce(mockShortcuts);

      const res = await getShortcutsService(10);
      expect(mockInvoke).toHaveBeenCalledWith("get_shortcuts", { workspaceId: 10 });
      expect(res).toEqual(mockShortcuts);
    });

    it("searches all shortcuts across workspaces", async () => {
      const mockShortcuts = [
        { id: 1, workspace_id: 10, title: "Docs", type: "folder", path: "C:/Docs", is_pinned: 1, workspace_name: "Default" },
      ];
      mockInvoke.mockResolvedValueOnce(mockShortcuts);

      const res = await searchAllShortcutsService();
      expect(mockInvoke).toHaveBeenCalledWith("search_all_shortcuts");
      expect(res).toEqual(mockShortcuts);
    });

    it("creates shortcut via create_shortcut command", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      await createShortcutService(10, "Google", "web", "https://google.com", "msedge", true);

      expect(mockInvoke).toHaveBeenCalledWith("create_shortcut", {
        workspaceId: 10,
        title: "Google",
        shortcutType: "web",
        path: "https://google.com",
        browserPath: "msedge",
        isPinned: true,
      });
    });

    it("updates shortcut via update_shortcut command", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      await updateShortcutService(1, "Updated Google", "web", "https://google.com", "msedge", true);

      expect(mockInvoke).toHaveBeenCalledWith("update_shortcut", {
        shortcutId: 1,
        title: "Updated Google",
        shortcutType: "web",
        path: "https://google.com",
        browserPath: "msedge",
        isPinned: true,
      });
    });

    it("toggles shortcut pin via toggle_shortcut_pin command", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      await toggleShortcutPinService(1, true);

      expect(mockInvoke).toHaveBeenCalledWith("toggle_shortcut_pin", {
        shortcutId: 1,
        isPinned: true,
      });
    });

    it("moves shortcut to target workspace", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      await moveShortcutService(5, 20);

      expect(mockInvoke).toHaveBeenCalledWith("move_shortcut", {
        shortcutId: 5,
        targetWorkspaceId: 20,
      });
    });

    it("deletes shortcut via delete_shortcut command", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      await deleteShortcutService(5);

      expect(mockInvoke).toHaveBeenCalledWith("delete_shortcut", { id: 5 });
    });
  });

  describe("Notes Service (AC-1, AC-2)", () => {
    it("fetches notes metadata for workspace", async () => {
      const mockNotes = [{ id: 1, workspace_id: 10, title: "Ideas", filename: "ideas.md", is_pinned: 1 }];
      mockInvoke.mockResolvedValueOnce(mockNotes);

      const res = await getNotesService(10);
      expect(mockInvoke).toHaveBeenCalledWith("get_notes", { workspaceId: 10 });
      expect(res).toEqual(mockNotes);
    });

    it("searches all notes across workspaces", async () => {
      const mockNotes = [{ id: 1, workspace_id: 10, title: "Ideas", filename: "ideas.md", is_pinned: 1, workspace_name: "Default" }];
      mockInvoke.mockResolvedValueOnce(mockNotes);

      const res = await searchAllNotesService();
      expect(mockInvoke).toHaveBeenCalledWith("search_all_notes");
      expect(res).toEqual(mockNotes);
    });

    it("creates note metadata via create_note command", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      await createNoteService(10, "Meeting", "meeting.md", true);

      expect(mockInvoke).toHaveBeenCalledWith("create_note", {
        workspaceId: 10,
        title: "Meeting",
        filename: "meeting.md",
        isPinned: true,
      });
    });

    it("updates note metadata via update_note command", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      await updateNoteService(1, "Updated Title", "meeting.md", false);

      expect(mockInvoke).toHaveBeenCalledWith("update_note", {
        noteId: 1,
        title: "Updated Title",
        filename: "meeting.md",
        isPinned: false,
      });
    });

    it("toggles note pin state via toggle_note_pin command", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      await toggleNotePinService(1, true);

      expect(mockInvoke).toHaveBeenCalledWith("toggle_note_pin", {
        noteId: 1,
        isPinned: true,
      });
    });

    it("touches note timestamp via update_note_timestamp command", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      await updateNoteTimestampService(1);

      expect(mockInvoke).toHaveBeenCalledWith("update_note_timestamp", { noteId: 1 });
    });

    it("moves note via move_note command", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      await moveNoteService(1, 20);

      expect(mockInvoke).toHaveBeenCalledWith("move_note", {
        noteId: 1,
        targetWorkspaceId: 20,
      });
    });

    it("deletes note metadata via delete_note command", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      await deleteNoteService(1);

      expect(mockInvoke).toHaveBeenCalledWith("delete_note", { noteId: 1 });
    });
  });

  describe("Tasks Service (AC-1, AC-2)", () => {
    it("fetches tasks by workspace", async () => {
      const mockTasks = [{ id: 1, workspace_id: 10, title: "Refactor backend", status: "TODO" }];
      mockInvoke.mockResolvedValueOnce(mockTasks);

      const res = await getTasksByWorkspaceService(10);
      expect(mockInvoke).toHaveBeenCalledWith("get_tasks_by_workspace", { workspaceId: 10 });
      expect(res).toEqual(mockTasks);
    });

    it("fetches all global tasks", async () => {
      const mockTasks = [{ id: 1, workspace_id: 10, title: "Global Task", status: "TODO", workspace_name: "Default" }];
      mockInvoke.mockResolvedValueOnce(mockTasks);

      const res = await getAllGlobalTasksService();
      expect(mockInvoke).toHaveBeenCalledWith("get_all_global_tasks");
      expect(res).toEqual(mockTasks);
    });

    it("fetches all tasks for timeline", async () => {
      const mockTasks = [{ id: 1, workspace_id: 10, title: "Timeline Task", status: "TODO", workspace_name: "Default" }];
      mockInvoke.mockResolvedValueOnce(mockTasks);

      const res = await getAllTasksForTimelineService();
      expect(mockInvoke).toHaveBeenCalledWith("get_all_tasks_for_timeline");
      expect(res).toEqual(mockTasks);
    });

    it("creates new task via create_task command", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      await createTaskService(10, "New Task", "Details", "2026-08-10");

      expect(mockInvoke).toHaveBeenCalledWith("create_task", {
        workspaceId: 10,
        title: "New Task",
        description: "Details",
        dueDate: "2026-08-10",
      });
    });

    it("updates task status via update_task_status command", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      await updateTaskStatusService(1, "DONE");

      expect(mockInvoke).toHaveBeenCalledWith("update_task_status", {
        taskId: 1,
        status: "DONE",
      });
    });

    it("updates task details via update_task command", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      await updateTaskService(1, "Updated Title", "Updated Description", "2026-08-15", "IN_PROGRESS");

      expect(mockInvoke).toHaveBeenCalledWith("update_task", {
        taskId: 1,
        title: "Updated Title",
        description: "Updated Description",
        dueDate: "2026-08-15",
        status: "IN_PROGRESS",
      });
    });

    it("deletes task via delete_task command", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      await deleteTaskService(1);

      expect(mockInvoke).toHaveBeenCalledWith("delete_task", { taskId: 1 });
    });
  });

  describe("Update & Settings Service (AC-1, AC-6)", () => {
    it("gets app setting via get_app_setting command", async () => {
      mockInvoke.mockResolvedValueOnce("enabled");
      const res = await getAppSetting("autostart_preference");

      expect(mockInvoke).toHaveBeenCalledWith("get_app_setting", { key: "autostart_preference" });
      expect(res).toBe("enabled");
    });

    it("sets app setting via set_app_setting command", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      await setAppSetting("autostart_preference", "disabled");

      expect(mockInvoke).toHaveBeenCalledWith("set_app_setting", {
        key: "autostart_preference",
        value: "disabled",
      });
    });

    it("correctly evaluates version comparisons", () => {
      expect(isNewerVersion("1.4.0", "1.3.2")).toBe(true);
      expect(isNewerVersion("1.3.2", "1.3.2")).toBe(false);
      expect(isNewerVersion("1.2.0", "1.3.2")).toBe(false);
    });
  });

  describe("Notification Service (AC-4, AC-5, AC-8)", () => {
    it("fetches startup agenda summary from Rust backend via show_startup_agenda", async () => {
      mockInvoke.mockResolvedValueOnce({
        tasks_due_today: 3,
        total_tasks_remaining: 5,
        tasksDueToday: 3,
        totalTasksRemaining: 5,
      });

      const summary = await getStartupTaskSummary();
      expect(mockInvoke).toHaveBeenCalledWith("show_startup_agenda", expect.objectContaining({
        today: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      }));
      expect(summary).toEqual({
        tasksDueToday: 3,
        totalTasksRemaining: 5,
      });
    });
  });
});
