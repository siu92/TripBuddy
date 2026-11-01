import test, { after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

// Use the production module graph, including the existing catalog's image imports.
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
after(() => server.close());
const { calculateTripCosts } = await server.ssrLoadModule(
  "/src/planner/tripCostModel.js",
);
const { sumCostGroups } = await server.ssrLoadModule(
  "/src/utils/costEstimate.js",
);
const input = (overrides = {}) => ({
  destinationLocation: { name: "제주" },
  departureLocation: { name: "서울" },
  budget: 900000,
  transport: "FLIGHT",
  localTransport: "RENTAL",
  carType: "세단",
  carFuel: "휘발유",
  budgetStatus: null,
  planEdits: {},
  backendPlan: {
    routes: [
      {
        segments: [
          { mode: "RENTAL_CAR", distanceKm: 120, cost: 30000 },
          { mode: "FLIGHT", distanceKm: 800, cost: 50000 },
        ],
      },
    ],
  },
  announcedPlanEstimate: 0,
  selectedFlight: { fare: 180000 },
  selectedRental: { price: 90000, company: "렌터카", car: "세단" },
  selectedStay: { name: "숙소", priceAvg: 150000 },
  nights: 2,
  party: 3,
  rooms: 1,
  routeDistanceKm: 450,
  selectedTicket: null,
  baseDayPlans: [],
  dayPlans: [
    [
      "1일차",
      "",
      [
        [
          "12:00",
          "🍽",
          "식당",
          "",
          "",
          0,
          { type: "RESTAURANT", pricePerPerson: 12000 },
        ],
        [
          "14:00",
          "📍",
          "관광지",
          "",
          "",
          0,
          { type: "ATTRACTION", pricePerPerson: 15000 },
        ],
        [
          "18:00",
          "🏨",
          "숙소",
          "",
          "",
          0,
          { type: "ACCOMMODATION", pricePerPerson: 150000 },
        ],
      ],
    ],
  ],
  placeEditAdjustment: 0,
  ...overrides,
});

test("공동 숙소·렌터카·차량비를 인원수로 나누고 예약 이벤트를 중복 계산하지 않는다", () => {
  const result = calculateTripCosts(input());
  assert.equal(result.stayTotal, 100000);
  assert.equal(result.driveTotal, 46000);
  assert.equal(result.foodTotal, 12000);
  assert.equal(result.activityTotal, 15000);
  assert.equal(result.total, 353000);
  assert.equal(sumCostGroups(result.reconciledCostDetails), result.total);
});

test("서버 공동 경비의 total만 분할하고 perPerson은 다시 나누지 않는다", () => {
  for (const item of [
    { name: "숙소", total: 300000, scope: "shared" },
    { name: "숙소", perPerson: 100000, scope: "shared" },
  ]) {
    const result = calculateTripCosts(
      input({
        backendPlan: { costEstimate: { perPerson: 100000, items: [item] } },
      }),
    );
    assert.equal(result.reconciledCostDetails[0].rows[0][1], 100000);
    assert.equal(result.total, 100000);
  }
});

test("생성 전 안내액을 유지하면서 상세 항목 합계를 총액과 맞춘다", () => {
  const result = calculateTripCosts(input({ announcedPlanEstimate: 650000 }));
  assert.equal(result.total, 650000);
  assert.equal(sumCostGroups(result.reconciledCostDetails), 650000);
});

test("조회 전 빈 선택과 가격 미제공 숙소에서도 유한한 합계를 반환한다", () => {
  const result = calculateTripCosts(
    input({
      transport: "",
      localTransport: "",
      selectedFlight: null,
      selectedRental: null,
      selectedStay: { name: "가격 미정", priceAvg: null },
      backendPlan: null,
      dayPlans: [],
    }),
  );
  assert.equal(result.total, 0);
  assert.equal(result.stayTotal, 0);
  assert.equal(Number.isFinite(result.gap), true);
});
