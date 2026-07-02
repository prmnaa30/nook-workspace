<template>
	<UContextMenu
		v-model:open="contextMenuOpen"
		:items="shortcutContextMenuItems"
		:ui="{
			content: 'min-w-52',
		}"
	>
		<div
			@click="emit('click', props.shortcut)"
			class="workspace-card shortcut-card group bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl overflow-hidden flex flex-col z-10 cursor-pointer transition-all shadow-md hover:shadow-lg duration-200"
			:class="[contextMenuOpen ? 'menu-active bg-slate-900 border-slate-700' : '']"
		>
			<div
				class="h-14 w-full relative transition-all duration-200"
				:class="{
					'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-b border-blue-500/10':
						props.shortcut.type === 'web',
					'bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border-b border-emerald-500/10':
						props.shortcut.type === 'folder',
					'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-b border-amber-500/10':
						props.shortcut.type === 'file',
				}"
			>
				<button
					@click.stop="emit('delete', props.shortcut)"
					class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-slate-950/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-md transition-all border border-slate-800/60"
					title="Delete Shortcut"
				>
					<UIcon
						name="i-lucide-trash"
						size="14"
					/>
				</button>

				<button
					@click.stop="emit('edit', props.shortcut)"
					class="absolute top-2 right-10 opacity-0 group-hover:opacity-100 p-1 bg-slate-950/80 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-md transition-all border border-slate-800/60"
					title="Edit Shortcut"
				>
					<UIcon
						name="i-lucide-pencil"
						size="14"
					/>
				</button>
			</div>

			<div
				class="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-center -mt-4 ml-4 relative z-10 shadow-md"
			>
				<span
					v-if="props.shortcut.type === 'web'"
					class="text-lg"
					>🌐</span
				>
				<span
					v-else-if="props.shortcut.type === 'folder'"
					class="text-lg"
					>📁</span
				>
				<span
					v-else
					class="text-lg"
					>📄</span
				>
			</div>

			<div class="p-4 pt-2.5 flex flex-col gap-2">
				<div class="flex flex-col gap-1">
					<h4
						class="font-semibold text-slate-200 text-sm tracking-wide truncate"
						:title="props.shortcut.title"
					>
						{{ props.shortcut.title }}
					</h4>
				</div>

				<div
					class="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-1 bg-slate-950/40 p-2 rounded border border-slate-800/40 truncate w-full"
					:title="props.shortcut.path"
				>
					<svg
						class="w-3 h-3 text-slate-500 flex-shrink-0"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
						/>
					</svg>
					<span class="truncate">{{ props.shortcut.path }}</span>
				</div>
			</div>
		</div>
	</UContextMenu>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";
import type { ContextMenuItem } from "@nuxt/ui";
import type { Shortcut } from "../../services/shortcuts.service";

const props = defineProps<{
	shortcut: Shortcut;
}>();

const emit = defineEmits<{
	(e: "click", shortcut: Shortcut): void;
	(e: "edit", shortcut: Shortcut): void;
	(e: "delete", shortcut: Shortcut): void;
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

const shortcutContextMenuItems: ContextMenuItem[][] = [
	[
		{
			label:
				props.shortcut.type === "web"
					? "Open URL"
					: props.shortcut.type === "folder"
						? "Open Folder"
						: "Open File",
			icon: "i-lucide-external-link",
			onSelect: () => emit("click", props.shortcut),
		},
		{
			label: "Edit Shortcut",
			icon: "i-lucide-pencil",
			onSelect: () => emit("edit", props.shortcut),
		},
		{
			type: "separator",
		},
		{
			label: "Delete Shortcut",
			icon: "i-lucide-trash",
			color: "error" as const,
			onSelect: () => emit("delete", props.shortcut),
		},
	],
];
</script>
