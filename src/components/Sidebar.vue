<template>
  <div class="flex flex-1 h-screen w-screen bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
    <!-- USidebar component from Nuxt UI -->
    <USidebar
      v-model:open="open"
      variant="inset"
      collapsible="icon"
      :ui="{
        container: 'h-full'
      }" 
      class="border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 shrink-0"
    >
      <template #header>
        <div class="flex items-center gap-2.5 px-1 py-1P[
        ]">
          <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-white overflow-hidden">
            <img src="../assets/icons/icon.svg" class="size-6.75 object-contain" />
          </div>
          <div class="flex flex-col leading-none">
            <span class="font-bold text-neutral-800 dark:text-neutral-200">Workstation</span>
            <span class="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Shortcut Center</span>
          </div>
        </div>
      </template>

      <!-- Sidebar Content -->
      <div class="flex flex-col gap-4 flex-1 overflow-y-auto">
        <!-- Search bar -->
        <div class="px-1">
          <UInput v-model="searchQuery" icon="i-ph-magnifying-glass" placeholder="Search workspaces..." color="neutral"
            variant="outline" class="w-full" size="md" />
        </div>

        <div class="flex-1 overflow-y-auto pr-1">
          <!-- Favorites Section -->
          <div v-if="favoriteWorkspaces.length > 0" class="mb-5">
            <div
              class="px-2 mb-1.5 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              Favorites
            </div>
            <div class="space-y-0.5">
              <div v-for="ws in favoriteWorkspaces" :key="ws.id" @click="selectWs(ws)"
                class="group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-all duration-150 text-sm"
                :class="store.currentWorkspaceId === ws.id ? 'bg-neutral-200/60 dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40 hover:text-neutral-900 dark:hover:text-neutral-200'">
                <div class="flex items-center gap-2 min-w-0">
                  <UIcon name="i-ph-folder-duotone" class="size-4 shrink-0 text-blue-500" />
                  <span class="truncate font-medium">{{ ws.name }}</span>
                </div>
                <div
                  class="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button type="button" @click.stop="toggleFavorite(ws)"
                    class="p-0.5 rounded hover:bg-neutral-300 dark:hover:bg-neutral-700 text-yellow-500 transition-colors"
                    title="Remove from favorites">
                    <UIcon name="i-ph-star-fill" class="size-3.5" />
                  </button>
                  <button type="button" @click.stop="triggerDeleteModal(ws)"
                    class="p-0.5 rounded hover:bg-red-500/10 text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="Delete workspace">
                    <UIcon name="i-ph-trash" class="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Recents Section -->
          <div>
            <div
              class="px-2 mb-1.5 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              Workspaces
            </div>
            <div v-if="filteredWorkspaces.length === 0"
              class="px-2 py-3 text-xs text-neutral-400 dark:text-neutral-500 italic">
              {{ searchQuery ? 'No matches found' : 'No workspaces yet' }}
            </div>
            <div class="space-y-0.5">
              <div v-for="ws in recentWorkspaces" :key="ws.id" @click="selectWs(ws)"
                class="group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-all duration-150 text-sm"
                :class="store.currentWorkspaceId === ws.id ? 'bg-neutral-200/60 dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40 hover:text-neutral-900 dark:hover:text-neutral-200'">
                <div class="flex items-center gap-2 min-w-0">
                  <UIcon name="i-ph-folder-duotone" class="size-4 shrink-0 text-neutral-400 dark:text-neutral-500" />
                  <span class="truncate font-medium">{{ ws.name }}</span>
                </div>
                <div
                  class="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button type="button" @click.stop="toggleFavorite(ws)"
                    class="p-0.5 rounded hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-400 hover:text-yellow-500 transition-colors"
                    title="Add to favorites">
                    <UIcon name="i-ph-star" class="size-3.5" />
                  </button>
                  <!-- when deleting, show DeleteModal modal with delete-type = workspace -->
                  <button type="button" @click.stop="triggerDeleteModal(ws)"
                    class="p-0.5 rounded hover:bg-red-500/10 text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="Delete workspace">
                    <UIcon name="i-ph-trash" class="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Workspace Form & Button in Sidebar Footer -->
      <template #footer>
        <div class="w-full px-1">
          <form v-if="isAddingWorkspace" @submit.prevent="submitCreate"
            class="flex flex-col gap-2 p-2 bg-neutral-100/80 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm">
            <UInput ref="workspaceInputRef" v-model="newName" placeholder="Workspace name..." size="sm" required
              class="w-full text-xs" />
            <UInput v-model="newDescription" placeholder="Description (optional)" size="sm" class="w-full text-xs" />
            <div class="flex justify-end gap-1.5 mt-1">
              <UButton type="button" size="xs" color="neutral" variant="ghost" @click="isAddingWorkspace = false">Cancel
              </UButton>
              <UButton type="submit" size="xs" color="primary">Save</UButton>
            </div>
          </form>
          <UButton v-else icon="i-ph-plus" label="Add Workspace" color="neutral" variant="ghost"
            class="w-full justify-start text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 border border-dashed border-neutral-800 cursor-pointer"
            @click="toggleAddForm" />
        </div>
      </template>
    </USidebar>

    <!-- Main Content Pane -->
    <div
      class="flex-1 flex flex-col overflow-hidden m-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
      <div class="flex-1 overflow-hidden">
        <slot></slot>
      </div>
    </div>

    <!-- Workspace Delete Modal -->
    <DeleteModal 
      ref="deleteModalRef" 
      delete-type="Workspace" 
      :target="workspaceToDelete?.name || ''" 
      @confirm="handleConfirmDelete" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import type { Workspace } from '../services/workspaces';
import { useWorkspaceStore } from '../stores/workspaces';
import DeleteModal from './DeleteModal.vue';

const store = useWorkspaceStore();

const open = ref(true);
const searchQuery = ref('');
const isAddingWorkspace = ref(false);
const newName = ref('');
const newDescription = ref('');
const workspaceInputRef = ref<any>(null);

const deleteModalRef = ref<any>(null);
const workspaceToDelete = ref<Workspace | null>(null);

const filteredWorkspaces = computed(() => {
  if (!searchQuery.value) return store.workspaces;
  const lowerQuery = searchQuery.value.toLowerCase();
  return store.workspaces.filter(ws => ws.name.toLowerCase().includes(lowerQuery));
});

const favoriteWorkspaces = computed(() => {
  return filteredWorkspaces.value.filter(ws => ws.is_favorite === 1);
});

const recentWorkspaces = computed(() => {
  return filteredWorkspaces.value.filter(ws => ws.is_favorite !== 1);
});

function toggleAddForm() {
  isAddingWorkspace.value = true;
  nextTick(() => {
    if (workspaceInputRef.value && workspaceInputRef.value.$el) {
      const input = workspaceInputRef.value.$el.querySelector('input');
      if (input) input.focus();
    }
  });
}

async function submitCreate() {
  if (!newName.value.trim()) return;
  await store.createWorkspace(newName.value, newDescription.value);
  newName.value = '';
  newDescription.value = '';
  isAddingWorkspace.value = false;
}

async function toggleFavorite(ws: Workspace) {
  const newStatus = ws.is_favorite === 1 ? false : true;
  await store.toggleWorkspaceFavorite(ws.id, newStatus);
}

function triggerDeleteModal(ws: Workspace) {
  workspaceToDelete.value = ws;
  deleteModalRef.value?.openModal();
}

async function handleConfirmDelete() {
  if (workspaceToDelete.value) {
    await store.removeWorkspace(workspaceToDelete.value.id);
    workspaceToDelete.value = null;
  }
}

function selectWs(ws: Workspace) {
  store.selectWorkspace(ws.id);
}
</script>
