<template>
	<UModal
		v-model:open="isOpen"
		:title="editingShortcut ? 'Edit Shortcut' : 'Add Shortcut'"
		close-icon="i-lucide-x"
	>
		<template #body>
			<form id="shortcut-form" @submit.prevent="saveShortcut" class="flex flex-col gap-4">
				<div class="flex flex-col gap-1">
					<label class="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Title *</label>
					<UInput
						v-model="formTitle"
						placeholder="Shortcut title (e.g. GitHub Repository)"
						required
						color="neutral"
						variant="outline"
						size="md"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Type *</label>
					<USelect
						v-model="formType"
						:items="typeOptions"
						color="neutral"
						variant="outline"
						size="md"
						class="w-full"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Path or URL *</label>
					<div class="flex gap-2">
						<UInput
							v-model="formPath"
							placeholder="https://example.com or C:\Folder\App.exe"
							required
							color="neutral"
							variant="outline"
							size="md"
							class="w-full"
						/>
						<UButton
							v-if="formType !== 'web'"
							icon="i-lucide-folder-open"
							color="neutral"
							variant="soft"
							size="md"
							title="Browse File or Folder"
							class="cursor-pointer shrink-0"
							@click="browsePath"
						/>
					</div>
				</div>

				<div class="flex items-center justify-between pt-2">
					<div class="flex flex-col">
						<span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200"
							>Pin to Quick Access</span
						>
						<span class="text-[11px] text-neutral-400"
							>Show directly in Floating Command Bar</span
						>
					</div>
					<USwitch
						v-model="formIsPinned"
						color="primary"
					/>
				</div>
			</form>
		</template>

		<template #footer="{ close }">
			<div class="flex w-full justify-end gap-3">
				<UButton variant="soft" color="neutral" @click="close">Cancel</UButton>
				<UButton type="submit" form="shortcut-form" color="primary">
					{{ editingShortcut ? 'Save Changes' : 'Create Shortcut' }}
				</UButton>
			</div>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { Shortcut } from "../../services/shortcuts.service";
import { useShortcutStore } from "../../stores/shortcuts";
import { open as openDialog } from "@tauri-apps/plugin-dialog";

const props = defineProps<{
	workspaceId: number;
}>();

const emit = defineEmits<{
	(e: "saved"): void;
}>();

const shortcutStore = useShortcutStore();

const isOpen = ref(false);
const editingShortcut = ref<Shortcut | null>(null);
const formTitle = ref("");
const formType = ref<"web" | "file" | "folder">("web");
const formPath = ref("");
const formIsPinned = ref(false);

const typeOptions = [
	{ label: "Web URL", value: "web" },
	{ label: "File Executable", value: "file" },
	{ label: "Folder Directory", value: "folder" },
];

function openModal(shortcut?: Shortcut) {
	if (shortcut) {
		editingShortcut.value = shortcut;
		formTitle.value = shortcut.title;
		formType.value = shortcut.type;
		formPath.value = shortcut.path;
		formIsPinned.value = Boolean(shortcut.is_pinned);
	} else {
		editingShortcut.value = null;
		formTitle.value = "";
		formType.value = "web";
		formPath.value = "";
		formIsPinned.value = false;
	}
	isOpen.value = true;
}

async function browsePath() {
	try {
		const selected = await openDialog({
			directory: formType.value === "folder",
			multiple: false,
		});
		if (selected && typeof selected === "string") {
			formPath.value = selected;
		}
	} catch (e) {
		console.error("Failed to browse path:", e);
	}
}

async function saveShortcut() {
	if (!formTitle.value.trim() || !formPath.value.trim()) return;

	if (editingShortcut.value) {
		await shortcutStore.updateShortcut(
			props.workspaceId,
			editingShortcut.value.id,
			formTitle.value.trim(),
			formType.value,
			formPath.value.trim(),
			null,
			formIsPinned.value
		);
	} else {
		await shortcutStore.createShortcut(
			props.workspaceId,
			formTitle.value.trim(),
			formType.value,
			formPath.value.trim(),
			null,
			formIsPinned.value
		);
	}

	emit("saved");
	isOpen.value = false;
}

defineExpose({ openModal });
</script>
