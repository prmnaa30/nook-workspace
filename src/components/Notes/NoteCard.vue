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
							<UIcon name="i-ph-note-bold" class="size-5 text-amber-500" />
						</div>
						<span class="font-bold text-sm text-neutral-900 dark:text-white truncate">
							{{ note.title }}
						</span>
					</div>

					<UDropdownMenu :items="menuItems" :ui="{ content: 'min-w-36' }">
						<UButton
							color="neutral"
							variant="ghost"
							size="xs"
							icon="i-ph-dots-three-vertical"
							class="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
							@click.stop
						/>
					</UDropdownMenu>
				</div>

				<p class="text-xs font-mono text-neutral-500 dark:text-neutral-400 truncate mt-1">
					{{ note.filename }}
				</p>
			</div>

			<div class="flex items-center justify-between mt-4 pt-2 border-t border-neutral-100 dark:border-neutral-900 text-xs text-neutral-400">
				<span class="font-mono text-[11px] truncate max-w-[150px]">{{ note.filename }}</span>
				<div class="flex items-center gap-1 text-amber-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
					<span>Open Editor</span>
					<UIcon name="i-ph-arrow-right-bold" class="size-3.5" />
				</div>
			</div>
		</div>
	</UContextMenu>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Note } from "../../services/notes.service";

defineProps<{
	note: Note;
}>();

const emit = defineEmits<{
	(e: "open"): void;
	(e: "edit"): void;
	(e: "delete"): void;
}>();

const menuItems = computed<DropdownMenuItem[][]>(() => [
	[
		{
			label: "Open Note",
			icon: "i-ph-book-open-bold",
			onSelect: () => emit("open"),
		},
		{
			label: "Rename Note",
			icon: "i-ph-pencil",
			onSelect: () => emit("edit"),
		},
		{
			type: "separator" as const,
		},
		{
			label: "Delete Note",
			icon: "i-ph-trash",
			color: "error" as const,
			onSelect: () => emit("delete"),
		},
	],
]);
</script>
