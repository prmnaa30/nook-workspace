<template>
	<div class="flex flex-col h-full overflow-hidden">
		<!-- Active Note Editor Mode -->
		<div v-if="activeNote" class="flex-1 flex flex-col min-h-0">
			<NoteEditor
				:workspace="currentWorkspace"
				@back="activeNote = null; noteStore.activeNote = null"
				@delete="triggerDeleteNote(activeNote!)"
			/>
		</div>

		<!-- Notes Cards Grid Mode -->
		<div v-else class="flex flex-col h-full overflow-hidden">
			<!-- Sub-Header Bar -->
			<WorkspaceSubHeader
				title="Notes"
				:item-count="filteredNotes.length"
				item-unit="notes"
				search-placeholder="Search notes..."
				v-model:search="searchQuery"
				v-model:sort-key="sortKey"
				v-model:sort-order="sortOrder"
				:sort-options="sortOptions"
				action-label="New Note"
				action-icon="i-lucide-plus"
				@action="openFormModal()"
			/>

			<!-- Content Grid -->
			<div class="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
				<div
					v-if="filteredNotes.length === 0"
					class="h-48 flex flex-col items-center justify-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl text-neutral-400 dark:text-neutral-500"
				>
					<UIcon name="i-lucide-notebook-pen" class="size-8 mb-2 opacity-50" />
					<p class="text-sm">No notes created yet.</p>
				</div>

				<div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<NoteCard
						v-for="note in filteredNotes"
						:key="note.id"
						:note="note"
						@open="openNoteEditor(note)"
						@edit="openFormModal(note)"
						@move="triggerMoveNote(note)"
						@delete="triggerDeleteNote(note)"
					/>
				</div>
			</div>

			<!-- Add/Edit Note Modal -->
			<NoteFormModal
				ref="formModalRef"
				:workspace-id="workspaceId"
				@saved="refreshNotes"
			/>

			<!-- Move Note Modal -->
			<MoveModal
				ref="moveModalRef"
				item-type="Note"
				@confirm="handleConfirmMove"
			/>

			<!-- Missing Note Modal -->
			<NoteMissingModal
				ref="missingModalRef"
				@recreate="handleRecreateNote"
				@delete="handleDeleteMissingNote"
			/>

			<!-- Delete Note Modal -->
			<DeleteModal
				ref="deleteModalRef"
				delete-type="Note"
				:target="noteToDelete?.title || ''"
				@confirm="handleConfirmDelete"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useStorage } from "@vueuse/core";
import type { Note } from "../../services/notes.service";
import { useNoteStore } from "../../stores/notes";
import { useWorkspaceStore } from "../../stores/workspaces";
import WorkspaceSubHeader from "../workspace/WorkspaceSubHeader.vue";
import NoteCard from "./NoteCard.vue";
import NoteEditor from "./NoteEditor.vue";
import NoteFormModal from "./NoteFormModal.vue";
import NoteMissingModal from "./NoteMissingModal.vue";
import DeleteModal from "../common/DeleteModal.vue";
import MoveModal from "../common/MoveModal.vue";

const props = defineProps<{
	workspaceId: number;
}>();

const noteStore = useNoteStore();
const workspaceStore = useWorkspaceStore();

const activeNote = ref<Note | null>(null);
const searchQuery = ref("");
const sortKey = useStorage("nook_notes_sort_key", "title");
const sortOrder = useStorage<"asc" | "desc">("nook_notes_sort_order", "asc");

const currentWorkspace = computed(() => {
	return workspaceStore.workspaces.find((w) => w.id === props.workspaceId) || null;
});

const sortOptions = [
	{ label: "Title", value: "title" },
	{ label: "Date Updated", value: "updated_at" },
	{ label: "Date Created", value: "created_at" },
];

const workspaceNotes = computed(() => noteStore.notes);

const filteredNotes = computed(() => {
	let result = [...workspaceNotes.value];

	if (searchQuery.value) {
		const query = searchQuery.value.toLowerCase();
		result = result.filter(
			(n) =>
				n.title.toLowerCase().includes(query) ||
				n.filename.toLowerCase().includes(query)
		);
	}

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

onMounted(() => {
	workspaceStore.getWorkspaces();
	noteStore.getNotes(props.workspaceId);
});

watch(() => props.workspaceId, (newId) => {
	if (newId) {
		activeNote.value = null;
		noteStore.activeNote = null;
		noteStore.getNotes(newId);
	}
});

function refreshNotes() {
	noteStore.getNotes(props.workspaceId);
}

async function openNoteEditor(note: Note) {
	const exists = await noteStore.checkNoteFileExists(props.workspaceId, note.filename);
	if (!exists) {
		missingModalRef.value?.openModal(note);
		return;
	}
	activeNote.value = note;
	noteStore.activeNote = note;
}

const formModalRef = ref<any>(null);
const moveModalRef = ref<any>(null);
const missingModalRef = ref<any>(null);
const deleteModalRef = ref<any>(null);
const noteToMove = ref<Note | null>(null);
const noteToDelete = ref<Note | null>(null);

function openFormModal(note?: Note) {
	formModalRef.value?.openModal(note);
}

function triggerMoveNote(note: Note) {
	noteToMove.value = note;
	moveModalRef.value?.openModal(note.title, props.workspaceId);
}

async function handleConfirmMove(targetWorkspaceId: number) {
	if (noteToMove.value) {
		await noteStore.moveNote(props.workspaceId, targetWorkspaceId, noteToMove.value.id, noteToMove.value.filename);
		noteToMove.value = null;
	}
}

async function handleRecreateNote(note: Note) {
	await noteStore.recreateNoteFile(props.workspaceId, note.filename, note.title);
	activeNote.value = note;
	noteStore.activeNote = note;
}

async function handleDeleteMissingNote(note: Note) {
	await noteStore.deleteNote(props.workspaceId, note.id, note.filename);
	if (activeNote.value?.id === note.id) {
		activeNote.value = null;
		noteStore.activeNote = null;
	}
}

function triggerDeleteNote(note: Note) {
	noteToDelete.value = note;
	deleteModalRef.value?.openModal();
}

async function handleConfirmDelete() {
	if (noteToDelete.value) {
		await noteStore.deleteNote(props.workspaceId, noteToDelete.value.id, noteToDelete.value.filename);
		if (activeNote.value?.id === noteToDelete.value.id) {
			activeNote.value = null;
			noteStore.activeNote = null;
		}
		noteToDelete.value = null;
	}
}

defineExpose({
	openNoteById: async (noteId: number) => {
		const note = workspaceNotes.value.find((n: Note) => n.id === noteId);
		if (note) {
			await openNoteEditor(note);
		}
	},
});
</script>
