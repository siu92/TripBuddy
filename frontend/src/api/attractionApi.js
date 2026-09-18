import { apiClient } from "./apiClient.js";

export function getAttractionDetail(attractionsId, { signal } = {}) {
  const id = String(attractionsId ?? "");
  if (!/^[1-9]\d*$/.test(id)) {
    throw new TypeError("관광지 상세 조회에 필요한 DB ID가 없습니다.");
  }
  return apiClient.request(`/api/attractions/${encodeURIComponent(id)}`, { method: "GET", signal });
}
