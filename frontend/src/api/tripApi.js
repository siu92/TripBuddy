import { apiClient } from "./apiClient.js";

/**
 * 여행 기본 정보 생성
 *
 * POST /api/trips
 */
export async function createTrip({
  departure,
  departureLatitude,
  departureLongitude,

  destination,
  destinationLatitude,
  destinationLongitude,

  startDate,
  startTime,

  endDate,
  endTime,

  peopleCount,

  mainTransportMode,
  localTransportMode,
  fuelType = null,
  vehicleEfficiencyKmpl = null,

  budget,
  mealBudgetPerPersonPerDay,

  pace,
  preferences,
  foodPreferences,
  prompt = null,

  /*
   * ========================================
   * 선택 숙소
   * ========================================
   */
  accommodationId,

  /*
   * ========================================
   * 선택 항공편
   *
   * AIR가 아니면 null
   * ========================================
   */
  outboundFlight = null,
  returnFlight = null,

  /*
   * ========================================
   * 선택 렌터카
   *
   * RENTAL_CAR가 아니면 null
   * ========================================
   */
  rental = null,
  signal,
}) {
  return apiClient.request("/api/trips", {
    method: "POST",

    body: {
      departure,
      departureLatitude,
      departureLongitude,

      destination,
      destinationLatitude,
      destinationLongitude,

      startDate,
      startTime,

      endDate,
      endTime,

      peopleCount,

      mainTransportMode,
      localTransportMode,
      fuelType,
      vehicleEfficiencyKmpl,

      budget,
      mealBudgetPerPersonPerDay,

      pace,
      preferences,
      foodPreferences,
      prompt,

      /*
       * ========================================
       * 백엔드 TripCreateRequest 추가 필드
       * ========================================
       */
      accommodationId,

      outboundFlight,
      returnFlight,

      rental,
    },

    signal,

    timeoutMs: 15000,
  });
}
export async function getMyTrips({ signal } = {}) {
  return apiClient.request("/api/trips", {
    method: "GET",
    signal,
  });
}

export async function getTrip(tripId, { signal } = {}) {
  if (!tripId) {
    throw new TypeError("불러올 여행 ID가 없습니다.");
  }

  return apiClient.request(
    `/api/trips/${encodeURIComponent(tripId)}`,
    {
      method: "GET",
      signal,
    },
  );
}
