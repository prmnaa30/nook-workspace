<template>
	<div
		class="flex flex-col h-full bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800"
	>
		<!-- Calendar Header with Month/Year Popover Picker and Day Names-->
		<div
			class="flex flex-col w-full items-center justify-between border-b border-neutral-200 dark:border-neutral-800 shrink-0 select-none"
		>
			<div class="w-full p-3 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<!-- Clickable Month/Year Popover Picker-->
					<UPopover
						v-model:open="isDatePickerOpen"
						:content="{ align: 'start' }"
					>
						<UButton
							color="neutral"
							variant="ghost"
							trailing-icon="i-ph-caret-down-bold"
							class="text-base font-bold font-mono cursor-pointer"
						>
							{{ monthYearTitle }}
						</UButton>

						<template #content>
							<div
								class="p-2 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800"
							>
								<UCalendar
									v-model="calendarPickerValue"
									@update:model-value="onMonthPicked"
								/>
							</div>
						</template>
					</UPopover>

					<UButton
						variant="soft"
						color="neutral"
						size="xs"
						class="font-medium cursor-pointer"
						@click="goToToday"
					>
						Today
					</UButton>
				</div>

				<div class="flex items-center gap-1">
					<UButton
						icon="i-ph-caret-left-bold"
						color="neutral"
						variant="ghost"
						size="xs"
						title="Previous Month"
						class="cursor-pointer"
						@click="prevMonth"
					/>
					<UButton
						icon="i-ph-caret-right-bold"
						color="neutral"
						variant="ghost"
						size="xs"
						title="Next Month"
						class="cursor-pointer"
						@click="nextMonth"
					/>
				</div>
			</div>

			<!-- Day Names Row -->
			<div
				class="w-full grid grid-cols-7 border-b border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 py-2 shrink-0 select-none"
			>
				<div
					v-for="day in dayNames"
					:key="day"
				>
					{{ day }}
				</div>
			</div>
		</div>

		<!-- Calendar Grid (7 columns x 6 rows) -->
		<section class="overflow-y-scroll">
			<div
				class="flex-1 grid grid-cols-7 grid-rows-6 divide-x divide-y divide-neutral-200 dark:divide-neutral-800/80 min-h-0 overflow-y-auto custom-scrollbar"
			>
				<div
					v-for="cell in calendarCells"
					:key="cell.dateKey"
					@click="openDayModal(cell)"
					class="flex flex-col p-2 min-h-[90px] transition-all relative group cursor-pointer"
					:class="[
						cell.isCurrentMonth
							? 'bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
							: 'bg-neutral-100/50 dark:bg-neutral-900/30 text-neutral-400 dark:text-neutral-600 opacity-50',
						cell.isToday ? 'ring-2 ring-inset ring-blue-500 bg-blue-500/5 dark:bg-blue-500/10' : '',
					]"
				>
					<!-- Top Header of Cell: Day Number & Task Count -->
					<div class="flex items-center justify-between mb-1 shrink-0 select-none">
						<span
							class="text-xs font-mono px-2 py-0.5 rounded-full font-bold"
							:class="[
								cell.isToday
									? 'bg-blue-600 text-white shadow-xs'
									: cell.isCurrentMonth
										? 'text-neutral-800 dark:text-neutral-200'
										: 'text-neutral-400 dark:text-neutral-600',
							]"
						>
							{{ cell.dayNumber }}
						</span>

						<UBadge
							v-if="cell.tasks.length > 0"
							color="primary"
							variant="subtle"
							size="xs"
							class="font-mono text-[10px]"
						>
							{{ cell.tasks.length }} {{ cell.tasks.length === 1 ? "task" : "tasks" }}
						</UBadge>
					</div>

					<!-- Task Chips List Preview -->
					<div class="flex-1 flex flex-col gap-1 overflow-hidden pr-0.5">
						<div
							v-for="task in cell.tasks.slice(0, 2)"
							:key="task.id"
							class="px-2 py-0.5 rounded text-[11px] font-medium border truncate flex items-center justify-between gap-1 shadow-2xs"
							:class="getTaskChipClass(task)"
						>
							<span
								class="truncate"
								:class="{ 'line-through opacity-70': task.status === 'DONE' }"
							>
								{{ task.title }}
							</span>
						</div>

						<span
							v-if="cell.tasks.length > 2"
							class="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono mt-0.5"
						>
							+{{ cell.tasks.length - 2 }} more
						</span>
					</div>

					<!-- Hover "View tasks" Hint -->
					<div
						v-if="cell.isCurrentMonth"
						class="absolute bottom-1.5 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold text-blue-500 flex items-center gap-0.5 pointer-events-none"
					>
						<span>View tasks</span>
						<UIcon
							name="i-ph-arrow-right-bold"
							class="size-3"
						/>
					</div>
				</div>
			</div>
		</section>

		<!-- Modal Listing Day Tasks -->
		<UModal
			v-model:open="isDayModalOpen"
			:title="selectedCell ? `Tasks for ${formatFullDate(selectedCell.dateKey)}` : 'Day Tasks'"
			close-icon="i-lucide-x"
		>
			<template #body>
				<div
					v-if="selectedCell"
					class="flex flex-col gap-4"
				>
					<div
						v-if="selectedCell.tasks.length === 0"
						class="py-8 text-center text-sm text-neutral-400 italic"
					>
						No tasks scheduled for this day.
					</div>

					<div
						v-else
						class="flex flex-col gap-2 max-h-96 overflow-y-auto custom-scrollbar pr-1"
					>
						<div
							v-for="task in selectedCell.tasks"
							:key="task.id"
							class="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60"
						>
							<div class="flex items-start gap-3">
								<UButton
									color="neutral"
									variant="ghost"
									size="xs"
									:icon="task.status === 'DONE' ? 'i-ph-check-circle-fill' : 'i-ph-circle'"
									class="cursor-pointer"
									:class="task.status === 'DONE' ? 'text-emerald-500' : ''"
									:title="task.status === 'DONE' ? 'Mark To Do' : 'Mark Done'"
									@click="$emit('move-status', task, task.status === 'DONE' ? 'TODO' : 'DONE')"
								/>

								<div class="flex flex-col">
									<span
										class="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
										:class="{
											'line-through text-neutral-400 dark:text-neutral-500': task.status === 'DONE',
										}"
									>
										{{ task.title }}
									</span>
									<p
										v-if="task.description"
										class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5"
									>
										{{ task.description }}
									</p>
									<span
										v-if="task.workspace_name"
										class="text-[10px] text-blue-500 font-mono mt-1"
									>
										{{ task.workspace_name }}
									</span>
								</div>
							</div>

							<div class="flex items-center gap-2">
								<UButton
									icon="i-ph-pencil"
									color="neutral"
									variant="ghost"
									size="xs"
									title="Edit Task"
									class="cursor-pointer"
									@click="triggerEditTaskFromModal(task)"
								/>
								<UButton
									icon="i-ph-trash"
									color="error"
									variant="ghost"
									size="xs"
									title="Delete Task"
									class="cursor-pointer"
									@click="triggerDeleteTaskFromModal(task)"
								/>
							</div>
						</div>
					</div>
				</div>
			</template>

			<template #footer="{ close }">
				<div class="flex justify-end">
					<UButton
						color="neutral"
						variant="soft"
						@click="close"
						>Close</UButton
					>
				</div>
			</template>
		</UModal>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { Task, TaskStatus } from "../../services/tasks.service";

const props = defineProps<{
	tasks: Task[];
}>();

const emit = defineEmits<{
	(e: "select-task", task: Task): void;
	(e: "edit-task", task: Task): void;
	(e: "delete-task", task: Task): void;
	(e: "move-status", task: Task, newStatus: TaskStatus): void;
}>();

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const currentDate = ref(new Date());
const isDatePickerOpen = ref(false);
const calendarPickerValue = ref<any>(undefined);

const isDayModalOpen = ref(false);
const selectedCell = ref<CalendarCell | null>(null);

const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth());

const monthYearTitle = computed(() => {
	return currentDate.value.toLocaleDateString(undefined, {
		month: "long",
		year: "numeric",
	});
});

function prevMonth() {
	currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1);
}

function nextMonth() {
	currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1);
}

function goToToday() {
	currentDate.value = new Date();
}

function onMonthPicked(val: any) {
	if (val) {
		const dateObj = new Date(val);
		if (!isNaN(dateObj.getTime())) {
			currentDate.value = dateObj;
		}
	}
	isDatePickerOpen.value = false;
}

function openDayModal(cell: CalendarCell) {
	selectedCell.value = cell;
	isDayModalOpen.value = true;
}

function triggerEditTaskFromModal(task: Task) {
	isDayModalOpen.value = false;
	emit("edit-task", task);
}

function triggerDeleteTaskFromModal(task: Task) {
	isDayModalOpen.value = false;
	emit("delete-task", task);
}

interface CalendarCell {
	dateKey: string;
	dayNumber: number;
	isCurrentMonth: boolean;
	isToday: boolean;
	tasks: Task[];
}

const calendarCells = computed<CalendarCell[]>(() => {
	const year = currentYear.value;
	const month = currentMonth.value;

	const firstDayOfMonth = new Date(year, month, 1);
	const startingDayOfWeek = firstDayOfMonth.getDay();

	const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
	const daysInPrevMonth = new Date(year, month, 0).getDate();

	const today = new Date();
	const todayKey = formatDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate());

	const cells: CalendarCell[] = [];

	const tasksByDateMap = new Map<string, Task[]>();
	for (const task of props.tasks) {
		if (!task.due_date) continue;
		const d = new Date(task.due_date);
		if (isNaN(d.getTime())) continue;
		const key = formatDateKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
		if (!tasksByDateMap.has(key)) {
			tasksByDateMap.set(key, []);
		}
		tasksByDateMap.get(key)!.push(task);
	}

	for (let i = startingDayOfWeek - 1; i >= 0; i--) {
		const dayNum = daysInPrevMonth - i;
		const prevMonthDate = new Date(year, month - 1, dayNum);
		const key = formatDateKey(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, dayNum);
		cells.push({
			dateKey: key,
			dayNumber: dayNum,
			isCurrentMonth: false,
			isToday: key === todayKey,
			tasks: tasksByDateMap.get(key) || [],
		});
	}

	for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
		const key = formatDateKey(year, month + 1, dayNum);
		cells.push({
			dateKey: key,
			dayNumber: dayNum,
			isCurrentMonth: true,
			isToday: key === todayKey,
			tasks: tasksByDateMap.get(key) || [],
		});
	}

	const remainingCells = 42 - cells.length;
	for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
		const nextMonthDate = new Date(year, month + 1, dayNum);
		const key = formatDateKey(nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1, dayNum);
		cells.push({
			dateKey: key,
			dayNumber: dayNum,
			isCurrentMonth: false,
			isToday: key === todayKey,
			tasks: tasksByDateMap.get(key) || [],
		});
	}

	return cells;
});

function formatDateKey(year: number, month: number, day: number): string {
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${year}-${pad(month)}-${pad(day)}`;
}

function formatFullDate(dateKey: string) {
	const d = new Date(dateKey);
	if (isNaN(d.getTime())) return dateKey;
	return d.toLocaleDateString(undefined, {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric",
	});
}

function getTaskChipClass(task: Task) {
	if (task.status === "DONE") {
		return "bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400";
	}
	if (task.status === "IN_PROGRESS") {
		return "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300";
	}
	return "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300";
}
</script>
