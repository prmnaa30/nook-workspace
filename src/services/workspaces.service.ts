import { dbPromise } from "./db";

export interface Workspace {
  id: number;
  name: string;
  description: string;
  is_favorite: number;
  show_in_global_tasks?: number;
  created_at: string;
  updated_at: string;
}

export async function getWorkspacesService(): Promise<Workspace[]> {
  const db = await dbPromise;
  return await db.select("SELECT * FROM workspaces ORDER BY is_favorite DESC, COALESCE(updated_at, created_at) DESC, id DESC");
}

export async function createWorkspaceService(name: string, description: string, showInGlobalTasks: boolean = true): Promise<void> {
  const db = await dbPromise;
  await db.execute(
    "INSERT INTO workspaces (name, description, show_in_global_tasks, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)",
    [name, description, showInGlobalTasks ? 1 : 0]
  );
}

export async function updateWorkspaceService(id: number, name: string, description: string, showInGlobalTasks?: boolean): Promise<void> {
  const db = await dbPromise;
  if (showInGlobalTasks !== undefined) {
    await db.execute(
      "UPDATE workspaces SET name = $1, description = $2, show_in_global_tasks = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4",
      [name, description, showInGlobalTasks ? 1 : 0, id]
    );
  } else {
    await db.execute(
      "UPDATE workspaces SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
      [name, description, id]
    );
  }
}

export async function deleteWorkspaceService(id: number): Promise<void> {
  const db = await dbPromise;
  await db.execute("DELETE FROM workspaces WHERE id = $1", [id]);
}

export async function toggleFavoriteService(id: number, isFavorite: boolean) {
  const db = await dbPromise;
  await db.execute(
    "UPDATE workspaces SET is_favorite = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
    [isFavorite ? 1 : 0, id]
  );
}

export async function toggleWorkspaceGlobalVisibilityService(id: number, isVisible: boolean) {
  const db = await dbPromise;
  await db.execute(
    "UPDATE workspaces SET show_in_global_tasks = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
    [isVisible ? 1 : 0, id]
  );
}