<template>
  <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-4">
    <div class="absolute top-0 right-0 p-1 flex gap-1">
      <SearchSortBar
        v-model:search="searchQuery"
        v-model:sort-key="sortKey"
        v-model:sort-order="sortOrder"
        :sort-options="sortOptions"
      />

      <ShortcutFormModal :workspace="workspace!" />
    </div>

    <!-- Empty State -->
    <div v-if="filteredAndSortedShortcuts.length === 0"
      class="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-700/50 rounded-2xl bg-slate-800/10 min-h-[200px]">
      <p class="text-slate-500">{{ searchQuery ? 'No shortcuts found.' : 'No shortcuts configured yet.' }}</p>
    </div>

    <!-- Shortcuts Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

      <div v-for="sc in filteredAndSortedShortcuts" :key="sc.id" @click="executeShortcutAction(sc)"
        class="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl overflow-hidden flex flex-col z-10 cursor-pointer transition-all shadow-md hover:shadow-lg duration-200">

        <div class="h-14 w-full relative transition-all duration-200" :class="{
          'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-b border-blue-500/10': sc.type === 'web',
          'bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border-b border-emerald-500/10': sc.type === 'folder',
          'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-b border-amber-500/10': sc.type === 'file'
        }">
          <button @click.stop="triggerDeleteModal(sc)"
            class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-slate-950/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-md transition-all border border-slate-800/60"
            title="Delete Shortcut">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div class="absolute top-2 right-10 opacity-0 group-hover:opacity-100 transition-all z-20">
            <ShortcutFormModal :workspace="props.workspace!" :initial-value="sc">
              <button @click.stop
                class="p-1 bg-slate-950/80 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-md transition-all border border-slate-800/60"
                title="Edit Shortcut">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </ShortcutFormModal>
          </div>
        </div>

        <div
          class="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-center -mt-4 ml-4 relative z-10 shadow-md">
          <span v-if="sc.type === 'web'" class="text-lg">🌐</span>
          <span v-else-if="sc.type === 'folder'" class="text-lg">📁</span>
          <span v-else class="text-lg">📄</span>
        </div>

        <div class="p-4 pt-2.5 flex flex-col gap-2">
          <div class="flex flex-col gap-1">
            <h4 class="font-semibold text-slate-200 text-sm tracking-wide truncate" :title="sc.title">
              {{ sc.title }}
            </h4>
          </div>

          <div
            class="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-1 bg-slate-950/40 p-2 rounded border border-slate-800/40 truncate w-full"
            :title="sc.path">
            <svg class="w-3 h-3 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span class="truncate">{{ sc.path }}</span>
          </div>
        </div>

      </div>
    </div>

    <DeleteModal ref="deleteModalRef" delete-type="Shortcut" :target="shortcutToDelete?.title || ''"
      @confirm="handleConfirmDelete" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Workspace } from '../../services/workspaces.service';
import { Shortcut } from '../../services/shortcuts.service';
import { invoke } from '@tauri-apps/api/core';
import { useShortcutStore } from '../../stores/shortcuts';
import { storeToRefs } from 'pinia';

const props = defineProps<{
  workspace: Workspace | null;
}>();

const store = useShortcutStore();
const { shortcuts } = storeToRefs(store);
const deleteModalRef = ref<any>(null);
const shortcutToDelete = ref<Shortcut | null>(null);

const searchQuery = ref('');
const sortKey = ref('title');
const sortOrder = ref<'asc' | 'desc'>('asc');

const sortOptions = [
  { label: 'Name', value: 'title' },
  { label: 'Type', value: 'type' },
  { label: 'Date Created', value: 'created_at' },
  { label: 'Date Modified', value: 'updated_at' }
];

const filteredAndSortedShortcuts = computed(() => {
  if (!shortcuts.value) return [];

  let result = [...shortcuts.value];

  // Searching
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(shorcut => 
      shorcut.title.toLowerCase().includes(query) ||
      (shorcut.path && shorcut.path.toLowerCase().includes(query))
    );
  }

  result.sort((a: any, b: any) => {
    let valA = a[sortKey.value] || '';
    let valB = b[sortKey.value] || '';

    if (typeof valA === 'string' &&  typeof valB === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });

  return result;
})

watch(() => props.workspace, async (newWs) => {
  if (newWs) {
    await store.getShortcuts(newWs.id);
  } else {
    shortcuts.value = [];
  }
}, { immediate: true });

watch(
  () => props.workspace?.id,
  (newWorkspaceId) => {
    if (!newWorkspaceId) return;

    const savedSortKey = localStorage.getItem(`ws_${newWorkspaceId}_shortcuts_sortKey`);
    if (savedSortKey) {
      sortKey.value = savedSortKey;
    } else {
      sortKey.value = 'title';
    }

    const savedSortOrder = localStorage.getItem(`ws_${newWorkspaceId}_shortcuts_sortOrder`);
    if (savedSortOrder === 'asc' || savedSortOrder === 'desc') {
      sortOrder.value = savedSortOrder;
    } else {
      sortOrder.value = 'asc';
    }
}, { immediate: true });

watch(sortKey, (newVal) => {
  if (props.workspace?.id) {
    localStorage.setItem(`ws_${props.workspace.id}_shortcuts_sortKey`, newVal);
  }
});

watch(sortOrder, (newVal) => {
  if (props.workspace?.id) {
    localStorage.setItem(`ws_${props.workspace.id}_shortcuts_sortOrder`, newVal);
  }
});

async function handleConfirmDelete() {
  if (shortcutToDelete.value) {
    await store.deleteShortcut(shortcutToDelete.value.id);
    shortcutToDelete.value = null;
  }
}

function triggerDeleteModal(sc: Shortcut) {
  shortcutToDelete.value = sc;
  deleteModalRef.value?.openModal();
}

async function executeShortcutAction(shortcut: Shortcut) {
  try {
    await invoke('execute_shortcut', {
      path: shortcut.path,
      shortcutType: shortcut.type,
      browser: shortcut.browser_path || null
    });
  } catch (error) {
    alert(`Oops! Failed to execute shortcut:\n${error}`);
  }
}
</script>
