<template>
  <UApp>
    <div v-if="windowLabel === 'floating'" class="w-full h-full">
      <FloatingCommandBar />
    </div>
    <Sidebar v-else>
      <WorkspaceDetails :workspace="activeWorkspace" @update:workspace="handleWorkspaceUpdate"/>
    </Sidebar>
  </UApp>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import Sidebar from './components/Sidebar.vue';
import WorkspaceDetails from './components/WorkspaceDetails.vue';
import { useWorkspaceStore } from './stores/workspaces.ts';
import { useNoteStore } from './stores/notes.ts';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { listen } from '@tauri-apps/api/event';

const store = useWorkspaceStore();
const noteStore = useNoteStore();

const workspaces = computed(() => store.workspaces);
const activeWorkspace = computed(() => workspaces.value.find(w => w.id === store.currentWorkspaceId) || null);
const windowLabel = ref('main');

async function fetchWorkspaces() {
  try {
    await store.getWorkspaces();

    if (activeWorkspace.value && !workspaces.value.find(w => w.id === activeWorkspace.value?.id)) {
      store.selectWorkspace(activeWorkspace.value.id);
    }
  } catch (error) {
    console.error("Failed to load workspaces:", error);
  }
}

async function handleWorkspaceUpdate(id: number, payload: { name: string, description: string }) {
  await store.updateWorkspace(id, payload.name, payload.description);

  await fetchWorkspaces();

  const updated = workspaces.value.find(w => w.id === id);
  if (updated) {
    store.selectWorkspace(id);
  }
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && store.currentWorkspaceId !== null) {
    store.selectWorkspace(null);
  }
};

onMounted(async () => {
  window.addEventListener('keydown', handleKeyDown);
  try {
    const currentWindow = getCurrentWindow();
    windowLabel.value = currentWindow.label;
  } catch (error) {
    console.warn("Not in the Tauri desktop environment: ", error);
  }
  
  if (windowLabel.value === 'main') {
    listen<{ workspaceId: number, noteId: number}>('open-note', async (event) => {
      const { workspaceId, noteId } = event.payload;
      
      store.selectWorkspace(workspaceId);
      
      await noteStore.getNotes(workspaceId);
      const targetNote = noteStore.notes.find(n => n.id === noteId);
      if (targetNote) {
        noteStore.activeNote = targetNote;
      }
    })
  }

  await fetchWorkspaces();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>
