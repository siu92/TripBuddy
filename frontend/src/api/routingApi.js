import { apiClient, withMockFallback } from './apiClient';
import { API_ENDPOINTS } from './contracts';
import { mockRoute } from './mockData';
import { normalizeRouteResult } from './normalizers';

/**
 * TMAP/Naver Maps Directions용 BFF 어댑터.
 * 프런트는 provider 옵션만 넘기며, 실제 API Key/서명/요금은 서버에서만 관리한다.
 */
export function createRoutingApi({ client = apiClient } = {}) {
  return {
    /** @param {import('./contracts').RouteRequest} request */
    async getRoute(request, { provider = 'auto', signal } = {}) {
      return withMockFallback(
        async () => normalizeRouteResult(await client.request(API_ENDPOINTS.routing.route, {
          method: 'POST',
          body: { ...request, provider },
          signal,
        }), provider),
        async () => normalizeRouteResult(mockRoute(request), 'mock'),
      );
    },
  };
}

export const routingApi = createRoutingApi();
