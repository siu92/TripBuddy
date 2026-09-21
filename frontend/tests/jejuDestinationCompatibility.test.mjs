import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { toSpotDestination } from "../src/utils/destinationSelection.js";
import { locationRequestName } from "../src/utils/locationPayload.js";

const expected = [
  ["동문시장", 33.5116, 126.5260],
  ["함덕해수욕장", 33.5431, 126.6692],
  ["성산일출봉", 33.4581, 126.9426],
  ["한담해안산책로", 33.4626, 126.3108],
  ["애월 카페 거리", 33.4635, 126.3094],
  ["곽지해수욕장", 33.4507, 126.3055],
  ["협재해수욕장", 33.3942, 126.2398],
  ["금능해변", 33.3904, 126.2359],
  ["새별오름", 33.3663, 126.3578],
  ["오설록 티 뮤지엄", 33.3059, 126.2895],
  ["카멜리아힐", 33.2897, 126.3701],
  ["산방산·용머리 해안", 33.2316, 126.3148],
  ["천제연폭포", 33.2528, 126.4173],
  ["중문색달해수욕장", 33.2450, 126.4115],
  ["주상절리대", 33.2379, 126.4260],
];

test("제주 대표 명소 15곳은 일정 생성용 이름과 좌표가 모두 유효하다", () => {
  const parent = { id: "destination-jeju", title: "제주도", region: "제주특별자치도" };
  const ids = new Set();

  expected.forEach(([name, latitude, longitude], index) => {
    const selected = toSpotDestination(parent, {
      id: `jeju-spot-${index + 1}`,
      name,
      latitude,
      longitude,
    }, index);

    assert.equal(locationRequestName(selected), name);
    assert.ok(selected.latitude >= 33.1 && selected.latitude <= 33.6, `${name} 위도`);
    assert.ok(selected.longitude >= 126.1 && selected.longitude <= 127.0, `${name} 경도`);
    assert.equal(selected.needsGeocoding, false);
    ids.add(selected.id);
  });

  assert.equal(expected.length, 15);
  assert.equal(ids.size, 15);
});

test("화면의 제주 대표 명소 목록에도 15곳이 모두 유지된다", () => {
  const source = fs.readFileSync(new URL("../src/components/DestinationExplorer.jsx", import.meta.url), "utf8");
  expected.forEach(([name]) => assert.ok(source.includes(`\"name\": \"${name}\"`), name));
});
