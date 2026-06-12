<template>
  <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-4">

    <!-- Add Shortcut Form -->
    <div v-if="isAdding"
      class="bg-slate-900/80 p-4 rounded-xl border border-blue-500/30 shadow-lg mb-2">
      <form @submit.prevent="submitShortcut" class="flex flex-col gap-3">
        <div class="flex gap-3">
          <input v-model="newShortcut.title" type="text" placeholder="Shortcut Title (e.g., Figma Design)"
            required
            class="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none text-slate-200">
          <select v-model="newShortcut.type"
            class="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none text-slate-200 w-32">
            <option value="web">🌐 Web URL</option>
            <option value="folder">📁 Folder</option>
            <option value="file">📄 File</option>
          </select>
        </div>

        <div class="flex gap-2">
          <input v-model="newShortcut.path" type="text"
            placeholder="Target Path (e.g., https://figma.com/file/... atau C:\Projects)" required
            class="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none text-slate-200 font-mono">

          <button v-if="newShortcut.type !== 'web'" type="button" @click="browsePath"
            class="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-sm transition-colors whitespace-nowrap">
            🔍 Browse
          </button>
        </div>

        <button type="submit"
          class="self-end px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-500/20 transition-all">Save
          Shortcut</button>
      </form>
    </div>

    <!-- Empty State -->
    <div v-if="shortcuts && shortcuts.length === 0 && !isAdding"
      class="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-700/50 rounded-2xl bg-slate-800/10 min-h-[200px]">
      <p class="text-slate-500">No shortcuts configured yet.</p>
    </div>

    <!-- Shortcuts Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="sc in shortcuts" :key="sc.id" @click="executeShortcutAction(sc)"
        class="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl overflow-hidden flex flex-col z-10 cursor-pointer transition-all shadow-md hover:shadow-lg duration-200">
        
        <div class="h-14 w-full relative transition-all duration-200"
          :class="{
            'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-b border-blue-500/10': sc.type === 'web',
            'bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border-b border-emerald-500/10': sc.type === 'folder',
            'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-b border-amber-500/10': sc.type === 'file'
          }">
          <button @click.stop="removeShortcut(sc.id)"
            class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-slate-950/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-md transition-all border border-slate-800/60"
            title="Delete Shortcut">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-center -mt-4 ml-4 relative z-10 shadow-md">
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

          <div class="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-1 bg-slate-950/40 p-2 rounded border border-slate-800/40 truncate w-full" :title="sc.path">
            <svg class="w-3 h-3 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span class="truncate">{{ sc.path }}</span>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Workspace } from '../services/workspaces';
import { addShortcut, deleteShortcut, getShortcuts, Shortcut } from '../services/shortcuts';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

// Define Props
const props = defineProps<{
  workspace: Workspace | null;
  isAdding: boolean;
}>();

// Define Emits for syncing state back to parent
const emit = defineEmits<{
  (e: 'update:isAdding', value: boolean): void;
}>();

const shortcuts = ref<Shortcut[]>([]);
const newShortcut = ref<{ title: string, type: 'web' | 'folder' | 'file', path: string, browser_path: string }>({
  title: '',
  type: 'web',
  path: '',
  browser_path: ''
});

// Watch workspace changes to load shortcuts
watch(() => props.workspace, async (newWs) => {
  if (newWs) {
    shortcuts.value = await getShortcuts(newWs.id);
  } else {
    shortcuts.value = [];
  }
}, { immediate: true });

async function submitShortcut() {
  if (!props.workspace || !newShortcut.value.title || !newShortcut.value.path) return;

  await addShortcut(
    props.workspace.id,
    newShortcut.value.title,
    newShortcut.value.type,
    newShortcut.value.path,
    newShortcut.value.type === 'web' && newShortcut.value.browser_path ? newShortcut.value.browser_path : null
  );

  // Reset new shortcut form inputs
  newShortcut.value = {
    title: '',
    type: 'web',
    path: '',
    browser_path: ''
  };

  emit('update:isAdding', false);

  // Reload shortcuts
  shortcuts.value = await getShortcuts(props.workspace.id);
}

async function removeShortcut(id: number) {
  if (confirm("Delete this shortcut?")) {
    await deleteShortcut(id);
    if (props.workspace) {
      shortcuts.value = await getShortcuts(props.workspace.id);
    }
  }
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

async function browsePath() {
  if (newShortcut.value.type === 'web') return;

  const selectedPath = await open({
    directory: newShortcut.value.type === 'folder',
    multiple: false
  });

  if (selectedPath) {
    newShortcut.value.path = selectedPath as string;
  }
}
</script>
