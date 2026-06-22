<template>
  <div v-if="activeNote"
    class="flex-1 flex flex-col bg-slate-900/40 border border-slate-700/50 rounded-xl overflow-hidden shadow-lg backdrop-blur-md h-full min-h-[500px]">    <!-- Canvas Editor -->
    <div class="flex-1 overflow-y-auto overscroll-contain">
      <UEditor
        v-model="noteContent" 
        v-slot="{ editor }"
        contentType="markdown"
        @update:modelValue="debouncedSave"
        :ui="{ base: 'px-8 sm:px-12' }"
        class="w-full relative"
      >
        <div class="flex items-center justify-between border-b sticky top-0 border-slate-800/50 bg-slate-950 z-10 px-12 py-2 mb-4 rounded-lg gap-4">
          <UEditorToolbar
            :editor="editor"
            :items="toolbarItems"
            class="flex-1 overflow-x-auto border-0 bg-transparent p-0 m-0"
          />
          
          <div class="flex items-center gap-2 shrink-0">
            <UButton
              icon="i-ph-trash"
              variant="ghost"
              size="sm"
              class="hover:text-red-400 hover:bg-red-500/20 cursor-pointer"
              title="Delete Note"
              @click="emit('delete')"
            />
            <UButton
              icon="i-ph-x"
              variant="soft"
              size="sm"
              class="cursor-pointer"
              title="Close Note"
              @click="emit('back')"
            />
          </div>
        </div>
        <UEditorToolbar :editor="editor" :items="bubbleToolbarItems" layout="bubble" class="absolute -top-10 border-slate-800 z-50" />
        <UEditorDragHandle :editor="editor" />
      </UEditor>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import type { Workspace } from '../../services/workspaces.service';
import { useNoteStore } from '../../stores/notes';
import { storeToRefs } from 'pinia';

const props = defineProps<{
  workspace: Workspace | null;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
  (e: 'delete'): void;
}>();

const store = useNoteStore();
const { activeNote } = storeToRefs(store);

const noteContent = ref('');
const isSaving = ref(false);

const toolbarItems = [
  [
    { kind: 'undo', icon: 'i-ph-arrow-counter-clockwise', tooltip: { text: 'Undo' } },
    { kind: 'redo', icon: 'i-ph-arrow-clockwise', tooltip: { text: 'Redo' } }
  ],
  [
    { kind: 'heading', level: 1, label: 'H1', tooltip: { text: 'Heading 1' } },
    { kind: 'heading', level: 2, label: 'H2', tooltip: { text: 'Heading 2' } },
    { kind: 'heading', level: 3, label: 'H3', tooltip: { text: 'Heading 3' } },
    { kind: 'paragraph', label: 'P', tooltip: { text: 'Paragraph' } }
  ],
  [
    { kind: 'mark', mark: 'bold', icon: 'i-ph-text-bolder', tooltip: { text: 'Bold' } },
    { kind: 'mark', mark: 'italic', icon: 'i-ph-text-italic', tooltip: { text: 'Italic' } },
    { kind: 'mark', mark: 'underline', icon: 'i-ph-text-underline', tooltip: { text: 'Underline' } },
    { kind: 'mark', mark: 'strike', icon: 'i-ph-text-strikethrough', tooltip: { text: 'Strikethrough' } }
  ],
  [
    { kind: 'blockquote', icon: 'i-ph-quotes', tooltip: { text: 'Blockquote' } },
    { kind: 'codeBlock', icon: 'i-ph-code', tooltip: { text: 'Code Block' } },
    { kind: 'horizontalRule', icon: 'i-ph-minus', tooltip: { text: 'Horizontal Rule' } }
  ],
  [
    { kind: 'bulletList', icon: 'i-ph-list-bullets', tooltip: { text: 'Bullet List' } },
    { kind: 'orderedList', icon: 'i-ph-list-numbers', tooltip: { text: 'Ordered List' } }
  ]
];
const bubbleToolbarItems = [
  { kind: 'mark', mark: 'bold', icon: 'i-ph-text-bolder', tooltip: { text: 'Bold' } },
  { kind: 'mark', mark: 'italic', icon: 'i-ph-text-italic', tooltip: { text: 'Italic' } },
  { kind: 'mark', mark: 'underline', icon: 'i-ph-text-underline', tooltip: { text: 'Underline' } },
  { kind: 'mark', mark: 'strike', icon: 'i-ph-text-strikethrough', tooltip: { text: 'Strikethrough' } }
];

watch(activeNote, async (newNote) => {
  if (newNote) {
    try {
      noteContent.value = await invoke('read_note', {
        filename: newNote.filename
      });
    } catch (e) {
      console.error("Failed to read note file:", e);
    }
  } else {
    noteContent.value = '';
  }
}, { immediate: true });

let timeout: ReturnType<typeof setTimeout>;
function debouncedSave() {
  isSaving.value = true;
  clearTimeout(timeout);
  timeout = setTimeout(async () => {
    if (props.workspace && activeNote.value) {
      try {
        await invoke('write_note', {
          filename: activeNote.value.filename,
          content: noteContent.value
        });
      } catch (e) {
        console.error("Gagal auto-save:", e);
      } finally {
        isSaving.value = false;
      }
    }
  }, 1000);
}
</script>