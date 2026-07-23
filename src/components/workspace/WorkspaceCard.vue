<template>
	<UContextMenu :items="menuItems" :ui="{ content: 'min-w-44' }">
		<div
			class="group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all border"
			:class="
				isSelected
					? 'bg-blue-600/10 border-blue-500/40 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
					: 'border-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900/60 hover:text-neutral-900 dark:hover:text-neutral-200'
			"
			@click="$emit('select')"
		>
			<div class="flex items-center gap-2.5 truncate">
				<UIcon
					name="i-ph-folder-bold"
					class="size-4 shrink-0"
					:class="isSelected ? 'text-blue-500' : 'text-neutral-400 dark:text-neutral-500'"
				/>
				<span class="text-sm truncate">{{ workspace.name }}</span>
			</div>

			<div class="flex items-center gap-1">
				<UButton
					color="neutral"
					variant="ghost"
					size="xs"
					:icon="workspace.is_favorite ? 'i-ph-star-fill' : 'i-ph-star'"
					class="shrink-0 cursor-pointer"
					:class="workspace.is_favorite ? 'text-amber-400 hover:text-amber-500' : 'text-neutral-500 opacity-0 group-hover:opacity-100'"
					:title="workspace.is_favorite ? 'Remove Favorite' : 'Mark as Favorite'"
					@click.stop="$emit('toggle-favorite')"
				/>

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
		</div>
	</UContextMenu>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Workspace } from "../../services/workspaces.service";

const props = defineProps<{
	workspace: Workspace;
	isSelected: boolean;
}>();

const emit = defineEmits<{
	(e: "select"): void;
	(e: "toggle-favorite"): void;
	(e: "edit"): void;
	(e: "delete"): void;
}>();

const menuItems = computed<DropdownMenuItem[][]>(() => [
	[
		{
			label: "Select Workspace",
			icon: "i-ph-folder-open-bold",
			onSelect: () => emit("select"),
		},
		{
			label: props.workspace.is_favorite ? "Unmark Favorite" : "Mark Favorite",
			icon: props.workspace.is_favorite ? "i-ph-star" : "i-ph-star-fill",
			onSelect: () => emit("toggle-favorite"),
		},
		{
			label: "Edit Workspace",
			icon: "i-ph-pencil",
			onSelect: () => emit("edit"),
		},
		{
			type: "separator" as const,
		},
		{
			label: "Delete Workspace",
			icon: "i-ph-trash",
			color: "error" as const,
			onSelect: () => emit("delete"),
		},
	],
]);
</script>
