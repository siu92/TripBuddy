const AIRPORT_NAME_PATTERN = /(?:국제)?공항|airport|\b(?:ICN|GMP|CJU|PUS|TAE|CJJ|KWJ|RSU|USN|KPO|WJU|YNY)\b/i;

export function isAirportName(value) {
  return AIRPORT_NAME_PATTERN.test(String(value || "").trim());
}

export function isAirportEvent(name, metadata = {}) {
  const type = String(metadata.type || "").toUpperCase();
  const category = String(metadata.category || "").toUpperCase();

  return isAirportName(name)
    || ["AIRPORT", "FLIGHT", "AIR"].includes(type)
    || category.includes("AIRPORT")
    || category.includes("FLIGHT");
}

export function isAirportRouteSegment(segment = {}) {
  return String(segment.mode || "").toUpperCase() === "AIR"
    || isAirportName(segment.departureName)
    || isAirportName(segment.arrivalName);
}
