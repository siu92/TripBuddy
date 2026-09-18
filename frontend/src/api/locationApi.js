import { apiClient, withMockFallback } from './apiClient';
import { API_ENDPOINTS, API_SOURCE_LABELS } from './contracts';
import { MOCK_PLACES, MOCK_REGION_SUMMARIES } from './mockData';
import { normalizeContentEnvelope, normalizeLocationItem } from './normalizers';

function normalizeLocation(item) {
  return {
    ...item,
    point: item.point ?? { latitude: item.latitude ?? null, longitude: item.longitude ?? null },
  };
}

/**
 * 출발지·도착지·경유지 검색 전용 어댑터.
 * 백엔드는 Kakao/Naver/TMAP 중 무엇을 사용하든 아래 반환 DTO를 유지한다.
 */
export function createLocationApi({ client = apiClient } = {}) {
  return {
    async listDomesticRegions({ signal } = {}) {
      return withMockFallback(
        async () => normalizeContentEnvelope(await client.request(API_ENDPOINTS.locations.regions, { query: { countryCode: 'KR' }, signal })),
        async () => ({ items: MOCK_REGION_SUMMARIES, isMock: true, sourceLabel: API_SOURCE_LABELS.mock }),
      );
    },

    /**
     * 선택한 시·도의 시·군·구 목록을 반환한다.
     * 실제 서버는 각 항목에 WGS84 좌표, 행정코드, 인근 공항 정보를 포함해야 한다.
     * 프런트의 현재 발표용 목록은 별도 catalog를 사용하므로, mock에서는 빈 배열을 반환한다.
     */
    async listDistricts(regionCode, { signal } = {}) {
      if (!regionCode) return { items: [], isMock: true, sourceLabel: API_SOURCE_LABELS.mock };

      return withMockFallback(
        async () => normalizeContentEnvelope(await client.request(API_ENDPOINTS.locations.districts(regionCode), { signal })),
        async () => ({ items: [], isMock: true, sourceLabel: API_SOURCE_LABELS.mock }),
      );
    },

    /** @param {import('./contracts').PlaceSearchRequest} request */
    async searchPlaces(request, { signal } = {}) {
      return withMockFallback(
        async () => normalizeContentEnvelope(await client.request(API_ENDPOINTS.locations.search, { query: request, signal })),
        async () => {
          const keyword = (request.query ?? '').trim().toLowerCase();
          const items = MOCK_PLACES
            .filter((place) => !keyword || `${place.name} ${place.address}`.toLowerCase().includes(keyword))
            .slice(0, request.limit ?? 10)
            .map(normalizeLocation);
          return { items, isMock: true, sourceLabel: API_SOURCE_LABELS.mock };
        },
      );
    },

    /** 자유 입력 위치를 지도 제공자 좌표로 변환한다. */
    async geocode(query, { signal } = {}) {
      return withMockFallback(
        async () => {
          const payload = await client.request(API_ENDPOINTS.locations.geocode, { query: { query }, signal });
          const item = normalizeLocationItem(payload?.item ?? payload?.documents?.[0] ?? payload);
          return { ...payload, item };
        },
        async () => ({
          item: {
            id: `custom-${encodeURIComponent(query)}`,
            name: query,
            category: '직접 입력 위치',
            address: query,
            point: { latitude: null, longitude: null },
            needsGeocoding: true,
          },
          isMock: true,
          sourceLabel: API_SOURCE_LABELS.mock,
        }),
      );
    },
  };
}

export const locationApi = createLocationApi();
