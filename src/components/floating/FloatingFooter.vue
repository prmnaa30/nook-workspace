<template>
	<div class="px-4 py-2 border-t border-slate-800 flex justify-end items-center gap-4 text-xs shrink-0 bg-slate-950 select-none">
		<div class="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity" @click="$emit('toggle-mode')">
			<UKbd size="md" variant="soft" class="px-1.5 py-0.5 text-slate-400 font-mono">Ctrl</UKbd>
			<UKbd size="md" variant="soft" class="px-1.5 py-0.5 text-slate-400 font-mono">Tab</UKbd>
			<span class="ml-0.5 text-slate-400">Switch Mode</span>
		</div>
		<span class="text-slate-800">|</span>
		<div class="flex items-center gap-1.5">
			<UKbd size="md" variant="soft" class="px-1.5 py-0.5 text-slate-400 font-mono">Ctrl</UKbd>
			<UKbd size="md" variant="soft" class="px-1.5 py-0.5 text-slate-400 font-mono">W</UKbd>
			<span class="ml-0.5 text-slate-400">Open Main Window</span>
		</div>
		<span class="text-slate-800">|</span>
		<div class="flex items-center gap-1.5">
			<UKbd size="md" variant="soft" class="px-1.5 py-0.5 text-slate-400 font-mono">Enter</UKbd>
			<span class="ml-0.5 text-slate-400">{{ mode === 'search' ? 'Run / Select' : 'Save Task' }}</span>
		</div>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	mode: "search" | "create-task";
}>();

defineEmits<{
	(e: "toggle-mode"): void;
}>();
</script>
