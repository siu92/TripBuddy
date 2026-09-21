import { apiClient } from "./apiClient.js";

const placeSearchCache = new Map();
const PLACE_CACHE_MS = 5 * 60 * 1000;

export function loadPlanEditor(tripId, { signal } = {}) {
  return apiClient.request(`/api/trips/${encodeURIComponent(tripId)}/plan/editor`, {
    signal,
    timeoutMs: 15000,
  });
}

export function savePlanEditor(tripId, body, { signal } = {}) {
  return apiClient.request(`/api/trips/${encodeURIComponent(tripId)}/plan/editor`, {
    method: "PUT",
    body,
    signal,
    timeoutMs: 90000,
  });
}

export async function searchPlanPlaces(tripId, type, query, { signal } = {}) {
  const normalizedQuery = String(query || "").trim();
  const key = `${tripId}:${type}:${normalizedQuery}`;
  const cached = placeSearchCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const value = await apiClient.request(
    `/api/trips/${encodeURIComponent(tripId)}/plan/places`,
    {
      query: { type, query: normalizedQuery },
      signal,
      timeoutMs: 15000,
    },
  );
  const result = Array.isArray(value) ? value : [];
  placeSearchCache.set(key, { value: result, expiresAt: Date.now() + PLACE_CACHE_MS });
  return result;
}
