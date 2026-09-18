import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiClientError, withMockFallback } from '../src/api/apiClient.js';
import {
  booleanValue,
  normalizeCostEstimate,
  normalizeFuelPrice,
  normalizeLocationItem,
  normalizeRestaurantDetail,
  normalizeRouteResult,
} from '../src/api/normalizers.js';
import { normalizeTripPlanResponse } from '../src/api/tripPlanApi.js';

test('Kakao Local 문자열 좌표와 미터 거리를 공통 DTO로 변환한다', () => {
  const item = normalizeLocationItem({
    id: '123', place_name: '애월 카페거리', x: '126.3090', y: '33.4620', distance: '1530',
  });
  assert.equal(item.name, '애월 카페거리');
  assert.deepEqual(item.point, { latitude: 33.462, longitude: 126.309 });
  assert.equal(item.distanceKm, 1.53);
});

test('Kakao Mobility 초/미터/vertexes를 분/킬로미터/WGS84로 변환한다', () => {
  const route = normalizeRouteResult({ routes: [{
    summary: { distance: 19032, duration: 3494, fare: { toll: 2400, taxi: 21900 } },
    sections: [{ roads: [{ vertexes: [126.3, 33.4, 126.4, 33.5] }] }],
  }] });
  assert.equal(route.provider, 'KAKAO_MOBILITY');
  assert.equal(route.distanceKm, 19.03);
  assert.equal(route.durationMinutes, 59);
  assert.equal(route.tollFee, 2400);
  assert.deepEqual(route.polyline[0], { latitude: 33.4, longitude: 126.3 });
});

test('TMAP FeatureCollection 응답을 공통 경로 DTO로 변환한다', () => {
  const route = normalizeRouteResult({ features: [{
    geometry: { type: 'LineString', coordinates: [[126.3, 33.4], [126.4, 33.5]] },
    properties: { totalDistance: 10500, totalTime: 901, tollFare: 1200, taxiFare: 15500 },
  }] });
  assert.equal(route.provider, 'TMAP');
  assert.equal(route.distanceKm, 10.5);
  assert.equal(route.durationMinutes, 16);
  assert.equal(route.tollFee, 1200);
});

test('문자열 false와 일정의 가격 범위를 안전하게 처리한다', () => {
  assert.equal(booleanValue('false'), false);
  const plan = normalizeTripPlanResponse({ plan: { travelers: 3, days: [{ events: [{
    id: 'stop-1', name: '숙성도 중문점', startTime: '13:20', durationSeconds: 4200,
    travelSeconds: 901, isLocked: 'false', x: '126.412', y: '33.255', price: 90000,
  }] }] } });
  const event = plan.dayPlans[0][2][0];
  assert.equal(event[4], '70분');
  assert.equal(event[5], 16);
  assert.equal(event[6].isLocked, false);
  assert.equal(event[6].pricePerPerson, null);
  assert.equal(event[6].latitude, 33.255);
});

test('오피넷 평균 유가와 비용의 쉼표 문자열을 숫자로 변환한다', () => {
  const fuel = normalizeFuelPrice({ RESULT: { OIL: [
    { PRODCD: 'B027', PRODNM: '휘발유', PRICE: '1,725.42', TRADE_DT: '20260910' },
  ] } }, 'gasoline');
  assert.equal(fuel.pricePerL, 1725.42);

  const cost = normalizeCostEstimate({ total: '120,000', items: [
    { id: 'meal', scope: 'personal', perPerson: '40,000' },
  ] }, 3);
  assert.equal(cost.total, 120000);
  assert.equal(cost.items[0].total, 120000);
  assert.equal(cost.items[0].perPerson, 40000);
});

test('식당 메뉴판과 후기 요약을 화면 공통 상세 DTO로 변환한다', () => {
  const restaurant = normalizeRestaurantDetail({
    placeId: 'restaurant-1', placeName: '제주 식당', x: '126.31', y: '33.46',
    images: [{ url: 'https://example.com/food.jpg' }],
    menuItems: [{ menuName: '전복돌솥밥', amount: '18,000', representative: 'true' }],
    reviewRating: '4.7', reviewsCount: '1,240',
    reviews: { summary: '대표 메뉴 만족도가 높아요.', keywords: ['전복', '가족 식사'] },
  });
  assert.equal(restaurant.id, 'restaurant-1');
  assert.equal(restaurant.menus[0].price, 18000);
  assert.equal(restaurant.menus[0].isSignature, true);
  assert.equal(restaurant.rating, 4.7);
  assert.equal(restaurant.reviewCount, 1240);
  assert.deepEqual(restaurant.reviewKeywords, ['전복', '가족 식사']);
});

test('개발 오류는 mock으로 숨기지 않고 네트워크/서버 오류만 폴백한다', async () => {
  await assert.rejects(
    withMockFallback(async () => { throw new TypeError('schema'); }, async () => 'mock', { forceMock: false }),
    TypeError,
  );
  assert.equal(
    await withMockFallback(
      async () => { throw new ApiClientError('offline', { code: 'NETWORK_ERROR' }); },
      async () => 'mock',
      { forceMock: false },
    ),
    'mock',
  );
});
