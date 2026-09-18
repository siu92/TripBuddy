/**
 * TripBuddy frontend API entry point.
 * 최신 Spring backend에서 실제 사용하는 API만 노출한다.
 * 과거 /api/offers, /api/journey-options, /api/routing/route 계열은 더 이상 export하지 않는다.
 * 렌터카 및 일부 가격은 제휴 API가 없어 frontend mock/예상값을 유지한다.
 */
export {
  apiClient,
  ApiClientError,
  createApiClient,
  isMockModeEnabled,
  getAccessToken,
  saveAccessToken,
  removeAccessToken,
} from "./apiClient";

export { login, logout, isLoggedIn } from "./authApi";
export { createTrip, getMyTrips, getTrip } from "./tripApi";
export { searchFlights } from "./flightApi";
export { recommendAccommodations } from "./accommodationApi";
export { getCalendarWeather } from "./weatherApi";
export { getAttractionDetail } from "./attractionApi";
export { contentApi, createContentApi } from "./contentApi";
export { normalizeTripPlanResponse, requestTripPlan, requestTripPlanRevision } from "./tripPlanApi";
