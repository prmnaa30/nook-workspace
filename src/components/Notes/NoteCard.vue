<template>
	<UContextMenu :items="menuItems" :ui="{ content: 'min-w-36' }">
		<div
			class="group relative flex flex-col justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer shadow-xs min-h-[140px]"
			@click="$emit('open')"
		>
			<div>
				<div class="flex items-start justify-between gap-3 mb-2">
					<div class="flex items-center gap-2.5 truncate">
						<div class="p-2 rounded-lg bg-amber-500/10 shrink-0">
							<UIcon name="i-lucide-file-text" class="size-5 text-amber-500" />
						</div>
						<span class="font-bold text-sm text-neutral-900 dark:text-white truncate">
							{{ note.title }}
						</span>
					</div>

					<div class="flex items-center gap-1 shrink-0">
						<UButton
							color="neutral"
							variant="ghost"
							size="xs"
							:icon="note.is_pinned ? 'i-lucide-pin' : 'i-lucide-pin-off'"
							:class="note.is_pinned ? 'text-amber-500 opacity-100' : 'opacity-0 group-hover:opacity-100 text-neutral-400'"
							class="transition-opacity cursor-pointer"
							:title="note.is_pinned ? 'Unpin from Quick Access' : 'Pin to Quick Access'"
							@click.stop="$emit('toggle-pin')"
						/>

						<UDropdownMenu :items="menuItems" :ui="{ content: 'min-w-36' }">
							<UButton
								color="neutral"
								variant="ghost"
								size="xs"
								icon="i-lucide-more-vertical"
								class="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
								@click.stop
							/>
						</UDropdownMenu>
					</div>
				</div>

				<p class="text-xs font-mono text-neutral-500 dark:text-neutral-400 truncate mt-1">
					{{ note.filename }}
				</p>
			</div>

			<div class="flex items-center justify-between mt-4 pt-2 border-t border-neutral-100 dark:border-neutral-900 text-xs text-neutral-400">
				<span class="font-mono text-[11px] truncate max-w-[150px]">{{ note.filename }}</span>
				<div class="flex items-center gap-1 text-amber-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
					<span>Open Editor</span>
					<UIcon name="i-lucide-arrow-right" class="size-3.5" />
				</div>
			</div>
		</div>
	</UContextMenu>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Note } from "../../services/notes.service";

const props = defineProps<{
	note: Note;
}>();

const emit = defineEmits<{
	(e: "open"): void;
	(e: "edit"): void;
	(e: "move"): void;
	(e: "delete"): void;
	(e: "toggle-pin"): void;
}>();

const menuItems = computed<DropdownMenuItem[][]>(() => [
	[
		{
			label: "Open Note",
			icon: "i-lucide-book-open",
			onSelect: () => emit("open"),
		},
		{
			label: props.note.is_pinned ? "Unpin from Quick Access" : "Pin to Quick Access",
			icon: props.note.is_pinned ? "i-lucide-pin-off" : "i-lucide-pin",
			onSelect: () => emit("toggle-pin"),
		},
		{
			label: "Rename Note",
			icon: "i-lucide-pencil",
			onSelect: () => emit("edit"),
		},
		{
			label: "Move to Workspace...",
			icon: "i-lucide-folder-output",
			onSelect: () => emit("move"),
		},
		{
			type: "separator" as const,
		},
		{
			label: "Delete Note",
			icon: "i-lucide-trash-2",
			color: "error" as const,
			onSelect: () => emit("delete"),
		},
	],
]);
</script>
