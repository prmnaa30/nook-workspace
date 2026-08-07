import { getVersion } from "@tauri-apps/api/app";

let cachedVersion: string | null = null;

export async function getAppVersion(): Promise<string> {
	if (cachedVersion) {
		return cachedVersion;
	}

	try {
		cachedVersion = await getVersion();
		return cachedVersion;
	} catch (e) {
		console.warn("Could not fetch app version from Tauri runtime:", e);
		return "1.3.2";
	}
}
