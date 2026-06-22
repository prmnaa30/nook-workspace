<template>
  <NoteEditor v-if="activeNote" :workspace="workspace" @back="closeEditor" @delete="triggerDeleteModal(activeNote)" />

  <div v-else class="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-4 h-full">
    <div class="absolute top-0 right-0 p-1 flex gap-1 z-20">
      <SearchSortBar
        v-model:search="searchQuery"
        v-model:sort-key="sortKey"
        v-model:sort-order="sortOrder"
        :sort-options="sortOptions"
      />

      <NoteFormModal :workspace="workspace!" />
    </div>

    <div v-if="filteredAndSortedNotes.length === 0"
      class="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-700/50 rounded-2xl bg-slate-800/10 min-h-[200px]">
      <p class="text-slate-500">{{ searchQuery ? 'No notes found.' : 'No notes created yet.' }}</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="note in filteredAndSortedNotes" :key="note.id" @click="openNoteEditor(note)"
        class="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl overflow-hidden flex flex-col z-10 cursor-pointer transition-all shadow-md hover:shadow-lg duration-200">
        <div
          class="h-14 w-full relative transition-all duration-200 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-b border-indigo-500/10">
          <button @click.stop="triggerDeleteModal(note)"
            class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-slate-950/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-md transition-all border border-slate-800/60"
            title="Delete Note">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div class="absolute top-2 right-10 opacity-0 group-hover:opacity-100 transition-all z-20">
            <NoteFormModal :workspace="workspace!" :initial-value="note">
              <button @click.stop
                class="p-1 bg-slate-950/80 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-md transition-all border border-slate-800/60"
                title="Rename Note">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </NoteFormModal>
          </div>
        </div>

        <div
          class="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-center -mt-4 ml-4 relative z-10 shadow-md">
          <span class="text-lg">📄</span>
        </div>

        <div class="p-4 pt-2.5 flex flex-col gap-2">
          <h4 class="font-semibold text-slate-200 text-sm tracking-wide truncate" :title="note.title">
            {{ note.title }}
          </h4>
          <div
            class="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-1 bg-slate-950/40 p-2 rounded border border-slate-800/40 truncate w-full"
            :title="note.filename">
            <span class="truncate">{{ note.filename }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <DeleteModal
    ref="deleteModalRef"
    delete-type="Note"
    :target="noteToDelete?.title || ''"
    @confirm="handleConfirmDelete"
  />
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { Workspace } from '../../services/workspaces.service';
import type { Note } from '../../services/notes.service';
import { useNoteStore } from '../../stores/notes';
import { storeToRefs } from 'pinia';

const props = defineProps<{ workspace: Workspace | null }>();

const store = useNoteStore();
const { notes, activeNote } = storeToRefs(store);

const searchQuery = ref('');
const sortKey = ref('title');
const sortOrder = ref<'asc' | 'desc'>('asc');

const sortOptions = [
  { label: 'Name', value: 'title' },
  { label: 'Date Created', value: 'created_at' },
  { label: 'Date Modified', value: 'updated_at' }
];

const deleteModalRef = ref<any>(null);
const noteToDelete = ref<Note | null>(null);

const filteredAndSortedNotes = computed(() => {
  if (!notes.value) return [];

  let result = [...notes.value];

  // Searching
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(note =>
      note.title.toLowerCase().includes(query) ||
      (note.filename && note.filename.toLowerCase().includes(query))
    );
  }

  // Sorting
  result.sort((a: any, b: any) => {
    let valA = a[sortKey.value] || '';
    let valB = b[sortKey.value] || '';

    if (typeof valA === 'string' && typeof valB === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });

  return result;
});

watch(() => props.workspace, async (newWs) => {
  if (newWs) {
    await store.getNotes(newWs.id);
    closeEditor();
  } else {
    notes.value = [];
    activeNote.value = null;
  }
}, { immediate: true });

function openNoteEditor(note: Note) {
  activeNote.value = note;
}

function closeEditor() {
  activeNote.value = null;
}

function triggerDeleteModal(note: Note) {
  noteToDelete.value = note;
  deleteModalRef.value?.openModal();
}

async function handleConfirmDelete() {
  if (noteToDelete.value && props.workspace) {
    await store.deleteNote(props.workspace.id, noteToDelete.value.id, noteToDelete.value.filename);
    noteToDelete.value = null;
  }
}
</script>
