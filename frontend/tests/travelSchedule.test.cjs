const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { resolveTripSchedule, parseTicketLeg, safeTime, makeDemoTicketOptions, normalizeTypedTime, recalculateDayTimeline } = require('../src/data/travelSchedule.js');
const { koreanRegions } = require('../src/data/locationCatalog.js');
// The catalog imports a JPEG for Vite; evaluate its pure planning exports with an asset stub.
const catalog = fs.readFileSync(require.resolve('../src/data/mockData.js'), 'utf8').replace(/^import .*;\r?\n/gm, '').replace(/export const /g, 'const ');
const { makeDayPlans, getPlaceAlternatives, applyFoodPreferences } = vm.runInNewContext(`${catalog}\n({makeDayPlans, getPlaceAlternatives, applyFoodPreferences})`, { jejuCoastPhoto: '', koreanRegions, safeTime, parseTicketLeg, Date });
const dates = { startDate: '2026-09-08', endDate: '2026-09-10' };
const ticket = { out: '10:00 → 11:15', back: '18:15 → 19:25', airline: '대한항공', origin: 'ICN' };
const minutes = value => value.split(':').reduce((hours, part) => hours * 60 + Number(part), 0);

test('scheduled transport uses ticket arrival and return departure, ignoring manual times', () => {
  for (const mode of ['FLIGHT', 'KTX', 'BUS']) {
    const result = resolveTripSchedule({ mode, ticket, startTime: '05:00', endTime: '23:00', ...dates });
    assert.equal(result.arrivalTime, '11:15'); assert.equal(result.endTime, '18:15');
    assert.equal(result.departureTime, '10:00'); assert.equal(result.returnArrivalTime, '19:25');
  }
});
test('missing or malformed tickets cannot fall back to manual times', () => {
  for (const ticket of [null, { out: '10:00 → 11:15' }, { out: '99:99 → 11:00', back: '18:00 → 20:00' }])
    assert.equal(resolveTripSchedule({ mode: 'KTX', ticket, startTime: '09:00', endTime: '18:00', ...dates }).ready, false);
});
test('car ignores stale flight and reserves driving time in both directions', () => {
  const result = resolveTripSchedule({ mode: 'CAR', ticket, startTime: '08:00', endTime: '21:00', manualConfirmed: true, carMinutes: 120, ...dates });
  assert.equal(result.arrivalTime, '10:00'); assert.equal(result.endTime, '19:00'); assert.equal(result.source, 'manual');
});
test('car cancellation and impossible same-day round trips block generation', () => {
  assert.equal(resolveTripSchedule({ mode: 'CAR', startTime: '09:00', endTime: '18:00', ...dates }).ready, false);
  assert.equal(resolveTripSchedule({ mode: 'CAR', startTime: '09:00', endTime: '12:00', manualConfirmed: true, carMinutes: 120, startDate: dates.startDate, endDate: dates.startDate }).ready, false);
});
test('same-day tickets require arrival before return including boarding buffer', () => {
  assert.equal(resolveTripSchedule({ mode: 'FLIGHT', ticket: { out: '10:00 → 11:15', back: '12:00 → 13:10' }, startDate: dates.startDate, endDate: dates.startDate }).ready, false);
});
test('overnight legs are rejected without explicit arrival dates', () => assert.equal(parseTicketLeg('23:00 → 01:00'), null));
test('four typed time digits are normalized to HH:mm', () => {
  assert.equal(normalizeTypedTime('1830'), '18:30');
  assert.equal(normalizeTypedTime('09:30'), '09:30');
  assert.equal(normalizeTypedTime('7'), '7');
});
test('drag reorder recalculates every following time from route distance', () => {
  const day = ['테스트', '동선', [
    ['10:00', '📍', 'A', '', '60분', 10, { latitude: 33.46, longitude: 126.31 }],
    ['11:10', '📍', 'B', '', '30분', 10, { latitude: 33.39, longitude: 126.24 }],
    ['11:50', '📍', 'C', '', '40분', 0, { latitude: 33.37, longitude: 126.36 }],
  ]];
  const result = recalculateDayTimeline(day, 'RENTAL');
  assert.equal(result[2][0][0], '10:00');
  assert.ok(minutes(result[2][1][0]) > minutes('11:10'));
  assert.ok(minutes(result[2][2][0]) > minutes(result[2][1][0]));
  assert.notEqual(result[2][0][5], 10);
});
test('all demo KTX and bus options have valid independent outbound and return legs', () => {
  for (const mode of ['KTX', 'BUS']) for (const offer of makeDemoTicketOptions(mode, 500)) {
    assert.ok(parseTicketLeg(offer.out)); assert.ok(parseTicketLeg(offer.back)); assert.equal(offer.isMock, true);
  }
});
test('itinerary starts at ticket arrival and ends at actual return departure', () => {
  for (const mode of ['FLIGHT', 'KTX', 'BUS']) {
    const plans = makeDayPlans('05:00', '23:00', null, ticket, { regionCode: 'KR-26', region: '부산광역시', detail: '부산' }, { detail: '서울' }, mode, 3);
    assert.equal(plans[0][2][0][0], '11:15'); assert.equal(plans.at(-1)[2].at(-1)[0], '18:15');
    for (const day of plans) for (let i=1; i<day[2].length; i++) assert.ok(minutes(day[2][i][0]) >= minutes(day[2][i-1][0]));
  }
});
test('early return and malformed inputs never produce NaN or activities after departure', () => {
  for (const end of ['07:00', 'invalid', null]) {
    const plans = makeDayPlans(undefined, end, null, null, { regionCode: 'KR-26', detail: '부산' }, {}, 'CAR', 3);
    const last = plans.at(-1)[2];
    assert.ok(!JSON.stringify(plans).includes('NaN'));
    for (const event of last) assert.ok(minutes(event[0]) <= minutes(last.at(-1)[0]));
  }
});
test('plan events expose stable lock and booking metadata', () => {
  const plans = makeDayPlans('11:15', '18:15', { name: '테스트 숙소', area: '애월' }, ticket, { regionCode: 'KR-49', region: '제주특별자치도', detail: '애월읍' }, { detail: '서울' }, 'FLIGHT', 3);
  const events = plans.flatMap(day => day[2]);
  assert.ok(events.every(event => event[6]?.id));
  assert.ok(events.some(event => event[6].isLocked));
  assert.ok(events.some(event => event[6].bookingUrl));
});
test('place alternatives match the selected item category and destination', () => {
  const destination = { region: '부산광역시', detail: '해운대구' };
  const food = getPlaceAlternatives(destination, { icon: '🍽', name: '기존 식당' });
  const sights = getPlaceAlternatives(destination, { icon: '📸', name: '기존 관광지' });
  assert.equal(food.length, 6); assert.equal(sights.length, 9);
  assert.ok(food.every(place => /🍽|🍜|🍱|☕|🍲/.test(place.icon)));
  assert.ok(food.every(place => place.name.includes('해운대구')));
});
test('food preferences replace dining stops with cuisine metadata without changing locked travel stops', () => {
  const plans = makeDayPlans('11:15', '18:15', null, ticket, { regionCode: 'KR-49', detail: '오설록 티 뮤지엄' }, { detail: '서울' }, 'FLIGHT', 3);
  const adjusted = applyFoodPreferences(plans, ['JAPANESE'], { regionCode: 'KR-49', detail: '오설록 티 뮤지엄' });
  const dining = adjusted.flatMap(day => day[2]).find(event => event[6]?.cuisineCode === 'JAPANESE');
  assert.ok(dining); assert.equal(dining[6].apiSearchKeyword.includes('제주'), true);
  assert.equal(adjusted[0][2][0][2], plans[0][2][0][2]);
});
