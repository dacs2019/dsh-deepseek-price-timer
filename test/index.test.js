import { test } from "node:test";
import assert from "node:assert/strict";
import { apply, inject } from "../lib/index.js";

// The update path must never fetch or write files in tests.
process.env.DSH_DSPT_REPO = "";

function makeHarness() {
	const routes = [];
	const timer = {
		timeout: () => () => {},
		interval: () => () => {},
	};
	const webServer = {
		register: (route) => {
			routes.push(route);
			return () => {};
		},
	};
	const ctx = {
		timer,
		webServer,
		effect: (fn) => fn(),
	};
	return { routes, ctx };
}

function call(handler, { method = "GET", url = "/plugins/dspt-prices.json", headers = {} } = {}) {
	return new Promise((resolve) => {
		const res = {
			status: null,
			headers: null,
			body: "",
			writeHead(status, headers) {
				this.status = status;
				this.headers = headers;
			},
			end(body) {
				this.body = body ?? "";
				resolve(this);
			},
		};
		const req = { method, url, headers };
		void handler(req, res);
	});
}

const { routes, ctx } = makeHarness();
apply(ctx);
const route = routes[0];

test("plugin declares its hard dependencies", () => {
	assert.deepEqual(inject, ["webServer", "timer"]);
});

test("registers an exact route for the prices endpoint (no suffix over-match)", () => {
	assert.ok(route, "a route was registered");
	assert.equal(route.kind, "exact");
	assert.equal(route.path, "/plugins/dspt-prices.json");
});

test("serves state JSON on GET with a query string (what the widget sends)", async () => {
	const res = await call(route.handler, { url: "/plugins/dspt-prices.json?t=123" });
	assert.equal(res.status, 200);
	const body = JSON.parse(res.body);
	assert.equal(body.models.length, 2);
	assert.equal(typeof body.plugin.version, "string");
});

test("GET with a same-origin Origin header still passes", async () => {
	const res = await call(route.handler, {
		url: "/plugins/dspt-prices.json?t=1",
		headers: { origin: "http://127.0.0.1", host: "127.0.0.1" },
	});
	assert.equal(res.status, 200);
});

test("rejects cross-origin update requests with 403 (CSRF)", async () => {
	const res = await call(route.handler, {
		method: "POST",
		url: "/plugins/dspt-prices.json?action=update",
		headers: { origin: "http://attacker.com", host: "127.0.0.1" },
	});
	assert.equal(res.status, 403);
});

test("update without a repo configured fails fast without fetching", async () => {
	const res = await call(route.handler, {
		method: "POST",
		url: "/plugins/dspt-prices.json?action=update",
		headers: { host: "127.0.0.1" },
	});
	assert.equal(res.status, 200);
	const body = JSON.parse(res.body);
	assert.equal(body.ok, false);
	assert.equal(body.error, "no repo configured");
});

test("rejects other methods with 405 without hanging", async () => {
	for (const method of ["PUT", "DELETE"]) {
		const res = await call(route.handler, { method });
		assert.equal(res.status, 405);
	}
});
