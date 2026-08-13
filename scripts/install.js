// Cross-platform installer dispatcher: powershell on Windows, sh elsewhere.
import { spawnSync } from "node:child_process";

const win = process.platform === "win32";
const result = win
	? spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "./scripts/install.ps1"], { stdio: "inherit" })
	: spawnSync("sh", ["./scripts/install.sh"], { stdio: "inherit" });

process.exit(result.status ?? 1);
