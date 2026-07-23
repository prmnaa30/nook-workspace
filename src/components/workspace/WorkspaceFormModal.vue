<template>
	<UModal
		v-model:open="isOpen"
		:title="editingWorkspace ? 'Edit Workspace' : 'Add New Workspace'"
		close-icon="i-lucide-x"
	>
		<template #body>
			<form id="workspace-form" @submit.prevent="saveWorkspace" class="flex flex-col gap-4">
				<div class="flex flex-col gap-1">
					<label class="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Workspace Name *</label>
					<UInput
						v-model="formName"
						placeholder="Workspace name (e.g. JLPT N3, Work Project)"
						required
						color="neutral"
						variant="outline"
						size="md"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Description</label>
					<UTextarea
						v-model="formDescription"
						placeholder="Optional notes or details..."
						color="neutral"
						variant="outline"
						size="md"
						class="h-20 resize-none"
					/>
				</div>

				<div class="flex items-center justify-between pt-2">
					<div class="flex flex-col">
						<span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Show in Global View</span>
						<span class="text-[11px] text-neutral-400">Include tasks from this workspace in global dashboard</span>
					</div>
					<USwitch v-model="formShowInGlobal" color="primary" />
				</div>
			</form>
		</template>

		<template #footer="{ close }">
			<div class="flex justify-end gap-3">
				<UButton variant="soft" color="neutral" @click="close">Cancel</UButton>
				<UButton type="submit" form="workspace-form" color="primary">
					{{ editingWorkspace ? 'Save Changes' : 'Create Workspace' }}
				</UButton>
			</div>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { Workspace } from "../../services/workspaces.service";
import { useWorkspaceStore } from "../../stores/workspaces";

const emit = defineEmits<{
	(e: "saved"): void;
}>();

const workspaceStore = useWorkspaceStore();

const isOpen = ref(false);
const editingWorkspace = ref<Workspace | null>(null);
const formName = ref("");
const formDescription = ref("");
const formShowInGlobal = ref(true);

function openModal(workspace?: Workspace) {
	if (workspace) {
		editingWorkspace.value = workspace;
		formName.value = workspace.name;
		formDescription.value = workspace.description || "";
		formShowInGlobal.value = Boolean(workspace.show_in_global_tasks);
	} else {
		editingWorkspace.value = null;
		formName.value = "";
		formDescription.value = "";
		formShowInGlobal.value = true;
	}
	isOpen.value = true;
}

async function saveWorkspace() {
	if (!formName.value.trim()) return;

	if (editingWorkspace.value) {
		await workspaceStore.updateWorkspace(
			editingWorkspace.value.id,
			formName.value.trim(),
			formDescription.value.trim(),
			formShowInGlobal.value
		);
	} else {
		await workspaceStore.createWorkspace(
			formName.value.trim(),
			formDescription.value.trim(),
			formShowInGlobal.value
		);
	}

	emit("saved");
	isOpen.value = false;
}

defineExpose({ openModal });
</script>
