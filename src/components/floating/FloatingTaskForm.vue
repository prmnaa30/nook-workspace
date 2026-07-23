<template>
	<div class="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col justify-between">
		<form id="quick-task-form" @submit.prevent="$emit('submit')" class="flex flex-col gap-3">
			<div class="flex flex-col gap-1">
				<label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Workspace *</label>
				<USelect
					v-model="targetWorkspaceId"
					:items="workspaceOptions"
					color="neutral"
					variant="outline"
					size="md"
					class="w-full"
				/>
			</div>

			<div class="flex flex-col gap-1">
				<label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Task Title *</label>
				<UInput
					ref="taskTitleInputRef"
					v-model="taskTitle"
					type="text"
					placeholder="What needs to be done?"
					required
					color="neutral"
					variant="outline"
					size="md"
					class="w-full font-medium"
					@keydown.esc.prevent="$emit('close-window')"
				/>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
				<div class="flex flex-col gap-1">
					<label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Due Date (Optional)</label>
					<TaskDateTimePicker v-model="taskDueDate" popover-side="top" />
				</div>
				<div class="flex flex-col gap-1">
					<label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description (Optional)</label>
					<UInput
						v-model="taskDescription"
						type="text"
						placeholder="Short details..."
						color="neutral"
						variant="subtle"
						size="md"
						class="w-full"
						@keydown.esc.prevent="$emit('close-window')"
					/>
				</div>
			</div>
		</form>

		<div class="flex justify-end gap-3 mt-4 pt-2 border-t border-slate-800/60">
			<UButton
				variant="soft"
				color="neutral"
				size="sm"
				@click="$emit('close-window')"
			>
				Cancel
			</UButton>
			<UButton
				type="submit"
				form="quick-task-form"
				color="primary"
				size="sm"
				icon="i-ph-plus-bold"
				class="cursor-pointer font-medium"
			>
				Create Task
			</UButton>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import TaskDateTimePicker from "../common/TaskDateTimePicker.vue";

defineProps<{
	workspaceOptions: { label: string; value: number }[];
}>();

defineEmits<{
	(e: "submit"): void;
	(e: "close-window"): void;
}>();

const targetWorkspaceId = defineModel<number | undefined>("targetWorkspaceId");
const taskTitle = defineModel<string>("taskTitle", { default: "" });
const taskDescription = defineModel<string>("taskDescription", { default: "" });
const taskDueDate = defineModel<string>("taskDueDate", { default: "" });

const taskTitleInputRef = ref<any>(null);

function focusTitleInput() {
	if (!taskTitleInputRef.value) return;
	const comp = taskTitleInputRef.value;
	if (typeof comp.focus === "function") {
		comp.focus();
	}
	const el = comp.$el?.querySelector ? comp.$el.querySelector("input") : comp.inputRef;
	if (el && typeof el.focus === "function") {
		el.focus();
	}
}

defineExpose({ focusTitleInput });
</script>
