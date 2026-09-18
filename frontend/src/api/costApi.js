import { apiClient, withMockFallback } from './apiClient';
import { API_ENDPOINTS, API_SOURCE_LABELS } from './contracts';
import { normalizeCostEstimate } from './normalizers';

const won = (value) => Math.max(0, Math.round(Number(value) || 0));

/**
 * 더미 비용 계산기. 실제 운영 전환 시에도 출력 구조는 동일하게 유지한다.
 * 유류비 = 이동거리 ÷ 연비 × 리터당 가격
 * 공통비(통행료·주차·렌터카)는 travelers로 N/1 분배한다.
 */
export function calculateMockCostEstimate(request) {
  const travelers = Math.max(1, Number(request.travelers) || 1);
  const route = request.route ?? {};
  const mode = route.mode ?? 'CAR';
  const distanceKm = Number(route.distanceKm ?? route.routeResult?.distanceKm ?? 0);
  const localTravelKm = Number(request.localTravelKm ?? 0);
  const fuelEfficiency = Math.max(1, Number(request.fuelEfficiencyKmPerL ?? 12));
  const fuelPrice = Math.max(0, Number(request.fuelPricePerL ?? 1750));
  const tollFee = won(route.tollFee ?? route.routeResult?.tollFee ?? 0);
  const fuelFee = mode === 'CAR' || mode === 'RENTAL'
    ? won(((distanceKm + localTravelKm) / fuelEfficiency) * fuelPrice)
    : 0;
  const parkingFee = won(request.parkingFee);
  const vehicleFerryFare = won(request.vehicleFerryFare ?? request.ferryFare);
  const ferryPassengerFare = won(request.ferryPassengerFarePerPerson);
  const transportPerPerson = won(request.selectedTransportPrice);
  const lodgingTotal = won(request.selectedLodgingTotal);
  const rentalTotal = won(request.selectedRentalTotal);
  const mealPerPerson = won(request.estimatedMealsPerPerson);
  const activityPerPerson = won(request.estimatedActivitiesPerPerson);

  const shared = [
    ['통행료', tollFee, '경로 제공자의 예상 통행료'],
    ['유류비', fuelFee, `연비 ${fuelEfficiency}km/L, 유가 ${fuelPrice.toLocaleString()}원/L 가정`],
    ['주차비', parkingFee, '주차장·체류 시간에 따라 달라질 수 있음'],
    ['렌터카', rentalTotal, '선택한 차량의 총 대여료를 인원수로 나눈 금액'],
    ['차량 선적', vehicleFerryFare, '차량·항로·시즌에 따라 달라질 수 있음'],
  ].filter(([, total]) => total > 0);
  const personal = [
    ['교통', transportPerPerson, '선택한 교통편 1인 견적'],
    ['승객 배편', ferryPassengerFare, '선택한 승객 1인 배편 견적'],
    ['식비', mealPerPerson, '약 1인 예상 식비'],
    ['관광·체험', activityPerPerson, '약 1인 예상 체험비'],
  ].filter(([, total]) => total > 0);

  if (lodgingTotal > 0) {
    shared.push(['숙박', lodgingTotal, '객실 합계의 1인 N/1']);
  }

  const items = [
    ...personal.map(([label, perPerson, note]) => ({
      scope: 'personal',
      category: '개인 비용',
      label,
      total: perPerson * travelers,
      perPerson,
      approximate: !['교통', '승객 배편'].includes(label),
      note,
    })),
    ...shared.map(([label, total, note]) => ({ scope: 'shared', category: '공통 비용 N/1', label, total, perPerson: Math.ceil(total / travelers), approximate: true, note })),
  ];
  const total = items.reduce((sum, item) => sum + item.total, 0);
  const perPerson = Math.ceil(total / travelers);

  return {
    total,
    perPerson,
    currency: 'KRW',
    items,
    assumptions: [
      '교통·숙소·KTX·항공 가격은 API 연동 전 더미 또는 선택 견적일 수 있습니다.',
      '유류비·통행료·주차비·식비는 실제 출발 시각, 교통량, 시즌에 따라 달라질 수 있습니다.',
      '1인 금액은 총액을 인원수로 나눈 뒤 원 단위 올림 처리한 예상값입니다.',
    ],
    isMock: true,
    sourceLabel: API_SOURCE_LABELS.mock,
    calculatedAt: new Date().toISOString(),
  };
}

export function createCostApi({ client = apiClient } = {}) {
  return {
    /** @param {import('./contracts').CostEstimateRequest} request */
    async estimate(request, { signal } = {}) {
      return withMockFallback(
        async () => normalizeCostEstimate(
          await client.request(API_ENDPOINTS.costs.estimate, { method: 'POST', body: request, signal }),
          request.travelers,
        ),
        async () => calculateMockCostEstimate(request),
      );
    },
  };
}

export const costApi = createCostApi();
