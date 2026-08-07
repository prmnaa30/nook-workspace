import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const newVersion = process.argv[2];

if (!newVersion) {
	console.error("Error: Please specify a version. Example: npm run version:bump 1.4.0");
	process.exit(1);
}

const cleanVersion = newVersion.replace(/^v/i, "").trim();

// 1. Update package.json
const packageJsonPath = path.join(rootDir, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
packageJson.version = cleanVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n", "utf-8");
console.log(`Updated package.json version to ${cleanVersion}`);

// 2. Update src-tauri/Cargo.toml
const cargoPath = path.join(rootDir, "src-tauri", "Cargo.toml");
let cargoContent = fs.readFileSync(cargoPath, "utf-8");
cargoContent = cargoContent.replace(/^version = ".*?"/m, `version = "${cleanVersion}"`);
fs.writeFileSync(cargoPath, cargoContent, "utf-8");
console.log(`Updated Cargo.toml version to ${cleanVersion}`);

// 3. Update src-tauri/tauri.conf.json
const tauriConfPath = path.join(rootDir, "src-tauri", "tauri.conf.json");
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, "utf-8"));
tauriConf.version = cleanVersion;
fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + "\n", "utf-8");
console.log(`Updated tauri.conf.json version to ${cleanVersion}`);

console.log(`Successfully bumped Nook app version to v${cleanVersion}!`);
