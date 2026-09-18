import { apiClient, withMockFallback } from './apiClient';
import { API_ENDPOINTS, API_SOURCE_LABELS } from './contracts';
import { mockLodgingOffers, mockRentalOffers, mockTransportOffers } from './mockData';
import { normalizeOfferEnvelope } from './normalizers';

function mockOfferEnvelope(items) {
  return {
    items,
    isMock: true,
    sourceLabel: API_SOURCE_LABELS.mock,
    refreshedAt: new Date().toISOString(),
    priceStatus: 'MOCK',
  };
}

/**
 * 가격 제공 여부가 다른 공급자를 한 인터페이스로 감싼다.
 * 항공·KTX·숙소·렌터카는 제휴/공식 API 전까지 항상 isMock=true를 유지한다.
 */
export function createBookingApi({ client = apiClient } = {}) {
  return {
    /** @param {import('./contracts').TransportSearchRequest} request */
    async searchFlightOffers(request, { signal } = {}) {
      return withMockFallback(
        async () => normalizeOfferEnvelope(await client.request(API_ENDPOINTS.offers.flights, { method: 'POST', body: request, signal }), 'flight'),
        async () => mockOfferEnvelope(mockTransportOffers(request, 'flight')),
      );
    },

    /** @param {import('./contracts').TransportSearchRequest} request */
    async searchKtxOffers(request, { signal } = {}) {
      return withMockFallback(
        async () => normalizeOfferEnvelope(await client.request(API_ENDPOINTS.offers.ktx, { method: 'POST', body: request, signal }), 'ktx'),
        async () => mockOfferEnvelope(mockTransportOffers(request, 'ktx')),
      );
    },

    async searchFerryOffers(request, { signal } = {}) {
      return withMockFallback(
        async () => normalizeOfferEnvelope(await client.request(API_ENDPOINTS.offers.ferries, { method: 'POST', body: request, signal }), 'ferry'),
        async () => mockOfferEnvelope(mockTransportOffers(request, 'ferry')),
      );
    },

    async searchLodgingOffers(request, { signal } = {}) {
      return withMockFallback(
        async () => normalizeOfferEnvelope(await client.request(API_ENDPOINTS.offers.lodging, { method: 'POST', body: request, signal }), 'lodging'),
        async () => mockOfferEnvelope(mockLodgingOffers(request)),
      );
    },

    async searchRentalOffers(request, { signal } = {}) {
      return withMockFallback(
        async () => normalizeOfferEnvelope(await client.request(API_ENDPOINTS.offers.rentalCars, { method: 'POST', body: request, signal }), 'rental'),
        async () => mockOfferEnvelope(mockRentalOffers(request)),
      );
    },
  };
}

export const bookingApi = createBookingApi();
