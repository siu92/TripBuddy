import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { preconnect, preload } from "react-dom";
import { isMockModeEnabled } from "../api/apiClient";
import { recommendAccommodations } from "../api/accommodationApi";
import { searchFlights } from "../api/flightApi";
import { createTrip } from "../api/tripApi";
import { loadPlanEditor, savePlanEditor, searchPlanPlaces } from "../api/planEditorApi.js";
import {
  normalizeTripPlanResponse,
  requestTripPlan,
} from "../api/tripPlanApi";
import {
  makeDemoTicketOptions,
  recalculateDayTimeline,
  resolveTripSchedule,
} from "../data/travelSchedule";
import {
  destinationCoordinatesByName,
  jejuRegionCoordinates,
  koreanRegions,
} from "../data/locationCatalog";
import jejuCoastPhoto from "../assets/jeju-main-hero.jpeg";
import {
  applyFoodPreferences,
  applyPlanEdits,
  demoRentalsForLocation,
  distanceBetween,
  estimateIntercityFare,
  eventPrice,
  flightOriginAirports,
  getDates,
  heroSlides,
  jejuRegionOptions,
  localOptions,
  makeDayPlans,
  money,
  outboundOptions,
  placeEntryCost,
  today,
  transportName,
} from "../data/mockData";
import { getPlaceCostEstimate } from "../utils/placeCostEstimates";
import {
  addPriceVariationBuffer,
  stablePlanEstimate,
  sumCostGroups,
} from "../utils/costEstimate.js";
import { buildPlanEditRequest } from "../utils/planEditPayload.js";
import { isAirportRouteSegment } from "../utils/routeFilters.js";
import { locationRequestName } from "../utils/locationPayload.js";


const TRIP_COST_SNAPSHOT_KEY = "tripbuddy-trip-cost-snapshots-v1";

const readTripCostSnapshots = () => {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(TRIP_COST_SNAPSHOT_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const saveTripCostSnapshot = (tripId, snapshot) => {
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

const getTripCostSnapshot = (tripId) =>
  tripId ? readTripCostSnapshots()[String(tripId)] || null : null;


const flightTimeLabel = (flight) => {
  if (
    !flight?.departureTime ||
    !flight?.arrivalTime
  ) {
    return "";
  }

  const departure =
    String(
      flight.departureTime,
    ).slice(
      11,
      16,
    );

  const arrival =
    String(
      flight.arrivalTime,
    ).slice(
      11,
      16,
    );

  return `${departure} → ${arrival}`;
};


const flightDurationMinutes = (
  flight,
) => {
  const suppliedDuration =
    Number(
      flight?.durationMinutes,
    );

  if (
    Number.isFinite(
      suppliedDuration,
    ) &&
    suppliedDuration > 0
  ) {
    return Math.round(
      suppliedDuration,
    );
  }

  if (
    !flight?.departureTime ||
    !flight?.arrivalTime
  ) {
    return 0;
  }

  const departure =
    new Date(
      flight.departureTime,
    );

  const arrival =
    new Date(
      flight.arrivalTime,
    );

  const duration =
    Math.round(
      (
        arrival.getTime() -
        departure.getTime()
      ) /
      60000,
    );

  return Number.isFinite(
    duration,
  )
    ? Math.max(
        0,
        duration,
      )
    : 0;
};


const flightLocationName = (
  location,
) => {
  if (!location) {
    return "";
  }

  return [
    location.region,

    location.detail ||
      location.name,
  ]
    .filter(
      Boolean,
    )
    .join(
      " ",
    )
    .trim();
};


const normalizeFlightCandidate = (
  flight,
) => {
  const estimatedPricePerPerson =
    Number(
      flight?.estimatedPricePerPerson,
    ) ||
    0;

  const timeLabel =
    flightTimeLabel(
      flight,
    );

  return {
    ...flight,

    code:
      flight?.flightNumber ||
      flight?.airlineCode ||
      "AIR",

    out:
      timeLabel,

    back:
      timeLabel,

    durationMinutes:
      flightDurationMinutes(
        flight,
      ),

    /*
     * 기존 App.jsx의 oneWayFare()가
     * fare / 2 형태를 사용하므로 호환용 값.
     */
    fare:
      estimatedPricePerPerson *
      2,

    originalFare:
      estimatedPricePerPerson *
      2,

    discount:
      0,

    seats:
      null,

    tone:
      "sky",

    cabin:
      flight?.aircraft ||
      "기종 정보 없음",

    baggage:
      flight?.status ||
      "운항 상태 확인",

    fareNote:
      flight?.priceType ===
      "ESTIMATED"
        ? "예상 운임"
        : "운임",
  };
};


const planEventKey = (event, dayIndex, eventIndex) =>
  event?.[6]?.id || `day-${dayIndex + 1}-stop-${eventIndex + 1}`;


const applyPlanOrders = (plans, orders, localTransport) =>
  plans.map((day, dayIndex) => {
    const order = orders[dayIndex];
    if (!order?.length) return day;

    const byId = new Map(
      day[2].map((event, eventIndex) => [planEventKey(event, dayIndex, eventIndex), event]),
    );
    const ordered = order.map((id) => byId.get(id)).filter(Boolean);
    const known = new Set(order);

    return recalculateDayTimeline([
      day[0],
      day[1],
      [
        ...ordered,
        ...day[2].filter((event, eventIndex) =>
          !known.has(planEventKey(event, dayIndex, eventIndex))),
      ],
    ], localTransport);
  });


const applyPlanCustomizations = (plans, customizations, localTransport) =>
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

    return recalculateDayTimeline([
      day[0],
      day[1],
      rows.map((event) => [
        ...event.slice(0, 6),
        { ...(event[6] || {}), locallyReordered: true },
      ]),
    ], localTransport);
  });


const MAX_PREFERENCE_SELECTIONS =
  3;


const AVAILABLE_THEMES =
  new Set([
    "맛집",
    "관광",
    "휴식",
    "자연",
    "액티비티",
  ]);


const AVAILABLE_FOOD_PREFERENCES =
  new Set([
    "KOREAN",
    "JAPANESE",
    "CHINESE",
    "WESTERN",
    "ASIAN",
    "CASUAL",
    "CAFE",
    "VEGETARIAN",
  ]);


const normalizeThemes = (
  value,
) =>
  Array.isArray(
    value,
  )
    ? [
        ...new Set(
          value,
        ),
      ]
        .filter(
          (
            item,
          ) =>
            AVAILABLE_THEMES.has(
              item,
            ),
        )
        .slice(
          0,
          MAX_PREFERENCE_SELECTIONS,
        )
    : [];


const normalizeFoodPreferences = (
  value,
) =>
  Array.isArray(
    value,
  )
    ? [
        ...new Set(
          value,
        ),
      ]
        .filter(
          (
            item,
          ) =>
            AVAILABLE_FOOD_PREFERENCES.has(
              item,
            ),
        )
        .slice(
          0,
          MAX_PREFERENCE_SELECTIONS,
        )
    : [];


const readInitialDraft =
  () => {
    try {
      const saved =
        JSON.parse(
          window.localStorage.getItem(
            "tripDraft",
          ) ||
            "{}",
        );

      if (
        !saved ||
        typeof saved !==
          "object" ||
        Array.isArray(
          saved,
        )
      ) {
        return {};
      }

      const next = {
        ...saved,
      };

      const startIsPast =
        typeof next.startDate ===
          "string" &&
        next.startDate <
          today;

      const rangeIsInvalid =
        next.endDate &&
        next.startDate &&
        next.endDate <
          next.startDate;

      if (
        startIsPast ||
        rangeIsInvalid
      ) {
        next.startDate =
          today;

        next.endDate =
          "";

        next.transport =
          "";

        next.localTransport =
          "";

        delete next.bookingSelection;
      }

      return next;
    } catch {
      return {};
    }
  };

const MAIN_TRANSPORT_MAP = {
  FLIGHT: "AIR",
  KTX: "KTX",
  SRT: "SRT",
  BUS: "EXPRESS_BUS",
  CAR: "OWN_CAR",
};


const LOCAL_TRANSPORT_MAP = {
  WALK: "WALK",

  TRANSIT:
    "PUBLIC_TRANSIT",

  PUBLIC_TRANSIT:
    "PUBLIC_TRANSIT",

  TAXI:
    "TAXI",

  CAR:
    "OWN_CAR",

  RENTAL:
    "RENTAL_CAR",

  RENTAL_CAR:
    "RENTAL_CAR",
};


const PACE_MAP = {
  "여유롭게":
    "RELAXED",

  "보통":
    "BALANCED",

  "빡빡하게":
    "ACTIVE",
};


const THEME_MAP = {
  "자연":
    "NATURE",

  "관광":
    "SIGHTSEEING",

  "맛집":
    "FOOD",

  "카페":
    "CAFE",

  "역사":
    "HISTORY",

  "액티비티":
    "ACTIVITY",

  "휴식":
    "HEALING",
};


const FOOD_PREFERENCE_MAP = {
  KOREAN:
    "KOREAN",

  JAPANESE:
    "JAPANESE",

  WESTERN:
    "WESTERN",

  CHINESE:
    "CHINESE",

  ASIAN:
    "ASIAN",

  /*
   * frontend CASUAL
   * backend SNACK
   */
  CASUAL:
    "SNACK",

  CAFE:
    "CAFE",

  /*
   * 현재 backend FoodPreference에
   * VEGETARIAN 없음.
   *
   * undefined → 요청에서 자동 제외.
   */
};


const flightDepartureClockMinutes = (
  flight,
) => {
  const time = String(
    flight?.departureTime ||
      "",
  ).slice(
    11,
    16,
  );

  const [hour, minute] =
    time
      .split(":")
      .map(Number);

  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return Number.MAX_SAFE_INTEGER;
  }

  return hour * 60 + minute;
};

const MAIN_TRANSPORT_FROM_BACKEND = {
  AIR: "FLIGHT",
  KTX: "KTX",
  SRT: "SRT",
  EXPRESS_BUS: "BUS",
  OWN_CAR: "CAR",
};

const LOCAL_TRANSPORT_FROM_BACKEND = {
  WALK: "WALK",
  PUBLIC_TRANSIT: "TRANSIT",
  TAXI: "TAXI",
  OWN_CAR: "CAR",
  RENTAL_CAR: "RENTAL",
};

const PACE_FROM_BACKEND = {
  RELAXED: "여유롭게",
  BALANCED: "보통",
  ACTIVE: "빡빡하게",
};

const THEME_FROM_BACKEND = Object.fromEntries(
  Object.entries(THEME_MAP).map(([label, code]) => [code, label]),
);

const FOOD_FROM_BACKEND = Object.fromEntries(
  Object.entries(FOOD_PREFERENCE_MAP)
    .filter(([, code]) => Boolean(code))
    .map(([label, code]) => [code, label]),
);


const toFlightCandidatePayload = (
  flight,
) => {
  if (!flight) {
    return null;
  }

  return {
    id:
      flight.id ??
      null,

    direction:
      flight.direction ??
      null,

    airline:
      flight.airline ??
      "",

    airlineCode:
      flight.airlineCode ??
      "",

    flightNumber:
      flight.flightNumber ??
      "",

    departureAirport:
      flight.departureAirport ??
      "",

    arrivalAirport:
      flight.arrivalAirport ??
      "",

    departureTime:
      flight.departureTime ??
      null,

    arrivalTime:
      flight.arrivalTime ??
      null,

    estimatedPricePerPerson:
      Number(
        flight.estimatedPricePerPerson ??
        0,
      ),

    estimatedTotalPrice:
      Number(
        flight.estimatedTotalPrice ??
        0,
      ),

    priceType:
      flight.priceType ||
      "ESTIMATED",

    aircraft:
      flight.aircraft ??
      null,

    status:
      flight.status ??
      null,
  };
};

function useTripPlanner() {
  const [
    initialDraft,
  ] =
    useState(
      readInitialDraft,
    );

  const initialBookingSelection =
    initialDraft.bookingSelection && typeof initialDraft.bookingSelection === "object"
      ? initialDraft.bookingSelection
      : {};


  const [
    destinationType,
    setDestinationType,
  ] =
    useState(
      initialDraft.destinationType ||
        "",
    );


  const [
    destination,
    setDestination,
  ] =
    useState(
      initialDraft
        .destinationLocation
        ?.detail ||
        initialDraft
          .destinationLocation
          ?.name ||
        "",
    );


  const [
    destinationLocation,
    setDestinationLocation,
  ] =
    useState(
      initialDraft.destinationLocation ||
        null,
    );


  const [
    destinationRegionId,
    setDestinationRegionId,
  ] =
    useState("");


  const [
    menuOpen,
    setMenuOpen,
  ] =
    useState(
      false,
    );


  const [
    customDestination,
    setCustomDestination,
  ] =
    useState("");


  const [
    departureLocation,
    setDepartureLocation,
  ] =
    useState(
      initialDraft.departureLocation ||
        null,
    );


  const [
    departureRegionId,
    setDepartureRegionId,
  ] =
    useState("");


  const [
    departureMenuOpen,
    setDepartureMenuOpen,
  ] =
    useState(
      false,
    );


  const [
    customDeparture,
    setCustomDeparture,
  ] =
    useState("");


  const [
    prompt,
    setPrompt,
  ] =
    useState(
      initialDraft.prompt ||
        "",
    );


  const [
    startDate,
    setStartDate,
  ] =
    useState(
      initialDraft.startDate ||
        today,
    );


  const [
    endDate,
    setEndDate,
  ] =
    useState(
      initialDraft.endDate ||
        "",
    );


  const [
    startTime,
    setStartTime,
  ] =
    useState(
      initialDraft.startTime ||
        "09:00",
    );


  const [
    endTime,
    setEndTime,
  ] =
    useState(
      initialDraft.endTime ||
        "18:00",
    );


  const [
    manualTimeConfirmed,
    setManualTimeConfirmed,
  ] =
    useState(
      false,
    );


  const [
    ticketLeg,
    setTicketLeg,
  ] =
    useState(
      "outbound",
    );


  const [
    outboundTicketId,
    setOutboundTicketId,
  ] =
    useState("");


  const [
    returnTicketId,
    setReturnTicketId,
  ] =
    useState("");


  const [
    travelers,
    setTravelers,
  ] =
    useState(
      initialDraft.travelers ||
        null,
    );


  const [
    travelerInput,
    setTravelerInput,
  ] =
    useState("");


  const [
    travelerPromptOpen,
    setTravelerPromptOpen,
  ] =
    useState(
      false,
    );


  const [
    budget,
    setBudget,
  ] =
    useState(
      initialDraft.budget ||
        900000,
    );


  const [
    pace,
    setPace,
  ] =
    useState(
      initialDraft.pace ||
        "보통",
    );


  const [
    themes,
    setThemes,
  ] =
    useState(
      () =>
        normalizeThemes(
          initialDraft.themes || [
            "맛집",
            "관광",
          ],
        ),
    );


  const [
    foodPreferences,
    setFoodPreferencesState,
  ] =
    useState(
      () =>
        normalizeFoodPreferences(
          initialDraft.foodPreferences,
        ),
    );


  const setFoodPreferences =
    useCallback(
      (
        nextValue,
      ) => {
        setFoodPreferencesState(
          (
            current,
          ) =>
            normalizeFoodPreferences(
              typeof nextValue ===
                "function"
                ? nextValue(
                    current,
                  )
                : nextValue,
            ),
        );
      },
      [],
    );


  useEffect(
    () => {
      try {
        const currentDraft = JSON.parse(
          window.localStorage.getItem("tripDraft") || "{}",
        );
        window.localStorage.setItem(
          "tripDraft",

          JSON.stringify({
            ...(currentDraft && typeof currentDraft === "object" ? currentDraft : {}),
            destinationType,
            destinationLocation,
            departureLocation,
            prompt,
            startDate,
            endDate,
            startTime,
            endTime,
            travelers,
            budget,
            pace,
            themes,
            foodPreferences,
          }),
        );
      } catch {
        /*
         * storage 오류는
         * 플래너 진행을 막지 않는다.
         */
      }
    },
    [
      destinationType,
      destinationLocation,
      departureLocation,
      prompt,
      startDate,
      endDate,
      startTime,
      endTime,
      travelers,
      budget,
      pace,
      themes,
      foodPreferences,
    ],
  );


  const resetTripDraft =
    () => {
      try {
        window.localStorage.removeItem(
          "tripDraft",
        );
      } catch {
        // no-op
      }

      window.location.reload();
    };


  const [
    heroSlideIndex,
    setHeroSlideIndex,
  ] =
    useState(
      0,
    );


  const [
    transportPromptReady,
    setTransportPromptReady,
  ] =
    useState(
      false,
    );


  const [
    jejuBaseArea,
    setJejuBaseArea,
  ] =
    useState("");


  const [
    jejuCustomArea,
    setJejuCustomArea,
  ] =
    useState("");


  const [
    jejuAreaModalOpen,
    setJejuAreaModalOpen,
  ] =
    useState(
      false,
    );


  const [
    jejuRegionGuideOpen,
    setJejuRegionGuideOpen,
  ] =
    useState(
      false,
    );


  const [
    loginOpen,
    setLoginOpen,
  ] =
    useState(
      false,
    );


  useEffect(
    () => {
      const slideTimer =
        window.setInterval(
          () =>
            setHeroSlideIndex(
              (
                current,
              ) =>
                (
                  current +
                  1
                ) %
                heroSlides.length,
            ),

          4000,
        );

      return () =>
        window.clearInterval(
          slideTimer,
        );
    },
    [],
  );


  useEffect(
    () => {
      if (
        destinationLocation &&
        departureLocation &&
        endDate &&
        transportPromptReady
      ) {
        setTransportStep(
          "mode",
        );

        setTransportModalOpen(
          true,
        );

        setTransportPromptReady(
          false,
        );
      }
    },
    [
      departureLocation,
      destinationLocation,
      endDate,
      transportPromptReady,
    ],
  );


  useEffect(
    () => {
      if (
        !jejuAreaModalOpen
      ) {
        return;
      }

      setJejuAreaModalOpen(
        false,
      );

      setJejuRegionGuideOpen(
        true,
      );
    },
    [
      jejuAreaModalOpen,
    ],
  );


  const [
    transport,
    setTransport,
  ] =
    useState(
      initialDraft.transport ||
        "",
    );


  const [
    localTransport,
    setLocalTransport,
  ] =
    useState(
      initialDraft.localTransport ||
        "",
    );


  const [
    carType,
    setCarType,
  ] =
    useState(
      initialDraft.carType ||
        "세단",
    );


  const [
    carFuel,
    setCarFuel,
  ] =
    useState(
      initialDraft.carFuel ||
        "휘발유",
    );


  const [
    transportModalOpen,
    setTransportModalOpen,
  ] =
    useState(
      false,
    );


  const [
    transportStep,
    setTransportStep,
  ] =
    useState(
      "mode",
    );


  const [
    origin,
    setOrigin,
  ] =
    useState(
      initialBookingSelection.outboundFlight?.departureAirport || "GMP",
    );


  const [
    flightOpen,
    setFlightOpen,
  ] =
    useState(
      false,
    );


  const [
    flightPickerLeg,
    setFlightPickerLeg,
  ] =
    useState(
      "outbound",
    );


  const [
    flightTransitionOpen,
    setFlightTransitionOpen,
  ] =
    useState(
      false,
    );


  const [
    flightSort,
    setFlightSort,
  ] =
    useState(
      "recommended",
    );


  const [
    flightId,
    setFlightId,
  ] =
    useState(initialBookingSelection.outboundFlight?.id || "");


  const [
    returnFlightId,
    setReturnFlightId,
  ] =
    useState(initialBookingSelection.returnFlight?.id || "");


  const [
    flightSearchResult,
    setFlightSearchResult,
  ] =
    useState({
      departureAirport:
        initialBookingSelection.outboundFlight?.departureAirport || "",

      arrivalAirport:
        initialBookingSelection.outboundFlight?.arrivalAirport || "",

      outboundFlights:
        initialBookingSelection.outboundFlight
          ? [initialBookingSelection.outboundFlight]
          : [],

      returnFlights:
        initialBookingSelection.returnFlight
          ? [initialBookingSelection.returnFlight]
          : [],
    });


  const [
    flightLoading,
    setFlightLoading,
  ] =
    useState(
      false,
    );


  const [
    flightError,
    setFlightError,
  ] =
    useState("");


  const [
    rentalOpen,
    setRentalOpen,
  ] =
    useState(
      false,
    );


  const [
    rentalId,
    setRentalId,
  ] =
    useState(initialBookingSelection.rental?.id || "");

  const [
    restoredRental,
    setRestoredRental,
  ] =
    useState(initialBookingSelection.rental || null);


  const [
    preferenceModalOpen,
    setPreferenceModalOpen,
  ] =
    useState(
      false,
    );


  const [
    stayTransitionOpen,
    setStayTransitionOpen,
  ] =
    useState(
      false,
    );


  const [
    budgetConfirmationOpen,
    setBudgetConfirmationOpen,
  ] =
    useState(
      false,
    );


  const [
    planPromptOpen,
    setPlanPromptOpen,
  ] =
    useState(
      false,
    );


  const [
    budgetStatus,
    setBudgetStatus,
  ] =
    useState(
      null,
    );


  const [
    stayOpen,
    setStayOpen,
  ] =
    useState(
      false,
    );


  /*
   * 실제 숙소 추천 API 결과
   */
  const [
    stayCatalog,
    setStayCatalog,
  ] =
    useState(
      initialBookingSelection.stay
        ? [initialBookingSelection.stay]
        : [],
    );


  const [
    stayLoading,
    setStayLoading,
  ] =
    useState(
      false,
    );


  const [
    stayError,
    setStayError,
  ] =
    useState("");


  const [
    stayArea,
    setStayArea,
  ] =
    useState(
      "전체",
    );


  const [
    stayCustomArea,
    setStayCustomArea,
  ] =
    useState("");


  const [
    priceBand,
    setPriceBand,
  ] =
    useState(
      "all",
    );


  useEffect(
    () => {
      try {
        const savedDraft =
          JSON.parse(
            window.localStorage.getItem(
              "tripDraft",
            ) ||
              "{}",
          );

        window.localStorage.setItem(
          "tripDraft",

          JSON.stringify({
            ...savedDraft,

            transport,
            localTransport,
            carType,
            carFuel,
          }),
        );
      } catch {
        // storage optional
      }
    },
    [
      transport,
      localTransport,
      carType,
      carFuel,
    ],
  );


  const [
    staySearch,
    setStaySearch,
  ] =
    useState("");


  const [
    staySort,
    setStaySort,
  ] =
    useState(
      "review",
    );


  const [
    stayId,
    setStayId,
  ] =
    useState(initialBookingSelection.stay?.id || "");


  const [
    stayChange,
    setStayChange,
  ] =
    useState(
      null,
    );


  const [
    stayChangePromptOpen,
    setStayChangePromptOpen,
  ] =
    useState(
      false,
    );


  const [
    stayChangeCompareOpen,
    setStayChangeCompareOpen,
  ] =
    useState(
      false,
    );


  const [
    showPlan,
    setShowPlan,
  ] =
    useState(
      false,
    );


  const [
    planViewOpen,
    setPlanViewOpen,
  ] =
    useState(
      false,
    );


  const [
    planning,
    setPlanning,
  ] =
    useState(
      false,
    );


  const [
    quickEditTarget,
    setQuickEditTarget,
  ] =
    useState("");


  const [
    planningStage,
    setPlanningStage,
  ] =
    useState(
      "calculating",
    );


  const [
    planningMode,
    setPlanningMode,
  ] =
    useState(
      "create",
    );


  const [
    planRevision,
    setPlanRevision,
  ] =
    useState(
      1,
    );


  const [
    activeDay,
    setActiveDay,
  ] =
    useState(
      0,
    );


  const [
    planEdits,
    setPlanEdits,
  ] =
    useState({});


  const [
    planOrders,
    setPlanOrders,
  ] =
    useState({});


  const [
    planCustomizations,
    setPlanCustomizations,
  ] =
    useState({});


  const [
    backendPlan,
    setBackendPlan,
  ] =
    useState(
      null,
    );

  // 일정 생성 버튼을 누르기 직전에 안내한 금액을 보존합니다.
  // 백엔드가 일부 가격 항목을 생략해도 생성 전후 총액이 갑자기 낮아지지 않습니다.
  const [
    announcedPlanEstimate,
    setAnnouncedPlanEstimate,
  ] = useState(0);


  const backendPlanRef =
    useRef(
      null,
    );


  const generationInFlightRef =
    useRef(
      false,
    );


  useEffect(
    () => {
      backendPlanRef.current =
        backendPlan;
    },
    [
      backendPlan,
    ],
  );


  const [
    message,
    setMessage,
  ] =
    useState("");


  useEffect(
    () => {
      if (
        !stayOpen
      ) {
        return;
      }

      const hasDestinationAnchor =
        destinationLocation
          ?.regionCode ===
          "KR-49" &&
        Number.isFinite(
          destinationLocation
            ?.latitude,
        ) &&
        Number.isFinite(
          destinationLocation
            ?.longitude,
        );

      setStayArea(
        hasDestinationAnchor
          ? `${
              destinationLocation.detail ||
              destinationLocation.name
            } 인근`
          : "전체",
      );

      setPriceBand(
        "all",
      );

      setStaySearch(
        "",
      );

      setStayCustomArea(
        "",
      );
    },
    [
      destinationLocation,
      stayOpen,
    ],
  );


  useEffect(
    () => {
      const filterBar =
        document.querySelector(
          ".stay-picker .area-filters",
        );

      if (
        !filterBar
      ) {
        return undefined;
      }

      let field =
        document.querySelector(
          ".stay-picker .custom-area-field",
        );

      if (
        !field
      ) {
        field =
          document.createElement(
            "label",
          );

        field.className =
          "custom-area-field";

        const icon =
          document.createElement(
            "span",
          );

        icon.textContent =
          "⌖";

        const input =
          document.createElement(
            "input",
          );

        input.type =
          "text";

        input.placeholder =
          "지역 이름을 입력하세요";

        input.setAttribute(
          "aria-label",
          "기타 숙소 지역 입력",
        );

        const hint =
          document.createElement(
            "small",
          );

        hint.textContent =
          "입력한 지역은 AI 일정 재설계에 반영돼요.";

        input.addEventListener(
          "input",
          (
            event,
          ) =>
            setStayCustomArea(
              event
                .currentTarget
                .value,
            ),
        );

        field.append(
          icon,
          input,
          hint,
        );

        filterBar.insertAdjacentElement(
          "afterend",
          field,
        );
      }

      const input =
        field.querySelector(
          "input",
        );

      if (
        input &&
        input.value !==
          stayCustomArea
      ) {
        input.value =
          stayCustomArea;
      }

      return undefined;
    },
    [
      stayArea,
      stayCustomArea,
      stayOpen,
    ],
  );


  const isJeju =
    destinationLocation
      ?.regionCode ===
    "KR-49";


  const hasDomesticDestination =
    destinationLocation
      ?.countryCode ===
    "KR";


  const destinationAirport =
    destinationLocation
      ?.airportCode ||
    destinationLocation
      ?.airportCodes?.[
      0
    ] ||
    (
      hasDomesticDestination
        ? "CJU"
        : "INTL"
    );


  const outboundFlights =
    flightSearchResult
      .outboundFlights ||
    [];


  const returnFlights =
    flightSearchResult
      .returnFlights ||
    [];


  const selectedOutboundFlight =
    outboundFlights.find(
      (
        flight,
      ) =>
        String(flight.id) ===
        String(flightId),
    );


  const selectedReturnFlight =
    returnFlights.find(
      (
        flight,
      ) =>
        String(flight.id) ===
        String(returnFlightId),
    );


  const selectedFlight =
    useMemo(
      () => {
        if (
          transport !==
            "FLIGHT" ||
          !selectedOutboundFlight ||
          !selectedReturnFlight
        ) {
          return null;
        }

        const outboundFare =
          Number(
            selectedOutboundFlight
              .estimatedPricePerPerson,
          ) ||
          0;

        const returnFare =
          Number(
            selectedReturnFlight
              .estimatedPricePerPerson,
          ) ||
          0;

        const fare =
          outboundFare +
          returnFare;

        return {
          id:
            `${selectedOutboundFlight.id}-` +
            `${selectedReturnFlight.id}`,

          origin:
            flightSearchResult
              .departureAirport ||
            selectedOutboundFlight
              .departureAirport ||
            origin,

          originName:
            departureLocation
              ?.detail ||
            departureLocation
              ?.name ||
            departureLocation
              ?.region ||
            "출발지",

          originCity:
            departureLocation
              ?.region ||
            departureLocation
              ?.detail ||
            "출발지",

          destination:
            flightSearchResult
              .arrivalAirport ||
            selectedOutboundFlight
              .arrivalAirport ||
            destinationAirport,

          airline:
            selectedOutboundFlight
              .airline ===
            selectedReturnFlight
              .airline
              ? selectedOutboundFlight
                  .airline
              : `${selectedOutboundFlight.airline} · ${selectedReturnFlight.airline}`,

          code:
            `${selectedOutboundFlight.flightNumber || selectedOutboundFlight.code} · ` +
            `${selectedReturnFlight.flightNumber || selectedReturnFlight.code}`,

          out:
            flightTimeLabel(
              selectedOutboundFlight,
            ),

          back:
            flightTimeLabel(
              selectedReturnFlight,
            ),

          fare,

          originalFare:
            fare,

          discount:
            0,

          seats:
            null,

          priceType:
            "ESTIMATED",

          isMock:
            false,
        };
      },
      [
        transport,
        origin,
        destinationAirport,
        departureLocation,
        flightSearchResult
          .departureAirport,
        flightSearchResult
          .arrivalAirport,
        selectedOutboundFlight,
        selectedReturnFlight,
      ],
    );


  /*
   * 렌터카는 아직 mock 유지.
   */
  const rentalCatalog =
    useMemo(
      () =>
        demoRentalsForLocation(
          destinationLocation,
        ),
      [
        destinationLocation,
      ],
    );


  useEffect(() => {
    if (!flightOpen && !rentalOpen) return;
    // Match the modal's initial recommendation order without changing catalog data.
    const firstVisible = [...rentalCatalog]
      .sort((a, b) => Number(b.score) - Number(a.score))
      .slice(0, 2);
    for (const rental of firstVisible) {
      if (!rental.image) continue;
      preload(rental.image, { as: "image", fetchPriority: "low" });
    }
    if (firstVisible.some((rental) => rental.image?.includes("commons.wikimedia.org"))) {
      preconnect("https://commons.wikimedia.org");
      preconnect("https://upload.wikimedia.org");
    }
  }, [flightOpen, rentalOpen, rentalCatalog]);

  const selectedRental =
    rentalCatalog.find(
      (
        rental,
      ) =>
        String(rental.id) ===
        String(rentalId),
    ) || restoredRental;


  /*
   * 숙소는 실제 API 결과에서 선택.
   */
  const selectedStay =
    stayCatalog.find(
      (
        stay,
      ) =>
        String(stay.id) ===
        String(stayId),
    );


  /*
   * 사용자가 확정한 예약 선택은 검색 결과 배열과 별도로 보존한다.
   * 같은 여행 조건에서 API 목록이 재조회되거나 화면이 다시 열려도
   * 선택한 항공편과 숙소가 후보 목록에서 사라지지 않는다.
   */
  useEffect(() => {
    try {
      const currentDraft = JSON.parse(window.localStorage.getItem("tripDraft") || "{}");
      const bookingSelection = {
        outboundFlight: selectedOutboundFlight || null,
        returnFlight: selectedReturnFlight || null,
        rental: selectedRental || null,
        stay: selectedStay || null,
      };

      window.localStorage.setItem(
        "tripDraft",
        JSON.stringify({
          ...(currentDraft && typeof currentDraft === "object" ? currentDraft : {}),
          bookingSelection,
        }),
      );
    } catch {
      // 저장소가 차단되어도 현재 세션의 선택 상태는 계속 유지한다.
    }
  }, [selectedOutboundFlight, selectedReturnFlight, selectedRental, selectedStay]);


  const dates =
    getDates(
      startDate,
      endDate,
    );


  const nights =
    Math.max(
      1,
      dates.length -
        1,
    );


  const party =
    travelers ||
    1;


  const rooms =
    selectedStay
      ? Math.ceil(
          party /
            3,
        )
      : 0;


  const routeDistanceKm =
    distanceBetween(
      departureLocation,
      destinationLocation,
    );


  const estimatedCarMinutes =
    Math.max(
      15,

      Math.round(
        (
          routeDistanceKm *
          1.25 /
          65
        ) *
          60,
      ),
    );


  const ticketOptions =
    useMemo(
      () =>
        makeDemoTicketOptions(
          transport,
          routeDistanceKm,
        ),
      [
        transport,
        routeDistanceKm,
      ],
    );


  const selectedOutboundTicket =
    ticketOptions.find(
      (
        ticket,
      ) =>
        ticket.id ===
        outboundTicketId,
    );


  const selectedReturnTicket =
    ticketOptions.find(
      (
        ticket,
      ) =>
        ticket.id ===
        returnTicketId,
    );


  const selectedTicket =
    useMemo(
      () =>
        transport ===
        "FLIGHT"
          ? selectedFlight
          : selectedOutboundTicket &&
              selectedReturnTicket
            ? {
                id:
                  `${selectedOutboundTicket.id}-` +
                  `${selectedReturnTicket.id}`,

                mode:
                  transport,

                name:
                  transportName(
                    transport,
                    outboundOptions,
                  ),

                out:
                  selectedOutboundTicket.out,

                back:
                  selectedReturnTicket.back,

                fare:
                  selectedOutboundTicket.fare +
                  selectedReturnTicket.fare,

                isMock:
                  true,
              }
            : null,
      [
        transport,
        selectedFlight,
        selectedOutboundTicket,
        selectedReturnTicket,
      ],
    );


  const tripSchedule =
    resolveTripSchedule({
      mode:
        transport,

      ticket:
        selectedTicket,

      startTime,
      endTime,
      startDate,
      endDate,

      manualConfirmed:
        manualTimeConfirmed,

      carMinutes:
        estimatedCarMinutes,
    });


  const scheduledStartTime =
    tripSchedule.ready
      ? tripSchedule
          .departureTime
      : "";


  const scheduledArrivalTime =
    tripSchedule.ready
      ? tripSchedule
          .arrivalTime
      : "";


  const scheduledEndTime =
    tripSchedule.ready
      ? tripSchedule
          .endTime
      : "";


  const baseDayPlans =
    useMemo(
      () =>
        backendPlan
          ?.dayPlans
          ?.length
          ? backendPlan.dayPlans
          : applyFoodPreferences(
              makeDayPlans(
                scheduledArrivalTime,
                scheduledEndTime,
                selectedStay,
                selectedTicket,
                destinationLocation,
                departureLocation,
                transport,
                dates.length,
              ),

              foodPreferences,

              destinationLocation,
            ),
      [
        scheduledArrivalTime,
        scheduledEndTime,
        selectedTicket,
        selectedStay,
        destinationLocation,
        departureLocation,
        transport,
        dates.length,
        foodPreferences,
        backendPlan,
      ],
    );


  const dayPlans =
    useMemo(
      () =>
        applyPlanCustomizations(
          applyPlanOrders(
            applyPlanEdits(
              baseDayPlans,
              planEdits,
            ),
            planOrders,
            localTransport,
          ),
          planCustomizations,
          localTransport,
        ),
      [
        baseDayPlans,
        planEdits,
        planOrders,
        planCustomizations,
        localTransport,
      ],
    );


  const placeEditAdjustment =
    Object.entries(
      planEdits,
    ).reduce(
      (
        sum,
        [
          key,
          place,
        ],
      ) => {
        const [
          dayIndex,
          stopIndex,
        ] =
          key
            .split(
              "-",
            )
            .map(
              Number,
            );

        const originalName =
          baseDayPlans[
            dayIndex
          ]?.[
            2
          ]?.[
            stopIndex
          ]?.[
            2
          ] ||
          "";

        return (
          sum +
          placeEntryCost(
            place.name,
          ) -
          placeEntryCost(
            originalName,
          )
        );
      },
      0,
    );


  const currentFlightOptions =
    flightPickerLeg ===
    "outbound"
      ? outboundFlights
      : returnFlights;


  const displayFlights =
    [
      ...currentFlightOptions,
    ].sort(
      (
        a,
        b,
      ) => {
        if (
          flightSort ===
          "price"
        ) {
          return (
            (
              Number(
                a.estimatedPricePerPerson,
              ) ||
              0
            ) -
            (
              Number(
                b.estimatedPricePerPerson,
              ) ||
              0
            )
          );
        }

        if (
          flightSort ===
          "time"
        ) {
          return String(
            a.departureTime ||
              "",
          ).localeCompare(
            String(
              b.departureTime ||
                "",
            ),
          );
        }

        const tenAm =
          10 * 60;

        return (
          Math.abs(
            flightDepartureClockMinutes(a) -
              tenAm,
          ) -
            Math.abs(
              flightDepartureClockMinutes(b) -
                tenAm,
            ) ||
          flightDurationMinutes(a) -
            flightDurationMinutes(b) ||
          (
            Number(
              a.estimatedPricePerPerson,
            ) ||
            0
          ) -
            (
              Number(
                b.estimatedPricePerPerson,
              ) ||
              0
            )
        );
      },
    );


  /*
   * 기존 App.jsx 호환.
   */
  const saleFirstFlights =
    displayFlights;


  const nearbyStayArea =
    isJeju &&
    Number.isFinite(
      destinationLocation
        ?.latitude,
    ) &&
    Number.isFinite(
      destinationLocation
        ?.longitude,
    )
      ? `${
          destinationLocation.detail ||
          destinationLocation.name
        } 인근`
      : null;


  const stayAreas =
    [
      nearbyStayArea,
      "전체",

      ...new Set(
        stayCatalog.map(
          (
            stay,
          ) =>
            stay.area,
        ),
      ),
    ].filter(
      Boolean,
    );


  /*
   * priceAvg는 일부 null 가능.
   *
   * 전체 보기에서는 null 숙소도 보여주고,
   * 가격대 필터를 걸었을 때만 제외.
   */
  const isInPriceBand =
    (
      priceAvg,
    ) => {
      if (
        priceBand ===
        "all"
      ) {
        return true;
      }

      if (
        !Number.isFinite(
          priceAvg,
        )
      ) {
        return false;
      }

      if (
        priceBand ===
        "0-5"
      ) {
        return (
          priceAvg <
          50000
        );
      }

      if (
        priceBand ===
        "5-10"
      ) {
        return (
          priceAvg >=
            50000 &&
          priceAvg <
            100000
        );
      }

      if (
        priceBand ===
        "10-20"
      ) {
        return (
          priceAvg >=
            100000 &&
          priceAvg <
            200000
        );
      }

      if (
        priceBand ===
        "20-30"
      ) {
        return (
          priceAvg >=
            200000 &&
          priceAvg <
            300000
        );
      }

      if (
        priceBand ===
        "30+"
      ) {
        return (
          priceAvg >=
          300000
        );
      }

      return true;
    };


  const filteredStays =
    stayCatalog
      .filter(
        (
          stay,
        ) =>
          isInPriceBand(
            stay.priceAvg,
          ) &&
          (
            stayArea ===
              "전체" ||
            stayArea ===
              nearbyStayArea ||
            stayArea ===
              "기타 지역" ||
            stay.area ===
              stayArea
          ) &&
          stay.name
            .toLowerCase()
            .includes(
              staySearch.toLowerCase(),
            ),
      )
      .sort(
        (
          a,
          b,
        ) => {
          /*
           * 목적지 인근 정렬.
           */
          if (
            stayArea ===
            nearbyStayArea
          ) {
            return (
              (
                a.distanceKm ??
                Number.POSITIVE_INFINITY
              ) -
              (
                b.distanceKm ??
                Number.POSITIVE_INFINITY
              )
            );
          }

          /*
           * 가격순.
           * priceAvg null은 뒤로.
           */
          if (
            staySort ===
            "price"
          ) {
            if (
              a.priceAvg ==
                null &&
              b.priceAvg ==
                null
            ) {
              return 0;
            }

            if (
              a.priceAvg ==
              null
            ) {
              return 1;
            }

            if (
              b.priceAvg ==
              null
            ) {
              return -1;
            }

            return (
              a.priceAvg -
              b.priceAvg
            );
          }

          /*
           * 기본 평점순.
           */
          return (
            Number(
              b.rating ??
                0,
            ) -
              Number(
                a.rating ??
                  0,
              ) ||
            (
              b.reviewCount ??
              0
            ) -
              (
                a.reviewCount ??
                0
              )
          );
        },
      );


  const originLabel =
    departureLocation
      ?.detail ||
    departureLocation
      ?.name ||
    departureLocation
      ?.region ||
    "출발지";


  const destinationLabel =
    destinationLocation
      ?.detail ||
    destinationLocation
      ?.name ||
    destinationLocation
      ?.region ||
    "선택한 여행지";


  const selectedTransportMode =
    transport ||
    (
      selectedFlight
        ? "FLIGHT"
        : ""
    );


  const selectedTransportLabel =
    transportName(
      selectedTransportMode,
      outboundOptions,
    );


  const selectedLocalTransportLabel =
    transportName(
      localTransport,
      localOptions,
    );


  const intercityTransportTotal =
    selectedTransportMode ===
    "FLIGHT"
      ? selectedFlight
          ?.fare ||
        0
      : selectedTicket
        ? selectedTicket.fare
        : selectedTransportMode
          ? estimateIntercityFare({
              mode:
                selectedTransportMode,

              origin:
                departureLocation,

              destination:
                destinationLocation,

              travelers:
                party,
            })
          : 0;


  const routedItineraryDistanceKm =
    (backendPlan?.routes || [])
      .flatMap((route) => route?.segments || [])
      .filter((segment) => !isAirportRouteSegment(segment))
      .reduce((sum, segment) => {
        const distance = Number(segment?.distanceKm);
        return sum + (Number.isFinite(distance) && distance > 0 ? distance : 0);
      }, 0);


  const itineraryDistanceKm =
    routedItineraryDistanceKm > 0
      ? Math.round(routedItineraryDistanceKm * 10) / 10
      : Math.max(
          45,
          Math.round(nights * 72 + Object.keys(planEdits).length * 18),
        );


  const vehicleEfficiency =
    {
      경차:
        14.5,

      세단:
        12.5,

      SUV:
        10.2,

      승합:
        8.5,
    }[
      carType
    ] ||
    12.5;


  const fuelPrice =
    {
      휘발유:
        1750,

      경유:
        1650,

      LPG:
        1100,
    }[
      carFuel
    ] ||
    1750;


  const localFuelAndParkingTotal =
    Math.round(
      (
        itineraryDistanceKm /
        vehicleEfficiency
      ) *
        fuelPrice +
        nights *
          9000,
    );


  const usesRental =
    localTransport ===
      "RENTAL" &&
    Boolean(
      selectedRental,
    );


  const rentalFeePerPerson =
    usesRental
      ? selectedRental.price /
        party
      : 0;


  const localFuelAndParkingPerPerson =
    usesRental ||
    selectedTransportMode ===
      "CAR"
      ? localFuelAndParkingTotal /
        party
      : 0;


  const localTransitTotal =
    localTransport ===
    "TRANSIT"
      ? Math.max(
          6000,

          nights *
            12000 +
            5000,
        )
      : localTransport ===
          "TAXI"
        ? Math.max(
            18000,

            nights *
              28000 +
              10000,
          )
        : 0;


  const localTravelTotal =
    rentalFeePerPerson +
    localFuelAndParkingPerPerson +
    localTransitTotal;


  const tripDurationLabel =
    `${nights}박 ${Math.max(
      1,
      nights +
        1,
    )}일`;


  const costForEvent = (name, metadata = {}) => {
    const suppliedPrice = Number(metadata.pricePerPerson);
    if (Number.isFinite(suppliedPrice) && suppliedPrice > 0) return suppliedPrice;

    const estimated = getPlaceCostEstimate(name, metadata);
    if (estimated.price > 0) return estimated.price;

    return eventPrice(name, {
      selectedFlight,
      selectedRental,
      selectedStay,
      party,
      rooms,
      nights,
    });
  };


  const itineraryCostRows =
    dayPlans.flatMap(
      (
        day,
        dayIndex,
      ) =>
        (
          day?.[
            2
          ] ||
          []
        ).flatMap(
          ([
            time,
            icon,
            name,
            ,
            ,
            ,
            metadata = {},
          ]) => {
            const backendType =
              String(
                metadata?.type ||
                "",
              ).toUpperCase();

            /*
             * 비용 상세에는 실제로 개인별 결제가 발생하는 장소만 넣는다.
             * FLIGHT / AIRPORT / ACCOMMODATION 같은 이동·예약 이벤트는
             * 아래의 항공권·숙소·렌터카 그룹에서 한 번만 계산하므로
             * 일정 장소 비용에 다시 넣으면 중복 노출된다.
             */
            const isBackendMeal =
              backendType === "RESTAURANT" ||
              backendType === "CAFE";

            const isBackendActivity =
              backendType === "ATTRACTION";

            const hasBackendType =
              Boolean(backendType);

            if (
              !name ||
              (
                hasBackendType &&
                !isBackendMeal &&
                !isBackendActivity
              ) ||
              (
                !hasBackendType &&
                /항공|공항|렌터카|숙소|호텔|체크인|체크아웃|탑승 준비|출발 준비|귀가|이동 준비|편 출발$/.test(
                  name,
                )
              )
            ) {
              return [];
            }

            const isMeal =
              isBackendMeal ||
              (
                !hasBackendType &&
                (
                  /🍽|🍚|🍜|🍲|☕|🥐/.test(
                    icon ||
                      "",
                  ) ||
                  /점심|저녁|식사|카페|간식|조식|시장/.test(
                    name,
                  )
                )
              );

            const placeEstimate = getPlaceCostEstimate(name, metadata);

            return [
              {
                type:
                  isMeal
                    ? "meal"
                    : "activity",

                row: [
                  name,

                  costForEvent(
                    name,
                    metadata,
                  ),

                  `${
                    dayIndex +
                    1
                  }일차 ${time} · ${
                    metadata.provider
                      ? `${metadata.provider} 제공가`
                      : isMeal
                        ? `${placeEstimate.source} · 1인 예상`
                        : "1인 입장·체험 기준"
                  }`,
                ],
              },
            ];
          },
        ),
    );


  const mealRows =
    itineraryCostRows
      .filter(
        (
          item,
        ) =>
          item.type ===
          "meal",
      )
      .map(
        (
          item,
        ) =>
          item.row,
      );


  const activityRows =
    itineraryCostRows
      .filter(
        (
          item,
        ) =>
          item.type ===
          "activity",
      )
      .map(
        (
          item,
        ) =>
          item.row,
      );


  const foodTotal =
    mealRows.reduce(
      (
        sum,
        [
          ,
          value,
        ],
      ) =>
        sum +
        value,

      0,
    );


  const activityTotal =
    Math.max(
      0,

      activityRows.reduce(
        (
          sum,
          [
            ,
            value,
          ],
        ) =>
          sum +
          value,

        0,
      ) +
        placeEditAdjustment,
    );


  /*
   * 숙소 비용 계산은 priceAvg 기준.
   * null이면 계산에서는 0 처리.
   * 숙소 자체는 목록에서 제거하지 않음.
   */
  const stayTotal =
    selectedStay
      ?.priceAvg !=
    null
      ? (
          selectedStay.priceAvg *
          nights *
          rooms
        ) /
        party
      : 0;


  const driveTotal =
    localTravelTotal;


  const items =
    useMemo(
      () => [
        {
          name:
            selectedTransportMode ===
            "FLIGHT"
              ? "항공"
              : selectedTransportMode
                ? `${selectedTransportLabel} 이동`
                : "출발 이동",

          total:
            intercityTransportTotal,

          color:
            "flight",
        },

        {
          name:
            "숙소",

          total:
            stayTotal,

          color:
            "stay",
        },

        {
          name:
            usesRental
              ? "렌터카·현지 이동"
              : localTransport
                ? `${selectedLocalTransportLabel} 현지 이동`
                : "현지 이동",

          total:
            driveTotal,

          color:
            "drive",
        },

        {
          name:
            "식비",

          total:
            foodTotal,

          color:
            "food",
        },

        {
          name:
            "관광·체험",

          total:
            activityTotal,

          color:
            "play",
        },
      ],
      [
        activityTotal,
        driveTotal,
        foodTotal,
        intercityTransportTotal,
        localTransport,
        selectedLocalTransportLabel,
        selectedTransportLabel,
        selectedTransportMode,
        stayTotal,
        usesRental,
      ],
    );


  const mockCostDetails =
    useMemo(
      () => [
        {
          group:
            "개인 교통비 · 1인 기준",

          rows: [
            [
              selectedTransportMode ===
              "FLIGHT"
                ? "왕복 항공권"
                : `${selectedTransportLabel} 이동`,

              intercityTransportTotal,

              selectedTransportMode ===
              "FLIGHT"
                ? selectedFlight
                  ? `${originLabel} ↔ ${destinationLabel} · 왕복 1인`
                  : "가는 편과 오는 편을 모두 선택하면 반영됩니다."
                : selectedTransportMode ===
                    "CAR"
                  ? `${originLabel} ↔ ${destinationLabel} · 왕복 약 ${routeDistanceKm * 2}km · 유류비·통행료 ${party}명 분할`
                  : selectedTransportMode
                    ? `${originLabel} → ${destinationLabel} · 왕복 1인 예상`
                    : "출발 이동수단 미선택",
            ],

            ...(
              localTransport &&
              !usesRental &&
              localTravelTotal
                ? [
                    [
                      `${destinationLabel} ${selectedLocalTransportLabel}`,

                      localTravelTotal,

                      `${tripDurationLabel} 현지 이동 1인 예상`,
                    ],
                  ]
                : []
            ),
          ],
        },

        {
          group:
            "식사·관광비 · 1인 기준",

          rows: [
            ...mealRows,
            ...activityRows,
          ],
        },

        {
          group:
            `공동 예약·차량비 · ${party}명 N/1`,

          rows: [
            ...(
              usesRental
                ? [
                    [
                      `${selectedRental.company} 렌터카 · ${tripDurationLabel}`,

                      rentalFeePerPerson,

                      `${selectedRental.car} · 총 대여료를 ${party}명 분할`,
                    ],

                    [
                      "현지 주유·주차",

                      localFuelAndParkingPerPerson,

                      `${destinationLabel} 일정 약 ${itineraryDistanceKm}km · 차량 공용 비용을 ${party}명 분할`,
                    ],
                  ]
                : selectedTransportMode ===
                    "CAR"
                  ? [
                      [
                        "현지 주유·주차",

                        localFuelAndParkingPerPerson,

                        `${destinationLabel} 일정 약 ${itineraryDistanceKm}km · 차량 공용 비용을 ${party}명 분할`,
                      ],
                    ]
                  : []
            ),

            [
              selectedStay
                ? `${selectedStay.name} · ${nights}박`
                : "선택 숙소",

              stayTotal,

              selectedStay
                ? selectedStay.priceAvg !=
                  null
                  ? `평균 1박 ${money(
                      selectedStay.priceAvg,
                    )}원 · 객실 ${rooms}개 총액을 ${party}명 분할`
                  : `${
                      selectedStay.priceText ||
                      "가격 정보 확인"
                    } · 객실 ${rooms}개 · ${party}명 분할`
                : "숙소 미선택",
            ],
          ],
        },

        ...(
          Object.entries(
            planEdits,
          ).length
            ? [
                {
                  group:
                    "장소 변경 차액 · 1인 기준",

                  rows:
                    Object.entries(
                      planEdits,
                    ).map(
                      ([
                        key,
                        place,
                      ]) => {
                        const [
                          dayIndex,
                          stopIndex,
                        ] =
                          key
                            .split(
                              "-",
                            )
                            .map(
                              Number,
                            );

                        const originalName =
                          baseDayPlans[
                            dayIndex
                          ]?.[
                            2
                          ]?.[
                            stopIndex
                          ]?.[
                            2
                          ] ||
                          "기존 장소";

                        return [
                          place.name,

                          placeEntryCost(
                            place.name,
                          ) -
                            placeEntryCost(
                              originalName,
                            ),

                          `${originalName} 대신 선택한 입장·체험비 차이`,
                        ];
                      },
                    ),
                },
              ]
            : []
        ),
      ].filter(
        (group) =>
          Array.isArray(group.rows) &&
          group.rows.length > 0,
      ),
      [
        activityRows,
        baseDayPlans,
        destinationLabel,
        intercityTransportTotal,
        itineraryDistanceKm,
        localFuelAndParkingPerPerson,
        localTransport,
        localTravelTotal,
        mealRows,
        nights,
        originLabel,
        party,
        planEdits,
        rentalFeePerPerson,
        rooms,
        routeDistanceKm,
        selectedFlight,
        selectedLocalTransportLabel,
        selectedRental,
        selectedStay,
        selectedTransportLabel,
        selectedTransportMode,
        stayTotal,
        tripDurationLabel,
        usesRental,
      ],
    );


  const backendCostItems =
    Array.isArray(
      backendPlan
        ?.costEstimate
        ?.items,
    )
      ? backendPlan
          .costEstimate
          .items
      : [];


  const isSharedBackendCostItem = (item, itemLabel) =>
    String(item.scope || "").toLowerCase() === "shared" ||
    /숙박|숙소|호텔|렌터카|주유|주차/.test(itemLabel);


  const resolveBackendCostItem = (item, { isShared = false } = {}) => {
    const itemLabel = String(
      item.placeName || item.vendorName || item.name || item.label || item.category || "여행 비용",
    );
    const normalizedLabel = itemLabel.replace(/\s+/g, "");
    const itineraryMatch = itineraryCostRows.find(({ row }) => {
      const rowLabel = String(row?.[0] || "");
      const normalizedRowLabel = rowLabel.replace(/\s+/g, "");
      return normalizedRowLabel === normalizedLabel ||
        normalizedRowLabel.includes(normalizedLabel) ||
        normalizedLabel.includes(normalizedRowLabel);
    });
    const perPersonValue = Number(item.perPerson);
    const totalValue = Number(item.total);
    const rawValue = Number.isFinite(perPersonValue) && perPersonValue > 0
      ? perPersonValue
      : Number.isFinite(totalValue) && totalValue > 0
        ? isShared ? totalValue / party : totalValue
        : 0;
    const matchedValue = Number(itineraryMatch?.row?.[1] || 0);
    const itemType = String(item.type || item.itemType || item.category || "").toUpperCase();
    const likelyMeal = itineraryMatch?.type === "meal" ||
      /RESTAURANT|CAFE|FOOD|MEAL/.test(itemType) ||
      /식비|식사|카페|커피|메뉴/.test(itemLabel);
    const fallback = getPlaceCostEstimate(itemLabel, {
      type: likelyMeal
        ? /CAFE/.test(itemType) ? "CAFE" : "RESTAURANT"
        : itemType,
    });
    const value = rawValue > 0 ? rawValue : matchedValue > 0 ? matchedValue : fallback.price;

    return {
      itemLabel,
      itineraryMatch,
      likelyMeal,
      rawValue,
      value,
      note: rawValue > 0
        ? item.note || (item.approximate ? "백엔드 예상 견적" : "백엔드 확정 견적")
        : itineraryMatch?.row?.[2] || `${fallback.source} · 1인 예상`,
    };
  };


  const costDetails =
    backendCostItems.length
      ? Object.values(
          backendCostItems.reduce(
            (
              groups,
              item,
            ) => {
              const itemLabel = String(
                item.placeName || item.vendorName || item.name || item.label || item.category || "여행 비용",
              );
              const isShared = isSharedBackendCostItem(item, itemLabel);
              const resolvedItem = resolveBackendCostItem(item, { isShared });

              const isMealOrActivity =
                resolvedItem.itineraryMatch?.type === "activity" ||
                resolvedItem.likelyMeal ||
                /식비|식사|카페|커피|메뉴|관광|체험|입장/.test(itemLabel);

              const key =
                isShared
                  ? `공동 예약·차량비 · ${party}명 N/1`
                  : isMealOrActivity
                    ? "식사·관광비 · 1인 기준"
                    : "개인 교통비 · 1인 기준";

              groups[
                key
              ] ||=
                {
                  group:
                    key,

                  rows:
                    [],
                };

              groups[
                key
              ].rows.push([
                item.placeName ||
                  item.vendorName ||
                  item.name ||
                  item.label ||
                  item.category ||
                  "여행 비용",

                resolvedItem.value,

                resolvedItem.note,
              ]);

              return groups;
            },
            {},
          ),
        )
      : mockCostDetails;


  const mockTotal =
    items.reduce(
      (
        sum,
        item,
      ) =>
        sum +
        item.total,

      0,
    );


  const backendPerPerson =
    Number(
      backendPlan
        ?.costEstimate
        ?.perPerson,
    );


  const backendGrandTotal =
    Number(
      backendPlan
        ?.costEstimate
        ?.total,
    );


  const backendMissingCostAdjustment = backendCostItems.reduce((sum, item) => {
    const itemLabel = String(
      item.placeName || item.vendorName || item.name || item.label || item.category || "여행 비용",
    );
    const resolved = resolveBackendCostItem(item, {
      isShared: isSharedBackendCostItem(item, itemLabel),
    });
    return sum + (resolved.rawValue <= 0 && resolved.value > 0 ? resolved.value : 0);
  }, 0);


  const calculatedTotal =
    Number.isFinite(
      backendPerPerson,
    ) &&
    backendPerPerson >=
      0
      ? backendPerPerson + backendMissingCostAdjustment
      : Number.isFinite(
            backendGrandTotal,
          ) &&
          backendGrandTotal >=
            0
        ? backendGrandTotal /
          party + backendMissingCostAdjustment
        : mockTotal;


  const detailedTotal = sumCostGroups(costDetails);


  const total = stablePlanEstimate({
    calculatedTotal,
    announcedTotal: backendPlan ? announcedPlanEstimate : 0,
    detailedTotal,
  });


  const reconciledCostDetails = addPriceVariationBuffer(costDetails, total);


  const confirmedTotal =
    selectedStay
      ? total
      : budgetStatus
          ?.total ||
        total;


  const confirmedInBudget =
    budget >=
    confirmedTotal;


  const gap =
    Math.abs(
      budget -
        total,
    );


  const inBudget =
    budget >=
    total;


  // Backend가 보존하지 않는 시연용 숙소/렌터카 가격을 tripId별로 저장한다.
  // 내 예약에서 다시 열 때 동일 스냅샷을 복원해 총액 0원 문제를 방지한다.
  useEffect(() => {
    const tripId = backendPlan?.tripId || backendPlan?.id;
    if (!tripId || !Number.isFinite(Number(total)) || Number(total) <= 0) return;

    const costItems = reconciledCostDetails.flatMap((group) =>
      (group.rows || []).map(([name, value, note]) => ({
        name,
        perPerson: Number(value) || 0,
        note: note || "",
        scope: /공동 예약·차량비/.test(group.group || "") ? "shared" : "personal",
      })),
    );

    saveTripCostSnapshot(tripId, {
      savedAt: new Date().toISOString(),
      totalPerPerson: Number(total) || 0,
      peopleCount: party,
      costEstimate: {
        perPerson: Number(total) || 0,
        total: (Number(total) || 0) * party,
        items: costItems,
      },
      stay: selectedStay ? {
        id: selectedStay.id,
        priceAvg: selectedStay.priceAvg,
        priceText: selectedStay.priceText,
      } : null,
      rental: selectedRental ? {
        id: selectedRental.id,
        price: selectedRental.price,
        company: selectedRental.company,
        car: selectedRental.car,
      } : null,
    });
  }, [backendPlan?.tripId, backendPlan?.id, total, party, reconciledCostDetails, selectedStay, selectedRental]);


  const notify =
    (
      text,
    ) => {
      setMessage(
        text,
      );

      setTimeout(
        () =>
          setMessage(
            "",
          ),

        2600,
      );
    };


  /*
   * 실제 숙소 추천 API
   *
   * POST /api/accommodations/recommend
   */
  const loadStayOptions =
    async () => {
      const mergeSelectedStay = (nextCatalog, previousCatalog = []) => {
        const lockedStay = previousCatalog.find(
          (stay) => String(stay.id) === String(stayId),
        );
        if (!lockedStay) return nextCatalog;
        return nextCatalog.some((stay) => String(stay.id) === String(lockedStay.id))
          ? nextCatalog
          : [lockedStay, ...nextCatalog];
      };

      const latitude =
        Number(
          destinationLocation
            ?.latitude,
        );

      const longitude =
        Number(
          destinationLocation
            ?.longitude,
        );

      const destinationName =
        destinationLocation
          ?.detail ||
        destinationLocation
          ?.name ||
        destinationLocation
          ?.region ||
        "";

      if (
        !destinationName ||
        !Number.isFinite(
          latitude,
        ) ||
        !Number.isFinite(
          longitude,
        )
      ) {
        setStayCatalog((previous) => mergeSelectedStay([], previous));

        setStayError(
          "숙소 추천을 위해 도착지 좌표가 필요합니다.",
        );

        return false;
      }

      setStayLoading(
        true,
      );

      setStayError(
        "",
      );

      try {
        const result =
          await recommendAccommodations({
            destinationName,
            latitude,
            longitude,

            limit:
              20,
          });

        const accommodations =
          Array.isArray(
            result
              ?.accommodations,
          )
            ? result.accommodations
            : [];

        /*
         * 백엔드 응답
         * ↓
         * 기존 프론트 숙소 객체로 normalize
         */
        const normalized =
          accommodations.map(
            (
              stay,
            ) => ({
              id:
                stay.accommodationId,

              providerId:
                stay.providerId,

              name:
                stay.name,

              area:
                stay.town ||
                stay.city ||
                stay.province ||
                "숙소",

              address:
                stay.address,

              latitude:
                stay.latitude,

              longitude:
                stay.longitude,

              distanceKm:
                stay.distanceKm,

              estimatedDriveMinutes:
                stay.estimatedDriveMinutes,

              rating:
                stay.rating,

              ratingScale:
                stay.ratingScale,

              reviewCount:
                stay.reviewCount ??
                0,

              bayesianRating:
                stay.bayesianRating,

              recommendationScore:
                stay.recommendationScore,

              starCount:
                stay.starCount,

              /*
               * 숫자 평균가.
               * null 가능.
               */
              priceAvg:
                stay.priceAvg ==
                null
                  ? null
                  : Number(
                      stay.priceAvg,
                    ),

              /*
               * 화면 표시용.
               * 백엔드에서 거의 전부 존재.
               */
              priceText:
                stay.priceText ||
                "가격 정보 확인",

              image:
                stay.representativeImageUrl ||
                jejuCoastPhoto,

              providerUrl:
                stay.providerUrl,

              checkInTime:
                stay.checkInTime,

              checkOutTime:
                stay.checkOutTime,

              description:
                stay.description,

              phoneNumber:
                stay.phoneNumber,

              isMock:
                false,

              insight:
                `${destinationName}에서 약 ${
                  stay.distanceKm ??
                  "-"
                }km · 차량 약 ${
                  stay.estimatedDriveMinutes ??
                  "-"
                }분`,
            }),
          );

        setStayCatalog((previous) => mergeSelectedStay(normalized, previous));

        if (
          import.meta.env
            .DEV
        ) {
          console.log(
            "[ACCOMMODATION] request:",

            {
              destinationName,
              latitude,
              longitude,
              limit:
                20,
            },
          );

          console.log(
            "[ACCOMMODATION] response:",

            result,
          );
        }

        if (
          normalized.length ===
          0
        ) {
          setStayError(
            "추천 가능한 숙소를 찾지 못했습니다.",
          );

          return false;
        }

        return true;
      } catch (
        error
      ) {
        console.error(
          "[ACCOMMODATION] API 호출 실패:",

          error,
        );

        const nextMessage =
          error?.message ||
          "숙소 정보를 불러오지 못했습니다.";

        setStayCatalog((previous) => mergeSelectedStay([], previous));

        setStayError(
          nextMessage,
        );

        notify(
          nextMessage,
        );

        return false;
      } finally {
        setStayLoading(
          false,
        );
      }
    };


  /*
   * 숙소 모달이 열리면 실제 API 조회.
   */
  useEffect(
    () => {
      if (
        !stayOpen
      ) {
        return;
      }

      void loadStayOptions();
    },
    [
      stayOpen,

      destinationLocation
        ?.id,

      destinationLocation
        ?.latitude,

      destinationLocation
        ?.longitude,
    ],
  );


  /*
   * 실제 항공 API 조회
   */
  const loadFlightOptions =
    async (
      leg = "outbound",
      requestedAirportCode = origin,
    ) => {
      const isReturn =
        leg === "return";

      const direction =
        isReturn
          ? "RETURN"
          : "OUTBOUND";

      const requestedAirport =
        flightOriginAirports.find(
          (airport) =>
            airport.code ===
            requestedAirportCode,
        );

      const departure =
        requestedAirport
          ? `${requestedAirport.city} ${requestedAirport.name}`
          : flightLocationName(
              departureLocation,
            );

      const arrival =
        flightLocationName(
          destinationLocation,
        );

      if (
        !departure
      ) {
        notify(
          "항공편 조회를 위해 출발지를 선택해 주세요.",
        );

        return false;
      }

      if (
        !arrival
      ) {
        notify(
          "항공편 조회를 위해 도착지를 선택해 주세요.",
        );

        return false;
      }

      if (
        !startDate ||
        !endDate
      ) {
        notify(
          "항공편 조회를 위해 여행 날짜를 선택해 주세요.",
        );

        return false;
      }

      if (
        !travelers
      ) {
        notify(
          "항공편 조회를 위해 인원수를 입력해 주세요.",
        );

        return false;
      }

      setFlightLoading(
        true,
      );

      setFlightError(
        "",
      );

      try {
        const result =
          await searchFlights({
            departure,

            destination:
              arrival,

            direction,

            startDate,

            startTime:
              "00:00",

            endDate,

            endTime:
              "23:59",

            peopleCount:
              travelers,
          });

        const fetchedOutboundFlights =
          Array.isArray(
            result
              ?.outboundFlights,
          )
            ? result.outboundFlights.map(
                normalizeFlightCandidate,
              )
            : [];

        const fetchedReturnFlights =
          Array.isArray(
            result
              ?.returnFlights,
          )
            ? result.returnFlights.map(
                normalizeFlightCandidate,
              )
            : [];

        setFlightSearchResult(
          (
            previous,
          ) => {
            const lockedOutbound = previous?.outboundFlights?.find(
              (flight) => String(flight.id) === String(flightId),
            );
            const lockedReturn = previous?.returnFlights?.find(
              (flight) => String(flight.id) === String(returnFlightId),
            );
            const nextOutbound = isReturn
              ? previous?.outboundFlights || []
              : lockedOutbound && !fetchedOutboundFlights.some((flight) => String(flight.id) === String(lockedOutbound.id))
                ? [lockedOutbound, ...fetchedOutboundFlights]
                : fetchedOutboundFlights;
            const nextReturn = isReturn
              ? lockedReturn && !fetchedReturnFlights.some((flight) => String(flight.id) === String(lockedReturn.id))
                ? [lockedReturn, ...fetchedReturnFlights]
                : fetchedReturnFlights
              : previous?.returnFlights || [];

            return {
              departureAirport: result?.departureAirport || previous?.departureAirport || "",
              arrivalAirport: result?.arrivalAirport || previous?.arrivalAirport || "",
              outboundFlights: nextOutbound,
              returnFlights: nextReturn,
            };
          },
        );

        if (
          !isReturn
        ) {
          setOrigin(
            result
              ?.departureAirport ||
              origin,
          );

        }

        if (
          import.meta.env
            .DEV
        ) {
          console.log(
            `[FLIGHT] ${direction} request:`,

            {
              departure,

              destination:
                arrival,

              direction,

              startDate,

              startTime:
                "00:00",

              endDate,

              endTime:
                "23:59",

              peopleCount:
                travelers,
            },
          );

          console.log(
            `[FLIGHT] ${direction} response:`,

            result,
          );
        }

        if (
          !isReturn &&
          !fetchedOutboundFlights.length
        ) {
          setFlightError(
            "조회 가능한 가는 항공편이 없습니다.",
          );

          return false;
        }

        if (
          isReturn &&
          !fetchedReturnFlights.length
        ) {
          setFlightError(
            "조회 가능한 오는 항공편이 없습니다.",
          );

          return false;
        }

        // Start the return lookup only after outbound has finished, respecting
        // the supplier's existing request throttling. The picker shares it.
        if (!isReturn) {
          const resolvedAirport = flightOriginAirports.find(
            (airport) => airport.code === result?.departureAirport,
          );
          void searchFlights({
            departure: resolvedAirport
              ? `${resolvedAirport.city} ${resolvedAirport.name}`
              : departure,
            destination: arrival,
            direction: "RETURN",
            startDate,
            startTime: "00:00",
            endDate,
            endTime: "23:59",
            peopleCount: travelers,
          }).catch(() => {
            // Optional warm-up must not interrupt outbound selection.
            // Failed requests aren't cached; opening return retries normally.
          });
        }

        return true;
      } catch (
        error
      ) {
        console.error(
          `[FLIGHT] ${direction} API 호출 실패:`,

          error,
        );

        const nextMessage =
          error?.message ||
          "항공편을 불러오지 못했습니다.";

        setFlightSearchResult(
          (
            previous,
          ) => ({
            departureAirport:
              previous
                ?.departureAirport ||
              "",

            arrivalAirport:
              previous
                ?.arrivalAirport ||
              "",

            outboundFlights:
              previous
                ?.outboundFlights ||
              [],

            returnFlights:
              previous
                ?.returnFlights ||
              [],
          }),
        );

        setFlightError(
          nextMessage,
        );

        notify(
          nextMessage,
        );

        return false;
      } finally {
        setFlightLoading(
          false,
        );
      }
    };

  const submitPrompt =
    () => {
      if (
        !prompt.trim()
      ) {
        return notify(
          "원하는 여행을 한 문장으로 적어주세요.",
        );
      }

      notify(
        "AI가 입력한 여행 취향을 일정 추천에 반영할게요.",
      );
    };


  const resetRouteBookings =
    () => {
      try {
        const currentDraft = JSON.parse(window.localStorage.getItem("tripDraft") || "{}");
        window.localStorage.setItem(
          "tripDraft",
          JSON.stringify({
            ...(currentDraft && typeof currentDraft === "object" ? currentDraft : {}),
            bookingSelection: {
              outboundFlight: null,
              returnFlight: null,
              rental: null,
              stay: null,
            },
          }),
        );
      } catch {
        // storage optional
      }

      setFlightId(
        "",
      );

      setReturnFlightId(
        "",
      );

      setFlightSearchResult({
        departureAirport:
          "",

        arrivalAirport:
          "",

        outboundFlights:
          [],

        returnFlights:
          [],
      });

      setFlightError(
        "",
      );

      setOutboundTicketId(
        "",
      );

      setReturnTicketId(
        "",
      );

      setManualTimeConfirmed(
        false,
      );

      setRentalId(
        "",
      );

      setRestoredRental(
        null,
      );

      setStayId(
        "",
      );

      setStayCatalog(
        [],
      );

      setStayError(
        "",
      );

      setTransport(
        "",
      );

      setLocalTransport(
        "",
      );

      setPlanEdits(
        {},
      );

      setPlanOrders(
        {},
      );

      setPlanCustomizations({});

      setBackendPlan(
        null,
      );
    };


  const chooseDepartureDistrict =
    (
      region,
      district,
    ) => {
      const nextDepartureLocation = {
        ...district,

        region:
          region.name ||
          region.region,

        name:
          district.name ||
          district.detail,

        detail:
          district.detail ||
          district.name,

        airportCode:
          district.airportCode ||
          district
            .airportCodes?.[
            0
          ] ||
          region.airportCode ||
          "GMP",
      };
      const departureChanged =
        String(departureLocation?.id || "") !== String(nextDepartureLocation.id || "") ||
        String(departureLocation?.detail || departureLocation?.name || "") !==
          String(nextDepartureLocation.detail || nextDepartureLocation.name || "");

      setDepartureLocation(nextDepartureLocation);

      setDepartureRegionId(
        region.id,
      );

      setDepartureMenuOpen(
        false,
      );

      setOrigin(
        district.airportCode ||
          district
            .airportCodes?.[
            0
          ] ||
          region.airportCode ||
          "GMP",
      );

      if (departureChanged) resetRouteBookings();

      setTransportPromptReady(
        false,
      );

      notify(
        `${region.name || region.region} ${
          district.detail ||
          district.name
        } 출발을 저장했어요. 날짜와 이동수단을 이어서 선택해 주세요.`,
      );
    };


  const useCurrentDepartureLocation =
    () => {
      const geolocation =
        window.navigator
          ?.geolocation;

      if (
        !geolocation
      ) {
        notify(
          "이 브라우저에서는 현재 위치를 사용할 수 없어요. 권역 또는 주소로 선택해 주세요.",
        );

        return;
      }

      notify(
        "현재 위치를 확인하고 있어요.",
      );

      geolocation.getCurrentPosition(
        ({
          coords,
        }) => {
          const closest =
            koreanRegions
              .flatMap(
                (
                  region,
                ) =>
                  region.districts.map(
                    (
                      district,
                    ) => ({
                      region,
                      district,
                    }),
                  ),
              )
              .reduce(
                (
                  best,
                  candidate,
                ) => {
                  const latitudeGap =
                    candidate
                      .district
                      .latitude -
                    coords.latitude;

                  const longitudeGap =
                    (
                      candidate
                        .district
                        .longitude -
                      coords.longitude
                    ) *
                    0.8;

                  const distance =
                    latitudeGap **
                      2 +
                    longitudeGap **
                      2;

                  return !best ||
                    distance <
                      best.distance
                    ? {
                        ...candidate,
                        distance,
                      }
                    : best;
                },
                null,
              );

          const region =
            closest
              ?.region;

          const district =
            closest
              ?.district;

          const airportCode =
            district
              ?.airportCode ||
            district
              ?.airportCodes?.[
              0
            ] ||
            region
              ?.airportCode ||
            "GMP";

          setDepartureLocation({
            ...(
              district ||
              {}
            ),

            id:
              `gps-${Date.now()}`,

            countryCode:
              "KR",

            region:
              region?.name ||
              "현재 위치",

            name:
              "현재 위치",

            detail:
              "현재 위치",

            latitude:
              coords.latitude,

            longitude:
              coords.longitude,

            airportCode,

            airportCodes:
              district
                ?.airportCodes ||
              region
                ?.airportCodes ||
              [
                airportCode,
              ],

            apiSearchKeyword:
              district
                ?.apiSearchKeyword ||
              "현재 위치",

            needsGeocoding:
              false,

            needsReverseGeocoding:
              true,

            locationSource:
              "gps",
          });

          setDepartureRegionId(
            region?.id ||
              "",
          );

          setDepartureMenuOpen(
            false,
          );

          setOrigin(
            airportCode,
          );

          resetRouteBookings();

          setTransportPromptReady(
            false,
          );

          notify(
            "현재 GPS 좌표를 출발지로 저장했어요.",
          );
        },

        () =>
          notify(
            "현재 위치 권한을 허용한 뒤 다시 시도해 주세요.",
          ),

        {
          enableHighAccuracy:
            true,

          timeout:
            10000,

          maximumAge:
            120000,
        },
      );
    };


  const chooseCustomDeparture =
    () => {
      const detail =
        customDeparture.trim();

      if (
        !detail
      ) {
        return notify(
          "출발할 지역을 입력해 주세요.",
        );
      }

      setDepartureLocation({
        id:
          `custom-departure-${detail}`,

        region:
          detail,

        detail,

        countryCode:
          "KR",

        regionCode:
          null,

        latitude:
          null,

        longitude:
          null,

        airportCode:
          "GMP",

        airportCodes: [
          "GMP",
          "ICN",
        ],

        needsGeocoding:
          true,
      });

      setDepartureRegionId(
        "",
      );

      setCustomDeparture(
        "",
      );

      setDepartureMenuOpen(
        false,
      );

      setOrigin(
        "GMP",
      );

      resetRouteBookings();

      setTransportPromptReady(
        false,
      );

      notify(
        `${detail} 출발 정보를 저장했어요.`,
      );
    };


  const chooseDestination =
    (
      placeInput,
    ) => {
      const selection =
        typeof placeInput ===
        "string"
          ? {
              title:
                placeInput,
            }
          : placeInput ||
            {};

      const place =
        selection.lookupName ||
        selection.title ||
        selection.name ||
        selection.detail;

      if (
        !place
      ) {
        return notify(
          "도착지를 선택해 주세요.",
        );
      }

      const catalogLocation =
        destinationCoordinatesByName[
          place
        ] ||
        destinationCoordinatesByName[
          selection.title
        ];

      const suppliedLocation =
        selection.location ||
        selection;

      const hasStructuredLocation =
        Boolean(
          suppliedLocation.regionCode ||
            (
              Number.isFinite(
                suppliedLocation.latitude,
              ) &&
              Number.isFinite(
                suppliedLocation.longitude,
              )
            ),
        );

      const locationBase =
        hasStructuredLocation
          ? suppliedLocation
          : catalogLocation;

      const displayName =
        selection.title ||
        selection.name ||
        locationBase
          ?.detail ||
        place;

      const nextLocation =
        locationBase
          ? {
              ...locationBase,

              id:
                locationBase.id ||
                `custom-destination-${displayName}`,

              countryCode:
                locationBase.countryCode ||
                selection.countryCode ||
                "KR",

              region:
                locationBase.region ||
                selection.region ||
                displayName,

              name:
                locationBase.name ||
                selection.name ||
                displayName,

              detail:
                locationBase.detail ||
                selection.detail ||
                displayName,

              image:
                selection.image ||
                locationBase.image,

              apiSearchKeyword:
                locationBase.apiSearchKeyword ||
                selection.apiSearchKeyword ||
                displayName,

              needsGeocoding:
                Boolean(
                  locationBase.needsGeocoding,
                ),
            }
          : {
              id:
                `custom-destination-${displayName}`,

              countryCode:
                selection.countryCode ||
                (
                  selection.scope ===
                    "overseas" ||
                  destinationType ===
                    "해외"
                    ? "INTL"
                    : "KR"
                ),

              regionCode:
                null,

              region:
                displayName,

              name:
                displayName,

              detail:
                displayName,

              latitude:
                null,

              longitude:
                null,

              airportCodes:
                [],

              apiSearchKeyword:
                displayName,

              needsGeocoding:
                true,
            };

      const destinationChanged =
        String(destinationLocation?.id || "") !== String(nextLocation.id || "") ||
        String(destinationLocation?.detail || destinationLocation?.name || "") !==
          String(nextLocation.detail || nextLocation.name || "");

      const matchedRegion =
        koreanRegions.find(
          (
            region,
          ) =>
            region.regionCode ===
            nextLocation.regionCode,
        );

      setDestination(
        displayName,
      );

      setDestinationLocation(
        nextLocation,
      );

      setDestinationType(
        nextLocation.countryCode ===
          "KR"
          ? "국내"
          : "해외",
      );

      setDestinationRegionId(
        matchedRegion?.id ||
          "",
      );

      setMenuOpen(
        false,
      );

      setJejuBaseArea(
        nextLocation.regionCode ===
          "KR-49"
          ? nextLocation.detail
          : "",
      );

      setStayArea(
        nextLocation.regionCode ===
          "KR-49"
          ? nextLocation.detail
          : "전체",
      );

      if (destinationChanged) resetRouteBookings();

      setTransportPromptReady(
        Boolean(
          endDate &&
            travelers &&
            departureLocation,
        ),
      );

      if (
        !travelers
      ) {
        setTravelerPromptOpen(
          true,
        );
      }

      notify(
        `${nextLocation.region} ${nextLocation.detail} 도착지를 저장했어요.`,
      );
    };


  const chooseJejuBaseArea =
    (
      area,
      linkedStayArea = area,
    ) => {
      const option =
        jejuRegionOptions.find(
          (
            item,
          ) =>
            item.area ===
            area,
        );

      setJejuBaseArea(
        area,
      );

      setDestinationLocation({
        ...(
          jejuRegionCoordinates[
            area
          ] || {
            id:
              `jeju-custom-${area}`,

            region:
              "제주특별자치도",

            detail:
              area,

            latitude:
              null,

            longitude:
              null,

            needsGeocoding:
              true,
          }
        ),

        image:
          option?.image ||
          jejuCoastPhoto,
      });

      setStayArea(
        linkedStayArea,
      );

      setStaySearch(
        "",
      );

      setJejuAreaModalOpen(
        false,
      );

      setJejuRegionGuideOpen(
        false,
      );

      setTransportPromptReady(
        Boolean(
          endDate &&
            travelers &&
            departureLocation,
        ),
      );

      if (
        !travelers
      ) {
        setTravelerPromptOpen(
          true,
        );
      }

      notify(
        `${area} 여행을 기준으로 숙소와 동선을 추천할게요.`,
      );
    };


  const chooseJejuCustomArea =
    () => {
      const area =
        jejuCustomArea.trim();

      if (
        !area
      ) {
        return notify(
          "방문하고 싶은 제주 세부지역을 입력해 주세요.",
        );
      }

      chooseJejuBaseArea(
        area,
        "기타 지역",
      );

      setJejuCustomArea(
        "",
      );
    };


  const chooseCustomDestination =
    () => {
      const place =
        customDestination.trim();

      if (
        !place
      ) {
        return;
      }

      chooseDestination(
        place,
      );

      setCustomDestination(
        "",
      );
    };


  const askAiForDestination =
    () => {
      setPrompt(
        (
          current,
        ) =>
          current.trim() ||
          "여행 취향에 맞는 여행지를 추천해 주세요.",
      );

      setMenuOpen(
        false,
      );

      setDestinationRegionId(
        "",
      );

      window.setTimeout(
        () =>
          document
            .getElementById(
              "prompt",
            )
            ?.focus(),

        0,
      );

      notify(
        "메인 자유 입력창에 AI 추천 요청을 넣었어요.",
      );
    };


  const commitTravelers =
    () => {
      if (
        !travelerInput.trim()
      ) {
        setTravelers(
          null,
        );

        return;
      }

      const next =
        Math.min(
          20,

          Math.max(
            1,

            Math.floor(
              Number(
                travelerInput,
              ),
            ) ||
              1,
          ),
        );

      setTravelerInput(
        String(
          next,
        ),
      );

      setTravelers(
        next,
      );
    };


  const confirmTravelers =
    () => {
      if (
        !travelerInput.trim()
      ) {
        return notify(
          "여행 인원을 입력해 주세요.",
        );
      }

      commitTravelers();

      setTravelerPromptOpen(
        false,
      );
    };


  const toggleTheme =
    (
      theme,
    ) =>
      setThemes(
        (
          current,
        ) => {
          if (
            current.includes(
              theme,
            )
          ) {
            return current.filter(
              (
                item,
              ) =>
                item !==
                theme,
            );
          }

          if (
            current.length >=
            MAX_PREFERENCE_SELECTIONS
          ) {
            notify(
              "여행 테마는 최대 3개까지 선택할 수 있어요.",
            );

            return current;
          }

          return [
            ...current,
            theme,
          ];
        },
      );


  const beginOriginQuestion =
    () => {
      if (
        !travelers
      ) {
        setTravelerPromptOpen(
          true,
        );

        return;
      }

      if (
        !departureLocation
      ) {
        setDepartureMenuOpen(
          true,
        );

        return notify(
          "출발지를 먼저 선택해 주세요.",
        );
      }

      if (
        !destinationLocation
      ) {
        setMenuOpen(
          true,
        );

        return notify(
          "도착지와 세부지역을 먼저 선택해 주세요.",
        );
      }

      if (
        !endDate
      ) {
        return notify(
          "출발일과 귀국일을 먼저 선택해 주세요.",
        );
      }

      setTransportStep(
        "mode",
      );

      setTransportModalOpen(
        true,
      );
    };


  const chooseTransportMode =
    (
      mode,
    ) => {
      if (
        isJeju &&
        [
          "KTX",
          "BUS",
        ].includes(
          mode,
        )
      ) {
        return notify(
          "제주까지는 철도·버스 직행편이 없어요.",
        );
      }

      const modeChanged = Boolean(transport && transport !== mode);

      if (modeChanged) {
        setFlightId("");
        setReturnFlightId("");
        setOutboundTicketId("");
        setReturnTicketId("");
        setManualTimeConfirmed(false);
        setPlanEdits({});
        setPlanOrders({});
        setPlanCustomizations({});
        setBackendPlan(null);
        setAnnouncedPlanEstimate(0);
        setShowPlan(false);
        setPlanViewOpen(false);
        setLocalTransport("");
      }

      setTransport(
        mode,
      );

      if (
        mode ===
        "FLIGHT"
      ) {
        setFlightPickerLeg(
          "outbound",
        );

        setTransportModalOpen(
          false,
        );

        setFlightOpen(
          true,
        );

        void loadFlightOptions();

        return;
      }

      if (
        mode ===
        "CAR"
      ) {
        setLocalTransport(
          "CAR",
        );

        setTransportStep(
          "manual-time",
        );

        return;
      }

      setTicketLeg(
        "outbound",
      );

      setTransportStep(
        "tickets",
      );
    };


  const confirmManualTimes =
    ({
      startTime:
        nextStart,

      endTime:
        nextEnd,
    }) => {
      const schedule =
        resolveTripSchedule({
          mode:
            "CAR",

          startTime:
            nextStart,

          endTime:
            nextEnd,

          startDate,
          endDate,

          manualConfirmed:
            true,

          carMinutes:
            estimatedCarMinutes,
        });

      if (
        !schedule.ready
      ) {
        return schedule.reason;
      }

      setStartTime(
        nextStart,
      );

      setEndTime(
        nextEnd,
      );

      setManualTimeConfirmed(
        true,
      );

      setTransportStep(
        "car-detail",
      );

      return null;
    };


  const chooseTicket =
    (
      id,
    ) => {
      const ticket =
        ticketOptions.find(
          (
            item,
          ) =>
            item.id ===
            id,
        );

      if (
        !ticket
      ) {
        return;
      }

      if (
        ticketLeg ===
        "outbound"
      ) {
        setOutboundTicketId(
          id,
        );

        setReturnTicketId(
          "",
        );

        setTicketLeg(
          "return",
        );

        return;
      }

      const schedule =
        resolveTripSchedule({
          mode:
            transport,

          ticket: {
            out:
              selectedOutboundTicket
                ?.out,

            back:
              ticket.back,
          },

          startDate,
          endDate,
        });

      if (
        !schedule.ready
      ) {
        return notify(
          schedule.reason,
        );
      }

      setReturnTicketId(
        id,
      );

      setTransportStep(
        "local",
      );
    };


  const confirmTravelDates =
    ({
      startDate:
        nextStartDate,

      endDate:
        nextEndDate,
    }) => {
      if (
        nextStartDate ===
          startDate &&
        nextEndDate ===
          endDate
      ) {
        return;
      }

      setStartDate(
        nextStartDate,
      );

      setEndDate(
        nextEndDate,
      );

      resetRouteBookings();

      setShowPlan(
        false,
      );

      setPlanViewOpen(
        false,
      );

      setTransportPromptReady(
        Boolean(
          destinationLocation &&
            travelers &&
            departureLocation,
        ),
      );

      notify(
        "여행 날짜를 반영했어요.",
      );
    };


  const chooseLocal =
    (
      mode,
    ) => {
      setLocalTransport(
        mode,
      );

      setTransportModalOpen(
        false,
      );

      if (
        mode ===
        "RENTAL"
      ) {
        setRentalOpen(
          true,
        );
      } else {
        setStayOpen(
          true,
        );
      }
    };


  const completeCarDetails =
    () => {
      setTransport(
        "CAR",
      );

      setLocalTransport(
        "CAR",
      );

      setTransportModalOpen(
        false,
      );

      setStayOpen(
        true,
      );

      notify(
        `${carType} · ${carFuel} 기준으로 유류비를 계산할게요.`,
      );
    };


  const chooseFlight =
    (
      id,
    ) => {
      if (
        flightPickerLeg ===
        "outbound"
      ) {
        const outboundFlight =
          outboundFlights.find(
            (
              flight,
            ) =>
              flight.id ===
              id,
          );

        if (
          !outboundFlight
        ) {
          return;
        }

        setFlightId(
          id,
        );

        setReturnFlightId(
          "",
        );

        setFlightOpen(
          false,
        );

        setFlightTransitionOpen(
          true,
        );

        return;
      }

      const returnFlight =
        returnFlights.find(
          (
            flight,
          ) =>
            flight.id ===
            id,
        );

      if (
        !returnFlight ||
        !selectedOutboundFlight
      ) {
        return;
      }

      const schedule =
        resolveTripSchedule({
          mode:
            "FLIGHT",

          ticket: {
            out:
              flightTimeLabel(
                selectedOutboundFlight,
              ),

            back:
              flightTimeLabel(
                returnFlight,
              ),
          },

          startDate,
          endDate,
        });

      if (
        !schedule.ready
      ) {
        return notify(
          schedule.reason,
        );
      }

      setReturnFlightId(
        id,
      );

      setFlightOpen(
        false,
      );

      if (
        quickEditTarget ===
        "flight"
      ) {
        setQuickEditTarget(
          "",
        );

        notify(
          "왕복 항공편 변경이 반영됐어요.",
        );

        return;
      }

      setTransportStep(
        "local",
      );

      setTransportModalOpen(
        true,
      );
    };


  const chooseRental =
    (
      id,
    ) => {
      setRentalId(
        id,
      );

      setRestoredRental(
        null,
      );

      setRentalOpen(
        false,
      );

      if (
        showPlan ||
        quickEditTarget ===
          "rental"
      ) {
        setQuickEditTarget(
          "",
        );

        notify(
          "렌터카 선택이 반영됐어요.",
        );

        return;
      }

      setStayOpen(
        true,
      );
    };


  /*
   * 숙소 선택 후 총비용 계산도 priceAvg 기준.
   */
  const estimateTotalWithStay =
    (
      stay,
    ) => {
      const nextRooms =
        Math.ceil(
          party /
            3,
        );

      const nextStayTotal =
        stay?.priceAvg !=
        null
          ? (
              stay.priceAvg *
              nights *
              nextRooms
            ) /
            party
          : 0;

      return (
        intercityTransportTotal +
        nextStayTotal +
        driveTotal +
        foodTotal +
        activityTotal
      );
    };


  const chooseStay =
    (
      id,
    ) => {
      const stay =
        stayCatalog.find(
          (
            item,
          ) =>
            item.id ===
            id,
        );

      if (
        !stay
      ) {
        return;
      }

      const previousStay =
        selectedStay;

      const nextTotal =
        estimateTotalWithStay(
          stay,
        );

      setStayId(
        id,
      );

      setQuickEditTarget(
        "",
      );

      setPlanEdits(
        {},
      );

      setPlanOrders(
        {},
      );

      setPlanCustomizations({});

      setStayOpen(
        false,
      );

      if (
        showPlan
      ) {
        const didChangeStay =
          Boolean(
            previousStay &&
              previousStay.id !==
                stay.id,
          );

        if (!didChangeStay) {
          return notify("현재 적용 중인 숙소예요.");
        }

        setStayChange({ from: previousStay, to: stay });
        setPlanViewOpen(false);

        // 선택 상태만 바꾸지 않고 새 accommodationId로 백엔드 일정을 다시 생성한다.
        void generate({
          stayOverride: stay,
          mode: "stay-revision",
          previousStayOverride: previousStay,
        });
        return;
      }

      setBudgetStatus({
        total:
          nextTotal,

        inBudget:
          budget >=
          nextTotal,

        stay,
      });

      // 숙소 선택 직후에는 식비/취향이 아직 확정되지 않으므로 중간 예산 팝업을 띄우지 않는다.
      setPreferenceModalOpen(true);
      notify("숙소까지 반영했어요. 이제 여행 테마와 선호 음식을 선택해 주세요.");
    };


  const openQuickEdit =
    (
      target,
    ) => {
      if (
        target ===
        "dates"
      ) {
        notify(
          "날짜를 다시 선택해 주세요.",
        );

        return;
      }

      if (
        target ===
        "flight"
      ) {
        if (
          !startDate ||
          !endDate
        ) {
          return notify(
            "출발일과 귀국일을 먼저 선택해 주세요.",
          );
        }

        setQuickEditTarget(
          "flight",
        );

        setFlightPickerLeg(
          "outbound",
        );

        setFlightOpen(
          true,
        );

        return;
      }

      if (
        target ===
        "rental"
      ) {
        setQuickEditTarget(
          "rental",
        );

        setLocalTransport(
          "RENTAL",
        );

        setRentalOpen(
          true,
        );

        return;
      }

      if (
        target ===
        "stay"
      ) {
        setQuickEditTarget(
          "stay",
        );

        setStayArea(
          jejuBaseArea ||
            "전체",
        );

        setStayOpen(
          true,
        );
      }
    };


  const focusBookingPrerequisite =
    (
      target,
    ) => {
      const targetName =
        {
          transport:
            "교통수단",

          flight:
            "항공편",

          rental:
            "렌터카",

          stay:
            "숙소",
        }[
          target
        ] ||
        "비교 항목";

      if (
        !departureLocation
      ) {
        setDepartureMenuOpen(
          true,
        );

        notify(
          `${targetName} 비교 전에 출발지를 먼저 선택해 주세요.`,
        );

        return false;
      }

      if (
        !destinationLocation
      ) {
        setMenuOpen(
          true,
        );

        notify(
          `${targetName} 비교 전에 도착지를 먼저 선택해 주세요.`,
        );

        return false;
      }

      if (
        !travelers
      ) {
        setTravelerPromptOpen(
          true,
        );

        notify(
          `${targetName} 견적을 위해 인원을 먼저 입력해 주세요.`,
        );

        return false;
      }

      if (
        !startDate ||
        !endDate
      ) {
        notify(
          `${targetName} 비교 전에 날짜를 먼저 선택해 주세요.`,
        );

        return false;
      }

      return true;
    };


  const openIndependentBooking =
    (
      target,
    ) => {
      if (
        !focusBookingPrerequisite(
          target,
        )
      ) {
        return;
      }

      if (
        target ===
        "transport"
      ) {
        setTransportStep(
          "mode",
        );

        setTransportModalOpen(
          true,
        );

        return;
      }

      if (
        target ===
        "flight"
      ) {
        chooseTransportMode(
          "FLIGHT",
        );

        return;
      }

      if (
        target ===
        "rental"
      ) {
        setLocalTransport(
          "RENTAL",
        );

        setRentalOpen(
          true,
        );

        return;
      }

      if (
        target ===
        "stay"
      ) {
        setStayArea(
          destinationLocation
            ?.detail ||
            destinationLocation
              ?.region ||
            "전체",
        );

        setStayOpen(
          true,
        );
      }
    };


  const changePlanStop =
    (
      dayIndex,
      eventId,
      place,
    ) => {
      const stopIndex =
        baseDayPlans[
          dayIndex
        ]?.[
          2
        ]?.findIndex(
          (
            event,
          ) =>
            event[
              6
            ]?.id ===
            eventId,
        );

      if (
        stopIndex ==
          null ||
        stopIndex <
          0
      ) {
        return;
      }

      setPlanEdits(
        (
          current,
        ) => ({
          ...current,

          [`${dayIndex}-${stopIndex}`]:
            place,
        }),
      );

      setPlanRevision(
        (
          current,
        ) =>
          current +
          1,
      );

      notify(
        `${place.name}(으)로 변경했습니다. 저장하면 실제 경로와 시간을 계산해요.`,
      );
    };


  const reorderDayPlan = (dayIndex, sourceIndex, destinationIndex) => {
    const events = dayPlans[dayIndex]?.[2] || [];
    if (
      sourceIndex === destinationIndex ||
      !events[sourceIndex] ||
      events[sourceIndex][6]?.isLocked
    ) {
      return;
    }

    // 잠긴 공항/항공/렌터카/숙소는 자기 자신만 고정되는 카드가 아니라
    // 실제 이동 흐름을 지키는 경계(anchor)다. 자유 일정은 이 경계를 넘을 수 없다.
    const lockedIndexes = events.flatMap((event, index) =>
      event[6]?.isLocked ? [index] : []);
    const previousLocked = [...lockedIndexes].reverse().find((index) => index < sourceIndex);
    const nextLocked = lockedIndexes.find((index) => index > sourceIndex);
    const segmentStart = previousLocked == null ? 0 : previousLocked + 1;
    const segmentEnd = nextLocked == null ? events.length - 1 : nextLocked - 1;

    if (destinationIndex < segmentStart || destinationIndex > segmentEnd) {
      notify(
        dayIndex === 0
          ? "첫째 날의 공항·항공·렌터카 순서는 실제 이동 흐름 때문에 고정되어 있어요."
          : "고정된 교통·숙소 일정을 넘어서는 순서 변경은 할 수 없어요.",
      );
      return;
    }

    const movableSlots = events.flatMap((event, index) =>
      !event[6]?.isLocked && index >= segmentStart && index <= segmentEnd ? [index] : []);
    const sourceRank = movableSlots.indexOf(sourceIndex);
    if (sourceRank < 0 || movableSlots.length < 2) return;

    const destinationRank = Math.max(
      0,
      Math.min(
        movableSlots.length - 1,
        movableSlots.reduce((nearest, slot, rank) =>
          Math.abs(slot - destinationIndex) < Math.abs(movableSlots[nearest] - destinationIndex)
            ? rank
            : nearest, 0),
      ),
    );
    if (sourceRank === destinationRank) return;

    const movableIds = movableSlots.map((index) =>
      planEventKey(events[index], dayIndex, index));
    const [movedId] = movableIds.splice(sourceRank, 1);
    movableIds.splice(destinationRank, 0, movedId);

    const replacements = new Map(movableSlots.map((slot, rank) => [slot, movableIds[rank]]));
    const order = events.map((event, eventIndex) =>
      replacements.get(eventIndex) || planEventKey(event, dayIndex, eventIndex),
    ).filter(Boolean);

    setPlanOrders((current) => ({ ...current, [dayIndex]: order }));
    setPlanRevision((current) => current + 1);

    notify("순서를 변경했습니다. 저장하면 실제 이동시간과 경로를 다시 계산해요.");
  };


  const removePlanStop = (dayIndex, eventId) => {
    const event = dayPlans[dayIndex]?.[2]?.find((item, eventIndex) =>
      planEventKey(item, dayIndex, eventIndex) === eventId);

    if (!event) return;
    if (event[6]?.isLocked) {
      notify("항공·공항·렌터카·숙소처럼 예약과 연결된 일정은 삭제할 수 없어요.");
      return;
    }

    setPlanCustomizations((current) => {
      const day = current[dayIndex] || {};
      return {
        ...current,
        [dayIndex]: {
          ...day,
          removed: [...new Set([...(day.removed || []), eventId])],
        },
      };
    });
    setPlanRevision((current) => current + 1);
    notify(`${event[2]} 일정을 제외하고 뒤 시간을 다시 맞췄어요.`);
  };


  const addPlanStop = async (dayIndex, afterEventId, draft = {}) => {
    const name = String(draft.name || "").trim();
    const type = String(draft.type || "ATTRACTION").toUpperCase();
    const stayMinutes = Math.max(20, Math.min(240, Number(draft.stayMinutes) || 60));

    if (!name) throw new Error("추가할 장소 이름을 입력해 주세요.");

    let resolved = { name, type };
    const currentPlan = backendPlanRef.current;
    if (!isMockModeEnabled() && currentPlan?.id) {
      const matches = await searchPlanPlaces(currentPlan.id, type, name);
      const normalize = (value) => String(value || "").replace(/\s|·/g, "").toLowerCase();
      resolved = matches.find((candidate) => normalize(candidate.name) === normalize(name))
        || matches[0]
        || resolved;
    }

    const id = `custom-${dayIndex + 1}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const icon = type === "RESTAURANT" ? "🍽️" : type === "CAFE" ? "☕" : "📍";
    const event = [
      "09:00",
      icon,
      resolved.name || name,
      resolved.description || resolved.detail || "직접 추가한 일정입니다.",
      `${stayMinutes}분`,
      15,
      {
        id,
        type,
        category: type,
        placeId: resolved.placeId ?? null,
        latitude: resolved.latitude ?? null,
        longitude: resolved.longitude ?? null,
        stayMinutes,
        travelMinutes: 15,
        isLocked: false,
        isGeographical: true,
        customAdded: true,
        locallyReordered: true,
      },
    ];

    setPlanCustomizations((current) => {
      const day = current[dayIndex] || {};
      return {
        ...current,
        [dayIndex]: {
          ...day,
          additions: [
            ...(day.additions || []),
            { afterId: afterEventId || null, event },
          ],
        },
      };
    });
    setPlanRevision((current) => current + 1);
    notify(`${resolved.name || name} 일정을 추가하고 뒤 시간을 다시 맞췄어요.`);
    return event;
  };


  const resolvePlanStop = async (place, currentItem = {}) => {
    const currentPlan = backendPlanRef.current;
    if (isMockModeEnabled() || !currentPlan?.id) return place;

    const type = String(currentItem.type || "").toUpperCase();
    if (!["ATTRACTION", "RESTAURANT", "CAFE"].includes(type)) {
      throw new Error("관광지·식당·카페 일정만 장소를 변경할 수 있습니다.");
    }

    const matches = await searchPlanPlaces(currentPlan.id, type, place.name);
    const normalize = (value) => String(value || "").replace(/\s|·/g, "").toLowerCase();
    const exact = matches.find((candidate) => normalize(candidate.name) === normalize(place.name));
    const selected = exact || matches[0];

    if (!selected) {
      throw new Error("데이터베이스에서 해당 장소를 찾지 못했습니다. 다른 장소를 선택해 주세요.");
    }

    return {
      ...place,
      ...selected,
      icon: place.icon,
      duration: place.duration,
      travel: place.travel,
      type,
      placeId: selected.placeId,
    };
  };


  const savePlanChanges = async () => {
    const currentPlan = backendPlanRef.current;
    const hasCustomChanges = Object.keys(planCustomizations).length > 0;
    const changed = Object.keys(planEdits).length > 0 || Object.keys(planOrders).length > 0 || hasCustomChanges;

    if (isMockModeEnabled() || !currentPlan?.id || !changed) {
      return { persisted: false, unchanged: !changed };
    }

    // 현재 backend 편집 계약은 기존 장소의 순서/교체만 지원한다.
    // 직접 추가·삭제한 블록은 로컬 저장으로 보존하고 서버 원본을 임의로 변형하지 않는다.
    if (hasCustomChanges) {
      return { persisted: false, localOnly: true };
    }

    const snapshot = await loadPlanEditor(currentPlan.id);
    const request = buildPlanEditRequest(snapshot, dayPlans);
    const saved = await savePlanEditor(currentPlan.id, request);
    const normalized = normalizeTripPlanResponse(saved.plan);

    backendPlanRef.current = normalized;
    setBackendPlan(normalized);
    setPlanEdits({});
    setPlanOrders({});
    setPlanCustomizations({});
    setPlanRevision((current) => current + 1);
    return { persisted: true };
  };


  const itineraryEventCost =
    costForEvent;


  const generate = async ({
    stayOverride = null,
    mode = "create",
    previousStayOverride = null,
  } = {}) => {

  if (generationInFlightRef.current) {
    return;
  }

  const effectiveStay = stayOverride || selectedStay;
  const previousAnnouncedPlanEstimate = announcedPlanEstimate;
  const effectiveStayTotal = effectiveStay?.priceAvg != null
    ? (Number(effectiveStay.priceAvg) * nights * rooms) / party
    : 0;
  const estimateAtGeneration = Math.round(
    mode === "stay-revision"
      ? Math.max(0, total - stayTotal + effectiveStayTotal)
      : total,
  );

  /*
   * ==========================================
   * 1. 입력 검증
   * ==========================================
   */

  if (!departureLocation) {
    setDepartureMenuOpen(
      true,
    );

    return notify(
      "출발지를 먼저 선택해 주세요.",
    );
  }


  if (!destinationLocation) {
    return notify(
      "도착지와 세부지역을 먼저 선택해 주세요.",
    );
  }


  const departureLatitude =
    Number(
      departureLocation.latitude,
    );


  const departureLongitude =
    Number(
      departureLocation.longitude,
    );


  const destinationLatitude =
    Number(
      destinationLocation.latitude,
    );


  const destinationLongitude =
    Number(
      destinationLocation.longitude,
    );


  if (
    !Number.isFinite(
      departureLatitude,
    ) ||
    !Number.isFinite(
      departureLongitude,
    )
  ) {
    return notify(
      "출발지 좌표를 확인할 수 없습니다.",
    );
  }


  if (
    !Number.isFinite(
      destinationLatitude,
    ) ||
    !Number.isFinite(
      destinationLongitude,
    )
  ) {
    return notify(
      "도착지 좌표를 확인할 수 없습니다.",
    );
  }


  if (
    !startDate ||
    !endDate
  ) {
    return notify(
      "출발일과 귀국일을 선택해 주세요.",
    );
  }


  if (!travelers) {
    return notify(
      "총인원을 입력해 주세요.",
    );
  }


  if (
    !transport ||
    !localTransport
  ) {
    return notify(
      "출발 교통수단과 현지 교통수단을 선택해 주세요.",
    );
  }


  if (
    transport ===
      "FLIGHT" &&
    (
      !selectedOutboundFlight ||
      !selectedReturnFlight
    )
  ) {
    return notify(
      "가는 편과 오는 편 항공편을 모두 선택해 주세요.",
    );
  }


  if (
    !tripSchedule.ready
  ) {
    return notify(
      tripSchedule.reason,
    );
  }


  if (!effectiveStay) {
    return notify(
      "숙소를 선택해 주세요.",
    );
  }


  const accommodationId =
    Number(
      effectiveStay.accommodationId ??
      effectiveStay.id,
    );


  if (
    !Number.isInteger(
      accommodationId,
    ) ||
    accommodationId <= 0
  ) {
    return notify(
      "선택한 숙소 정보를 다시 확인해 주세요.",
    );
  }


  /*
   * ==========================================
   * 2. frontend 값 → backend enum 변환
   * ==========================================
   */

  const mainTransportMode =
    MAIN_TRANSPORT_MAP[
      transport
    ];


  const localTransportMode =
    LOCAL_TRANSPORT_MAP[
      localTransport
    ];


  const backendPace =
    PACE_MAP[
      pace
    ];


  if (!mainTransportMode) {
    return notify(
      "지원하지 않는 출발 교통수단입니다.",
    );
  }


  if (!localTransportMode) {
    return notify(
      "지원하지 않는 현지 교통수단입니다.",
    );
  }


  /*
   * RENTAL_CAR 이용 시 선택한 렌터카의
   * 위치/셔틀 정보가 반드시 필요하다.
   */
  if (
    localTransportMode ===
    "RENTAL_CAR"
  ) {
    if (!selectedRental) {
      return notify(
        "렌터카를 선택해 주세요.",
      );
    }

    const rentalLatitude =
      Number(
        selectedRental.latitude,
      );

    const rentalLongitude =
      Number(
        selectedRental.longitude,
      );

    const shuttleMinutes =
      Number(
        selectedRental
          .estimatedShuttleMinutes,
      );

    if (
      !Number.isFinite(
        rentalLatitude,
      ) ||
      !Number.isFinite(
        rentalLongitude,
      ) ||
      !Number.isFinite(
        shuttleMinutes,
      ) ||
      shuttleMinutes <= 0
    ) {
      return notify(
        "선택한 렌터카의 위치 또는 셔틀 정보를 확인해 주세요.",
      );
    }
  }


  if (!backendPace) {
    return notify(
      "여행 일정 속도를 확인해 주세요.",
    );
  }


  const preferences =
    themes
      .map(
        (theme) =>
          THEME_MAP[
            theme
          ],
      )
      .filter(
        Boolean,
      )
      .slice(
        0,
        3,
      );


  if (
    preferences.length ===
    0
  ) {
    return notify(
      "여행 테마를 1개 이상 선택해 주세요.",
    );
  }


  /*
   * VEGETARIAN은 현재 backend enum에 없으므로
   * 자동으로 제외된다.
   */
  const backendFoodPreferences =
    foodPreferences
      .map(
        (food) =>
          FOOD_PREFERENCE_MAP[
            food
          ],
      )
      .filter(
        Boolean,
      )
      .slice(
        0,
        3,
      );


  /*
   * ==========================================
   * 3. 지역명
   * ==========================================
   */

  const departureName =
    locationRequestName(
      departureLocation,
    );


  const destinationName =
    locationRequestName(
      destinationLocation,
    );


  /*
   * ==========================================
   * 4. 시간
   * ==========================================
   *
   * backend Flight validation:
   *
   * outbound.departure >= trip.startTime
   * return.arrival <= trip.endTime
   */

  const tripStartTime =
    scheduledStartTime ||
    startTime ||
    "09:00";


  const tripEndTime =
    tripSchedule.returnArrivalTime ||
    endTime ||
    "18:00";


  /*
   * ==========================================
   * 5. 식비 추정
   * ==========================================
   *
   * 현재 별도 "하루 식비" 입력 UI가 없으므로
   * 기존 프론트 식비 추정값을 활용.
   *
   * 그것도 없으면 30,000원 fallback.
   */

  const tripDayCount =
    Math.max(
      1,
      dates.length,
    );


  const estimatedMealBudget =
    foodTotal >
    0
      ? Math.round(
          foodTotal /
          tripDayCount,
        )
      : 30000;


  /*
   * ==========================================
   * 6. 선택 항공편 / 렌터카 DTO 변환
   * ==========================================
   *
   * 숙소, 항공편, 렌터카는 이제
   * POST /api/trips 단계에서 함께 저장한다.
   */

  const outboundFlight =
    mainTransportMode ===
    "AIR"
      ? toFlightCandidatePayload(
          selectedOutboundFlight,
        )
      : null;


  const returnFlight =
    mainTransportMode ===
    "AIR"
      ? toFlightCandidatePayload(
          selectedReturnFlight,
        )
      : null;


  const rental =
    localTransportMode ===
      "RENTAL_CAR" &&
    selectedRental
      ? {
          id:
            selectedRental.id,

          company:
            selectedRental.company,

          car:
            selectedRental.car ??
            null,

          pickup:
            selectedRental.pickup ??
            null,

          latitude:
            Number(
              selectedRental.latitude,
            ),

          longitude:
            Number(
              selectedRental.longitude,
            ),

          estimatedShuttleMinutes:
            Number(
              selectedRental
                .estimatedShuttleMinutes,
            ),
        }
      : null;


  /*
   * ==========================================
   * 7. loading 시작
   * ==========================================
   */

  generationInFlightRef.current =
    true;

  setAnnouncedPlanEstimate(estimateAtGeneration);

  setPlanningMode(
    mode,
  );

  setPlanning(
    true,
  );

  setPlanningStage(
    "calculating",
  );


  try {

    /*
     * ========================================
     * STEP 1
     *
     * POST /api/trips
     * ========================================
     */

    const createdTrip =
      await createTrip({

        departure:
          departureName,

        departureLatitude,

        departureLongitude,


        destination:
          destinationName,

        destinationLatitude,

        destinationLongitude,


        startDate,

        startTime:
          tripStartTime,


        endDate,

        endTime:
          tripEndTime,


        peopleCount:
          travelers,


        mainTransportMode,

        localTransportMode,


        budget:
          Math.max(
            0,

            Math.round(
              Number(
                budget,
              ) ||
              0,
            ),
          ),


        mealBudgetPerPersonPerDay:
          Math.max(
            0,
            estimatedMealBudget,
          ),


        pace:
          backendPace,


        preferences,


        foodPreferences:
          backendFoodPreferences,


        /*
         * Trip 생성 시 선택값을 함께 저장.
         */
        accommodationId,

        outboundFlight,

        returnFlight,

        rental,
      });


    const tripId =
      createdTrip?.id;


    if (!tripId) {
      throw new Error(
        "여행 생성 응답에 tripId가 없습니다.",
      );
    }


    if (
      import.meta.env.DEV
    ) {
      console.log(
        "[TRIP CREATE]",

        {
          tripId,
          createdTrip,
        },
      );
    }


    /*
     * ========================================
     * STEP 2
     *
     * POST /api/trips/{tripId}/plan
     * 최신 backend는 Request Body를 받지 않는다.
     * ========================================
     */

    const nextBackendPlan =
      await requestTripPlan(
        tripId,
      );


    /*
     * ========================================
     * STEP 3
     *
     * 일정 검증
     * ========================================
     */

    if (
      !Array.isArray(
        nextBackendPlan
          ?.dayPlans,
      ) ||
      nextBackendPlan
        .dayPlans
        .length ===
        0
    ) {
      throw new Error(
        "백엔드에서 생성된 여행 일정이 비어 있습니다.",
      );
    }


    /*
     * ========================================
     * STEP 4
     *
     * 기존 UI state에 backend 일정 주입
     *
     * UI 구조 변경 없음.
     * ========================================
     */

    backendPlanRef.current =
      nextBackendPlan;


    setBackendPlan(
      nextBackendPlan,
    );


    setPlanEdits(
      {},
    );


    if (
      import.meta.env.DEV
    ) {
      console.log(
        "[TRIP PLAN]",

        nextBackendPlan,
      );
    }


    /*
     * ========================================
     * STEP 5
     *
     * 기존 일정 UI 열기
     * ========================================
     */

    setPlanningStage(
      "ready",
    );


    setActiveDay(
      0,
    );


    setPlanRevision(
      (current) =>
        current +
        1,
    );


    setShowPlan(
      true,
    );


    setPlanning(
      false,
    );


    setPlanViewOpen(
      true,
    );


    setPlanOrders({});
    setPlanCustomizations({});

    if (mode === "stay-revision") {
      setStayChangePromptOpen(true);
      notify(`${effectiveStay.name}을 기준으로 이동 동선과 경비를 다시 계산했어요.`);
    } else {
      notify("AI 여행 일정이 생성되었습니다.");
    }

  } catch (error) {

    console.error(
      "[TRIP PLAN] 생성 실패:",

      error,
    );


    setPlanning(
      false,
    );

    if (mode === "stay-revision") {
      if (previousStayOverride?.id != null) {
        setStayId(previousStayOverride.id);
      }
      setStayChange(null);
      setPlanViewOpen(true);
    }

    setAnnouncedPlanEstimate(previousAnnouncedPlanEstimate);


    notify(
      mode === "stay-revision"
        ? `${error?.message || "새 숙소 기준 일정을 생성하지 못했습니다."} 기존 숙소 일정을 유지합니다.`
        : error?.message || "여행 일정을 생성하지 못했습니다.",
    );
  } finally {
    generationInFlightRef.current =
      false;
  }
};

  const openSavedTrip = useCallback((savedTrip) => {
    if (!savedTrip?.id) {
      notify("불러올 여행 정보가 없습니다.");
      return false;
    }

    const savedCostSnapshot = getTripCostSnapshot(savedTrip.id);
    setAnnouncedPlanEstimate(Number(savedCostSnapshot?.totalPerPerson) || 0);

    const nextDestination = {
      id: `saved-destination-${savedTrip.id}`,
      countryCode: "KR",
      region: savedTrip.destination || "도착지",
      name: savedTrip.destination || "도착지",
      detail: savedTrip.destination || "도착지",
      latitude: Number(savedTrip.destinationLatitude),
      longitude: Number(savedTrip.destinationLongitude),
      needsGeocoding: false,
    };

    const nextDeparture = {
      id: `saved-departure-${savedTrip.id}`,
      countryCode: "KR",
      region: savedTrip.departure || "출발지",
      name: savedTrip.departure || "출발지",
      detail: savedTrip.departure || "출발지",
      latitude: Number(savedTrip.departureLatitude),
      longitude: Number(savedTrip.departureLongitude),
      needsGeocoding: false,
    };

    setDestination(savedTrip.destination || "");
    setDestinationType("국내");
    setDestinationLocation(nextDestination);
    setDepartureLocation(nextDeparture);
    setStartDate(savedTrip.startDate || "");
    setEndDate(savedTrip.endDate || "");
    setStartTime(savedTrip.startTime?.slice?.(0, 5) || "09:00");
    setEndTime(savedTrip.endTime?.slice?.(0, 5) || "18:00");
    setTravelers(Math.max(1, Number(savedTrip.peopleCount) || 1));
    setTravelerInput(String(Math.max(1, Number(savedTrip.peopleCount) || 1)));
    setBudget(Math.max(0, Number(savedTrip.budget) || 0));
    setPace(PACE_FROM_BACKEND[savedTrip.pace] || "보통");
    setThemes(
      (savedTrip.preferences || [])
        .map((code) => THEME_FROM_BACKEND[code])
        .filter(Boolean),
    );
    setFoodPreferencesState(
      (savedTrip.foodPreferences || [])
        .map((code) => FOOD_FROM_BACKEND[code])
        .filter(Boolean),
    );
    setTransport(
      MAIN_TRANSPORT_FROM_BACKEND[savedTrip.mainTransportMode] || "CAR",
    );
    setLocalTransport(
      LOCAL_TRANSPORT_FROM_BACKEND[savedTrip.localTransportMode] || "TRANSIT",
    );
    setRestoredRental(
      savedTrip.selectedRental
        ? { ...savedTrip.selectedRental, ...(savedCostSnapshot?.rental || {}) }
        : savedCostSnapshot?.rental || null,
    );

    const accommodation = savedTrip.selectedAccommodation;
    if (accommodation?.accommodationId != null) {
      const restoredStay = {
        id: accommodation.accommodationId,
        providerId: accommodation.providerId,
        name: accommodation.name,
        area: savedTrip.destination || "숙소",
        address: accommodation.address,
        latitude: accommodation.latitude,
        longitude: accommodation.longitude,
        checkInTime: accommodation.checkInTime,
        checkOutTime: accommodation.checkOutTime,
        priceAvg: savedCostSnapshot?.stay?.priceAvg ?? null,
        priceText: savedCostSnapshot?.stay?.priceText || "저장된 예약",
        image: jejuCoastPhoto,
        isMock: false,
      };

      setStayCatalog([restoredStay]);
      setStayId(restoredStay.id);
    }

    const outbound = savedTrip.outboundFlight
      ? normalizeFlightCandidate(savedTrip.outboundFlight)
      : null;
    const returning = savedTrip.returnFlight
      ? normalizeFlightCandidate(savedTrip.returnFlight)
      : null;

    setFlightSearchResult({
      departureAirport: outbound?.departureAirport || "",
      arrivalAirport: outbound?.arrivalAirport || "",
      outboundFlights: outbound ? [outbound] : [],
      returnFlights: returning ? [returning] : [],
    });
    setFlightId(outbound?.id || "");
    setReturnFlightId(returning?.id || "");

    const restoredPlan = normalizeTripPlanResponse({
      tripId: savedTrip.id,
      planner: "SAVED_TRIP",
      timeBasis: "PERSISTED_SCHEDULE",
      mainTransportMode: savedTrip.mainTransportMode,
      localTransportMode: savedTrip.localTransportMode,
      selectedAccommodation: savedTrip.selectedAccommodation,
      selectedRental: savedTrip.selectedRental,
      outboundFlight: savedTrip.outboundFlight,
      returnFlight: savedTrip.returnFlight,
      costEstimate: savedCostSnapshot?.costEstimate ?? null,
      days: savedTrip.days || [],
    });

    backendPlanRef.current = restoredPlan;
    setBackendPlan(restoredPlan);
    setPlanEdits({});
    setPlanOrders({});
    setPlanCustomizations({});
    setActiveDay(0);
    setPlanningStage("ready");
    setShowPlan(true);
    setPlanViewOpen(true);
    setPlanRevision((current) => current + 1);
    notify("저장된 여행 일정을 불러왔습니다.");
    return true;
  }, []);


  return {
    setDestinationType,

    destination,
    destinationLocation,

    destinationRegionId,
    setDestinationRegionId,

    menuOpen,
    setMenuOpen,

    departureLocation,

    departureRegionId,
    setDepartureRegionId,

    departureMenuOpen,
    setDepartureMenuOpen,

    customDeparture,
    setCustomDeparture,

    prompt,
    setPrompt,

    startDate,
    setStartDate,

    endDate,
    setEndDate,

    startTime,
    setStartTime,

    endTime,
    setEndTime,

    tripSchedule,

    estimatedCarMinutes,

    ticketOptions,

    ticketLeg,

    selectedOutboundTicket,

    selectedTicket,

    scheduledArrivalTime,

    confirmManualTimes,

    chooseTicket,

    confirmTravelDates,

    travelers,
    setTravelers,

    travelerInput,
    setTravelerInput,

    travelerPromptOpen,
    setTravelerPromptOpen,

    budget,
    setBudget,

    pace,
    setPace,

    themes,

    foodPreferences,
    setFoodPreferences,

    heroSlideIndex,
    setHeroSlideIndex,

    setTransportPromptReady,

    jejuBaseArea,

    jejuCustomArea,
    setJejuCustomArea,

    jejuRegionGuideOpen,
    setJejuRegionGuideOpen,

    loginOpen,
    setLoginOpen,

    transport,
    localTransport,

    carType,
    setCarType,

    carFuel,
    setCarFuel,

    transportModalOpen,
    setTransportModalOpen,

    transportStep,
    setTransportStep,

    origin,
    setOrigin,

    flightOpen,
    setFlightOpen,

    flightPickerLeg,
    setFlightPickerLeg,

    flightTransitionOpen,
    setFlightTransitionOpen,

    flightSort,
    setFlightSort,

    flightId,
    setFlightId,

    returnFlightId,
    setReturnFlightId,

    flightSearchResult,

    flightLoading,

    flightError,

    displayFlights,

    loadFlightOptions,

    rentalOpen,
    setRentalOpen,

    rentalId,

    preferenceModalOpen,
    setPreferenceModalOpen,

    stayTransitionOpen,
    setStayTransitionOpen,

    budgetConfirmationOpen,
    setBudgetConfirmationOpen,

    planPromptOpen,
    setPlanPromptOpen,

    budgetStatus,

    /*
     * 숙소 API 관련
     */
    stayOpen,
    setStayOpen,

    stayCatalog,

    stayLoading,

    stayError,

    loadStayOptions,

    stayArea,
    setStayArea,

    priceBand,
    setPriceBand,

    staySearch,
    setStaySearch,

    staySort,
    setStaySort,

    stayId,

    stayChange,

    stayChangePromptOpen,
    setStayChangePromptOpen,

    stayChangeCompareOpen,
    setStayChangeCompareOpen,

    showPlan,

    planViewOpen,
    setPlanViewOpen,

    planning,

    quickEditTarget,
    setQuickEditTarget,

    planningStage,

    planningMode,

    planRevision,
    setPlanRevision,

    activeDay,
    setActiveDay,

    message,

    destinationAirport,

    selectedOutboundFlight,

    selectedReturnFlight,

    selectedFlight,

    selectedRental,

    rentalCatalog,

    selectedStay,

    dates,

    nights,

    party,

    rooms,

    scheduledStartTime,

    scheduledEndTime,

    dayPlans,

    routeResults:
      backendPlan?.routes ||
      [],

    /*
     * 기존 App.jsx 항공 호환
     */
    saleFirstFlights,

    /*
     * 실제 숙소 API 결과 필터링
     */
    filteredStays,

    stayAreas,

    costDetails: reconciledCostDetails,

    total,

    confirmedTotal,

    confirmedInBudget,

    gap,

    inBudget,

    notify,

    submitPrompt,

    chooseDepartureDistrict,

    useCurrentDepartureLocation,

    chooseCustomDeparture,

    chooseDestination,

    chooseJejuBaseArea,

    chooseJejuCustomArea,

    askAiForDestination,

    commitTravelers,

    confirmTravelers,

    toggleTheme,

    beginOriginQuestion,

    chooseTransportMode,

    chooseLocal,

    completeCarDetails,

    chooseFlight,

    chooseRental,

    chooseStay,

    openIndependentBooking,

    changePlanStop,

    addPlanStop,

    removePlanStop,

    reorderDayPlan,

    resolvePlanStop,

    savePlanChanges,

    itineraryEventCost,

    generate,

    openSavedTrip,

    resetTripDraft,
  };
}


export default useTripPlanner;
