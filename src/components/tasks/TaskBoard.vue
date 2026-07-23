<template>
	<div class="flex flex-col h-full overflow-hidden">
		<!-- Sub-Header Bar with Show in Dashboard Switch -->
		<WorkspaceSubHeader
			title="Tasks Board"
			:item-count="filteredTasks.length"
			item-unit="tasks"
			search-placeholder="Search tasks..."
			v-model:search="searchQuery"
			v-model:sort-key="sortKey"
			v-model:sort-order="sortOrder"
			:sort-options="sortOptions"
			action-label="Add Task"
			action-icon="i-lucide-plus"
			@action="openAddModal"
		>
			<template #extra-actions>
				<div class="flex items-center gap-2 px-2.5 py-1.25 rounded-md bg-neutral-300 dark:bg-default border border-neutral-200 dark:border-accented shrink-0">
					<span class="text-xs font-medium text-neutral-600 dark:text-neutral-300">Show in Dashboard</span>
					<USwitch
						v-model="showInDashboard"
						color="primary"
						size="sm"
						@update:model-value="toggleShowInDashboard"
					/>
				</div>
			</template>
		</WorkspaceSubHeader>

		<!-- Columns Container -->
		<div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
			<!-- Column Component loop -->
			<div
				v-for="col in columns"
				:key="col.status"
				class="flex flex-col rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 p-3 min-h-0"
				@dragover.prevent
				@drop="onDrop($event, col.status)"
			>
				<!-- Column Header -->
				<div class="flex items-center justify-between mb-3 px-1">
					<div class="flex items-center gap-2">
						<span
							class="size-2.5 rounded-full shrink-0"
							:class="col.colorDot"
						></span>
						<span class="font-semibold text-sm text-neutral-700 dark:text-neutral-300">
							{{ col.title }}
						</span>
						<span class="text-xs px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono">
							{{ getTasksByStatus(col.status).length }}
						</span>
					</div>
					<UButton
						icon="i-lucide-plus"
						color="neutral"
						variant="ghost"
						size="xs"
						title="Quick Add Task"
						class="cursor-pointer shrink-0"
						@click="openAddModalForStatus(col.status)"
					/>
				</div>

				<!-- Task List in Column -->
				<div class="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
					<div
						v-if="getTasksByStatus(col.status).length === 0"
						class="h-24 flex items-center justify-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-lg text-xs text-neutral-400 dark:text-neutral-600 italic"
					>
						No tasks in {{ col.title }}
					</div>

					<UContextMenu
						v-for="task in getTasksByStatus(col.status)"
						:key="task.id"
						:items="getTaskMenuItems(task)"
						:ui="{ content: 'min-w-40' }"
					>
						<div
							draggable="true"
							@dragstart="onDragStart($event, task)"
							class="group relative flex flex-col p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-grab active:cursor-grabbing"
						>
							<!-- Card Top Row: Title + Dropdown -->
							<div class="flex items-start justify-between gap-2">
								<span
									class="text-sm font-medium text-neutral-800 dark:text-neutral-200 leading-snug"
									:class="{ 'line-through text-neutral-400 dark:text-neutral-500': task.status === 'DONE' }"
								>
									{{ task.title }}
								</span>

								<UDropdownMenu
									:items="getTaskMenuItems(task)"
									:ui="{ content: 'min-w-36' }"
								>
									<UButton
										color="neutral"
										variant="ghost"
										size="xs"
										icon="i-lucide-more-vertical"
										class="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
									/>
								</UDropdownMenu>
							</div>

							<!-- Description preview -->
							<p
								v-if="task.description"
								class="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 line-clamp-2"
							>
								{{ task.description }}
							</p>

							<!-- Footer: Due date + status badges -->
							<div class="flex items-center justify-between mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-900 text-xs">
								<div
									v-if="task.due_date"
									class="flex items-center gap-1 font-mono text-[11px]"
									:class="getDueDateClass(task.due_date, task.status)"
								>
									<UIcon name="i-lucide-calendar" class="size-3.5 shrink-0" />
									<span>{{ formatDate(task.due_date) }}</span>
								</div>
								<div v-else class="text-[11px] text-neutral-400 dark:text-neutral-600">
									No due date
								</div>

								<!-- Quick status shift button -->
								<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
									<UButton
										v-if="col.status !== 'TODO'"
										color="neutral"
										variant="ghost"
										size="xs"
										icon="i-lucide-arrow-left"
										class="cursor-pointer"
										title="Move Left"
										@click="moveTaskStatus(task, col.status === 'DONE' ? 'IN_PROGRESS' : 'TODO')"
									/>
									<UButton
										v-if="col.status !== 'DONE'"
										color="neutral"
										variant="ghost"
										size="xs"
										icon="i-lucide-arrow-right"
										class="cursor-pointer"
										title="Move Right"
										@click="moveTaskStatus(task, col.status === 'TODO' ? 'IN_PROGRESS' : 'DONE')"
									/>
								</div>
							</div>
						</div>
					</UContextMenu>
				</div>
			</div>
		</div>

		<!-- Add/Edit Task Modal -->
		<TaskFormModal
			ref="formModalRef"
			:workspace-id="workspaceId"
			@saved="refreshTasks"
		/>

		<!-- Delete Task Modal -->
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
import { useStorage } from "@vueuse/core";
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Task, TaskStatus } from "../../services/tasks.service";
import { useTaskStore } from "../../stores/tasks";
import { useWorkspaceStore } from "../../stores/workspaces";
import WorkspaceSubHeader from "../workspace/WorkspaceSubHeader.vue";
import TaskFormModal from "./TaskFormModal.vue";
import DeleteModal from "../common/DeleteModal.vue";

const props = defineProps<{
	workspaceId: number;
}>();

const taskStore = useTaskStore();
const workspaceStore = useWorkspaceStore();

const columns = [
	{ status: "TODO" as TaskStatus, title: "To Do", colorDot: "bg-slate-400" },
	{ status: "IN_PROGRESS" as TaskStatus, title: "In Progress", colorDot: "bg-amber-500" },
	{ status: "DONE" as TaskStatus, title: "Done", colorDot: "bg-emerald-500" },
];

const searchQuery = ref("");
const sortKey = useStorage("nook_task_board_sort_key", "title");
const sortOrder = useStorage<"asc" | "desc">("nook_task_board_sort_order", "asc");

const sortOptions = [
	{ label: "Title", value: "title" },
	{ label: "Due Date", value: "due_date" },
	{ label: "Date Created", value: "created_at" },
];

const currentWorkspace = computed(() => {
	return workspaceStore.workspaces.find((w) => w.id === props.workspaceId);
});

const showInDashboard = ref(true);

watch(
	currentWorkspace,
	(ws) => {
		if (ws) {
			showInDashboard.value = Boolean(ws.show_in_global_tasks);
		}
	},
	{ immediate: true }
);

async function toggleShowInDashboard(val: boolean) {
	if (currentWorkspace.value) {
		await workspaceStore.toggleGlobalVisibility(currentWorkspace.value.id, val);
	}
}

const workspaceTasks = computed(() => taskStore.workspaceTasks);

const filteredTasks = computed(() => {
	let result = [...workspaceTasks.value];

	if (searchQuery.value) {
		const query = searchQuery.value.toLowerCase();
		result = result.filter(
			(t) =>
				t.title.toLowerCase().includes(query) ||
				(t.description && t.description.toLowerCase().includes(query))
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
	taskStore.getTasksByWorkspace(props.workspaceId);
});

watch(() => props.workspaceId, (newId) => {
	if (newId) {
		taskStore.getTasksByWorkspace(newId);
	}
});

function refreshTasks() {
	taskStore.getTasksByWorkspace(props.workspaceId);
}

function getTasksByStatus(status: TaskStatus) {
	return filteredTasks.value.filter((t) => t.status === status);
}

// Drag & Drop
function onDragStart(event: DragEvent, task: Task) {
	if (event.dataTransfer) {
		event.dataTransfer.setData("text/plain", String(task.id));
		event.dataTransfer.effectAllowed = "move";
	}
}

async function onDrop(event: DragEvent, targetStatus: TaskStatus) {
	if (!event.dataTransfer) return;
	const taskIdStr = event.dataTransfer.getData("text/plain");
	const taskId = Number(taskIdStr);
	if (!taskId) return;

	const task = workspaceTasks.value.find((t) => t.id === taskId);
	if (task && task.status !== targetStatus) {
		await taskStore.updateTaskStatus(taskId, targetStatus, props.workspaceId);
	}
}

// Quick status shift
async function moveTaskStatus(task: Task, newStatus: TaskStatus) {
	await taskStore.updateTaskStatus(task.id, newStatus, props.workspaceId);
}

// Modal State
const formModalRef = ref<any>(null);
const deleteModalRef = ref<any>(null);
const taskToDelete = ref<Task | null>(null);

function openAddModal() {
	formModalRef.value?.openModal();
}

function openAddModalForStatus(status: TaskStatus) {
	formModalRef.value?.openModal(undefined, status);
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

function getTaskMenuItems(task: Task): DropdownMenuItem[][] {
	return [
		[
			{
				label: "Edit Task",
				icon: "i-lucide-pencil",
				onSelect: () => openEditModal(task),
			},
			{
				label: task.status === "DONE" ? "Mark as To Do" : "Mark as Done",
				icon: task.status === "DONE" ? "i-lucide-circle" : "i-lucide-check-circle",
				onSelect: () => moveTaskStatus(task, task.status === "DONE" ? "TODO" : "DONE"),
			},
			{
				type: "separator" as const,
			},
			{
				label: "Delete Task",
				icon: "i-lucide-trash-2",
				color: "error" as const,
				onSelect: () => triggerDeleteTask(task),
			},
		],
	];
}

function formatDate(dateStr: string) {
	const d = new Date(dateStr);
	if (isNaN(d.getTime())) return dateStr;
	return d.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function getDueDateClass(dateStr: string, status: TaskStatus) {
	if (status === "DONE") return "text-neutral-400 dark:text-neutral-500";
	const due = new Date(dateStr).getTime();
	const now = new Date().getTime();
	if (due < now) return "text-red-500 font-semibold";
	if (due - now < 24 * 60 * 60 * 1000) return "text-amber-500 font-medium";
	return "text-neutral-500 dark:text-neutral-400";
}
</script>
