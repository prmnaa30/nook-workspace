<template>
	<UModal
		v-model:open="isOpen"
		close-icon="i-lucide-x"
		:title="initialValue ? 'Rename Note' : 'Add New Note'"
		:ui="{
			title: 'text-text font-medium',
			footer: 'self-end',
		}"
	>

		<template #body>
			<div class="flex flex-col gap-3">
				<form
					@submit.prevent="submitNote"
					class="flex flex-col gap-3"
					id="note-form"
				>
					<input
						v-model="title"
						type="text"
						placeholder="Note Title (e.g., Daily Standup)"
						required
						class="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-slate-100 focus:ring-1 focus:ring-slate-100 focus:outline-none text-text placeholder-text-muted transition-colors"
					/>
				</form>
			</div>
		</template>

		<template #footer="{ close }">
			<div class="flex gap-3">
				<UButton
					variant="soft"
					@click="close"
					class="px-4 py-1.5 bg-surface hover:bg-surface-hover border border-border rounded-md text-text-secondary hover:text-text text-sm transition-colors whitespace-nowrap cursor-pointer"
				>
					Cancel
				</UButton>

				<button
					type="submit"
					form="note-form"
					class="px-4 py-1.5 bg-text text-background hover:opacity-90 text-sm font-medium rounded-md transition-all cursor-pointer"
				>
					{{ initialValue ? "Update" : "Create" }}
				</button>
			</div>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { Workspace } from "../../services/workspaces.service";
import type { Note } from "../../services/notes.service";
import { useNoteStore } from "../../stores/notes";

const store = useNoteStore();

const props = defineProps<{
	workspace: Workspace;
	initialValue?: Note;
}>();

const isOpen = ref(false);
const title = ref("");

watch(isOpen, (newValue) => {
	if (newValue) {
		if (props.initialValue) {
			title.value = props.initialValue.title;
		} else {
			title.value = "";
		}
	}
});

async function submitNote() {
	if (!props.workspace || !title.value.trim()) return;

	if (props.initialValue) {
		await store.updateNote(props.workspace.id, props.initialValue.id, title.value);
	} else {
		await store.createNote(props.workspace.id, title.value);
	}

	isOpen.value = false;
}

function openModal() {
	isOpen.value = true;
}

defineExpose({
	openModal,
});
</script>
