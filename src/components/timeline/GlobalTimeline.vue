<template>
	<div class="flex flex-col h-full overflow-hidden p-6">
		<!-- Header: Title & Subtext Stacked Vertically + Search & Add Button -->
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
			<div>
				<h1 class="text-2xl font-bold text-neutral-900 dark:text-white">All Timeline</h1>
				<p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
					Master timeline of scheduled tasks across all active workspaces.
				</p>
			</div>

			<div class="flex items-center gap-3 shrink-0">
				<!-- Search Bar -->
				<div class="relative flex items-center">
					<UInput
						v-model="searchQuery"
						type="text"
						icon="i-lucide-search"
						placeholder="Search timeline tasks..."
						color="neutral"
						variant="outline"
						size="sm"
						class="w-48 sm:w-64 font-medium"
					>
						<template v-if="searchQuery" #trailing>
							<UButton
								v-if="searchQuery"
								color="neutral"
								variant="link"
								size="xs"
								icon="i-lucide-x"
								class="p-0.5 cursor-pointer"
								title="Clear Search"
								@click="searchQuery = ''"
							/>
						</template>
					</UInput>
				</div>

				<TimelineViewSwitcher v-model="viewMode" />

				<UButton
					icon="i-lucide-plus"
					color="primary"
					size="sm"
					class="cursor-pointer font-medium shrink-0"
					@click="openAddModal"
				>
					Add New Task
				</UButton>
			</div>
		</div>

		<div class="flex-1 min-h-0">
			<TimelineList
				v-if="viewMode === 'list'"
				:grouped-timeline="groupedTimeline"
				@edit-task="openEditModal"
				@delete-task="triggerDeleteTask"
				@move-status="moveTaskStatus"
			/>
			<TaskCalendarView
				v-else
				:tasks="filteredTasks"
				@select-task="openEditModal"
				@edit-task="openEditModal"
				@delete-task="triggerDeleteTask"
				@move-status="moveTaskStatus"
			/>
		</div>

		<!-- Add/Edit Task Modal -->
		<TaskFormModal
			ref="formModalRef"
			is-global
			@saved="refreshTimelineTasks"
		/>

		<DeleteModal
			ref="deleteModalRef"
			delete-type="Task"
			:target="taskToDelete?.title || ''"
			@confirm="handleConfirmDelete"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import type { Task, TaskStatus } from "../../services/tasks.service";
import { useTaskStore } from "../../stores/tasks";
import { useWorkspaceStore } from "../../stores/workspaces";
import TimelineViewSwitcher, { type TimelineViewMode } from "./TimelineViewSwitcher.vue";
import TaskCalendarView from "./TaskCalendarView.vue";
import TimelineList from "./TimelineList.vue";
import TaskFormModal from "../tasks/TaskFormModal.vue";
import DeleteModal from "../common/DeleteModal.vue";

const taskStore = useTaskStore();
const workspaceStore = useWorkspaceStore();

const viewMode = ref<TimelineViewMode>(
	(localStorage.getItem("nook_timeline_view_pref") as TimelineViewMode) || "list"
);

watch(viewMode, (newVal) => {
	localStorage.setItem("nook_timeline_view_pref", newVal);
});

const searchQuery = ref("");

const timelineTasks = computed(() => taskStore.timelineTasks || []);

const filteredTasks = computed(() => {
	let result = [...timelineTasks.value];

	if (searchQuery.value) {
		const query = searchQuery.value.toLowerCase();
		result = result.filter(
			(t) =>
				t.title.toLowerCase().includes(query) ||
				(t.description && t.description.toLowerCase().includes(query))
		);
	}

	return result;
});

onMounted(() => {
	workspaceStore.getWorkspaces();
	taskStore.getTimelineTasks();
});

const groupedTimeline = computed(() => {
	const groups: Record<string, Task[]> = {};

	for (const task of filteredTasks.value) {
		if (!task.due_date) continue;
		const dateStr = formatDateGroup(task.due_date);
		if (!groups[dateStr]) {
			groups[dateStr] = [];
		}
		groups[dateStr].push(task);
	}

	return groups;
});

async function moveTaskStatus(task: Task, newStatus: TaskStatus) {
	await taskStore.updateTaskStatus(task.id, newStatus, task.workspace_id);
	await taskStore.getTimelineTasks();
}

const formModalRef = ref<any>(null);
const deleteModalRef = ref<any>(null);
const taskToDelete = ref<Task | null>(null);

function refreshTimelineTasks() {
	taskStore.getTimelineTasks();
}

function openAddModal() {
	formModalRef.value?.openModal();
}

function openEditModal(task: Task) {
	formModalRef.value?.openModal(task);
}

function triggerDeleteTask(task: Task) {
	taskToDelete.value = task;
	deleteModalRef.value?.openModal();
}

async function handleConfirmDelete() {
	if (taskToDelete.value) {
		await taskStore.deleteTask(taskToDelete.value.id, taskToDelete.value.workspace_id);
		await taskStore.getTimelineTasks();
		taskToDelete.value = null;
	}
}

function formatDateGroup(dateStr: string) {
	const d = new Date(dateStr);
	if (isNaN(d.getTime())) return dateStr;
	const today = new Date();
	const tomorrow = new Date();
	tomorrow.setDate(today.getDate() + 1);

	if (d.toDateString() === today.toDateString()) return "Today";
	if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";

	return d.toLocaleDateString(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}
</script>
