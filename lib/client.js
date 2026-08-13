window.__ModuleLoader__.load({
	id: "dsh-deepseek-price-timer",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");

		const CSS = `
.dsp-card{display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:8px;padding:3px 8px;font-size:10px;line-height:1.35;color:var(--dsw-alias-label-primary);min-width:0;margin-bottom:4px;max-width:var(--dsh-composer-card-max-width,780px);margin-left:auto;margin-right:auto;width:100%;box-sizing:border-box}
.dsp-top{display:flex;align-items:center;gap:7px;flex-wrap:wrap;min-width:0}
.dsp-clock{font-variant-numeric:tabular-nums;font-weight:600;white-space:nowrap}
.dsp-tz{font-weight:500;color:var(--dsw-alias-label-secondary);font-size:8.5px;margin-left:2px}
.dsp-utc{font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.dsp-utc b{color:var(--dsw-alias-label-primary);font-weight:600}
.dsp-pill{display:inline-flex;align-items:center;gap:4px;padding:1px 7px;border-radius:999px;font-weight:700;font-size:9px;letter-spacing:.07em;white-space:nowrap}
.dsp-dot{width:5px;height:5px;border-radius:50%;background:currentColor;animation:dsp-pulse 1.6s ease-in-out infinite}
.dsp-pill-peak{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 14%,transparent);color:var(--dsw-alias-state-error-primary);border:1px solid color-mix(in srgb,var(--dsw-alias-state-error-primary) 35%,transparent)}
.dsp-pill-valley{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 14%,transparent);color:var(--dsw-alias-state-success-primary);border:1px solid color-mix(in srgb,var(--dsw-alias-state-success-primary) 35%,transparent)}
.dsp-pill-flat{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 16%,transparent);color:var(--dsw-alias-state-warn-primary);border:1px solid color-mix(in srgb,var(--dsw-alias-state-warn-primary) 35%,transparent)}
.dsp-count{font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.dsp-header-pill{display:inline-flex;align-items:center;gap:5px;padding:2px 9px;border-radius:999px;font-size:10px;font-weight:600;letter-spacing:.05em;white-space:nowrap;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);cursor:help;font-variant-numeric:tabular-nums}
.dsp-header-dot{width:7px;height:7px;border-radius:50%;animation:dsp-pulse 1.6s ease-in-out infinite}
.dsp-h-peak{color:var(--dsw-alias-state-error-primary)}
.dsp-h-off{color:var(--dsw-alias-state-success-primary)}
.dsp-h-flat{color:var(--dsw-alias-state-warn-primary)}
.dsp-h-count{color:var(--dsw-alias-label-secondary);font-weight:500}
.dsp-h-arrow{opacity:.6}
@keyframes dsp-pulse{0%,100%{opacity:1}50%{opacity:.25}}
.dsp-btn{display:inline-flex;align-items:center;gap:3px;background:transparent;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;padding:1px 7px;cursor:pointer;color:var(--dsw-alias-label-secondary);font-size:9px;font-weight:500;transition:background .12s,color .12s}
.dsp-btn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.dsp-note{font-size:9px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.dsp-src{font-size:8.5px;color:var(--dsw-alias-label-secondary);opacity:.85;white-space:nowrap}
.dsp-alert{display:inline-flex;align-items:center;gap:4px;font-size:9px;font-weight:600;padding:1px 7px;border-radius:6px;white-space:nowrap;animation:dsp-pulse 1.6s ease-in-out infinite}
.dsp-alert-peak{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 16%,transparent);color:var(--dsw-alias-state-error-primary)}
.dsp-alert-valley{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 16%,transparent);color:var(--dsw-alias-state-success-primary)}
.dsp-cost{font-variant-numeric:tabular-nums;white-space:nowrap}
.dsp-cost b{font-weight:700}
.dsp-cost .dsp-dim{color:var(--dsw-alias-label-secondary)}
.dsp-day{position:relative;margin-top:4px}
.dsp-day-track{position:relative;height:10px;border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 55%,transparent);border:1px solid var(--dsw-alias-state-success-primary);overflow:hidden;box-sizing:border-box;cursor:help}
.dsp-seg{position:absolute;top:0;bottom:0;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;letter-spacing:.05em;cursor:help}
.dsp-seg-peak{background:var(--dsw-alias-state-error-primary);color:#fff}
.dsp-now{position:absolute;top:-3px;bottom:-3px;width:2px;border-radius:2px;background:var(--dsw-alias-label-primary);box-shadow:0 0 0 1.5px var(--dsw-alias-bg-layer-1)}
.dsp-day-labels{position:relative;height:12px;margin-top:1px}
.dsp-day-labels span{position:absolute;transform:translateX(-50%);font-size:8px;color:var(--dsw-alias-label-secondary);white-space:nowrap;font-variant-numeric:tabular-nums}
.dsp-table{width:100%;border-collapse:collapse;margin-top:5px;font-size:9.5px}
.dsp-table th{text-align:left;font-size:8.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--dsw-alias-label-secondary);padding:2px 7px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dsp-table th:not(:first-child){text-align:right}
.dsp-table td{padding:2px 7px;border-bottom:1px solid color-mix(in srgb,var(--dsw-alias-border-l1) 55%,transparent)}
.dsp-table tbody tr:nth-child(even){background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 40%,transparent)}
.dsp-table td:first-child{font-weight:600;white-space:nowrap}
.dsp-table td:not(:first-child){text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.dsp-off{font-weight:700}
.dsp-peak{color:var(--dsw-alias-label-secondary)}
.dsp-legend{display:flex;align-items:center;gap:10px;margin-top:4px;font-size:8.5px;color:var(--dsw-alias-label-secondary);flex-wrap:wrap}
.dsp-legend .dsp-sw{width:6px;height:6px;border-radius:2px;display:inline-block;margin-right:3px;vertical-align:-1px}
.dsp-ver{margin-left:auto;font-size:8px;color:var(--dsw-alias-label-secondary);opacity:.55;white-space:nowrap;font-variant-numeric:tabular-nums}
`;

		// Peak hours are defined by DeepSeek in UTC; prices come from the node
		// half at PRICES_URL with the embedded defaults as fallback.
		const PEAK_WINDOWS = [[60, 240], [360, 600]];
		const EFFECTIVE_MS = Date.UTC(2026, 7, 16, 16, 0, 0);
		const DEFAULT_MODELS = [
			{ model: "deepseek-v4-flash", offPeak: { hit: 0.007, miss: 0.22, out: 0.66 }, peak: { hit: 0.014, miss: 0.44, out: 1.32 } },
			{ model: "deepseek-v4-pro", offPeak: { hit: 0.022, miss: 0.66, out: 1.98 }, peak: { hit: 0.044, miss: 1.32, out: 3.96 } },
		];
		const PRICES_URL = "/plugins/dspt-prices.json";

		function pad2(v) { return String(v).padStart(2, "0"); }
		function localOffsetMin() { return new Date().getTimezoneOffset(); }
		function offsetLabel() {
			const off = -localOffsetMin();
			if (off === 0) return "UTC±0";
			const sign = off < 0 ? "-" : "+";
			const a = Math.abs(off);
			return "UTC" + sign + Math.floor(a / 60) + (a % 60 ? ":" + pad2(a % 60) : "");
		}
		function local12(ms) {
			const d = new Date(ms);
			const h = d.getHours();
			const h12 = h % 12 === 0 ? 12 : h % 12;
			return pad2(h12) + ":" + pad2(d.getMinutes()) + " " + (h >= 12 ? "PM" : "AM");
		}
		function utcHm(ms) {
			const d = new Date(ms);
			return pad2(d.getUTCHours()) + ":" + pad2(d.getUTCMinutes());
		}
		function utcMins(ms) {
			const d = new Date(ms);
			return d.getUTCHours() * 60 + d.getUTCMinutes();
		}
		function localMins(ms) {
			const d = new Date(ms);
			return d.getHours() * 60 + d.getMinutes();
		}
		function isPeakAt(ms, windows) {
			const m = utcMins(ms);
			return windows.some((w) => m >= w[0] && m < w[1]);
		}
		function phaseAt(ms, windows) {
			if (ms < EFFECTIVE_MS) {
				return {
					phase: "flat",
					minutesToNext: Math.max(0, Math.ceil((EFFECTIVE_MS - ms) / 60000)),
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
			return {
				phase: isPeakAt(ms, windows) ? "peak" : "off",
				minutesToNext: idx === -1 ? bounds[0] + 1440 - m : bounds[idx] - m,
				nextStart: idx === -1 ? true : idx % 2 === 0,
			};
		}
		function fmtHm(minutes) {
			const h = Math.floor(minutes / 60);
			const mm = minutes % 60;
			return String(h).padStart(2, "0") + "h " + String(mm).padStart(2, "0") + "m";
		}
		function localPeakSegments(windows) {
			const off = localOffsetMin();
			return windows.flatMap((w) => {
				const s = (w[0] - off + 1440) % 1440;
				const e = (w[1] - off + 1440) % 1440;
				return s <= e ? [[s, e]] : [[s, 1440], [0, e]];
			});
		}
		function pctOf(mins) { return (mins / 1440) * 100; }
		function clamp(v) { return Math.min(94, Math.max(6, v)); }
		function fmtMoney(v) {
			if (!Number.isFinite(v) || v <= 0) return "$0.00";
			return "$" + (v < 0.01 ? v.toFixed(4) : v.toFixed(2));
		}
		function costOf(totals, prices) {
			const uncached = totals.uncachedInputTokens ?? 0;
			const cached = totals.cacheReadTokens ?? 0;
			const output = totals.outputTokens ?? 0;
			return (uncached * prices.miss + cached * prices.hit + output * prices.out) / 1e6;
		}
		function priceText(n) {
			return "$" + String(Number(n).toFixed(n < 0.01 ? 4 : 3)).replace(/0+$/, "").replace(/\.$/, "");
		}

		const ES = typeof navigator !== "undefined" && navigator.language && navigator.language.toLowerCase().startsWith("es");
		const T = {
			peak: ES ? "PICO" : "PEAK",
			valley: ES ? "VALLE" : "VALLEY",
			prices: ES ? "tarifas" : "prices",
			hide: ES ? "ocultar" : "hide",
			collapse: ES ? "minimizar" : "collapse",
			expand: ES ? "expandir" : "expand",
			refresh: ES ? "actualizar" : "refresh",
			peakStarted: ES ? "¡PICO empezó! tarifa ×2" : "PEAK started! rate ×2",
			valleyStarted: ES ? "VALLE — tarifa a mitad de precio" : "VALLEY — half-price rate",
			sessionCost: ES ? "esta sesión" : "this session",
			valleyLbl: ES ? "valle" : "off-peak",
			peakLbl: ES ? "pico" : "peak",
			peakShort: ES ? "PICO" : "PEAK",
			and: ES ? "y" : "and",
			live: ES ? "precios oficiales" : "official prices",
			fallback: ES ? "precios embebidos (sin conexión)" : "embedded prices (offline)",
			updated: ES ? "actualizado" : "updated",
			newPricing: ES ? "nueva tarifa" : "new pricing",
			utcWin: ES ? "pico UTC" : "peak UTC",
			localWin: ES ? "local:" : "local:",
			nowTip: ES ? "ahora" : "now",
			dayTip: ES ? "Día completo en tu hora local — verde = valle, rojo = pico" : "Full day in your local time — green = off-peak, red = peak",
			model: ES ? "Modelo" : "Model",
			hit: ES ? "Cache hit" : "Cache hit",
			miss: ES ? "Cache miss" : "Cache miss",
			output: ES ? "Output" : "Output",
			usd: ES ? "USD / 1M tokens" : "USD / 1M tokens",
			update: ES ? "actualización" : "update",
			updateTo: ES ? "actualizar a" : "update to",
			updateTip: ES ? "Descarga e instala la nueva versión" : "Download and install the new version",
			updating: ES ? "actualizando…" : "updating…",
			updatedDone: ES ? "actualizada — reiniciando…" : "updated — restarting…",
			updateErr: ES ? "error al actualizar" : "update failed",
			flat: ES ? "FLAT" : "FLAT",
			cutoverTo: ES ? "cutover en" : "cutover in",
			live: ES ? "en vivo" : "live",
			surcharge: ES ? "recargo ×2" : "2x surcharge",
			baseline: ES ? "0.5x base" : "0.5x baseline",
		};

		function priceCell(offPeak, peak) {
			return react.createElement("td", null,
				react.createElement("span", { className: "dsp-off" }, priceText(offPeak)),
				react.createElement("span", { className: "dsp-peak" }, " / " + priceText(peak)));
		}

		function apply(ctx) {
			if (typeof document !== "undefined") {
				const tag = document.createElement("style");
				tag.dataset.plugin = "dsh-deepseek-price-timer";
				tag.textContent = CSS;
				document.head.appendChild(tag);
				ctx.effect(() => () => {
					tag.remove();
				});
			}

			const slots = ctx.get("slots");
			if (slots === undefined) return;

			function DeepSeekPriceTimer(props) {
				const [now, setNow] = react.useState(Date.now());
				const [open, setOpen] = react.useState(false);
				const [collapsed, setCollapsed] = react.useState(false);
				const [live, setLive] = react.useState(null);
				const [alert, setAlert] = react.useState(null);
				const [updateState, setUpdateState] = react.useState(null);
				react.useEffect(() => ctx.interval(() => setNow(Date.now()), 1000), []);

				const loadPrices = react.useCallback(() => {
					fetch(PRICES_URL + "?t=" + Date.now(), { cache: "no-store" })
						.then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
						.then((d) => setLive(d))
						.catch(() => setLive((prev) => prev ?? null));
				}, []);
				react.useEffect(() => {
					loadPrices();
					return ctx.interval(() => loadPrices(), 5 * 60 * 1000);
				}, [loadPrices]);

				const windows = live && Array.isArray(live.peakWindows) && live.peakWindows.length > 0 ? live.peakWindows : PEAK_WINDOWS;

				const isPeak = isPeakAt(now, windows);
				const prevPeak = react.useRef(isPeak);
				const alertTimer = react.useRef(null);
				react.useEffect(() => {
					if (prevPeak.current !== isPeak) {
						prevPeak.current = isPeak;
						if (alertTimer.current) alertTimer.current();
						setAlert(isPeak ? T.peakStarted : T.valleyStarted);
						alertTimer.current = ctx.timeout(() => {
							setAlert(null);
							alertTimer.current = null;
						}, 8000);
					}
					return () => {
						if (alertTimer.current) alertTimer.current();
						alertTimer.current = null;
					};
				}, [isPeak]);

				const pending = now < EFFECTIVE_MS;
				const models = live && Array.isArray(live.models) && live.models.length > 0 ? live.models : DEFAULT_MODELS;
				const liveOk = live !== null && live.fetchedAt !== null;
				const update = live && live.plugin && live.plugin.latest ? live.plugin : null;

				let cost = null;
				try {
					const totals = props && props.session && props.session.projections && props.session.projections.values &&
						props.session.projections.values.tokenUsage && props.session.projections.values.tokenUsage.totals;
					if (totals && ((totals.uncachedInputTokens ?? 0) + (totals.cacheReadTokens ?? 0) + (totals.outputTokens ?? 0)) > 0) {
						const m = models[0];
						cost = {
							valley: costOf(totals, m.offPeak),
							peak: costOf(totals, m.peak),
						};
					}
				} catch {
					cost = null;
				}

				const segs = localPeakSegments(windows);
				const localDayStart = new Date(now);
				localDayStart.setHours(0, 0, 0, 0);
				const localDayStartMs = localDayStart.getTime();

				const clock = react.createElement("span", { className: "dsp-clock" },
					local12(now),
					react.createElement("span", { className: "dsp-tz" }, "(" + offsetLabel() + ")"));
				const utc = react.createElement("span", { className: "dsp-utc" },
					react.createElement("b", null, utcHm(now)), " UTC");
				const phase = phaseAt(now, windows);
				const pill = react.createElement("span", {
					className: "dsp-pill " + (phase.phase === "peak" ? "dsp-pill-peak" : phase.phase === "flat" ? "dsp-pill-flat" : "dsp-pill-valley"),
				},
					react.createElement("span", { className: "dsp-dot" }),
					phase.phase === "peak" ? T.peak : phase.phase === "flat" ? T.flat : T.valley);
				const flatCount = phase.phase === "flat"
					? react.createElement("span", { className: "dsp-count" },
						T.cutoverTo + " " + fmtHm(phase.minutesToNext) + " → " + T.live)
					: react.createElement("span", { className: "dsp-count" },
						(phase.nextStart ? T.peak : T.valleyLbl) + " " + fmtHm(phase.minutesToNext));

				const collapseBtn = react.createElement("button", {
					className: "dsp-btn",
					title: collapsed ? T.expand : T.collapse,
					onClick: () => setCollapsed(!collapsed),
				}, collapsed ? "+" : "–");
				const pricesBtn = react.createElement("button", { className: "dsp-btn", onClick: () => setOpen(!open) },
					open ? T.hide : T.prices, open ? " ▴" : " ▾");
				const refreshBtn = react.createElement("button", {
					className: "dsp-btn",
					title: T.refresh,
					onClick: () => loadPrices(),
				}, "↻");

				const top = [clock, utc, pill, flatCount, collapseBtn];
				if (!collapsed) top.push(pricesBtn, refreshBtn);
				if (alert !== null) top.push(react.createElement("span", {
					className: "dsp-alert " + (isPeak ? "dsp-alert-peak" : "dsp-alert-valley"),
				}, alert));
				if (!collapsed && cost !== null) top.push(react.createElement("span", { className: "dsp-cost" },
					T.sessionCost + ": ",
					react.createElement("b", null, fmtMoney(cost.valley)),
					react.createElement("span", { className: "dsp-dim" }, " (" + T.valleyLbl + ") · "),
					react.createElement("b", null, fmtMoney(cost.peak)),
					react.createElement("span", { className: "dsp-dim" }, " (" + T.peakLbl + ")")));
				if (!collapsed && pending) top.push(react.createElement("span", { className: "dsp-note" },
					T.newPricing + " 16/08 " + local12(EFFECTIVE_MS)));
				if (!collapsed && update !== null) top.push(react.createElement("button", {
					className: "dsp-btn",
					disabled: updateState !== null && updateState !== "error",
					title: T.updateTip,
					onClick: () => {
						setUpdateState("working");
						fetch(PRICES_URL + "?action=update", { method: "POST", cache: "no-store" })
							.then((r) => r.json())
							.then((d) => setUpdateState(d.ok ? "done" : "error"))
							.catch(() => setUpdateState("error"));
					},
				}, updateState === "working" ? T.updating
					: updateState === "done" ? T.updatedDone
					: updateState === "error" ? T.updateErr
					: "⬆ " + T.updateTo + " v" + update.latest));
				if (live && live.plugin && live.plugin.version) top.push(react.createElement("span", {
					className: "dsp-ver",
					title: "plugin v" + live.plugin.version,
				}, "v" + live.plugin.version));

				if (collapsed) {
					return react.createElement("div", {
						className: "dsp-card",
						role: "status",
						"aria-live": "polite",
						"data-phase": phase.phase,
					},
						react.createElement("div", { className: "dsp-top" }, ...top));
				}

				const segEls = segs.map((w, i) => react.createElement("div", {
					key: "s" + i,
					className: "dsp-seg dsp-seg-peak",
					title: T.peakShort,
					style: { left: pctOf(w[0]) + "%", width: (pctOf(w[1]) - pctOf(w[0])) + "%" },
				}, T.peakShort));
				const labels = segs.flatMap((w, i) => [
					react.createElement("span", { key: "l" + i + "a", style: { left: clamp(pctOf(w[0])) + "%" } },
						local12(localDayStartMs + w[0] * 60000)),
					react.createElement("span", { key: "l" + i + "b", style: { left: clamp(pctOf(w[1])) + "%" } },
						local12(localDayStartMs + w[1] * 60000)),
				]);
				const track = react.createElement("div", {
					className: "dsp-day-track",
					title: T.dayTip,
				},
					...segEls,
					react.createElement("div", {
						className: "dsp-now",
						title: T.nowTip,
						style: { left: pctOf(localMins(now)) + "%" },
					}));
				const day = react.createElement("div", { className: "dsp-day" },
					track,
					react.createElement("div", { className: "dsp-day-labels" }, ...labels));

				const children = [
					react.createElement("div", { className: "dsp-top" }, ...top),
					day,
				];
				if (open) {
					const head = react.createElement("tr", null,
						react.createElement("th", null, T.model),
						react.createElement("th", null, T.hit),
						react.createElement("th", null, T.miss),
						react.createElement("th", null, T.output));
					const rows = models.map((m) => react.createElement("tr", { key: m.model },
						react.createElement("td", null, m.model),
						priceCell(m.offPeak.hit, m.peak.hit),
						priceCell(m.offPeak.miss, m.peak.miss),
						priceCell(m.offPeak.out, m.peak.out)));
					const table = react.createElement("table", { className: "dsp-table" },
						react.createElement("thead", null, head),
						react.createElement("tbody", null, rows));
					const localRanges = segs
						.map((w) => local12(localDayStartMs + w[0] * 60000) + "-" + local12(localDayStartMs + w[1] * 60000))
						.join(" " + T.and + " ");
					const utcWinText = windows
						.map((w) => pad2(Math.floor(w[0] / 60)) + ":" + pad2(w[0] % 60) + "-" + pad2(Math.floor(w[1] / 60)) + ":" + pad2(w[1] % 60))
						.join(" " + T.and + " ");
					const legend = react.createElement("div", { className: "dsp-legend" },
						react.createElement("span", null,
							react.createElement("span", { className: "dsp-sw", style: { background: "var(--dsw-alias-state-success-primary)" } }),
							T.valleyLbl),
						react.createElement("span", null,
							react.createElement("span", { className: "dsp-sw", style: { background: "var(--dsw-alias-state-error-primary)" } }),
							T.peakLbl),
						react.createElement("span", null, T.usd),
						react.createElement("span", null, T.utcWin + " " + utcWinText + " UTC · " + T.localWin + " " + localRanges),
						react.createElement("span", { className: "dsp-src" },
							liveOk ? T.live + " ✓ · " + T.updated + " " + local12(live.fetchedAt) : T.fallback));
					children.push(table, legend);
				}
				return react.createElement("div", {
					className: "dsp-card",
					role: "status",
					"aria-live": "polite",
					"data-phase": phase.phase,
				}, ...children);
			}

			function DeepSeekHeaderPill() {
				const [now, setNow] = react.useState(Date.now());
				react.useEffect(() => ctx.interval(() => setNow(Date.now()), 1000), []);
				const windows = PEAK_WINDOWS;
				const phase = phaseAt(now, windows);
				const label = phase.phase === "peak" ? T.peak : phase.phase === "flat" ? T.flat : T.valley;
				const detail = phase.phase === "flat"
					? T.cutoverTo + " " + fmtHm(phase.minutesToNext) + " → " + T.live + " (" + local12(EFFECTIVE_MS) + ")"
					: (phase.nextStart ? T.peak : T.valleyLbl) + " " + fmtHm(phase.minutesToNext);
				return react.createElement("span", {
					className: "dsp-header-pill",
					role: "status",
					"aria-live": "polite",
					"data-phase": phase.phase,
					title: label + " · " + detail + " · " + offsetLabel(),
				},
					react.createElement("span", {
						className: "dsp-header-dot " + (phase.phase === "peak" ? "dsp-h-peak" : phase.phase === "flat" ? "dsp-h-flat" : "dsp-h-off"),
					}),
					react.createElement("span", null, label),
					react.createElement("span", { className: "dsp-h-count" }, fmtHm(phase.minutesToNext)),
					react.createElement("span", { className: "dsp-h-arrow" }, "→"),
					react.createElement("span", { className: "dsp-h-count" },
						phase.phase === "flat" ? T.live : (phase.nextStart ? T.peak : T.valleyLbl)));
			}

			slots.inject("conversation.input.dock", () => slots.register(
				{ name: "conversation.input.dock", id: "deepseek-price-timer", order: 30 },
				(props) => react.createElement(DeepSeekPriceTimer, { session: props && props.session }),
			));
			slots.inject("conversation.session.header.utilities", () => slots.register(
				{ name: "conversation.session.header.utilities", id: "deepseek-price-timer-pill", order: -10 },
				() => react.createElement(DeepSeekHeaderPill),
			));
		}

		const inject = ["timer"];

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
