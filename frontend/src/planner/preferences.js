/**
 * 여행 테마·음식 선호의 허용값, 중복 제거와 최대 선택 수를 한곳에서 관리합니다.
 */
export const MAX_PREFERENCE_SELECTIONS = 3;

export const AVAILABLE_THEMES = new Set([
  "맛집",
  "관광",
  "휴식",
  "자연",
  "액티비티",
]);

export const AVAILABLE_FOOD_PREFERENCES = new Set([
  "KOREAN",
  "JAPANESE",
  "CHINESE",
  "WESTERN",
  "ASIAN",
  "CASUAL",
  "CAFE",
  "VEGETARIAN",
]);

export const normalizeThemes = (value) =>
  Array.isArray(value)
    ? [...new Set(value)]
        .filter((item) => AVAILABLE_THEMES.has(item))
        .slice(0, MAX_PREFERENCE_SELECTIONS)
    : [];

export const normalizeFoodPreferences = (value) =>
  Array.isArray(value)
    ? [...new Set(value)]
        .filter((item) => AVAILABLE_FOOD_PREFERENCES.has(item))
        .slice(0, MAX_PREFERENCE_SELECTIONS)
    : [];
