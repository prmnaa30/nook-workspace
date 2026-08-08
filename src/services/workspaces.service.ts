import { commands, Workspace as WorkspaceType } from "../bindings";

export type Workspace = WorkspaceType;

function unwrapArrayResult<T>(res: any): T[] {
  if (res && typeof res === "object" && "status" in res) {
    if (res.status === "ok" && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  }
  return Array.isArray(res) ? res : [];
}

export async function getWorkspacesService(): Promise<Workspace[]> {
  const res = await commands.getWorkspaces();
  return unwrapArrayResult<Workspace>(res);
}

export async function createWorkspaceService(name: string, description: string, showInGlobalTasks: boolean = true): Promise<void> {
  await commands.createWorkspace(name, description, showInGlobalTasks);
}

export async function updateWorkspaceService(id: number, name: string, description: string, showInGlobalTasks?: boolean): Promise<void> {
  await commands.updateWorkspace(id, name, description, showInGlobalTasks ?? null);
}

export async function deleteWorkspaceService(id: number): Promise<void> {
  await commands.deleteWorkspace(id);
}

export async function toggleFavoriteService(id: number, isFavorite: boolean): Promise<void> {
  await commands.toggleWorkspaceFavorite(id, isFavorite);
}

export async function toggleWorkspaceGlobalVisibilityService(id: number, isVisible: boolean): Promise<void> {
  await commands.toggleWorkspaceGlobalVisibility(id, isVisible);
}