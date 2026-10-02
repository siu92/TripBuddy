const AIRPORT_IATA_CODES = new Set([
  "ICN", "GMP", "CJU", "PUS", "TAE", "CJJ", "KWJ", "RSU", "USN", "KPO", "WJU", "YNY",
]);

const NON_AIRPORT_PLACE_TYPES = new Set([
  "ATTRACTION",
  "RESTAURANT",
  "CAFE",
  "ACCOMMODATION",
  "RENTAL",
  "RENT_CAR",
  "CAR_RENTAL",
  "RENTAL_CAR",
]);

export function isAirportName(value) {
  const text = String(value || "").trim();
  if (!text) return false;

  const upper = text.toUpperCase();
  if (AIRPORT_IATA_CODES.has(upper)) return true;

  const iataMatch = upper.match(/\(([A-Z]{3})\)\s*$/);
  if (iataMatch?.[1] && AIRPORT_IATA_CODES.has(iataMatch[1])) return true;

  // "고집돌우럭 제주공항점"처럼 상호명에 공항이 들어간 경우는 공항이 아니다.
  // 실제 공항명은 공항으로 끝나거나 공항 뒤에 터미널/국내선 같은 공항 시설 표현이 온다.
  if (/(?:국제)?공항(?:\s*(?:국내선|국제선|터미널|제?\s*\d+\s*터미널|도착|출발|주차장|렌터카하우스))?\s*$/i.test(text)) {
    return true;
  }

  // 영문 공항명도 Airport가 공항명 끝이나 공항 시설 표현 바로 앞에 있을 때만 인정한다.
  return /\bairport(?:\s+(?:terminal|domestic|international|arrival|departure|parking))?\s*$/i.test(text);
}

export function isAirportEvent(name, metadata = {}) {
  const type = String(metadata.type || "").toUpperCase();
  const category = String(metadata.category || "").toUpperCase();

  if (["AIRPORT", "FLIGHT", "AIR"].includes(type)) return true;
  if (category.includes("AIRPORT") || category.includes("FLIGHT")) return true;

  // 백엔드가 일반 장소 타입을 명시했다면 이름보다 타입을 우선한다.
  // 예: "고집돌우럭 제주공항점" (RESTAURANT)
  if (NON_AIRPORT_PLACE_TYPES.has(type)) return false;

  return isAirportName(name);
}

export function isAirportRouteSegment(segment = {}) {
  return String(segment.mode || "").toUpperCase() === "AIR"
    || isAirportName(segment.departureName)
    || isAirportName(segment.arrivalName);
}
