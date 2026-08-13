// Peak hours are defined by DeepSeek in UTC: 01:00-04:00 and 06:00-10:00.
export const PEAK_WINDOWS_UTC = [[60, 240], [360, 600]];

// New peak/off-peak pricing applies from 2026-08-16 16:00 UTC.
export const EFFECTIVE_MS = Date.UTC(2026, 7, 16, 16, 0, 0);

// Fallback prices (USD per 1M tokens), used when the live fetch fails.
export const DEFAULT_MODELS = [
	{ model: "deepseek-v4-flash", offPeak: { hit: 0.007, miss: 0.22, out: 0.66 }, peak: { hit: 0.014, miss: 0.44, out: 1.32 } },
	{ model: "deepseek-v4-pro", offPeak: { hit: 0.022, miss: 0.66, out: 1.98 }, peak: { hit: 0.044, miss: 1.32, out: 3.96 } },
];

export function pad2(v) {
	return String(v).padStart(2, "0");
}

/**
 * Label for a minutes-from-UTC offset (positive = east of UTC):
 * -300 → "UTC-5", 330 → "UTC+5:30". Note that `getTimezoneOffset()`
 * uses the opposite sign (west positive), so pass `-localOffsetMin()`.
 */
export function offsetLabel(minutesFromUTC) {
	if (minutesFromUTC === 0) return "UTC±0";
	const sign = minutesFromUTC < 0 ? "-" : "+";
	const a = Math.abs(minutesFromUTC);
	return "UTC" + sign + Math.floor(a / 60) + (a % 60 ? ":" + pad2(a % 60) : "");
}

/** `getTimezoneOffset()`: minutes to ADD to local time to get UTC (west positive). */
export function localOffsetMin(nowMs = Date.now()) {
	return new Date(nowMs).getTimezoneOffset();
}

export function local12(ms) {
	const d = new Date(ms);
	const h = d.getHours();
	const h12 = h % 12 === 0 ? 12 : h % 12;
	return pad2(h12) + ":" + pad2(d.getMinutes()) + " " + (h >= 12 ? "PM" : "AM");
}

export function utcHm(ms) {
	const d = new Date(ms);
	return pad2(d.getUTCHours()) + ":" + pad2(d.getUTCMinutes());
}

export function utcMins(ms) {
	const d = new Date(ms);
	return d.getUTCHours() * 60 + d.getUTCMinutes();
}

export function localMins(ms) {
	const d = new Date(ms);
	return d.getHours() * 60 + d.getMinutes();
}

export function isPeakAt(ms, windows = PEAK_WINDOWS_UTC) {
	const m = utcMins(ms);
	return windows.some((w) => m >= w[0] && m < w[1]);
}

/**
 * Phase snapshot for a timestamp: "flat" before the peak/off-peak cutover
 * (counting down to it), then "peak"/"off" with the minutes until the next
 * boundary. `nextStart` tells whether the next boundary opens or closes a
 * peak window.
 */
export function phaseAt(ms, windows = PEAK_WINDOWS_UTC, effectiveMs = EFFECTIVE_MS) {
	if (ms < effectiveMs) {
		return {
			phase: "flat",
			minutesToNext: Math.max(0, Math.ceil((effectiveMs - ms) / 60000)),
			nextStart: true,
		};
	}
	const m = utcMins(ms);
	const bounds = windows.flatMap((w) => [w[0], w[1]]);
	let idx = -1;
	for (let i = 0; i < bounds.length; i++) {
		if (bounds[i] > m) {
			idx = i;
			break;
		}
	}
	const minutesToNext = idx === -1 ? bounds[0] + 1440 - m : bounds[idx] - m;
	return {
		phase: isPeakAt(ms, windows) ? "peak" : "off",
		minutesToNext,
		nextStart: idx === -1 ? true : idx % 2 === 0,
	};
}

/**
 * Converts UTC windows to local-day segments for the given offset
 * (local = utc − offset). A window that crosses local midnight splits into
 * two segments; a full-day window stays a single segment.
 */
export function localPeakSegments(offsetMin, windows = PEAK_WINDOWS_UTC) {
	return windows.flatMap((w) => {
		const len = w[1] - w[0];
		if (len >= 1440) return [[0, 1440]];
		const s = (w[0] - offsetMin + 1440) % 1440;
		const e = s + len;
		return e > 1440 ? [[s, 1440], [0, e - 1440]] : [[s, e]];
	});
}

export function costOf(totals, prices) {
	const uncached = totals.uncachedInputTokens ?? 0;
	const cached = totals.cacheReadTokens ?? 0;
	const output = totals.outputTokens ?? 0;
	return (uncached * prices.miss + cached * prices.hit + output * prices.out) / 1e6;
}

function extractCells(trHtml) {
	const tdRe = /<t[dh][^<>]*>([\s\S]*?)<\/t[dh]>/gi;
	const cells = [];
	let td;
	while ((td = tdRe.exec(trHtml)) !== null) {
		const text = td[1].replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
		cells.push(text);
	}
	return cells;
}

function parsePrice(s) {
	// Commas are thousand separators unless they form a decimal fraction
	// (e.g. "1,5" = 1.5); empty or non-numeric cells yield NaN.
	let cleaned = String(s).replace(/[^0-9.,]/g, "");
	if (!/\d/.test(cleaned)) return NaN;
	if (!cleaned.includes(".")) {
		const decimal = /^([\d.,]+),(\d{1,2})$/.exec(cleaned);
		if (decimal !== null) cleaned = decimal[1].replace(/,/g, "") + "." + decimal[2];
		else cleaned = cleaned.replace(/,/g, "");
	} else {
		cleaned = cleaned.replace(/,/g, "");
	}
	const n = Number(cleaned);
	return Number.isFinite(n) ? n : NaN;
}

function isMode(s) {
	const u = s.toUpperCase();
	return u === "OFF-PEAK" || u === "PEAK";
}

function modeOf(s) {
	return s.toUpperCase() === "PEAK" ? "peak" : "offPeak";
}

// Maps column positions from the table header ("MODEL", "CACHE HIT",
// "CACHE MISS", "OUTPUT") so the parser survives column reordering.
function columnMap(cells) {
	const lower = cells.map((c) => c.toLowerCase());
	const model = lower.findIndex((c) => c === "model");
	const hit = lower.findIndex((c) => c.includes("cache hit"));
	const miss = lower.findIndex((c) => c.includes("cache miss"));
	const out = lower.findIndex((c) => c.includes("output"));
	if (model === -1 || hit === -1 || miss === -1 || out === -1) return null;
	return { model, hit, miss, out };
}

// Parses the peak/off-peak table from the official pricing page. Prefers the
// header-driven column mapping; falls back to a positional parse. The model
// cell uses rowspan, so the PEAK row only repeats the mode and the prices.
export function parsePricingHtml(html) {
	if (typeof html !== "string") return [];
	const rows = [];
	const tableRe = /<table[^<>]*>([\s\S]*?)<\/table>/gi;
	let table;
	const source = html.replace(/^\uFEFF/, "");
	while ((table = tableRe.exec(source)) !== null) {
		const trRe = /<tr[^<>]*>([\s\S]*?)<\/tr>/gi;
		const rowHtml = [];
		let tr;
		while ((tr = trRe.exec(table[1])) !== null) rowHtml.push(tr[1]);
		let map = null;
		for (const r of rowHtml) {
			const cells = extractCells(r);
			const m = columnMap(cells);
			if (m !== null) {
				map = m;
				break;
			}
		}
		let currentModel = null;
		for (const r of rowHtml) {
			const cells = extractCells(r);
			if (cells.length < 2) continue;
			if (cells[0].toUpperCase() === "MODEL") continue;
			let model;
			let mode;
			let hit;
			let miss;
			let out;
			if (map !== null) {
				const modeCell = cells.findIndex(isMode);
				if (modeCell === -1) continue;
				mode = modeOf(cells[modeCell]);
				// The mode cell either replaces the model cell (rowspan) or is
				// inserted right after it, which shifts the price columns.
				const shift = modeCell > map.model ? 1 : 0;
				const modelCell = cells[map.model];
				model = modelCell !== void 0 && !isMode(modelCell) ? modelCell : currentModel;
				if (model === null) continue;
				currentModel = model;
				hit = parsePrice(cells[map.hit + shift]);
				miss = parsePrice(cells[map.miss + shift]);
				out = parsePrice(cells[map.out + shift]);
			} else if (isMode(cells[0])) {
				if (currentModel === null || cells.length < 4) continue;
				model = currentModel;
				mode = modeOf(cells[0]);
				hit = parsePrice(cells[1]);
				miss = parsePrice(cells[2]);
				out = parsePrice(cells[3]);
			} else if (isMode(cells[1])) {
				if (cells.length < 5) continue;
				currentModel = cells[0];
				model = cells[0];
				mode = modeOf(cells[1]);
				hit = parsePrice(cells[2]);
				miss = parsePrice(cells[3]);
				out = parsePrice(cells[4]);
			} else {
				continue;
			}
			if (!Number.isFinite(hit) || !Number.isFinite(miss) || !Number.isFinite(out)) continue;
			rows.push({ model, mode, hit, miss, out });
		}
	}
	const byModel = new Map();
	for (const r of rows) {
		const entry = byModel.get(r.model) ?? { model: r.model, offPeak: null, peak: null };
		entry[r.mode] = { hit: r.hit, miss: r.miss, out: r.out };
		byModel.set(r.model, entry);
	}
	const models = [];
	for (const e of byModel.values()) {
		if (e.offPeak === null || e.peak === null) continue;
		models.push({ model: e.model, offPeak: e.offPeak, peak: e.peak });
	}
	return models;
}

// "60-240,360-600" → windows; invalid input falls back to the defaults.
export function parsePeakWindows(raw) {
	if (typeof raw !== "string" || raw.trim() === "") return PEAK_WINDOWS_UTC;
	const out = [];
	for (const part of raw.split(",")) {
		const m = /^\s*(\d+)\s*-\s*(\d+)\s*$/.exec(part);
		if (m === null) return PEAK_WINDOWS_UTC;
		const s = Number(m[1]);
		const e = Number(m[2]);
		if (!Number.isInteger(s) || !Number.isInteger(e) || s < 0 || e > 1440 || s >= e) return PEAK_WINDOWS_UTC;
		out.push([s, e]);
	}
	return out.length > 0 ? out : PEAK_WINDOWS_UTC;
}

export function compareVersions(a, b) {
	const pa = String(a).split("-")[0].split(".").map((n) => Number(n) || 0);
	const pb = String(b).split("-")[0].split(".").map((n) => Number(n) || 0);
	for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
		const da = pa[i] ?? 0;
		const db = pb[i] ?? 0;
		if (da > db) return 1;
		if (da < db) return -1;
	}
	// A release beats a prerelease with the same base ("1.4.0" > "1.4.0-beta").
	const preA = String(a).includes("-") ? 1 : 0;
	const preB = String(b).includes("-") ? 1 : 0;
	return preB - preA;
}
