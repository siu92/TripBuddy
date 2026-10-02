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


test("공항점이라는 상호명은 실제 공항으로 오인하지 않는다", () => {
  assert.equal(isAirportName("고집돌우럭 제주공항점"), false);
  assert.equal(isAirportEvent("고집돌우럭 제주공항점", {
    type: "RESTAURANT",
    category: "음식점 > 한식 > 해물,생선",
  }), false);
  assert.equal(isAirportRouteSegment({
    mode: "RENTAL_CAR",
    departureName: "9.81파크 제주",
    arrivalName: "고집돌우럭 제주공항점",
  }), false);
  assert.equal(isAirportRouteSegment({
    mode: "RENTAL_CAR",
    departureName: "고집돌우럭 제주공항점",
    arrivalName: "애월더선셋리조트",
  }), false);
});
