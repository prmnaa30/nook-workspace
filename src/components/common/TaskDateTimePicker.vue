<template>
  <UPopover
    v-model:open="isOpen"
    :content="{ align: 'start', side: popoverSide || 'top', sideOffset: 8 }"
    :ui="{ content: 'z-[70]' }"
  >
    <div class="flex items-center gap-1">
      <UButton
        color="neutral"
        variant="outline"
        size="md"
        class="w-full justify-between font-normal text-left cursor-pointer"
        :class="modelValue ? 'text-neutral-800 dark:text-neutral-200' : 'text-neutral-400 dark:text-neutral-500'"
      >
        <div class="flex items-center gap-2 truncate">
          <UIcon name="i-lucide-calendar" class="size-4 text-blue-500 shrink-0" />
          <span class="truncate">{{ formattedDisplayLabel }}</span>
        </div>
        <UIcon name="i-lucide-chevron-down" class="size-3.5 opacity-50 shrink-0" />
      </UButton>

      <UButton
        v-if="modelValue"
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        size="xs"
        title="Clear due date"
        class="cursor-pointer shrink-0"
        @click.stop="clearDate"
      />
    </div>

    <template #content>
      <div class="p-3 flex flex-col gap-3 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800">
        <!-- Horizontal Side-by-Side Body: Calendar (Left) + Always Open Time Picker (Right) -->
        <div class="flex items-stretch gap-4 divide-x divide-neutral-200 dark:divide-neutral-800">
          <!-- Left: Nuxt UI Calendar Component -->
          <div class="flex flex-col items-center">
            <UCalendar v-model="calendarDateValue" size="sm" color="primary" />
          </div>

          <!-- Right: Always-Open Time Selector Panel -->
          <div class="pl-4 flex flex-col justify-between w-36 shrink-0">
            <!-- Time Header -->
            <div class="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800 mb-2">
              <div class="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                <UIcon name="i-lucide-clock" class="size-4 text-blue-500" />
                <span>Time</span>
              </div>
              <span class="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                {{ timeValue }}
              </span>
            </div>

            <!-- Always Open Time Columns (HH and MM) -->
            <div class="flex gap-1.5 h-52 select-none">
              <!-- Hours Column (00 - 23) -->
              <div class="flex-1 flex flex-col gap-1 overflow-y-auto pr-1 timepicker-scrollbar">
                <span class="text-[10px] text-center font-bold text-neutral-400 uppercase tracking-wider sticky top-0 bg-white dark:bg-neutral-900 py-0.5 z-10">HH</span>
                <UButton
                  v-for="h in hourOptions"
                  :key="'h-' + h"
                  :variant="selectedHour === h ? 'solid' : 'ghost'"
                  :color="selectedHour === h ? 'primary' : 'neutral'"
                  size="xs"
                  class="font-mono justify-center cursor-pointer"
                  @click="selectHour(h)"
                >
                  {{ h }}
                </UButton>
              </div>

              <div class="flex items-center text-neutral-400 font-bold self-center text-xs">:</div>

              <!-- Minutes Column (00 - 55, step 5) -->
              <div class="flex-1 flex flex-col gap-1 overflow-y-auto pl-1 timepicker-scrollbar">
                <span class="text-[10px] text-center font-bold text-neutral-400 uppercase tracking-wider sticky top-0 bg-white dark:bg-neutral-900 py-0.5 z-10">MM</span>
                <UButton
                  v-for="m in minuteOptions"
                  :key="'m-' + m"
                  :variant="selectedMinute === m ? 'solid' : 'ghost'"
                  :color="selectedMinute === m ? 'primary' : 'neutral'"
                  size="xs"
                  class="font-mono justify-center cursor-pointer"
                  @click="selectMinute(m)"
                >
                  {{ m }}
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Action Bar -->
        <div class="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <div class="text-[11px] text-neutral-500 font-mono truncate max-w-[220px]">
            {{ formattedDisplayLabel }}
          </div>

          <div class="flex items-center gap-2">
            <UButton
              v-if="modelValue"
              label="Clear"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="clearDate"
            />
            <UButton
              label="Done"
              color="primary"
              size="xs"
              @click="isOpen = false"
            />
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { CalendarDate, parseDate } from "@internationalized/date";

const props = defineProps<{
  modelValue?: string;
  popoverSide?: "top" | "bottom";
}>();

const emit = defineEmits<{
  (e: "update:modelValue", val: string): void;
}>();

const isOpen = ref(false);
const timeValue = ref("09:00");
const internalCalendarDate = ref<CalendarDate | null>(null);

const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

const selectedHour = computed(() => timeValue.value.split(":")[0] || "09");
const selectedMinute = computed(() => {
  const m = timeValue.value.split(":")[1] || "00";
  const mNum = parseInt(m, 10);
  if (isNaN(mNum)) return "00";
  const rounded = Math.round(mNum / 5) * 5;
  return String(rounded >= 60 ? 55 : rounded).padStart(2, "0");
});

function selectHour(h: string) {
  timeValue.value = `${h}:${selectedMinute.value}`;
  if (internalCalendarDate.value) {
    emitUpdatedDateTime();
  }
}

function selectMinute(m: string) {
  timeValue.value = `${selectedHour.value}:${m}`;
  if (internalCalendarDate.value) {
    emitUpdatedDateTime();
  }
}

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      try {
        const parts = newVal.split("T");
        if (parts[0]) {
          internalCalendarDate.value = parseDate(parts[0]);
        }
        if (parts[1]) {
          timeValue.value = parts[1].substring(0, 5);
        }
      } catch (e) {
        console.warn("Invalid date string for TaskDateTimePicker:", newVal);
      }
    } else {
      internalCalendarDate.value = null;
    }
  },
  { immediate: true }
);

watch(isOpen, (newVal) => {
  if (newVal && !props.modelValue) {
    const now = new Date();
    internalCalendarDate.value = new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
    emitUpdatedDateTime();
  }
});

const calendarDateValue = computed<any>({
  get: () => (internalCalendarDate.value as any) || undefined,
  set: (val: any) => {
    if (val) {
      internalCalendarDate.value = val;
      emitUpdatedDateTime();
    }
  },
});

watch(timeValue, () => {
  if (internalCalendarDate.value) {
    emitUpdatedDateTime();
  }
});

function emitUpdatedDateTime() {
  if (!internalCalendarDate.value) return;
  const year = internalCalendarDate.value.year;
  const month = String(internalCalendarDate.value.month).padStart(2, "0");
  const day = String(internalCalendarDate.value.day).padStart(2, "0");
  const isoStr = `${year}-${month}-${day}T${timeValue.value || "09:00"}`;
  emit("update:modelValue", isoStr);
}

function clearDate() {
  internalCalendarDate.value = null;
  emit("update:modelValue", "");
}

const formattedDisplayLabel = computed(() => {
  if (!props.modelValue) return "Select due date & time";
  const d = new Date(props.modelValue);
  if (isNaN(d.getTime())) return props.modelValue;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
});
</script>

<style scoped>
.timepicker-scrollbar::-webkit-scrollbar {
  width: 3px;
}
.timepicker-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.4);
  border-radius: 9999px;
}
</style>
