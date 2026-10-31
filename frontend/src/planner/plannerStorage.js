/**
 * 여행 초안·예상 경비 스냅샷의 로컬 저장 경계입니다. 서버 일정 저장과 구분하며 저장소 오류는 생성 흐름을 막지 않습니다.
 */
export const TRIP_COST_SNAPSHOT_KEY = "tripbuddy-trip-cost-snapshots-v1";

export const readTripCostSnapshots = () => {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(TRIP_COST_SNAPSHOT_KEY) || "{}",
    );
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const saveTripCostSnapshot = (tripId, snapshot) => {
  if (typeof window === "undefined" || !tripId) return;
  try {
    const current = readTripCostSnapshots();
    window.localStorage.setItem(
      TRIP_COST_SNAPSHOT_KEY,
      JSON.stringify({ ...current, [String(tripId)]: snapshot }),
    );
  } catch {
    // 로컬 저장소 오류는 여행 생성 자체를 막지 않는다.
  }
};

export const getTripCostSnapshot = (tripId) =>
  tripId ? readTripCostSnapshots()[String(tripId)] || null : null;

export const readInitialDraft = (today) => {
  try {
    const saved = JSON.parse(window.localStorage.getItem("tripDraft") || "{}");

    if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
      return {};
    }

    const next = {
      ...saved,
    };

    const startIsPast =
      typeof next.startDate === "string" && next.startDate < today;

    const rangeIsInvalid =
      next.endDate && next.startDate && next.endDate < next.startDate;

    if (startIsPast || rangeIsInvalid) {
      next.startDate = today;

      next.endDate = "";

      next.transport = "";

      next.localTransport = "";

      delete next.bookingSelection;
    }

    return next;
  } catch {
    return {};
  }
};
