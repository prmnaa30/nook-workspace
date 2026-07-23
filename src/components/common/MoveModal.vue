<template>
	<UModal v-model:open="isOpen" :title="`Move ${itemType} to Workspace`">
		<template #body>
			<form id="move-form" @submit.prevent="handleConfirm" class="space-y-4">
				<p class="text-xs text-neutral-600 dark:text-neutral-400">
					Select the target workspace for <span class="font-bold text-neutral-900 dark:text-neutral-100">"{{ itemTitle }}"</span>:
				</p>

				<div v-if="availableWorkspaces.length === 0" class="p-3 text-xs text-amber-500 bg-amber-500/10 rounded-lg">
					No other workspaces available to move this item to.
				</div>

				<div v-else class="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
					<div
						v-for="ws in availableWorkspaces"
						:key="ws.id"
						class="flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all"
						:class="
							selectedWorkspaceId === ws.id
								? 'bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400'
								: 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
						"
						@click="selectedWorkspaceId = ws.id"
					>
						<div class="flex items-center gap-2 truncate">
							<UIcon name="i-lucide-folder" class="size-4 shrink-0" />
							<span class="text-xs truncate">{{ ws.name }}</span>
						</div>
						<UIcon
							v-if="selectedWorkspaceId === ws.id"
							name="i-lucide-check"
							class="size-4 text-blue-500 shrink-0"
						/>
					</div>
				</div>
			</form>
		</template>

		<template #footer>
			<div class="flex items-center justify-end gap-2 w-full">
				<UButton variant="soft" color="neutral" size="sm" @click="closeModal">Cancel</UButton>
				<UButton
					type="submit"
					form="move-form"
					color="primary"
					size="sm"
					:disabled="!selectedWorkspaceId || availableWorkspaces.length === 0"
				>
					Move Item
				</UButton>
			</div>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useWorkspaceStore } from "../../stores/workspaces";

defineProps<{
	itemType: "Note" | "Shortcut";
}>();

const emit = defineEmits<{
	(e: "confirm", targetWorkspaceId: number): void;
}>();

const workspaceStore = useWorkspaceStore();

const isOpen = ref(false);
const itemTitle = ref("");
const currentWorkspaceId = ref<number | null>(null);
const selectedWorkspaceId = ref<number | null>(null);

const availableWorkspaces = computed(() => {
	return workspaceStore.workspaces.filter(
		(ws) => ws.id !== currentWorkspaceId.value
	);
});

function openModal(title: string, fromWorkspaceId: number) {
	itemTitle.value = title;
	currentWorkspaceId.value = fromWorkspaceId;
	const firstTarget = workspaceStore.workspaces.find(
		(ws) => ws.id !== fromWorkspaceId
	);
	selectedWorkspaceId.value = firstTarget ? firstTarget.id : null;
	isOpen.value = true;
}

function closeModal() {
	isOpen.value = false;
}

function handleConfirm() {
	if (selectedWorkspaceId.value) {
		emit("confirm", selectedWorkspaceId.value);
		closeModal();
	}
}

defineExpose({
	openModal,
	closeModal,
});
</script>
