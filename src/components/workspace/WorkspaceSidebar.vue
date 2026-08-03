<template>
	<aside
		class="w-64 h-full flex flex-col bg-neutral-900 text-neutral-200 border-r border-neutral-800 shrink-0 select-none"
	>
		<!-- App Header Logo / Title -->
		<div class="p-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
			<div class="flex items-center gap-2.5">
				<img
					:src="AppLogo"
					class="size-10 rounded-lg"
				/>
				<div class="flex flex-col">
					<h1 class="font-bold text-base text-white tracking-wide">NOOK</h1>
					<span class="text-[10px] text-neutral-400 font-mono">Workstation Dock</span>
				</div>
			</div>
		</div>

		<!-- Navigation Menu List -->
		<div class="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
			<!-- Main Views Group -->
			<div class="flex flex-col gap-1">
				<span class="px-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider"
					>Navigation</span
				>

				<UButton
					variant="ghost"
					@click="workspaceStore.selectView('dashboard')"
					class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer"
					:class="
						workspaceStore.currentView === 'dashboard'
							? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
							: 'text-neutral-400 hover:bg-neutral-800/60 border border-transparent hover:text-neutral-200'
					"
				>
					<UIcon
						name="i-lucide-layout-dashboard"
						class="size-4 text-blue-400"
					/>
					<span>Dashboard</span>
				</UButton>

				<UButton
					variant="ghost"
					@click="workspaceStore.selectView('global-tasks')"
					class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer"
					:class="
						workspaceStore.currentView === 'global-tasks'
							? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
							: 'text-neutral-400 hover:bg-neutral-800/60 border border-transparent hover:text-neutral-200'
					"
				>
					<UIcon
						name="i-lucide-kanban"
						class="size-4 text-amber-400"
					/>
					<span>All Tasks</span>
				</UButton>

				<UButton
					variant="ghost"
					@click="workspaceStore.selectView('global-timeline')"
					class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer"
					:class="
						workspaceStore.currentView === 'global-timeline'
							? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
							: 'text-neutral-400 hover:bg-neutral-800/60 border border-transparent hover:text-neutral-200'
					"
				>
					<UIcon
						name="i-lucide-history"
						class="size-4 text-emerald-400"
					/>
					<span>All Timeline</span>
				</UButton>
			</div>

			<!-- Workspaces List Group -->
			<div class="flex flex-col gap-1">
				<div class="flex items-center justify-between px-3 mb-1">
					<span class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider"
						>Workspaces</span
					>
					<UButton
						icon="i-lucide-plus"
						color="neutral"
						variant="ghost"
						size="xs"
						class="cursor-pointer"
						title="Create Workspace"
						@click="openWorkspaceModal()"
					/>
				</div>

				<div
					v-if="workspaceStore.workspaces.length === 0"
					class="px-3 py-4 text-xs text-neutral-500 italic text-center"
				>
					No workspaces yet
				</div>

				<div
					v-else
					class="flex flex-col gap-1"
				>
					<WorkspaceCard
						v-for="ws in workspaceStore.workspaces"
						:key="ws.id"
						:workspace="ws"
						:is-selected="
							workspaceStore.currentView === 'workspace' &&
							workspaceStore.currentWorkspaceId === ws.id
						"
						@select="workspaceStore.selectWorkspace(ws.id)"
						@toggle-favorite="workspaceStore.toggleFavorite(ws.id, !ws.is_favorite)"
						@edit="openWorkspaceModal(ws)"
						@delete="triggerDeleteWorkspace(ws)"
					/>
				</div>
			</div>
		</div>

		<!-- Footer -->
		<div
			class="p-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400"
		>
			<span class="font-mono text-[11px]">Alt + W (Dock)</span>
			<UBadge
				color="neutral"
				variant="subtle"
				size="xs"
			>
				v1.3.2
			</UBadge>
		</div>

		<!-- Workspace Modal -->
		<WorkspaceFormModal
			ref="workspaceModalRef"
			@saved="workspaceStore.getWorkspaces()"
		/>

		<!-- Delete Workspace Modal -->
		<DeleteModal
			ref="deleteModalRef"
			delete-type="Workspace"
			:target="workspaceToDelete?.name || ''"
			@confirm="handleConfirmDelete"
		/>
	</aside>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { Workspace } from "../../services/workspaces.service";
import { useWorkspaceStore } from "../../stores/workspaces";
import WorkspaceCard from "./WorkspaceCard.vue";
import WorkspaceFormModal from "./WorkspaceFormModal.vue";
import DeleteModal from "../common/DeleteModal.vue";
import AppLogo from "../../assets/icons/icon.svg";

const workspaceStore = useWorkspaceStore();

const workspaceModalRef = ref<any>(null);
const deleteModalRef = ref<any>(null);
const workspaceToDelete = ref<Workspace | null>(null);

onMounted(() => {
	workspaceStore.getWorkspaces();
});

function openWorkspaceModal(workspace?: Workspace) {
	workspaceModalRef.value?.openModal(workspace);
}

function triggerDeleteWorkspace(workspace: Workspace) {
	workspaceToDelete.value = workspace;
	deleteModalRef.value?.openModal();
}

async function handleConfirmDelete() {
	if (workspaceToDelete.value) {
		await workspaceStore.deleteWorkspace(workspaceToDelete.value.id);
		workspaceToDelete.value = null;
	}
}
</script>
