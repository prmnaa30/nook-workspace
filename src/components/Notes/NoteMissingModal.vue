<template>
	<UModal v-model:open="isOpen" title="Note File Missing">
		<template #body>
			<div class="space-y-3">
				<div class="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
					<UIcon name="i-lucide-alert-triangle" class="size-5 shrink-0 mt-0.5" />
					<div class="text-xs space-y-1">
						<p class="font-bold">File Not Found on Disk</p>
						<p>
							The markdown file <span class="font-mono font-bold">{{ noteFilename }}</span> for <span class="font-bold font-sans">"{{ noteTitle }}"</span> was not found in the workspace notes folder.
						</p>
					</div>
				</div>

				<p class="text-xs text-neutral-600 dark:text-neutral-400">
					Please select an action to resolve this issue:
				</p>
			</div>
		</template>

		<template #footer>
			<div class="flex w-full flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 w-full">
				<UButton variant="ghost" color="neutral" size="sm" @click="closeModal">
					Cancel
				</UButton>
				<UButton color="error" variant="soft" size="sm" icon="i-lucide-trash-2" @click="handleDelete">
					Delete Note Data
				</UButton>
				<UButton color="primary" size="sm" icon="i-lucide-file-plus" @click="handleRecreate">
					Recreate File
				</UButton>
			</div>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { Note } from "../../services/notes.service";

const emit = defineEmits<{
	(e: "recreate", note: Note): void;
	(e: "delete", note: Note): void;
}>();

const isOpen = ref(false);
const noteRef = ref<Note | null>(null);

const noteTitle = ref("");
const noteFilename = ref("");

function openModal(note: Note) {
	noteRef.value = note;
	noteTitle.value = note.title;
	noteFilename.value = note.filename;
	isOpen.value = true;
}

function closeModal() {
	isOpen.value = false;
}

function handleRecreate() {
	if (noteRef.value) {
		emit("recreate", noteRef.value);
		closeModal();
	}
}

function handleDelete() {
	if (noteRef.value) {
		emit("delete", noteRef.value);
		closeModal();
	}
}

defineExpose({
	openModal,
	closeModal,
});
</script>
