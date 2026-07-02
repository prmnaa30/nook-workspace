<template>
	<div class="flex flex-1 h-screen w-screen bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
		<USidebar
			v-model:open="open"
			variant="inset"
			collapsible="icon"
			:ui="{
				container: 'h-full',
			}"
			class="border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 shrink-0"
		>
			<template #header>
				<div class="flex items-center gap-2.5 px-1 py-1">
					<div
						class="flex items-center justify-center rounded-lg border border-slate-950 overflow-hidden"
					>
						<img
							:src="AppLogo"
							class="size-8 object-contain"
							draggable="false"
						/>
					</div>
					<div class="flex flex-col leading-none">
						<span class="font-bold text-neutral-800 dark:text-neutral-200">Nook</span>
						<span class="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5"
							>Your Workflow Manager</span
						>
					</div>
				</div>
			</template>

			<!-- Sidebar Content -->
			<div class="flex flex-col gap-4 flex-1 overflow-y-auto">
				<!-- Search bar -->
				<div class="px-1">
					<UInput
						v-model="searchQuery"
						icon="i-ph-magnifying-glass"
						placeholder="Search workspaces..."
						color="neutral"
						variant="outline"
						class="w-full"
						size="md"
						:ui="{
							base: 'ring-slate-700 focus-visible:ring-1 focus-visible:ring-slate-500 transition-all duration-200',
						}"
					/>
				</div>

				<div class="flex-1 overflow-y-auto pr-1">
					<!-- Favorites Section -->
					<div
						v-if="favoriteWorkspaces.length > 0"
						class="mb-5"
					>
						<div
							class="px-2 mb-1.5 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider"
						>
							Favorites
						</div>
						<div class="space-y-0.5">
							<WorkspaceCard
								v-for="ws in favoriteWorkspaces"
								:key="ws.id"
								:workspace="ws"
								:current-workspace-id="store.currentWorkspaceId!"
								@select-workspace="selectWs(ws)"
								@toggle-favorites="toggleFavorite(ws)"
								@trigger-delete-modal="triggerDeleteModal(ws)"
								@trigger-edit-modal="triggerEditModal(ws)"
							/>
						</div>
					</div>

					<!-- Recents Section -->
					<div>
						<div
							class="px-2 mb-1.5 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider"
						>
							Workspaces
						</div>
						<div
							v-if="filteredWorkspaces.length === 0"
							class="px-2 py-3 text-xs text-neutral-400 dark:text-neutral-500 italic"
						>
							{{ searchQuery ? "No matches found" : "No workspaces yet" }}
						</div>
						<div class="space-y-0.5">
							<WorkspaceCard
								v-for="ws in recentWorkspaces"
								:key="ws.id"
								:workspace="ws"
								:current-workspace-id="store.currentWorkspaceId!"
								@select-workspace="selectWs(ws)"
								@toggle-favorites="toggleFavorite(ws)"
								@trigger-delete-modal="triggerDeleteModal(ws)"
								@trigger-edit-modal="triggerEditModal(ws)"
							/>
						</div>
					</div>
				</div>
			</div>

			<!-- Add Workspace Form & Button in Sidebar Footer -->
			<template #footer>
				<div class="w-full px-1">
					<UButton
						icon="i-ph-plus"
						label="Add Workspace"
						color="neutral"
						variant="ghost"
						class="w-full justify-start text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 border border-dashed border-neutral-800 cursor-pointer"
						@click="triggerAddModal"
					/>
					<WorkspaceFormModal
						ref="workspaceFormModalRef"
						:initial-value="workspaceToEdit!"
					/>
				</div>
			</template>
		</USidebar>

		<!-- Main Content Pane -->
		<div
			class="flex-1 flex flex-col overflow-hidden m-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm"
		>
			<div class="flex-1 overflow-hidden">
				<slot></slot>
			</div>
		</div>

		<!-- Workspace Delete Modal -->
		<DeleteModal
			ref="deleteModalRef"
			delete-type="Workspace"
			:target="workspaceToDelete?.name || ''"
			@confirm="handleConfirmDelete"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import type { Workspace } from "../../services/workspaces.service.ts";
import { useWorkspaceStore } from "../../stores/workspaces.ts";
import AppLogo from "../../assets/icons/icon.svg";

const store = useWorkspaceStore();

const open = ref(true);
const searchQuery = ref("");

const workspaceFormModalRef = ref<any>(null);
const workspaceToEdit = ref<Workspace | null>(null);

const deleteModalRef = ref<any>(null);
const workspaceToDelete = ref<Workspace | null>(null);

const filteredWorkspaces = computed(() => {
	if (!searchQuery.value) return store.workspaces;
	const lowerQuery = searchQuery.value.toLowerCase();
	return store.workspaces.filter((ws) => ws.name.toLowerCase().includes(lowerQuery));
});

const favoriteWorkspaces = computed(() => {
	return filteredWorkspaces.value
		.filter((ws) => ws.is_favorite === 1)
		.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
});

const recentWorkspaces = computed(() => {
	return filteredWorkspaces.value
		.filter((ws) => ws.is_favorite !== 1)
		.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
});

function selectWs(ws: Workspace) {
	store.selectWorkspace(ws.id);
}

async function toggleFavorite(ws: Workspace) {
	const newStatus = ws.is_favorite === 1 ? false : true;
	await store.toggleFavorite(ws.id, newStatus);
}

function triggerDeleteModal(ws: Workspace) {
	workspaceToDelete.value = ws;
	deleteModalRef.value?.openModal();
}

async function handleConfirmDelete() {
	if (workspaceToDelete.value) {
		await store.deleteWorkspace(workspaceToDelete.value.id);
		workspaceToDelete.value = null;
	}
}

function triggerAddModal() {
	workspaceToEdit.value = null;
	nextTick(() => {
		workspaceFormModalRef.value?.openModal();
	});
}

function triggerEditModal(ws: Workspace) {
	workspaceToEdit.value = ws;
	nextTick(() => {
		workspaceFormModalRef.value?.openModal(ws);
	});
}
</script>
