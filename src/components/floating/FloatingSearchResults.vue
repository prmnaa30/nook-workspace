<template>
	<div class="flex-1 flex flex-col min-h-0">
		<div
			ref="listContainerRef"
			class="flex-1 overflow-y-auto custom-scrollbar p-2"
		>
			<div
				v-if="items.length === 0"
				class="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 text-sm gap-2"
			>
				<span class="text-2xl opacity-60">{{ searchQuery ? '🔍' : '📌' }}</span>
				<p v-if="searchQuery">No results found for "{{ searchQuery }}"</p>
				<div v-else class="flex flex-col gap-1 items-center max-w-xs">
					<p class="font-medium text-slate-400">No pinned shortcuts or notes</p>
					<p class="text-xs text-slate-500">Click the pin icon (📌) on any shortcut or note in the main window to add it to Quick Access.</p>
				</div>
			</div>

			<div v-else class="flex flex-col gap-4">
				<div
					v-for="group in groupedItems"
					:key="group.workspaceName"
					class="flex flex-col gap-1"
				>
					<div class="px-2 py-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
						<span class="size-1.5 rounded-full bg-indigo-500/80"></span>
						<span>{{ group.workspaceName }}</span>
					</div>

					<div
						v-for="entry in group.items"
						:key="entry.item.searchType + '-' + entry.item.id"
						class="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all border"
						:class="
							entry.globalIndex === activeIndex
								? 'bg-slate-900 border-transparent text-white shadow-md active-item'
								: 'bg-transparent border-transparent text-slate-300 hover:bg-slate-900/50'
						"
						@click="$emit('select-item', entry.item)"
					>
						<div class="flex items-center gap-3 truncate">
							<span class="text-base flex-shrink-0">
								<span v-if="entry.item.searchType === 'note'">📝</span>
								<span v-else-if="entry.item.type === 'web'">🌐</span>
								<span v-else-if="entry.item.type === 'folder'">📁</span>
								<span v-else>📄</span>
							</span>
							<div class="flex flex-col truncate">
								<span class="font-medium text-sm truncate">{{ entry.item.title }}</span>
								<span class="text-[11px] text-slate-500 truncate font-mono mt-0.5">
									{{ entry.item.searchType === "note" ? entry.item.filename : entry.item.path }}
								</span>
							</div>
						</div>

						<div class="flex items-center gap-2 flex-shrink-0 ml-4">
							<span
								class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
								:class="
									entry.item.searchType === 'note'
										? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
										: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
								"
							>
								{{ entry.item.searchType }}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";

const props = defineProps<{
	items: any[];
	activeIndex: number;
	searchQuery: string;
}>();

defineEmits<{
	(e: "select-item", item: any): void;
}>();

const listContainerRef = ref<HTMLDivElement | null>(null);

const groupedItems = computed(() => {
	const groups: Record<string, Array<{ item: any; globalIndex: number }>> = {};

	props.items.forEach((item, index) => {
		const wsName = item.workspace_name || "General";
		if (!groups[wsName]) {
			groups[wsName] = [];
		}
		groups[wsName].push({ item, globalIndex: index });
	});

	return Object.keys(groups).map((wsName) => ({
		workspaceName: wsName,
		items: groups[wsName],
	}));
});

watch(
	() => props.activeIndex,
	() => {
		nextTick(() => {
			if (!listContainerRef.value) return;
			const activeEl = listContainerRef.value.querySelector(".active-item") as HTMLElement;
			if (activeEl) {
				activeEl.scrollIntoView({
					block: "nearest",
					behavior: "smooth",
				});
			}
		});
	}
);
</script>
