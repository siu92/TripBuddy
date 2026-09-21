export function locationRequestName(location) {
  if (!location) return "";

  if (String(location.requestName || "").trim()) {
    return String(location.requestName).trim();
  }

  const first = location.region || "";
  const second = location.detail || location.name || "";

  return [...new Set([first, second].filter(Boolean))].join(" ");
}
