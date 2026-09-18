import { apiClient } from "./apiClient";

const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000;
const weatherCache = new Map();
const weatherRequests = new Map();

function weatherCacheKey(destination, latitude, longitude) {
  return [
    String(destination ?? "").trim(),
    Number(latitude).toFixed(3),
    Number(longitude).toFixed(3),
  ].join("|");
}

function readSessionCache(key) {
  try {
    const cached = JSON.parse(
      sessionStorage.getItem(`tripbuddy.weather.${key}`) || "null",
    );

    if (
      cached?.savedAt &&
      Date.now() - cached.savedAt < WEATHER_CACHE_TTL_MS &&
      Array.isArray(cached.data)
    ) {
      return cached;
    }
  } catch {
    // 세션 캐시가 손상됐으면 실제 API를 다시 호출한다.
  }

  return null;
}

function saveSessionCache(key, data) {
  const value = { savedAt: Date.now(), data };
  weatherCache.set(key, value);

  try {
    sessionStorage.setItem(
      `tripbuddy.weather.${key}`,
      JSON.stringify(value),
    );
  } catch {
    // 저장 공간을 사용할 수 없어도 메모리 캐시는 유지한다.
  }
}

/**
 * 캘린더 날씨 조회
 *
 * GET /api/weather/calendar
 */
export async function getCalendarWeather({
  destination,
  latitude,
  longitude,
}) {
  const key = weatherCacheKey(destination, latitude, longitude);
  const cached = weatherCache.get(key) ?? readSessionCache(key);

  if (
    cached?.savedAt &&
    Date.now() - cached.savedAt < WEATHER_CACHE_TTL_MS
  ) {
    weatherCache.set(key, cached);
    return cached.data;
  }

  if (weatherRequests.has(key)) {
    return weatherRequests.get(key);
  }

  // 컴포넌트가 닫혀도 요청은 끝까지 진행해 다음 열기에 즉시 사용한다.
  const request = apiClient
    .request("/api/weather/calendar", {
      method: "GET",
      query: {
        destination,
        latitude,
        longitude,
      },
    })
    .then((data) => {
      if (Array.isArray(data)) {
        saveSessionCache(key, data);
      }

      return data;
    })
    .finally(() => {
      weatherRequests.delete(key);
    });

  weatherRequests.set(key, request);
  return request;
}
