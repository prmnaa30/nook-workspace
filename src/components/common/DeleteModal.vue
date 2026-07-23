<template>
	<UModal
		v-model:open="isOpen"
		:title="`Delete ${deleteType}`"
		close-icon="i-lucide-x"
		:ui="{ content: 'z-[60]', overlay: 'z-[55]' }"
	>
		<template #body>
			<p class="text-sm text-neutral-600 dark:text-neutral-400">
				Are you sure you want to delete
				<strong class="text-neutral-800 dark:text-neutral-200">{{ target }}</strong>? This action cannot be undone.
			</p>
		</template>

		<template #footer="{ close }">
			<div class="flex w-full justify-end gap-3">
				<UButton
					variant="soft"
					color="neutral"
					@click="close"
				>
					Cancel
				</UButton>
				<UButton
					class="bg-red-500 hover:bg-red-600"
					@click="confirmDelete"
				>
					Delete
				</UButton>
			</div>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineProps<{
	deleteType: string;
	target: string;
}>();

const emit = defineEmits<{
	(e: "confirm"): void;
}>();

const isOpen = ref(false);

function openModal() {
	isOpen.value = true;
}

function confirmDelete() {
	emit("confirm");
	isOpen.value = false;
}

defineExpose({
	openModal,
});
</script>
