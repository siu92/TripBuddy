import test from "node:test";
import assert from "node:assert/strict";

import { locationRequestName } from "../src/utils/locationPayload.js";

test("제주 대표 관광지는 행정구역 접두어 없이 정확한 장소명을 전달한다", () => {
  assert.equal(locationRequestName({
    region: "제주특별자치도",
    detail: "애월 카페 거리",
    requestName: "애월 카페 거리",
  }), "애월 카페 거리");
});

test("행정구역 선택은 기존처럼 권역과 세부지역을 함께 전달한다", () => {
  assert.equal(locationRequestName({
    region: "서울특별시",
    detail: "성동구",
  }), "서울특별시 성동구");
});
