// Presentation only: never changes the candidates sent to the itinerary API.
export function previewImageKey(image) {
  try {
    const url = new URL(image, "https://tripbuddy.local");
    // Resize/quality parameters must not turn one photograph into two cards.
    return decodeURIComponent(url.origin + url.pathname);
  } catch { return String(image || "").split(/[?#]/)[0]; }
}

export function buildPlanningPreview(places) {
  const images = new Set();
  const names = new Set();
  const groups = new Map();
  for (const place of places) {
    if (!place?.image || !place.name) continue;
    const imageKey = previewImageKey(place.image);
    const nameKey = place.name.trim().replace(/\s+/g, "");
    if (images.has(imageKey) || names.has(nameKey)) continue;
    images.add(imageKey); names.add(nameKey);
    const category = place.category || (place.representativeMenu ? "음식점" : "관광지");
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push({ ...place, category, imageKey,
      illustrative: place.image.includes("images.unsplash.com"),
    });
  }
  // Round-robin categories: don't show all beaches before the first restaurant.
  const output = [];
  while ([...groups.values()].some(group => group.length)) {
    for (const group of groups.values()) if (group.length) output.push(group.shift());
  }
  return output;
}
