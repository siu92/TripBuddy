import test from "node:test";
import assert from "node:assert/strict";

globalThis.localStorage = {
  getItem(key) {
    return key === "tripbuddy.accessToken" ? "test-token" : null;
  },
  setItem() {},
  removeItem() {},
};

const requests = [];
let statusCount = 0;

globalThis.fetch = async (url, options = {}) => {
  requests.push({ url: String(url), options });

  const data = options.method === "POST"
    ? { tripId: 9, requestId: "request-9", status: "PENDING" }
    : ++statusCount === 1
      ? { tripId: 9, requestId: "request-9", status: "PROCESSING" }
      : {
          tripId: 9,
          requestId: "request-9",
          status: "COMPLETED",
          plan: {
            tripId: 9,
            planner: "BEDROCK",
            timeBasis: "ROUTED_SCHEDULE",
            days: [
              {
                dayNumber: 1,
                date: "2026-09-18",
                items: [],
                transportSegments: [],
              },
            ],
          },
        };

  return new Response(
    JSON.stringify({ success: true, data }),
    {
      status: options.method === "POST" ? 202 : 200,
      headers: { "content-type": "application/json" },
    },
  );
};

const { requestTripPlan } = await import("../src/api/tripPlanApi.js");

test("202 일정 요청은 PROCESSING을 polling한 뒤 COMPLETED plan을 반환한다", async () => {
  const plan = await requestTripPlan(9, {
    pollIntervalMs: 0,
    pollTimeoutMs: 1000,
  });

  assert.equal(plan.tripId, 9);
  assert.equal(plan.dayPlans.length, 1);
  assert.deepEqual(
    requests.map(({ options }) => options.method),
    ["POST", "GET", "GET"],
  );
  assert.ok(requests.every(({ options }) =>
    options.headers.Authorization === "Bearer test-token"));
});
