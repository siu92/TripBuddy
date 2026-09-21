import assert from "node:assert/strict";
import test from "node:test";

import { buildPlanEditRequest } from "../src/utils/planEditPayload.js";

const fixed = (order, type, name) => ({ order, type, name, startAt: `2026-09-19T0${order}:00:00` });

test("화면의 합성 카드 대신 원본 고정 일정을 유지하고 편집 가능 일정만 재정렬한다", () => {
  const snapshot = {
    revision: 4,
    requestId: "request-1",
    plan: {
      days: [{
        dayNumber: 1,
        items: [
          fixed(1, "AIRPORT", "제주공항"),
          { ...fixed(2, "ATTRACTION", "한림공원"), stayMinutes: 90 },
          { ...fixed(3, "CAFE", "애월카페"), stayMinutes: 60 },
          fixed(4, "ACCOMMODATION", "숙소"),
        ],
      }],
    },
  };
  const event = (sourceKey, type, stayMinutes, replacement = null) => [
    "10:00", "📍", sourceKey, "", `${stayMinutes}분`, 0,
    { sourceKey, type, stayMinutes, replacement },
  ];
  const dayPlans = [["1일차", "", [
    event("1:3", "CAFE", 60, { type: "CAFE", placeId: 77 }),
    ["", "🚗", "합성 렌터카 카드", "", "0분", 0, { type: "RENTAL_CAR" }],
    event("1:2", "ATTRACTION", 90),
  ]]];

  const request = buildPlanEditRequest(snapshot, dayPlans);

  assert.equal(request.baseRevision, 4);
  assert.deepEqual(request.days[0].items.map((item) => item.itemKey), ["1:1", "1:3", "1:2", "1:4"]);
  assert.deepEqual(request.days[0].items[1].replacement, { type: "CAFE", placeId: 77 });
  assert.equal(request.days[0].items[1].startTime, null);
});
