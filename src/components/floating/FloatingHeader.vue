<template>
	<div class="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 shrink-0 bg-slate-950 overflow-hidden h-12">
		<div class="flex items-center gap-2.5 w-full">
			<UIcon name="i-lucide-search" class="size-4 text-slate-400 shrink-0" />

			<UInput
				ref="searchInputRef"
				v-model="searchQuery"
				type="text"
				placeholder="Type to search shortcuts & notes..."
				color="neutral"
				variant="none"
				size="sm"
				class="w-full font-medium text-slate-100"
				@keydown.down.prevent="$emit('move-selection', 1)"
				@keydown.up.prevent="$emit('move-selection', -1)"
				@keydown.enter.prevent="$emit('execute-active')"
				@keydown.esc.prevent="$emit('close-window')"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineEmits<{
	(e: "move-selection", dir: number): void;
	(e: "execute-active"): void;
	(e: "close-window"): void;
}>();

const searchQuery = defineModel<string>("searchQuery", { default: "" });
const searchInputRef = ref<any>(null);

function focusSearchInput() {
	if (!searchInputRef.value) return;
	const comp = searchInputRef.value;
	if (typeof comp.focus === "function") {
		comp.focus();
	}
	const el = comp.$el?.querySelector ? comp.$el.querySelector("input") : comp.inputRef;
	if (el && typeof el.focus === "function") {
		el.focus();
	}
}

defineExpose({ focusSearchInput });
</script>
