<template>
	<div class="flex flex-col h-full p-8 overflow-y-auto custom-scrollbar">
		<!-- Header with Title, Description, and Live Date & Clock -->
		<div class="flex items-start justify-between gap-4 mb-8">
			<div>
				<h1 class="text-3xl font-bold text-neutral-900 dark:text-white">Dashboard</h1>
				<p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
					Overview of your workspaces, task progress, and activity.
				</p>
			</div>

			<!-- Live Date & Clock Display -->
			<div class="flex flex-col items-end shrink-0 select-none bg-neutral-100 dark:bg-neutral-900/80 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800">
				<div class="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-mono font-bold text-lg">
					<UIcon name="i-lucide-clock" class="size-5" />
					<span>{{ currentTimeString }}</span>
				</div>
				<span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
					{{ currentDateString }}
				</span>
			</div>
		</div>

		<!-- Overview Stat Cards Grid (3 Columns) -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
			<div class="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col justify-between shadow-xs">
				<div class="flex items-center justify-between">
					<span class="text-xs font-semibold uppercase tracking-wider text-neutral-400">Workspaces</span>
					<UIcon name="i-lucide-folder" class="size-5 text-blue-500" />
				</div>
				<p class="text-3xl font-bold text-neutral-900 dark:text-white mt-4 font-mono">
					{{ workspaceStore.workspaces.length }}
				</p>
			</div>

			<div class="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col justify-between shadow-xs">
				<div class="flex items-center justify-between">
					<span class="text-xs font-semibold uppercase tracking-wider text-neutral-400">Total Active Tasks</span>
					<UIcon name="i-lucide-kanban" class="size-5 text-amber-500" />
				</div>
				<p class="text-3xl font-bold text-neutral-900 dark:text-white mt-4 font-mono">
					{{ activeTasksCount }}
				</p>
			</div>

			<div class="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col justify-between shadow-xs">
				<div class="flex items-center justify-between">
					<span class="text-xs font-semibold uppercase tracking-wider text-neutral-400">Upcoming Deadlines</span>
					<UIcon name="i-lucide-history" class="size-5 text-emerald-500" />
				</div>
				<p class="text-3xl font-bold text-neutral-900 dark:text-white mt-4 font-mono">
					{{ upcomingDeadlinesCount }}
				</p>
			</div>
		</div>

		<!-- Workspaces Grid Section -->
		<div class="flex flex-col gap-4">
			<h2 class="text-lg font-bold text-neutral-900 dark:text-white">Active Workspaces</h2>

			<div v-if="workspaceStore.workspaces.length === 0" class="h-48 flex items-center justify-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl text-neutral-400">
				No workspaces created yet.
			</div>

			<div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				<div
					v-for="ws in workspaceStore.workspaces"
					:key="ws.id"
					@click="workspaceStore.selectWorkspace(ws.id)"
					class="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-blue-500/50 cursor-pointer transition-all flex flex-col justify-between shadow-xs"
				>
					<div>
						<div class="flex items-center justify-between gap-2 mb-2">
							<h3 class="text-base font-bold text-neutral-900 dark:text-white">
								{{ ws.name }}
							</h3>
							<UIcon
								v-if="ws.is_favorite"
								name="i-lucide-star"
								class="size-4 text-amber-400 fill-amber-400 shrink-0"
							/>
						</div>

						<p v-if="ws.description" class="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
							{{ ws.description }}
						</p>
					</div>

					<div class="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-900 text-xs text-neutral-400">
						<span>Updated {{ formatDate(ws.updated_at) }}</span>
						<UIcon name="i-lucide-arrow-right" class="size-4 text-blue-500" />
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useWorkspaceStore } from "../../stores/workspaces";
import { useTaskStore } from "../../stores/tasks";

const workspaceStore = useWorkspaceStore();
const taskStore = useTaskStore();

const now = ref(new Date());
let timer: any = null;

onMounted(() => {
	workspaceStore.getWorkspaces();
	taskStore.getGlobalTasks();
	taskStore.getTimelineTasks();

	timer = setInterval(() => {
		now.value = new Date();
	}, 1000);
});

onUnmounted(() => {
	if (timer) clearInterval(timer);
});

const currentTimeString = computed(() => {
	return now.value.toLocaleTimeString(undefined, {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
});

const currentDateString = computed(() => {
	return now.value.toLocaleDateString(undefined, {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	});
});

const activeTasksCount = computed(() => {
	return taskStore.globalTasks.filter((t) => t.status !== "DONE").length;
});

const upcomingDeadlinesCount = computed(() => {
	return taskStore.timelineTasks.filter((t) => t.status !== "DONE").length;
});

function formatDate(dateStr?: string | null) {
	if (!dateStr) return "";
	const d = new Date(dateStr);
	if (isNaN(d.getTime())) return dateStr;
	return d.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
}
</script>
