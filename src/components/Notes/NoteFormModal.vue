<template>
	<UModal
		v-model:open="isOpen"
		:title="editingNote ? 'Rename Note' : 'Create New Note'"
		close-icon="i-lucide-x"
	>
		<template #body>
			<form id="note-form" @submit.prevent="saveNote" class="flex flex-col gap-4">
				<div class="flex flex-col gap-1">
					<label class="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Note Title *</label>
					<UInput
						v-model="formTitle"
						placeholder="Note title (e.g. Japanese Vocabulary)"
						required
						color="neutral"
						variant="outline"
						size="md"
					/>
				</div>
			</form>
		</template>

		<template #footer="{ close }">
			<div class="flex w-full justify-end gap-3">
				<UButton variant="soft" color="neutral" @click="close">Cancel</UButton>
				<UButton type="submit" form="note-form" color="primary">
					{{ editingNote ? 'Save Changes' : 'Create Note' }}
				</UButton>
			</div>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { Note } from "../../services/notes.service";
import { useNoteStore } from "../../stores/notes";

const props = defineProps<{
	workspaceId: number;
}>();

const emit = defineEmits<{
	(e: "saved"): void;
}>();

const noteStore = useNoteStore();

const isOpen = ref(false);
const editingNote = ref<Note | null>(null);
const formTitle = ref("");

function openModal(note?: Note) {
	if (note) {
		editingNote.value = note;
		formTitle.value = note.title;
	} else {
		editingNote.value = null;
		formTitle.value = "";
	}
	isOpen.value = true;
}

async function saveNote() {
	if (!formTitle.value.trim()) return;

	if (editingNote.value) {
		await noteStore.updateNote(
			props.workspaceId,
			editingNote.value.id,
			formTitle.value.trim()
		);
	} else {
		await noteStore.createNote(
			props.workspaceId,
			formTitle.value.trim()
		);
	}

	emit("saved");
	isOpen.value = false;
}

defineExpose({ openModal });
</script>
