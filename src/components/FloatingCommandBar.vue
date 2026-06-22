<template>
  <div class="w-screen h-screen flex flex-col bg-slate-950 overflow-hidden shadow-2xl">
    <div class="flex items-center px-4 py-3 border-b border-slate-800">
      <span class="text-slate-400 mr-3 text-lg">🔍</span>
      <input ref="searchInputRef" v-model="searchQuery" type="text" placeholder="Type to search shortcuts & notes..."
        class="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm"
        @keydown.down.prevent="moveSelection(1)" @keydown.up.prevent="moveSelection(-1)"
        @keydown.enter.prevent="executeActiveItem" @keydown.esc.prevent="closeWindow" />
      <div class="flex items-center gap-1.5 ml-2">
        <UKbd variant="soft" class="px-1.5 py-0.5 text-slate-400 font-mono">
          Esc</UKbd>
        <p class="text-[10px] text-slate-500">to close</p>
      </div>
    </div>

    <div ref="listContainerRef" class="flex-1 overflow-y-auto custom-scrollbar p-2">
      <div v-if="filteredItems.length === 0" class="h-full flex items-center justify-center p-8 text-slate-500 text-sm">
        No results found for "{{ searchQuery }}"
      </div>

      <div v-else class="flex flex-col gap-1">
        <div v-for="(item, index) in filteredItems" :key="item.searchType + '-' + item.id"
          class="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all border" :class="index === activeIndex
            ? 'bg-slate-900 border-transparent text-white shadow-md active-item'
            : 'bg-transparent border-transparent text-slate-300 hover:bg-slate-900/50'" @click="executeItem(item)">
          <div class="flex items-center gap-3 truncate">
            <span class="text-base flex-shrink-0">
              <span v-if="item.searchType === 'note'">📝</span>
              <span v-else-if="item.type === 'web'">🌐</span>
              <span v-else-if="item.type === 'folder'">📁</span>
              <span v-else>📄</span>
            </span>
            <div class="flex flex-col truncate">
              <span class="font-medium text-sm truncate">{{ item.title }}</span>
              <span class="text-[11px] text-slate-500 truncate font-mono mt-0.5">
                {{ item.searchType === 'note' ? item.filename : item.path }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0 ml-4">
            <span
              class="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-full text-[10px] text-slate-400 font-medium">
              {{ item.workspace_name }}
            </span>
            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
              :class="item.searchType === 'note' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'">
              {{ item.searchType }}
            </span>
          </div>

        </div>
      </div>

    </div>

    <div class="px-4 py-2.5 border-t border-slate-800 flex justify-end gap-4 text-xs shrink-0">
      <div class="flex items-center gap-1.5">
        <UKbd size="md" variant="soft" class="px-1.5 py-0.5 text-slate-400 font-mono">Ctrl</UKbd>
        <UKbd size="md" variant="soft" class="px-1.5 py-0.5 text-slate-400 font-mono">W</UKbd>
        <span class="ml-0.5 text-slate-400">Open Main Window</span>
      </div>
      <span class="text-slate-700">|</span>
      <div class="flex items-center gap-1.5">
        <UKbd size="md" variant="soft" class="px-1.5 py-0.5 text-slate-400 font-mono">Enter</UKbd>
        <span class="ml-0.5 text-slate-400">Run</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useShortcutStore } from '../stores/shortcuts';
import { useNoteStore } from '../stores/notes';
import { storeToRefs } from 'pinia';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { emitTo } from '@tauri-apps/api/event';

const shortcutStore = useShortcutStore();
const noteStore = useNoteStore();

const { allShortcuts } = storeToRefs(shortcutStore);
const { allNotes } = storeToRefs(noteStore);

const searchQuery = ref('');
const activeIndex = ref(0);
const searchInputRef = ref<HTMLInputElement | null>(null);
const listContainerRef = ref<HTMLDivElement | null>(null);

const filteredItems = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();

  const scItems = (allShortcuts.value || []).map(sc => ({
    ...sc,
    searchType: 'shortcut' as const
  }));

  const noteItems = (allNotes.value || []).map(note => ({
    ...note,
    searchType: 'note' as const
  }));

  const combined = [...scItems, ...noteItems];

  if (!query) return combined;

  return combined.filter(item =>
    item.title.toLowerCase().includes(query) ||
    item.workspace_name.toLowerCase().includes(query) ||
    (item.searchType === 'shortcut' && item.path.toLowerCase().includes(query)) ||
    (item.searchType === 'note' && item.filename.toLowerCase().includes(query))
  );
});

watch(searchQuery, () => {
  activeIndex.value = 0;
});

watch(activeIndex, async () => {
  await nextTick();
  const activeEl = listContainerRef.value?.querySelector('.active-item');
  if (activeEl) {
    activeEl.scrollIntoView({
      block: 'center',
      behavior: 'smooth'
    });
  }
});

onMounted(async () => {
  await Promise.all([
    shortcutStore.getAllShortcuts(),
    noteStore.getAllNotes()
  ]);

  nextTick(() => {
    searchInputRef.value?.focus();
  });
});

onMounted(async () => {
  try {
    const currentWindow = getCurrentWindow();

    currentWindow.listen('tauri://focus', () => {
      shortcutStore.getAllShortcuts();
      noteStore.getAllNotes();
      searchQuery.value = '';
      activeIndex.value = 0;
      nextTick(() => {
        searchInputRef.value?.focus();
      });
    });
  } catch (e) {
    console.error("Failed to monitor window focus event:", e);
  }
});

function moveSelection(direction: number) {
  const count = filteredItems.value.length;
  if (count === 0) return;
  activeIndex.value = (activeIndex.value + direction + count) % count;
}

async function executeActiveItem() {
  const active = filteredItems.value[activeIndex.value];
  if (active) {
    await executeItem(active);
  }
}

async function executeItem(item: any) {
  await closeWindow();

  if (item.searchType === 'shortcut') {
    try {
      await invoke('execute_shortcut', {
        path: item.path,
        shortcutType: item.type,
        browser: item.browser_path || null
      });
    } catch (error) {
      console.error(`Failed to execute:\n${error}`);
    }
  } else if (item.searchType === 'note') {
    try {
      await emitTo('main', 'open-note', {
        workspaceId: item.workspace_id,
        noteId: item.id
      });
    } catch (e) {
      console.error("Failed to open note:", e);
    }
  }
}

async function closeWindow() {
  try {
    const currentWindow = getCurrentWindow();
    await currentWindow.hide();
  } catch (error) {
    console.error("Failed to hide command bar:", error);
  }
}
</script>