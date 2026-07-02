<template>
	<NoteEditor
		v-if="activeNote"
		:workspace="workspace"
		@back="closeEditor"
		@delete="triggerDeleteModal(activeNote)"
	/>

	<div
		v-else
		class="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-4 h-full"
	>
		<div class="absolute top-0 right-0 p-1 flex gap-1 z-20">
			<SearchSortBar
				v-model:search="searchQuery"
				v-model:sort-key="sortKey"
				v-model:sort-order="sortOrder"
				:sort-options="sortOptions"
			/>

			<UButton
				title="Add Note"
				trailing-icon="i-lucide-plus"
				variant="ghost"
				@click="triggerAddNoteModal"
			/>
		</div>

		<div
			v-if="filteredAndSortedNotes.length === 0"
			class="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-700/50 rounded-2xl bg-slate-800/10 min-h-[200px]"
		>
			<p class="text-slate-500">{{ searchQuery ? "No notes found." : "No notes created yet." }}</p>
		</div>

		<div
			v-else
			class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
		>
			<NoteCard
				v-for="note in filteredAndSortedNotes"
				:key="note.id"
				:note="note"
				@click="openNoteEditor"
				@edit="triggerEditModal"
				@delete="triggerDeleteModal"
			/>
		</div>
	</div>

	<DeleteModal
		ref="deleteModalRef"
		delete-type="Note"
		:target="noteToDelete?.title || ''"
		@confirm="handleConfirmDelete"
	/>

	<NoteFormModal
		ref="noteFormModalRef"
		:workspace="workspace!"
		:initial-value="noteToEdit!"
	/>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from "vue";
import type { Workspace } from "../../services/workspaces.service";
import type { Note } from "../../services/notes.service";
import { useNoteStore } from "../../stores/notes";
import { storeToRefs } from "pinia";
import NoteCard from "./NoteCard.vue";

const props = defineProps<{ workspace: Workspace | null }>();

const store = useNoteStore();
const { notes, activeNote } = storeToRefs(store);

const searchQuery = ref("");
const sortKey = ref("title");
const sortOrder = ref<"asc" | "desc">("asc");

const sortOptions = [
	{ label: "Name", value: "title" },
	{ label: "Date Created", value: "created_at" },
	{ label: "Date Modified", value: "updated_at" },
];

const deleteModalRef = ref<any>(null);
const noteToDelete = ref<Note | null>(null);

const noteFormModalRef = ref<any>(null);
const noteToEdit = ref<Note | null>(null);

const filteredAndSortedNotes = computed(() => {
	if (!notes.value) return [];

	let result = [...notes.value];

	// Searching
	if (searchQuery.value) {
		const query = searchQuery.value.toLowerCase();
		result = result.filter(
			(note) =>
				note.title.toLowerCase().includes(query) ||
				(note.filename && note.filename.toLowerCase().includes(query)),
		);
	}

	// Sorting
	result.sort((a: any, b: any) => {
		let valA = a[sortKey.value] || "";
		let valB = b[sortKey.value] || "";

		if (typeof valA === "string" && typeof valB === "string") {
			valA = valA.toLowerCase();
			valB = valB.toLowerCase();
		}

		if (valA < valB) return sortOrder.value === "asc" ? -1 : 1;
		if (valA > valB) return sortOrder.value === "asc" ? 1 : -1;
		return 0;
	});

	return result;
});

watch(
	() => props.workspace?.id,
	(newWorkspaceId) => {
		if (!newWorkspaceId) return;

		const savedSortKey = localStorage.getItem(`ws_${newWorkspaceId}_notes_sortKey`);
		if (savedSortKey) {
			sortKey.value = savedSortKey;
		} else {
			sortKey.value = "title";
		}

		const savedSortOrder = localStorage.getItem(`ws_${newWorkspaceId}_notes_sortOrder`);
		if (savedSortOrder === "asc" || savedSortOrder === "desc") {
			sortOrder.value = savedSortOrder;
		} else {
			sortOrder.value = "asc";
		}
	},
	{ immediate: true },
);

watch(sortKey, (newVal) => {
	if (props.workspace?.id) {
		localStorage.setItem(`ws_${props.workspace.id}_notes_sortKey`, newVal);
	}
});

watch(sortOrder, (newVal) => {
	if (props.workspace?.id) {
		localStorage.setItem(`ws_${props.workspace.id}_notes_sortOrder`, newVal);
	}
});

watch(
	() => props.workspace,
	async (newWs) => {
		if (newWs) {
			await store.getNotes(newWs.id);

			if (activeNote.value && activeNote.value.workspace_id !== newWs.id) {
				closeEditor();
			}
		} else {
			notes.value = [];
			activeNote.value = null;
		}
	},
	{ immediate: true },
);

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

function triggerAddNoteModal() {
	noteToEdit.value = null;
	nextTick(() => {
		noteFormModalRef.value?.openModal();
	});
}

function triggerEditModal(note: Note) {
	noteToEdit.value = note;
	nextTick(() => {
		noteFormModalRef.value?.openModal();
	});
}

async function handleConfirmDelete() {
	if (noteToDelete.value && props.workspace) {
		await store.deleteNote(props.workspace.id, noteToDelete.value.id, noteToDelete.value.filename);
		noteToDelete.value = null;
	}
}
</script>
