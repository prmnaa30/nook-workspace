<template>
	<UContextMenu
		v-model:open="contextMenuOpen"
		:items="workspaceContextMenuItems"
		:ui="{
			content: 'min-w-52',
		}"
	>
		<div
			@click="emit('selectWorkspace', props.workspace)"
			class="workspace-card group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-all duration-150 text-sm"
			:class="[
				currentWorkspaceId === props.workspace.id
					? 'bg-neutral-200/60 dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50 is-active'
					: 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40 hover:text-neutral-900 dark:hover:text-neutral-200',
				contextMenuOpen || dropdownMenuOpen ? 'menu-active' : '',
			]"
		>
			<div class="flex items-center gap-2 min-w-0">
				<UIcon
					name="i-lucide-folder"
					class="size-4 shrink-0"
					:class="{
						'text-blue-500': currentWorkspaceId === props.workspace.id,
						'text-neutral-400 dark:text-neutral-500': currentWorkspaceId !== props.workspace.id,
					}"
				/>
				<span class="truncate font-medium">{{ props.workspace.name }}</span>
			</div>
			<UDropdownMenu
				v-model:open="dropdownMenuOpen"
				class="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
				:items="workspaceContextMenuItems"
				:content="{
					align: 'start',
					sideOffset: -12,
				}"
				:ui="{
					content: 'min-w-52',
				}"
			>
				<button
					type="button"
					@click.stop
					class="p-0.5 rounded hover:bg-neutral-700 transition-colors duration-300"
					title="More"
				>
					<UIcon
						name="i-lucide-ellipsis"
						class="size-3.5"
					/>
				</button>
			</UDropdownMenu>
		</div>
	</UContextMenu>
</template>

<script setup lang="ts">
import { ContextMenuItem } from "@nuxt/ui";
import type { Workspace } from "../../services/workspaces.service";
import { ref, watch, onUnmounted } from "vue";

const contextMenuOpen = ref(false);
const dropdownMenuOpen = ref(false);

watch([contextMenuOpen, dropdownMenuOpen], ([ctxOpen, dropOpen]) => {
	if (ctxOpen || dropOpen) {
		document.body.classList.add("menu-is-open");
	} else {
		document.body.classList.remove("menu-is-open");
	}
});

onUnmounted(() => {
	document.body.classList.remove("menu-is-open");
});

const emit = defineEmits<{
	(e: "selectWorkspace", ws: Workspace): void;
	(e: "toggleFavorites", ws: Workspace): void;
	(e: "triggerDeleteModal", ws: Workspace): void;
  (e: 'triggerEditModal', ws: Workspace): void;
}>();

const props = defineProps<{
	workspace: Workspace;
	currentWorkspaceId: number;
}>();

const workspaceContextMenuItems: ContextMenuItem[][] = [
	[
		{
			label: "Open",
			icon: "i-lucide-folder-open",
			onSelect: () => emit("selectWorkspace", props.workspace),
		},
		{
			type: "separator",
		},
		{
			label: "Edit Workspace",
			icon: "i-lucide-pencil",
      onSelect: () => emit('triggerEditModal', props.workspace)
		},
		{
			label: props.workspace.is_favorite ? "Remove from Favorite" : "Add to Favorite",
			icon: props.workspace.is_favorite ? "i-lucide-star-off" : "i-lucide-star",
			onSelect: () => emit("toggleFavorites", props.workspace),
		},
		{
			type: "separator",
		},
		{
			label: "Delete",
			icon: "i-lucide-trash",
			color: "error" as const,
			onSelect: () => emit("triggerDeleteModal", props.workspace),
		},
	],
];
</script>
