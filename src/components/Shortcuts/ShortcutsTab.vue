<template>
	<div class="flex flex-col h-full overflow-hidden">
		<!-- Sub-Header Bar -->
		<WorkspaceSubHeader
			title="Shortcuts"
			:item-count="filteredShortcuts.length"
			item-unit="shortcuts"
			search-placeholder="Search shortcuts..."
			v-model:search="searchQuery"
			v-model:sort-key="sortKey"
			v-model:sort-order="sortOrder"
			:sort-options="sortOptions"
			action-label="Add Shortcut"
			action-icon="i-lucide-plus"
			@action="openFormModal()"
		/>

		<!-- Content Grid -->
		<div class="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
			<div
				v-if="filteredShortcuts.length === 0"
				class="h-48 flex flex-col items-center justify-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl text-neutral-400 dark:text-neutral-500"
			>
				<UIcon name="i-lucide-link" class="size-8 mb-2 opacity-50" />
				<p class="text-sm">No shortcuts added yet.</p>
			</div>

			<div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				<ShortcutCard
					v-for="shortcut in filteredShortcuts"
					:key="shortcut.id"
					:shortcut="shortcut"
					@edit="openFormModal(shortcut)"
					@move="triggerMoveShortcut(shortcut)"
					@delete="triggerDeleteShortcut(shortcut)"
					@toggle-pin="handleTogglePin(shortcut)"
				/>
			</div>
		</div>

		<!-- Add/Edit Shortcut Modal -->
		<ShortcutFormModal
			ref="formModalRef"
			:workspace-id="workspaceId"
			@saved="refreshShortcuts"
		/>

		<!-- Move Shortcut Modal -->
		<MoveModal
			ref="moveModalRef"
			item-type="Shortcut"
			@confirm="handleConfirmMove"
		/>

		<!-- Delete Shortcut Modal -->
		<DeleteModal
			ref="deleteModalRef"
			delete-type="Shortcut"
			:target="shortcutToDelete?.title || ''"
			@confirm="handleConfirmDelete"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useStorage } from "@vueuse/core";
import type { Shortcut } from "../../services/shortcuts.service";
import { useShortcutStore } from "../../stores/shortcuts";
import WorkspaceSubHeader from "../workspace/WorkspaceSubHeader.vue";
import ShortcutCard from "./ShortcutCard.vue";
import ShortcutFormModal from "./ShortcutFormModal.vue";
import DeleteModal from "../common/DeleteModal.vue";
import MoveModal from "../common/MoveModal.vue";

const props = defineProps<{
	workspaceId: number;
}>();

const shortcutStore = useShortcutStore();

const searchQuery = ref("");
const sortKey = useStorage("nook_shortcuts_sort_key", "title");
const sortOrder = useStorage<"asc" | "desc">("nook_shortcuts_sort_order", "asc");

const sortOptions = [
	{ label: "Title", value: "title" },
	{ label: "Type", value: "type" },
	{ label: "Date Added", value: "created_at" },
];

const workspaceShortcuts = computed(() => shortcutStore.shortcuts);

const filteredShortcuts = computed(() => {
	let result = [...workspaceShortcuts.value];

	if (searchQuery.value) {
		const query = searchQuery.value.toLowerCase();
		result = result.filter(
			(sc) =>
				sc.title.toLowerCase().includes(query) ||
				sc.path.toLowerCase().includes(query)
		);
	}

	result.sort((a: any, b: any) => {
		let valA = a[sortKey.value] || "";
		let valB = b[sortKey.value] || "";

		if (typeof valA === "string" && typeof valB === "string") {
			valA = valA.toLowerCase();
			valB = valB.toLowerCase();
		}

		if (valA < valB) return sortOrder.value === "asc" ? -1 : 1;
		if (valA > valB) return sortOrder.value === "asc" ? 1 : -1;
		return 0;
	});

	return result;
});

onMounted(() => {
	shortcutStore.getShortcuts(props.workspaceId);
});

watch(() => props.workspaceId, (newId) => {
	if (newId) {
		shortcutStore.getShortcuts(newId);
	}
});

function refreshShortcuts() {
	shortcutStore.getShortcuts(props.workspaceId);
}

const formModalRef = ref<any>(null);
const moveModalRef = ref<any>(null);
const deleteModalRef = ref<any>(null);
const shortcutToMove = ref<Shortcut | null>(null);
const shortcutToDelete = ref<Shortcut | null>(null);

function openFormModal(shortcut?: Shortcut) {
	formModalRef.value?.openModal(shortcut);
}

async function handleTogglePin(shortcut: Shortcut) {
	await shortcutStore.toggleShortcutPin(shortcut.id, !shortcut.is_pinned);
}

function triggerMoveShortcut(shortcut: Shortcut) {
	shortcutToMove.value = shortcut;
	moveModalRef.value?.openModal(shortcut.title, props.workspaceId);
}

async function handleConfirmMove(targetWorkspaceId: number) {
	if (shortcutToMove.value) {
		await shortcutStore.moveShortcut(shortcutToMove.value.id, targetWorkspaceId);
		shortcutToMove.value = null;
	}
}

function triggerDeleteShortcut(shortcut: Shortcut) {
	shortcutToDelete.value = shortcut;
	deleteModalRef.value?.openModal();
}

async function handleConfirmDelete() {
	if (shortcutToDelete.value) {
		await shortcutStore.deleteShortcut(shortcutToDelete.value.id);
		shortcutToDelete.value = null;
	}
}
</script>
