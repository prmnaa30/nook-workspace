<template>
	<UModal
		v-model:open="isOpen"
		:title="editingTask ? 'Edit Task' : 'Add New Task'"
		close-icon="i-lucide-x"
		:ui="{ content: 'z-[50]', overlay: 'z-[45]' }"
	>
		<template #body>
			<form id="task-form-modal" @submit.prevent="saveTask" class="flex flex-col gap-4">
				<!-- Target Workspace (Shown if isGlobal or no fixed workspaceId prop) -->
				<div v-if="isGlobal || !workspaceId" class="flex flex-col gap-1">
					<label class="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Target Workspace *</label>
					<USelect
						v-model="formWorkspaceId!"
						:items="workspaceOptions"
						color="neutral"
						variant="outline"
						size="md"
						class="w-full"
						:disabled="!!editingTask"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Title *</label>
					<UInput
						v-model="formTitle"
						placeholder="Task title (e.g. Review Kanji Lesson 5)"
						required
						color="neutral"
						variant="outline"
						size="md"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Description</label>
					<UTextarea
						v-model="formDescription"
						placeholder="Details, steps, or notes..."
						color="neutral"
						variant="outline"
						size="md"
						class="h-28 resize-none"
					/>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="flex flex-col gap-1">
						<label class="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Status</label>
						<USelect
							v-model="formStatus"
							:items="statusOptions"
							color="neutral"
							variant="outline"
							size="md"
							class="w-full"
						/>
					</div>

					<div class="flex flex-col gap-1">
						<label class="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Due Date</label>
						<TaskDateTimePicker v-model="formDueDate" />
					</div>
				</div>
			</form>
		</template>

		<template #footer="{ close }">
			<div class="flex w-full justify-end gap-3">
				<UButton variant="soft" color="neutral" @click="close">Cancel</UButton>
				<UButton type="submit" form="task-form-modal" color="primary">
					{{ editingTask ? 'Save Changes' : 'Create Task' }}
				</UButton>
			</div>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { Task, TaskStatus } from "../../services/tasks.service";
import { useTaskStore } from "../../stores/tasks";
import { useWorkspaceStore } from "../../stores/workspaces";
import TaskDateTimePicker from "../common/TaskDateTimePicker.vue";

const props = defineProps<{
	workspaceId?: number;
	isGlobal?: boolean;
}>();

const emit = defineEmits<{
	(e: "saved"): void;
}>();

const taskStore = useTaskStore();
const workspaceStore = useWorkspaceStore();

const isOpen = ref(false);
const editingTask = ref<Task | null>(null);

const formWorkspaceId = ref<number | undefined>(undefined);
const formTitle = ref("");
const formDescription = ref("");
const formStatus = ref<TaskStatus>("TODO");
const formDueDate = ref("");

const statusOptions = [
	{ label: "To Do", value: "TODO" },
	{ label: "In Progress", value: "IN_PROGRESS" },
	{ label: "Done", value: "DONE" },
];

const workspaceOptions = computed(() => {
	return workspaceStore.workspaces.map((w) => ({
		label: w.name,
		value: w.id,
	}));
});

function formatForDatetimeInput(dateStr: string) {
	const d = new Date(dateStr);
	if (isNaN(d.getTime())) return dateStr;
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function openModal(task?: Task, defaultStatus?: TaskStatus, defaultWorkspaceId?: number) {
	if (task) {
		editingTask.value = task;
		formWorkspaceId.value = task.workspace_id;
		formTitle.value = task.title;
		formDescription.value = task.description || "";
		formStatus.value = task.status;
		formDueDate.value = task.due_date ? formatForDatetimeInput(task.due_date) : "";
	} else {
		editingTask.value = null;
		formWorkspaceId.value = defaultWorkspaceId || props.workspaceId || workspaceStore.workspaces[0]?.id;
		formTitle.value = "";
		formDescription.value = "";
		formStatus.value = defaultStatus || "TODO";
		formDueDate.value = "";
	}
	isOpen.value = true;
}

function closeModal() {
	isOpen.value = false;
}

async function saveTask() {
	if (!formTitle.value.trim()) return;

	const targetWorkspaceId = props.workspaceId || formWorkspaceId.value;
	if (!targetWorkspaceId) return;

	if (editingTask.value) {
		await taskStore.updateTask(
			editingTask.value.id,
			formTitle.value.trim(),
			formDescription.value.trim(),
			formDueDate.value || undefined,
			formStatus.value,
			targetWorkspaceId
		);
	} else {
		await taskStore.createTask(
			targetWorkspaceId,
			formTitle.value.trim(),
			formDescription.value.trim(),
			formDueDate.value || undefined
		);
		if (formStatus.value !== "TODO") {
			const newlyCreated = taskStore.workspaceTasks[0] || taskStore.globalTasks[0];
			if (newlyCreated) {
				await taskStore.updateTaskStatus(newlyCreated.id, formStatus.value, targetWorkspaceId);
			}
		}
	}

	isOpen.value = false;
	emit("saved");
}

defineExpose({
	openModal,
	closeModal,
});
</script>
