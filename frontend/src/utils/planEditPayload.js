const EDITABLE_TYPES = new Set(["ATTRACTION", "RESTAURANT", "CAFE"]);

const clock = (value) => {
  const match = String(value || "").match(/(?:T|^)(\d{2}:\d{2})/);
  return match?.[1] || null;
};

const keyFor = (dayNumber, item) => `${dayNumber}:${item.order}`;

function editableKeysFromUi(dayPlan, available) {
  const keys = (dayPlan?.[2] || [])
    .filter((event) => EDITABLE_TYPES.has(String(event?.[6]?.type || "").toUpperCase()))
    .map((event) => event?.[6]?.sourceKey)
    .filter((key) => available.has(key));
  return [...new Set(keys)];
}

/**
 * The displayed timeline merges flight cards and may insert synthetic rental cards.
 * Start from the authoritative raw plan and only copy the order/replacement of editable UI cards.
 */
export function buildPlanEditRequest(snapshot, dayPlans) {
  const sourceDays = snapshot?.plan?.days;
  if (!Array.isArray(sourceDays) || !snapshot?.requestId || snapshot?.revision == null) {
    throw new Error("최신 일정 편집 정보를 불러오지 못했습니다.");
  }

  return {
    baseRevision: snapshot.revision,
    requestId: snapshot.requestId,
    days: sourceDays.map((day, dayIndex) => {
      const originals = Array.isArray(day.items) ? day.items : [];
      const editable = originals.filter((item) => EDITABLE_TYPES.has(item.type));
      const available = new Set(editable.map((item) => keyFor(day.dayNumber, item)));
      const uiEvents = dayPlans?.[dayIndex]?.[2] || [];
      const uiBySourceKey = new Map(
        uiEvents.map((event) => [event?.[6]?.sourceKey, event]).filter(([key]) => key),
      );
      const uiOrder = editableKeysFromUi(dayPlans?.[dayIndex], available);
      const originalOrder = editable.map((item) => keyFor(day.dayNumber, item));
      const completeUiOrder = uiOrder.length === originalOrder.length ? uiOrder : originalOrder;
      const orderChanged = completeUiOrder.some((key, index) => key !== originalOrder[index]);
      let editableCursor = 0;

      return {
        dayNumber: day.dayNumber,
        items: originals.map((slot) => {
          if (!EDITABLE_TYPES.has(slot.type)) {
            return { itemKey: keyFor(day.dayNumber, slot) };
          }
          const itemKey = completeUiOrder[editableCursor++];
          const original = editable.find((item) => keyFor(day.dayNumber, item) === itemKey);
          const metadata = uiBySourceKey.get(itemKey)?.[6] || {};
          return {
            itemKey,
            stayMinutes: Number(metadata.stayMinutes ?? original?.stayMinutes) || null,
            startTime: orderChanged ? null : clock(original?.startAt),
            replacement: metadata.replacement || null,
          };
        }),
      };
    }),
  };
}
