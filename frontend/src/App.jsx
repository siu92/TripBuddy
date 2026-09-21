import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  ChevronDown,
  Luggage,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";

import {
  login,
  logout,
  isLoggedIn,
} from "./api/authApi";
import { getMyTrips, getTrip } from "./api/tripApi";

import { koreanRegions } from "./data/locationCatalog";
import {
  dateLabel,
  departureTimeOptions,
  destinations,
  destinationExplorerItems,
  flightOriginAirports,
  heroSlides,
  foodPreferenceOptions,
  localOptions,
  money,
  outboundOptions,
  paceOptions,
  quickLinks,
  regionalPlaceAlternatives,
  returnTimeOptions,
  stayChangeSummaryFor,
  themeOptions,
  timeLabel,
  transportName,
} from "./data/mockData";
import DestinationExplorer, { preloadJejuDestinationImages } from "./components/DestinationExplorer";
import CommerceShowcase from "./components/CommerceShowcase";
import TripDatePicker from "./components/TripDatePicker";
import { ManualTravelTimeStep, TicketScheduleStep } from "./components/planner/TransportScheduleStep";
import Premium3dIcon from "./components/common/Premium3dIcon";
import BrandPolygon from "./components/icons/BrandPolygon";
import JejuRegionModal from "./components/modals/JejuRegionModal";
import RegionLocationMenu from "./components/modals/RegionLocationMenu";
import PlanFullscreen from "./components/planner/PlanFullscreen";
import TripTimeSummary from "./components/planner/TripTimeSummary";
import FoodPreferenceSelector from "./components/planner/FoodPreferenceSelector";
import AirportRoutePicker from "./components/planner/AirportRoutePicker";
import TravelPreferenceModal from "./components/planner/TravelPreferenceModal";
import CarDetailsStep from "./components/planner/CarDetailsStep";
import RentalComparisonModal from "./components/planner/RentalComparisonModal";
import { buildPlanningPreview } from "./utils/planningPreview";
import useTripPlanner from "./hooks/useTripPlanner";
import useMediaQuery from "./hooks/useMediaQuery";
import quickAccessPlanner from "./assets/quick-access/teal-planner.png";
import quickAccessFlight from "./assets/quick-access/blue-flight.png";
import quickAccessHotel from "./assets/quick-access/gold-hotel.png";
import quickAccessActivity from "./assets/quick-access/teal-activity.png";
import quickAccessMobility from "./assets/quick-access/premium-mobility.png";
import quickAccessEsim from "./assets/quick-access/premium-esim.png";
import {
  estimateBaggageAllowance,
  flightClockMinutes,
  flightDurationMinutes,
  orderFlights,
} from "./utils/flightRanking";
import "./components/planner/flight-booking-modal.css";

const quickAccessIconAssets = {
  sparkles: { src: quickAccessPlanner, fallback: "일정" },
  plane: { src: quickAccessFlight, fallback: "항공" },
  home: { src: quickAccessHotel, fallback: "숙소" },
  ticket: { src: quickAccessActivity, fallback: "투어" },
  car: { src: quickAccessMobility, fallback: "교통" },
  smartphone: { src: quickAccessEsim, fallback: "eSIM" },
};

const flightStatusLabel = (status) => {
  const value = String(status || "").trim();
  const normalized = value.toLowerCase();

  if (!value) return "운항 예정";
  if (normalized.includes("cancel") || value.includes("취소")) return "운항 취소";
  if (normalized.includes("delay") || value.includes("지연")) return "지연";
  if (normalized.includes("depart") || value.includes("출발 완료")) return "출발 완료";
  if (normalized.includes("arriv") || value.includes("도착 완료")) return "도착 완료";
  if (
    normalized.includes("schedule") ||
    normalized.includes("on time") ||
    value.includes("예정") ||
    value.includes("정상")
  ) {
    return "운항 예정";
  }

  return value;
};

const flightOfferFor = (flight, flights, leg) => {
  const price = Number(flight?.estimatedPricePerPerson) || 0;
  if (!price) return null;

  const pricedFlights = flights.filter(
    (item) => Number(item?.estimatedPricePerPerson) > 0,
  );
  const preferredMinutes = leg === "return" ? 17 * 60 : 10 * 60;
  const preferredWindow = leg === "return" ? 2 * 60 : 90;
  const preferredFlight = pricedFlights
    .filter((item) => {
      const minutes = flightClockMinutes(item.departureTime);
      return (
        Number.isFinite(minutes) &&
        Math.abs(minutes - preferredMinutes) <= preferredWindow
      );
    })
    .sort((a, b) => {
      const timeGap =
        Math.abs(flightClockMinutes(a.departureTime) - preferredMinutes) -
        Math.abs(flightClockMinutes(b.departureTime) - preferredMinutes);
      return (
        timeGap ||
        (Number(a.estimatedPricePerPerson) || 0) -
          (Number(b.estimatedPricePerPerson) || 0)
      );
    })[0];
  const dealFlights = [];

  if (preferredFlight) dealFlights.push(preferredFlight);

  [...pricedFlights]
    .sort(
      (a, b) =>
        (Number(a.estimatedPricePerPerson) || 0) -
        (Number(b.estimatedPricePerPerson) || 0),
    )
    .forEach((item) => {
      if (
        dealFlights.length < 4 &&
        !dealFlights.some((dealFlight) => dealFlight.id === item.id)
      ) {
        dealFlights.push(item);
      }
    });

  const dealIndex = dealFlights.findIndex((item) => item.id === flight.id);
  if (dealIndex < 0) return null;

  const isPreferredTimeDeal = preferredFlight?.id === flight.id;
  const priceDealIndex = isPreferredTimeDeal
    ? 0
    : Math.max(0, dealIndex - (preferredFlight ? 1 : 0));
  const discount = isPreferredTimeDeal
    ? 22
    : [17, 14, 11, 9][priceDealIndex] || 9;
  const originalPrice = Math.ceil(price / (1 - discount / 100) / 100) * 100;

  return {
    discount,
    originalPrice,
    seats: 2 + (String(flight.id || flight.flightNumber || "AIR").length % 4),
    label: isPreferredTimeDeal ? "인기 시간대 한정 특가" : "오늘의 한정 특가",
    featured: isPreferredTimeDeal,
  };
};

function App() {
  const isMobile = useMediaQuery("(max-width: 760px)");

  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  /*
   * localStorage에 JWT가 있으면
   * 새로고침 이후에도 로그인 상태로 표시한다.
   */
  const [loggedIn, setLoggedIn] = useState(() => isLoggedIn());

  /*
   * 로그인 API 호출 중 중복 요청 방지
   */
  const [loginLoading, setLoginLoading] = useState(false);
  const [myTripsOpen, setMyTripsOpen] = useState(false);
  const [myTripsLoading, setMyTripsLoading] = useState(false);
  const [myTripsError, setMyTripsError] = useState("");
  const [myTrips, setMyTrips] = useState([]);
  useEffect(() => {
    const updateScrollTop = () => setShowScrollTop(window.scrollY > 300);
    updateScrollTop();
    window.addEventListener("scroll", updateScrollTop, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollTop);
  }, []);
  useEffect(() => {
    const startPreload = () => preloadJejuDestinationImages();
    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(startPreload, { timeout: 1800 });
      return () => window.cancelIdleCallback(idleId);
    }
    const timer = window.setTimeout(startPreload, 450);
    return () => window.clearTimeout(timer);
  }, []);
  const {
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
    endDate,
    startTime,
    endTime,
    tripSchedule,
    estimatedCarMinutes,
    ticketOptions,
    ticketLeg,
    selectedOutboundTicket,
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
    stayOpen,
    setStayOpen,
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
    routeResults,
    flightSearchResult,
    displayFlights,
    flightLoading,
    flightError,
    loadFlightOptions,
    filteredStays,
    stayAreas,
    costDetails,
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
  } = useTripPlanner();

  const selectedOriginAirport =
    flightOriginAirports.find((airport) => airport.code === origin) ||
    flightOriginAirports[0];

  const flightOffers = useMemo(
    () =>
      new Map(
        displayFlights
          .map((flight) => [
            flight.id,
            flightOfferFor(flight, displayFlights, flightPickerLeg),
          ])
          .filter(([, offer]) => Boolean(offer)),
      ),
    [displayFlights, flightPickerLeg],
  );

  const orderedDisplayFlights = useMemo(() => {
    return orderFlights({
      flights: displayFlights,
      sort: flightSort,
      leg: flightPickerLeg,
      dealIds: new Set(flightOffers.keys()),
    });
  }, [displayFlights, flightOffers, flightPickerLeg, flightSort]);

  const flightDealCount = flightOffers.size;

  const planningPreviewPlaces = useMemo(() => {
    const regionalPlaces = regionalPlaceAlternatives[
      destinationLocation?.region || ""
    ]?.filter((place) => place.image) || [];

    const places = [...regionalPlaces];
    if (selectedStay?.image) places.push({
      name: selectedStay.name, image: selectedStay.image,
      detail: "선택한 숙소", category: "숙소", icon: "⌂",
    });
    if (!places.length && destinationLocation?.image) places.push({
      name: destinationLocation.title || destinationLocation.name,
      image: destinationLocation.image, detail: "선택한 여행지", category: "여행지",
    });
    return buildPlanningPreview(places);
  }, [destinationLocation, selectedStay]);

  useEffect(() => {
    const handleAuthExpired = () => {
      setLoggedIn(false);
      setMyTripsOpen(false);
      setLoginOpen(true);
      notify("로그인이 만료되었습니다. 다시 로그인해 주세요.");
    };

    window.addEventListener("tripbuddy:auth-expired", handleAuthExpired);
    return () => window.removeEventListener("tripbuddy:auth-expired", handleAuthExpired);
  }, [notify, setLoginOpen]);

  const openMyTrips = async () => {
    if (!loggedIn) {
      setLoginOpen(true);
      notify("내 일정을 보려면 먼저 로그인해 주세요.");
      return;
    }

    setMyTripsOpen(true);
    setMyTripsLoading(true);
    setMyTripsError("");

    try {
      const trips = await getMyTrips();
      setMyTrips(Array.isArray(trips) ? trips : []);
    } catch (error) {
      setMyTripsError(error?.message || "저장된 여행을 불러오지 못했습니다.");
    } finally {
      setMyTripsLoading(false);
    }
  };

  const openMyTrip = async (tripId) => {
    setMyTripsLoading(true);
    setMyTripsError("");

    try {
      const trip = await getTrip(tripId);
      openSavedTrip(trip);
      setMyTripsOpen(false);
      if (isMobile) setIsPlannerOpen(true);
    } catch (error) {
      setMyTripsError(error?.message || "여행 일정을 열지 못했습니다.");
    } finally {
      setMyTripsLoading(false);
    }
  };
  const selectedFoodLabels = foodPreferenceOptions
    .filter((option) => foodPreferences.includes(option.code))
    .map((option) => option.label);

  return (
    <main className={isMobile && isPlannerOpen ? "mobile-planner-open" : ""}>
      {(!isMobile || !isPlannerOpen) && <>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="TripBuddy 처음으로">
          <BrandPolygon />
          <strong>TripBuddy</strong>
        </a>
        <div className="header-account-actions" aria-label="계정 메뉴">
          {!loggedIn && (
            <button
              type="button"
              className="header-signup"
              onClick={() => notify("회원가입 기능은 백엔드 계정 API 연동 후 제공됩니다.")}
            >
              회원가입
            </button>
          )}
          <button
            type="button"
            className="header-login"
            onClick={() => {
              if (loggedIn) {
                logout();
                setLoggedIn(false);

                notify("로그아웃되었습니다.");

                return;
              }

              setLoginOpen(true);
            }}
          >
            {loggedIn ? "로그아웃" : "로그인"}
          </button>
        </div>
        <button className="header-reservations" type="button" onClick={openMyTrips}>내 예약</button>
        <button
          className="header-button"
          onClick={() => {
            if (isMobile) {
              setIsPlannerOpen(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
              return;
            }
            document.querySelector("#planner")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          여행 만들기 <span>→</span>
        </button>
      </header>
      {loginOpen && (
        <div
          className="ai-modal-backdrop login-backdrop"
          role="presentation"
        >
          <section
            className="ai-modal login-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-modal-title"
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => {
                if (!loginLoading) {
                  setLoginOpen(false);
                }
              }}
              aria-label="로그인 닫기"
            >
              <X size={18} strokeWidth={1.8} aria-hidden="true" />
            </button>

            <p>TripBuddy 계정</p>

            <h3 id="login-modal-title">
              다시 만나 반가워요.
            </h3>

            <span>
              이메일과 비밀번호를 입력해 로그인하세요.
            </span>

            <form
              onSubmit={async (event) => {
                event.preventDefault();

                const formData = new FormData(
                  event.currentTarget,
                );

                const email = formData.get("email");
                const password = formData.get("password");

                try {
                  setLoginLoading(true);

                  await login(
                    email,
                    password,
                  );

                  setLoggedIn(true);

                  setLoginOpen(false);

                  notify(
                    "로그인되었습니다.",
                  );
                } catch (error) {
                  console.error(
                    "로그인 실패:",
                    error,
                  );

                  notify(
                    error.message ??
                      "로그인에 실패했습니다.",
                  );
                } finally {
                  setLoginLoading(false);
                }
              }}
            >
              <label>
                이메일

                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="이메일을 입력하세요"
                  disabled={loginLoading}
                  required
                />
              </label>

              <label>
                비밀번호

                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력하세요"
                  disabled={loginLoading}
                  required
                />
              </label>

              <button
                type="submit"
                disabled={loginLoading}
              >
                {loginLoading
                  ? "로그인 중..."
                  : "로그인"}
              </button>
            </form>
          </section>
        </div>
      )}
      {myTripsOpen && (
        <div className="ai-modal-backdrop my-trips-backdrop" role="presentation">
          <section
            className="ai-modal my-trips-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="my-trips-title"
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => !myTripsLoading && setMyTripsOpen(false)}
              aria-label="내 예약 닫기"
            >
              <X size={18} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <p>TripBuddy · MY TRIPS</p>
            <h3 id="my-trips-title">저장된 여행 일정</h3>
            <span>이전에 만든 일정을 불러와 날짜별 동선과 예약 정보를 확인하세요.</span>

            {myTripsLoading && myTrips.length === 0 ? (
              <div className="my-trips-status">여행 일정을 불러오고 있어요.</div>
            ) : myTripsError ? (
              <div className="my-trips-status is-error">{myTripsError}</div>
            ) : myTrips.length === 0 ? (
              <div className="my-trips-status">아직 저장된 여행이 없습니다.</div>
            ) : (
              <div className="my-trips-list">
                {myTrips.map((trip) => (
                  <article key={trip.id} className="my-trip-card">
                    <div>
                      <small>{trip.startDate} – {trip.endDate}</small>
                      <h4>{trip.destination} 여행</h4>
                      <p>{trip.departure} 출발 · {trip.peopleCount}명 · {(trip.days || []).length}일 일정</p>
                    </div>
                    <button
                      type="button"
                      disabled={myTripsLoading}
                      onClick={() => openMyTrip(trip.id)}
                    >
                      일정 보기 →
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
      <section className="hero" id="top">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`hero-image hero-image--${slide.id} ${index === heroSlideIndex ? "is-active" : ""}`}
            style={{ backgroundImage: `url(${slide.src})` }}
            aria-hidden={index !== heroSlideIndex}
          />
        ))}
        <div className="hero-shade" />
        <div className="hero-inner">
          <p className="eyebrow light">YOUR BUDGET, YOUR ROUTE</p>
          <h1>
            여행의 모든 순간을
            <br />
            <i>함께하는 AI, TripBuddy.</i>
          </h1>
          <p className="hero-copy">
            예산과 취향만 알려주세요.
            <br />
            복잡한 준비부터 현장의 변수까지, AI가 여행의 균형을 맞춰드립니다.
          </p>
          <div className="hero-tags">
            <span>예산 우선 설계</span>
            <span>취향 기반 추천</span>
            <span>낭비 없는 동선</span>
          </div>
        </div>
        <div className="hero-pagination" aria-label="메인 배경 이미지 선택">
          {heroSlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={index === heroSlideIndex ? "active" : ""}
              onClick={() => setHeroSlideIndex(index)}
              aria-label={`${slide.label} 보기`}
            />
          ))}
        </div>
      </section>
      <section className="quick-access" aria-label="여행 바로가기">
        <div className="quick-access-inner">
          {quickLinks.map((link) => {
            const iconAsset = quickAccessIconAssets[link.icon];
            return (
            <button
              type="button"
              key={link.title}
              onClick={() => {
                if (isMobile && link.target === "#planner") setIsPlannerOpen(true);
                window.requestAnimationFrame(() => document.querySelector(link.target)?.scrollIntoView({ behavior: "smooth" }));
              }}
            >
              <span className="quick-access-icon" data-fallback={iconAsset?.fallback || ""}>
                <img src={iconAsset.src} alt="" aria-hidden="true" loading="eager" onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.parentElement?.classList.add("is-fallback"); }} />
              </span>
              <b>{link.title}</b>
              <small>{link.text}</small>
            </button>
          )})}
        </div>
      </section>
      </>}
      {(!isMobile || isPlannerOpen) && <>
      <section className="planner-section" id="planner">
        {isMobile ? <header className="mobile-planner-header"><button type="button" onClick={() => setIsPlannerOpen(false)}>← 뒤로 가기</button><b>AI 일정 설계</b><span /></header> : null}
        <div className="section-title">
          <div>
            <p className="eyebrow">TRIP PLANNING, MADE PERSONAL</p>
            <h2>
              내 예산 안에서
              <br />
              어디로 떠날까요?
            </h2>
          </div>
          <p>
            여행의 조건을 알려주면 AI가 비용을 먼저 계산하고,
            <br />그 안에서 가장 좋은 하루를 찾아드려요.
          </p>
        </div>
        <details className="planner-collapsible" open>
          <summary>
            <span className="planner-summary-copy"><i aria-hidden="true"><SlidersHorizontal size={18} /></i><span><b>AI 일정 설계</b><small>여행 조건과 예산을 직접 설정해 맞춤 일정을 만들어요.</small></span></span>
            <strong><em className="planner-label-open">설정 접기</em><em className="planner-label-closed">설정 열기</em><ChevronDown size={19} aria-hidden="true" /></strong>
          </summary>
        <div className="planner-card">
          <div className="form-area">
            <div className="prompt-area">
              <label htmlFor="prompt">여행을 자유롭게 설명해 주세요</label>
              <div className="prompt-box">
                <span>●</span>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      submitPrompt();
                    }
                  }}
                  rows="2"
                  placeholder="예: 2박 3일 도쿄 여행, 50만원 예산으로 맛집과 야경을 즐기고 싶어요."
                />
                <div className="prompt-actions">
                  <button
                    type="button"
                    className="prompt-send"
                    onClick={submitPrompt}
                    aria-label="여행 요청 전송"
                  >
                    <ArrowUp size={17} strokeWidth={2.2} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="prompt-clear"
                    onClick={() => setPrompt("")}
                    aria-label="입력 내용 지우기"
                  >
                    <X size={18} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <small className="prompt-tip">
                Enter로 전송 · 줄바꿈은 Shift + Enter
              </small>
            </div>
            <section className="budget-input-card early-budget">
              <div className="budget-input-heading">
                <div>
                  <span>₩</span>
                  <b>1인 여행 예산</b>
                  <small>
                    모든 개인 비용과 공통 비용의 N/1 금액을 기준으로 비교해요.
                  </small>
                </div>
                <em className={inBudget ? "safe" : "over"}>
                  {inBudget
                    ? `예산 안 · ${money(gap)}원 여유`
                    : `예산 초과 · ${money(gap)}원 부족`}
                </em>
              </div>
              <div className="budget-number">
                <span>₩</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={money(budget)}
                  onChange={(e) =>
                    setBudget(
                      Number(e.target.value.replaceAll(/[^0-9]/g, "")) || 0,
                    )
                  }
                />
                <b>원</b>
                <div>
                  <small>1인 현재 예상</small>
                  <strong>{money(total)}원</strong>
                </div>
              </div>
              <div className="budget-meter">
                <i
                  className={inBudget ? "safe" : "over"}
                  style={{
                    width: `${Math.min((total / Math.max(budget, 1)) * 100, 100)}%`,
                  }}
                />
              </div>
            </section>
            <div className="form-fields">
              <section className="route-field">
                <header className="route-field-heading">
                  <div>
                    <small>여정</small>
                    <b>어디서 출발해 어디로 떠날까요?</b>
                  </div>
                </header>
                <div className="route-picker-grid">
                  <div className="route-picker route-origin-picker">
                    <small>출발지</small>
                    <button
                      id="departure-route-picker"
                      type="button"
                      className={`route-picker-trigger ${departureLocation ? "chosen" : ""}`}
                      onClick={() => {
                        setDepartureMenuOpen(!departureMenuOpen);
                        setMenuOpen(false);
                      }}
                    >
                      {departureLocation ? (
                        <span className="route-location-label route-location-text">
                          <span className="route-location-marker" aria-hidden="true">⌖</span>
                          <span>
                            <b>{departureLocation.region}</b>
                            <em>{departureLocation.detail}</em>
                          </span>
                        </span>
                      ) : (
                        <span className="route-empty-label">
                          <i>⌖</i>
                          <b>출발지를 선택해 주세요</b>
                        </span>
                      )}
                      <i className="route-chevron"><ChevronDown size={18} strokeWidth={2} aria-hidden="true" /></i>
                    </button>
                    {departureMenuOpen && (
                      <RegionLocationMenu
                        activeRegionId={departureRegionId}
                        customValue={customDeparture}
                        kind="departure"
                        onBack={() => setDepartureRegionId("")}
                        onChooseCustom={chooseCustomDeparture}
                        onChooseDistrict={chooseDepartureDistrict}
                        onChooseRegion={setDepartureRegionId}
                        onCustomValueChange={setCustomDeparture}
                        onClose={() => {
                          setDepartureMenuOpen(false);
                          setDepartureRegionId("");
                        }}
                        onUseCurrentLocation={useCurrentDepartureLocation}
                      />
                    )}
                  </div>
                  <i className="route-direction" aria-hidden="true">
                    <ArrowRight size={20} strokeWidth={2.1} />
                  </i>
                  <div className="route-picker route-destination-picker">
                    <small>도착지</small>
                    <button
                      type="button"
                      className={`route-picker-trigger ${destination ? "chosen" : ""}`}
                      onClick={() => {
                        setMenuOpen(true);
                        setDepartureMenuOpen(false);
                        setDestinationRegionId("");
                      }}
                    >
                      {destination ? (
                        <span className="route-location-label route-location-text">
                          <span className="route-location-marker destination" aria-hidden="true">◎</span>
                          <span>
                            <b>{destinationLocation?.region || destination}</b>
                            <em>{destinationLocation?.detail || destination}</em>
                          </span>
                        </span>
                      ) : (
                        <span className="route-empty-label">
                          <i>✦</i>
                          <b>도착지를 선택해 주세요</b>
                        </span>
                      )}
                      <i className="route-chevron"><ChevronDown size={18} strokeWidth={2} aria-hidden="true" /></i>
                    </button>
                    {menuOpen && (
                      <DestinationExplorer
                        open={menuOpen}
                        destinations={destinationExplorerItems}
                        regions={koreanRegions}
                        selectedId={destinationLocation?.id || ""}
                        selectedRegionId={destinationRegionId}
                        onSelect={chooseDestination}
                        onSelectRegion={(region) => setDestinationRegionId(region.id)}
                        onAiRecommend={askAiForDestination}
                        onClose={() => {
                          setMenuOpen(false);
                          setDestinationRegionId("");
                        }}
                      />
                    )}
                  </div>
                </div>
              </section>
              <div
                className={`traveler-field ${!travelers && destination ? "needs-input" : ""}`}
              >
                <small>총인원</small>
                <label className="traveler-input">
                  <input
                    id="trip-travelers"
                    type="number"
                    min="1"
                    max="20"
                    inputMode="numeric"
                    value={travelerInput}
                    onChange={(event) => {
                      const value = event.target.value;
                      setTravelerInput(value);
                      setTravelers(value.trim() ? Math.min(20, Math.max(1, Math.floor(Number(value)) || 1)) : null);
                    }}
                    onBlur={commitTravelers}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        event.currentTarget.blur();
                      }
                    }}
                    placeholder="3"
                    aria-label="총인원 입력"
                  />
                  <span>명</span>
                </label>
              </div>
              <TripDatePicker
                startDate={startDate}
                endDate={endDate}
                startTime={startTime}
                endTime={endTime}
                travelers={travelers}
                destinationLocation={destinationLocation}
                departureTimeOptions={departureTimeOptions}
                returnTimeOptions={returnTimeOptions}
                showTimeFields={false}
                onConfirm={confirmTravelDates}
              />
            </div>
            {!destinationLocation && (
              <div className="waiting-booking">
                <b>도착 권역을 선택하면 이동수단·숙소·일정을 각각 바로 비교할 수 있어요.</b>
              </div>
            )}
            {destinationLocation ? (
              <>
                <section className="transport-choice">
                  <div>
                    <p>AI 교통편 설계</p>
                    <small>
                      출발지와 도착지, 여행 기간을 기준으로 항공·KTX·자차·버스·배를
                      비교하고 가장 적합한 이동수단을 선택해요.
                    </small>
                  </div>
                  <div className="transport-result">
                    <span>
                      출발{" "}
                      <b>
                        {transport === "FLIGHT"
                          ? "항공"
                          : transportName(transport, outboundOptions)}
                      </b>
                    </span>
                    <i>→</i>
                    <span>
                      {destinationLocation.detail} <b>{transportName(localTransport, localOptions)}</b>
                    </span>
                    <button type="button" onClick={beginOriginQuestion}>
                      AI에게 교통편 물어보기
                    </button>
                  </div>
                  <div className="independent-booking-tools">
                    <div>
                      <b>필요한 항목부터 직접 비교할 수도 있어요.</b>
                      <small>
                        AI 추천 흐름을 기다리지 않아도 교통·항공·렌터카·숙소를 원하는 순서로 열어 볼 수 있어요.
                      </small>
                    </div>
                    <span>
                      <button type="button" onClick={() => openIndependentBooking("transport")}>
                        교통 비교
                      </button>
                      <button type="button" onClick={() => openIndependentBooking("flight")}>
                        항공편
                      </button>
                      <button type="button" onClick={() => openIndependentBooking("rental")}>
                        렌터카
                      </button>
                      <button type="button" onClick={() => openIndependentBooking("stay")}>
                        숙소
                      </button>
                    </span>
                  </div>
                </section>
                {transport && transport !== "FLIGHT" ? (
                  <TripTimeSummary
                    transportLabel={transportName(transport, outboundOptions)}
                    schedule={tripSchedule}
                    startTime={scheduledStartTime}
                    arrivalTime={scheduledArrivalTime}
                    endTime={scheduledEndTime}
                    onEdit={() => {
                      chooseTransportMode(transport);
                      setTransportModalOpen(true);
                    }}
                  />
                ) : null}
                {transport === "FLIGHT" && (
                    <section className="booking-section flight-selection-section">
                      <div className="booking-heading">
                        <div>
                          <p>{selectedFlight ? "선택한 항공편" : "왕복 항공편 선택"}</p>
                          <small>
                            {selectedFlight
                              ? `${dateLabel(startDate)} 출발 · ${dateLabel(endDate)} 도착`
                              : `${dateLabel(startDate)} 가는 편 · ${dateLabel(endDate)} 오는 편을 선택해 주세요.`}
                          </small>
                        </div>
                        <em>
                          {selectedFlight
                            ? "왕복 · 1인 기준"
                            : `${selectedOutboundFlight ? "오는 편 선택 필요" : "가는 편 미선택"}`}
                        </em>
                      </div>
                      {selectedFlight ? (
                        <div className="flight-confirmation-card">
                          <div className="flight-confirmation-legs">
                            <article>
                              <header>
                                <span>가는 편</span>
                                <small>{dateLabel(startDate)}</small>
                              </header>
                              <div className="flight-confirmation-time">
                                <strong>{selectedFlight.out.split(" → ")[0]}</strong>
                                <i aria-hidden="true">→</i>
                                <strong>{selectedFlight.out.split(" → ")[1]}</strong>
                              </div>
                              <div className="flight-confirmation-airports">
                                <span>{selectedFlight.origin}</span>
                                <b>
                                  {selectedOutboundFlight.airline}
                                  {selectedOutboundFlight.flightNumber || selectedOutboundFlight.code
                                    ? ` · ${selectedOutboundFlight.flightNumber || selectedOutboundFlight.code}`
                                    : ""}
                                </b>
                                <span>{destinationAirport}</span>
                              </div>
                            </article>
                            <article>
                              <header>
                                <span>오는 편</span>
                                <small>{dateLabel(endDate)}</small>
                              </header>
                              <div className="flight-confirmation-time">
                                <strong>{selectedFlight.back.split(" → ")[0]}</strong>
                                <i aria-hidden="true">→</i>
                                <strong>{selectedFlight.back.split(" → ")[1]}</strong>
                              </div>
                              <div className="flight-confirmation-airports">
                                <span>{destinationAirport}</span>
                                <b>
                                  {selectedReturnFlight.airline}
                                  {selectedReturnFlight.flightNumber || selectedReturnFlight.code
                                    ? ` · ${selectedReturnFlight.flightNumber || selectedReturnFlight.code}`
                                    : ""}
                                </b>
                                <span>{selectedFlight.origin}</span>
                              </div>
                            </article>
                          </div>
                          <footer>
                            <div>
                              <small>예상 왕복 총액</small>
                              <strong>{money(selectedFlight.fare)}원</strong>
                              <span>1인 기준</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (showPlan) setQuickEditTarget("flight");
                                setFlightPickerLeg("outbound");
                                setFlightOpen(true);
                              }}
                            >
                              항공편 변경 <span aria-hidden="true">→</span>
                            </button>
                          </footer>
                        </div>
                      ) : (
                        <div className="booking-summary flight-summary">
                          <div>
                            <span>✈</span>
                            <div>
                              <small>가는 편과 오는 편을 각각 선택</small>
                              <b>
                                {selectedOutboundFlight
                                  ? `${selectedOutboundFlight.airline} 가는 편 선택 완료 · 오는 편을 골라주세요`
                                  : "여행 일정에 맞는 항공편을 비교해 보세요"}
                              </b>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFlightPickerLeg(
                                selectedOutboundFlight ? "return" : "outbound",
                              );
                              setFlightOpen(true);
                            }}
                          >
                            {selectedOutboundFlight ? "오는 편 고르기" : "가는 편 고르기"} →
                          </button>
                        </div>
                      )}
                    </section>
                )}
                {localTransport === "RENTAL" && (
                  <section className="rental-section">
                    <div className={`rental-confirmation-card ${selectedRental ? "is-selected" : ""}`}>
                      <header>
                        <div>
                          <span>현지 이동</span>
                          <h3>{selectedRental ? "선택한 렌터카" : "렌터카 선택"}</h3>
                        </div>
                        <em>{nights}박 · 48시간</em>
                      </header>
                      <div className="rental-confirmation-body">
                        {selectedRental?.image ? (
                          <img src={selectedRental.image} alt={`${selectedRental.car} 차량`} />
                        ) : (
                          <span className="rental-confirmation-icon" aria-hidden="true">🚗</span>
                        )}
                        <div className="rental-confirmation-info">
                          <small>{selectedRental?.company || `${destinationLocation.detail} 현지 이동`}</small>
                          <strong>{selectedRental?.car || "여행 일정에 맞는 차량을 비교해 보세요"}</strong>
                          {selectedRental ? (
                            <div>
                              <span>{selectedRental.insurance || "보험 조건 확인"}</span>
                              <span>{selectedRental.pickup || "제주공항 인수"}</span>
                              {selectedRental.score && <span>평점 {selectedRental.score}</span>}
                            </div>
                          ) : (
                            <p>차종·보험·인수 조건과 총 대여료를 한 화면에서 비교할 수 있어요.</p>
                          )}
                        </div>
                        {selectedRental && (
                          <div className="rental-confirmation-price">
                            <small>48시간 총액</small>
                            <strong>{money(selectedRental.price)}원</strong>
                            <span>{selectedRental.note || `${nights}박 일정 기준`}</span>
                          </div>
                        )}
                      </div>
                      <footer>
                        <p>
                          <b>AI 추천</b>{" "}
                          {selectedRental
                            ? `${destinationLocation.detail}을 포함한 제주 동선과 보험 조건을 함께 반영한 선택입니다.`
                            : "제주 이동 거리와 여행 인원을 기준으로 알맞은 차량을 추천해 드려요."}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            if (showPlan) setQuickEditTarget("rental");
                            setRentalOpen(true);
                          }}
                        >
                          {selectedRental ? "렌터카 변경" : "렌터카 고르기"} <span aria-hidden="true">→</span>
                        </button>
                      </footer>
                    </div>
                  </section>
                )}
              </>
            ) : (
              <div className="waiting-booking">
                <b>지역을 선택하면 항공편과 숙소를 비교할 수 있어요.</b>
              </div>
            )}
            {destinationLocation && (
              <section className="booking-section stay-selection-section">
                <div className="booking-heading">
                  <div>
                    <p>
                      숙소 선택
                    </p>
                    <small>
                      가격대와 도착 권역을 고른 뒤 숙소를 선택하세요.
                    </small>
                  </div>
                  <em>
                    {selectedStay
                      ? `${selectedStay.area} · ${nights}박`
                      : "숙소 미선택"}
                  </em>
                </div>
                {selectedStay ? (
                  <article className="stay-confirmation-card">
                    <img src={selectedStay.image} alt={`${selectedStay.name} 대표 이미지`} />
                    <div className="stay-confirmation-info">
                      <div className="stay-confirmation-meta">
                        <span>{selectedStay.area}</span>
                        {selectedStay.rating != null && (
                          <span>★ {selectedStay.rating}{selectedStay.ratingScale ? `/${selectedStay.ratingScale}` : ""}</span>
                        )}
                        {selectedStay.reviewCount > 0 && <span>후기 {money(selectedStay.reviewCount)}개</span>}
                      </div>
                      <h3>{selectedStay.name}</h3>
                      <div className="stay-confirmation-details">
                        <span><small>투숙</small><b>{nights}박 · 객실 {rooms}개</b></span>
                        {(selectedStay.checkInTime || selectedStay.checkOutTime) && (
                          <span>
                            <small>이용 시간</small>
                            <b>{selectedStay.checkInTime || "체크인 확인"} → {selectedStay.checkOutTime || "체크아웃 확인"}</b>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="stay-confirmation-price">
                      <small>{selectedStay.priceAvg != null ? "평균 1박" : "가격 안내"}</small>
                      <strong>
                        {selectedStay.priceAvg != null
                          ? `${money(selectedStay.priceAvg)}원`
                          : selectedStay.priceText || "가격 확인"}
                      </strong>
                      {selectedStay.priceAvg != null && (
                        <span>예상 총 {money(selectedStay.priceAvg * nights * rooms)}원</span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (showPlan) setQuickEditTarget("stay");
                          setStayOpen(true);
                        }}
                      >
                        숙소 변경 <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </article>
                ) : (
                  <div className="booking-summary">
                    <div>
                      <span>⌂</span>
                      <div>
                        <small>{destinationLocation.region} 숙소</small>
                        <b>가격대와 지역으로 숙소를 찾아보세요</b>
                      </div>
                    </div>
                    <button type="button" onClick={() => setStayOpen(true)}>
                      숙소 전체 비교 →
                    </button>
                  </div>
                )}
                {stayOpen && (
                  <div
                    className="booking-picker stay-picker"
                    role="dialog"
                    aria-modal="true"
                    aria-label="숙소 전체 비교"
                  >
                    <header className="stay-modal-head">
                      <div>
                        <p>✦ TripBuddy AI · STAY MATCH</p>
                        <h3>
                          여행 동선에 맞는 숙소를
                          <br />
                          넓은 화면에서 비교해 보세요.
                        </h3>
                        <span>
                            선택한 여행지와 가까운 숙소를 거리·평점·가격 정보와 함께
                            비교해 보세요.
                        </span>
                      </div>
                      <button
                        type="button"
                        className="modal-close"
                        onClick={() => {
                          setStayOpen(false);
                          setQuickEditTarget("");
                        }}
                        aria-label="숙소 비교 닫기"
                      >
                        <X size={18} strokeWidth={1.8} aria-hidden="true" />
                      </button>
                    </header>
                    <div className="stay-ai-recommendation">
                      <span>✦</span>
                      <p>
                        <b>AI 숙소 추천</b>{" "}
                        {selectedStay
                          ? `${selectedStay.name}은 ${selectedStay.insight}`
                          : destinationLocation?.regionCode === "KR-49" && Number.isFinite(destinationLocation?.latitude)
                            ? `${destinationLocation.detail || destinationLocation.name}에서 가까운 숙소부터 보여드려요. 가격·지역 필터로 다시 좁힐 수 있어요.`
                            : "특가세일 객실을 먼저 보여드리고, 선택한 동선과 인원에 맞는 숙소를 추천할게요."}
                      </p>
                    </div>
                    <label className="stay-search">
                      <span>⌕</span>
                      <input
                        value={staySearch}
                        onChange={(event) => setStaySearch(event.target.value)}
                        placeholder="원하는 숙소 이름을 입력하세요"
                      />
                    </label>
                    <div className="stay-toolbar">
                      <div className="price-filters">
                        {[
                          ["all", "전체"],
                          ["5-10", "가성비 (~10만)"],
                          ["10-20", "스탠다드 (10~20만)"],
                          ["20-30", "프리미엄 (20~30만)"],
                          ["30+", "럭셔리 (30만 이상)"],
                        ].map(([id, label]) => (
                          <button
                            type="button"
                            className={priceBand === id ? "active" : ""}
                            onClick={() => setPriceBand(id)}
                            key={id}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <label className="stay-sort">
                        <span>정렬</span>
                        <select
                          value={staySort}
                          onChange={(event) => setStaySort(event.target.value)}
                          aria-label="숙소 정렬 기준"
                        >
                          <option value="review">별점순</option>
                          <option value="price">최저가순</option>
                        </select>
                      </label>
                    </div>
                    <div className="area-filters">
                      {stayAreas.map(
                        (area) => (
                          <button
                            type="button"
                            className={stayArea === area ? "active" : ""}
                            onClick={() => setStayArea(area)}
                            key={area}
                          >
                            {area}
                          </button>
                        ),
                      )}
                    </div>
                    {stayLoading ? (
                      <div className="empty-catalog">
                        <b>
                          숙소를 찾고 있어요.
                        </b>

                        <span>
                          선택한 여행지 주변 숙소를 비교하고 있습니다.
                        </span>
                      </div>

                    ) : stayError ? (

                      <div className="empty-catalog">
                        <b>
                          숙소 정보를 불러오지 못했습니다.
                        </b>

                        <span>
                          {stayError}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            void loadStayOptions()
                          }
                        >
                          다시 조회
                        </button>
                      </div>

                    ) : filteredStays.length ? (

                      <div className="hotel-catalog">

                        {filteredStays.map(
                          (stay) => (

                            <button
                              type="button"
                              key={stay.id}
                              className={
                                stay.id === stayId
                                  ? "selected"
                                  : ""
                              }
                              onClick={() =>
                                chooseStay(
                                  stay.id,
                                )
                              }
                            >

                              <img
                                src={stay.image}
                                alt={`${stay.name} 숙소`}
                              />

                              <div>

                                <span className="stay-card-area">
                                  {stay.area}
                                </span>

                                <b className="stay-card-name">
                                  {stay.name}
                                </b>


                                {Number.isFinite(
                                  stay.distanceKm,
                                ) && (

                                  <small className="stay-distance">
                                    ⌖ 선택지에서 약{" "}
                                    {stay.distanceKm}km
                                    {" · "}
                                    차량 약{" "}
                                    {stay.estimatedDriveMinutes ?? "-"}분
                                  </small>

                                )}


                                <small className="hotel-rating">

                                  ★{" "}
                                  {stay.rating ?? "-"}

                                  {" · 리뷰 "}

                                  {Number(
                                    stay.reviewCount ?? 0,
                                  ).toLocaleString()}

                                  개

                                </small>


                                <div className="stay-card-price">
                                  <span className="stay-card-price-copy">
                                    <small>{stay.priceAvg != null ? "1박 예상가" : "숙박 예상가"}</small>
                                    <em>세금 포함 예상</em>
                                  </span>
                                  <strong>
                                    {stay.priceText ||
                                      (
                                        stay.priceAvg != null
                                          ? `${money(stay.priceAvg)}원`
                                          : "약 80,000원"
                                      )}
                                  </strong>
                                </div>

                              </div>

                            </button>

                          ),
                        )}

                      </div>

                    ) : (

                      <div className="empty-catalog">

                        <b>
                          조건에 맞는 숙소가 없습니다.
                        </b>

                        <span>
                          가격대나 지역 필터를 변경해 보세요.
                        </span>

                      </div>

                    )}
                  </div>
                )}
              </section>
            )}
            <section className="preference-area planner-final-preferences">
              <div className="theme-preference">
                <div>
                  <small>여행 테마</small>
                  <b>마음에 드는 테마를 골라주세요. (최대 3개 · {themes.length}/3)</b>
                </div>
                <span className="theme-cards">
                  {themeOptions.map((theme) => (
                    <button type="button" key={theme.title} className={themes.includes(theme.title) ? "active" : ""} disabled={themes.length >= 3 && !themes.includes(theme.title)} onClick={() => toggleTheme(theme.title)}>
                      <img src={theme.image} alt="" />
                      <b>{theme.title}</b>
                      {themes.includes(theme.title) && <span className="theme-selected" aria-label={`${theme.title} 선택됨`}>선택</span>}
                    </button>
                  ))}
                </span>
              </div>
              <div className="pace-preference">
                <div>
                  <small>여행 일정</small>
                  <b>하루를 어떤 속도로 보낼까요?</b>
                </div>
                <span>
                  {paceOptions.map((option) => (
                    <button type="button" key={option} className={pace === option ? "active" : ""} onClick={() => setPace(option)}>{option}</button>
                  ))}
                </span>
              </div>
              <FoodPreferenceSelector value={foodPreferences} onChange={setFoodPreferences} />
            </section>
          </div>
          <aside className="ai-area">
            <p>
              <span /> AI TRIP CHECK
            </p>
            <h3>
              선택한 예약부터
              <br />
              하루의 동선까지.
            </h3>
            <ul>
              <li>
                ✓{" "}
                {selectedFlight
                  ? `${selectedFlight.airline} 왕복 ${money(selectedFlight.fare)}원`
                  : "왕복 항공권을 선택해요"}
              </li>
              <li>
                ✓{" "}
                {selectedStay
                  ? `${selectedStay.name} ${nights}박`
                  : "제주 숙소를 선택해요"}
              </li>
              <li>
                ✓ {pace} · {themes.length ? themes.join(" · ") : "테마 선택 전"}
              </li>
              <li>✓ 음식 취향 · {selectedFoodLabels.length ? selectedFoodLabels.join(" · ") : "동선·평점 우선"}</li>
              <li>✓ 선택 즉시 1인 예산 다시 계산</li>
            </ul>
            <div className="selection-total">
              <small>현재 예상 1인 경비</small>
              <b>{money(total)}원</b>
              <span>
                총 {travelers || 0}명 여행비 {money(total * (travelers || 0))}원
              </span>
            </div>
            <button
              className="generate"
              type="button"
              disabled={planning}
              aria-busy={planning}
              onClick={() => generate()}
            >
              {planning ? "일정 생성 중…" : "AI 일정 생성 →"}
            </button>
            <button className="reset-draft-btn" type="button" onClick={() => {
              if (window.confirm("입력한 여행 조건을 모두 지우고 새로 시작할까요?")) resetTripDraft();
            }}>
              <RotateCcw size={15} strokeWidth={2.2} aria-hidden="true" />
              <span>입력 초기화</span>
            </button>
            {showPlan && (
              <button
                className="plan-return-button"
                type="button"
                onClick={() => setPlanViewOpen(true)}
              >
                생성된 전체 일정 보기 →
              </button>
            )}
            <small>항공·숙소를 바꾸면 1인 경비와 동선도 바로 반영돼요.</small>
          </aside>
        </div>
        </details>
        {isMobile ? <div className="mobile-planner-bottom"><span><small>현재 예상 1인 경비</small><b>{money(total)}원</b></span><button type="button" disabled={planning} aria-busy={planning} onClick={() => generate()}>{planning ? "생성 중…" : "여행 만들기 →"}</button></div> : null}
      </section>
      </>}
      {(!isMobile || !isPlannerOpen) && <>
      <section className="inspiration compact-inspiration" id="inspiration">
        <div className="section-heading">
          <div>
            <p className="eyebrow">GUIDE CURATED PLANS</p>
            <h2>가이드 추천 일정</h2>
          </div>
          <button type="button">가이드 전체 보기 →</button>
        </div>
        <div className="city-grid">
          {destinations.map((place) => (
            <article
              key={place.id}
              onClick={() => {
                setDestinationType(place.id === "jeju" ? "국내" : "해외");
                chooseDestination(place.title);
                document
                  .querySelector("#planner")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <img
                src={place.image}
                alt={`${place.title} 대표 관광지`}
                loading="lazy"
              />
              <div>
                <small>GUIDE PICK · {place.city}</small>
                <h3>{place.title}</h3>
                <p>{place.tag}</p>
                <b>
                  가이드 일정 보기 <i>→</i>
                </b>
              </div>
            </article>
          ))}
        </div>
      </section>
      <CommerceShowcase />
      </>}
      {showScrollTop && <button className="scroll-to-top" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>↑ TOP</button>}
      {planning && (
        <div className="planning-overlay" role="status" aria-live="polite">
          <div className="planning-panorama" aria-hidden="true">
            <div className="planning-panorama-track" style={{ "--panorama-duration": `${Math.max(40, planningPreviewPlaces.length * 7)}s` }}>
              {planningPreviewPlaces.map((place, index) => (
                <figure key={place.imageKey} style={{ "--card-index": index }}>
                  <img src={place.image} alt="" decoding="async" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />
                  
                  <figcaption>
                    <span>{place.icon || "⌖"}</span>
                    <div>
                      <b>{place.name}</b>
                      <small>{place.representativeMenu || place.detail}</small>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
          <div
            className={`planning-loader ${planningMode === "stay-revision" ? "stay-revision-loader" : ""}`}
          >
            <span className="planning-orbit" aria-hidden="true" />
            <p>
              TripBuddy AI ·{" "}
              {planningMode === "stay-revision"
                ? "STAY ROUTE REVISION"
                : "TRIP PLANNING"}
            </p>
            <h2>
              {planningStage === "calculating"
                ? planningMode === "stay-revision"
                  ? "변경된 숙소를 기반으로\n일정을 새롭게 생성하겠습니다."
                  : "현재 AI가 추천 경로와 경비를 계산 중입니다."
                : planningMode === "stay-revision"
                  ? "중문·서귀포 중심의 새 동선을 완성했어요."
                  : "일정 설계가 완료되었습니다."}
            </h2>
            <small>
              {planningStage === "calculating"
                ? planningMode === "stay-revision"
                  ? "기존 한림 동선을 제외하고, 히든 클리프 호텔&네이쳐와 인천 대한항공 왕복 시간을 기준으로 다시 배치하고 있어요."
                  : "항공·숙소·렌터카와 각 장소의 이동 시간을 연결하고 있어요."
                : "잠시 후 새 일정이 화면 위에서부터 자연스럽게 완성됩니다."}
            </small>
            <span className="planning-preview-caption">여행지 미리보기 · 음식과 장소, 숙소를 함께 살펴보세요.</span>
            <div>
              <i className={planningStage === "ready" ? "done" : ""} />
              <i className={planningStage === "ready" ? "done" : ""} />
              <i className={planningStage === "ready" ? "done" : ""} />
            </div>
          </div>
        </div>
      )}
      {planViewOpen && (
        <PlanFullscreen
          activeDay={activeDay}
          costDetails={costDetails}
          dates={dates}
            dayPlans={dayPlans}
            routeResults={routeResults}
          destinationLocation={destinationLocation}
          endTime={scheduledEndTime}
          eventCost={itineraryEventCost}
          money={money}
          onChangeStop={changePlanStop}
          onAddStop={addPlanStop}
          onRemoveStop={removePlanStop}
          onResolveStop={resolvePlanStop}
          onSavePlan={savePlanChanges}
          onReorderStops={reorderDayPlan}
          onOpenStay={() => setStayOpen(true)}
          onOpenStayComparison={() => setStayChangePromptOpen(true)}
          planRevision={planRevision}
          originLocation={departureLocation}
          localTransport={localTransport}
          isMobile={isMobile}
          selectedFlight={selectedFlight}
          selectedRental={selectedRental}
          selectedStay={selectedStay}
          setActiveDay={setActiveDay}
          setPlanViewOpen={setPlanViewOpen}
          startTime={scheduledStartTime}
          stayChange={stayChange}
          total={total}
          transport={transport}
          travelers={travelers}
        />
      )}
      {jejuRegionGuideOpen && (
        <JejuRegionModal
          currentArea={jejuBaseArea}
          customArea={jejuCustomArea}
          onClose={() => setJejuRegionGuideOpen(false)}
          onChoose={chooseJejuBaseArea}
          onCustomAreaChange={setJejuCustomArea}
          onChooseCustom={chooseJejuCustomArea}
        />
      )}
      {travelerPromptOpen && (
        <div
          className="ai-modal-backdrop traveler-prompt-backdrop"
          role="presentation"
        >
          <section
            className="ai-modal traveler-prompt-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="traveler-prompt-title"
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setTravelerPromptOpen(false)}
              aria-label="인원 입력 창 닫기"
            >
              <X size={18} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <p>✦ TripBuddy AI · TRIP PARTY</p>
            <Premium3dIcon type="traveler" />
            <h3 id="traveler-prompt-title">
              함께 떠나는 인원을
              <br />
              알려주세요.
            </h3>
            <span>
              정확한 1인 경비 계산을 위해 인원을 먼저 파악할게요. 입력한 인원을
              기준으로 객실과 공통 비용을 나눠 계산합니다.
            </span>
            <label className="traveler-prompt-input">
              <span>총인원</span>
              <input
                autoFocus
                type="number"
                min="1"
                max="20"
                inputMode="numeric"
                value={travelerInput}
                onChange={(event) => setTravelerInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    confirmTravelers();
                  }
                }}
                placeholder="예: 3"
              />
              <b>명</b>
            </label>
            <button
              type="button"
              className="transition-primary"
              onClick={confirmTravelers}
            >
              인원 확인하고 날짜 고르기 →
            </button>
          </section>
        </div>
      )}
      {transportModalOpen && (
        <div className="ai-modal-backdrop" role="presentation">
          <section
            className="ai-modal transport-question-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-transport-title"
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setTransportModalOpen(false)}
              aria-label="질문 닫기"
            >
              <X size={18} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <p>
              ✦ TripBuddy AI ·{" "}
              {transportStep === "origin"
                ? "QUESTION 01"
                : transportStep === "mode"
                  ? "TRAVEL MODE"
                  : transportStep === "manual-time"
                    ? "TRAVEL TIME"
                    : transportStep === "tickets"
                      ? "TICKET SCHEDULE"
                  : transportStep === "car-detail"
                      ? "CAR DETAILS"
                      : "LOCAL MOVE"}
            </p>
            {transportStep === "origin" ? (
              <>
                <h3 id="ai-transport-title">출발지를 다시 선택할까요?</h3>
                <span>
                  출발 권역과 세부지역을 선택하면 해당 지역에서 이용하기 좋은 공항과
                  교통편을 바로 비교해 드려요.
                </span>
                <div className="ai-confirm-grid">
                  <button
                    type="button"
                    className="yes"
                    onClick={() => {
                      setTransportModalOpen(false);
                      setDepartureMenuOpen(true);
                    }}
                  >
                    <i>⌖</i>
                    <b>출발지 다시 선택</b>
                    <small>시·도와 세부지역을 선택해 주세요.</small>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTransportModalOpen(false);
                      notify("현재 선택한 출발지를 기준으로 비교를 이어갈게요.");
                    }}
                  >
                    <i>✓</i>
                    <b>현재 출발지 유지</b>
                    <small>선택한 지역 기준으로 비교합니다.</small>
                  </button>
                </div>
              </>
            ) : transportStep === "mode" ? (
              <>
                <h3 id="ai-transport-title">
                  {departureLocation?.detail || "출발지"}에서
                  <br />
                  {destinationLocation?.detail || "도착지"}까지
                  <br />
                  어떤 방법으로 이동할까요?
                </h3>
                <span>
                  선택한 출발지·도착지·여행 날짜를 바탕으로 이동수단을 비교해요.
                  항공·KTX·버스는 왕복 티켓의 시간표로, 자차는 직접 고른 시간으로 일정을 정해요.
                </span>
                {(transport || localTransport) && (
                  <div className="transport-edit-shortcuts" aria-label="교통편 빠른 수정">
                    <span>이미 선택한 항목은 유지하고 필요한 부분만 바꿀 수 있어요.</span>
                    <div>
                      {transport === "FLIGHT" && (
                        <button type="button" onClick={() => {
                          setTransportModalOpen(false);
                          setFlightPickerLeg("outbound");
                          setFlightOpen(true);
                          void loadFlightOptions();
                        }}>✈ 항공편만 변경</button>
                      )}
                      {(localTransport === "RENTAL" || transport === "FLIGHT") && (
                        <button type="button" onClick={() => {
                          setTransportModalOpen(false);
                          setQuickEditTarget("rental");
                          setRentalOpen(true);
                        }}>🚗 렌터카만 변경</button>
                      )}
                    </div>
                  </div>
                )}
                <div className="ai-option-grid travel-mode-options">
                  {outboundOptions.map((option) => (
                    <button
                      type="button"
                      key={option.id}
                      className={`travel-mode-card mode-${option.id.toLowerCase()} ${
                        option.id === "FLIGHT" ? "option-highlight" : ""
                      }`}
                      onClick={() => chooseTransportMode(option.id)}
                    >
                      {option.id === "FLIGHT" && (
                        <em className="travel-mode-badge">추천</em>
                      )}
                      <i>{option.icon}</i>
                      <b>{option.title}</b>
                      <small>{option.text}</small>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="modal-back"
                  onClick={() => {
                    setTransportModalOpen(false);
                    document
                      .querySelector(".route-picker")
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                >
                  ← 출발지·도착지 다시 보기
                </button>
              </>
            ) : transportStep === "manual-time" ? (
              <ManualTravelTimeStep startDate={startDate} endDate={endDate} startTime={startTime} endTime={endTime} estimatedMinutes={estimatedCarMinutes} onConfirm={confirmManualTimes} onBack={() => setTransportStep("mode")} />
            ) : transportStep === "tickets" ? (
              <TicketScheduleStep mode={transport} leg={ticketLeg} tickets={ticketOptions} startDate={startDate} endDate={endDate} origin={departureLocation?.detail || "출발지"} destination={destinationLocation?.detail || "도착지"} selectedOutbound={selectedOutboundTicket} onSelect={chooseTicket} onBack={() => setTransportStep("mode")} />
            ) : transportStep === "car-detail" ? (
              <CarDetailsStep carType={carType} carFuel={carFuel} onTypeChange={setCarType} onFuelChange={setCarFuel} onComplete={completeCarDetails} onBack={() => setTransportStep("mode")} />
            ) : (
              <>
                <h3 id="ai-transport-title">제주도 내에서는<br />어떻게 이동하시나요?</h3>
                <span>
                  {transportName(transport, outboundOptions)} 이동을 선택했어요. 제주에 도착한 뒤
                  여행 전 구간에서 이용할 현지 이동수단을 선택해 주세요.
                </span>
                <div className="ai-option-grid local-options">
                  {localOptions.map((option) => (
                    <button
                      type="button"
                      key={option.id}
                      onClick={() => chooseLocal(option.id)}
                    >
                      <i>{option.icon}</i>
                      <b>{option.title}</b>
                      <small>{option.text}</small>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="modal-back"
                  onClick={() => {
                    if (transport === "FLIGHT") {
                      setTransportModalOpen(false);
                      setFlightPickerLeg(returnFlightId ? "return" : "outbound");
                      setFlightOpen(true);
                      return;
                    }
                    setTransportStep("mode");
                  }}
                >
                  {transport === "FLIGHT"
                    ? "← 왕복 항공편 다시 보기"
                    : "← 이동수단 다시 고르기"}
                </button>
              </>
            )}
          </section>
        </div>
      )}
      {flightTransitionOpen && (
        <div className="ai-modal-backdrop" role="presentation">
          <section
            className="ai-modal ai-transition-modal flight-transition-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="return-flight-transition-title"
          >
            <p>✦ TripBuddy AI · 돌아오는 편 선택</p>
            <Premium3dIcon type="flight" />
            <h3 id="return-flight-transition-title">
              가는 편을 선택했어요.
              <br />
              이제 돌아오는 편을 선택하겠습니다.
            </h3>
            <span>
              {selectedOutboundFlight?.airline || "선택한 항공편"} 가는 편에
              맞춰 {dateLabel(endDate)} 제주 → {departureLocation?.detail || "출발지"}
              시간표를 이어서 비교할게요.
            </span>
            <button
              type="button"
              className="transition-primary"
              onClick={() => {
                setFlightTransitionOpen(false);
                setFlightPickerLeg("return");
                setFlightOpen(true);
                void loadFlightOptions("return");
              }}
            >
              오는 편 비교 시작 →
            </button>
          </section>
        </div>
      )}
      {flightOpen && (
        <div className="ai-modal-backdrop" role="presentation">
          <section
            className="ai-modal flight-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="flight-modal-title"
          >
            <button
              type="button"
              className="modal-close flight-modal-close"
              onClick={() => {
                setFlightOpen(false);
                setQuickEditTarget("");
              }}
              aria-label="항공편 닫기"
              title="닫기"
            >
              <X size={20} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <p>✦ TripBuddy AI · FLIGHT MATCH</p>
            <div className="journey-chip">
              <span>{departureLocation?.detail || "출발지"}</span>
              <i>→</i>
              <b>{destinationLocation?.detail || "제주"}</b>
              <em>
                {flightPickerLeg === "outbound"
                  ? "가는 편 선택 · 1/2"
                  : "오는 편 선택 · 2/2"}
              </em>
            </div>
            <h3 id="flight-modal-title">
              {flightPickerLeg === "outbound"
                ? `${dateLabel(startDate)} 가는 편을`
                : `${dateLabel(endDate)} 오는 편을`}
              <br />
              골라주세요.
            </h3>
            <span>
              {departureLocation?.detail || "출발지"} → {destinationLocation?.detail || "제주"}{" "}
              항공 이동을 선택했어요.{" "}
              {flightPickerLeg === "outbound"
                ? "먼저 제주로 가는 편을 고르고, 이어서 돌아오는 편을 선택해요."
                : `${selectedOutboundFlight?.airline || "선택한"} 가는 편에 이어 제주 → ${departureLocation?.detail || "출발지"} 오는 편을 고르는 단계예요.`}
            </span>
            <div className="sale-hero flight-value-hero">
              <div>
                <small>
                  SMART FLIGHT DEALS · 실제 운항편
                </small>

                <b>
                  원하는 시간대의 항공편을 한눈에 비교하세요.
                </b>

                <span>
                  출발 시간과 예상 운임, 잔여 특가 좌석을 비교해 여행에 맞는
                  항공편을 선택하세요.
                </span>
              </div>

              <strong>
                ✈

                <small>
                  DEAL
                  <br />
                  CHECK
                </small>
              </strong>
            </div>
            <div className="flight-filter-row">
              <AirportRoutePicker
                airports={flightOriginAirports}
                originAirport={selectedOriginAirport}
                leg={flightPickerLeg}
                onOriginChange={(airportCode) => {
                  setOrigin(airportCode);
                  setFlightId("");
                  setReturnFlightId("");
                  void loadFlightOptions(flightPickerLeg, airportCode);
                }}
              />
              <label className="flight-sort">
                <span>정렬</span>
                <select
                  value={flightSort}
                  onChange={(event) => setFlightSort(event.target.value)}
                >
                  <option value="recommended">추천순</option>
                  <option value="time">출발시간순</option>
                  <option value="price">최저가순</option>
                </select>
              </label>
            </div>
            <p className="picker-date">
              {dateLabel(
                flightPickerLeg === "outbound"
                  ? startDate
                  : endDate,
              )}

              {" · "}

              {displayFlights.length}편 조회 · 특가 {flightDealCount}편

              {" · "}

              {flightPickerLeg === "outbound"
                ? "선택 후 오는 편으로 이어집니다."
                : "선택 후 제주 현지 이동수단을 고릅니다."}
            </p>
            <div className="flight-catalog">
              {flightLoading ? (
                <div className="flight-loading">
                  실제 항공편을 조회하고 있습니다...
                </div>
              ) : flightError ? (
                <div className="flight-loading">
                  <p>
                    {flightError}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      void loadFlightOptions(
                        flightPickerLeg,
                      )
                    }
                  >
                    다시 조회
                  </button>
                </div>
              ) : orderedDisplayFlights.length === 0 ? (
                <div className="flight-loading">
                  조회 가능한 항공편이 없습니다.
                </div>
              ) : (
                orderedDisplayFlights.map((flight) => {
                  const isSelected =
                    flightPickerLeg === "outbound"
                      ? flight.id === flightId
                      : flight.id ===
                        returnFlightId;

                  const deal = flightOffers.get(flight.id) || null;
                  const baggage = estimateBaggageAllowance(
                    flight,
                    displayFlights,
                  );

                  const departureTime =
                    flight.departureTime?.slice(
                      11,
                      16,
                    ) ?? "--:--";

                  const arrivalTime =
                    flight.arrivalTime?.slice(
                      11,
                      16,
                    ) ?? "--:--";

                  const durationMinutes =
                    flightDurationMinutes(flight);

                  return (
                    <button
                      type="button"
                      key={flight.id}
                      className={`${isSelected ? "selected" : ""} ${deal ? "sale-flight" : ""} ${deal?.featured ? "featured-flight" : ""}`}
                      aria-pressed={isSelected}
                      onClick={() =>
                        chooseFlight(
                          flight.id,
                        )
                      }
                    >
                      {deal ? (
                        <em className="flight-sale-sticker">
                          {deal.label} · {deal.discount}% 혜택
                        </em>
                      ) : null}

                      <span className="airline-mark">
                        {flight.airlineCode ||
                          "AIR"}
                      </span>

                      <div className="flight-card-main">
                        <b className="flight-airline-name">
                          {flight.airline}

                          <small>
                            {flight.flightNumber}
                          </small>
                        </b>

                        <span className="flight-segment">
                          <span>
                            <strong>
                              {departureTime}
                            </strong>

                            <small>
                              {
                                flight.departureAirport
                              }
                            </small>
                          </span>

                          <i>
                            <small>
                              {durationMinutes < Number.MAX_SAFE_INTEGER
                                ? `예상 ${durationMinutes}분`
                                : "시간 확인 중"}
                            </small>

                            <b>
                              직항
                            </b>
                          </i>

                          <span>
                            <strong>
                              {arrivalTime}
                            </strong>

                            <small>
                              {
                                flight.arrivalAirport
                              }
                            </small>
                          </span>
                        </span>

                        <span className="flight-inclusions">
                          <i>
                            {flight.aircraft ||
                              "기종 정보 없음"}
                          </i>

                          <i>
                            {flightStatusLabel(flight.status)}
                          </i>

                          <i>
                            예상 운임
                          </i>

                          <span
                            className={`flight-baggage flight-baggage-${baggage.tier}`}
                            title={`가격대 기준 시연 정보 · 기내 수하물 ${baggage.cabinKg}kg`}
                          >
                            <Luggage size={12} strokeWidth={2} aria-hidden="true" />
                            예상 위탁 {baggage.checkedKg}kg
                            <small>· 기내 {baggage.cabinKg}kg</small>
                          </span>
                        </span>

                        {deal ? (
                          <em className="flight-deal">
                            <b>{deal.discount}% 특가</b>
                            {" · "}잔여 {deal.seats}석
                            {deal.featured ? " · 인기 출발 시간대" : ""}
                          </em>
                        ) : null}
                      </div>

                      <strong className={`flight-price ${deal ? "sale-price" : ""}`}>
                        {deal ? (
                          <del>
                            {money(deal.originalPrice)}원
                          </del>
                        ) : null}

                        <b>
                          {money(
                            flight
                              .estimatedPricePerPerson,
                          )}
                          원
                        </b>

                        <small>
                          {deal ? "특가 · 편도 1인" : "예상 · 편도 1인"}
                        </small>

                        {isSelected ? (
                          <span className="flight-selected-indicator">
                            ✓ 선택 완료
                          </span>
                        ) : null}
                      </strong>
                    </button>
                  );
                })
              )}
            </div>
            <button
              type="button"
              className="modal-back modal-back-strong"
              onClick={() => {
                if (flightPickerLeg === "return") {
                  setFlightPickerLeg("outbound");
                } else {
                  setFlightOpen(false);
                  setTransportStep("mode");
                  setTransportModalOpen(true);
                }
              }}
            >
              {flightPickerLeg === "return"
                ? "← 가는 편 다시 고르기"
                : "← 항공 여부 다시 선택하기"}
            </button>
          </section>
        </div>
      )}
      {rentalOpen && (
        <RentalComparisonModal
          rentals={rentalCatalog}
          selectedId={rentalId}
          selectedFlight={selectedFlight}
          arrivalTime={scheduledArrivalTime}
          departureTime={scheduledEndTime}
          money={money}
          timeLabel={timeLabel}
          onChoose={chooseRental}
          onClose={() => { setRentalOpen(false); setQuickEditTarget(""); }}
          onBackToFlight={() => {
            setRentalOpen(false);
            if (quickEditTarget === "rental") {
              setQuickEditTarget("");
              setTransportStep("mode");
              setTransportModalOpen(true);
              return;
            }
            setFlightOpen(true);
          }}
        />
      )}
      {preferenceModalOpen && (
        <TravelPreferenceModal
          themes={themes}
          themeOptions={themeOptions}
          onToggleTheme={toggleTheme}
          pace={pace}
          paceOptions={paceOptions}
          onPaceChange={setPace}
          foodPreferences={foodPreferences}
          onFoodPreferencesChange={setFoodPreferences}
          onClose={() => setPreferenceModalOpen(false)}
          onComplete={() => {
            setPreferenceModalOpen(false);
            setBudgetConfirmationOpen(true);
            notify(`${pace} · ${themes.length ? themes.join(" · ") : "테마 미선택"} · ${selectedFoodLabels.length ? selectedFoodLabels.join(" · ") : "음식 취향 제한 없음"}까지 모두 반영했어요.`);
          }}
        />
      )}
      {stayTransitionOpen && (
        <div className="ai-modal-backdrop" role="presentation">
          <section
            className="ai-modal ai-transition-modal stay-transition-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stay-transition-title"
          >
            <p>✦ TripBuddy AI · STAY MATCH</p>
            <Premium3dIcon type="stay" />
            <h3 id="stay-transition-title">
              제주도 · {jejuBaseArea || "선택 지역"}을 선택하셨네요!
              <br />
              맞춤형 AI가 해당 지역 숙소를 보여드리겠습니다.
            </h3>
            <span>
              {pace} 일정과 {themes.length ? themes.join(" · ") : "선택한"}{" "}
              테마, 선택한 지역의 관광지 동선을 기준으로 위치·가격·후기까지
              비교해 가장 잘 맞는 숙소를 찾아드릴게요.
            </span>
            <button
              type="button"
              className="transition-primary"
              onClick={() => {
                setStayTransitionOpen(false);
                setStayOpen(true);
              }}
            >
              숙소 비교 시작 →
            </button>
          </section>
        </div>
      )}
      {budgetConfirmationOpen && (
        <div className="ai-modal-backdrop" role="presentation">
          <section
            className={`ai-modal ai-transition-modal budget-confirmation-modal ${confirmedInBudget ? "in-budget" : "over-budget"}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="budget-confirmation-title"
          >
            <p>✦ TripBuddy AI · BUDGET CHECK</p>
            <Premium3dIcon type="budget" />
            <h3 id="budget-confirmation-title">
              {confirmedInBudget
                ? "예산 안에서 가능합니다!"
                : "예산을 조금 넘어요."}
            </h3>
            <span>
              항공·렌터카·숙소와 여행 테마·선호 음식까지 모두 반영한 최종 1인 예상
              경비는 <b>{money(total)}원</b>이에요. 숙박일수와 렌터카 이용기간도 전체 여행일정 기준으로 계산했습니다.
            </span>
            <div className="budget-safe-box">
              <small>모든 선택 반영 · 최종 1인 예상 경비</small>
              <b>{money(total)}원</b>
              <span>
                {confirmedInBudget
                  ? `설정 예산 ${money(budget)}원 · ${money(Math.max(0, budget - total))}원 여유`
                  : `설정 예산 ${money(budget)}원 · ${money(Math.abs(budget - total))}원 초과`}
              </span>
            </div>
            <button
              type="button"
              className="transition-primary"
              onClick={() => {
                setBudgetConfirmationOpen(false);
                setPlanPromptOpen(true);
              }}
            >
              최종 확인하고 일정 만들기 →
            </button>
          </section>
        </div>
      )}
      {planPromptOpen && (
        <div className="ai-modal-backdrop" role="presentation">
          <section
            className="ai-modal ai-transition-modal plan-transition-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-transition-title"
          >
            <p>✦ TripBuddy AI · PLAN READY</p>
            <Premium3dIcon type="plan" />
            <h3 id="plan-transition-title">이제 일정을 생성하러 가볼까요?</h3>
            <span>
              선택한 항공편·렌터카·숙소와 여행 취향을 바탕으로 최적 동선과 1인
              예상 경비를 설계할 준비가 됐어요.
            </span>
            <button
              type="button"
              className="transition-primary"
              onClick={() => {
                setPlanPromptOpen(false);
                const button = document.querySelector(".generate");
                button?.scrollIntoView({ behavior: "smooth", block: "center" });
                window.setTimeout(() => button?.focus(), 420);
              }}
            >
              일정 만들기 버튼으로 이동 →
            </button>
          </section>
        </div>
      )}
      {stayChangePromptOpen && stayChange && (
        <div className="ai-modal-backdrop" role="presentation">
          <section
            className="ai-modal ai-transition-modal stay-change-prompt-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stay-change-prompt-title"
          >
            <p>✦ TripBuddy AI · STAY ROUTE UPDATE</p>
            <Premium3dIcon type="plan" />
            <h3 id="stay-change-prompt-title">
              새 숙소를 기준으로
              <br />
              일정을 다시 설계했어요.
            </h3>
            <span>
              {stayChange.to.name} 주변의 이동 동선과 추천 장소, 1인 예상 경비를
              새로 계산했습니다. 어떤 점이 바뀌었는지 확인해볼까요?
            </span>
            <div className="stay-change-prompt-actions">
              <button
                type="button"
                className="transition-primary"
                onClick={() => {
                  setStayChangePromptOpen(false);
                  setStayChangeCompareOpen(true);
                }}
              >
                예, 변경 내용을 볼게요
              </button>
              <button
                type="button"
                className="transition-secondary"
                onClick={() => setStayChangePromptOpen(false)}
              >
                아니오, 일정부터 볼게요
              </button>
            </div>
          </section>
        </div>
      )}
      {stayChangeCompareOpen && stayChange && (
        <div className="ai-modal-backdrop" role="presentation">
          <section
            className="ai-modal stay-change-compare-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stay-change-compare-title"
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setStayChangeCompareOpen(false)}
              aria-label="숙소 변경 비교 닫기"
            >
              <X size={18} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <p>✦ TripBuddy AI · BEFORE & AFTER</p>
            <h3 id="stay-change-compare-title">
              숙소가 바뀌며 달라진 여행을
              <br />
              한눈에 확인해 보세요.
            </h3>
            <span>
              항공편과 여행 기간은 그대로 유지하고, 새 숙소 권역에 맞춰
              식사·볼거리·체험·이동 순서를 다시 최적화했어요.
            </span>
            <section
              className="stay-change-summary"
              aria-label="숙소 변경에 따른 일정 요약"
            >
              <header>
                <div>
                  <small>BASECAMP UPDATE</small>
                  <b>
                    {stayChange.from.area} <i>→</i> {stayChange.to.area}
                  </b>
                </div>
                <strong>1인 예상 경비 {money(total)}원</strong>
              </header>
              <div className="stay-change-category-grid">
                {stayChangeSummaryFor(stayChange).map((item, index) => (
                  <article key={item.category}>
                    <header>
                      <em>{String(index + 1).padStart(2, "0")}</em>
                      <div>
                        <small>{item.category}</small>
                        <b>{item.title}</b>
                      </div>
                    </header>
                    <div className="stay-change-row removed">
                      <span>변경 전</span>
                      <del>− {item.before}</del>
                    </div>
                    <div className="stay-change-row added">
                      <span>변경 후</span>
                      <strong>＋ {item.after}</strong>
                    </div>
                    <p>{item.note}</p>
                  </article>
                ))}
              </div>
            </section>
            <div className="stay-change-compare-note">
              <b>AI 재설계 포인트</b>
              <span>
                같은 2박 3일 안에서 숙소 주변 일정은 촘촘하게, 권역이 다른
                장소는 줄여 실제 이동 시간을 낮췄어요.
              </span>
            </div>
            <button
              type="button"
              className="transition-primary"
              onClick={() => setStayChangeCompareOpen(false)}
            >
              새 일정 확인하기 →
            </button>
          </section>
        </div>
      )}
      <section className="how" id="how">
        <div>
          <p className="eyebrow light">HOW TRIPBUDDY WORKS</p>
          <h2>
            계획은 가볍게,
            <br />
            여행은 충분하게.
          </h2>
        </div>
        <div className="steps">
          <article>
            <span>01</span>
            <h3>여행지를 고르세요</h3>
            <p>국내와 해외에서 가고 싶은 여행지를 먼저 선택해요.</p>
          </article>
          <article>
            <span>02</span>
            <h3>예약을 비교하세요</h3>
            <p>원하는 교통편과 숙소를 취향에 맞게 고릅니다.</p>
          </article>
          <article>
            <span>03</span>
            <h3>예산과 동선을 확인해요</h3>
            <p>선택한 금액과 여행 루트를 한눈에 확인하세요.</p>
          </article>
        </div>
      </section>
      <footer>
        <b>● TripBuddy</b>
        <span>Travel, thoughtfully planned.</span>
        <span className="footer-legal">
          © 2026 TRIPBUDDY <i>·</i> SMART ROUTES, BETTER TRIPS
        </span>
      </footer>
      {message && <div className="toast">✓ {message}</div>}
    </main>
  );
}
export default App;
