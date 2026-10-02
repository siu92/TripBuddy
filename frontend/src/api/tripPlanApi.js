import { apiClient } from "./apiClient.js";
import { isAirportName } from "../utils/routeFilters.js";


const ITEM_ICON = {
  DEPARTURE: "🚩",
  AIRPORT: "🛫",
  FLIGHT: "✈️",
  ACCOMMODATION: "🏨",
  ATTRACTION: "📍",
  RESTAURANT: "🍽️",
  CAFE: "☕",
  RENTAL: "🚗",
  RENT_CAR: "🚗",
  CAR_RENTAL: "🚗",
  RENTAL_CAR: "🚗",
};


const LOCKED_TYPES = new Set([
  "DEPARTURE",
  "AIRPORT",
  "FLIGHT",
  "ACCOMMODATION",
  "RENTAL",
  "RENT_CAR",
  "CAR_RENTAL",
  "RENTAL_CAR",
]);


const INTERNAL_PLAN_REASON_PATTERN =
  /fallback|BACKEND_FALLBACK|BEDROCK|recommendationScore|최종 일정|시간 기준|동선 (?:반영|계산)|다시 계산|좌표 기반|이동 가능|AI가|필수 목적지/i;


function userFacingPlanDetail(reason, category, type) {
  const rawReason = String(reason || "").trim();

  if (rawReason && !INTERNAL_PLAN_REASON_PATTERN.test(rawReason)) {
    return rawReason;
  }

  switch (type) {
    case "CAFE":
      return "여행 동선과 선호를 고려해 추천한 카페예요.";

    case "RESTAURANT":
      return "여행 동선과 식사 시간을 고려해 추천한 식당이에요.";

    case "ATTRACTION":
      return "여행 동선을 고려해 추천한 관광지예요.";

    case "ACCOMMODATION":
      return "선택한 숙소";

    default:
      return String(category || "").trim();
  }
}


/**
 * 백엔드에서 stayMinutes가 없는 경우
 * 현재 UI가 깨지지 않도록 사용하는 추정치.
 *
 * metadata.estimated.stayMinutes=true 로
 * 추정값임을 따로 남긴다.
 */
function estimateStayMinutes(type) {
  switch (type) {
    case "DEPARTURE":
      return 30;

    case "AIRPORT":
      return 90;

    case "FLIGHT":
      return null;

    case "ACCOMMODATION":
      return 45;

    case "RESTAURANT":
      return 60;

    case "CAFE":
      return 60;

    case "ATTRACTION":
      return 90;

    case "RENTAL":
    case "RENT_CAR":
    case "CAR_RENTAL":
    case "RENTAL_CAR":
      return 15;

    default:
      return 60;
  }
}


function dateTimeToTime(value) {
  if (!value) {
    return null;
  }

  const text =
    String(value);

  /*
   * 2026-09-16T09:30:00
   */
  const isoMatch =
    text.match(
      /T(\d{2}:\d{2})/,
    );

  if (isoMatch) {
    return isoMatch[1];
  }

  /*
   * 혹시 HH:mm 형태로 내려오는 경우
   */
  const timeMatch =
    text.match(
      /^(\d{2}:\d{2})/,
    );

  return timeMatch
    ? timeMatch[1]
    : null;
}


function dateTimeDurationMinutes(
  startAt,
  endAt,
) {
  if (
    !startAt ||
    !endAt
  ) {
    return null;
  }

  const start =
    new Date(startAt);

  const end =
    new Date(endAt);

  const minutes =
    Math.round(
      (
        end.getTime() -
        start.getTime()
      ) /
      60000,
    );

  if (
    !Number.isFinite(minutes) ||
    minutes < 0
  ) {
    return null;
  }

  return minutes;
}


/**
 * startAt도 없는 극단적인 경우
 * 시간표 UI가 겹치지 않게 임시 시각을 만든다.
 *
 * 실제 backend 시간이 있으면 절대 사용되지 않는다.
 */
function estimateStartTime(
  eventIndex,
) {
  const start =
    9 * 60;

  const minutes =
    Math.min(
      start +
        eventIndex *
          90,

      23 * 60 +
        30,
    );

  const hour =
    Math.floor(
      minutes /
        60,
    );

  const minute =
    minutes %
    60;

  return (
    `${String(hour).padStart(2, "0")}:` +
    `${String(minute).padStart(2, "0")}`
  );
}


function normalizePlanEvent(
  event,
  dayIndex,
  eventIndex,
) {
  /*
   * 혹시 나중에 backend가 이미
   * 프론트 tuple 형태를 반환할 경우도 호환.
   */
  if (Array.isArray(event)) {
  const metadata =
    event[6] || {};

  const baseId =
    metadata.id ||
    "api-stop";

  return [
    ...event.slice(0, 6),

    {
      ...metadata,

      id:
        `${baseId}-day-${dayIndex + 1}-stop-${eventIndex + 1}`,
    },
  ];
}


  const type =
    event?.type ||
    "ATTRACTION";


  /*
   * ==============================
   * 시간
   * ==============================
   */

  const backendStartTime =
    dateTimeToTime(
      event?.startAt ??
      event?.startTime,
    );

  const time =
    backendStartTime ||
    estimateStartTime(
      eventIndex,
    );


  /*
   * ==============================
   * 체류시간
   * ==============================
   */

  const rawStayMinutes =
    event?.stayMinutes ??
    event?.durationMinutes ??
    (
      event?.durationSeconds == null
        ? null
        : Number(event.durationSeconds) / 60
    );

  const backendStayMinutes =
    rawStayMinutes != null &&
    Number.isFinite(Number(rawStayMinutes))
      ? Number(rawStayMinutes)
      : null;


  const dateTimeDuration =
    dateTimeDurationMinutes(
      event?.startAt,
      event?.endAt,
    );


  const categoryForStay =
    String(event?.category || "").toUpperCase();

  const isArrivalAirportForStay =
    type === "AIRPORT" &&
    (
      categoryForStay.includes("ARRIVAL_AIRPORT") ||
      String(event?.transportModeFromPrevious || "").toUpperCase() === "AIR"
    );

  const estimatedStayMinutes =
    isArrivalAirportForStay
      ? 0
      : estimateStayMinutes(
          type,
        );


  const stayMinutes =
    isArrivalAirportForStay
      ? 0
      : backendStayMinutes ??
        dateTimeDuration ??
        estimatedStayMinutes;


  const durationLabel =
    stayMinutes != null
      ? `${Math.max(
          0,
          Math.round(
            stayMinutes,
          ),
        )}분`
      : "시간 미정";


  /*
   * ==============================
   * 이동시간
   *
   * 현재 backend에는 Routing 결과가 없음.
   *
   * 데이터상으로는 null을 유지하고
   * tuple에는 UI 안전성을 위해 0.
   * ==============================
   */

  const rawTravelMinutes =
    event?.travelMinutes ??
    event?.moveMinutes ??
    (
      event?.travelSeconds == null
        ? null
        : Number(event.travelSeconds) / 60
    );

  const backendTravelMinutes =
    rawTravelMinutes != null &&
    Number.isFinite(Number(rawTravelMinutes))
      ? Math.ceil(Number(rawTravelMinutes))
      : null;


  const travelMinutesForUi =
    backendTravelMinutes ??
    0;


  /*
   * ==============================
   * 좌표
   * ==============================
   */

  const latitude =
    (event?.latitude ?? event?.y) ==
    null
      ? null
      : Number(
          event.latitude ?? event.y,
        );


  const longitude =
    (event?.longitude ?? event?.x) ==
    null
      ? null
      : Number(
          event.longitude ?? event.x,
        );


  const hasCoordinates =
    Number.isFinite(
      latitude,
    ) &&
    Number.isFinite(
      longitude,
    );


  /*
   * ==============================
   * ID
   * ==============================
   */

  const eventIdentity =
  event?.placeId ??
  event?.referenceId ??
  "unknown";

const eventOrder =
  event?.order ??
  eventIndex + 1;

const eventId =
  `${type}-${eventIdentity}-day-${dayIndex + 1}-stop-${eventOrder}`;


  /*
   * ==============================
   * 설명
   * ==============================
   */

  const detail = userFacingPlanDetail(
    event?.reason,
    event?.category,
    type,
  );


  return [
    /*
     * [0]
     * 현재 UI 표시 시간
     */
    time,


    /*
     * [1]
     * 현재 UI 아이콘
     */
    ITEM_ICON[type] ||
      "📍",


    /*
     * [2]
     * 장소명
     */
    event?.name ||
      "여행 일정",


    /*
     * [3]
     * 설명
     */
    detail,


    /*
     * [4]
     * 체류시간
     */
    durationLabel,


    /*
     * [5]
     * 이동시간
     *
     * UI 호환 때문에 0 사용.
     * 실제 데이터는 metadata.travelMinutes 참고.
     */
    travelMinutesForUi,


    /*
     * [6]
     * metadata
     */
    {
      id:
        eventId,

      type,

      order:
        event?.order ??
        eventIndex +
          1,


      placeId:
        event?.placeId ??
        null,

      referenceId:
        event?.referenceId ??
        null,


      category:
        event?.category ??
        null,


      latitude:
        hasCoordinates
          ? latitude
          : null,

      longitude:
        hasCoordinates
          ? longitude
          : null,


      startAt:
        event?.startAt ??
        null,

      endAt:
        event?.endAt ??
        null,


      stayMinutes:
        stayMinutes ??
        null,


      /*
       * Routing 미적용이면 null
       */
      travelMinutes:
        backendTravelMinutes,


      transportModeFromPrevious:
        event?.transportModeFromPrevious ??
        null,


      reason:
        event?.reason ??
        null,

      flightLabel:
        event?.uiFlight?.label ??
        event?.flightLabel ??
        null,

      flightRoute:
        event?.uiFlight?.route ??
        event?.flightRoute ??
        null,

      flightDepartureAt:
        event?.uiFlight?.departureAt ??
        event?.flightDepartureAt ??
        null,

      flightArrivalAt:
        event?.uiFlight?.arrivalAt ??
        event?.flightArrivalAt ??
        null,

      flightDurationMinutes:
        finiteRouteNumber(
          event?.uiFlight?.durationMinutes ??
          event?.flightDurationMinutes,
        ),


      /*
       * 현재 TripPlan API는
       * 가격을 반환하지 않는다.
       *
       * null이면 기존 eventCost()가
       * 화면용 예상 비용을 계산한다.
       */
      pricePerPerson:
        null,


      bookingUrl:
        null,

      bookingProvider:
        "",


      isLocked:
        event?.isLocked == null
          ? LOCKED_TYPES.has(type)
          : !/^(false|0|no)$/i.test(String(event.isLocked)),

      isGeographical:
        hasCoordinates,


      /*
       * 실제값 / 추정값 구분.
       * 추후 Routing API 붙일 때 유용.
       */
      estimated: {
        startTime:
          backendStartTime ==
          null,

        stayMinutes:
          backendStayMinutes ==
            null &&
          dateTimeDuration ==
            null,

        travelMinutes:
          backendTravelMinutes ==
          null,

        price:
          true,
      },
    },
  ];
}



function flightDurationMinutes(event) {
  const direct = finiteRouteNumber(
    event?.durationMinutes ??
    (event?.durationSeconds == null ? null : Number(event.durationSeconds) / 60),
  );

  if (direct != null) return Math.max(0, Math.round(direct));

  return dateTimeDurationMinutes(
    event?.startAt ?? event?.startTime,
    event?.endAt ?? event?.endTime,
  );
}


function flightDisplayMeta(event, airSegment = null) {
  /*
   * 항공편 시간은 화면용 AI item보다 실제 TransportSegment(AIR)를 우선한다.
   * TripPlan item 시간이 오래된 값이어도 선택한 항공편의 실제 출/도착 시각이
   * 카드와 시간표에 동일하게 노출되도록 한다.
   */
  return {
    label: String(event?.name || "항공편").trim(),
    route: event?.category ?? null,
    departureAt: airSegment?.departureAt ?? event?.startAt ?? event?.startTime ?? null,
    arrivalAt: airSegment?.arrivalAt ?? event?.endAt ?? event?.endTime ?? null,
    durationMinutes:
      finiteRouteNumber(airSegment?.durationMinutes) ??
      flightDurationMinutes(event),
  };
}


function daySourceSegments(day) {
  if (Array.isArray(day?.transportSegments)) return day.transportSegments;
  if (Array.isArray(day?.segments)) return day.segments;
  return [];
}


function normalizedDisplayName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}


function isAirportDisplayName(value) {
  return isAirportName(value);
}


function routeDurationMinutes(startAt, endAt) {
  const start = routeDateTimeMillis(startAt);
  const end = routeDateTimeMillis(endAt);

  if (start == null || end == null || end < start) {
    return 0;
  }

  return Math.max(0, Math.round((end - start) / 60000));
}


function insertRentalTransferCards(events, day, selectedRental) {
  const source = Array.isArray(events) ? [...events] : [];

  if (!selectedRental) {
    return source;
  }

  const rentalName =
    String(selectedRental?.company || "").trim() ||
    "렌터카";

  const rentalKey = normalizedDisplayName(rentalName);
  const alreadyHasRental = source.some((event) => {
    const type = String(event?.type || "").toUpperCase();
    const category = String(event?.category || "").toUpperCase();
    const eventName = normalizedDisplayName(event?.name);

    return (
      /RENTAL|RENT_CAR|CAR_RENTAL/.test(type) ||
      /RENTAL|RENT_CAR|CAR_RENTAL/.test(category) ||
      (rentalKey && eventName === rentalKey)
    );
  });

  if (alreadyHasRental) {
    return source;
  }

  const segments = daySourceSegments(day)
    .slice()
    .sort((a, b) => Number(a?.sequence ?? 0) - Number(b?.sequence ?? 0));

  const additions = [];

  const pickupShuttle = segments.find((segment) => {
    if (String(segment?.mode || "").toUpperCase() !== "SHUTTLE") return false;
    return isAirportDisplayName(segment?.departureName) && !isAirportDisplayName(segment?.arrivalName);
  });

  if (pickupShuttle) {
    const pickupName =
      String(pickupShuttle?.arrivalName || "").trim() ||
      rentalName;
    const pickupKey = normalizedDisplayName(pickupName);
    const followingSegment = segments.find(
      (segment) =>
        Number(segment?.sequence ?? 0) > Number(pickupShuttle?.sequence ?? 0) &&
        normalizedDisplayName(segment?.departureName) === pickupKey,
    );

    const startAt = pickupShuttle?.arrivalAt ?? null;
    const endAt = followingSegment?.departureAt ?? startAt;

    additions.push({
      order: Number(pickupShuttle?.sequence ?? 0) + 0.5,
      type: "RENTAL_CAR",
      placeId: null,
      referenceId: selectedRental?.id ?? null,
      name: pickupName,
      category: "RENTAL_PICKUP",
      latitude: selectedRental?.latitude ?? pickupShuttle?.arrivalLatitude ?? null,
      longitude: selectedRental?.longitude ?? pickupShuttle?.arrivalLongitude ?? null,
      startAt,
      endAt,
      stayMinutes: routeDurationMinutes(startAt, endAt),
      transportModeFromPrevious: "SHUTTLE",
      reason: [
        selectedRental?.car,
        "렌터카를 인수하고 현지 이동을 시작합니다.",
      ]
        .filter(Boolean)
        .join(" · "),
      isLocked: true,
    });
  }

  const returnShuttle = segments.find((segment) => {
    if (String(segment?.mode || "").toUpperCase() !== "SHUTTLE") return false;
    return !isAirportDisplayName(segment?.departureName) && isAirportDisplayName(segment?.arrivalName);
  });

  if (returnShuttle) {
    const returnName =
      String(returnShuttle?.departureName || "").trim() ||
      rentalName;
    const returnKey = normalizedDisplayName(returnName);
    const previousSegment = [...segments]
      .reverse()
      .find(
        (segment) =>
          Number(segment?.sequence ?? 0) < Number(returnShuttle?.sequence ?? 0) &&
          normalizedDisplayName(segment?.arrivalName) === returnKey,
      );

    const startAt = previousSegment?.arrivalAt ?? returnShuttle?.departureAt ?? null;
    const endAt = returnShuttle?.departureAt ?? startAt;

    additions.push({
      order: Number(returnShuttle?.sequence ?? 0) - 0.5,
      type: "RENTAL_CAR",
      placeId: null,
      referenceId: selectedRental?.id ?? null,
      name: returnName,
      category: "RENTAL_RETURN",
      latitude: selectedRental?.latitude ?? returnShuttle?.departureLatitude ?? null,
      longitude: selectedRental?.longitude ?? returnShuttle?.departureLongitude ?? null,
      startAt,
      endAt,
      stayMinutes: routeDurationMinutes(startAt, endAt),
      transportModeFromPrevious: previousSegment?.mode ?? "RENTAL_CAR",
      reason: [
        selectedRental?.car,
        "렌터카를 반납하고 공항 셔틀로 이동합니다.",
      ]
        .filter(Boolean)
        .join(" · "),
      isLocked: true,
    });
  }

  // 구형 응답처럼 transportSegments가 plan payload에 없더라도 첫날 공항 도착과
  // 선택한 렌터카 정보가 있으면 최소한 인수 카드는 보여준다. 실제 segment가
  // 있는 경우에는 위의 실제 arrivalAt이 항상 우선한다.
  if (!additions.length) {
    const arrivalAirport = source.find((event) => {
      const type = String(event?.type || "").toUpperCase();
      const category = String(event?.category || "").toUpperCase();
      return type === "AIRPORT" && category === "ARRIVAL_AIRPORT";
    });

    const shuttleMinutes = Number(selectedRental?.estimatedShuttleMinutes);
    if (arrivalAirport?.startAt && Number.isFinite(shuttleMinutes) && shuttleMinutes >= 0) {
      const startAt = addMinutesToLocalDateTime(arrivalAirport.startAt, shuttleMinutes);
      additions.push({
        order: Number(arrivalAirport?.order ?? 0) + 0.5,
        type: "RENTAL_CAR",
        placeId: null,
        referenceId: selectedRental?.id ?? null,
        name: rentalName,
        category: "RENTAL_PICKUP",
        latitude: selectedRental?.latitude ?? null,
        longitude: selectedRental?.longitude ?? null,
        startAt,
        endAt: startAt,
        stayMinutes: 0,
        transportModeFromPrevious: "SHUTTLE",
        reason: [
          selectedRental?.car,
          "렌터카를 인수하고 현지 이동을 시작합니다.",
        ]
          .filter(Boolean)
          .join(" · "),
        isLocked: true,
      });
    }
  }

  return [...source, ...additions]
    .map((event, index) => ({ event, index }))
    .sort((a, b) => {
      const aMillis = routeDateTimeMillis(a.event?.startAt ?? a.event?.startTime);
      const bMillis = routeDateTimeMillis(b.event?.startAt ?? b.event?.startTime);

      if (aMillis != null && bMillis != null && aMillis !== bMillis) {
        return aMillis - bMillis;
      }

      if (aMillis != null && bMillis == null) return -1;
      if (aMillis == null && bMillis != null) return 1;

      const aOrder = Number(a.event?.order ?? a.index);
      const bOrder = Number(b.event?.order ?? b.index);
      return aOrder - bOrder;
    })
    .map(({ event }) => event);
}


function findAirSegmentForFlight(day, flightEvent) {
  const flightStart = flightEvent?.startAt ?? flightEvent?.startTime ?? null;
  const flightEnd = flightEvent?.endAt ?? flightEvent?.endTime ?? null;

  const airSegments = daySourceSegments(day).filter(
    (segment) => String(segment?.mode || "").toUpperCase() === "AIR",
  );

  return (
    airSegments.find(
      (segment) =>
        (!flightStart || segment?.departureAt === flightStart) &&
        (!flightEnd || segment?.arrivalAt === flightEnd),
    ) || airSegments[0] || null
  );
}


/**
 * 화면에서는 항공편을 독립 카드로 노출하지 않는다.
 *
 * - 가는 편: 출발 공항 카드 안에 항공편명을 넣는다.
 * - 오는 편: 도착 공항 카드 안에 항공편명을 넣는다.
 *   현재 백엔드가 오는 편 도착 공항 item을 별도로 주지 않아도
 *   AIR TransportSegment의 arrival 정보를 이용해 화면용 공항 item을 만든다.
 *
 * TransportSegment의 AIR 데이터 자체는 그대로 유지되므로
 * 지도/비용/이동시간 계산에는 영향이 없다.
 */

function routeDateTimeMillis(value) {
  if (!value) {
    return null;
  }

  const millis = new Date(value).getTime();
  return Number.isFinite(millis) ? millis : null;
}


function laterRouteDateTime(...values) {
  let selected = null;
  let selectedMillis = null;

  values.forEach((value) => {
    const millis = routeDateTimeMillis(value);

    if (millis == null) {
      return;
    }

    if (selectedMillis == null || millis > selectedMillis) {
      selected = value;
      selectedMillis = millis;
    }
  });

  return selected;
}


function normalizeRoutePlaceName(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .replace(/[()（）]/g, "")
    .toLowerCase();
}


function addMinutesToLocalDateTime(value, minutes) {
  const match = String(value || "").match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/,
  );

  if (!match || !Number.isFinite(Number(minutes))) {
    return value ?? null;
  }

  const [, year, month, day, hour, minute, second = "00"] = match;
  const millis = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  ) + Number(minutes) * 60000;

  const date = new Date(millis);
  const pad = (number) => String(number).padStart(2, "0");

  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
  );
}


function displayEventStayMinutes(event) {
  const raw =
    event?.stayMinutes ??
    event?.durationMinutes ??
    (
      event?.durationSeconds == null
        ? null
        : Number(event.durationSeconds) / 60
    );

  if (raw != null && Number.isFinite(Number(raw))) {
    return Math.max(0, Number(raw));
  }

  return null;
}


/**
 * AI가 만든 item 시각과 실제 Routing 시각이 충돌할 수 있다.
 * 예: 제주공항 도착 08:40인데 첫 관광지도 08:40으로 남아 있는 경우.
 *
 * 화면용 일정에서는 각 장소로 들어오는 TransportSegment.arrivalAt을
 * 최소 시작시각으로 사용해, 공항/항공/렌터카 이동시간을 무시한 카드 겹침을 막는다.
 * 백엔드 원본 데이터는 변경하지 않는다.
 */
function alignDisplayEventsToRoute(events, day) {
  const source = Array.isArray(events) ? events : [];
  const segments = (
    Array.isArray(day?.transportSegments)
      ? day.transportSegments
      : Array.isArray(day?.segments)
        ? day.segments
        : []
  )
    .slice()
    .sort(
      (a, b) =>
        Number(a?.sequence ?? 0) -
        Number(b?.sequence ?? 0),
    );

  let segmentCursor = 0;
  let previousLogicalEndAt = null;

  return source.map((event) => {
    const type = String(event?.type || "").toUpperCase();
    const category = String(event?.category || "").toUpperCase();
    const isArrivalAirport = category.includes("ARRIVAL_AIRPORT");
    const isReturnArrivalAirport = category.includes("RETURN_ARRIVAL_AIRPORT");
    const hasFlight = Boolean(event?.uiFlight?.label || event?.flightLabel);

    let routeArrivalAt = null;

    // 실제 방문 장소는 해당 장소로 들어오는 routing segment를 찾는다.
    // 가는 편 도착공항은 AIR segment의 arrivalAt 자체가 기준이므로 제외하지만,
    // 마지막 날 RETURN_DEPARTURE_AIRPORT는 렌터카/셔틀 segment의 실제 도착시각을
    // 사용해야 한다.
    const isFixedDayAnchor =
      type === "ACCOMMODATION" &&
      (category === "DAY_START" || category === "CHECK_OUT");

    if (
      type !== "FLIGHT" &&
      type !== "DEPARTURE" &&
      !isArrivalAirport &&
      !isFixedDayAnchor
    ) {
      const targetName = normalizeRoutePlaceName(event?.name);

      for (let index = segmentCursor; index < segments.length; index += 1) {
        const segment = segments[index];
        const arrivalName = normalizeRoutePlaceName(segment?.arrivalName);

        if (targetName && arrivalName === targetName) {
          routeArrivalAt = segment?.arrivalAt ?? null;
          segmentCursor = index + 1;
          break;
        }
      }
    }

    let startAt =
      event?.startAt ??
      event?.startTime ??
      null;

    if (hasFlight && isReturnArrivalAirport && event?.uiFlight?.arrivalAt) {
      startAt = event.uiFlight.arrivalAt;
    } else if (hasFlight && event?.uiFlight?.departureAt) {
      startAt = event.uiFlight.departureAt;
    } else if (isArrivalAirport && event?.startAt) {
      startAt = event.startAt;
    } else {
      startAt = laterRouteDateTime(
        startAt,
        routeArrivalAt,
        previousLogicalEndAt,
      ) ?? startAt;
    }

    let logicalEndAt = null;

    // 출발공항 카드는 시간표에서 비행시간 전체를 차지한다.
    if (hasFlight && event?.uiFlight?.arrivalAt) {
      logicalEndAt = event.uiFlight.arrivalAt;
    } else if (isArrivalAirport) {
      // 도착공항은 '도착 시각'을 나타내는 milestone이라 체류시간을 만들지 않는다.
      logicalEndAt = startAt;
    } else {
      const explicitEndAt = event?.endAt ?? event?.endTime ?? null;
      const explicitEndMillis = routeDateTimeMillis(explicitEndAt);
      const startMillis = routeDateTimeMillis(startAt);

      if (
        startMillis != null &&
        explicitEndMillis != null &&
        explicitEndMillis >= startMillis
      ) {
        logicalEndAt = explicitEndAt;
      } else {
        const stayMinutes = displayEventStayMinutes(event);

        if (startMillis != null && stayMinutes != null) {
          logicalEndAt = addMinutesToLocalDateTime(
            startAt,
            stayMinutes,
          );
        }
      }
    }

    if (
      logicalEndAt &&
      (
        previousLogicalEndAt == null ||
        routeDateTimeMillis(logicalEndAt) > routeDateTimeMillis(previousLogicalEndAt)
      )
    ) {
      previousLogicalEndAt = logicalEndAt;
    }

    return {
      ...event,
      startAt,
      // 화면 정렬에 필요한 경우에만 endAt을 보정한다.
      endAt:
        isArrivalAirport
          ? startAt
          : logicalEndAt ?? event?.endAt ?? null,
    };
  });
}


function mergeFlightCardsForDisplay(events, day) {
  const source = Array.isArray(events) ? events : [];
  const result = [];

  for (let index = 0; index < source.length; index += 1) {
    const event = source[index];

    if (String(event?.type || "").toUpperCase() !== "FLIGHT") {
      result.push(event);
      continue;
    }

    const previous = result[result.length - 1] ?? null;
    const next = source[index + 1] ?? null;
    const airSegment = findAirSegmentForFlight(day, event);
    const flight = flightDisplayMeta(event, airSegment);
    const previousCategory = String(previous?.category || "").toUpperCase();

    // 가는 편: 김포국제공항 같은 출발 공항 카드에 항공편 정보를 합친다.
    if (
      String(previous?.type || "").toUpperCase() === "AIRPORT" &&
      previousCategory === "DEPARTURE_AIRPORT"
    ) {
      result[result.length - 1] = {
        ...previous,
        // 출발 공항 자체도 실제 선택 항공편 출발 시각을 기준으로 맞춘다.
        startAt: flight.departureAt ?? previous?.startAt ?? null,
        endAt: previous?.endAt ?? flight.departureAt ?? null,
        uiFlight: flight,
      };

      /*
       * 바로 뒤의 제주국제공항 같은 도착 공항 item은 기존 AI item의 시간이 아니라
       * AIR segment의 실제 arrivalAt을 사용한다. 기존 item을 다음 반복에서 다시
       * 처리하지 않도록 여기서 같이 push하고 index를 넘긴다.
       */
      if (String(next?.type || "").toUpperCase() === "AIRPORT") {
        result.push({
          ...next,
          startAt: flight.arrivalAt ?? next?.startAt ?? null,
          endAt: flight.arrivalAt ?? next?.endAt ?? null,
          stayMinutes: 0,
          durationMinutes: 0,
          durationSeconds: null,
          transportModeFromPrevious: "AIR",
        });
        index += 1;
      }

      continue;
    }

    // 백엔드가 향후 오는 편 도착 공항 item을 제공하면 그 카드에 바로 합친다.
    if (String(next?.type || "").toUpperCase() === "AIRPORT") {
      result.push({
        ...next,
        uiFlight: flight,
      });
      index += 1;
      continue;
    }

    // 현재 응답처럼 오는 편 FLIGHT 뒤에 도착 공항 item이 없으면
    // AIR segment의 arrivalName/좌표를 이용해 화면용 김포공항 카드를 만든다.
    result.push({
      ...event,
      type: "AIRPORT",
      referenceId: event?.referenceId ?? airSegment?.id ?? null,
      name: airSegment?.arrivalName || "도착 공항",
      category: "RETURN_ARRIVAL_AIRPORT",
      latitude: airSegment?.arrivalLatitude ?? null,
      longitude: airSegment?.arrivalLongitude ?? null,
      // 도착 공항 카드는 AIR TransportSegment의 실제 도착 시각에만 배치한다.
      // FLIGHT item의 체류시간/AI 일정시간을 그대로 물려받으면 시간표에서 90분짜리
      // 공항 카드가 생기므로 명시적으로 0분 처리한다.
      startAt: flight.arrivalAt ?? event?.endAt ?? event?.endTime ?? null,
      endAt: flight.arrivalAt ?? event?.endAt ?? event?.endTime ?? null,
      stayMinutes: 0,
      durationMinutes: 0,
      durationSeconds: null,
      travelMinutes: null,
      transportModeFromPrevious: "AIR",
      reason: "오는 편 항공편으로 도착 공항까지 이동합니다.",
      isLocked: true,
      uiFlight: flight,
    });
  }

  return result;
}


function finiteRouteNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}


function normalizeRoutePoint(point) {
  if (!point || typeof point !== "object") {
    return null;
  }

  const latitude = finiteRouteNumber(
    point.latitude ?? point.lat ?? point.y,
  );

  const longitude = finiteRouteNumber(
    point.longitude ?? point.lng ?? point.lon ?? point.x,
  );

  if (latitude == null || longitude == null) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}


function normalizeTransportSegment(segment, segmentIndex) {
  if (!segment || typeof segment !== "object") {
    return null;
  }

  const path = Array.isArray(segment.path)
    ? segment.path
        .map(normalizeRoutePoint)
        .filter(Boolean)
    : [];

  return {
    id:
      segment.id ??
      `segment-${segmentIndex + 1}`,

    sequence:
      finiteRouteNumber(segment.sequence) ??
      segmentIndex + 1,

    mode:
      segment.mode ??
      null,

    departureName:
      segment.departureName ??
      "",

    arrivalName:
      segment.arrivalName ??
      "",

    departureLatitude:
      finiteRouteNumber(
        segment.departureLatitude,
      ),

    departureLongitude:
      finiteRouteNumber(
        segment.departureLongitude,
      ),

    arrivalLatitude:
      finiteRouteNumber(
        segment.arrivalLatitude,
      ),

    arrivalLongitude:
      finiteRouteNumber(
        segment.arrivalLongitude,
      ),

    departureAt:
      segment.departureAt ??
      null,

    arrivalAt:
      segment.arrivalAt ??
      null,

    distanceKm:
      finiteRouteNumber(
        segment.distanceKm,
      ),

    durationMinutes:
      finiteRouteNumber(
        segment.durationMinutes,
      ),

    cost:
      finiteRouteNumber(
        segment.cost,
      ),

    routeProvider:
      segment.routeProvider ??
      null,

    path,
  };
}


function normalizeDayRoute(day, dayIndex) {
  const sourceSegments =
    Array.isArray(day?.transportSegments)
      ? day.transportSegments
      : Array.isArray(day?.segments)
        ? day.segments
        : [];

  const segments = sourceSegments
    .map(normalizeTransportSegment)
    .filter(Boolean)
    .sort((a, b) => a.sequence - b.sequence);

  if (!segments.length) {
    return null;
  }

  const providers = [
    ...new Set(
      segments
        .map((segment) => segment.routeProvider)
        .filter(Boolean),
    ),
  ];

  return {
    dayIndex,
    dayNumber:
      day?.dayNumber ??
      dayIndex + 1,
    date:
      day?.date ??
      null,
    provider:
      providers.length === 1
        ? providers[0]
        : providers.includes("KAKAO_MOBILITY")
          ? "KAKAO_MOBILITY"
          : providers[0] ?? null,
    providers,
    segments,
  };
}


const minutesFromClock = (value, fallback = 9 * 60) => {
  const match = String(value || "").match(/^(\d{2}):(\d{2})$/);
  if (!match) return fallback;
  return Number(match[1]) * 60 + Number(match[2]);
};

const clockFromMinutes = (value) => {
  const safe = Math.max(0, Math.min(23 * 60 + 59, Math.round(value)));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
};

const durationFromTuple = (event) => {
  const metadata = event?.[6] || {};
  const direct = Number(metadata.stayMinutes);
  if (Number.isFinite(direct) && direct >= 0) return direct;
  const parsed = Number.parseInt(String(event?.[4] || ""), 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 60;
};

const isDinnerEvent = (event) => {
  const metadata = event?.[6] || {};
  const type = String(metadata.type || "").toUpperCase();
  const category = String(metadata.category || "").toUpperCase();
  const name = String(event?.[2] || "");
  const start = minutesFromClock(event?.[0], -1);
  return (type === "RESTAURANT" || /DINNER|EVENING_MEAL/.test(category) || /저녁/.test(name))
    && start >= 17 * 60 + 15
    && start <= 21 * 60;
};

const isHardTransportAnchor = (event) => {
  const metadata = event?.[6] || {};
  const type = String(metadata.type || "").toUpperCase();
  const category = String(metadata.category || "").toUpperCase();
  const name = String(event?.[2] || "");

  if (["DEPARTURE", "AIRPORT", "FLIGHT", "RENTAL", "RENT_CAR", "CAR_RENTAL", "RENTAL_CAR"].includes(type)) {
    return true;
  }

  if (/ARRIVAL_AIRPORT|DEPARTURE_AIRPORT/.test(category)) {
    return true;
  }

  // 타입이 명시된 일반 장소는 상호명에 "공항"이 들어가도 교통 앵커로 잠그지 않는다.
  if (["ATTRACTION", "RESTAURANT", "CAFE", "ACCOMMODATION"].includes(type)) {
    return false;
  }

  return isAirportName(name) || /항공|탑승|렌터카/.test(name);
};

/** Frontend-only display refinement: keep fixed travel anchors, reduce dead time, and fill a missing dinner slot. */
function refineDisplayedSchedule(dayPlans = []) {
  if (!Array.isArray(dayPlans)) return [];

  return dayPlans.map((day, dayIndex) => {
    const source = Array.isArray(day?.[2]) ? day[2] : [];
    if (!source.length) return day;

    const events = source.map((event) => [
      ...event.slice(0, 6),
      {
        ...(event[6] || {}),
        isLocked: dayIndex === 0 && isHardTransportAnchor(event)
          ? true
          : Boolean(event?.[6]?.isLocked),
      },
    ]);

    let cursor = dayIndex === 1 ? 9 * 60 : minutesFromClock(events[0]?.[0], 9 * 60);
    let sawMovable = false;

    for (let index = 0; index < events.length; index += 1) {
      const event = events[index];
      const metadata = event[6] || {};
      const original = minutesFromClock(event[0], cursor);
      const hardAnchor = dayIndex === 0 && isHardTransportAnchor(event);
      const fixed = hardAnchor || Boolean(metadata.isLocked);
      let start;

      const eventType = String(metadata.type || "").toUpperCase();
      const eventCategory = String(metadata.category || "").toUpperCase();
      const isBreakfast = eventType === "RESTAURANT" && original < 10 * 60 + 30;
      const isIntendedDinner = eventType === "RESTAURANT" && original >= 17 * 60 + 15;

      if (fixed) {
        start = Math.max(cursor, original);
      } else if (dayIndex === 1 && isBreakfast) {
        // 둘째 날 조식은 너무 이른 7~8시 대신 9시 전후로 늦춘다.
        start = Math.max(9 * 60, cursor, Math.min(original, 9 * 60 + 30));
        sawMovable = true;
      } else if (isIntendedDinner || /DINNER|EVENING_MEAL/.test(eventCategory)) {
        // 저녁 식사는 공백 압축 때문에 오후 이른 시간으로 끌려오지 않게 식사 시간대를 지킨다.
        start = Math.max(cursor, 17 * 60 + 30, Math.min(original, 19 * 60 + 30));
        sawMovable = true;
      } else if (!sawMovable && dayIndex === 1) {
        start = Math.max(10 * 60, cursor, original);
        sawMovable = true;
      } else {
        start = Math.max(cursor, Math.min(original, cursor + 45));
        sawMovable = true;
      }

      event[0] = clockFromMinutes(start);
      const date = String(metadata.startAt || "").match(/^\d{4}-\d{2}-\d{2}/)?.[0];
      const stay = durationFromTuple(event);
      event[6] = {
        ...metadata,
        displayScheduleAdjusted: true,
        startAt: date ? `${date}T${clockFromMinutes(start)}:00` : metadata.startAt,
        endAt: date ? `${date}T${clockFromMinutes(start + stay)}:00` : metadata.endAt,
      };
      cursor = start + stay + Math.max(0, Number(event[5]) || Number(metadata.travelMinutes) || 0);
    }

    // 카페 바로 다음이 저녁인데 사이가 과도하게 비면 카페를 오후로 옮겨 흐름을 촘촘하게 만든다.
    const dinnerIndex = events.findIndex(isDinnerEvent);
    if (dinnerIndex > 0) {
      const dinner = events[dinnerIndex];
      const previous = events[dinnerIndex - 1];
      const previousType = String(previous?.[6]?.type || "").toUpperCase();
      const dinnerStart = minutesFromClock(dinner?.[0], 18 * 60);
      const previousStart = minutesFromClock(previous?.[0], 0);
      const previousStay = durationFromTuple(previous);
      const currentGap = dinnerStart - (previousStart + previousStay);

      if (previousType === "CAFE" && !previous?.[6]?.isLocked && currentGap > 120) {
        const eventBefore = events[dinnerIndex - 2];
        const earliest = eventBefore
          ? minutesFromClock(eventBefore[0], 0) + durationFromTuple(eventBefore) + Math.max(0, Number(eventBefore[5]) || 0)
          : previousStart;
        const shifted = Math.max(earliest, dinnerStart - previousStay - 60);
        previous[0] = clockFromMinutes(shifted);
        const date = String(previous?.[6]?.startAt || "").match(/^\d{4}-\d{2}-\d{2}/)?.[0];
        previous[6] = {
          ...(previous[6] || {}),
          startAt: date ? `${date}T${clockFromMinutes(shifted)}:00` : previous?.[6]?.startAt,
          endAt: date ? `${date}T${clockFromMinutes(shifted + previousStay)}:00` : previous?.[6]?.endAt,
          displayScheduleAdjusted: true,
        };
      }
    }

    const isLastDay = dayIndex === dayPlans.length - 1;
    const hasDinner = events.some(isDinnerEvent);
    const lateFlight = [...events].reverse().find((event) => {
      const type = String(event?.[6]?.type || "").toUpperCase();
      return ["FLIGHT", "AIRPORT"].includes(type) && minutesFromClock(event?.[0], 24 * 60) >= 17 * 60;
    });
    const eveningDeadline = lateFlight ? minutesFromClock(lateFlight[0], 24 * 60) - 90 : 21 * 60;

    if (!hasDinner && (!isLastDay || eveningDeadline >= 19 * 60)) {
      const dinnerStart = Math.max(18 * 60, Math.min(cursor, 19 * 60));
      if (dinnerStart + 60 <= eveningDeadline) {
        const date = String(events[0]?.[6]?.startAt || "").match(/^\d{4}-\d{2}-\d{2}/)?.[0];
        events.push([
          clockFromMinutes(dinnerStart),
          "🍽️",
          "저녁 식사",
          "선호 음식과 현재 동선을 반영한 저녁 식사 시간이에요. 장소 변경에서 원하는 맛집으로 바꿀 수 있습니다.",
          "60분",
          20,
          {
            id: `frontend-dinner-day-${dayIndex + 1}`,
            type: "RESTAURANT",
            category: "DINNER",
            order: events.length + 1,
            startAt: date ? `${date}T${clockFromMinutes(dinnerStart)}:00` : null,
            endAt: date ? `${date}T${clockFromMinutes(dinnerStart + 60)}:00` : null,
            stayMinutes: 60,
            travelMinutes: 20,
            isLocked: false,
            syntheticMeal: true,
            estimated: { startTime: true, stayMinutes: false, travelMinutes: true, price: true },
          },
        ]);
      }
    }

    return [day[0], day[1], events];
  });
}

/**
 * 백엔드 TripPlanResponse
 *
 * ↓
 *
 * 현재 프론트 UI에서 사용 중인 dayPlans
 */
export function normalizeTripPlanResponse(
  payload,
) {
  const root =
    payload?.plan ||
    payload ||
    {};


  const sourceDays =
    Array.isArray(
      root?.days,
    )
      ? root.days
      : Array.isArray(
            root?.dayPlans,
          )
        ? root.dayPlans
        : [];


  const normalizedDayPlans =
    sourceDays.map(
      (
        day,
        dayIndex,
      ) => {
        /*
         * 이미 기존 UI 형식이면
         * 그대로 살려준다.
         */
        if (
          Array.isArray(day)
        ) {
          return [
            day[0],

            day[1],

            (
              day[2] ||
              []
            ).map(
              (
                event,
                eventIndex,
              ) =>
                normalizePlanEvent(
                  event,
                  dayIndex,
                  eventIndex,
                ),
            ),
          ];
        }


        const sourceEvents =
          Array.isArray(
            day?.items,
          )
            ? day.items
            : Array.isArray(
                  day?.events,
                )
              ? day.events
              : [];

        // 렌터카 업체도 일정 카드로 다시 노출한다.
        // SHUTTLE / RENTAL_CAR TransportSegment는 기존대로 경로 계산에 사용하고,
        // sourceEvents에 존재하는 렌터카 업체 item은 시간표/상세 일정에도 표시한다.
        const displayEvents =
          sourceEvents;

        const mergedEvents =
          mergeFlightCardsForDisplay(
            displayEvents,
            day,
          );

        const eventsWithRental =
          insertRentalTransferCards(
            mergedEvents,
            day,
            root?.selectedRental ?? null,
          );

        const events =
          alignDisplayEventsToRoute(
            eventsWithRental,
            day,
          );


        const dayNumber =
          day?.dayNumber ??
          dayIndex +
            1;


        const date =
          day?.date ||
          "";


        return [
          /*
           * PlanFullscreen 제목
           */
          `${dayNumber}일차 여행`,


          /*
           * PlanFullscreen 설명
           */
          date
            ? `${date} · AI 추천 일정`
            : "AI 추천 일정",


          events.map(
            (
              event,
              eventIndex,
            ) =>
              normalizePlanEvent(
                event,
                dayIndex,
                eventIndex,
              ),
          ),
        ];
      },
    );


  const dayPlans = refineDisplayedSchedule(normalizedDayPlans);


  return {
    /*
     * 기존 frontend가 id를 사용하므로
     * tripId를 id로도 제공.
     */
    id:
      root?.tripId ??
      root?.id ??
      null,

    tripId:
      root?.tripId ??
      null,


    /*
     * 현재 backend revision API 없음
     */
    revisionId:
      null,


    planner:
      root?.planner ||
      "",

    timeBasis:
      root?.timeBasis ||
      "",


    mainTransportMode:
      root?.mainTransportMode ??
      null,

    localTransportMode:
      root?.localTransportMode ??
      null,


    selectedAccommodation:
      root?.selectedAccommodation ??
      null,


    outboundFlight:
      root?.outboundFlight ??
      null,

    returnFlight:
      root?.returnFlight ??
      null,


    weather:
      Array.isArray(
        root?.weather,
      )
        ? root.weather
        : [],


    attractionCandidateCount:
      root?.attractionCandidateCount ??
      0,

    restaurantCandidateCount:
      root?.restaurantCandidateCount ??
      0,

    cafeCandidateCount:
      root?.cafeCandidateCount ??
      0,


    dayPlans,


    /*
     * backend days[].transportSegments를
     * 지도 UI용 routeResults로 변환한다.
     *
     * 별도 길찾기 API를 프론트에서 다시 호출하지 않고
     * Plan 생성 시 백엔드가 계산한 Kakao Mobility path를 그대로 사용한다.
     */
    routes:
      sourceDays
        .map(
          (day, dayIndex) =>
            normalizeDayRoute(
              day,
              dayIndex,
            ),
        )
        .filter(Boolean),

    costEstimate:
      root?.costEstimate ?? null,


    source:
      "trip-plan",
  };
}


/**
 * 실제 AI 여행 일정 생성
 *
 * POST /api/trips/{tripId}/plan
 */
export async function requestTripPlan(
  tripId,
  {
    signal,
    pollIntervalMs = 2000,
    pollTimeoutMs = 300000,
  } = {},
) {
  if (!tripId) {
    throw new TypeError(
      "여행 일정 생성을 위한 tripId가 없습니다.",
    );
  }

  const response =
    await apiClient.request(
      `/api/trips/${encodeURIComponent(
        tripId,
      )}/plan`,
      {
        method:
          "POST",

        /*
         * 숙소/항공은 POST /api/trips 시점에
         * 이미 Trip에 저장되어 있으므로
         * 별도 request body가 필요 없다.
         */
        signal,

        timeoutMs:
          15000,
      },
    );

  /* 이전 동기식 응답도 계속 지원한다. */
  if (
    Array.isArray(response?.days) ||
    Array.isArray(response?.dayPlans)
  ) {
    return normalizeTripPlanResponse(response);
  }

  const deadline =
    Date.now() + Math.max(1000, pollTimeoutMs);

  while (Date.now() < deadline) {
    await waitForPlanPoll(pollIntervalMs, signal);

    const statusResponse =
      await getTripPlanStatus(tripId, { signal });

    const status =
      String(statusResponse?.status || "").toUpperCase();

    if (status === "COMPLETED") {
      if (!statusResponse?.plan) {
        throw new Error(
          "완료된 여행 일정 결과가 비어 있습니다.",
        );
      }

      return normalizeTripPlanResponse(statusResponse.plan);
    }

    if (status === "FAILED") {
      throw new Error(
        statusResponse?.errorMessage ||
          "여행 일정 생성에 실패했습니다.",
      );
    }

    if (status !== "PENDING" && status !== "PROCESSING") {
      throw new Error(
        `알 수 없는 여행 일정 생성 상태입니다: ${status || "EMPTY"}`,
      );
    }
  }

  throw new Error(
    "여행 일정 생성 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.",
  );
}


/**
 * 비동기 일정 생성 상태 및 완료 결과 조회
 *
 * GET /api/trips/{tripId}/plan
 */
export async function getTripPlanStatus(
  tripId,
  {
    signal,
  } = {},
) {
  if (!tripId) {
    throw new TypeError(
      "여행 일정 조회를 위한 tripId가 없습니다.",
    );
  }

  return apiClient.request(
    `/api/trips/${encodeURIComponent(tripId)}/plan`,
    {
      method: "GET",
      signal,
      timeoutMs: 15000,
    },
  );
}


function waitForPlanPoll(
  milliseconds,
  signal,
) {
  if (signal?.aborted) {
    return Promise.reject(createPlanAbortError());
  }

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onAbort);
      reject(createPlanAbortError());
    };

    const timeoutId = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, Math.max(0, milliseconds));

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}


function createPlanAbortError() {
  const error = new Error(
    "여행 일정 생성 요청이 취소되었습니다.",
  );
  error.name = "AbortError";
  return error;
}


/**
 * 아직 backend에 revision API 없음.
 *
 * useTripPlanner에서 source를 검사해
 * 이 함수를 호출하지 않도록 할 예정.
 */
export async function requestTripPlanRevision() {
  throw new Error(
    "현재 백엔드에는 일정 재계산 API가 없습니다.",
  );
}
