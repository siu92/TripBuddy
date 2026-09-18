import { apiClient, withMockFallback } from './apiClient';
import { API_ENDPOINTS, API_SOURCE_LABELS } from './contracts';

function isIsland(location) {
  return location?.regionCode === 'KR-49'
    || /제주|울릉|백령|흑산/.test(`${location?.name ?? ''} ${location?.region ?? ''}`);
}

/**
 * 출발지·도착지·날짜를 받은 뒤 가능한 이동수단만 보여 주는 BFF 어댑터다.
 * 브라우저가 "제주는 무조건 항공"처럼 규칙을 하드코딩하지 않도록 서버가
 * 운행 가능성, 환승 필요 여부, 결항/운항 정보를 판단하는 구조를 만든다.
 */
export function createJourneyApi({ client = apiClient } = {}) {
  return {
    /** @param {import('./contracts').JourneyOptionsRequest} request */
    async listOptions(request, { signal } = {}) {
      return withMockFallback(
        () => client.request(API_ENDPOINTS.journey.options, {
          method: 'POST',
          body: request,
          signal,
        }),
        async () => {
          const destinationIsIsland = isIsland(request.destination);
          const hasAirport = Boolean(
            request.origin?.airportCodes?.length || request.destination?.airportCodes?.length,
          );
          const options = [
            {
              mode: 'CAR',
              label: '자차',
              available: true,
              requiredSteps: destinationIsIsland
                ? ['항구·차량 선적 배편 선택', '현지 주차·유류비 계산']
                : ['차량 정보 입력', '유류비·통행료 계산'],
              isMock: true,
            },
            {
              mode: 'KTX',
              label: 'KTX',
              available: !destinationIsIsland,
              unavailableReason: destinationIsIsland
                ? '철도만으로 도착할 수 없어 항공 또는 배편 환승이 필요합니다.'
                : undefined,
              requiredSteps: !destinationIsIsland ? ['출발역·도착역 선택'] : [],
              isMock: true,
            },
            {
              mode: 'FLIGHT',
              label: '항공',
              available: hasAirport,
              unavailableReason: hasAirport ? undefined : '인근 공항 정보를 찾지 못했습니다.',
              requiredSteps: hasAirport ? ['가는 편 선택', '오는 편 선택', '현지 이동수단 선택'] : [],
              isMock: true,
            },
            {
              mode: 'BUS',
              label: '고속·시외버스',
              available: !destinationIsIsland,
              unavailableReason: destinationIsIsland
                ? '섬 지역은 버스만으로 도착할 수 없습니다.'
                : undefined,
              requiredSteps: !destinationIsIsland ? ['출발 터미널·도착 터미널 선택'] : [],
              isMock: true,
            },
            {
              mode: 'FERRY',
              label: '배',
              available: destinationIsIsland,
              unavailableReason: destinationIsIsland ? undefined : '현재 목적지에는 배편이 필요하지 않습니다.',
              requiredSteps: destinationIsIsland ? ['출발 항구·배편 선택'] : [],
              isMock: true,
            },
          ];

          return {
            items: options,
            isMock: true,
            sourceLabel: API_SOURCE_LABELS.mock,
            refreshedAt: new Date().toISOString(),
          };
        },
      );
    },
  };
}

export const journeyApi = createJourneyApi();
