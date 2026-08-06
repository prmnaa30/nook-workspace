import Database from "@tauri-apps/plugin-sql";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";

const GITHUB_RELEASES_API = "https://api.github.com/repos/prmnaa30/nook-workspace/releases/latest";
const GITHUB_RELEASES_PAGE = "https://github.com/prmnaa30/nook-workspace/releases";

export interface UpdateCheckResult {
	hasUpdate: boolean;
	latestVersion?: string;
	releaseUrl?: string;
	currentVersion: string;
	error?: string;
}

export async function getAppSetting(key: string): Promise<string | null> {
	try {
		const db = await Database.load("sqlite:workstation.db");
		const rows: any[] = await db.select("SELECT value FROM app_settings WHERE key = $1", [key]);
		return rows.length > 0 ? rows[0].value : null;
	} catch (e) {
		console.warn(`Failed to read app_setting key '${key}':`, e);
		return null;
	}
}

export async function setAppSetting(key: string, value: string): Promise<void> {
	try {
		const db = await Database.load("sqlite:workstation.db");
		await db.execute(
			"INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP",
			[key, value]
		);
	} catch (e) {
		console.warn(`Failed to set app_setting key '${key}':`, e);
	}
}

export function isNewerVersion(latest: string, current: string): boolean {
	const cleanVersion = (v: string) => v.replace(/^v/i, "").trim();
	const lParts = cleanVersion(latest).split(".").map((n) => parseInt(n, 10) || 0);
	const cParts = cleanVersion(current).split(".").map((n) => parseInt(n, 10) || 0);

	for (let i = 0; i < Math.max(lParts.length, cParts.length); i++) {
		const l = lParts[i] || 0;
		const c = cParts[i] || 0;
		if (l > c) return true;
		if (l < c) return false;
	}
	return false;
}

export async function checkForUpdates(isAutoCheck = false): Promise<UpdateCheckResult | null> {
	let currentVersion = "1.4.0";
	try {
		currentVersion = await getVersion();
	} catch (e) {
		console.warn("Could not fetch app version from Tauri:", e);
	}

	if (isAutoCheck) {
		const lastCheck = await getAppSetting("last_update_check_at");
		if (lastCheck) {
			const elapsedMs = Date.now() - new Date(lastCheck).getTime();
			const twentyFourHoursMs = 24 * 60 * 60 * 1000;
			if (elapsedMs < twentyFourHoursMs) {
				return null; // Skip check due to 24h throttling
			}
		}
	}

	try {
		const res = await fetch(GITHUB_RELEASES_API, {
			headers: {
				Accept: "application/vnd.github.v3+json",
			},
		});

		if (!res.ok) {
			throw new Error(`GitHub API returned status ${res.status}`);
		}

		const data = await res.json();
		const latestTag = data.tag_name || "";
		const releaseUrl = data.html_url || GITHUB_RELEASES_PAGE;

		await setAppSetting("last_update_check_at", new Date().toISOString());

		if (isNewerVersion(latestTag, currentVersion)) {
			await setAppSetting("latest_known_version", latestTag);
			return {
				hasUpdate: true,
				latestVersion: latestTag,
				releaseUrl,
				currentVersion,
			};
		}

		return {
			hasUpdate: false,
			latestVersion: latestTag,
			releaseUrl,
			currentVersion,
		};
	} catch (e: any) {
		console.error("Update check failed:", e);
		return {
			hasUpdate: false,
			currentVersion,
			error: e?.message || "Failed to connect to update server",
		};
	}
}

export async function notifyUpdateAvailable(latestVersion: string) {
	try {
		let permissionGranted = await isPermissionGranted();
		if (!permissionGranted) {
			const permission = await requestPermission();
			permissionGranted = permission === "granted";
		}
		if (permissionGranted) {
			sendNotification({
				title: "Nook Update Available",
				body: `Version ${latestVersion} is available on GitHub! Click to check release notes.`,
			});
		}
	} catch (e) {
		console.warn("Could not send OS notification:", e);
	}
}

export async function openReleasePage(url?: string) {
	const targetUrl = url || GITHUB_RELEASES_PAGE;
	try {
		await openUrl(targetUrl);
	} catch (e) {
		console.error("Failed to open release URL:", e);
	}
}

export async function syncAutostartPreferenceOnBoot() {
	try {
		const { enable, disable, isEnabled } = await import("@tauri-apps/plugin-autostart");
		const preference = await getAppSetting("autostart_preference");

		if (preference === "disabled") {
			// User explicitly disabled autostart, ensure it remains disabled even after installer/updates
			const currentlyEnabled = await isEnabled();
			if (currentlyEnabled) {
				await disable();
			}
		} else if (preference === "enabled") {
			// User explicitly enabled autostart, ensure it remains enabled
			const currentlyEnabled = await isEnabled();
			if (!currentlyEnabled) {
				await enable();
			}
		} else {
			// Fresh install: default to enabled
			const currentlyEnabled = await isEnabled();
			if (!currentlyEnabled) {
				await enable();
			}
			await setAppSetting("autostart_preference", "enabled");
		}
	} catch (e) {
		console.warn("Could not sync autostart preference on boot:", e);
	}
}

