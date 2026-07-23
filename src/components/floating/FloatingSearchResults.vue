<template>
	<div class="flex-1 flex flex-col min-h-0">
		<div
			ref="listContainerRef"
			class="flex-1 overflow-y-auto custom-scrollbar p-2"
		>
			<div
				v-if="items.length === 0"
				class="h-full flex items-center justify-center p-8 text-slate-500 text-sm"
			>
				{{ searchQuery ? `No results found for "${searchQuery}"` : "Nothing available to run." }}
			</div>

			<div v-else class="flex flex-col gap-1">
				<div
					v-for="(item, index) in items"
					:key="item.searchType + '-' + item.id"
					class="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all border"
					:class="
						index === activeIndex
							? 'bg-slate-900 border-transparent text-white shadow-md active-item'
							: 'bg-transparent border-transparent text-slate-300 hover:bg-slate-900/50'
					"
					@click="$emit('select-item', item)"
				>
					<div class="flex items-center gap-3 truncate">
						<span class="text-base flex-shrink-0">
							<span v-if="item.searchType === 'note'">📝</span>
							<span v-else-if="item.type === 'web'">🌐</span>
							<span v-else-if="item.type === 'folder'">📁</span>
							<span v-else>📄</span>
						</span>
						<div class="flex flex-col truncate">
							<span class="font-medium text-sm truncate">{{ item.title }}</span>
							<span class="text-[11px] text-slate-500 truncate font-mono mt-0.5">
								{{ item.searchType === "note" ? item.filename : item.path }}
							</span>
						</div>
					</div>

					<div class="flex items-center gap-2 flex-shrink-0 ml-4">
						<span
							v-if="item.workspace_name"
							class="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-full text-[10px] text-slate-400 font-medium"
						>
							{{ item.workspace_name }}
						</span>
						<span
							class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
							:class="
								item.searchType === 'note'
									? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
									: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
							"
						>
							{{ item.searchType }}
						</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";

const props = defineProps<{
	items: any[];
	activeIndex: number;
	searchQuery: string;
}>();

defineEmits<{
	(e: "select-item", item: any): void;
}>();

const listContainerRef = ref<HTMLDivElement | null>(null);

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
