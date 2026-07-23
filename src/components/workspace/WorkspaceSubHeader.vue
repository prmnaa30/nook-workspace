<template>
	<div class="flex items-center justify-between gap-4 py-2 px-1 mb-3 shrink-0 border-b border-neutral-200/60 dark:border-neutral-800/60 select-none">
		<div class="flex items-center gap-2.5 min-w-0">
			<h2 class="text-base font-bold text-neutral-900 dark:text-neutral-100 truncate">
				{{ title }}
			</h2>

			<UBadge
				v-if="itemCount !== undefined"
				color="neutral"
				variant="subtle"
				size="sm"
				class="font-mono font-medium shrink-0"
			>
				{{ itemCount }} {{ itemUnit || 'items' }}
			</UBadge>

			<p v-if="description" class="hidden lg:block text-xs text-neutral-400 dark:text-neutral-500 truncate ml-2">
				{{ description }}
			</p>
		</div>

		<div class="flex items-center gap-2 shrink-0">
			<slot name="extra-actions"></slot>

			<div v-if="searchQuery !== undefined" class="relative flex items-center">
				<UInput
					v-model="searchQuery"
					type="text"
					icon="i-ph-magnifying-glass"
					:placeholder="searchPlaceholder || 'Search...'"
					color="neutral"
					variant="outline"
					size="sm"
					class="w-36 sm:w-48 font-medium"
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

			<UDropdownMenu
				v-if="sortOptions && sortOptions.length > 0"
				:items="dropdownSortItems"
				:content="{ align: 'end' }"
			>
				<UButton
					color="neutral"
					variant="outline"
					size="sm"
					icon="i-ph-arrows-down-up"
					class="cursor-pointer font-medium"
					title="Sort Items"
				>
					<span class="hidden sm:inline">Sort: {{ activeSortLabel }}</span>
				</UButton>
			</UDropdownMenu>

			<UButton
				v-if="actionLabel"
				:icon="actionIcon || 'i-ph-plus-bold'"
				color="primary"
				size="sm"
				class="cursor-pointer font-medium shrink-0"
				@click="$emit('action')"
			>
				{{ actionLabel }}
			</UButton>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { DropdownMenuItem } from "@nuxt/ui";

const props = defineProps<{
	title: string;
	description?: string;
	itemCount?: number;
	itemUnit?: string;
	searchPlaceholder?: string;
	sortOptions?: { label: string; value: string }[];
	actionLabel?: string;
	actionIcon?: string;
}>();

defineEmits<{
	(e: "action"): void;
}>();

const searchQuery = defineModel<string>("search");
const sortKey = defineModel<string>("sortKey");
const sortOrder = defineModel<"asc" | "desc">("sortOrder", { default: "asc" });

const activeSortLabel = computed(() => {
	if (!props.sortOptions || !sortKey.value) return "Default";
	const match = props.sortOptions.find((opt) => opt.value === sortKey.value);
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
	if (!props.sortOptions) return [];
	return [
		props.sortOptions.map((opt) => {
			const isActive = sortKey.value === opt.value;
			return {
				label: opt.label,
				icon: isActive
					? sortOrder.value === "asc"
						? "i-ph-arrow-up-bold"
						: "i-ph-arrow-down-bold"
					: "i-ph-minus",
				onSelect: () => handleSortSelect(opt.value),
				class: isActive ? "text-blue-500 font-bold" : "",
			};
		}),
	];
});
</script>
