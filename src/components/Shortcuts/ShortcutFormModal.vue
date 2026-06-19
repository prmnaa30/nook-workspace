<template>
  <UModal
    v-model:open="isOpen"
    close-icon="i-lucide-x"
    :title="initialValue ? 'Edit Shortcut' : 'Add New Shortcut'"
    :ui="{
      title: 'text-text font-medium',
      footer: 'self-end'
    }"
    >

    <slot>
      <UButton label="Add" />
    </slot>

    <template #body>
      <div class="flex flex-col gap-3">
        <form @submit.prevent="submitShortcut" class="flex flex-col gap-3" id="add-shortcut">
          <div class="flex gap-2">
            <input v-model="formData.title" type="text" placeholder="Shortcut Title (e.g., Figma Design)" required
              class="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-slate-100 focus:ring-1 focus:ring-slate-100 focus:outline-none text-text placeholder-text-muted transition-colors">
            <USelectMenu v-model="formData.type" value-key="id" :items="shortcutType" placeholder="Select type"
              class="w-38" />
          </div>

          <div class="flex gap-2">
            <input v-model="formData.path" type="text"
              placeholder="Target Path (e.g., https://figma.com/file/... atau C:\Projects)" required
              class="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-slate-100 focus:ring-1 focus:ring-slate-100 focus:outline-none text-text placeholder-text-muted font-mono transition-colors">

            <UButton v-if="formData.type !== 'web'" variant="soft" @click="browsePath"
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
          {{ initialValue ? 'Update Shortcut' : 'Save Shortcut' }}
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
import type { Shortcut } from '../../services/shortcuts';

const store = useShortcutStore();

const props = defineProps<{
  workspace: Workspace
  initialValue?: Shortcut
}>()

const emit = defineEmits<{
  (e: 'update:submitEdit', shortcutId: string): void;
}>();

const isOpen = ref(false);
watch(isOpen, (newValue) => {
  if (newValue) {
    if (props.initialValue) {
      formData.value = {
        title: props.initialValue.title,
        type: props.initialValue.type,
        path: props.initialValue.path,
        browser_path: props.initialValue.browser_path || ''
      };
    } else {
      resetForm();
    }
  } else {
    setTimeout(() => resetForm(), 300);
  }
});

const formData = ref<{ title: string, type: 'web' | 'folder' | 'file', path: string, browser_path: string }>({
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
  if (!props.workspace || !formData.value.title || !formData.value.path) return;

  const browserPath = formData.value.type === 'web' && formData.value.browser_path ? formData.value.browser_path : null;

  if (props.initialValue) {
    await store.updateShortcut(
      props.workspace.id,
      props.initialValue.id,
      formData.value.title,
      formData.value.type,
      formData.value.path,
      browserPath
    )
  } else {
    await store.createShortcut(
      props.workspace.id,
      formData.value.title,
      formData.value.type,
      formData.value.path,
      browserPath
    );
  }

  isOpen.value = false;
}

async function browsePath() {
  if (formData.value.type === 'web') return;

  const selectedPath = await open({
    directory: formData.value.type === 'folder',
    multiple: false
  });

  if (selectedPath) {
    formData.value.path = selectedPath as string;
  }
}

function resetForm() {
  formData.value = {
    title: '',
    type: 'web',
    path: '',
    browser_path: ''
  };
}
</script>