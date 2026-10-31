/**
 * 항공 API 후보를 화면용 카드와 저장 요청으로 변환합니다. 운임은 기존 화면의 편도/왕복 호환 규칙을 유지합니다.
 */
export const flightTimeLabel = (flight) => {
  if (!flight?.departureTime || !flight?.arrivalTime) {
    return "";
  }

  const departure = String(flight.departureTime).slice(11, 16);

  const arrival = String(flight.arrivalTime).slice(11, 16);

  return `${departure} → ${arrival}`;
};

export const flightDurationMinutes = (flight) => {
  const suppliedDuration = Number(flight?.durationMinutes);

  if (Number.isFinite(suppliedDuration) && suppliedDuration > 0) {
    return Math.round(suppliedDuration);
  }

  if (!flight?.departureTime || !flight?.arrivalTime) {
    return 0;
  }

  const departure = new Date(flight.departureTime);

  const arrival = new Date(flight.arrivalTime);

  const duration = Math.round(
    (arrival.getTime() - departure.getTime()) / 60000,
  );

  return Number.isFinite(duration) ? Math.max(0, duration) : 0;
};

export const flightLocationName = (location) => {
  if (!location) {
    return "";
  }

  return [location.region, location.detail || location.name]
    .filter(Boolean)
    .join(" ")
    .trim();
};

export const normalizeFlightCandidate = (flight) => {
  const estimatedPricePerPerson = Number(flight?.estimatedPricePerPerson) || 0;

  const timeLabel = flightTimeLabel(flight);

  return {
    ...flight,

    code: flight?.flightNumber || flight?.airlineCode || "AIR",

    out: timeLabel,

    back: timeLabel,

    durationMinutes: flightDurationMinutes(flight),

    /*
     * 기존 App.jsx의 oneWayFare()가
     * fare / 2 형태를 사용하므로 호환용 값.
     */
    fare: estimatedPricePerPerson * 2,

    originalFare: estimatedPricePerPerson * 2,

    discount: 0,

    seats: null,

    tone: "sky",

    cabin: flight?.aircraft || "기종 정보 없음",

    baggage: flight?.status || "운항 상태 확인",

    fareNote: flight?.priceType === "ESTIMATED" ? "예상 운임" : "운임",
  };
};

export const flightDepartureClockMinutes = (flight) => {
  const time = String(flight?.departureTime || "").slice(11, 16);

  const [hour, minute] = time.split(":").map(Number);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return hour * 60 + minute;
};

export const toFlightCandidatePayload = (flight) => {
  if (!flight) {
    return null;
  }

  return {
    id: flight.id ?? null,

    direction: flight.direction ?? null,

    airline: flight.airline ?? "",

    airlineCode: flight.airlineCode ?? "",

    flightNumber: flight.flightNumber ?? "",

    departureAirport: flight.departureAirport ?? "",

    arrivalAirport: flight.arrivalAirport ?? "",

    departureTime: flight.departureTime ?? null,

    arrivalTime: flight.arrivalTime ?? null,

    estimatedPricePerPerson: Number(flight.estimatedPricePerPerson ?? 0),

    estimatedTotalPrice: Number(flight.estimatedTotalPrice ?? 0),

    priceType: flight.priceType || "ESTIMATED",

    aircraft: flight.aircraft ?? null,

    status: flight.status ?? null,
  };
};
