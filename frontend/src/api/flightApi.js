import { apiClient, getAccessToken } from "./apiClient.js";

export function createFlightSearch({
  request = (path, options) => apiClient.request(path, options),
  getSession = getAccessToken,
  now = Date.now,
  ttlMs = 60_000,
} = {}) {
  const completed = new Map();
  const pending = new Map();
  let session;
  let generation = 0;

  return async function searchFlights({
    departure,
    destination,
    direction,
    startDate,
    startTime = "00:00",
    endDate,
    endTime = "23:59",
    peopleCount,
    signal,
  }) {
    const body = {
      departure,
      destination,
      direction,
      startDate,
      startTime,
      endDate,
      endTime,
      peopleCount,
    };
    const currentSession = getSession();
    if (session !== currentSession) {
      session = currentSession;
      generation += 1;
      completed.clear();
      pending.clear();
    }
    const fetchResult = () => request("/api/flights/search", {
      method: "POST", body, signal, timeoutMs: 60000,
    });
    // Explicitly cancellable requests retain independent cancellation ownership.
    if (signal) return fetchResult();
    const key = JSON.stringify(body);
    const timestamp = now();
    for (const [cachedKey, entry] of completed) {
      if (entry.expiresAt <= timestamp) completed.delete(cachedKey);
    }
    const cached = completed.get(key);
    if (cached) return structuredClone(cached.value);
    if (pending.has(key)) return structuredClone(await pending.get(key));

    const requestGeneration = generation;
    const promise = Promise.resolve().then(fetchResult).then((value) => {
      if (requestGeneration === generation) {
        // Empty results can reflect a transient supplier issue; don't retain them.
        const flights = body.direction === "RETURN" ? value?.returnFlights : value?.outboundFlights;
        if (Array.isArray(flights) && flights.length) {
          completed.set(key, { value: structuredClone(value), expiresAt: now() + ttlMs });
          if (completed.size > 20) completed.delete(completed.keys().next().value);
        }
      }
      return value;
    }).finally(() => {
      if (pending.get(key) === promise) pending.delete(key);
    });
    pending.set(key, promise);
    return structuredClone(await promise);
  };
}

export const searchFlights = createFlightSearch();
