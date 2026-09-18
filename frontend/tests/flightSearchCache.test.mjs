import test from "node:test";
import assert from "node:assert/strict";
import { createFlightSearch } from "../src/api/flightApi.js";

const query = {
  departure: "서울 김포국제공항", destination: "제주", direction: "OUTBOUND",
  startDate: "2026-09-20", endDate: "2026-09-22", peopleCount: 2,
};
const result = { outboundFlights: [{ id: "flight-1", price: 70000 }], returnFlights: [] };

test("same query shares one in-flight request and retains independent results", async () => {
  let calls = 0;
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const search = createFlightSearch({ getSession: () => "a", request: async (url, options) => {
    calls++;
    assert.equal(url, "/api/flights/search");
    assert.deepEqual(options.body, { ...query, startTime: "00:00", endTime: "23:59" });
    await gate;
    return result;
  }});
  const first = search(query);
  const second = search(query);
  await Promise.resolve();
  assert.equal(calls, 1);
  release();
  const [a, b] = await Promise.all([first, second]);
  assert.deepEqual(a, result);
  a.outboundFlights[0].price = 1;
  assert.equal(b.outboundFlights[0].price, 70000);
  assert.deepEqual(await search(query), result);
  assert.equal(calls, 1);
});

test("cache expires after one minute and every search condition separates queries", async () => {
  let time = 0, calls = 0;
  const search = createFlightSearch({ getSession: () => "a", now: () => time, request: async () => {
    calls++; return { ...result, returnFlights: [{ id: "return-1" }] };
  }});
  await search(query);
  time = 59999;
  await search(query);
  assert.equal(calls, 1);
  time = 60000;
  await search(query);
  assert.equal(calls, 2);
  for (const change of [{ peopleCount: 3 }, { direction: "RETURN" }, { departure: "부산" },
    { destination: "서울" }, { startDate: "2026-09-21" }, { endDate: "2026-09-23" },
    { startTime: "08:00" }, { endTime: "19:00" }]) await search({ ...query, ...change });
  assert.equal(calls, 10);
});

test("errors and empty lists do not prevent a fresh retry", async () => {
  let calls = 0;
  const search = createFlightSearch({ getSession: () => "a", request: async () => {
    calls++;
    if (calls === 1) throw Error("supplier unavailable");
    if (calls === 2) return { outboundFlights: [] };
    return result;
  }});
  await assert.rejects(search(query));
  await search(query);
  assert.deepEqual(await search(query), result);
  assert.equal(calls, 3);
});

test("session changes clear results; old in-flight results cannot repopulate the cache", async () => {
  let session = "a", calls = 0, release;
  const gate = new Promise(resolve => { release = resolve; });
  const search = createFlightSearch({ getSession: () => session, request: async () => {
    const id = ++calls;
    if (id === 1) await gate;
    return { outboundFlights: [{ id }] };
  }});
  const old = search(query);
  await Promise.resolve();
  session = "b";
  assert.equal((await search(query)).outboundFlights[0].id, 2);
  release(); await old;
  assert.equal((await search(query)).outboundFlights[0].id, 2);
  assert.equal(calls, 2);
});

test("explicit abort signals remain independent from shared warm-up requests", async () => {
  const signals = [];
  const search = createFlightSearch({ getSession: () => "a", request: async (_, options) => {
    signals.push(options.signal); return result;
  }});
  await search(query);
  const controller = new AbortController();
  await search({ ...query, signal: controller.signal });
  assert.equal(signals.length, 2);
  assert.equal(signals[1], controller.signal);
});
