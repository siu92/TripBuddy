import { useTripCostEstimate } from "./useTripCostEstimate.js";
import { useFlightOptions } from "./useFlightOptions.js";
import { useStayOptions } from "./useStayOptions.js";
import { usePlannerNotice } from "./usePlannerNotice.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { preconnect, preload } from "react-dom";
import { isMockModeEnabled } from "../api/apiClient";
import { createTrip } from "../api/tripApi";
import {
  loadPlanEditor,
  savePlanEditor,
  searchPlanPlaces,
} from "../api/planEditorApi.js";
import { normalizeTripPlanResponse, requestTripPlan } from "../api/tripPlanApi";
import {
  makeDemoTicketOptions,
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
  getDates,
  heroSlides,
  jejuRegionOptions,
  makeDayPlans,
  outboundOptions,
  placeEntryCost,
  today,
  transportName,
} from "../data/mockData";
import { buildPlanEditRequest } from "../utils/planEditPayload.js";
import { locationRequestName } from "../utils/locationPayload.js";
import {
  flightTimeLabel,
  flightDurationMinutes,
  normalizeFlightCandidate,
  flightDepartureClockMinutes,
  toFlightCandidatePayload,
} from "../planner/flightCandidates.js";
import {
  planEventKey,
  applyPlanOrders,
  applyPlanCustomizations,
} from "../planner/planDraftEdits.js";
import {
  MAX_PREFERENCE_SELECTIONS,
  normalizeThemes,
  normalizeFoodPreferences,
} from "../planner/preferences.js";
import {
  MAIN_TRANSPORT_MAP,
  LOCAL_TRANSPORT_MAP,
  VEHICLE_FUEL_TYPE_MAP,
  VEHICLE_EFFICIENCY_KMPL,
  inferRentalFuelType,
  inferRentalEfficiencyKmpl,
  PACE_MAP,
  THEME_MAP,
  FOOD_PREFERENCE_MAP,
  MAIN_TRANSPORT_FROM_BACKEND,
  LOCAL_TRANSPORT_FROM_BACKEND,
  PACE_FROM_BACKEND,
  THEME_FROM_BACKEND,
  FOOD_FROM_BACKEND,
} from "../planner/domainMappings.js";
import {
  getTripCostSnapshot,
  readInitialDraft,
} from "../planner/plannerStorage.js";

/**
 * 여행 입력 → 후보 조회 → 생성 → 편집 → 저장/복원을 연결하는 React 상태 조율 훅.
 * 독립 변환/저장 함수는 src/planner/, 서버 통신은 src/api/에 있습니다.
 * 읽는 순서와 각 책임은 guide/CODE_MAP.md 및 planner/README.md를 참고하세요.
 * 입력 변경에 따른 후속 선택 초기화와 effect 순서는 서로 의존하므로 함께 확인합니다.
 */
function useTripPlanner() {
  const { message, notify } = usePlannerNotice();

  // ── 01. 저장된 초안을 읽고 입력·모달 상태를 초기화합니다. ──
  const [initialDraft] = useState(() => readInitialDraft(today));

  const savedTravelerCount = Number(initialDraft.travelers);
  const initialTravelerCount =
    Number.isFinite(savedTravelerCount) && savedTravelerCount >= 1
      ? Math.min(20, Math.floor(savedTravelerCount))
      : null;

  const initialBookingSelection =
    initialDraft.bookingSelection &&
    typeof initialDraft.bookingSelection === "object"
      ? initialDraft.bookingSelection
      : {};

  const [destinationType, setDestinationType] = useState(
    initialDraft.destinationType || "",
  );

  const [destination, setDestination] = useState(
    initialDraft.destinationLocation?.detail ||
      initialDraft.destinationLocation?.name ||
      "",
  );

  const [destinationLocation, setDestinationLocation] = useState(
    initialDraft.destinationLocation || null,
  );

  const [destinationRegionId, setDestinationRegionId] = useState("");

  const [menuOpen, setMenuOpen] = useState(false);

  const [customDestination, setCustomDestination] = useState("");

  const [departureLocation, setDepartureLocation] = useState(
    initialDraft.departureLocation || null,
  );

  const [departureRegionId, setDepartureRegionId] = useState("");

  const [departureMenuOpen, setDepartureMenuOpen] = useState(false);

  const [customDeparture, setCustomDeparture] = useState("");

  const [prompt, setPrompt] = useState(initialDraft.prompt || "");

  const [startDate, setStartDate] = useState(initialDraft.startDate || today);

  const [endDate, setEndDate] = useState(initialDraft.endDate || "");

  const [startTime, setStartTime] = useState(initialDraft.startTime || "09:00");

  const [endTime, setEndTime] = useState(initialDraft.endTime || "18:00");

  const [manualTimeConfirmed, setManualTimeConfirmed] = useState(false);

  const [ticketLeg, setTicketLeg] = useState("outbound");

  const [outboundTicketId, setOutboundTicketId] = useState("");

  const [returnTicketId, setReturnTicketId] = useState("");

  const [travelers, setTravelers] = useState(initialTravelerCount);

  const [travelerInput, setTravelerInput] = useState(
    initialTravelerCount == null ? "" : String(initialTravelerCount),
  );

  const [travelerPromptOpen, setTravelerPromptOpen] = useState(false);

  const [budget, setBudget] = useState(initialDraft.budget || 900000);

  const [pace, setPace] = useState(initialDraft.pace || "보통");

  const [themes, setThemes] = useState(() =>
    normalizeThemes(initialDraft.themes || ["맛집", "관광"]),
  );

  const [foodPreferences, setFoodPreferencesState] = useState(() =>
    normalizeFoodPreferences(initialDraft.foodPreferences),
  );

  const setFoodPreferences = useCallback((nextValue) => {
    setFoodPreferencesState((current) =>
      normalizeFoodPreferences(
        typeof nextValue === "function" ? nextValue(current) : nextValue,
      ),
    );
  }, []);

  useEffect(() => {
    try {
      const currentDraft = JSON.parse(
        window.localStorage.getItem("tripDraft") || "{}",
      );
      window.localStorage.setItem(
        "tripDraft",

        JSON.stringify({
          ...(currentDraft && typeof currentDraft === "object"
            ? currentDraft
            : {}),
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
  }, [
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
  ]);

  const resetTripDraft = () => {
    try {
      window.localStorage.removeItem("tripDraft");
    } catch {
      // no-op
    }

    window.location.reload();
  };

  const [heroSlideIndex, setHeroSlideIndex] = useState(0);

  const [transportPromptReady, setTransportPromptReady] = useState(false);

  const [jejuBaseArea, setJejuBaseArea] = useState("");

  const [jejuCustomArea, setJejuCustomArea] = useState("");

  const [jejuAreaModalOpen, setJejuAreaModalOpen] = useState(false);

  const [jejuRegionGuideOpen, setJejuRegionGuideOpen] = useState(false);

  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const slideTimer = window.setInterval(
      () => setHeroSlideIndex((current) => (current + 1) % heroSlides.length),

      4000,
    );

    return () => window.clearInterval(slideTimer);
  }, []);

  useEffect(() => {
    if (
      destinationLocation &&
      departureLocation &&
      endDate &&
      transportPromptReady
    ) {
      setTransportStep("mode");

      setTransportModalOpen(true);

      setTransportPromptReady(false);
    }
  }, [departureLocation, destinationLocation, endDate, transportPromptReady]);

  useEffect(() => {
    if (!jejuAreaModalOpen) {
      return;
    }

    setJejuAreaModalOpen(false);

    setJejuRegionGuideOpen(true);
  }, [jejuAreaModalOpen]);

  const [transport, setTransport] = useState(initialDraft.transport || "");

  const [localTransport, setLocalTransport] = useState(
    initialDraft.localTransport || "",
  );

  const [carType, setCarType] = useState(initialDraft.carType || "세단");

  const [carFuel, setCarFuel] = useState(initialDraft.carFuel || "휘발유");

  const [transportModalOpen, setTransportModalOpen] = useState(false);

  const [transportStep, setTransportStep] = useState("mode");

  const {
    origin,
    setOrigin,
    flightId,
    setFlightId,
    returnFlightId,
    setReturnFlightId,
    flightSearchResult,
    setFlightSearchResult,
    flightLoading,
    flightError,
    setFlightError,
    loadFlightOptions,
    invalidateFlightOptions,
  } = useFlightOptions({
    initialBookingSelection,
    departureLocation,
    destinationLocation,
    startDate,
    endDate,
    travelers,
    notify,
  });

  const [flightOpen, setFlightOpen] = useState(false);

  const [flightPickerLeg, setFlightPickerLeg] = useState("outbound");

  const [flightTransitionOpen, setFlightTransitionOpen] = useState(false);

  const [flightSort, setFlightSort] = useState("recommended");

  const [rentalOpen, setRentalOpen] = useState(false);

  const [rentalId, setRentalId] = useState(
    initialBookingSelection.rental?.id || "",
  );

  const [restoredRental, setRestoredRental] = useState(
    initialBookingSelection.rental || null,
  );

  const [preferenceModalOpen, setPreferenceModalOpen] = useState(false);

  const [stayTransitionOpen, setStayTransitionOpen] = useState(false);

  const [budgetConfirmationOpen, setBudgetConfirmationOpen] = useState(false);

  const [planPromptOpen, setPlanPromptOpen] = useState(false);

  const [budgetStatus, setBudgetStatus] = useState(null);

  const [stayOpen, setStayOpen] = useState(false);

  const {
    stayCatalog,
    setStayCatalog,
    stayLoading,
    stayError,
    setStayError,
    stayId,
    setStayId,
    loadStayOptions,
    invalidateStayOptions,
  } = useStayOptions({
    initialBookingSelection,
    destinationLocation,
    stayOpen,
    notify,
  });

  const [stayArea, setStayArea] = useState("전체");

  const [stayCustomArea, setStayCustomArea] = useState("");

  const [priceBand, setPriceBand] = useState("all");

  useEffect(() => {
    try {
      const savedDraft = JSON.parse(
        window.localStorage.getItem("tripDraft") || "{}",
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
  }, [transport, localTransport, carType, carFuel]);

  const [staySearch, setStaySearch] = useState("");

  const [staySort, setStaySort] = useState("review");

  const [stayChange, setStayChange] = useState(null);

  const [stayChangePromptOpen, setStayChangePromptOpen] = useState(false);

  const [stayChangeCompareOpen, setStayChangeCompareOpen] = useState(false);

  const [showPlan, setShowPlan] = useState(false);

  const [planViewOpen, setPlanViewOpen] = useState(false);

  const [planning, setPlanning] = useState(false);

  const [quickEditTarget, setQuickEditTarget] = useState("");

  const [planningStage, setPlanningStage] = useState("calculating");

  const [planningMode, setPlanningMode] = useState("create");

  const [planRevision, setPlanRevision] = useState(1);

  const [activeDay, setActiveDay] = useState(0);

  const [planEdits, setPlanEdits] = useState({});

  const [planOrders, setPlanOrders] = useState({});

  const [planCustomizations, setPlanCustomizations] = useState({});

  const [backendPlan, setBackendPlan] = useState(null);

  // 일정 생성 버튼을 누르기 직전에 안내한 금액을 보존합니다.
  // 백엔드가 일부 가격 항목을 생략해도 생성 전후 총액이 갑자기 낮아지지 않습니다.
  const [announcedPlanEstimate, setAnnouncedPlanEstimate] = useState(0);

  // ── 02. 서버 결과와 생성 중 요청을 추적합니다. 뒤늦은 응답/중복 생성을 주의합니다. ──
  const backendPlanRef = useRef(null);

  const generationInFlightRef = useRef(false);

  useEffect(() => {
    backendPlanRef.current = backendPlan;
  }, [backendPlan]);

  useEffect(() => {
    if (!stayOpen) {
      return;
    }

    const hasDestinationAnchor =
      destinationLocation?.regionCode === "KR-49" &&
      Number.isFinite(destinationLocation?.latitude) &&
      Number.isFinite(destinationLocation?.longitude);

    setStayArea(
      hasDestinationAnchor
        ? `${destinationLocation.detail || destinationLocation.name} 인근`
        : "전체",
    );

    setPriceBand("all");

    setStaySearch("");

    setStayCustomArea("");
  }, [destinationLocation, stayOpen]);

  const isJeju = destinationLocation?.regionCode === "KR-49";

  const hasDomesticDestination = destinationLocation?.countryCode === "KR";

  const destinationAirport =
    destinationLocation?.airportCode ||
    destinationLocation?.airportCodes?.[0] ||
    (hasDomesticDestination ? "CJU" : "INTL");

  const outboundFlights = flightSearchResult.outboundFlights || [];

  const returnFlights = flightSearchResult.returnFlights || [];

  const selectedOutboundFlight = outboundFlights.find(
    (flight) => String(flight.id) === String(flightId),
  );

  const selectedReturnFlight = returnFlights.find(
    (flight) => String(flight.id) === String(returnFlightId),
  );

  const selectedFlight = useMemo(() => {
    if (
      transport !== "FLIGHT" ||
      !selectedOutboundFlight ||
      !selectedReturnFlight
    ) {
      return null;
    }

    const outboundFare =
      Number(selectedOutboundFlight.estimatedPricePerPerson) || 0;

    const returnFare =
      Number(selectedReturnFlight.estimatedPricePerPerson) || 0;

    const fare = outboundFare + returnFare;

    return {
      id: `${selectedOutboundFlight.id}-` + `${selectedReturnFlight.id}`,

      origin:
        flightSearchResult.departureAirport ||
        selectedOutboundFlight.departureAirport ||
        origin,

      originName:
        departureLocation?.detail ||
        departureLocation?.name ||
        departureLocation?.region ||
        "출발지",

      originCity:
        departureLocation?.region || departureLocation?.detail || "출발지",

      destination:
        flightSearchResult.arrivalAirport ||
        selectedOutboundFlight.arrivalAirport ||
        destinationAirport,

      airline:
        selectedOutboundFlight.airline === selectedReturnFlight.airline
          ? selectedOutboundFlight.airline
          : `${selectedOutboundFlight.airline} · ${selectedReturnFlight.airline}`,

      code:
        `${selectedOutboundFlight.flightNumber || selectedOutboundFlight.code} · ` +
        `${selectedReturnFlight.flightNumber || selectedReturnFlight.code}`,

      out: flightTimeLabel(selectedOutboundFlight),

      back: flightTimeLabel(selectedReturnFlight),

      fare,

      originalFare: fare,

      discount: 0,

      seats: null,

      priceType: "ESTIMATED",

      isMock: false,
    };
  }, [
    transport,
    origin,
    destinationAirport,
    departureLocation,
    flightSearchResult.departureAirport,
    flightSearchResult.arrivalAirport,
    selectedOutboundFlight,
    selectedReturnFlight,
  ]);

  /*
   * 렌터카는 아직 mock 유지.
   */
  const rentalCatalog = useMemo(
    () => demoRentalsForLocation(destinationLocation),
    [destinationLocation],
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
    if (
      firstVisible.some((rental) =>
        rental.image?.includes("commons.wikimedia.org"),
      )
    ) {
      preconnect("https://commons.wikimedia.org");
      preconnect("https://upload.wikimedia.org");
    }
  }, [flightOpen, rentalOpen, rentalCatalog]);

  const selectedRental =
    rentalCatalog.find((rental) => String(rental.id) === String(rentalId)) ||
    restoredRental;

  /*
   * 숙소는 실제 API 결과에서 선택.
   */
  const selectedStay = stayCatalog.find(
    (stay) => String(stay.id) === String(stayId),
  );

  /*
   * 사용자가 확정한 예약 선택은 검색 결과 배열과 별도로 보존한다.
   * 같은 여행 조건에서 API 목록이 재조회되거나 화면이 다시 열려도
   * 선택한 항공편과 숙소가 후보 목록에서 사라지지 않는다.
   */
  useEffect(() => {
    try {
      const currentDraft = JSON.parse(
        window.localStorage.getItem("tripDraft") || "{}",
      );
      const bookingSelection = {
        outboundFlight: selectedOutboundFlight || null,
        returnFlight: selectedReturnFlight || null,
        rental: selectedRental || null,
        stay: selectedStay || null,
      };

      window.localStorage.setItem(
        "tripDraft",
        JSON.stringify({
          ...(currentDraft && typeof currentDraft === "object"
            ? currentDraft
            : {}),
          bookingSelection,
        }),
      );
    } catch {
      // 저장소가 차단되어도 현재 세션의 선택 상태는 계속 유지한다.
    }
  }, [
    selectedOutboundFlight,
    selectedReturnFlight,
    selectedRental,
    selectedStay,
  ]);

  const dates = getDates(startDate, endDate);

  const nights = Math.max(1, dates.length - 1);

  const party = travelers || 1;

  const rooms = selectedStay ? Math.ceil(party / 3) : 0;

  const routeDistanceKm = distanceBetween(
    departureLocation,
    destinationLocation,
  );

  const estimatedCarMinutes = Math.max(
    15,

    Math.round(((routeDistanceKm * 1.25) / 65) * 60),
  );

  const ticketOptions = useMemo(
    () => makeDemoTicketOptions(transport, routeDistanceKm),
    [transport, routeDistanceKm],
  );

  const selectedOutboundTicket = ticketOptions.find(
    (ticket) => ticket.id === outboundTicketId,
  );

  const selectedReturnTicket = ticketOptions.find(
    (ticket) => ticket.id === returnTicketId,
  );

  const selectedTicket = useMemo(
    () =>
      transport === "FLIGHT"
        ? selectedFlight
        : selectedOutboundTicket && selectedReturnTicket
          ? {
              id:
                `${selectedOutboundTicket.id}-` + `${selectedReturnTicket.id}`,

              mode: transport,

              name: transportName(transport, outboundOptions),

              out: selectedOutboundTicket.out,

              back: selectedReturnTicket.back,

              fare: selectedOutboundTicket.fare + selectedReturnTicket.fare,

              isMock: true,
            }
          : null,
    [transport, selectedFlight, selectedOutboundTicket, selectedReturnTicket],
  );

  const tripSchedule = resolveTripSchedule({
    mode: transport,

    ticket: selectedTicket,

    startTime,
    endTime,
    startDate,
    endDate,

    manualConfirmed: manualTimeConfirmed,

    carMinutes: estimatedCarMinutes,
  });

  const scheduledStartTime = tripSchedule.ready
    ? tripSchedule.departureTime
    : "";

  const scheduledArrivalTime = tripSchedule.ready
    ? tripSchedule.arrivalTime
    : "";

  const scheduledEndTime = tripSchedule.ready ? tripSchedule.endTime : "";

  const baseDayPlans = useMemo(
    () =>
      backendPlan?.dayPlans?.length
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

  const dayPlans = useMemo(
    () =>
      applyPlanCustomizations(
        applyPlanOrders(
          applyPlanEdits(baseDayPlans, planEdits),
          planOrders,
          localTransport,
        ),
        planCustomizations,
        localTransport,
      ),
    [baseDayPlans, planEdits, planOrders, planCustomizations, localTransport],
  );

  const placeEditAdjustment = Object.entries(planEdits).reduce(
    (sum, [key, place]) => {
      const [dayIndex, stopIndex] = key.split("-").map(Number);

      const originalName = baseDayPlans[dayIndex]?.[2]?.[stopIndex]?.[2] || "";

      return sum + placeEntryCost(place.name) - placeEntryCost(originalName);
    },
    0,
  );

  const currentFlightOptions =
    flightPickerLeg === "outbound" ? outboundFlights : returnFlights;

  const displayFlights = [...currentFlightOptions].sort((a, b) => {
    if (flightSort === "price") {
      return (
        (Number(a.estimatedPricePerPerson) || 0) -
        (Number(b.estimatedPricePerPerson) || 0)
      );
    }

    if (flightSort === "time") {
      return String(a.departureTime || "").localeCompare(
        String(b.departureTime || ""),
      );
    }

    const tenAm = 10 * 60;

    return (
      Math.abs(flightDepartureClockMinutes(a) - tenAm) -
        Math.abs(flightDepartureClockMinutes(b) - tenAm) ||
      flightDurationMinutes(a) - flightDurationMinutes(b) ||
      (Number(a.estimatedPricePerPerson) || 0) -
        (Number(b.estimatedPricePerPerson) || 0)
    );
  });

  /*
   * 기존 App.jsx 호환.
   */
  const saleFirstFlights = displayFlights;

  const nearbyStayArea =
    isJeju &&
    Number.isFinite(destinationLocation?.latitude) &&
    Number.isFinite(destinationLocation?.longitude)
      ? `${destinationLocation.detail || destinationLocation.name} 인근`
      : null;

  const stayAreas = [
    nearbyStayArea,
    "전체",

    ...new Set(stayCatalog.map((stay) => stay.area)),
  ].filter(Boolean);

  /*
   * priceAvg는 일부 null 가능.
   *
   * 전체 보기에서는 null 숙소도 보여주고,
   * 가격대 필터를 걸었을 때만 제외.
   */
  const isInPriceBand = (priceAvg) => {
    if (priceBand === "all") {
      return true;
    }

    if (!Number.isFinite(priceAvg)) {
      return false;
    }

    if (priceBand === "0-5") {
      return priceAvg < 50000;
    }

    if (priceBand === "5-10") {
      return priceAvg >= 50000 && priceAvg < 100000;
    }

    if (priceBand === "10-20") {
      return priceAvg >= 100000 && priceAvg < 200000;
    }

    if (priceBand === "20-30") {
      return priceAvg >= 200000 && priceAvg < 300000;
    }

    if (priceBand === "30+") {
      return priceAvg >= 300000;
    }

    return true;
  };

  const filteredStays = stayCatalog
    .filter(
      (stay) =>
        isInPriceBand(stay.priceAvg) &&
        (stayArea === "전체" ||
          stayArea === nearbyStayArea ||
          stayArea === "기타 지역" ||
          stay.area === stayArea) &&
        stay.name.toLowerCase().includes(staySearch.toLowerCase()),
    )
    .sort((a, b) => {
      /*
       * 목적지 인근 정렬.
       */
      if (stayArea === nearbyStayArea) {
        return (
          (a.distanceKm ?? Number.POSITIVE_INFINITY) -
          (b.distanceKm ?? Number.POSITIVE_INFINITY)
        );
      }

      /*
       * 가격순.
       * priceAvg null은 뒤로.
       */
      if (staySort === "price") {
        if (a.priceAvg == null && b.priceAvg == null) {
          return 0;
        }

        if (a.priceAvg == null) {
          return 1;
        }

        if (b.priceAvg == null) {
          return -1;
        }

        return a.priceAvg - b.priceAvg;
      }

      /*
       * 기본 평점순.
       */
      return (
        Number(b.rating ?? 0) - Number(a.rating ?? 0) ||
        (b.reviewCount ?? 0) - (a.reviewCount ?? 0)
      );
    });

  const {
    intercityTransportTotal,
    costForEvent,
    foodTotal,
    activityTotal,
    stayTotal,
    driveTotal,
    total,
    reconciledCostDetails,
    confirmedTotal,
    confirmedInBudget,
    gap,
    inBudget,
  } = useTripCostEstimate({
    destinationLocation,
    departureLocation,
    budget,
    transport,
    localTransport,
    carType,
    carFuel,
    budgetStatus,
    planEdits,
    backendPlan,
    announcedPlanEstimate,
    selectedFlight,
    selectedRental,
    selectedStay,
    nights,
    party,
    rooms,
    routeDistanceKm,
    selectedTicket,
    baseDayPlans,
    dayPlans,
    placeEditAdjustment,
  });

  // ── 03. 입력 변경과 예약 선택의 의존성을 조율합니다. 조회는 전용 훅이 담당합니다. ──
  const submitPrompt = () => {
    if (!prompt.trim()) {
      return notify("원하는 여행을 한 문장으로 적어주세요.");
    }

    notify("지정한 관광지의 방문 일차를 일정 생성에 반영할게요.");
  };

  const resetRouteBookings = () => {
    invalidateFlightOptions();
    invalidateStayOptions();
    try {
      const currentDraft = JSON.parse(
        window.localStorage.getItem("tripDraft") || "{}",
      );
      window.localStorage.setItem(
        "tripDraft",
        JSON.stringify({
          ...(currentDraft && typeof currentDraft === "object"
            ? currentDraft
            : {}),
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

    setFlightId("");

    setReturnFlightId("");

    setFlightSearchResult({
      departureAirport: "",

      arrivalAirport: "",

      outboundFlights: [],

      returnFlights: [],
    });

    setFlightError("");

    setOutboundTicketId("");

    setReturnTicketId("");

    setManualTimeConfirmed(false);

    setRentalId("");

    setRestoredRental(null);

    setStayId("");

    setStayCatalog([]);

    setStayError("");

    setTransport("");

    setLocalTransport("");

    setPlanEdits({});

    setPlanOrders({});

    setPlanCustomizations({});

    setBackendPlan(null);
  };

  const chooseDepartureDistrict = (region, district) => {
    const nextDepartureLocation = {
      ...district,

      region: region.name || region.region,

      name: district.name || district.detail,

      detail: district.detail || district.name,

      airportCode:
        district.airportCode ||
        district.airportCodes?.[0] ||
        region.airportCode ||
        "GMP",
    };
    const departureChanged =
      String(departureLocation?.id || "") !==
        String(nextDepartureLocation.id || "") ||
      String(departureLocation?.detail || departureLocation?.name || "") !==
        String(
          nextDepartureLocation.detail || nextDepartureLocation.name || "",
        );

    setDepartureLocation(nextDepartureLocation);

    setDepartureRegionId(region.id);

    setDepartureMenuOpen(false);

    setOrigin(
      district.airportCode ||
        district.airportCodes?.[0] ||
        region.airportCode ||
        "GMP",
    );

    if (departureChanged) resetRouteBookings();

    setTransportPromptReady(false);

    notify(
      `${region.name || region.region} ${
        district.detail || district.name
      } 출발을 저장했어요. 날짜와 이동수단을 이어서 선택해 주세요.`,
    );
  };

  const useCurrentDepartureLocation = () => {
    const geolocation = window.navigator?.geolocation;

    if (!geolocation) {
      notify(
        "이 브라우저에서는 현재 위치를 사용할 수 없어요. 권역 또는 주소로 선택해 주세요.",
      );

      return;
    }

    notify("현재 위치를 확인하고 있어요.");

    geolocation.getCurrentPosition(
      ({ coords }) => {
        const closest = koreanRegions
          .flatMap((region) =>
            region.districts.map((district) => ({
              region,
              district,
            })),
          )
          .reduce((best, candidate) => {
            const latitudeGap = candidate.district.latitude - coords.latitude;

            const longitudeGap =
              (candidate.district.longitude - coords.longitude) * 0.8;

            const distance = latitudeGap ** 2 + longitudeGap ** 2;

            return !best || distance < best.distance
              ? {
                  ...candidate,
                  distance,
                }
              : best;
          }, null);

        const region = closest?.region;

        const district = closest?.district;

        const airportCode =
          district?.airportCode ||
          district?.airportCodes?.[0] ||
          region?.airportCode ||
          "GMP";

        setDepartureLocation({
          ...(district || {}),

          id: `gps-${Date.now()}`,

          countryCode: "KR",

          region: region?.name || "현재 위치",

          name: "현재 위치",

          detail: "현재 위치",

          latitude: coords.latitude,

          longitude: coords.longitude,

          airportCode,

          airportCodes: district?.airportCodes ||
            region?.airportCodes || [airportCode],

          apiSearchKeyword: district?.apiSearchKeyword || "현재 위치",

          needsGeocoding: false,

          needsReverseGeocoding: true,

          locationSource: "gps",
        });

        setDepartureRegionId(region?.id || "");

        setDepartureMenuOpen(false);

        setOrigin(airportCode);

        resetRouteBookings();

        setTransportPromptReady(false);

        notify("현재 GPS 좌표를 출발지로 저장했어요.");
      },

      () => notify("현재 위치 권한을 허용한 뒤 다시 시도해 주세요."),

      {
        enableHighAccuracy: true,

        timeout: 10000,

        maximumAge: 120000,
      },
    );
  };

  const chooseCustomDeparture = () => {
    const detail = customDeparture.trim();

    if (!detail) {
      return notify("출발할 지역을 입력해 주세요.");
    }

    setDepartureLocation({
      id: `custom-departure-${detail}`,

      region: detail,

      detail,

      countryCode: "KR",

      regionCode: null,

      latitude: null,

      longitude: null,

      airportCode: "GMP",

      airportCodes: ["GMP", "ICN"],

      needsGeocoding: true,
    });

    setDepartureRegionId("");

    setCustomDeparture("");

    setDepartureMenuOpen(false);

    setOrigin("GMP");

    resetRouteBookings();

    setTransportPromptReady(false);

    notify(`${detail} 출발 정보를 저장했어요.`);
  };

  const chooseDestination = (placeInput) => {
    const selection =
      typeof placeInput === "string"
        ? {
            title: placeInput,
          }
        : placeInput || {};

    const place =
      selection.lookupName ||
      selection.title ||
      selection.name ||
      selection.detail;

    if (!place) {
      return notify("도착지를 선택해 주세요.");
    }

    const catalogLocation =
      destinationCoordinatesByName[place] ||
      destinationCoordinatesByName[selection.title];

    const suppliedLocation = selection.location || selection;

    const hasStructuredLocation = Boolean(
      suppliedLocation.regionCode ||
      (Number.isFinite(suppliedLocation.latitude) &&
        Number.isFinite(suppliedLocation.longitude)),
    );

    const locationBase = hasStructuredLocation
      ? suppliedLocation
      : catalogLocation;

    const displayName =
      selection.title || selection.name || locationBase?.detail || place;

    const nextLocation = locationBase
      ? {
          ...locationBase,

          id: locationBase.id || `custom-destination-${displayName}`,

          countryCode:
            locationBase.countryCode || selection.countryCode || "KR",

          region: locationBase.region || selection.region || displayName,

          name: locationBase.name || selection.name || displayName,

          detail: locationBase.detail || selection.detail || displayName,

          image: selection.image || locationBase.image,

          apiSearchKeyword:
            locationBase.apiSearchKeyword ||
            selection.apiSearchKeyword ||
            displayName,

          needsGeocoding: Boolean(locationBase.needsGeocoding),
        }
      : {
          id: `custom-destination-${displayName}`,

          countryCode:
            selection.countryCode ||
            (selection.scope === "overseas" || destinationType === "해외"
              ? "INTL"
              : "KR"),

          regionCode: null,

          region: displayName,

          name: displayName,

          detail: displayName,

          latitude: null,

          longitude: null,

          airportCodes: [],

          apiSearchKeyword: displayName,

          needsGeocoding: true,
        };

    const destinationChanged =
      String(destinationLocation?.id || "") !== String(nextLocation.id || "") ||
      String(destinationLocation?.detail || destinationLocation?.name || "") !==
        String(nextLocation.detail || nextLocation.name || "");

    const matchedRegion = koreanRegions.find(
      (region) => region.regionCode === nextLocation.regionCode,
    );

    setDestination(displayName);

    setDestinationLocation(nextLocation);

    setDestinationType(nextLocation.countryCode === "KR" ? "국내" : "해외");

    setDestinationRegionId(matchedRegion?.id || "");

    setMenuOpen(false);

    setJejuBaseArea(
      nextLocation.regionCode === "KR-49" ? nextLocation.detail : "",
    );

    setStayArea(
      nextLocation.regionCode === "KR-49" ? nextLocation.detail : "전체",
    );

    if (destinationChanged) resetRouteBookings();

    setTransportPromptReady(Boolean(endDate && travelers && departureLocation));

    if (!travelers) {
      setTravelerPromptOpen(true);
    }

    notify(
      `${nextLocation.region} ${nextLocation.detail} 도착지를 저장했어요.`,
    );
  };

  const chooseJejuBaseArea = (area, linkedStayArea = area) => {
    const option = jejuRegionOptions.find((item) => item.area === area);

    setJejuBaseArea(area);

    setDestinationLocation({
      ...(jejuRegionCoordinates[area] || {
        id: `jeju-custom-${area}`,

        region: "제주특별자치도",

        detail: area,

        latitude: null,

        longitude: null,

        needsGeocoding: true,
      }),

      image: option?.image || jejuCoastPhoto,
    });

    setStayArea(linkedStayArea);

    setStaySearch("");

    setJejuAreaModalOpen(false);

    setJejuRegionGuideOpen(false);

    setTransportPromptReady(Boolean(endDate && travelers && departureLocation));

    if (!travelers) {
      setTravelerPromptOpen(true);
    }

    notify(`${area} 여행을 기준으로 숙소와 동선을 추천할게요.`);
  };

  const chooseJejuCustomArea = () => {
    const area = jejuCustomArea.trim();

    if (!area) {
      return notify("방문하고 싶은 제주 세부지역을 입력해 주세요.");
    }

    chooseJejuBaseArea(area, "기타 지역");

    setJejuCustomArea("");
  };

  const chooseCustomDestination = () => {
    const place = customDestination.trim();

    if (!place) {
      return;
    }

    chooseDestination(place);

    setCustomDestination("");
  };

  const askAiForDestination = () => {
    setPrompt(
      (current) => current.trim() || "여행 취향에 맞는 여행지를 추천해 주세요.",
    );

    setMenuOpen(false);

    setDestinationRegionId("");

    window.setTimeout(
      () => document.getElementById("prompt")?.focus(),

      0,
    );

    notify("메인 자유 입력창에 AI 추천 요청을 넣었어요.");
  };

  const commitTravelers = () => {
    if (!travelerInput.trim()) {
      setTravelers(null);

      return;
    }

    const next = Math.min(
      20,

      Math.max(
        1,

        Math.floor(Number(travelerInput)) || 1,
      ),
    );

    setTravelerInput(String(next));

    setTravelers(next);
  };

  const confirmTravelers = () => {
    if (!travelerInput.trim()) {
      return notify("여행 인원을 입력해 주세요.");
    }

    commitTravelers();

    setTravelerPromptOpen(false);
  };

  const toggleTheme = (theme) =>
    setThemes((current) => {
      if (current.includes(theme)) {
        return current.filter((item) => item !== theme);
      }

      if (current.length >= MAX_PREFERENCE_SELECTIONS) {
        notify("여행 테마는 최대 3개까지 선택할 수 있어요.");

        return current;
      }

      return [...current, theme];
    });

  const beginOriginQuestion = () => {
    if (!travelers) {
      setTravelerPromptOpen(true);

      return;
    }

    if (!departureLocation) {
      setDepartureMenuOpen(true);

      return notify("출발지를 먼저 선택해 주세요.");
    }

    if (!destinationLocation) {
      setMenuOpen(true);

      return notify("도착지와 세부지역을 먼저 선택해 주세요.");
    }

    if (!endDate) {
      return notify("출발일과 귀국일을 먼저 선택해 주세요.");
    }

    setTransportStep("mode");

    setTransportModalOpen(true);
  };

  const chooseTransportMode = (mode) => {
    if (isJeju && ["KTX", "BUS"].includes(mode)) {
      return notify("제주까지는 철도·버스 직행편이 없어요.");
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

    setTransport(mode);

    if (mode === "FLIGHT") {
      setFlightPickerLeg("outbound");

      setTransportModalOpen(false);

      setFlightOpen(true);

      void loadFlightOptions();

      return;
    }

    if (mode === "CAR") {
      setLocalTransport("CAR");

      setTransportStep("manual-time");

      return;
    }

    setTicketLeg("outbound");

    setTransportStep("tickets");
  };

  const confirmManualTimes = ({
    startTime: nextStart,

    endTime: nextEnd,
  }) => {
    const schedule = resolveTripSchedule({
      mode: "CAR",

      startTime: nextStart,

      endTime: nextEnd,

      startDate,
      endDate,

      manualConfirmed: true,

      carMinutes: estimatedCarMinutes,
    });

    if (!schedule.ready) {
      return schedule.reason;
    }

    setStartTime(nextStart);

    setEndTime(nextEnd);

    setManualTimeConfirmed(true);

    setTransportStep("car-detail");

    return null;
  };

  const chooseTicket = (id) => {
    const ticket = ticketOptions.find((item) => item.id === id);

    if (!ticket) {
      return;
    }

    if (ticketLeg === "outbound") {
      setOutboundTicketId(id);

      setReturnTicketId("");

      setTicketLeg("return");

      return;
    }

    const schedule = resolveTripSchedule({
      mode: transport,

      ticket: {
        out: selectedOutboundTicket?.out,

        back: ticket.back,
      },

      startDate,
      endDate,
    });

    if (!schedule.ready) {
      return notify(schedule.reason);
    }

    setReturnTicketId(id);

    setTransportStep("local");
  };

  const confirmTravelDates = ({
    startDate: nextStartDate,

    endDate: nextEndDate,
  }) => {
    if (nextStartDate === startDate && nextEndDate === endDate) {
      return;
    }

    setStartDate(nextStartDate);

    setEndDate(nextEndDate);

    resetRouteBookings();

    setShowPlan(false);

    setPlanViewOpen(false);

    setTransportPromptReady(
      Boolean(destinationLocation && travelers && departureLocation),
    );

    notify("여행 날짜를 반영했어요.");
  };

  const chooseLocal = (mode) => {
    setLocalTransport(mode);

    setTransportModalOpen(false);

    if (mode === "RENTAL") {
      setRentalOpen(true);
    } else {
      setStayOpen(true);
    }
  };

  const completeCarDetails = () => {
    setTransport("CAR");

    setLocalTransport("CAR");

    setTransportModalOpen(false);

    setStayOpen(true);

    notify(`${carType} · ${carFuel} 기준으로 유류비를 계산할게요.`);
  };

  const chooseFlight = (id) => {
    if (flightPickerLeg === "outbound") {
      const outboundFlight = outboundFlights.find((flight) => flight.id === id);

      if (!outboundFlight) {
        return;
      }

      setFlightId(id);

      setReturnFlightId("");

      setFlightOpen(false);

      setFlightTransitionOpen(true);

      return;
    }

    const returnFlight = returnFlights.find((flight) => flight.id === id);

    if (!returnFlight || !selectedOutboundFlight) {
      return;
    }

    const schedule = resolveTripSchedule({
      mode: "FLIGHT",

      ticket: {
        out: flightTimeLabel(selectedOutboundFlight),

        back: flightTimeLabel(returnFlight),
      },

      startDate,
      endDate,
    });

    if (!schedule.ready) {
      return notify(schedule.reason);
    }

    setReturnFlightId(id);

    setFlightOpen(false);

    if (quickEditTarget === "flight") {
      setQuickEditTarget("");

      notify("왕복 항공편 변경이 반영됐어요.");

      return;
    }

    setTransportStep("local");

    setTransportModalOpen(true);
  };

  const chooseRental = (id) => {
    setRentalId(id);

    setRestoredRental(null);

    setRentalOpen(false);

    if (showPlan || quickEditTarget === "rental") {
      setQuickEditTarget("");

      notify("렌터카 선택이 반영됐어요.");

      return;
    }

    setStayOpen(true);
  };

  /*
   * 숙소 선택 후 총비용 계산도 priceAvg 기준.
   */
  const estimateTotalWithStay = (stay) => {
    const nextRooms = Math.ceil(party / 3);

    const nextStayTotal =
      stay?.priceAvg != null ? (stay.priceAvg * nights * nextRooms) / party : 0;

    return (
      intercityTransportTotal +
      nextStayTotal +
      driveTotal +
      foodTotal +
      activityTotal
    );
  };

  const chooseStay = (id) => {
    const stay = stayCatalog.find((item) => item.id === id);

    if (!stay) {
      return;
    }

    const previousStay = selectedStay;

    const nextTotal = estimateTotalWithStay(stay);

    setStayId(id);

    setQuickEditTarget("");

    setPlanEdits({});

    setPlanOrders({});

    setPlanCustomizations({});

    setStayOpen(false);

    if (showPlan) {
      const didChangeStay = Boolean(
        previousStay && previousStay.id !== stay.id,
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
      total: nextTotal,

      inBudget: budget >= nextTotal,

      stay,
    });

    // 숙소 선택 직후에는 식비/취향이 아직 확정되지 않으므로 중간 예산 팝업을 띄우지 않는다.
    setPreferenceModalOpen(true);
    notify("숙소까지 반영했어요. 이제 여행 테마와 선호 음식을 선택해 주세요.");
  };

  const openQuickEdit = (target) => {
    if (target === "dates") {
      notify("날짜를 다시 선택해 주세요.");

      return;
    }

    if (target === "flight") {
      if (!startDate || !endDate) {
        return notify("출발일과 귀국일을 먼저 선택해 주세요.");
      }

      setQuickEditTarget("flight");

      setFlightPickerLeg("outbound");

      setFlightOpen(true);

      return;
    }

    if (target === "rental") {
      setQuickEditTarget("rental");

      setLocalTransport("RENTAL");

      setRentalOpen(true);

      return;
    }

    if (target === "stay") {
      setQuickEditTarget("stay");

      setStayArea(jejuBaseArea || "전체");

      setStayOpen(true);
    }
  };

  const focusBookingPrerequisite = (target) => {
    const targetName =
      {
        transport: "교통수단",

        flight: "항공편",

        rental: "렌터카",

        stay: "숙소",
      }[target] || "비교 항목";

    if (!departureLocation) {
      setDepartureMenuOpen(true);

      notify(`${targetName} 비교 전에 출발지를 먼저 선택해 주세요.`);

      return false;
    }

    if (!destinationLocation) {
      setMenuOpen(true);

      notify(`${targetName} 비교 전에 도착지를 먼저 선택해 주세요.`);

      return false;
    }

    if (!travelers) {
      setTravelerPromptOpen(true);

      notify(`${targetName} 견적을 위해 인원을 먼저 입력해 주세요.`);

      return false;
    }

    if (!startDate || !endDate) {
      notify(`${targetName} 비교 전에 날짜를 먼저 선택해 주세요.`);

      return false;
    }

    return true;
  };

  const openIndependentBooking = (target) => {
    if (!focusBookingPrerequisite(target)) {
      return;
    }

    if (target === "transport") {
      setTransportStep("mode");

      setTransportModalOpen(true);

      return;
    }

    if (target === "flight") {
      chooseTransportMode("FLIGHT");

      return;
    }

    if (target === "rental") {
      setLocalTransport("RENTAL");

      setRentalOpen(true);

      return;
    }

    if (target === "stay") {
      setStayArea(
        destinationLocation?.detail || destinationLocation?.region || "전체",
      );

      setStayOpen(true);
    }
  };

  const changePlanStop = (dayIndex, eventId, place) => {
    const stopIndex = baseDayPlans[dayIndex]?.[2]?.findIndex(
      (event) => event[6]?.id === eventId,
    );

    if (stopIndex == null || stopIndex < 0) {
      return;
    }

    setPlanEdits((current) => ({
      ...current,

      [`${dayIndex}-${stopIndex}`]: place,
    }));

    setPlanRevision((current) => current + 1);

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
      event[6]?.isLocked ? [index] : [],
    );
    const previousLocked = [...lockedIndexes]
      .reverse()
      .find((index) => index < sourceIndex);
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
      !event[6]?.isLocked && index >= segmentStart && index <= segmentEnd
        ? [index]
        : [],
    );
    const sourceRank = movableSlots.indexOf(sourceIndex);
    if (sourceRank < 0 || movableSlots.length < 2) return;

    const destinationRank = Math.max(
      0,
      Math.min(
        movableSlots.length - 1,
        movableSlots.reduce(
          (nearest, slot, rank) =>
            Math.abs(slot - destinationIndex) <
            Math.abs(movableSlots[nearest] - destinationIndex)
              ? rank
              : nearest,
          0,
        ),
      ),
    );
    if (sourceRank === destinationRank) return;

    const movableIds = movableSlots.map((index) =>
      planEventKey(events[index], dayIndex, index),
    );
    const [movedId] = movableIds.splice(sourceRank, 1);
    movableIds.splice(destinationRank, 0, movedId);

    const replacements = new Map(
      movableSlots.map((slot, rank) => [slot, movableIds[rank]]),
    );
    const order = events
      .map(
        (event, eventIndex) =>
          replacements.get(eventIndex) ||
          planEventKey(event, dayIndex, eventIndex),
      )
      .filter(Boolean);

    setPlanOrders((current) => ({ ...current, [dayIndex]: order }));
    setPlanRevision((current) => current + 1);

    notify(
      "순서를 변경했습니다. 저장하면 실제 이동시간과 경로를 다시 계산해요.",
    );
  };

  const removePlanStop = (dayIndex, eventId) => {
    const event = dayPlans[dayIndex]?.[2]?.find(
      (item, eventIndex) =>
        planEventKey(item, dayIndex, eventIndex) === eventId,
    );

    if (!event) return;
    if (event[6]?.isLocked) {
      notify(
        "항공·공항·렌터카·숙소처럼 예약과 연결된 일정은 삭제할 수 없어요.",
      );
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
    const stayMinutes = Math.max(
      20,
      Math.min(240, Number(draft.stayMinutes) || 60),
    );

    if (!name) throw new Error("추가할 장소 이름을 입력해 주세요.");

    let resolved = { name, type };
    const currentPlan = backendPlanRef.current;
    if (!isMockModeEnabled() && currentPlan?.id) {
      const matches = await searchPlanPlaces(currentPlan.id, type, name);
      const normalize = (value) =>
        String(value || "")
          .replace(/\s|·/g, "")
          .toLowerCase();
      resolved =
        matches.find(
          (candidate) => normalize(candidate.name) === normalize(name),
        ) ||
        matches[0] ||
        resolved;
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
    const normalize = (value) =>
      String(value || "")
        .replace(/\s|·/g, "")
        .toLowerCase();
    const exact = matches.find(
      (candidate) => normalize(candidate.name) === normalize(place.name),
    );
    const selected = exact || matches[0];

    if (!selected) {
      throw new Error(
        "데이터베이스에서 해당 장소를 찾지 못했습니다. 다른 장소를 선택해 주세요.",
      );
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

  // ── 04. 로컬 편집 초안을 서버 계약에 맞춰 저장합니다. ──
  const savePlanChanges = async () => {
    const currentPlan = backendPlanRef.current;
    const hasCustomChanges = Object.keys(planCustomizations).length > 0;
    const changed =
      Object.keys(planEdits).length > 0 ||
      Object.keys(planOrders).length > 0 ||
      hasCustomChanges;

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

  const itineraryEventCost = costForEvent;

  // ── 05. 여행 조건을 저장하고 비동기 일정 생성을 요청합니다. ──
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
    const effectiveStayTotal =
      effectiveStay?.priceAvg != null
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
      setDepartureMenuOpen(true);

      return notify("출발지를 먼저 선택해 주세요.");
    }

    if (!destinationLocation) {
      return notify("도착지와 세부지역을 먼저 선택해 주세요.");
    }

    const departureLatitude = Number(departureLocation.latitude);

    const departureLongitude = Number(departureLocation.longitude);

    const destinationLatitude = Number(destinationLocation.latitude);

    const destinationLongitude = Number(destinationLocation.longitude);

    if (
      !Number.isFinite(departureLatitude) ||
      !Number.isFinite(departureLongitude)
    ) {
      return notify("출발지 좌표를 확인할 수 없습니다.");
    }

    if (
      !Number.isFinite(destinationLatitude) ||
      !Number.isFinite(destinationLongitude)
    ) {
      return notify("도착지 좌표를 확인할 수 없습니다.");
    }

    if (!startDate || !endDate) {
      return notify("출발일과 귀국일을 선택해 주세요.");
    }

    if (!travelers) {
      return notify("총인원을 입력해 주세요.");
    }

    if (!transport || !localTransport) {
      return notify("출발 교통수단과 현지 교통수단을 선택해 주세요.");
    }

    if (
      transport === "FLIGHT" &&
      (!selectedOutboundFlight || !selectedReturnFlight)
    ) {
      return notify("가는 편과 오는 편 항공편을 모두 선택해 주세요.");
    }

    if (!tripSchedule.ready) {
      return notify(tripSchedule.reason);
    }

    if (!effectiveStay) {
      return notify("숙소를 선택해 주세요.");
    }

    const accommodationId = Number(
      effectiveStay.accommodationId ?? effectiveStay.id,
    );

    if (!Number.isInteger(accommodationId) || accommodationId <= 0) {
      return notify("선택한 숙소 정보를 다시 확인해 주세요.");
    }

    /*
     * ==========================================
     * 2. frontend 값 → backend enum 변환
     * ==========================================
     */

    const mainTransportMode = MAIN_TRANSPORT_MAP[transport];

    const localTransportMode = LOCAL_TRANSPORT_MAP[localTransport];

    const backendPace = PACE_MAP[pace];

    const backendFuelType =
      localTransportMode === "RENTAL_CAR" && selectedRental
        ? inferRentalFuelType(selectedRental)
        : localTransportMode === "OWN_CAR" || mainTransportMode === "OWN_CAR"
          ? VEHICLE_FUEL_TYPE_MAP[carFuel] || "GASOLINE"
          : null;

    const backendVehicleEfficiencyKmpl =
      localTransportMode === "RENTAL_CAR" && selectedRental
        ? inferRentalEfficiencyKmpl(selectedRental)
        : localTransportMode === "OWN_CAR" || mainTransportMode === "OWN_CAR"
          ? VEHICLE_EFFICIENCY_KMPL[carType] || 12.5
          : null;

    if (!mainTransportMode) {
      return notify("지원하지 않는 출발 교통수단입니다.");
    }

    if (!localTransportMode) {
      return notify("지원하지 않는 현지 교통수단입니다.");
    }

    /*
     * RENTAL_CAR 이용 시 선택한 렌터카의
     * 위치/셔틀 정보가 반드시 필요하다.
     */
    if (localTransportMode === "RENTAL_CAR") {
      if (!selectedRental) {
        return notify("렌터카를 선택해 주세요.");
      }

      const rentalLatitude = Number(selectedRental.latitude);

      const rentalLongitude = Number(selectedRental.longitude);

      const shuttleMinutes = Number(selectedRental.estimatedShuttleMinutes);

      if (
        !Number.isFinite(rentalLatitude) ||
        !Number.isFinite(rentalLongitude) ||
        !Number.isFinite(shuttleMinutes) ||
        shuttleMinutes <= 0
      ) {
        return notify("선택한 렌터카의 위치 또는 셔틀 정보를 확인해 주세요.");
      }
    }

    if (!backendPace) {
      return notify("여행 일정 속도를 확인해 주세요.");
    }

    const preferences = themes
      .map((theme) => THEME_MAP[theme])
      .filter(Boolean)
      .slice(0, 3);

    if (preferences.length === 0) {
      return notify("여행 테마를 1개 이상 선택해 주세요.");
    }

    /*
     * VEGETARIAN은 현재 backend enum에 없으므로
     * 자동으로 제외된다.
     */
    const backendFoodPreferences = foodPreferences
      .map((food) => FOOD_PREFERENCE_MAP[food])
      .filter(Boolean)
      .slice(0, 3);

    /*
     * ==========================================
     * 3. 지역명
     * ==========================================
     */

    const departureName = locationRequestName(departureLocation);

    const destinationName = locationRequestName(destinationLocation);

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

    const tripStartTime = scheduledStartTime || startTime || "09:00";

    const tripEndTime = tripSchedule.returnArrivalTime || endTime || "18:00";

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

    const tripDayCount = Math.max(1, dates.length);

    const estimatedMealBudget =
      foodTotal > 0 ? Math.round(foodTotal / tripDayCount) : 30000;

    /*
     * ==========================================
     * 6. 선택 항공편 / 렌터카 DTO 변환
     * ==========================================
     *
     * 숙소, 항공편, 렌터카는 이제
     * POST /api/trips 단계에서 함께 저장한다.
     */

    const outboundFlight =
      mainTransportMode === "AIR"
        ? toFlightCandidatePayload(selectedOutboundFlight)
        : null;

    const returnFlight =
      mainTransportMode === "AIR"
        ? toFlightCandidatePayload(selectedReturnFlight)
        : null;

    const rental =
      localTransportMode === "RENTAL_CAR" && selectedRental
        ? {
            id: selectedRental.id,

            company: selectedRental.company,

            car: selectedRental.car ?? null,

            pickup: selectedRental.pickup ?? null,

            latitude: Number(selectedRental.latitude),

            longitude: Number(selectedRental.longitude),

            estimatedShuttleMinutes: Number(
              selectedRental.estimatedShuttleMinutes,
            ),
          }
        : null;

    /*
     * ==========================================
     * 7. loading 시작
     * ==========================================
     */

    generationInFlightRef.current = true;

    setAnnouncedPlanEstimate(estimateAtGeneration);

    setPlanningMode(mode);

    setPlanning(true);

    setPlanningStage("calculating");

    try {
      /*
       * ========================================
       * STEP 1
       *
       * POST /api/trips
       * ========================================
       */

      const createdTrip = await createTrip({
        departure: departureName,

        departureLatitude,

        departureLongitude,

        destination: destinationName,

        destinationLatitude,

        destinationLongitude,

        startDate,

        startTime: tripStartTime,

        endDate,

        endTime: tripEndTime,

        peopleCount: travelers,

        mainTransportMode,

        localTransportMode,

        fuelType: backendFuelType,

        vehicleEfficiencyKmpl: backendVehicleEfficiencyKmpl,

        budget: Math.max(
          0,

          Math.round(Number(budget) || 0),
        ),

        mealBudgetPerPersonPerDay: Math.max(0, estimatedMealBudget),

        pace: backendPace,

        preferences,

        foodPreferences: backendFoodPreferences,

        prompt: prompt.trim() || null,

        /*
         * Trip 생성 시 선택값을 함께 저장.
         */
        accommodationId,

        outboundFlight,

        returnFlight,

        rental,
      });

      const tripId = createdTrip?.id;

      if (!tripId) {
        throw new Error("여행 생성 응답에 tripId가 없습니다.");
      }

      if (import.meta.env.DEV) {
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

      const nextBackendPlan = await requestTripPlan(tripId);

      /*
       * ========================================
       * STEP 3
       *
       * 일정 검증
       * ========================================
       */

      if (
        !Array.isArray(nextBackendPlan?.dayPlans) ||
        nextBackendPlan.dayPlans.length === 0
      ) {
        throw new Error("백엔드에서 생성된 여행 일정이 비어 있습니다.");
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

      backendPlanRef.current = nextBackendPlan;

      setBackendPlan(nextBackendPlan);

      setPlanEdits({});

      if (import.meta.env.DEV) {
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

      setPlanningStage("ready");

      setActiveDay(0);

      setPlanRevision((current) => current + 1);

      setShowPlan(true);

      setPlanning(false);

      setPlanViewOpen(true);

      setPlanOrders({});
      setPlanCustomizations({});

      if (mode === "stay-revision") {
        setStayChangePromptOpen(true);
        notify(
          `${effectiveStay.name}을 기준으로 이동 동선과 경비를 다시 계산했어요.`,
        );
      } else {
        notify("AI 여행 일정이 생성되었습니다.");
      }
    } catch (error) {
      console.error(
        "[TRIP PLAN] 생성 실패:",

        error,
      );

      setPlanning(false);

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
      generationInFlightRef.current = false;
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
    stayCustomArea,
    setStayCustomArea,

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

    routeResults: backendPlan?.routes || [],

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
