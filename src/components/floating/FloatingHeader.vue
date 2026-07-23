<template>
	<div class="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 shrink-0 bg-slate-950 overflow-hidden h-12">
		<Transition :name="animationName" mode="out-in" @after-enter="$emit('after-enter')">
			<!-- Search Mode Header Row -->
			<div v-if="mode === 'search'" key="search" class="flex items-center gap-3 w-full">
				<UButton
					color="primary"
					variant="soft"
					size="xs"
					class="cursor-pointer font-semibold shrink-0 select-none whitespace-nowrap"
					title="Click or press Ctrl+Tab to switch mode"
					@click="$emit('toggle-mode')"
				>
					🔍 Search
				</UButton>

				<UInput
					ref="searchInputRef"
					v-model="searchQuery"
					type="text"
					placeholder="Type to search shortcuts & notes..."
					color="neutral"
					variant="none"
					size="sm"
					class="w-full font-medium"
					@keydown.down.prevent="$emit('move-selection', 1)"
					@keydown.up.prevent="$emit('move-selection', -1)"
					@keydown.enter.prevent="$emit('execute-active')"
					@keydown.esc.prevent="$emit('close-window')"
				/>
			</div>

			<!-- Quick Task Mode Header Row -->
			<div v-else key="create-task" class="flex items-center gap-3 w-full">
				<UButton
					color="primary"
					variant="soft"
					size="xs"
					class="cursor-pointer font-semibold shrink-0 select-none whitespace-nowrap"
					title="Click or press Ctrl+Tab to switch mode"
					@click="$emit('toggle-mode')"
				>
					⚡ Quick Task
				</UButton>

				<span class="text-xs text-slate-400 font-medium truncate">
					Create a new task directly from floating window
				</span>
			</div>
		</Transition>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineProps<{
	mode: "search" | "create-task";
	animationName: "slide-up" | "slide-down";
}>();

defineEmits<{
	(e: "toggle-mode"): void;
	(e: "after-enter"): void;
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

<style scoped>
/* Slide Up Animation */
.slide-up-enter-active,
.slide-up-leave-active {
	transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from {
	transform: translateY(100%);
	opacity: 0;
}
.slide-up-leave-to {
	transform: translateY(-100%);
	opacity: 0;
}

/* Slide Down Animation */
.slide-down-enter-active,
.slide-down-leave-active {
	transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-down-enter-from {
	transform: translateY(-100%);
	opacity: 0;
}
.slide-down-leave-to {
	transform: translateY(100%);
	opacity: 0;
}
</style>
