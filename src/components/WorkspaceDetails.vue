<template>
  <main class="flex-1 flex flex-col h-full items-center justify-center relative">

    <div v-if="workspace" class="relative z-10 w-full h-full p-8 flex flex-col">
      <div class="pb-4 mb-2">
        <div v-if="isEditingName">
          <input ref="nameInputRef" v-model="editedName" @blur="saveChanges" @keyup.enter="saveChanges"
            class="text-3xl font-bold text-white bg-slate-900/50 border-b-2 border-blue-500 focus:outline-none w-full px-2 py-1 rounded-t-md" />
        </div>
        <h2 v-else @click="startNameEditing"
          class="text-3xl font-bold text-white px-2 py-1 cursor-text hover:bg-slate-800/50 rounded-md transition-colors"
          title="Click to edit name">
          {{ workspace.name }}
        </h2>

        <div v-if="isEditingDesc" class="mt-2">
          <input ref="descInputRef" v-model="editedDesc" @blur="saveChanges" @keyup.enter="saveChanges"
            class="text-slate-400 bg-slate-900/50 border-b-2 border-blue-500 focus:outline-none w-full px-2 py-1 rounded-t-md"
            placeholder="Type a description..." />
        </div>
        <p v-else @click="startDescEditing"
          class="text-slate-400 mt-2 px-2 py-1 cursor-text hover:bg-slate-800/50 rounded-md transition-colors"
          title="Click to edit description">
          {{ workspace.description || 'No description provided. Click to add one.' }}
        </p>
      </div>

      <div class="relative">
        <UTabs v-model="activeTab" :items="tabItems" variant="link" class="gap-4">
          <template #shortcuts>
            <Shortcuts :workspace="workspace" />
          </template>
        </UTabs>

        <div class="absolute top-0 right-0 p-1">
          <ShortcutFormModal :workspace="workspace" />
        </div>
      </div>
    </div>

    <div v-else class="relative z-10 flex flex-col items-center text-slate-500">
      <div
        class="w-16 h-16 mb-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center shadow-lg backdrop-blur-sm">
        <svg class="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      </div>
      <p class="text-lg font-medium text-slate-300">Select a Workspace</p>
      <p class="text-sm mt-1">Choose an item from the sidebar to view details</p>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { Workspace } from '../services/workspaces';
import type { TabsItem } from '@nuxt/ui';
import Shortcuts from "./Shortcuts/index.vue";
import ShortcutFormModal from './Shortcuts/ShortcutFormModal.vue';

const tabItems = [
  {
    label: 'Shortcuts',
    slot: 'shortcuts' as const
  },
  {
    label: 'Notes',
    slot: 'notes' as const
  }
] satisfies TabsItem[]

const activeTab = ref('0');

const props = defineProps<{
  workspace: Workspace | null;
}>();

const emit = defineEmits<{
  (e: 'update:workspace', id: number, payload: { name: string, description: string }): void;
}>();

const isEditingName = ref(false);
const isEditingDesc = ref(false);
const editedName = ref('');
const editedDesc = ref('');

const nameInputRef = ref<HTMLInputElement | null>(null);
const descInputRef = ref<HTMLInputElement | null>(null);

// Watch for workspace changes to sync editable inputs and close editing modes
watch(() => props.workspace, (newWs) => {
  if (newWs) {
    editedName.value = newWs.name;
    editedDesc.value = newWs.description || '';
  } else {
    editedName.value = '';
    editedDesc.value = '';
  }

  isEditingName.value = false;
  isEditingDesc.value = false;
}, { immediate: true });

function startNameEditing() {
  isEditingName.value = true;
  nextTick(() => nameInputRef.value?.focus());
}

function startDescEditing() {
  isEditingDesc.value = true;
  nextTick(() => descInputRef.value?.focus());
}

function saveChanges() {
  if (isEditingName.value || isEditingDesc.value) {
    const finalName = editedName.value.trim() || 'Untitled Workspace';
    const finalDesc = editedDesc.value.trim();

    isEditingName.value = false;
    isEditingDesc.value = false;

    if (props.workspace && (finalName !== props.workspace.name || finalDesc !== props.workspace.description)) {
      emit('update:workspace', props.workspace.id, { name: finalName, description: finalDesc });
    }
  }
}
</script>