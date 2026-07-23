<template>
	<div class="flex flex-col h-full overflow-hidden p-6">
		<div v-if="currentWorkspace" class="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
			<div class="flex items-center gap-3">
				<div class="p-2.5 rounded-xl bg-blue-600/10 text-blue-500 border border-blue-500/20">
					<UIcon name="i-ph-folder-open-bold" class="size-6" />
				</div>
				<div>
					<h1 class="text-xl font-bold text-neutral-900 dark:text-white">
						{{ currentWorkspace.name }}
					</h1>
					<p v-if="currentWorkspace.description" class="text-xs text-neutral-500 dark:text-neutral-400">
						{{ currentWorkspace.description }}
					</p>
				</div>
			</div>

			<UTabs
				v-model="activeTab"
				:items="tabItems"
				variant="pill"
				size="sm"
				class="shrink-0"
			/>
		</div>

		<div class="flex-1 min-h-0 overflow-hidden">
			<div v-if="activeTab === '0'" class="h-full">
				<TaskBoard :workspace-id="workspaceId" />
			</div>

			<div v-else-if="activeTab === '1'" class="h-full">
				<WorkspaceTimeline :workspace-id="workspaceId" />
			</div>

			<div v-else-if="activeTab === '2'" class="h-full">
				<ShortcutsTab :workspace-id="workspaceId" />
			</div>

			<div v-else-if="activeTab === '3'" class="h-full">
				<NotesTab ref="notesTabRef" :workspace-id="workspaceId" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { TabsItem } from "@nuxt/ui";
import { useWorkspaceStore } from "../../stores/workspaces";
import TaskBoard from "../tasks/TaskBoard.vue";
import WorkspaceTimeline from "../timeline/WorkspaceTimeline.vue";
import ShortcutsTab from "../shortcuts/ShortcutsTab.vue";
import NotesTab from "../notes/NotesTab.vue";

const props = defineProps<{
	workspaceId: number;
}>();

const workspaceStore = useWorkspaceStore();

const activeTab = ref("0");
const notesTabRef = ref<any>(null);

const currentWorkspace = computed(() => {
	return workspaceStore.workspaces.find((w) => w.id === props.workspaceId);
});

const tabItems: TabsItem[] = [
	{ label: "Tasks", icon: "i-ph-clipboard-text-bold", slot: "tasks" },
	{ label: "Timeline", icon: "i-ph-clock-afternoon-bold", slot: "timeline" },
	{ label: "Shortcuts", icon: "i-ph-link-bold", slot: "shortcuts" },
	{ label: "Notes", icon: "i-ph-note-pencil-bold", slot: "notes" },
];

watch(
	() => props.workspaceId,
	() => {
		activeTab.value = "0";
	}
);

defineExpose({
	switchToNotesTabAndOpen: (noteId: number) => {
		activeTab.value = "3";
		setTimeout(() => {
			notesTabRef.value?.openNoteById(noteId);
		}, 100);
	},
});
</script>
