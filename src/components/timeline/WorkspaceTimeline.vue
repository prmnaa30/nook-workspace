<template>
	<div class="flex flex-col h-full overflow-hidden">
		<!-- Header: SubHeader with Search & Add Button, No Sort -->
		<div class="flex items-center justify-between gap-4 py-2 px-1 mb-3 shrink-0 border-b border-neutral-200/60 dark:border-neutral-800/60 select-none">
			<div class="flex items-center gap-2.5 min-w-0">
				<h2 class="text-base font-bold text-neutral-900 dark:text-neutral-100 truncate">
					Workspace Timeline
				</h2>

				<UBadge
					color="neutral"
					variant="subtle"
					size="sm"
					class="font-mono font-medium shrink-0"
				>
					{{ timelineTasks.length }} scheduled tasks
				</UBadge>
			</div>

			<div class="flex items-center gap-2 shrink-0">
				<div class="relative flex items-center">
					<UInput
						v-model="searchQuery"
						type="text"
						icon="i-lucide-search"
						placeholder="Search timeline..."
						color="neutral"
						variant="outline"
						size="sm"
						class="w-40 sm:w-56 font-medium"
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
					Schedule Task
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
			:workspace-id="workspaceId"
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
import TimelineViewSwitcher, { type TimelineViewMode } from "./TimelineViewSwitcher.vue";
import TaskCalendarView from "./TaskCalendarView.vue";
import TimelineList from "./TimelineList.vue";
import TaskFormModal from "../tasks/TaskFormModal.vue";
import DeleteModal from "../common/DeleteModal.vue";

const props = defineProps<{
	workspaceId: number;
}>();

const taskStore = useTaskStore();

const viewMode = ref<TimelineViewMode>(
	(localStorage.getItem("nook_timeline_view_pref") as TimelineViewMode) || "list"
);

watch(viewMode, (newVal) => {
	localStorage.setItem("nook_timeline_view_pref", newVal);
});

const searchQuery = ref("");

const timelineTasks = computed(() => {
	return (taskStore.workspaceTasks || []).filter((t) => t.due_date && t.due_date.trim() !== "");
});

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
	taskStore.getTasksByWorkspace(props.workspaceId);
});

watch(() => props.workspaceId, (newId) => {
	if (newId) {
		taskStore.getTasksByWorkspace(newId);
	}
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
	await taskStore.updateTaskStatus(task.id, newStatus, props.workspaceId);
}

const formModalRef = ref<any>(null);
const deleteModalRef = ref<any>(null);
const taskToDelete = ref<Task | null>(null);

function refreshTimelineTasks() {
	taskStore.getTasksByWorkspace(props.workspaceId);
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
		await taskStore.deleteTask(taskToDelete.value.id, props.workspaceId);
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
