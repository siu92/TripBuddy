import test from "node:test";
import assert from "node:assert/strict";

import {
  estimateBaggageAllowance,
  flightDurationMinutes,
  flightRecommendationScore,
  orderFlights,
} from "../src/utils/flightRanking.js";

const flight = (id, departure, arrival, price, status = "Scheduled") => ({
  id,
  departureTime: `2026-09-16T${departure}:00`,
  arrivalTime: `2026-09-16T${arrival}:00`,
  estimatedPricePerPerson: price,
  status,
});

const flights = [
  flight("early-cheap", "06:00", "07:15", 60000),
  flight("morning-value", "10:00", "11:10", 70000),
  flight("afternoon", "15:00", "16:10", 65000),
  flight("evening", "17:00", "18:10", 72000),
];

test("추천순은 특가 항공편을 먼저 묶고 같은 묶음 안에서 종합점수를 적용한다", () => {
  const ordered = orderFlights({
    flights,
    sort: "recommended",
    leg: "outbound",
    dealIds: new Set(["morning-value", "afternoon"]),
  });

  assert.deepEqual(
    ordered.slice(0, 2).map((item) => item.id),
    ["morning-value", "afternoon"],
  );
});

test("가는 편은 오전 시간대, 오는 편은 오후 시간대의 활용도를 다르게 평가한다", () => {
  assert.ok(
    flightRecommendationScore(flights[1], flights, "outbound") >
      flightRecommendationScore(flights[3], flights, "outbound"),
  );
  assert.ok(
    flightRecommendationScore(flights[3], flights, "return") >
      flightRecommendationScore(flights[1], flights, "return"),
  );
});

test("최저가순과 출발시간순은 추천점수 및 특가 여부와 독립적으로 동작한다", () => {
  const dealIds = new Set(["evening"]);
  const byPrice = orderFlights({ flights, sort: "price", leg: "outbound", dealIds });
  const byTime = orderFlights({ flights, sort: "time", leg: "return", dealIds });

  assert.equal(byPrice[0].id, "early-cheap");
  assert.deepEqual(
    byTime.map((item) => item.id),
    ["early-cheap", "morning-value", "afternoon", "evening"],
  );
});

test("취소 항공편은 추천순에서 가장 낮은 점수를 받는다", () => {
  const cancelled = flight("cancelled", "10:00", "11:10", 50000, "Cancelled");
  assert.equal(
    flightRecommendationScore(cancelled, [...flights, cancelled], "outbound"),
    -1000,
  );
});

test("예상 수하물은 표시 운임이 높아질수록 같은 용량이거나 커진다", () => {
  const fareOptions = [
    flight("low", "08:00", "09:10", 65000),
    flight("middle", "10:00", "11:10", 85000),
    flight("high", "12:00", "13:10", 125000),
  ];

  const allowances = fareOptions.map((item) =>
    estimateBaggageAllowance(item, fareOptions),
  );

  assert.deepEqual(
    allowances.map((item) => item.checkedKg),
    [15, 20, 25],
  );
  assert.ok(allowances.every((item) => item.cabinKg === 10));
});

test("API가 개별 운항시간을 제공하면 시각 차이보다 해당 값을 우선 사용한다", () => {
  const supplied = {
    ...flight("variable-duration", "10:00", "11:15", 90000),
    durationMinutes: 68,
  };

  assert.equal(flightDurationMinutes(supplied), 68);
  assert.equal(
    flightDurationMinutes(flight("calculated-duration", "10:00", "11:15", 90000)),
    75,
  );
});
