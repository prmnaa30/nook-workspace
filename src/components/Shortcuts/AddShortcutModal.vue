<template>
  <UModal
    v-model:open="isOpen"
    close-icon="i-lucide-x"
    title="Add New Shortcut"
    :ui="{
      title: 'text-text font-medium',
      footer: 'self-end'
    }"
  >

    <UButton label="Add" />

    <template #body>
      <div class="flex flex-col gap-3">
        <form @submit.prevent="submitShortcut" class="flex flex-col gap-3" id="add-shortcut">
          <div class="flex gap-3">
            <input v-model="newShortcut.title" type="text" placeholder="Shortcut Title (e.g., Figma Design)" required
              class="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-slate-100 focus:ring-1 focus:ring-slate-100 focus:outline-none text-text placeholder-text-muted transition-colors">
            <USelectMenu v-model="newShortcut.type" value-key="id" :items="shortcutType" placeholder="Select type"
              class="w-38" />
          </div>

          <div class="flex gap-2">
            <input v-model="newShortcut.path" type="text"
              placeholder="Target Path (e.g., https://figma.com/file/... atau C:\Projects)" required
              class="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-slate-100 focus:ring-1 focus:ring-slate-100 focus:outline-none text-text placeholder-text-muted font-mono transition-colors">

            <UButton v-if="newShortcut.type !== 'web'" variant="soft" @click="browsePath"
              class="px-4 py-2 bg-transparent hover:bg-surface-hover border border-border rounded-md text-text-secondary hover:text-text text-sm transition-colors whitespace-nowrap cursor-pointer">
              🔍 Browse
            </UButton>
          </div>
        </form>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex gap-3">
        <UButton variant="soft" @click="close"
          class="px-4 py-1.5 bg-surface hover:bg-surface-hover border border-border rounded-md text-text-secondary hover:text-text text-sm transition-colors whitespace-nowrap cursor-pointer">
          Cancel
        </UButton>

        <UButton type="submit" form="add-shortcut"
          class="px-4 py-1.5 bg-text text-background hover:opacity-90 text-sm font-medium rounded-md transition-all cursor-pointer">
          Save Shortcut
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Workspace } from '../../services/workspaces';
import { open } from '@tauri-apps/plugin-dialog';
import { SelectMenuItem } from '@nuxt/ui';
import { useShortcutStore } from '../../stores/shortcuts';

const store = useShortcutStore();

const props = defineProps<{
  workspace: Workspace
}>()

const isOpen = ref(false);
watch(isOpen, (newValue) => {
  if (!newValue) {
    setTimeout(() => {
      resetForm()
    }, 300)
  }
})

const newShortcut = ref<{ title: string, type: 'web' | 'folder' | 'file', path: string, browser_path: string }>({
  title: '',
  type: 'web',
  path: '',
  browser_path: ''
});

const shortcutType = ref<SelectMenuItem[]>([
  {
    label: '🌐 Web URL',
    id: 'web'
  },
  {
    label: '📁 Folder',
    id: 'folder'
  },
  {
    label: '📄 File',
    id: 'file'
  }
]);

async function submitShortcut() {
  if (!props.workspace || !newShortcut.value.title || !newShortcut.value.path) return;

  await store.createShortcut(
    props.workspace.id,
    newShortcut.value.title,
    newShortcut.value.type,
    newShortcut.value.path,
    newShortcut.value.type === 'web' && newShortcut.value.browser_path ? newShortcut.value.browser_path : null
  );

  resetForm();

  isOpen.value = false;
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

function resetForm() {
  newShortcut.value = {
    title: '',
    type: 'web',
    path: '',
    browser_path: ''
  };
}
</script>