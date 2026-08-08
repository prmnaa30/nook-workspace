<template>
	<div class="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden shadow-2xl">
		<!-- Header Search Bar -->
		<FloatingHeader
			ref="headerRef"
			v-model:search-query="searchQuery"
			@move-selection="moveSelection"
			@execute-active="executeActiveItem"
			@close-window="closeWindow"
		/>

		<!-- Search Mode Body -->
		<FloatingSearchResults
			:items="filteredItems"
			:active-index="activeIndex"
			:search-query="searchQuery"
			@select-item="executeItem"
		/>

		<!-- Footer Shortcuts Bar -->
		<FloatingFooter />
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from "vue";
import { useShortcutStore } from "../../stores/shortcuts";
import { useNoteStore } from "../../stores/notes";
import { useWorkspaceStore } from "../../stores/workspaces";
import { storeToRefs } from "pinia";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { emitTo } from "@tauri-apps/api/event";

import FloatingHeader from "./FloatingHeader.vue";
import FloatingSearchResults from "./FloatingSearchResults.vue";
import FloatingFooter from "./FloatingFooter.vue";

const shortcutStore = useShortcutStore();
const noteStore = useNoteStore();
const workspaceStore = useWorkspaceStore();

const { allShortcuts } = storeToRefs(shortcutStore);
const { allNotes } = storeToRefs(noteStore);

const searchQuery = ref("");
const activeIndex = ref(0);

const headerRef = ref<any>(null);

async function adjustWindowSize() {
	const targetHeight = 420;
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
	headerRef.value?.focusSearchInput();
}

function focusActiveInput() {
	doFocus();
	nextTick(() => {
		doFocus();
		setTimeout(doFocus, 50);
		setTimeout(doFocus, 150);
	});
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

	return combined.filter((item) => Boolean(item.is_pinned));
});

watch(searchQuery, () => {
	activeIndex.value = 0;
});

onMounted(async () => {
	await Promise.all([
		shortcutStore.getAllShortcuts(),
		noteStore.getAllNotes(),
		workspaceStore.getWorkspaces(),
	]);
	adjustWindowSize();
	focusActiveInput();
});

onMounted(async () => {
	try {
		const currentWindow = getCurrentWindow();

		currentWindow.listen("tauri://focus", () => {
			shortcutStore.getAllShortcuts();
			noteStore.getAllNotes();
			workspaceStore.getWorkspaces();
			searchQuery.value = "";
			activeIndex.value = 0;
			adjustWindowSize();
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
		moveSelection(event.shiftKey ? -1 : 1);
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
