import { readFileSync, writeFileSync, renameSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { parsePricingHtml, parsePeakWindows, compareVersions, DEFAULT_MODELS } from "./core.js";

const PRICING_URL = "https://api-docs.deepseek.com/quick_start/pricing/";
const REFRESH_MS = 30 * 60 * 1000;
const UPDATE_CHECK_MS = 6 * 60 * 60 * 1000;
const UPDATE_FILES = ["package.json", "version.json", "lib/core.js", "lib/index.js", "lib/client.js"];

function installedVersion() {
	// version.json is the release version; package.json is the fallback.
	for (const name of ["../version.json", "../package.json"]) {
		try {
			const data = JSON.parse(readFileSync(new URL(name, import.meta.url), "utf8"));
			if (data.version) return String(data.version);
		} catch {
			// try the next source
		}
	}
	return "0.0.0";
}

export const inject = ["webServer", "timer"];

export function apply(ctx) {
	// DSH_DSPT_REPO (owner/repo) enables the update check and self-update.
	const repo = process.env.DSH_DSPT_REPO ?? "";
	const peakWindows = parsePeakWindows(process.env.DSH_DSPT_PEAK_WINDOWS);
	const version = installedVersion();
	const { timer, webServer } = ctx;

	let state = {
		models: DEFAULT_MODELS,
		peakWindows,
		fetchedAt: null,
		source: "embedded-fallback",
		error: null,
		plugin: { version, repo, latest: null, updateUrl: null },
	};
	let fetching = null;

	const refresh = async () => {
		if (fetching) return fetching;
		fetching = (async () => {
			try {
				const res = await fetch(PRICING_URL, {
					headers: { "user-agent": "Mozilla/5.0 (compatible; dsh-deepseek-price-timer/1.0)" },
					signal: AbortSignal.timeout(15000),
				});
				if (!res.ok) throw new Error("HTTP " + res.status);
				const models = parsePricingHtml(await res.text());
				if (models.length === 0) throw new Error("no pricing table found on page");
				state = { ...state, models, fetchedAt: Date.now(), source: PRICING_URL, error: null };
			} catch (error) {
				state = { ...state, error: String(error?.message ?? error) };
			} finally {
				fetching = null;
			}
		})();
		return fetching;
	};

	const checkUpdate = async () => {
		if (repo === "") return;
		try {
			const res = await fetch(`https://raw.githubusercontent.com/${repo}/main/version.json`, {
				headers: { "user-agent": "Mozilla/5.0 (compatible; dsh-deepseek-price-timer/1.0)" },
				signal: AbortSignal.timeout(10000),
			});
			if (!res.ok) throw new Error("HTTP " + res.status);
			const data = await res.json();
			const latest = String(data.version ?? "");
			if (latest !== "" && compareVersions(latest, version) > 0) {
				state = {
					...state,
					plugin: { ...state.plugin, latest, updateUrl: String(data.url ?? `https://github.com/${repo}`) },
				};
			}
		} catch {
			// Best-effort; a failed check should never disturb the widget.
		}
	};

	const selfUpdate = async () => {
		if (repo === "") return { ok: false, error: "no repo configured" };
		const root = new URL("../", import.meta.url);
		const downloaded = [];
		for (const file of UPDATE_FILES) {
			const res = await fetch(`https://raw.githubusercontent.com/${repo}/main/${file}`, {
				headers: { "user-agent": "Mozilla/5.0 (compatible; dsh-deepseek-price-timer/1.0)" },
				signal: AbortSignal.timeout(15000),
			});
			if (!res.ok) throw new Error(`HTTP ${res.status} for ${file}`);
			downloaded.push([file, await res.text()]);
		}
		// Validate everything in temp files before touching the real ones.
		const temps = [];
		try {
			for (const [file, content] of downloaded) {
				// The temp name keeps a .js suffix so `node --check` parses it
				// as ESM like the real file.
				const tmpName = file.endsWith(".js") ? file + ".tmp.js" : file + ".tmp";
				const tmp = new URL(tmpName, root);
				writeFileSync(tmp, content, "utf8");
				temps.push([file, tmp]);
				if (file.endsWith(".json")) JSON.parse(content);
			}
			for (const [file, tmp] of temps) {
				if (!file.endsWith(".js")) continue;
				const ok = await new Promise((resolve) => {
					const child = spawn(process.execPath, ["--check", fileURLToPath(tmp)], { stdio: "ignore" });
					child.on("exit", (code) => resolve(code === 0));
				});
				if (!ok) throw new Error(`invalid syntax in ${file}`);
			}
		} catch (error) {
			for (const [, tmp] of temps) {
				try {
					rmSync(tmp);
				} catch {
					// already gone
				}
			}
			throw error;
		}
		const versionJson = JSON.parse(downloaded.find(([f]) => f === "version.json")[1]);
		if (!versionJson.version) throw new Error("version.json missing version");
		// Apply with rollback: each original moves to .bak first, so a failed
		// rename restores the previous installation instead of mixing versions.
		const backups = [];
		try {
			for (const [file, tmp] of temps) {
				const target = new URL(file, root);
				const bak = new URL(file + ".bak", root);
				renameSync(target, bak);
				backups.push([file, bak]);
				renameSync(tmp, target);
			}
		} catch (error) {
			for (const [file, bak] of backups.reverse()) {
				try {
					renameSync(bak, new URL(file, root));
				} catch {
					// best-effort restore
				}
			}
			throw error;
		}
		for (const [, bak] of backups) {
			try {
				rmSync(bak);
			} catch {
				// already gone
			}
		}
		return { ok: true, version: String(versionJson.version) };
	};

	ctx.effect(() => timer.timeout(() => void refresh(), 2000));
	ctx.effect(() => timer.timeout(() => void checkUpdate(), 2500));
	ctx.effect(() => timer.interval(() => void refresh(), REFRESH_MS));
	ctx.effect(() => timer.interval(() => void checkUpdate(), UPDATE_CHECK_MS));

	// Rejects cross-origin requests (CSRF): a POST from another site must not
	// be able to trigger the self-update or restart the harness.
	const sameOrigin = (req) => {
		const origin = req.headers.origin;
		if (origin === undefined) return true;
		try {
			return new URL(origin).host === req.headers.host;
		} catch {
			return false;
		}
	};

	ctx.effect(() => webServer.register({
		kind: "exact",
		path: "/plugins/dspt-prices.json",
		handler: async (req, res) => {
			const url = new URL(req.url ?? "/", "http://x");
			if (req.method === "POST" && url.searchParams.get("action") === "update") {
				if (!sameOrigin(req)) {
					res.writeHead(403);
					res.end();
					return;
				}
				res.writeHead(200, {
					"content-type": "application/json; charset=utf-8",
					"cache-control": "no-store",
				});
				try {
					const result = await selfUpdate();
					res.end(JSON.stringify(result));
					if (result.ok) {
						timer.timeout(() => {
							if (process.platform === "win32") {
								try {
									spawn("schtasks", ["/run", "/tn", "DSH Web Restart"], { stdio: "ignore", detached: true, windowsHide: true }).unref();
								} catch {
									// no restart task; the user restarts manually
								}
							} else {
								// A process manager (systemd, pm2, ...) restarts the
								// harness; otherwise the user starts `dsh web` again.
								timer.timeout(() => process.exit(0), 500);
							}
						}, 1500);
					}
				} catch (error) {
					res.end(JSON.stringify({ ok: false, error: String(error?.message ?? error) }));
				}
				return;
			}
			if (req.method !== "GET" && req.method !== "HEAD") {
				res.writeHead(405);
				res.end();
				return;
			}
			res.writeHead(200, {
				"content-type": "application/json; charset=utf-8",
				"cache-control": "no-store",
			});
			res.end(JSON.stringify(state));
		},
	}), "dspt: prices route");
}
