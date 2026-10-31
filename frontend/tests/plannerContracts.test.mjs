import test from "node:test";
import assert from "node:assert/strict";
import { normalizeFlightCandidate, toFlightCandidatePayload } from "../src/planner/flightCandidates.js";
import { normalizeThemes, normalizeFoodPreferences } from "../src/planner/preferences.js";
import { MAIN_TRANSPORT_MAP, FOOD_PREFERENCE_MAP, inferRentalFuelType } from "../src/planner/domainMappings.js";
import { readInitialDraft, getTripCostSnapshot, saveTripCostSnapshot } from "../src/planner/plannerStorage.js";

test("항공 표시용 왕복 호환값과 서버에 저장할 편도 예상가를 구분한다", () => {
  const flight = { id: 7, estimatedPricePerPerson: 52000, departureTime: "2026-11-01T09:00:00", arrivalTime: "2026-11-01T10:10:00" };
  const card = normalizeFlightCandidate(flight);
  assert.equal(card.fare, 104000);
  assert.equal(card.durationMinutes, 70);
  assert.equal(toFlightCandidatePayload(card).estimatedPricePerPerson, 52000);
  assert.equal(toFlightCandidatePayload(null), null);
});

test("과거 저장 취향의 중복·허용되지 않은 값과 최대 선택 수를 정리한다", () => {
  assert.deepEqual(normalizeThemes(["관광", "관광", "쇼핑", "자연", "휴식", "맛집"]), ["관광", "자연", "휴식"]);
  assert.deepEqual(normalizeFoodPreferences(["KOREAN", "UNKNOWN", "KOREAN", "CAFE"]), ["KOREAN", "CAFE"]);
  assert.deepEqual(normalizeThemes(null), []);
  assert.equal(MAIN_TRANSPORT_MAP.FLIGHT, "AIR");
  assert.equal(FOOD_PREFERENCE_MAP.CASUAL, "SNACK");
  assert.equal(inferRentalFuelType({ car: "전기 SUV" }), "ELECTRIC");
});

test("지난 날짜의 초안은 날짜에 종속된 선택을 초기화하고 유효한 초안은 유지한다", () => {
  const previousWindow = globalThis.window;
  let value = JSON.stringify({ startDate: "2026-10-01", endDate: "2026-10-03", transport: "FLIGHT", localTransport: "RENTAL", bookingSelection: { flightId: 7 }, travelers: 3 });
  globalThis.window = { localStorage: { getItem: () => value } };
  try {
    const stale = readInitialDraft("2026-10-31");
    assert.equal(stale.startDate, "2026-10-31");
    assert.equal(stale.transport, "");
    assert.equal(stale.bookingSelection, undefined);
    assert.equal(stale.travelers, 3);
    value = JSON.stringify({ startDate: "2026-11-01", endDate: "2026-11-03", transport: "FLIGHT" });
    assert.equal(readInitialDraft("2026-10-31").transport, "FLIGHT");
    value = "broken-json";
    assert.deepEqual(readInitialDraft("2026-10-31"), {});
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test("브라우저 저장소가 차단돼도 경비 스냅샷 처리가 생성 흐름을 중단하지 않는다", () => {
  const previousWindow = globalThis.window;
  globalThis.window = { localStorage: { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } } };
  try {
    assert.doesNotThrow(() => saveTripCostSnapshot(7, { total: 100000 }));
    assert.equal(getTripCostSnapshot(7), null);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
