export const flightClockMinutes = (value) => {
  const [hour, minute] = String(value || "")
    .slice(11, 16)
    .split(":")
    .map(Number);

  return Number.isFinite(hour) && Number.isFinite(minute)
    ? hour * 60 + minute
    : null;
};

export const flightDurationMinutes = (flight) => {
  const suppliedDuration = Number(flight?.durationMinutes);
  if (Number.isFinite(suppliedDuration) && suppliedDuration > 0) {
    return Math.round(suppliedDuration);
  }

  if (!flight?.departureTime || !flight?.arrivalTime) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Math.max(
    0,
    Math.round(
      (new Date(flight.arrivalTime).getTime() -
        new Date(flight.departureTime).getTime()) /
        60000,
    ),
  );
};

export const estimateBaggageAllowance = (flight, flights = []) => {
  const price = Number(flight?.estimatedPricePerPerson);
  const uniquePrices = [
    ...new Set(
      flights
        .map((item) => Number(item?.estimatedPricePerPerson))
        .filter((itemPrice) => Number.isFinite(itemPrice) && itemPrice > 0),
    ),
  ].sort((a, b) => a - b);

  if (!Number.isFinite(price) || price <= 0 || uniquePrices.length <= 1) {
    return { checkedKg: 15, cabinKg: 10, tier: "light" };
  }

  const priceIndex = Math.max(0, uniquePrices.indexOf(price));
  const pricePercentile = priceIndex / (uniquePrices.length - 1);

  if (pricePercentile > 0.67) {
    return { checkedKg: 25, cabinKg: 10, tier: "flex" };
  }

  if (pricePercentile > 0.33) {
    return { checkedKg: 20, cabinKg: 10, tier: "standard" };
  }

  return { checkedKg: 15, cabinKg: 10, tier: "light" };
};

export const flightRecommendationScore = (flight, flights, leg) => {
  const departureMinutes = flightClockMinutes(flight?.departureTime);
  if (!Number.isFinite(departureMinutes)) return -1000;

  const status = String(flight?.status || "").toLowerCase();
  if (status.includes("cancel") || status.includes("취소")) return -1000;

  const prices = flights
    .map((item) => Number(item?.estimatedPricePerPerson))
    .filter((price) => Number.isFinite(price) && price > 0);
  const price = Number(flight?.estimatedPricePerPerson);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : minPrice;
  const priceScore =
    Number.isFinite(price) && price > 0
      ? maxPrice === minPrice
        ? 35
        : 35 * (maxPrice - price) / (maxPrice - minPrice)
      : 0;

  const preferredMinutes = leg === "return" ? 17 * 60 : 10 * 60;
  const usefulWindow = leg === "return" ? 5 * 60 : 4 * 60;
  const scheduleScore =
    40 *
    Math.max(
      0,
      1 - Math.abs(departureMinutes - preferredMinutes) / usefulWindow,
    );

  const durations = flights
    .map(flightDurationMinutes)
    .filter(
      (duration) =>
        Number.isFinite(duration) && duration < Number.MAX_SAFE_INTEGER,
    );
  const duration = flightDurationMinutes(flight);
  const minDuration = durations.length ? Math.min(...durations) : duration;
  const maxDuration = durations.length ? Math.max(...durations) : minDuration;
  const durationScore =
    duration < Number.MAX_SAFE_INTEGER
      ? maxDuration === minDuration
        ? 15
        : 15 * (maxDuration - duration) / (maxDuration - minDuration)
      : 0;

  const reliabilityScore =
    departureMinutes >= 9 * 60 && departureMinutes <= 15 * 60
      ? 10
      : departureMinutes >= 6 * 60 && departureMinutes <= 21 * 60
        ? 6
        : 0;

  return priceScore + scheduleScore + durationScore + reliabilityScore;
};

export const orderFlights = ({ flights, sort, leg, dealIds = new Set() }) => {
  const ordered = [...flights];
  const priceOf = (flight) =>
    Number(flight?.estimatedPricePerPerson) || Number.MAX_SAFE_INTEGER;
  const departureOf = (flight) => String(flight?.departureTime || "");

  if (sort === "price") {
    return ordered.sort(
      (a, b) =>
        priceOf(a) - priceOf(b) ||
        departureOf(a).localeCompare(departureOf(b)),
    );
  }

  if (sort === "time") {
    return ordered.sort(
      (a, b) =>
        departureOf(a).localeCompare(departureOf(b)) ||
        priceOf(a) - priceOf(b),
    );
  }

  return ordered.sort((a, b) => {
    const aDeal = dealIds.has(a.id);
    const bDeal = dealIds.has(b.id);

    if (aDeal !== bDeal) return aDeal ? -1 : 1;

    const scoreDifference =
      flightRecommendationScore(b, ordered, leg) -
      flightRecommendationScore(a, ordered, leg);

    return (
      scoreDifference ||
      priceOf(a) - priceOf(b) ||
      departureOf(a).localeCompare(departureOf(b))
    );
  });
};
