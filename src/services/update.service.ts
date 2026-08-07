import { openUrl } from "@tauri-apps/plugin-opener";
import { commands } from "../bindings";
import { getAppVersion } from "./app-version";

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
		const res = await commands.getAppSetting(key);
		return ((res as any).data ?? res) as string | null;
	} catch (e) {
		console.warn(`Failed to read app_setting key '${key}':`, e);
		return null;
	}
}

export async function setAppSetting(key: string, value: string): Promise<void> {
	try {
		await commands.setAppSetting(key, value);
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
	let currentVersion = await getAppVersion();

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

export async function openReleasePage(url?: string) {
	const targetUrl = url || GITHUB_RELEASES_PAGE;
	try {
		await openUrl(targetUrl);
	} catch (e) {
		console.error("Failed to open release URL:", e);
	}
}

export async function notifyUpdateAvailable(latestVersion: string, releaseUrl?: string) {
	const url = releaseUrl || GITHUB_RELEASES_PAGE;
	try {
		await commands.showUpdateNotification(latestVersion, url);
	} catch (e) {
		console.warn("Could not show OS update notification:", e);
	}
}

export async function syncAutostartPreferenceOnBoot() {
	// Handled on boot directly in Rust backend
}

