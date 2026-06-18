<template>
  <div class="h-full flex flex-col p-6">

    <!-- HEADER: Tab Navigasi Catatan -->
    <div class="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
      <div class="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
        <!-- Looping tab catatan -->
        <button v-for="note in notesList" :key="note" @click="selectNote(note)"
          class="px-4 py-2 rounded-t-lg text-sm font-medium transition-all whitespace-nowrap"
          :class="activeNote === note ? 'bg-indigo-600 border-t border-indigo-400 text-white shadow-[0_-4px_15px_rgba(79,70,229,0.3)]' : 'bg-slate-900/50 text-slate-400 hover:text-slate-200'">
          📄 {{ note }}
        </button>
      </div>

      <button @click="createNewNote"
        class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm border border-slate-700 whitespace-nowrap ml-4 transition-colors">
        + New Note
      </button>
    </div>

    <!-- AREA EDITOR / PREVIEW -->
    <div v-if="activeNote"
      class="flex-1 flex flex-col bg-slate-900/40 border border-slate-700/50 rounded-xl overflow-hidden shadow-lg backdrop-blur-md">

      <!-- Toolbar Catatan Aktif -->
      <div class="bg-slate-800/80 border-b border-slate-700 p-3 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <h3 class="text-white font-semibold flex items-center gap-2">
            {{ activeNote }}
            <span v-if="isSaving" class="text-xs text-indigo-400 font-normal animate-pulse">(Saving...)</span>
          </h3>
          <button @click="deleteCurrentNote" class="text-xs text-red-400 hover:text-red-300 hover:underline">Delete
            File</button>
        </div>

        <!-- Toggle Switch Edit/Preview -->
        <div class="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button @click="isEditing = true" class="px-4 py-1 text-xs font-medium rounded-md transition-all"
            :class="isEditing ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white'">Edit</button>
          <button @click="isEditing = false" class="px-4 py-1 text-xs font-medium rounded-md transition-all"
            :class="!isEditing ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white'">Preview</button>
        </div>
      </div>

      <!-- Kanvas Pengetikan / Pembacaan -->
      <div class="flex-1 relative">
        <!-- Textarea untuk mengetik -->
        <textarea v-if="isEditing" v-model="noteContent" @input="debouncedSave"
          class="absolute inset-0 w-full h-full bg-transparent text-slate-200 p-6 focus:outline-none resize-none font-mono text-sm leading-relaxed custom-scrollbar"
          placeholder="Tulis ide brilian Anda menggunakan format Markdown... (# Heading, - List, **Bold**)"></textarea>

        <!-- Render Markdown ke HTML -->
        <div v-else class="absolute inset-0 w-full h-full p-6 overflow-y-auto custom-scrollbar markdown-preview"
          v-html="renderedMarkdown"></div>
      </div>
    </div>

    <!-- JIKA BELUM ADA CATATAN -->
    <div v-else
      class="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-700/50 rounded-2xl bg-slate-800/10">
      <div class="text-4xl mb-3 opacity-50">📝</div>
      <p class="text-slate-500 font-medium">Belum ada catatan di Workspace ini.</p>
      <button @click="createNewNote"
        class="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
        Buat Catatan Pertama
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { marked } from 'marked';
import type { Workspace } from '../../services/workspaces';

const props = defineProps<{ workspace: Workspace | null }>();

const notesList = ref<string[]>([]);
const activeNote = ref<string | null>(null);
const noteContent = ref('');
const isEditing = ref(false);
const isSaving = ref(false);

const renderedMarkdown = computed(() => {
  return marked.parse(noteContent.value) || '<p class="text-slate-500 italic">Catatan masih kosong...</p>';
});

watch(() => props.workspace, async (newWs) => {
  if (newWs) {
    await fetchNotesList(newWs.id);
    if (notesList.value.length > 0) {
      selectNote(notesList.value[0]);
    } else {
      activeNote.value = null;
    }
  }
}, { immediate: true });

async function fetchNotesList(workspaceId: number) {
  try {
    notesList.value = await invoke('list_notes', { workspaceId });
  } catch (e) {
    console.error("Gagal memuat list notes:", e);
  }
}

async function selectNote(title: string) {
  activeNote.value = title;
  isEditing.value = false;
  try {
    noteContent.value = await invoke('read_note', {
      workspaceId: props.workspace!.id,
      title
    });
  } catch (e) {
    console.error("Gagal membaca file:", e);
  }
}

async function createNewNote() {
  const title = prompt("Masukkan judul catatan (tanpa ekstensi .md):");
  if (title && title.trim()) {
    const cleanTitle = title.trim();
    await invoke('write_note', {
      workspaceId: props.workspace!.id,
      title: cleanTitle,
      content: `# ${cleanTitle}\n\n`
    });

    await fetchNotesList(props.workspace!.id);
    selectNote(cleanTitle);
    isEditing.value = true;
  }
}

async function deleteCurrentNote() {
  if (!activeNote.value || !props.workspace) return;
  if (confirm(`Apakah Anda yakin ingin menghapus file "${activeNote.value}.md" selamanya dari komputer Anda?`)) {
    await invoke('delete_note', {
      workspaceId: props.workspace.id,
      title: activeNote.value
    });

    await fetchNotesList(props.workspace.id);
    if (notesList.value.length > 0) {
      selectNote(notesList.value[0]);
    } else {
      activeNote.value = null;
    }
  }
}

// Auto Save, Every 1 Sec
let timeout: ReturnType<typeof setTimeout>;
function debouncedSave() {
  isSaving.value = true;
  clearTimeout(timeout);
  timeout = setTimeout(async () => {
    if (props.workspace && activeNote.value) {
      await invoke('write_note', {
        workspaceId: props.workspace.id,
        title: activeNote.value,
        content: noteContent.value
      });
      isSaving.value = false;
    }
  }, 1000);
}
</script>

<style>
@reference "tailwindcss";

.markdown-preview h1 {
  @apply text-3xl font-bold mb-4 text-white;
}

.markdown-preview h2 {
  @apply text-2xl font-bold mb-3 mt-8 text-white border-b border-slate-700 pb-2;
}

.markdown-preview h3 {
  @apply text-xl font-bold mb-3 mt-6 text-slate-200;
}

.markdown-preview p {
  @apply mb-4 text-slate-300 leading-relaxed;
}

.markdown-preview ul {
  @apply list-disc pl-6 mb-4 text-slate-300;
}

.markdown-preview ol {
  @apply list-decimal pl-6 mb-4 text-slate-300;
}

.markdown-preview li {
  @apply mb-1;
}

.markdown-preview blockquote {
  @apply border-l-4 border-indigo-500 pl-4 py-1 italic text-slate-400 bg-slate-800/30 rounded-r-lg mb-4;
}

.markdown-preview code {
  @apply bg-slate-900 text-indigo-300 px-1.5 py-0.5 rounded text-sm font-mono border border-slate-800;
}

.markdown-preview pre {
  @apply bg-slate-950 p-4 rounded-xl overflow-x-auto mb-4 border border-slate-800 shadow-inner;
}

.markdown-preview pre code {
  @apply bg-transparent border-0 text-slate-300 p-0 text-sm;
}

.markdown-preview a {
  @apply text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors;
}

.markdown-preview hr {
  @apply border-slate-700 my-8;
}
</style>