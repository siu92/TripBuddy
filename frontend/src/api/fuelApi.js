import { apiClient, withMockFallback } from './apiClient';
import { API_ENDPOINTS, API_SOURCE_LABELS } from './contracts';
import { normalizeFuelPrice } from './normalizers';

const MOCK_FUEL_PRICES = Object.freeze({ gasoline: 1750, diesel: 1650, lpg: 1100 });

/**
 * 오피넷 인증키는 백엔드 BFF에만 보관한다. 프런트는 지역/유종만 전달한다.
 */
export function createFuelApi({ client = apiClient } = {}) {
  return {
    async getAverage({ fuelType = 'gasoline', regionCode } = {}, { signal } = {}) {
      return withMockFallback(
        async () => normalizeFuelPrice(await client.request(API_ENDPOINTS.fuel.average, {
          query: { fuelType, regionCode },
          signal,
        }), fuelType),
        async () => ({
          fuelType,
          productCode: { gasoline: 'B027', diesel: 'D047', lpg: 'K015' }[fuelType] ?? 'B027',
          productName: fuelType,
          pricePerL: MOCK_FUEL_PRICES[fuelType] ?? MOCK_FUEL_PRICES.gasoline,
          observedDate: null,
          difference: 0,
          provider: API_SOURCE_LABELS.mock,
          isMock: true,
        }),
      );
    },
  };
}

export const fuelApi = createFuelApi();
