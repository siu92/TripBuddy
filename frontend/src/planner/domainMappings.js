/**
 * 화면 선택값과 백엔드 enum 사이의 변환 및 차량 연료·연비 추정을 모았습니다. 가격·연비는 예약 확정값이 아닙니다.
 */
export const MAIN_TRANSPORT_MAP = {
  FLIGHT: "AIR",
  KTX: "KTX",
  SRT: "SRT",
  BUS: "EXPRESS_BUS",
  CAR: "OWN_CAR",
};

export const LOCAL_TRANSPORT_MAP = {
  WALK: "WALK",

  TRANSIT: "PUBLIC_TRANSIT",

  PUBLIC_TRANSIT: "PUBLIC_TRANSIT",

  TAXI: "TAXI",

  CAR: "OWN_CAR",

  RENTAL: "RENTAL_CAR",

  RENTAL_CAR: "RENTAL_CAR",
};

export const VEHICLE_FUEL_TYPE_MAP = {
  휘발유: "GASOLINE",
  경유: "DIESEL",
  LPG: "LPG",
  전기: "ELECTRIC",
};

export const VEHICLE_EFFICIENCY_KMPL = {
  경차: 14.5,
  세단: 12.5,
  SUV: 10.2,
  승합: 8.5,
};

export const inferRentalFuelType = (rental) => {
  const explicit = String(rental?.fuelType || "").toUpperCase();
  if (["GASOLINE", "DIESEL", "LPG", "ELECTRIC"].includes(explicit)) {
    return explicit;
  }

  const text = `${rental?.car || ""} ${rental?.fuel || ""}`.toLowerCase();
  if (/ev|전기|electric/.test(text)) return "ELECTRIC";
  if (/경유|디젤|diesel/.test(text)) return "DIESEL";
  if (/lpg|부탄/.test(text)) return "LPG";
  return "GASOLINE";
};

export const inferRentalEfficiencyKmpl = (rental) => {
  const supplied = Number(rental?.efficiencyKmpl);
  if (Number.isFinite(supplied) && supplied > 0) return supplied;

  const text = String(rental?.car || "");
  if (/경차|레이|캐스퍼/.test(text)) return 14.5;
  if (/승합|카니발|스타리아/.test(text)) return 8.5;
  if (/SUV|코나|니로/.test(text)) return 10.2;
  return 12.5;
};

export const PACE_MAP = {
  여유롭게: "RELAXED",

  보통: "BALANCED",

  빡빡하게: "ACTIVE",
};

export const THEME_MAP = {
  자연: "NATURE",

  관광: "SIGHTSEEING",

  맛집: "FOOD",

  카페: "CAFE",

  역사: "HISTORY",

  액티비티: "ACTIVITY",

  휴식: "HEALING",
};

export const FOOD_PREFERENCE_MAP = {
  KOREAN: "KOREAN",

  JAPANESE: "JAPANESE",

  WESTERN: "WESTERN",

  CHINESE: "CHINESE",

  ASIAN: "ASIAN",

  /*
   * frontend CASUAL
   * backend SNACK
   */
  CASUAL: "SNACK",

  CAFE: "CAFE",

  /*
   * 현재 backend FoodPreference에
   * VEGETARIAN 없음.
   *
   * undefined → 요청에서 자동 제외.
   */
};

export const MAIN_TRANSPORT_FROM_BACKEND = {
  AIR: "FLIGHT",
  KTX: "KTX",
  SRT: "SRT",
  EXPRESS_BUS: "BUS",
  OWN_CAR: "CAR",
};

export const LOCAL_TRANSPORT_FROM_BACKEND = {
  WALK: "WALK",
  PUBLIC_TRANSIT: "TRANSIT",
  TAXI: "TAXI",
  OWN_CAR: "CAR",
  RENTAL_CAR: "RENTAL",
};

export const PACE_FROM_BACKEND = {
  RELAXED: "여유롭게",
  BALANCED: "보통",
  ACTIVE: "빡빡하게",
};

export const THEME_FROM_BACKEND = Object.fromEntries(
  Object.entries(THEME_MAP).map(([label, code]) => [code, label]),
);

export const FOOD_FROM_BACKEND = Object.fromEntries(
  Object.entries(FOOD_PREFERENCE_MAP)
    .filter(([, code]) => Boolean(code))
    .map(([label, code]) => [code, label]),
);
