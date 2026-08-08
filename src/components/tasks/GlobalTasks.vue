<template>
	<div class="flex flex-col h-full overflow-hidden p-6">
		<!-- Header: Title & Subtext Stacked Vertically + Search & Add Button -->
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
			<div>
				<h1 class="text-2xl font-bold text-neutral-900 dark:text-white">All Tasks</h1>
				<p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
					Overview of tasks across all active workspaces.
				</p>
			</div>

			<div class="flex items-center gap-3 shrink-0">
				<!-- Search Bar -->
				<div class="relative flex items-center">
					<UInput
						v-model="searchQuery"
						type="text"
						icon="i-lucide-search"
						placeholder="Search tasks..."
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

				<!-- Sort Dropdown -->
				<UDropdownMenu
					:items="dropdownSortItems"
					:content="{ align: 'end' }"
				>
					<UButton
						color="neutral"
						variant="outline"
						size="sm"
						icon="i-lucide-arrow-up-down"
						class="cursor-pointer font-medium"
						title="Sort Tasks"
					>
						<span class="hidden sm:inline">Sort: {{ activeSortLabel }}</span>
					</UButton>
				</UDropdownMenu>

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

		<!-- Columns Container (Kanban Board) -->
		<div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
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
						<span class="size-2.5 rounded-full" :class="col.colorDot"></span>
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
						class="cursor-pointer"
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
							<!-- Workspace Badge + Menu -->
							<div class="flex items-center justify-between gap-2 mb-1">
								<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 truncate">
									{{ getWorkspaceName(task.workspace_id) }}
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

							<!-- Title -->
							<span
								class="text-sm font-medium text-neutral-800 dark:text-neutral-200 leading-snug"
								:class="{ 'line-through text-neutral-400 dark:text-neutral-500': task.status === 'DONE' }"
							>
								{{ task.title }}
							</span>

							<!-- Description preview -->
							<p v-if="task.description" class="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
								{{ task.description }}
							</p>

							<!-- Footer: Due date + status badges -->
							<div class="flex items-center justify-between mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-900 text-xs">
								<div class="flex items-center gap-2">
									<div
										v-if="task.due_date"
										class="flex items-center gap-1 font-mono text-[11px]"
										:class="getDueDateClass(task.due_date, task.status)"
									>
										<UIcon name="i-lucide-calendar" class="size-3.5 shrink-0" />
										<span>{{ formatDate(task.due_date) }}</span>
									</div>
									<div
										v-if="task.reminder_at"
										class="flex items-center gap-1 font-mono text-[11px] text-amber-500 dark:text-amber-400"
										:title="`Reminder: ${formatDate(task.reminder_at)}`"
									>
										<UIcon name="i-lucide-bell" class="size-3.5 shrink-0" />
										<span>{{ formatDate(task.reminder_at) }}</span>
									</div>
									<div v-if="!task.due_date && !task.reminder_at" class="text-[11px] text-neutral-400 dark:text-neutral-600">
										No due date
									</div>
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
			is-global
			@saved="refreshGlobalTasks"
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
import { ref, computed, onMounted } from "vue";
import { useStorage } from "@vueuse/core";
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Task, TaskStatus } from "../../services/tasks.service";
import { useTaskStore } from "../../stores/tasks";
import { useWorkspaceStore } from "../../stores/workspaces";
import TaskFormModal from "./TaskFormModal.vue";
import DeleteModal from "../common/DeleteModal.vue";

const taskStore = useTaskStore();
const workspaceStore = useWorkspaceStore();

const columns = [
	{ status: "TODO" as TaskStatus, title: "To Do", colorDot: "bg-slate-400" },
	{ status: "IN_PROGRESS" as TaskStatus, title: "In Progress", colorDot: "bg-amber-500" },
	{ status: "DONE" as TaskStatus, title: "Done", colorDot: "bg-emerald-500" },
];

const searchQuery = ref("");
const sortKey = useStorage("nook_global_tasks_sort_key", "title");
const sortOrder = useStorage<"asc" | "desc">("nook_global_tasks_sort_order", "asc");

const sortOptions = [
	{ label: "Title", value: "title" },
	{ label: "Due Date", value: "due_date" },
	{ label: "Date Created", value: "created_at" },
];

const activeSortLabel = computed(() => {
	const match = sortOptions.find((opt) => opt.value === sortKey.value);
	return match ? match.label : "Default";
});

function handleSortSelect(value: string) {
	if (sortKey.value === value) {
		sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
	} else {
		sortKey.value = value;
		sortOrder.value = "asc";
	}
}

const dropdownSortItems = computed<DropdownMenuItem[][]>(() => {
	return [
		sortOptions.map((opt) => {
			const isActive = sortKey.value === opt.value;
			return {
				label: opt.label,
				icon: isActive
					? sortOrder.value === "asc"
						? "i-lucide-arrow-up"
						: "i-lucide-arrow-down"
					: "i-lucide-minus",
				onSelect: () => handleSortSelect(opt.value),
				ui: {
					item: isActive ? "text-primary" : "text-primary/60",
					itemLeadingIcon: isActive ? "text-primary" : "",
				} as any,
			};
		}),
	];
});

const globalTasks = computed(() => taskStore.globalTasks || []);

const filteredTasks = computed(() => {
	let result = [...globalTasks.value];

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
	workspaceStore.getWorkspaces();
	taskStore.getGlobalTasks();
});

function getWorkspaceName(workspaceId: number) {
	const ws = workspaceStore.workspaces.find((w) => w.id === workspaceId);
	return ws ? ws.name : "Workspace";
}

function getTasksByStatus(status: TaskStatus) {
	return filteredTasks.value.filter((t) => t.status === status);
}

function onDragStart(event: DragEvent, task: Task) {
	if (event.dataTransfer) {
		event.dataTransfer.setData("text/plain", JSON.stringify({ id: task.id, workspaceId: task.workspace_id }));
		event.dataTransfer.effectAllowed = "move";
	}
}

async function onDrop(event: DragEvent, targetStatus: TaskStatus) {
	if (!event.dataTransfer) return;
	const dataStr = event.dataTransfer.getData("text/plain");
	if (!dataStr) return;

	try {
		const { id, workspaceId } = JSON.parse(dataStr);
		const task = globalTasks.value.find((t) => t.id === id);
		if (task && task.status !== targetStatus) {
			await taskStore.updateTaskStatus(id, targetStatus, workspaceId);
			await taskStore.getGlobalTasks();
		}
	} catch (e) {
		console.error("Failed to process drop:", e);
	}
}

async function moveTaskStatus(task: Task, newStatus: TaskStatus) {
	await taskStore.updateTaskStatus(task.id, newStatus, task.workspace_id);
	await taskStore.getGlobalTasks();
}

const formModalRef = ref<any>(null);
const deleteModalRef = ref<any>(null);
const taskToDelete = ref<Task | null>(null);

function refreshGlobalTasks() {
	taskStore.getGlobalTasks();
}

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
		await taskStore.deleteTask(taskToDelete.value.id, taskToDelete.value.workspace_id);
		await taskStore.getGlobalTasks();
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
