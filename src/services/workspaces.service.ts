import { dbPromise } from "./db";

export interface Workspace {
  id: number;
  name: string;
  description: string;
  is_favorite: number;
  created_at: string;
  updated_at: string;
}

export async function getWorkspacesService(): Promise<Workspace[]> {
  const db = await dbPromise;
  return await db.select("SELECT * FROM workspaces ORDER BY id DESC");
}

export async function createWorkspaceService(name: string, description: string): Promise<void> {
  const db = await dbPromise;
  await db.execute(
    "INSERT INTO workspaces (name, description) VALUES ($1, $2)",
    [name, description]
  );
}

export async function updateWorkspaceService(id: number, name: string, description: string): Promise<void> {
  const db = await dbPromise;
  await db.execute(
    "UPDATE workspaces SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
    [name, description, id]
  )
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
  )
}