<template>
	<div class="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden shadow-2xl">
		<!-- Top Bar: Animated Mode Indicator + Search Input -->
		<FloatingHeader
			ref="headerRef"
			v-model:search-query="searchQuery"
			:mode="mode"
			:animation-name="modeAnimationName"
			@toggle-mode="toggleMode"
			@after-enter="focusActiveInput"
			@move-selection="moveSelection"
			@execute-active="executeActiveItem"
			@close-window="closeWindow"
		/>

		<!-- Search Mode Body -->
		<FloatingSearchResults
			v-if="mode === 'search'"
			:items="filteredItems"
			:active-index="activeIndex"
			:search-query="searchQuery"
			@select-item="executeItem"
		/>

		<!-- Quick Task Create Mode Body -->
		<FloatingTaskForm
			v-else-if="mode === 'create-task'"
			ref="taskFormRef"
			v-model:target-workspace-id="targetWorkspaceId"
			v-model:task-title="taskTitle"
			v-model:task-description="taskDescription"
			v-model:task-due-date="taskDueDate"
			:workspace-options="workspaceOptions"
			@submit="submitQuickTask"
			@close-window="closeWindow"
		/>

		<!-- Footer Shortcuts Bar -->
		<FloatingFooter
			:mode="mode"
			@toggle-mode="toggleMode"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from "vue";
import { useShortcutStore } from "../../stores/shortcuts";
import { useNoteStore } from "../../stores/notes";
import { useWorkspaceStore } from "../../stores/workspaces";
import { useTaskStore } from "../../stores/tasks";
import { storeToRefs } from "pinia";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { emitTo } from "@tauri-apps/api/event";

import FloatingHeader from "./FloatingHeader.vue";
import FloatingSearchResults from "./FloatingSearchResults.vue";
import FloatingTaskForm from "./FloatingTaskForm.vue";
import FloatingFooter from "./FloatingFooter.vue";

const mode = ref<"search" | "create-task">("search");
const modeAnimationName = ref<"slide-up" | "slide-down">("slide-up");

const shortcutStore = useShortcutStore();
const noteStore = useNoteStore();
const workspaceStore = useWorkspaceStore();
const taskStore = useTaskStore();

const { allShortcuts } = storeToRefs(shortcutStore);
const { allNotes } = storeToRefs(noteStore);

const searchQuery = ref("");
const activeIndex = ref(0);

const headerRef = ref<any>(null);
const taskFormRef = ref<any>(null);

// Form fields for quick task
const targetWorkspaceId = ref<number | undefined>(undefined);
const taskTitle = ref("");
const taskDescription = ref("");
const taskDueDate = ref("");

const workspaceOptions = computed(() => {
	return workspaceStore.workspaces.map((w) => ({
		label: w.name,
		value: w.id,
	}));
});

async function adjustWindowSize(targetMode: "search" | "create-task") {
	const targetHeight = targetMode === "create-task" ? 540 : 420;
	try {
		await invoke("resize_floating_window", { width: 650.0, height: targetHeight * 1.0 });
	} catch (e) {
		console.warn("Could not adjust window size via Rust invoke:", e);
	}
	try {
		const appWindow = getCurrentWindow();
		await appWindow.setSize(new LogicalSize(650, targetHeight));
	} catch (e) {
		console.warn("Could not adjust window size via Frontend API:", e);
	}
}

function doFocus() {
	if (mode.value === "search") {
		headerRef.value?.focusSearchInput();
	} else {
		taskFormRef.value?.focusTitleInput();
	}
}

function focusActiveInput() {
	doFocus();
	nextTick(() => {
		doFocus();
		setTimeout(doFocus, 50);
		setTimeout(doFocus, 150);
	});
}

function toggleMode() {
	if (mode.value === "search") {
		modeAnimationName.value = "slide-up";
		mode.value = "create-task";
	} else {
		modeAnimationName.value = "slide-down";
		mode.value = "search";
	}

	adjustWindowSize(mode.value);
	focusActiveInput();
}

const filteredItems = computed(() => {
	const query = searchQuery.value.toLowerCase().trim();

	const scItems = (allShortcuts.value || []).map((sc) => ({
		...sc,
		searchType: "shortcut" as const,
	}));

	const noteItems = (allNotes.value || []).map((note) => ({
		...note,
		searchType: "note" as const,
	}));

	let combined: any[] = [...scItems, ...noteItems];

	if (query) {
		return combined.filter(
			(item) =>
				item.title.toLowerCase().includes(query) ||
				(item.workspace_name && item.workspace_name.toLowerCase().includes(query)) ||
				(item.searchType === "shortcut" && item.path.toLowerCase().includes(query)) ||
				(item.searchType === "note" && item.filename.toLowerCase().includes(query))
		);
	}

	return combined;
});

watch(searchQuery, () => {
	activeIndex.value = 0;
});

watch(mode, (newMode) => {
	if (newMode === "create-task") {
		syncDefaultWorkspace();
	}
	adjustWindowSize(newMode);
	focusActiveInput();
});

function syncDefaultWorkspace() {
	if (workspaceStore.workspaces.length > 0) {
		if (workspaceStore.lastWorkspaceId && workspaceStore.workspaces.some((w) => w.id === workspaceStore.lastWorkspaceId)) {
			targetWorkspaceId.value = workspaceStore.lastWorkspaceId;
		} else {
			targetWorkspaceId.value = workspaceStore.workspaces[0].id;
		}
	}
}

onMounted(async () => {
	await Promise.all([
		shortcutStore.getAllShortcuts(),
		noteStore.getAllNotes(),
		workspaceStore.getWorkspaces(),
	]);
	syncDefaultWorkspace();
	adjustWindowSize(mode.value);
	focusActiveInput();
});

onMounted(async () => {
	try {
		const currentWindow = getCurrentWindow();

		currentWindow.listen("tauri://focus", () => {
			shortcutStore.getAllShortcuts();
			noteStore.getAllNotes();
			workspaceStore.getWorkspaces();
			syncDefaultWorkspace();
			searchQuery.value = "";
			taskTitle.value = "";
			taskDescription.value = "";
			taskDueDate.value = "";
			mode.value = "search";
			activeIndex.value = 0;
			adjustWindowSize("search");
			focusActiveInput();
		});
	} catch (e) {
		console.error("Failed to monitor window focus event:", e);
	}
});

function moveSelection(direction: number) {
	const count = filteredItems.value.length;
	if (count === 0) return;
	activeIndex.value = (activeIndex.value + direction + count) % count;
}

async function executeActiveItem() {
	const active = filteredItems.value[activeIndex.value];
	if (active) {
		await executeItem(active);
	}
}

async function executeItem(item: any) {
	await closeWindow();

	if (item.searchType === "shortcut") {
		try {
			await invoke("execute_shortcut", {
				path: item.path,
				shortcutType: item.type,
				browser: item.browser_path || null,
			});
		} catch (error) {
			console.error(`Failed to execute:\n${error}`);
		}
	} else if (item.searchType === "note") {
		try {
			await emitTo("main", "open-note", {
				workspaceId: item.workspace_id,
				noteId: item.id,
			});
		} catch (e) {
			console.error("Failed to open note:", e);
		}
	}
}

async function submitQuickTask() {
	if (!taskTitle.value.trim() || !targetWorkspaceId.value) return;

	try {
		await taskStore.createTask(
			targetWorkspaceId.value,
			taskTitle.value.trim(),
			taskDescription.value.trim() || undefined,
			taskDueDate.value || undefined
		);
		await closeWindow();
	} catch (error) {
		console.error("Failed to quick create task:", error);
	}
}

async function closeWindow() {
	try {
		const currentWindow = getCurrentWindow();
		await currentWindow.hide();
	} catch (error) {
		console.error("Failed to hide command bar:", error);
	}
}

const handleGlobalKeyDown = async (event: KeyboardEvent) => {
	if (event.key === "Tab") {
		event.preventDefault();
		if (event.ctrlKey) {
			toggleMode();
		}
		return;
	}

	if ((event.ctrlKey || event.metaKey) && (event.key === "w" || event.key === "W")) {
		event.preventDefault();
		try {
			await invoke("open_main_window");
		} catch (e) {
			console.error("Failed to invoke open_main_window:", e);
		}
	}
};

onMounted(() => {
	window.addEventListener("keydown", handleGlobalKeyDown);
});

onUnmounted(() => {
	window.removeEventListener("keydown", handleGlobalKeyDown);
});
</script>
