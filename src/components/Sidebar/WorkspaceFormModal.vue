<template>
	<UModal
		v-model:open="isOpen"
		close-icon="i-lucide-x"
		:title="initialValue ? 'Edit Workspace' : 'Add New Workspace'"
		:ui="{
			title: 'text-text font-medium',
			footer: 'self-end',
		}"
	>

		<template #body>
			<div class="flex flex-col gap-3">
				<form
					@submit.prevent="submitWorkspace"
					class="flex flex-col gap-3"
					id="workspace-form"
				>
					<input
						v-model="title"
						type="text"
						placeholder="Title (e.g., Meeting Materials)"
						required
						class="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-slate-100 focus:ring-1 focus:ring-slate-100 focus:outline-none text-text placeholder-text-muted transition-colors"
					/>

					<textarea
						v-model="description"
						placeholder="Description (Optional)"
						class="w-full h-44 bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-slate-100 focus:ring-1 focus:ring-slate-100 focus:outline-none text-text placeholder-text-muted transition-colors resize-none"
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
					form="workspace-form"
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
import { useWorkspaceStore } from "../../stores/workspaces";

const store = useWorkspaceStore();

const props = defineProps<{
	initialValue?: Workspace;
}>();

const isOpen = ref(false);

const title = ref("");
const description = ref("");

watch(isOpen, (newValue) => {
	if (newValue) {
		if (props.initialValue) {
			title.value = props.initialValue.name;
			description.value = props.initialValue.description;
		} else {
			title.value = "";
			description.value = "";
		}
	}
});

async function submitWorkspace() {
	if (!title.value.trim()) return;

	if (props.initialValue) {
		await store.updateWorkspace(props.initialValue.id, title.value, description.value);
	} else {
		await store.createWorkspace(title.value, description.value);
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
