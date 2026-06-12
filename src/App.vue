<template>
  <Sidebar
    :workspaces="workspaces"
    :activeWorkspace="activeWorkspace"
    @create="handleCreate"
    @delete="handleDelete"
    @select="handleSelect"
    @toggle-favorite="handleToggleFavorite"
    @update-workspace="handleUpdate"
  >
    <WorkspaceDetails :workspace="activeWorkspace" @update="handleUpdate"/>
  </Sidebar>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getWorkspaces, addWorkspace, deleteWorkspace, updateWorkspace, toggleFavorite } from './services/workspaces.ts';
import type { Workspace } from './services/workspaces.ts';
import Sidebar from './components/Sidebar.vue';
import WorkspaceDetails from './components/WorkspaceDetails.vue';

const workspaces = ref<Workspace[]>([]);
const activeWorkspace = ref<Workspace | null>(null);

async function fetchWorkspaces() {
  try {
    workspaces.value = await getWorkspaces();

    if (activeWorkspace.value && !workspaces.value.find(w => w.id === activeWorkspace.value?.id)) {
      activeWorkspace.value = null;
    }
  } catch (error) {
    console.error("Failed to load workspaces:", error);
  }
}

async function handleCreate(payload: { name: string, description: string }) {
  await addWorkspace(payload.name, payload.description);
  await fetchWorkspaces();
}

async function handleDelete(id: number) {
  if (confirm('Are you sure you want to delete this workspace?')) {
    await deleteWorkspace(id);
    await fetchWorkspaces();
  }
}

async function handleUpdate(id: number, payload: { name: string, description: string }) {
  await updateWorkspace(id, payload.name, payload.description);

  await fetchWorkspaces();

  const updated = workspaces.value.find(w => w.id === id);
  if (updated) {
    activeWorkspace.value = updated;
  }
}

async function handleToggleFavorite(workspace: Workspace) {
  const newStatus = workspace.is_favorite === 1 ? false : true;
  await toggleFavorite(workspace.id, newStatus);
  await fetchWorkspaces();
}

function handleSelect(workspace: Workspace) {
  activeWorkspace.value = workspace;
}

onMounted(() => {
  fetchWorkspaces();
});
</script>

<style>
@reference "tailwindcss";

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-neutral-200/50 dark:bg-neutral-800/50 rounded-full;
}

.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  @apply bg-neutral-300 dark:bg-neutral-700;
}
</style>