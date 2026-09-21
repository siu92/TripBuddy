import test from "node:test";
import assert from "node:assert/strict";

import {
  addPriceVariationBuffer,
  stablePlanEstimate,
  sumCostGroups,
} from "../src/utils/costEstimate.js";

test("일정 생성 뒤 계산값이 낮아져도 사용자에게 안내한 예상 경비를 유지한다", () => {
  const total = stablePlanEstimate({
    calculatedTotal: 566263,
    announcedTotal: 650000,
    detailedTotal: 550000,
  });

  assert.equal(total, 650000);
});

test("상세 경비와 안내 총액의 차이는 현장 가격 변동 여유로 명확히 표시한다", () => {
  const groups = [
    { group: "개인 교통비", rows: [["항공권", 250000, "왕복"]] },
    { group: "공동 예약비", rows: [["숙소", 300000, "2박"]] },
  ];
  const reconciled = addPriceVariationBuffer(groups, 650000);

  assert.equal(sumCostGroups(reconciled), 650000);
  assert.equal(reconciled.at(-1).rows[0][1], 100000);
});
