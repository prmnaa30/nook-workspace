<template>
	<UContextMenu :items="menuItems" :ui="{ content: 'min-w-36' }">
		<div
			class="group relative flex flex-col justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer shadow-xs min-h-[120px]"
			@click="execute"
		>
			<div>
				<div class="flex items-start justify-between gap-3 mb-2">
					<div class="flex items-center gap-2.5 truncate">
						<div
							class="p-2 rounded-lg shrink-0"
							:class="typeStyle.badgeBg"
						>
							<UIcon :name="typeStyle.icon" class="size-5" :class="typeStyle.iconColor" />
						</div>
						<span class="font-bold text-sm text-neutral-900 dark:text-white truncate">
							{{ shortcut.title }}
						</span>
					</div>

					<div class="flex items-center gap-1 shrink-0">
						<UButton
							color="neutral"
							variant="ghost"
							size="xs"
							:icon="shortcut.is_pinned ? 'i-lucide-pin' : 'i-lucide-pin-off'"
							:class="shortcut.is_pinned ? 'text-amber-500 opacity-100' : 'opacity-0 group-hover:opacity-100 text-neutral-400'"
							class="transition-opacity cursor-pointer"
							:title="shortcut.is_pinned ? 'Unpin from Quick Access' : 'Pin to Quick Access'"
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
					{{ shortcut.path }}
				</p>
			</div>

			<div class="flex items-center justify-between mt-4 pt-2 border-t border-neutral-100 dark:border-neutral-900 text-xs text-neutral-400">
				<span class="capitalize">{{ shortcut.type }}</span>
				<div class="flex items-center gap-1 text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
					<span>Run</span>
					<UIcon name="i-lucide-arrow-up-right" class="size-3.5" />
				</div>
			</div>
		</div>
	</UContextMenu>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Shortcut } from "../../services/shortcuts.service";
import { invoke } from "@tauri-apps/api/core";

const props = defineProps<{
	shortcut: Shortcut;
}>();

const emit = defineEmits<{
	(e: "edit"): void;
	(e: "move"): void;
	(e: "delete"): void;
	(e: "toggle-pin"): void;
}>();

const typeStyle = computed(() => {
	switch (props.shortcut.type) {
		case "web":
			return {
				icon: "i-lucide-globe",
				iconColor: "text-blue-500",
				badgeBg: "bg-blue-500/10",
			};
		case "folder":
			return {
				icon: "i-lucide-folder",
				iconColor: "text-amber-500",
				badgeBg: "bg-amber-500/10",
			};
		default:
			return {
				icon: "i-lucide-file",
				iconColor: "text-indigo-500",
				badgeBg: "bg-indigo-500/10",
			};
	}
});

async function execute() {
	try {
		await invoke("execute_shortcut", {
			path: props.shortcut.path,
			shortcutType: props.shortcut.type,
			browser: props.shortcut.browser_path || null,
		});
	} catch (error) {
		console.error("Failed to execute shortcut:", error);
	}
}

const menuItems = computed<DropdownMenuItem[][]>(() => [
	[
		{
			label: "Run Shortcut",
			icon: "i-lucide-play",
			onSelect: () => execute(),
		},
		{
			label: props.shortcut.is_pinned ? "Unpin from Quick Access" : "Pin to Quick Access",
			icon: props.shortcut.is_pinned ? "i-lucide-pin-off" : "i-lucide-pin",
			onSelect: () => emit("toggle-pin"),
		},
		{
			label: "Edit Shortcut",
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
			label: "Delete Shortcut",
			icon: "i-lucide-trash-2",
			color: "error" as const,
			onSelect: () => emit("delete"),
		},
	],
]);
</script>
