<template>
	<UContextMenu
		v-model:open="contextMenuOpen"
		:items="noteContextMenuItems"
		:ui="{
			content: 'min-w-52',
		}"
	>
		<div
			@click="emit('click', props.note)"
			class="workspace-card note-card group bg-slate-900/80 hover:bg-slate-800/40 border border-slate-800/80 hover:border-slate-700/40 rounded-xl overflow-hidden flex flex-col z-10 cursor-pointer transition-all shadow-md hover:shadow-lg duration-200"
			:class="[
				contextMenuOpen ? 'menu-active bg-slate-900 border-slate-700' : ''
			]"
		>
			<div
				class="h-14 w-full relative transition-all duration-200 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-b border-indigo-500/10"
			>
				<button
					@click.stop="emit('delete', props.note)"
					class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-slate-950/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-md transition-all border border-slate-800/60"
					title="Delete Note"
				>
					<UIcon name="i-lucide-trash" size="14" />
				</button>

				<button
					@click.stop="emit('edit', props.note)"
					class="absolute top-2 right-10 opacity-0 group-hover:opacity-100 p-1 bg-slate-950/80 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-md transition-all border border-slate-800/60"
					title="Rename Note"
				>
					<UIcon name="i-lucide-pencil" size="14" />
				</button>
			</div>

			<div
				class="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-center -mt-4 ml-4 relative z-10 shadow-md"
			>
				<span class="text-lg">📄</span>
			</div>

			<div class="p-4 pt-2.5 flex flex-col gap-2">
				<h4
					class="font-semibold text-slate-200 text-sm tracking-wide truncate"
					:title="props.note.title"
				>
					{{ props.note.title }}
				</h4>
				<div
					class="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-1 bg-slate-950/40 p-2 rounded border border-slate-800/40 truncate w-full"
					:title="props.note.filename"
				>
					<span class="truncate">{{ props.note.filename }}</span>
				</div>
			</div>
		</div>
	</UContextMenu>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";
import type { ContextMenuItem } from "@nuxt/ui";
import type { Note } from "../../services/notes.service";

const props = defineProps<{
	note: Note;
}>();

const emit = defineEmits<{
	(e: "click", note: Note): void;
	(e: "edit", note: Note): void;
	(e: "delete", note: Note): void;
}>();

const contextMenuOpen = ref(false);

watch(contextMenuOpen, (isOpen) => {
	if (isOpen) {
		document.body.classList.add("menu-is-open");
	} else {
		document.body.classList.remove("menu-is-open");
	}
});

onUnmounted(() => {
	document.body.classList.remove("menu-is-open");
});

const noteContextMenuItems: ContextMenuItem[][] = [
	[
		{
			label: "Open",
			icon: "i-lucide-folder-open",
			onSelect: () => emit("click", props.note),
		},
		{
			label: "Rename Note",
			icon: "i-lucide-pencil",
			onSelect: () => emit("edit", props.note),
		},
		{
			type: "separator",
		},
		{
			label: "Delete Note",
			icon: "i-lucide-trash",
			color: "error" as const,
			onSelect: () => emit("delete", props.note),
		},
	],
];
</script>
