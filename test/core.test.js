import { test } from "node:test";
import assert from "node:assert/strict";
import {
	PEAK_WINDOWS_UTC,
	EFFECTIVE_MS,
	DEFAULT_MODELS,
	offsetLabel,
	localPeakSegments,
	isPeakAt,
	costOf,
	parsePricingHtml,
	parsePeakWindows,
	compareVersions,
	phaseAt,
	local12,
	utcHm,
} from "../lib/core.js";

test("isPeakAt: boundary minutes of the official windows", () => {
	// 01:00 UTC = 60 min (peak starts), 04:00 = 240 (peak ends),
	// 06:00 = 360 (peak starts), 10:00 = 600 (peak ends).
	const at = (h, m = 0) => Date.UTC(2026, 7, 13, h, m, 0);
	assert.equal(isPeakAt(at(0, 59)), false);
	assert.equal(isPeakAt(at(1, 0)), true);
	assert.equal(isPeakAt(at(3, 59)), true);
	assert.equal(isPeakAt(at(4, 0)), false);
	assert.equal(isPeakAt(at(5, 59)), false);
	assert.equal(isPeakAt(at(6, 0)), true);
	assert.equal(isPeakAt(at(9, 59)), true);
	assert.equal(isPeakAt(at(10, 0)), false);
	assert.equal(isPeakAt(at(23, 59)), false);
});

test("phaseAt: flat before the cutover, counting down to it", () => {
	const snap = phaseAt(Date.UTC(2026, 7, 15, 0, 0, 0));
	assert.equal(snap.phase, "flat");
	assert.equal(snap.nextStart, true);
	assert.equal(snap.minutesToNext, 40 * 60); // 40 hours until Aug 16 16:00 UTC
});

test("phaseAt: peak/off phases with minutes to the next boundary", () => {
	const at = (h, m = 0) => Date.UTC(2026, 7, 17, h, m, 0);
	const before = phaseAt(at(0, 59));
	assert.equal(before.phase, "off");
	assert.equal(before.nextStart, true);
	assert.equal(before.minutesToNext, 1);
	const inside = phaseAt(at(3, 0));
	assert.equal(inside.phase, "peak");
	assert.equal(inside.nextStart, false);
	assert.equal(inside.minutesToNext, 60);
	const late = phaseAt(at(23, 0));
	assert.equal(late.phase, "off");
	assert.equal(late.nextStart, true);
	assert.equal(late.minutesToNext, 120); // next peak starts 01:00 the next day
});

test("localPeakSegments: Bogotá (UTC-5, offset 300) → 01:00-05:00 and 08:00-11:00 PM", () => {
	const segs = localPeakSegments(300);
	assert.deepEqual(segs, [[1200, 1380], [60, 300]]);
});

test("localPeakSegments: UTC itself (offset 0) keeps the official windows", () => {
	assert.deepEqual(localPeakSegments(0), [[60, 240], [360, 600]]);
});

test("localPeakSegments: UTC+12 (offset -720) splits the 06:00-10:00 UTC window across local midnight", () => {
	// 06:00 UTC → 18:00 local; 10:00 UTC → 22:00 local (no split).
	// 01:00 UTC → 13:00 local; 04:00 UTC → 16:00 local (no split).
	const segs = localPeakSegments(-720);
	assert.deepEqual(segs, [[780, 960], [1080, 1320]]);
});

test("offsetLabel: common offsets", () => {
	assert.equal(offsetLabel(0), "UTC±0");
	assert.equal(offsetLabel(-300), "UTC-5");
	assert.equal(offsetLabel(120), "UTC+2");
	assert.equal(offsetLabel(330), "UTC+5:30");
	assert.equal(offsetLabel(-180), "UTC-3");
});

test("local12 and utcHm format hh:mm AM/PM and 24h", () => {
	const ms = Date.UTC(2026, 7, 13, 17, 5, 0);
	// Local depends on the machine TZ — assert only the UTC face here.
	assert.equal(utcHm(ms), "17:05");
	// local12 must exist and return a string matching the pattern.
	assert.match(local12(ms), /^(0?[1-9]|1[0-2]):[0-5]\d (AM|PM)$/);
});

test("costOf: 1M tokens each at the flash off-peak prices", () => {
	const totals = { uncachedInputTokens: 1_000_000, cacheReadTokens: 1_000_000, outputTokens: 1_000_000 };
	const c = costOf(totals, DEFAULT_MODELS[0].offPeak);
	assert.ok(Math.abs(c - (0.22 + 0.007 + 0.66)) < 1e-9, "got " + c);
});

test("costOf: missing buckets count as zero", () => {
	assert.equal(costOf({}, DEFAULT_MODELS[0].offPeak), 0);
	assert.ok(Math.abs(costOf({ outputTokens: 500_000 }, DEFAULT_MODELS[0].offPeak) - 0.33) < 1e-9);
});

const SAMPLE_HTML = `
<html><body>
<table>
<thead><tr><th>MODEL</th><th>1M INPUT TOKENS (CACHE HIT)</th><th>1M INPUT TOKENS (CACHE MISS)</th><th>1M OUTPUT TOKENS</th></tr></thead>
<tbody>
<tr><td>deepseek-v4-flash</td><td>OFF-PEAK</td><td>$0.007</td><td>$0.22</td><td>$0.66</td></tr>
<tr><td>deepseek-v4-flash</td><td>PEAK</td><td>$0.014</td><td>$0.44</td><td>$1.32</td></tr>
<tr><td>deepseek-v4-pro</td><td>OFF-PEAK</td><td>$0.022</td><td>$0.66</td><td>$1.98</td></tr>
<tr><td>deepseek-v4-pro</td><td>PEAK</td><td>$0.044</td><td>$1.32</td><td>$3.96</td></tr>
</tbody>
</table>
</body></html>`;

test("parsePricingHtml: extracts all models with off-peak and peak sets", () => {
	const models = parsePricingHtml(SAMPLE_HTML);
	assert.equal(models.length, 2);
	const flash = models.find((m) => m.model === "deepseek-v4-flash");
	assert.deepEqual(flash.offPeak, { hit: 0.007, miss: 0.22, out: 0.66 });
	assert.deepEqual(flash.peak, { hit: 0.014, miss: 0.44, out: 1.32 });
	const pro = models.find((m) => m.model === "deepseek-v4-pro");
	assert.deepEqual(pro.offPeak, { hit: 0.022, miss: 0.66, out: 1.98 });
	assert.deepEqual(pro.peak, { hit: 0.044, miss: 1.32, out: 3.96 });
});

test("parsePricingHtml: returns [] on unrelated HTML", () => {
	assert.deepEqual(parsePricingHtml("<html><p>no table here</p></html>"), []);
});

test("parsePricingHtml: skips rows missing one mode", () => {
	const html = `
<table><tbody>
<tr><td>deepseek-x</td><td>OFF-PEAK</td><td>$0.1</td><td>$0.2</td><td>$0.3</td></tr>
<tr><td>deepseek-y</td><td>OFF-PEAK</td><td>$0.1</td><td>$0.2</td><td>$0.3</td></tr>
<tr><td>deepseek-y</td><td>PEAK</td><td>$0.2</td><td>$0.4</td><td>$0.6</td></tr>
</tbody></table>`;
	const models = parsePricingHtml(html);
	assert.equal(models.length, 1);
	assert.equal(models[0].model, "deepseek-y");
});

test("parsePricingHtml: handles rowspan (real page layout: PEAK row omits the model cell)", () => {
	const html = `
<table><tbody>
<tr><td>deepseek-v4-flash</td><td>OFF-PEAK</td><td>$0.007</td><td>$0.22</td><td>$0.66</td></tr>
<tr><td>PEAK</td><td>$0.014</td><td>$0.44</td><td>$1.32</td></tr>
<tr><td>deepseek-v4-pro</td><td>OFF-PEAK</td><td>$0.022</td><td>$0.66</td><td>$1.98</td></tr>
<tr><td>PEAK</td><td>$0.044</td><td>$1.32</td><td>$3.96</td></tr>
</tbody></table>`;
	const models = parsePricingHtml(html);
	assert.equal(models.length, 2);
	const flash = models.find((m) => m.model === "deepseek-v4-flash");
	assert.deepEqual(flash.offPeak, { hit: 0.007, miss: 0.22, out: 0.66 });
	assert.deepEqual(flash.peak, { hit: 0.014, miss: 0.44, out: 1.32 });
});

test("parsePeakWindows: parses overrides and falls back on garbage", () => {
	assert.deepEqual(parsePeakWindows("60-240,360-600"), [[60, 240], [360, 600]]);
	assert.deepEqual(parsePeakWindows(""), PEAK_WINDOWS_UTC);
	assert.deepEqual(parsePeakWindows("   "), PEAK_WINDOWS_UTC);
	assert.deepEqual(parsePeakWindows("nope"), PEAK_WINDOWS_UTC);
	assert.deepEqual(parsePeakWindows("60-240,abc"), PEAK_WINDOWS_UTC);
	assert.deepEqual(parsePeakWindows("500-100"), PEAK_WINDOWS_UTC); // start >= end
	assert.deepEqual(parsePeakWindows("0-1440"), [[0, 1440]]);
});

test("compareVersions: dotted version comparison", () => {
	assert.equal(compareVersions("1.0.0", "1.0.0"), 0);
	assert.equal(compareVersions("1.0.1", "1.0.0"), 1);
	assert.equal(compareVersions("1.0.0", "1.0.1"), -1);
	assert.equal(compareVersions("1.10.0", "1.9.0"), 1);
	assert.equal(compareVersions("2.0.0", "1.9.9"), 1);
	assert.equal(compareVersions("1.0", "1.0.0"), 0);
	assert.equal(compareVersions("1.4.0", "1.4.0-beta"), 1);
	assert.equal(compareVersions("1.4.0-beta", "1.4.0"), -1);
	assert.equal(compareVersions("1.4.0-beta", "1.4.0-beta"), 0);
});

test("localPeakSegments: window ending at local midnight has no zero-width segment", () => {
	// 01:00-04:00 UTC with offset -1200: ends exactly at local 24:00.
	assert.deepEqual(localPeakSegments(-1200), [[1260, 1440], [120, 360]]);
});

test("localPeakSegments: full-day window stays a single segment", () => {
	assert.deepEqual(localPeakSegments(0, [[0, 1440]]), [[0, 1440]]);
	assert.deepEqual(localPeakSegments(300, [[0, 1440]]), [[0, 1440]]);
});

test("parsePricingHtml: truncated rows and N/A cells exclude the model, not price it at zero", () => {
	const truncated = `<table><tbody>
<tr><td>deepseek-e</td><td>OFF-PEAK</td><td>$0.10</td><td>$0.20</td><td>$0.30</td></tr>
<tr><td>PEAK</td><td>$0.20</td><td>$0.40</td></tr>
</tbody></table>`;
	assert.equal(parsePricingHtml(truncated).length, 0);
	const na = `<table><tbody>
<tr><td>deepseek-e</td><td>OFF-PEAK</td><td>N/A</td><td>$0.20</td><td>$0.30</td></tr>
<tr><td>PEAK</td><td>$0.10</td><td>$0.40</td><td>$0.60</td></tr>
</tbody></table>`;
	assert.equal(parsePricingHtml(na).length, 0);
});

test("parsePricingHtml: European decimal comma parses as a fraction", () => {
	const html = `<table><tbody>
<tr><td>deepseek-f</td><td>OFF-PEAK</td><td>0,1</td><td>$0.20</td><td>$0.30</td></tr>
<tr><td>PEAK</td><td>0,2</td><td>$0.40</td><td>$0.60</td></tr>
</tbody></table>`;
	const models = parsePricingHtml(html);
	assert.equal(models.length, 1);
	assert.equal(models[0].offPeak.hit, 0.1);
	assert.equal(models[0].peak.hit, 0.2);
});

test("parsePricingHtml: empty price cells exclude the row without misaligning others", () => {
	const html = `<table>
<thead><tr><th>MODEL</th><th>1M INPUT TOKENS (CACHE HIT)</th><th>1M INPUT TOKENS (CACHE MISS)</th><th>1M OUTPUT TOKENS</th></tr></thead>
<tbody>
<tr><td>deepseek-g</td><td>OFF-PEAK</td><td></td><td>$0.20</td><td>$0.30</td></tr>
<tr><td>PEAK</td><td>$0.10</td><td>$0.40</td><td>$0.60</td></tr>
<tr><td>deepseek-h</td><td>OFF-PEAK</td><td>$0.11</td><td>$0.21</td><td>$0.31</td></tr>
<tr><td>PEAK</td><td>$0.12</td><td>$0.41</td><td>$0.61</td></tr>
</tbody></table>`;
	const models = parsePricingHtml(html);
	// deepseek-g has a missing price and is excluded; deepseek-h parses cleanly.
	assert.equal(models.length, 1);
	assert.equal(models[0].model, "deepseek-h");
	assert.deepEqual(models[0].offPeak, { hit: 0.11, miss: 0.21, out: 0.31 });
});

test("parsePricingHtml: tolerates attributes and nested markup", () => {
	const html = `<table class="pricing">
<tbody>
<tr style="x"><td class="m">deepseek-a</td><td>OFF-PEAK</td><td><b>$0.10</b></td><td>$0.20</td><td>$0.30</td></tr>
<tr><td>PEAK</td><td>$0.20</td><td>$0.40</td><td>$0.60</td></tr>
</tbody></table>`;
	const models = parsePricingHtml(html);
	assert.equal(models.length, 1);
	assert.equal(models[0].model, "deepseek-a");
	assert.deepEqual(models[0].offPeak, { hit: 0.1, miss: 0.2, out: 0.3 });
	assert.deepEqual(models[0].peak, { hit: 0.2, miss: 0.4, out: 0.6 });
});

test("parsePricingHtml: handles prices with commas and extra whitespace", () => {
	const html = `<table><tbody>
<tr><td> deepseek-b </td><td> OFF-PEAK </td><td>$0.007</td><td>$1,000.50</td><td>$0.66</td></tr>
<tr><td>PEAK</td><td>$0.014</td><td>$2,001.00</td><td>$1.32</td></tr>
</tbody></table>`;
	const models = parsePricingHtml(html);
	assert.equal(models.length, 1);
	assert.equal(models[0].model, "deepseek-b");
	assert.equal(models[0].offPeak.miss, 1000.5);
	assert.equal(models[0].peak.miss, 2001);
});

test("parsePricingHtml: ignores a UTF-8 BOM and nested tables", () => {
	const html = `\uFEFF<html><body>
<table><tbody>
<tr><td>deepseek-c</td><td>OFF-PEAK</td><td>$0.01</td><td>$0.02</td><td>$0.03</td></tr>
<tr><td>PEAK</td><td>$0.02</td><td>$0.04</td><td>$0.06</td></tr>
</tbody></table>
<table><tbody><tr><td>not-a-price-row</td></tr></tbody></table>
</body></html>`;
	const models = parsePricingHtml(html);
	assert.equal(models.length, 1);
	assert.equal(models[0].model, "deepseek-c");
});

test("parsePricingHtml: survives column reordering via the header", () => {
	const html = `<table>
<thead><tr><th>MODEL</th><th>1M OUTPUT TOKENS</th><th>1M INPUT TOKENS (CACHE HIT)</th><th>1M INPUT TOKENS (CACHE MISS)</th></tr></thead>
<tbody>
<tr><td>deepseek-d</td><td>OFF-PEAK</td><td>$0.66</td><td>$0.007</td><td>$0.22</td></tr>
<tr><td>PEAK</td><td>$1.32</td><td>$0.014</td><td>$0.44</td></tr>
</tbody></table>`;
	const models = parsePricingHtml(html);
	assert.equal(models.length, 1);
	assert.equal(models[0].model, "deepseek-d");
	assert.deepEqual(models[0].offPeak, { hit: 0.007, miss: 0.22, out: 0.66 });
	assert.deepEqual(models[0].peak, { hit: 0.014, miss: 0.44, out: 1.32 });
});

test("PEAK_WINDOWS_UTC and EFFECTIVE_MS are sane", () => {
	assert.deepEqual(PEAK_WINDOWS_UTC, [[60, 240], [360, 600]]);
	assert.equal(EFFECTIVE_MS, Date.UTC(2026, 7, 16, 16, 0, 0));
});
