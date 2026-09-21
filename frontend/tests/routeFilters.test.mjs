import test from "node:test";
import assert from "node:assert/strict";

import {
  isAirportEvent,
  isAirportName,
  isAirportRouteSegment,
} from "../src/utils/routeFilters.js";

test("공항과 항공 구간은 여행지 동선에서 제외한다", () => {
  assert.equal(isAirportName("김포국제공항"), true);
  assert.equal(isAirportName("Jeju Airport"), true);
  assert.equal(isAirportEvent("제주 도착", { type: "AIRPORT" }), true);
  assert.equal(isAirportRouteSegment({
    mode: "CAR",
    departureName: "김포국제공항",
    arrivalName: "제주국제공항",
  }), true);
  assert.equal(isAirportRouteSegment({
    mode: "CAR",
    departureName: "빌리카",
    arrivalName: "애월 카페 거리",
  }), false);
});
