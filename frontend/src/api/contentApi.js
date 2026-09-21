import { apiClient, withMockFallback } from './apiClient';
import { API_ENDPOINTS } from './contracts';
import { mockRestaurantDetail } from './mockRestaurantDetails';
import { normalizeRestaurantDetail } from './normalizers';
import { applyCuratedRestaurantMedia } from '../data/restaurantMedia';

/** 일정 상세 화면에서 사용하는 식당·카페 정보 조회 API. */
export function createContentApi({ client = apiClient } = {}) {
  return {
    /** @returns {Promise<import('./contracts').RestaurantDetail>} */
    async getRestaurantDetail(request, { signal } = {}) {
      const placeId = request.placeId || request.id || `lookup-${request.name || 'restaurant'}`;
      return withMockFallback(
        async () => applyCuratedRestaurantMedia(
          normalizeRestaurantDetail(await client.request(API_ENDPOINTS.tourism.restaurantDetail(placeId), {
            method: 'GET',
            query: { name: request.name, latitude: request.latitude, longitude: request.longitude },
            signal,
          })),
          request.name,
        ),
        async () => applyCuratedRestaurantMedia(
          normalizeRestaurantDetail(mockRestaurantDetail({ ...request, placeId })),
          request.name,
        ),
      );
    },

    /** 식당 상세와 동일한 UI 모델을 사용하는 카페 상세 조회. */
    async getCafeDetail(request, { signal } = {}) {
      const placeId = request.placeId || request.id || `lookup-${request.name || 'cafe'}`;
      return withMockFallback(
        async () => normalizeRestaurantDetail(await client.request(API_ENDPOINTS.tourism.cafeDetail(placeId), {
          method: 'GET',
          query: { name: request.name, latitude: request.latitude, longitude: request.longitude },
          signal,
        })),
        async () => normalizeRestaurantDetail({
          ...mockRestaurantDetail({ ...request, placeId }),
          category: '카페·디저트',
          sourceLabel: 'TripBuddy 시연용 카페 상세 데이터',
        }),
      );
    },
  };
}

export const contentApi = createContentApi();
