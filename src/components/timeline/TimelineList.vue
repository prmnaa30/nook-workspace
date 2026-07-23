<template>
	<div class="flex-1 min-h-0 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
		<div
			v-if="Object.keys(groupedTimeline).length === 0"
			class="h-48 flex flex-col items-center justify-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl text-neutral-400 dark:text-neutral-500"
		>
			<UIcon name="i-lucide-calendar" class="size-8 mb-2 opacity-50" />
			<p class="text-sm">No upcoming tasks scheduled with due dates.</p>
		</div>

		<div
			v-for="(tasksInGroup, dateGroup) in groupedTimeline"
			:key="dateGroup"
			class="flex flex-col gap-2"
		>
			<div class="flex items-center gap-2 sticky top-0 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xs py-1.5 z-10">
				<span class="text-xs font-bold text-neutral-700 dark:text-neutral-300 font-mono uppercase tracking-wider">
					{{ dateGroup }}
				</span>
				<div class="h-px flex-1 bg-neutral-200 dark:border-neutral-800"></div>
				<span class="text-[11px] text-neutral-400 font-mono">
					{{ tasksInGroup.length }} {{ tasksInGroup.length === 1 ? 'task' : 'tasks' }}
				</span>
			</div>

			<div class="flex flex-col gap-2 pl-2 border-l-2 border-neutral-200 dark:border-neutral-800 ml-1">
				<UContextMenu
					v-for="task in tasksInGroup"
					:key="task.id"
					:items="getTaskMenuItems(task)"
					:ui="{ content: 'min-w-40' }"
				>
					<div
						class="group flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-xs"
					>
						<div class="flex items-start gap-3">
							<UButton
								color="neutral"
								variant="ghost"
								size="xs"
								:icon="task.status === 'DONE' ? 'i-lucide-check-circle' : 'i-lucide-circle'"
								class="cursor-pointer"
								:class="task.status === 'DONE' ? 'text-emerald-500' : ''"
								:title="task.status === 'DONE' ? 'Mark To Do' : 'Mark Done'"
								@click="$emit('move-status', task, task.status === 'DONE' ? 'TODO' : 'DONE')"
							/>

							<div class="flex flex-col">
								<span
									class="text-sm font-medium text-neutral-800 dark:text-neutral-200"
									:class="{ 'line-through text-neutral-400 dark:text-neutral-500': task.status === 'DONE' }"
								>
									{{ task.title }}
								</span>
								<p v-if="task.description" class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
									{{ task.description }}
								</p>
							</div>
						</div>

						<div class="flex items-center gap-3">
							<span
								v-if="task.due_date"
								class="text-xs font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800"
							>
								{{ formatTime(task.due_date) }}
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
					</div>
				</UContextMenu>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Task, TaskStatus } from "../../services/tasks.service";

defineProps<{
	groupedTimeline: Record<string, Task[]>;
}>();

const emit = defineEmits<{
	(e: "edit-task", task: Task): void;
	(e: "delete-task", task: Task): void;
	(e: "move-status", task: Task, newStatus: TaskStatus): void;
}>();

function formatTime(dateStr: string) {
	const d = new Date(dateStr);
	if (isNaN(d.getTime())) return "";
	return d.toLocaleTimeString(undefined, {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}

function getTaskMenuItems(task: Task): DropdownMenuItem[][] {
	return [
		[
			{
				label: "Edit Task",
				icon: "i-lucide-pencil",
				onSelect: () => emit("edit-task", task),
			},
			{
				label: task.status === "DONE" ? "Mark as To Do" : "Mark as Done",
				icon: task.status === "DONE" ? "i-lucide-check-circle" : "i-lucide-circle",
				onSelect: () => emit("move-status", task, task.status === "DONE" ? "TODO" : "DONE"),
			},
			{
				type: "separator" as const,
			},
			{
				label: "Delete Task",
				icon: "i-lucide-trash-2",
				color: "error" as const,
				onSelect: () => emit("delete-task", task),
			},
		],
	];
}
</script>
