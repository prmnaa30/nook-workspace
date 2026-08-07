<template>
	<UModal
		v-model:open="isOpen"
		title="Settings"
		close-icon="i-lucide-x"
		:ui="{ content: 'z-[60]', overlay: 'z-[55]' }"
	>
		<template #body>
			<div class="flex flex-col gap-6 py-2">
				<!-- General Settings Section -->
				<div class="flex flex-col gap-4">
					<h3 class="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1">
						System Preferences
					</h3>

					<div class="flex flex-col rounded-xl bg-neutral-900 border border-neutral-800 divide-y divide-neutral-800">
						<div class="flex items-center justify-between p-3.5">
							<div class="flex flex-col gap-0.5">
								<span class="text-sm font-medium text-neutral-200">Launch at startup</span>
								<span class="text-xs text-neutral-400">Automatically start Nook when Windows starts</span>
							</div>
							<USwitch
								v-model="autostartEnabled"
								:loading="isAutostartLoading"
								@update:model-value="handleAutostartToggle"
							/>
						</div>

						<div class="flex items-center justify-between p-3.5">
							<div class="flex flex-col gap-0.5">
								<span class="text-sm font-medium text-neutral-200">Show agenda on startup</span>
								<span class="text-xs text-neutral-400">Show task summary notification when Nook starts</span>
							</div>
							<USwitch
								v-model="startupNotificationEnabled"
								:loading="isStartupNotificationLoading"
								@update:model-value="handleStartupNotificationToggle"
							/>
						</div>
					</div>
				</div>

				<!-- Application Info & Update Section -->
				<div class="flex flex-col gap-4">
					<h3 class="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
						About & Updates
					</h3>

					<div class="flex items-center justify-between p-3 rounded-xl bg-neutral-900 border border-neutral-800">
						<div class="flex items-center gap-3">
							<div class="p-2 rounded-lg bg-neutral-800 text-neutral-300">
								<UIcon name="i-lucide-info" class="size-5" />
							</div>
							<div class="flex flex-col gap-0.5">
								<span class="text-sm font-medium text-neutral-200">App Version</span>
								<span class="text-xs font-mono text-neutral-400">v{{ appVersion }}</span>
							</div>
						</div>
						<UButton
							color="neutral"
							variant="soft"
							size="xs"
							icon="i-lucide-refresh-cw"
							:loading="isCheckingUpdate"
							@click="handleCheckUpdate"
						>
							Check for updates
						</UButton>
					</div>
				</div>
			</div>
		</template>

		<template #footer="{ close }">
			<div class="flex w-full justify-end">
				<UButton
					variant="soft"
					color="neutral"
					@click="close"
				>
					Close
				</UButton>
			</div>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useToast } from "@nuxt/ui/composables";
import { getVersion } from "@tauri-apps/api/app";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import {
	checkForUpdates,
	notifyUpdateAvailable,
	openReleasePage,
	getAppSetting,
	setAppSetting,
} from "../../services/update.service";

const isOpen = ref(false);
const appVersion = ref("1.3.2");
const autostartEnabled = ref(false);
const isAutostartLoading = ref(false);
const startupNotificationEnabled = ref(true);
const isStartupNotificationLoading = ref(false);
const isCheckingUpdate = ref(false);
const toast = useToast();

async function loadSettings() {
	try {
		appVersion.value = await getVersion();
	} catch (e) {
		console.warn("Could not fetch app version:", e);
	}

	try {
		isAutostartLoading.value = true;
		autostartEnabled.value = await isEnabled();
	} catch (e) {
		console.warn("Could not check autostart status:", e);
	} finally {
		isAutostartLoading.value = false;
	}

	try {
		isStartupNotificationLoading.value = true;
		const pref = await getAppSetting("startup_notification_enabled");
		startupNotificationEnabled.value = pref !== "disabled";
	} catch (e) {
		console.warn("Could not check startup notification preference:", e);
	} finally {
		isStartupNotificationLoading.value = false;
	}
}

watch(isOpen, (newVal) => {
	if (newVal) {
		loadSettings();
	}
});

async function handleAutostartToggle(val: boolean) {
	try {
		isAutostartLoading.value = true;
		if (val) {
			await enable();
			await setAppSetting("autostart_preference", "enabled");
		} else {
			await disable();
			await setAppSetting("autostart_preference", "disabled");
		}
	} catch (e) {
		console.error("Failed to update autostart setting:", e);
		// Revert value on error
		autostartEnabled.value = !val;
	} finally {
		isAutostartLoading.value = false;
	}
}

async function handleStartupNotificationToggle(val: boolean) {
	try {
		isStartupNotificationLoading.value = true;
		await setAppSetting("startup_notification_enabled", val ? "enabled" : "disabled");
	} catch (e) {
		console.error("Failed to update startup notification setting:", e);
		startupNotificationEnabled.value = !val;
	} finally {
		isStartupNotificationLoading.value = false;
	}
}

async function handleCheckUpdate() {
	isCheckingUpdate.value = true;
	try {
		const res = await checkForUpdates(false);
		if (res?.hasUpdate && res.latestVersion) {
			await notifyUpdateAvailable(res.latestVersion);
			toast.add({
				title: `New Update Available (${res.latestVersion})`,
				description: `A newer version of Nook is available on GitHub Releases.`,
				icon: "i-lucide-arrow-up-circle",
				color: "primary",
				actions: [
					{
						label: "Open Release Page",
						onClick: () => openReleasePage(res.releaseUrl),
					},
				],
			});
		} else if (res?.error) {
			toast.add({
				title: "Update Check Failed",
				description: res.error,
				icon: "i-lucide-alert-circle",
				color: "error",
			});
		} else {
			toast.add({
				title: "Up to Date",
				description: `You are running the latest version of Nook (v${appVersion.value}).`,
				icon: "i-lucide-check-circle",
				color: "success",
			});
		}
	} catch (e: any) {
		toast.add({
			title: "Error",
			description: e?.message || "Failed to check for updates",
			icon: "i-lucide-alert-circle",
			color: "error",
		});
	} finally {
		isCheckingUpdate.value = false;
	}
}

function openModal() {
	isOpen.value = true;
}

defineExpose({
	openModal,
});
</script>
