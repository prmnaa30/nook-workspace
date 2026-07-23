<template>
	<div class="flex items-center gap-2">
		<!-- Search Input (Expandable) -->
		<div class="relative flex items-center">
			<UButton
				icon="i-ph-magnifying-glass"
				color="neutral"
				:variant="isSearchOpen ? 'soft' : 'ghost'"
				title="Search"
				size="xs"
				class="cursor-pointer"
				@click="toggleSearch"
			/>

			<div
				v-if="isSearchOpen"
				class="absolute right-0 top-0 flex items-center bg-neutral-900 border border-neutral-800 rounded-md shadow-lg z-20 overflow-hidden"
			>
				<UInput
					ref="searchInputRef"
					v-model="searchQuery"
					type="text"
					icon="i-ph-magnifying-glass"
					placeholder="Search..."
					color="neutral"
					variant="outline"
					size="xs"
					class="w-48 font-medium"
					@keydown.esc="closeSearch"
				>
					<template v-if="searchQuery" #trailing>
						<UButton
							v-if="searchQuery"
							color="neutral"
							variant="link"
							size="xs"
							icon="i-ph-x"
							class="p-0.5 cursor-pointer"
							title="Clear Search"
							@click="searchQuery = ''"
						/>
					</template>
				</UInput>
			</div>
		</div>

		<!-- Sort Dropdown -->
		<UDropdownMenu
			:items="dropdownItems"
			:content="{ align: 'end' }"
		>
			<UButton
				icon="i-ph-arrows-down-up"
				color="neutral"
				variant="ghost"
				size="xs"
				title="Sort"
				class="cursor-pointer"
			/>
		</UDropdownMenu>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import type { DropdownMenuItem } from "@nuxt/ui";

const props = defineProps<{
	sortOptions: { label: string; value: string }[];
}>();

const searchQuery = defineModel<string>("search", { default: "" });
const sortKey = defineModel<string>("sortKey", { default: "title" });
const sortOrder = defineModel<"asc" | "desc">("sortOrder", { default: "asc" });

const isSearchOpen = ref(false);
const searchInputRef = ref<HTMLInputElement | null>(null);

function toggleSearch() {
	isSearchOpen.value = !isSearchOpen.value;
	if (isSearchOpen.value) {
		nextTick(() => {
			searchInputRef.value?.focus();
		});
	}
}

function closeSearch() {
	isSearchOpen.value = false;
	searchQuery.value = "";
}

function handleSort(key: string) {
	if (sortKey.value === key) {
		sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
	} else {
		sortKey.value = key;
		sortOrder.value = "asc";
	}
}

const dropdownItems = computed<DropdownMenuItem[][]>(() => {
	return [
		props.sortOptions.map((option) => {
			const isActive = sortKey.value === option.value;
			return {
				label: option.label,
				icon: isActive
					? sortOrder.value === "asc"
						? "i-ph-arrow-up"
						: "i-ph-arrow-down"
					: "i-ph-minus",
				onSelect: () => handleSort(option.value),
				class: isActive ? "text-blue-500 font-medium" : "",
			};
		}),
	];
});
</script>
