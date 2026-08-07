import { commands, Workspace as WorkspaceType } from "../bindings";

export type Workspace = WorkspaceType;

export async function getWorkspacesService(): Promise<Workspace[]> {
  const res = await commands.getWorkspaces();
  return ((res as any).data ?? res) as Workspace[];
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