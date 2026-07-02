<template>
	<div class="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-4">
		<div class="absolute top-0 right-0 p-1 flex gap-1">
			<SearchSortBar
				v-model:search="searchQuery"
				v-model:sort-key="sortKey"
				v-model:sort-order="sortOrder"
				:sort-options="sortOptions"
			/>

			<UButton
				title="Add Shortcut"
				trailing-icon="i-lucide-plus"
				variant="ghost"
				@click="triggerAddShortcutModal"
			/>
		</div>

		<!-- Empty State -->
		<div
			v-if="filteredAndSortedShortcuts.length === 0"
			class="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-700/50 rounded-2xl bg-slate-800/10 min-h-[200px]"
		>
			<p class="text-slate-500">
				{{ searchQuery ? "No shortcuts found." : "No shortcuts configured yet." }}
			</p>
		</div>

		<!-- Shortcuts Grid -->
		<div
			v-else
			class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
		>
			<ShortcutCard
				v-for="sc in filteredAndSortedShortcuts"
				:key="sc.id"
				:shortcut="sc"
				@click="executeShortcutAction"
				@edit="triggerEditModal"
				@delete="triggerDeleteModal"
			/>
		</div>

		<DeleteModal
			ref="deleteModalRef"
			delete-type="Shortcut"
			:target="shortcutToDelete?.title || ''"
			@confirm="handleConfirmDelete"
		/>

		<ShortcutFormModal
			ref="shortcutFormModalRef"
			:workspace="workspace!"
			:initial-value="shortcutToEdit!"
		/>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from "vue";
import type { Workspace } from "../../services/workspaces.service";
import { Shortcut } from "../../services/shortcuts.service";
import { invoke } from "@tauri-apps/api/core";
import { useShortcutStore } from "../../stores/shortcuts";
import { storeToRefs } from "pinia";
import ShortcutCard from "./ShortcutCard.vue";
import ShortcutFormModal from "./ShortcutFormModal.vue";
import DeleteModal from "../DeleteModal.vue";
import SearchSortBar from "../SearchSortBar.vue";

const props = defineProps<{
	workspace: Workspace | null;
}>();

const store = useShortcutStore();
const { shortcuts } = storeToRefs(store);
const deleteModalRef = ref<any>(null);
const shortcutToDelete = ref<Shortcut | null>(null);

const shortcutFormModalRef = ref<any>(null);
const shortcutToEdit = ref<Shortcut | null>(null);

const searchQuery = ref("");
const sortKey = ref("title");
const sortOrder = ref<"asc" | "desc">("asc");

const sortOptions = [
	{ label: "Name", value: "title" },
	{ label: "Type", value: "type" },
	{ label: "Date Created", value: "created_at" },
	{ label: "Date Modified", value: "updated_at" },
];

const filteredAndSortedShortcuts = computed(() => {
	if (!shortcuts.value) return [];

	let result = [...shortcuts.value];

	// Searching
	if (searchQuery.value) {
		const query = searchQuery.value.toLowerCase();
		result = result.filter(
			(shorcut) =>
				shorcut.title.toLowerCase().includes(query) ||
				(shorcut.path && shorcut.path.toLowerCase().includes(query)),
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

watch(
	() => props.workspace,
	async (newWs) => {
		if (newWs) {
			await store.getShortcuts(newWs.id);
		} else {
			shortcuts.value = [];
		}
	},
	{ immediate: true },
);

watch(
	() => props.workspace?.id,
	(newWorkspaceId) => {
		if (!newWorkspaceId) return;

		const savedSortKey = localStorage.getItem(`ws_${newWorkspaceId}_shortcuts_sortKey`);
		if (savedSortKey) {
			sortKey.value = savedSortKey;
		} else {
			sortKey.value = "title";
		}

		const savedSortOrder = localStorage.getItem(`ws_${newWorkspaceId}_shortcuts_sortOrder`);
		if (savedSortOrder === "asc" || savedSortOrder === "desc") {
			sortOrder.value = savedSortOrder;
		} else {
			sortOrder.value = "asc";
		}
	},
	{ immediate: true },
);

watch(sortKey, (newVal) => {
	if (props.workspace?.id) {
		localStorage.setItem(`ws_${props.workspace.id}_shortcuts_sortKey`, newVal);
	}
});

watch(sortOrder, (newVal) => {
	if (props.workspace?.id) {
		localStorage.setItem(`ws_${props.workspace.id}_shortcuts_sortOrder`, newVal);
	}
});

async function handleConfirmDelete() {
	if (shortcutToDelete.value) {
		await store.deleteShortcut(shortcutToDelete.value.id);
		shortcutToDelete.value = null;
	}
}

function triggerDeleteModal(sc: Shortcut) {
	shortcutToDelete.value = sc;
	deleteModalRef.value?.openModal();
}

function triggerAddShortcutModal() {
	shortcutToEdit.value = null;
	nextTick(() => {
		shortcutFormModalRef.value?.openModal();
	});
}

function triggerEditModal(sc: Shortcut) {
	shortcutToEdit.value = sc;
	nextTick(() => {
		shortcutFormModalRef.value?.openModal();
	});
}

async function executeShortcutAction(shortcut: Shortcut) {
	try {
		await invoke("execute_shortcut", {
			path: shortcut.path,
			shortcutType: shortcut.type,
			browser: shortcut.browser_path || null,
		});
	} catch (error) {
		alert(`Oops! Failed to execute shortcut:\n${error}`);
	}
}
</script>
