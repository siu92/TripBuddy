/**
 * 서버 저장 전 화면에서 적용하는 순서·추가·제외 초안입니다. 실제 저장 계약은 utils/planEditPayload.js와 api/planEditorApi.js를 확인합니다.
 */
import { recalculateDayTimeline } from "../data/travelSchedule.js";

export const planEventKey = (event, dayIndex, eventIndex) =>
  event?.[6]?.id || `day-${dayIndex + 1}-stop-${eventIndex + 1}`;

export const applyPlanOrders = (plans, orders, localTransport) =>
  plans.map((day, dayIndex) => {
    const order = orders[dayIndex];
    if (!order?.length) return day;

    const byId = new Map(
      day[2].map((event, eventIndex) => [
        planEventKey(event, dayIndex, eventIndex),
        event,
      ]),
    );
    const ordered = order.map((id) => byId.get(id)).filter(Boolean);
    const known = new Set(order);

    return recalculateDayTimeline(
      [
        day[0],
        day[1],
        [
          ...ordered,
          ...day[2].filter(
            (event, eventIndex) =>
              !known.has(planEventKey(event, dayIndex, eventIndex)),
          ),
        ],
      ],
      localTransport,
    );
  });

export const applyPlanCustomizations = (
  plans,
  customizations,
  localTransport,
) =>
  plans.map((day, dayIndex) => {
    const customization = customizations[dayIndex];
    const removed = new Set(customization?.removed || []);
    const additions = Array.isArray(customization?.additions)
      ? customization.additions
      : [];

    if (!removed.size && !additions.length) return day;

    const additionsByAnchor = new Map();
    additions.forEach((addition) => {
      const anchorId = addition.afterId || "__start__";
      additionsByAnchor.set(anchorId, [
        ...(additionsByAnchor.get(anchorId) || []),
        addition.event,
      ]);
    });

    const rows = [...(additionsByAnchor.get("__start__") || [])];
    const knownAnchors = new Set();

    day[2].forEach((event, eventIndex) => {
      const eventId = planEventKey(event, dayIndex, eventIndex);
      knownAnchors.add(eventId);
      if (!removed.has(eventId)) rows.push(event);
      rows.push(...(additionsByAnchor.get(eventId) || []));
    });

    additions.forEach((addition) => {
      if (addition.afterId && !knownAnchors.has(addition.afterId)) {
        rows.push(addition.event);
      }
    });

    return recalculateDayTimeline(
      [
        day[0],
        day[1],
        rows.map((event) => [
          ...event.slice(0, 6),
          { ...(event[6] || {}), locallyReordered: true },
        ]),
      ],
      localTransport,
    );
  });
