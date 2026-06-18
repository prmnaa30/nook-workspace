<template>
  <Sidebar>
    <WorkspaceDetails :workspace="activeWorkspace" @update:workspace="handleWorkspaceUpdate"/>
  </Sidebar>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import Sidebar from './components/Sidebar.vue';
import WorkspaceDetails from './components/WorkspaceDetails.vue';
import { useWorkspaceStore } from './stores/workspaces.ts';

const store = useWorkspaceStore();

const workspaces = computed(() => store.workspaces);
const activeWorkspace = computed(() => workspaces.value.find(w => w.id === store.currentWorkspaceId) || null);

async function fetchWorkspaces() {
  try {
    await store.fetchWorkspaces();

    if (activeWorkspace.value && !workspaces.value.find(w => w.id === activeWorkspace.value?.id)) {
      store.selectWorkspace(activeWorkspace.value.id);
    }
  } catch (error) {
    console.error("Failed to load workspaces:", error);
  }
}

async function handleWorkspaceUpdate(id: number, payload: { name: string, description: string }) {
  await store.editWorkspace(id, payload.name, payload.description);

  await fetchWorkspaces();

  const updated = workspaces.value.find(w => w.id === id);
  if (updated) {
    store.selectWorkspace(id);
  }
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