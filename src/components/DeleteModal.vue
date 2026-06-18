<template>
  <UModal
    v-model:open="isOpen"
    title="Confirm Delete"
    class="max-w-md"
    :ui="{
      footer: 'self-end'
    }"
  >
    <template #body>
      <div class="space-y-2">
        <p class="text-text">
          Are you sure you want to delete <span class="font-medium text-text">{{ deleteType.toLowerCase() }}</span> "<span
            class="font-medium text-text">{{ target }}</span>"?
        </p>
        <p class="text-text-secondary text-sm">
          This action cannot be undone.
        </p>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex gap-3">
        <UButton variant="soft" @click="close"
          class="px-4 py-1.5 bg-surface hover:bg-surface-hover border border-border rounded-md text-text-secondary hover:text-text text-sm transition-colors whitespace-nowrap cursor-pointer">
          Cancel
        </UButton>

        <UButton variant="solid" color="red" @click="handleConfirm"
          class="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-all cursor-pointer">
          Delete
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  deleteType: string;
  target: string;
}>();

const emit = defineEmits(['confirm']);

const isOpen = ref(false);

function openModal() {
  isOpen.value = true;
}

function closeModal() {
  isOpen.value = false;
}

function handleConfirm() {
  emit('confirm');
  closeModal();
}

defineExpose({
  openModal
});
</script>
