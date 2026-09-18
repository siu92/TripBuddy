import { apiClient } from "./apiClient";

/**
 * 목적지 좌표 기준 숙소 추천
 *
 * POST /api/accommodations/recommend
 */
export async function recommendAccommodations({
  destinationName,
  latitude,
  longitude,
  limit = 20,
  signal,
}) {
  return apiClient.request(
    "/api/accommodations/recommend",
    {
      method: "POST",

      body: {
        destinationName,
        latitude,
        longitude,
        limit,
      },

      signal,

      timeoutMs: 15000,
    },
  );
}