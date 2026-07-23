<template>
	<div
		class="inline-flex items-center py-[2.2px] px-0.5 rounded-md bg-neutral-300 dark:bg-default border border-neutral-200 dark:border-inverted/25 select-none gap-1"
	>
		<UButton
			:variant="modelValue === 'list' ? 'solid' : 'ghost'"
			color="neutral"
			size="xs"
			icon="i-ph-list-bullets-bold"
			label="List View"
			class="cursor-pointer font-semibold py-0.75"
			:class="modelValue !== 'list' ? 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-200' : ''"
			@click="selectView('list')"
		/>

		<UButton
			:variant="modelValue === 'calendar' ? 'solid' : 'ghost'"
			color="neutral"
			size="xs"
			icon="i-ph-calendar-bold"
			label="Calendar View"
			class="cursor-pointer font-semibold py-0.75"
			:class="modelValue !== 'calendar' ? 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-200' : ''"
			@click="selectView('calendar')"
		/>
	</div>
</template>

<script setup lang="ts">
export type TimelineViewMode = "list" | "calendar";

defineProps<{
	modelValue: TimelineViewMode;
}>();

const emit = defineEmits<{
	(e: "update:modelValue", mode: TimelineViewMode): void;
}>();

function selectView(mode: TimelineViewMode) {
	emit("update:modelValue", mode);
}
</script>
