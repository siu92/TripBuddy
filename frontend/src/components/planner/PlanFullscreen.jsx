import { useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { ArrowDown, CarFront, ExternalLink, GripVertical, MapPin, Minus, Monitor, Plus, Smartphone, Star, X } from "lucide-react";
import { contentApi } from "../../api/contentApi";
import { dateLabel, getPlaceAlternatives, locationLabel, timeLabel } from "../../data/mockData";
import TransitionIcon from "../common/TransitionIcon";
import BrandPolygon from "../icons/BrandPolygon";
import CampusTimetable from "./CampusTimetable";
import RouteMap from "./RouteMap";
import AttractionDetailModal from "./AttractionDetailModal";
import { eventClock, eventMinutes } from "../../utils/planTime.js";
import { hasJejuAttractionDetail } from "../../data/jejuAttractionDetails.js";
import { isAirportName } from "../../utils/routeFilters.js";



function formatFlightClock(value) {
  const match = String(value || "").match(/T(\d{2}:\d{2})/);
  return match?.[1] || null;
}

function durationMinutes(value, metadata = {}) {
  const direct = Number(metadata.stayMinutes);
  if (Number.isFinite(direct) && direct >= 0) return direct;
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function normalizedRouteName(value) {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
}

const CURATED_EVENT_DETAILS = [
  {
    match: /스탠포드호텔앤리조트\s*제주|스탠포드.*제주/i,
    describe: () => "애월 바다와 가까운 리조트에서 객실과 부대시설을 이용하며 여유롭게 하루를 시작해요.",
  },
  {
    match: /언덕집국수/i,
    describe: ({ cost }) => `제주식 고기국수와 비빔국수를 맛볼 수 있는 곳으로, 식비는 ${cost || "1인 약 10,000원"}이에요.`,
  },
  {
    match: /수목원테마공원|수목원테마파크|아이스뮤지엄/i,
    describe: ({ cost }) => `아이스뮤지엄과 체험 공간, 야간 LED 정원을 한곳에서 즐길 수 있으며 입장·체험비는 ${cost || "1인 약 20,000원"}이에요.`,
  },
  {
    match: /수제.*과일.*모찌|과일모찌/i,
    describe: ({ cost }) => `제철 과일을 넣은 수제 찹쌀모찌가 인기인 디저트 매장으로, 음료와 디저트 예산은 ${cost || "1인 약 9,000원"}이에요.`,
  },
  {
    match: /작산.*흑돼지|흑돼지.*작산/i,
    describe: ({ cost }) => `숙성 제주 흑돼지와 제주식 곁들임 메뉴를 함께 맛볼 수 있으며 예상 식비는 ${cost || "1인 약 33,000원"}이에요.`,
  },
  {
    match: /애월갈치.*암행어사|암행어사/i,
    describe: ({ cost }) => `제주 갈치조림과 구이를 중심으로 한 상차림을 즐길 수 있으며 예상 식비는 ${cost || "1인 약 20,000원"}이에요.`,
  },
  {
    match: /고집돌우럭/i,
    describe: ({ cost }) => `우럭조림과 옥돔구이 등 제주식 해산물 한 상이 대표 메뉴이며 예상 식비는 ${cost || "1인 약 30,000원"}이에요.`,
  },
  {
    match: /카멜리아힐/i,
    describe: ({ cost }) => `계절마다 달라지는 동백과 수국 정원을 산책하고 포토존을 둘러볼 수 있으며 입장료는 ${cost || "1인 약 10,000원"}이에요.`,
  },
  {
    match: /오설록.*뮤지엄/i,
    describe: () => "녹차밭과 전시 공간을 무료로 둘러보고, 녹차 디저트와 기념품도 함께 즐길 수 있어요.",
  },
  {
    match: /새별오름/i,
    describe: () => "완만한 오름길을 따라 올라 제주 중산간과 억새 풍경을 감상할 수 있는 무료 자연 명소예요.",
  },
  {
    match: /애월\s*카페\s*거리|한담해안산책로/i,
    describe: () => "현무암 해안과 애월 바다를 따라 산책하고 오션뷰 카페에서 쉬어가기 좋은 코스예요.",
  },
  {
    match: /성산일출봉/i,
    describe: ({ cost }) => `정상에서 제주 동부 해안과 분화구 전망을 감상할 수 있으며 입장료는 ${cost || "현장 기준으로 확인"}할 수 있어요.`,
  },
];

function consumerEventDetail({ name, detail, eventType, price, money, metadata = {} }) {
  const cost = Number(price) > 0 ? `1인 약 ${money(price)}원` : "";
  const curated = CURATED_EVENT_DETAILS.find(({ match }) => match.test(String(name || "")));
  if (curated) return curated.describe({ cost });

  const original = String(detail || "").trim();
  const isInternalCopy = !original
    || /fallback|BACKEND_FALLBACK|BEDROCK|recommendationScore|최종 일정|시간 기준|동선 (?:반영|계산)|다시 계산|좌표 기반|이동 가능|일정을 시작|AI가|필수 목적지/i.test(original);
  if (!isInternalCopy) return original;

  const representativeMenu = String(metadata.representativeMenu || "").trim();
  if (eventType === "식사") {
    return `${representativeMenu || "지역 대표 메뉴"}를 맛볼 수 있는 곳으로, 예상 식비는 ${cost || "메뉴 선택에 따라 달라져요"}.`;
  }
  if (eventType === "카페") {
    return `${representativeMenu || "대표 음료와 디저트"}를 즐기며 쉬어가기 좋은 곳으로, 예상 비용은 ${cost || "메뉴 선택에 따라 달라져요"}.`;
  }
  if (eventType === "숙소") {
    return "숙소의 객실과 부대시설을 이용하고 충분히 휴식한 뒤 다음 일정을 시작해요.";
  }
  if (eventType === "교통" || eventType === "이동 준비") {
    return "예약한 교통편을 확인하고 탑승·수령 절차를 마친 뒤 다음 장소로 이동해요.";
  }

  return `${name}의 대표 볼거리와 체험을 여유롭게 즐겨요${cost ? ` · 예상 입장·체험비는 ${cost}이에요.` : "."}`;
}

function costGroupDescription(group, travelers) {
  if (/개인 교통비/.test(group || "")) {
    return "항공·기차·버스처럼 탑승자마다 따로 발생하는 교통비예요.";
  }

  if (/식사·관광비/.test(group || "")) {
    return "식당·카페·관광지에서 개인별로 사용하는 예상 금액이에요.";
  }

  if (/공동 예약·차량비/.test(group || "")) {
    return `숙소·렌터카·주유·주차처럼 함께 결제한 총액을 ${Math.max(1, Number(travelers) || 1)}명으로 나눈 금액이에요.`;
  }

  if (/장소 변경 차액/.test(group || "")) {
    return "일정에서 장소를 바꾼 뒤 달라진 1인 예상 금액이에요.";
  }

  return "";
}

function costGroupPresentation(group) {
  const label = String(group || "");
  if (/개인 교통비/.test(label)) return { className: "is-personal-transport", kicker: "개별 결제" };
  if (/공동 예약·차량비/.test(label)) return { className: "is-shared-booking", kicker: "함께 나눠 결제" };
  if (/식사·관광비/.test(label)) return { className: "is-food-activity", kicker: "현지 사용 예상" };
  if (/장소 변경 차액/.test(label)) return { className: "is-plan-adjustment", kicker: "일정 변경 반영" };
  return { className: "", kicker: "예상 경비" };
}

function CostGroupCard({ group, money, travelers }) {
  const presentation = costGroupPresentation(group.group);
  const [groupTitle, ...basisParts] = String(group.group || "").split(" · ");
  const groupBasis = basisParts.join(" · ");
  const groupTotal = group.rows.reduce((sum, row) => sum + (Number(row[1]) || 0), 0);
  const totalLabel = /공동 예약·차량비/.test(group.group) ? "1인 부담" : "1인 합계";
  return (
    <section className={`cost-group-card ${presentation.className}`.trim()}>
      <h3>
        <span>
          <small className="cost-group-kicker">{presentation.kicker}</small>
          <b>{groupTitle}</b>
          {groupBasis && <em>{groupBasis}</em>}
        </span>
        <strong><small>{totalLabel}</small>{money(groupTotal)}원</strong>
      </h3>
      {costGroupDescription(group.group, travelers) && (
        <small className="cost-group-caption">
          {costGroupDescription(group.group, travelers)}
        </small>
      )}
      {group.rows.map(([name, value, note], rowIndex) => {
        const numericValue = Number(value);
        const hasKnownPrice = Number.isFinite(numericValue) && numericValue > 0;
        const explicitlyFree = /무료|입장료\s*없음|free/i.test(note || "");
        const approximate = /예상|평균|참고|공개 메뉴|대표가/.test(note || "") || /고등어|카페|점심|저녁|시장|오설록|새별|카멜리아|성산/.test(name);
        return (
          <p key={`${name}-inline-${rowIndex}`}>
            <span><b>{name}</b><small>{note}</small></span>
            <strong>
              {hasKnownPrice
                ? `${approximate ? "약 " : ""}1인 ${money(numericValue)}원`
                : explicitlyFree ? "무료" : `약 1인 ${money(15000)}원`}
            </strong>
          </p>
        );
      })}
    </section>
  );
}

function PlanFullscreen({
  activeDay,
  costDetails,
  dates,
  dayPlans,
  routeResults = [],
  destinationLocation,
  endTime,
  eventCost,
  money,
  onChangeStop,
  onAddStop,
  onRemoveStop,
  onResolveStop,
  onSavePlan,
  onOpenStay,
  onOpenStayComparison,
  onReorderStops,
  planRevision,
  originLocation,
  selectedFlight,
  selectedRental,
  selectedStay,
  setActiveDay,
  setPlanViewOpen,
  startTime,
  stayChange,
  total,
  transport,
  localTransport,
  isMobile = false,
  travelers,
}) {
  // Backend-ready contract: dayPlans is consumed as an array of day tuples only;
  // no fixed three-day index is assumed when the API replaces the mock generator.
  const safeDayPlans = Array.isArray(dayPlans) ? dayPlans : [];
  const day = safeDayPlans[activeDay] || ["일정 준비 중", "선택한 날짜의 일정을 구성하고 있어요.", []];
  const [scheduleView, setScheduleView] = useState("timeline");
  const [placePicker, setPlacePicker] = useState(null);
  const [customPlace, setCustomPlace] = useState("");
  const [routeRecalculation, setRouteRecalculation] = useState(null);
  const [routeResult, setRouteResult] = useState(null);
  const [utilityMessage, setUtilityMessage] = useState("");
  const [mobilePreview, setMobilePreview] = useState(false);
  const [orderRecalculating, setOrderRecalculating] = useState(false);
  const [planSaving, setPlanSaving] = useState(false);
  const [stopComposer, setStopComposer] = useState(null);
  const [stopComposerSaving, setStopComposerSaving] = useState(false);
  const [restaurantDetail, setRestaurantDetail] = useState(null);
  const [attractionDetailTarget, setAttractionDetailTarget] = useState(null);
  const [restaurantDetailType, setRestaurantDetailType] = useState("RESTAURANT");
  const [restaurantHeroFailed, setRestaurantHeroFailed] = useState(false);
  const [restaurantHeroLandscape, setRestaurantHeroLandscape] = useState(false);
  const [restaurantLoading, setRestaurantLoading] = useState(false);
  const [restaurantError, setRestaurantError] = useState("");
  const restaurantFallbackPrice = restaurantDetail
    ? eventCost(restaurantDetail.name, { type: restaurantDetailType })
    : 0;
  const placeOptions = getPlaceAlternatives(destinationLocation, placePicker?.item);
  const destinationName = locationLabel(destinationLocation);
  const originName = locationLabel(originLocation, "출발지");
  const destinationRegion =
    destinationLocation?.region || destinationLocation?.countryCode || "TRAVEL";
  const nightCount = Math.max(0, dates.length - 1);
  const intercityTransportSummary = transport === "CAR"
    ? "🚙 출발부터 자차 이동"
    : transport === "KTX"
      ? "🚆 KTX 이동"
      : transport === "BUS"
        ? "🚌 고속·시외버스 이동"
        : selectedFlight
          ? `✈ ${selectedFlight.airline} 왕복`
          : "교통수단 미선택";
  const localTransportSummary = localTransport === "CAR"
    ? null
    : selectedRental
      ? `🚗 ${selectedRental.company} · 48시간`
      : localTransport === "TRANSIT"
        ? "🚌 현지 대중교통"
        : localTransport === "TAXI"
          ? "🚕 택시·카셰어링"
          : localTransport === "WALK"
            ? "🚶 도보 이동"
            : "현지 이동 미선택";
  const tripTitle = (
    <>
      <span>{destinationName}에서</span>
      <span>완성하는 나만의 여행</span>
    </>
  );
  const showUtilityMessage = (message) => {
    setUtilityMessage(message);
    window.setTimeout(() => setUtilityMessage(""), 2600);
  };
  const savePlan = async () => {
    if (planSaving) return;
    setPlanSaving(true);
    try {
      const result = await onSavePlan?.();
      window.localStorage.setItem(
        "eolmagil-saved-itinerary",
        JSON.stringify({
          title: dayPlans[0]?.[0] || `${destinationName} 여행`,
          dates,
          travelers,
          total,
          savedAt: new Date().toISOString(),
        }),
      );
      showUtilityMessage(
        result?.persisted
          ? "변경된 일정과 경로를 서버에 저장했습니다."
          : "이 일정이 이 기기에 저장되었습니다.",
      );
    } catch (error) {
      showUtilityMessage(error?.message || "일정 저장을 완료할 수 없어요.");
    } finally {
      setPlanSaving(false);
    }
  };
  const sharePlan = async () => {
    const text = `TripBuddy 여행 일정 · ${dayPlans[0]?.[0] || `${destinationName} 여행`}\n1인 예상 경비 ${money(total)}원 · ${travelers}명 여행`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "TripBuddy 여행 일정",
          text,
          url: window.location.href,
        });
        showUtilityMessage("공유 창을 열었습니다.");
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
        showUtilityMessage("일정 링크를 클립보드에 복사했습니다.");
        return;
      }
      showUtilityMessage("이 브라우저에서는 공유 기능을 지원하지 않아요.");
    } catch (error) {
      if (error?.name !== "AbortError")
        showUtilityMessage("공유를 완료하지 못했어요. 다시 시도해 주세요.");
    }
  };
  const applyPlaceChange = async (place) => {
    if (!placePicker) return;
    try {
      const resolved = await onResolveStop?.(place, placePicker.item) || place;
      const update = {
        from: placePicker.name,
        to: resolved.name,
        travel: resolved.travel,
        delta: eventCost(resolved.name) - eventCost(placePicker.name),
      };
      onChangeStop(activeDay, placePicker.eventId, resolved);
      setPlacePicker(null);
      setRouteResult(update);
      showUtilityMessage("장소를 변경했습니다. 저장하면 실제 경로를 계산합니다.");
    } catch (error) {
      showUtilityMessage(error?.message || "장소를 변경하지 못했습니다.");
    }
  };
  const handleDragEnd = ({ source, destination }) => {
    if (!destination || source.index === destination.index || orderRecalculating) return;
    setOrderRecalculating(true);
    window.setTimeout(() => {
      onReorderStops?.(activeDay, source.index, destination.index);
      window.setTimeout(() => setOrderRecalculating(false), 450);
    }, 750);
  };
  const submitAddedStop = async (event) => {
    event.preventDefault();
    if (!stopComposer || stopComposerSaving) return;
    setStopComposerSaving(true);
    try {
      await onAddStop?.(activeDay, stopComposer.afterEventId, stopComposer);
      setStopComposer(null);
      showUtilityMessage("새 일정을 추가하고 뒤 시간을 다시 맞췄습니다.");
    } catch (error) {
      showUtilityMessage(error?.message || "일정을 추가하지 못했습니다.");
    } finally {
      setStopComposerSaving(false);
    }
  };
  const openRestaurantDetail = async ({ name, metadata = {}, placeType = "RESTAURANT" }) => {
    const normalizedPlaceType = placeType === "CAFE" ? "CAFE" : "RESTAURANT";
    setRestaurantDetailType(normalizedPlaceType);
    setRestaurantDetail({ name });
    setRestaurantLoading(true);
    setRestaurantError("");
    setRestaurantHeroFailed(false);
    setRestaurantHeroLandscape(false);

    const request = {
      placeId: metadata.placeId || metadata.externalId || metadata.referenceId || metadata.id,
      name,
      address: metadata.address,
      latitude: metadata.latitude,
      longitude: metadata.longitude,
      representativeMenu: metadata.representativeMenu,
    };

    try {
      const detail = normalizedPlaceType === "CAFE"
        ? await contentApi.getCafeDetail(request)
        : await contentApi.getRestaurantDetail(request);
      setRestaurantDetail(detail);
    } catch {
      setRestaurantError(
        normalizedPlaceType === "CAFE"
          ? "카페 상세 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
          : "식당 상세 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setRestaurantLoading(false);
    }
  };
  return (
    <section
      className={`plan-fullscreen ${stayChange ? "plan-rebuilt" : ""}${mobilePreview ? " mobile-preview" : ""}${isMobile ? " is-mobile-device" : ""}${scheduleView === "budget" ? " budget-mode" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${destinationName} 전체 여행 일정`}
    >
      <header className="plan-fullscreen-head">
        <a
          className="brand"
          href="#top"
          onClick={(event) => {
            event.preventDefault();
            setPlanViewOpen(false);
          }}
          aria-label="일정 닫기"
        >
          <BrandPolygon />
          <strong>TripBuddy</strong>
        </a>
        <div>
          <span>AI TRIP PLAN · REV {planRevision}</span>
          <b>
            {destinationName} {nightCount}박 {dates.length}일 상세 일정
          </b>
        </div>
        <div className="plan-header-actions">
          <button type="button" onClick={savePlan} disabled={planSaving}>
            {planSaving ? "저장 중…" : "저장"}
          </button>
          <button type="button" onClick={sharePlan}>
            공유
          </button>
          <button type="button" onClick={() => setPlanViewOpen(false)}>
            ← 메인으로 돌아가기
          </button>
        </div>
      </header>
      {utilityMessage && (
        <div className="plan-utility-toast" role="status">
          {utilityMessage}
        </div>
      )}
      <div className="plan-fullscreen-body">
        <aside className="full-trip-aside">
          {mobilePreview ? (
            <div className="mobile-trip-overview">
              <p><MapPin size={11} /> {(destinationRegion || "여행지").replace("특별자치도", "")} 여행 · {nightCount}박 {dates.length}일</p>
              <h2>{destinationName} 여행</h2>
            </div>
          ) : (
            <>
              <p>{destinationRegion}</p>
              <h2>{tripTitle}</h2>
              <span>
                {originName} → {destinationName} · {dateLabel(dates[0])} {timeLabel(startTime)} —{" "}
                {dateLabel(dates[dates.length - 1])} {timeLabel(endTime)}
              </span>
            </>
          )}
          <div className="full-booking-list">
            <b>{intercityTransportSummary}</b>
            <b>
              ⌂{" "}
              {selectedStay
                ? `${selectedStay.name} · ${nightCount}박`
                : "숙소 미선택"}
            </b>
            {localTransportSummary && <b>{localTransportSummary}</b>}
          </div>
          <div className="full-day-tabs">
            {dates.map((date, index) => (
              <button
                type="button"
                key={date}
                className={activeDay === index ? "active" : ""}
                onClick={() => {
                  setActiveDay(index);
                }}
              >
                <small>DAY {index + 1}</small>
                <b>{date.slice(5).replace("-", ".")}</b>
                <span>{safeDayPlans[index]?.[0] || "일정 준비 중"}</span>
              </button>
            ))}
          </div>
          <section className="full-budget-summary side-budget-summary">
            <div className="full-budget-top">
              <span>선택한 예약 기준 · 1인 예상 경비</span>
              <h2>1인 {money(total)}원</h2>
              <p>총 {travelers}명 예상 여행비 약 {money(total * (travelers || 1))}원</p>
            </div>
            <button
              type="button"
              className="full-cost-toggle"
              onClick={() => setScheduleView("budget")}
            >
              <span>상세 경비 보기</span>
              <b>→</b>
            </button>
          </section>
        </aside>
        <main className="full-timetable">
          <div className="full-day-title">
            <span>
              DAY {activeDay + 1} ·{" "}
              {dates[activeDay]?.slice(5).replace("-", ".")}
            </span>
            <h1>{scheduleView === "timeline" ? day[0] : scheduleView === "calendar" ? mobilePreview ? `${activeDay + 1}일차 시간표` : `${dates.length}일 여행 시간표` : "여행 경비 한눈에 보기"}</h1>
            <p>
              {scheduleView === "timeline"
                ? day[1]
                : scheduleView === "calendar"
                  ? mobilePreview ? "선택한 하루의 이동·식사·관광 시간을 순서대로 확인하세요." : "세 날짜의 이동·식사·관광·휴식 시간을 한눈에 비교해 보세요."
                  : "선택한 예약과 장소별 예상 금액을 1인 기준으로 정리했어요."}
            </p>
            <div>
              <button
                type="button"
                className={
                  scheduleView === "timeline" ? "view-tab active" : "view-tab"
                }
                onClick={() => setScheduleView("timeline")}
              >
                일정
              </button>
              <button
                type="button"
                className={
                  scheduleView === "calendar" ? "view-tab active" : "view-tab"
                }
                onClick={() => setScheduleView("calendar")}
              >
                시간표
              </button>
              <button
                type="button"
                className={scheduleView === "budget" ? "view-tab active" : "view-tab"}
                onClick={() => setScheduleView("budget")}
              >
                경비
              </button>
              <button type="button" className="device-preview-toggle" onClick={() => setMobilePreview((current) => !current)}>
                {mobilePreview ? <Monitor size={14} /> : <Smartphone size={14} />}
                {mobilePreview ? "데스크톱으로 돌아가기" : "모바일 화면으로 전환"}
              </button>
              {mobilePreview && <button type="button" className="mobile-only-route-button" onClick={() => document.querySelector(".mobile-preview .full-route-map")?.scrollIntoView({ behavior: "smooth", block: "center" })}>동선 지도 보기</button>}
              {stayChange && (
                <button
                  type="button"
                  className="stay-comparison-button"
                  onClick={onOpenStayComparison}
                >
                  숙소 변경 내용 보기
                </button>
              )}
              {scheduleView === "timeline" && (
                <div className="itinerary-editor-bar">
                  <span>
                    <GripVertical size={16} aria-hidden="true" />
                    <b>일정 편집</b>
                    <small>카드를 끌어 순서를 바꾸거나 원하는 위치를 골라 추가하세요.</small>
                  </span>
                  <button
                    type="button"
                    className="itinerary-add-button"
                    onClick={() => {
                      const lastIndex = Math.max(0, day[2].length - 1);
                      const lastEvent = day[2][lastIndex];
                      setStopComposer({
                        afterEventId: lastEvent?.[6]?.id || (lastEvent ? `day-${activeDay + 1}-stop-${lastIndex + 1}` : ""),
                        name: "",
                        type: "ATTRACTION",
                        stayMinutes: 60,
                      });
                    }}
                  >
                    <Plus size={17} aria-hidden="true" />
                    원하는 일정 추가
                  </button>
                </div>
              )}
              <div className="stay-question">
                <b>혹시 숙소를 변경하고 싶으신가요?</b>
                <button type="button" className="subtle" onClick={onOpenStay}>
                  AI에게 숙소 다시 추천받기
                </button>
              </div>
            </div>
          </div>
          {mobilePreview && scheduleView === "timeline" && (
            <div className="mobile-inline-route">
              <RouteMap
                activeDay={activeDay}
                dayPlans={dayPlans}
                destinationLocation={destinationLocation}
                originLocation={originLocation}
                routeResults={routeResults}
                localTransport={localTransport}
                compact
                hideHeader
              />
            </div>
          )}
          {scheduleView === "timeline" ? (
            <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId={`day-${activeDay}-timeline`}>
              {(dropProvided) => <div className="full-timeline" ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
              {day[2].map(([time, icon, name, detail, stay, travel, metadata = {}], index) => {
                const price = eventCost(name, metadata);
                const approximate = /저녁|점심|카페|고등어|시장|오설록/.test(
                  name,
                );
                const eventId = metadata.id || `day-${activeDay + 1}-stop-${index + 1}`;
                const liveBookingUrl = /^https?:\/\//i.test(metadata.bookingUrl || "")
                  ? metadata.bookingUrl
                  : null;
                const backendPlaceType = String(metadata.type || "").toUpperCase();
                const backendCategory = String(metadata.category || "").toUpperCase();
                const isRentalStop =
                  /RENTAL|RENT_CAR|CAR_RENTAL/.test(backendPlaceType)
                  || /RENTAL|RENT_CAR|CAR_RENTAL/.test(backendCategory)
                  || /렌터카/.test(name);
                const isAirportStop =
                  backendPlaceType === "AIRPORT"
                  || (!backendPlaceType && (isAirportName(name) || /항공편|탑승/.test(name || "")));
                const isArrivalAirport =
                  backendPlaceType === "AIRPORT" && backendCategory.includes("ARRIVAL_AIRPORT");
                const hasPartnerBooking = isRentalStop || (isAirportStop && !isArrivalAirport);
                const bookingLabel = "제휴사 예약하기";
                const costLabel = isRentalStop
                  ? selectedRental?.price
                    ? `렌터카 총 ${money(selectedRental.price)}원`
                    : ""
                  : price
                    ? `${approximate ? "약 " : ""}1인 ${money(price)}원`
                    : "";
                const displayTime = eventClock(time, metadata);
                const displayStay = isArrivalAirport && !(metadata.stayMinutes > 0) ? "도착" : stay;
                const nextEvent = day[2][index + 1];
                const activeRoute = routeResults.find((route, routeIndex) =>
                  Number(route?.dayIndex ?? routeIndex) === activeDay
                    || Number(route?.dayNumber) === activeDay + 1,
                );
                const currentRouteName = normalizedRouteName(name);
                const nextRouteName = normalizedRouteName(nextEvent?.[2]);
                const matchingSegment = (activeRoute?.segments || []).find((segment) => {
                  const departureName = normalizedRouteName(segment?.departureName);
                  const arrivalName = normalizedRouteName(segment?.arrivalName);
                  return currentRouteName && nextRouteName
                    && (departureName.includes(currentRouteName) || currentRouteName.includes(departureName))
                    && (arrivalName.includes(nextRouteName) || nextRouteName.includes(arrivalName));
                });
                const nextStartMinutes = nextEvent ? eventMinutes(nextEvent[0], nextEvent[6] || {}) : null;
                const currentStartMinutes = eventMinutes(time, metadata);
                const scheduleGap = nextStartMinutes != null && currentStartMinutes != null
                  ? nextStartMinutes - currentStartMinutes - durationMinutes(stay, metadata)
                  : 0;
                const travelAfter = Math.max(0, Math.round(
                  Number(travel)
                    || Number(metadata.travelMinutes)
                    || Number(matchingSegment?.durationMinutes)
                    || scheduleGap
                    || 0,
                ));
                const isCafe = backendPlaceType === "CAFE"
                  || (!backendPlaceType && (/☕/.test(icon || "") || /카페|커피|디저트|베이커리/.test(name || "")));
                const isRestaurant = backendPlaceType === "RESTAURANT"
                  || (!backendPlaceType && /🍽|🍜|🍴|🍲|🥘|🍱|🍣|🍖|🍗|🥩|🍛|🍚/.test(icon || ""))
                  || (!backendPlaceType && /식당|국수|스시|초밥|고기|김밥|돈가스|쌈밥|흑돼지|전복/.test(name || ""));
                const isDiningPlace = isRestaurant || isCafe;
                const hasAttractionDetail = backendPlaceType === "ATTRACTION"
                  && (/^[1-9]\d*$/.test(String(metadata.placeId ?? "")) || hasJejuAttractionDetail(name));
                const eventType = isRentalStop
                  ? "이동 준비"
                  : isCafe
                    ? "카페"
                    : isRestaurant
                      ? "식사"
                      : backendPlaceType === "ACCOMMODATION" || /체크인|체크아웃|호텔|숙소|짐 정리/.test(name || "")
                        ? "숙소"
                        : isAirportStop || /항공|탑승|역·터미널/.test(name || "")
                          ? "교통"
                          : "관광";
                const showStopPrice = Boolean(costLabel)
                  && !isRentalStop
                  && !isAirportStop
                  && !/(?:국제)?공항$|항공편|탑승/.test(name || "")
                  && eventType !== "숙소";
                const consumerDetail = consumerEventDetail({
                  name,
                  detail,
                  eventType,
                  price,
                  money,
                  metadata,
                });
                return (
                  <Draggable
                    key={eventId}
                    draggableId={eventId}
                    index={index}
                    isDragDisabled={Boolean(metadata.isLocked)}
                  >
                  {(dragProvided, dragSnapshot) => (
                  <article
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...(!metadata.isLocked ? dragProvided.dragHandleProps : {})}
                    style={{
                      ...dragProvided.draggableProps.style,
                      ...(!metadata.isLocked ? dragProvided.dragHandleProps?.style : {}),
                      cursor: metadata.isLocked ? "default" : undefined,
                    }}
                    className={`itinerary-stop${isDiningPlace ? " is-dining-stop" : eventType === "관광" ? " is-attraction-stop" : ""}${metadata.isLocked ? "" : " is-draggable"}${dragSnapshot.isDragging ? " is-dragging" : ""}`}
                  >
                    <time>{displayTime}</time>
                    <span>{icon}</span>
                    <div>
                      <small className="stop-meta">
                        <span>일정 {index + 1}</span>
                        <em>{eventType} · {displayStay}</em>
                      </small>
                      <div className="stop-title-row">
                        <div className="stop-place-heading">
                          <b>{name}</b>
                          {showStopPrice && (
                            <em className="stop-price-summary">
                              <small>{isDiningPlace ? "예상 식비" : "예상 금액"}</small>
                              <strong>{costLabel}</strong>
                            </em>
                          )}
                        </div>
                        {hasPartnerBooking && liveBookingUrl ? (
                          <a
                            className={`stop-booking-link ${isRentalStop ? "is-rental" : "is-flight"}`}
                            href={liveBookingUrl}
                            target="_blank"
                            rel="noreferrer noopener sponsored"
                            onClick={(event) => event.stopPropagation()}
                            aria-label={`${metadata.bookingProvider || "제휴사"}에서 ${name} 예약하기`}
                          >
                            <span>{bookingLabel} <em>↗</em></span>
                          </a>
                        ) : hasPartnerBooking ? (
                          <button type="button" className={`stop-booking-link ${isRentalStop ? "is-rental" : "is-flight"}`} onClick={(event) => { event.stopPropagation(); showUtilityMessage("제휴 예약 페이지 연동 준비 중입니다."); }}>
                            <span>{bookingLabel} <em>↗</em></span>
                          </button>
                        ) : null}
                      </div>
                      {metadata.flightLabel && (
                        <div className="stop-flight-inline">
                          <span>✈ {metadata.flightLabel}</span>
                          {(formatFlightClock(metadata.flightDepartureAt) || formatFlightClock(metadata.flightArrivalAt)) && (
                            <small>
                              {formatFlightClock(metadata.flightDepartureAt) || "--:--"}
                              {" → "}
                              {formatFlightClock(metadata.flightArrivalAt) || "--:--"}
                              {metadata.flightDurationMinutes != null ? ` · ${Math.round(Number(metadata.flightDurationMinutes))}분` : ""}
                            </small>
                          )}
                        </div>
                      )}
                      <p>{consumerDetail}</p>
                      {!metadata.isLocked && (
                        <div
                          className={`stop-card-actions${isDiningPlace || hasAttractionDetail ? " has-detail" : ""}`}
                          onPointerDown={(event) => event.stopPropagation()}
                        >
                          {isDiningPlace && (
                            <button
                              type="button"
                              className="stop-detail-action"
                              onClick={(event) => {
                                event.stopPropagation();
                                openRestaurantDetail({ name, metadata, placeType: isCafe ? "CAFE" : "RESTAURANT" });
                              }}
                            >
                              메뉴·후기 보기
                            </button>
                          )}
                          {hasAttractionDetail && (
                            <button type="button" className="stop-detail-action" onClick={(event) => {
                              event.stopPropagation();
                              setAttractionDetailTarget({ id: metadata.placeId, name });
                            }}>
                              상세보기
                            </button>
                          )}
                          <button
                            type="button"
                            className="stop-change"
                            onClick={(event) => {
                              event.stopPropagation();
                              setPlacePicker({ eventId, name, item: { icon, name, detail, ...metadata } });
                            }}
                          >
                            장소 변경
                          </button>
                        </div>
                      )}
                    </div>
                    {!metadata.isLocked && (
                      <button
                        type="button"
                        className="stop-remove-action"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation();
                          onRemoveStop?.(activeDay, eventId);
                        }}
                        aria-label={`${name} 일정에서 제외`}
                        title={`${name} 일정에서 제외`}
                      >
                        <Minus size={14} aria-hidden="true" />
                      </button>
                    )}
                    {nextEvent && travelAfter > 0 && (
                      <div className="stop-route-leg" aria-label={`다음 장소까지 이동시간 ${travelAfter}분`}>
                        <span className="route-leg-arrow"><ArrowDown size={13} aria-hidden="true" /></span>
                        <CarFront size={14} aria-hidden="true" />
                        <span className="route-leg-copy"><small>다음 일정으로</small><b>이동 {travelAfter}분</b></span>
                      </div>
                    )}
                  </article>
                  )}
                  </Draggable>
                );
              })}
              {dropProvided.placeholder}
              </div>}
            </Droppable>
            </DragDropContext>
          ) : scheduleView === "calendar" ? (
            <CampusTimetable activeDay={activeDay} compact={mobilePreview} dates={dates} dayPlans={dayPlans} />
          ) : (
            <section className="inline-budget-view" aria-label="여행 상세 경비">
              <header>
                <span>선택한 예약 기준 · 1인 예상 경비</span>
                <h2>1인 {money(total)}원</h2>
                <p>총 {travelers}명 예상 여행비 약 {money(total * (travelers || 1))}원</p>
              </header>
              <div className="inline-cost-groups">
                <div className="inline-cost-column inline-cost-column-left">
                  {costDetails.filter((group) => !/식사·관광비/.test(group.group)).map((group) => (
                    <CostGroupCard key={`inline-${group.group}`} group={group} money={money} travelers={travelers} />
                  ))}
                </div>
                <div className="inline-cost-column inline-cost-column-right">
                  {costDetails.filter((group) => /식사·관광비/.test(group.group)).map((group) => (
                    <CostGroupCard key={`inline-${group.group}`} group={group} money={money} travelers={travelers} />
                  ))}
                </div>
              </div>
              <p className="cost-uncertainty">※ 식비·간식·체험비는 실제 주문, 인원, 현장 요금에 따라 달라질 수 있어요.</p>
            </section>
          )}
        </main>
        <aside className="full-budget">
          <RouteMap
            activeDay={activeDay}
            dayPlans={dayPlans}
            destinationLocation={destinationLocation}
            originLocation={originLocation}
            routeResults={routeResults}
            localTransport={localTransport}
            compact={mobilePreview || isMobile}
            visible={scheduleView !== "budget"}
          />
          <div className="full-budget-note">
            <b>✦ AI 일정 반영</b>
            <span>
              숙소·교통편을 바꾸면 객실 수, 이동 시간, 세부 경비와 추천 동선을
              다시 계산합니다.
            </span>
          </div>
        </aside>
      </div>
      {attractionDetailTarget && (
        <AttractionDetailModal key={String(attractionDetailTarget.id)}
          attractionId={attractionDetailTarget.id} name={attractionDetailTarget.name}
          compact={mobilePreview || isMobile}
          onClose={() => setAttractionDetailTarget(null)} />
      )}
      {restaurantDetail && (
        <div className="restaurant-detail-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setRestaurantDetail(null);
        }}>
          <section className="restaurant-detail-modal" role="dialog" aria-modal="true" aria-label={`${restaurantDetail.name} ${restaurantDetailType === "CAFE" ? "카페" : "식당"} 상세 정보`}>
            <button type="button" className="restaurant-detail-close" onClick={() => setRestaurantDetail(null)} aria-label={`${restaurantDetailType === "CAFE" ? "카페" : "식당"} 상세 닫기`}><X size={20} /></button>
            {restaurantLoading ? (
              <div className="restaurant-detail-loading" role="status"><i /><i /><i /><p>{restaurantDetail.name}의 메뉴와 후기를 불러오고 있어요.</p></div>
            ) : restaurantError ? (
              <div className="restaurant-detail-error"><h3>{restaurantDetail.name}</h3><p>{restaurantError}</p><button type="button" onClick={() => setRestaurantDetail(null)}>닫기</button></div>
            ) : (
              <>
                <div className={`restaurant-detail-hero${restaurantHeroLandscape ? " is-landscape" : ""}${restaurantHeroFailed || !(restaurantDetail.representativeImageUrl || restaurantDetail.imageUrls?.[0]) ? " is-fallback" : ""}`}>
                  {!restaurantHeroFailed && (restaurantDetail.representativeImageUrl || restaurantDetail.imageUrls?.[0]) && <img
                    src={restaurantDetail.representativeImageUrl || restaurantDetail.imageUrls?.[0]}
                    alt={`${restaurantDetail.name} 대표 이미지`}
                    onLoad={(event) => setRestaurantHeroLandscape(event.currentTarget.naturalWidth / Math.max(1, event.currentTarget.naturalHeight) > 1.08)}
                    onError={() => setRestaurantHeroFailed(true)}
                  />}
                  <span>{restaurantDetail.category || (restaurantDetailType === "CAFE" ? "추천 카페" : "추천 식당")}</span>
                </div>
                <div className="restaurant-detail-content">
                  <header>
                    <div className="restaurant-detail-heading">
                      <small>TRIPBUDDY DINING GUIDE</small>
                      <h2>{restaurantDetail.name}</h2>
                      <p>{restaurantDetail.address}</p>
                    </div>
                    {restaurantDetail.rating != null && <strong><Star size={15} fill="currentColor" /> {restaurantDetail.rating.toFixed(1)} <small>후기 {restaurantDetail.reviewCount?.toLocaleString("ko-KR")}개</small></strong>}
                  </header>
                  <section className="restaurant-menu-section">
                    <div className="restaurant-section-title"><span>대표 메뉴</span><small>가격은 매장 사정에 따라 달라질 수 있어요.</small></div>
                    <div className="restaurant-menu-list">
                      {restaurantDetail.menus?.map((menu) => <article key={menu.id || menu.name}>
                        <div><b>{menu.name}{menu.isSignature && <em>대표</em>}</b><p>{menu.description}</p></div>
                        <strong>{menu.price == null ? `약 ${money(restaurantFallbackPrice || (restaurantDetailType === "CAFE" ? 9000 : 20000))}원` : `${money(menu.price)}원`}</strong>
                      </article>)}
                    </div>
                  </section>
                  <section className="restaurant-review-section" id="restaurant-review-summary">
                    <div className="restaurant-section-title"><span>후기 한눈에 보기</span><small>{restaurantDetail.isMock ? "시연용 요약" : restaurantDetail.sourceLabel}</small></div>
                    <p>{restaurantDetail.reviewSummary || "후기 내용은 카카오플레이스에서 확인해 주세요."}</p>
                    <div>{restaurantDetail.reviewKeywords?.map((keyword) => <span key={keyword}>#{keyword}</span>)}</div>
                    <div className="restaurant-review-action">
                      {/^https?:\/\//i.test(restaurantDetail.placeUrl || "") ? (
                        <a href={restaurantDetail.placeUrl} target="_blank" rel="noreferrer noopener">
                          <MapPin size={14} /> 카카오플레이스에서 전체 후기 보기 <ExternalLink size={12} />
                        </a>
                      ) : /^https?:\/\//i.test(restaurantDetail.naverMapUrl || "") ? (
                        <a href={restaurantDetail.naverMapUrl} target="_blank" rel="noreferrer noopener">
                          <MapPin size={14} /> 네이버 지도에서 전체 후기 보기 <ExternalLink size={12} />
                        </a>
                      ) : null}
                    </div>
                  </section>
                  <div className="restaurant-detail-bottom-actions">
                    <button type="button" onClick={() => document.getElementById("restaurant-review-summary")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                      후기 보기
                    </button>
                    {/^https?:\/\//i.test(restaurantDetail.placeUrl || "") ? (
                      <a href={restaurantDetail.placeUrl} target="_blank" rel="noreferrer noopener">
                        <MapPin size={14} /> 카카오플레이스 <ExternalLink size={12} />
                      </a>
                    ) : /^https?:\/\//i.test(restaurantDetail.naverMapUrl || "") ? (
                      <a href={restaurantDetail.naverMapUrl} target="_blank" rel="noreferrer noopener">
                        <MapPin size={14} /> 네이버 지도 <ExternalLink size={12} />
                      </a>
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}
      {stopComposer && (
        <div className="stop-composer-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setStopComposer(null);
        }}>
          <form className="stop-composer-modal" role="dialog" aria-modal="true" aria-label="일정 추가" onSubmit={submitAddedStop}>
            <button type="button" className="modal-close" onClick={() => setStopComposer(null)} aria-label="일정 추가 닫기">
              <X size={18} aria-hidden="true" />
            </button>
            <p>✦ TripBuddy · SCHEDULE EDIT</p>
            <h3>이 다음에 어떤 일정을<br />추가할까요?</h3>
            <span>장소를 찾은 뒤 이후 시간과 지도 동선을 함께 다시 맞춥니다.</span>
            <label>
              <b>추가 위치</b>
              <select value={stopComposer.afterEventId} onChange={(event) => setStopComposer((current) => ({ ...current, afterEventId: event.target.value }))}>
                <option value="">첫 일정으로 추가</option>
                {day[2].map((item, index) => {
                  const optionId = item[6]?.id || `day-${activeDay + 1}-stop-${index + 1}`;
                  return <option value={optionId} key={optionId}>{index + 1}. {item[2]} 다음</option>;
                })}
              </select>
            </label>
            <label>
              <b>장소 이름</b>
              <input autoFocus value={stopComposer.name} onChange={(event) => setStopComposer((current) => ({ ...current, name: event.target.value }))} placeholder="예: 애월 해안도로" />
            </label>
            <div className="stop-composer-grid">
              <label>
                <b>일정 종류</b>
                <select value={stopComposer.type} onChange={(event) => setStopComposer((current) => ({ ...current, type: event.target.value }))}>
                  <option value="ATTRACTION">관광지</option>
                  <option value="RESTAURANT">식당</option>
                  <option value="CAFE">카페</option>
                </select>
              </label>
              <label>
                <b>머무는 시간</b>
                <select value={stopComposer.stayMinutes} onChange={(event) => setStopComposer((current) => ({ ...current, stayMinutes: Number(event.target.value) }))}>
                  <option value={30}>30분</option>
                  <option value={60}>1시간</option>
                  <option value={90}>1시간 30분</option>
                  <option value={120}>2시간</option>
                </select>
              </label>
            </div>
            <button type="submit" className="stop-composer-submit" disabled={stopComposerSaving || !stopComposer.name.trim()}>
              {stopComposerSaving ? "장소 찾는 중…" : "이 위치에 일정 추가"}
            </button>
          </form>
        </div>
      )}
      {placePicker && (
        <div className="stop-picker-backdrop" role="presentation">
          <section
            className={`stop-picker-modal${String(placePicker.item?.type || "").toUpperCase() === "ATTRACTION" ? " is-attraction-picker" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label="장소 변경"
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setPlacePicker(null)}
              aria-label="장소 변경 닫기"
            >
              <X size={18} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <p>✦ TripBuddy AI · ROUTE EDIT</p>
            <h3>
              {placePicker.name} 대신
              <br />
              어디로 가볼까요?
            </h3>
            <span>
              장소를 고른 뒤 저장하면 이동 시간, 지도 경로와 1인 예상 경비를 함께
              다시 계산해요.
            </span>
            <div className="route-place-options">
              {placeOptions.map((place) => (
                <button
                  type="button"
                  key={place.name}
                  onClick={() => applyPlaceChange(place)}
                >
                  {place.image ? (
                    <img src={place.image} alt={`${place.name} 대표 이미지`} loading="lazy" />
                  ) : (
                    <div className="route-place-photo-fallback" aria-hidden="true">
                      {place.icon}
                    </div>
                  )}
                  <span>
                    <i aria-hidden="true">{place.icon}</i>
                    <b>{place.name}</b>
                    <small>
                      {place.distanceKm != null ? `${place.distanceKm.toFixed(1)}km · 차로 약 ${place.travel}분` : `${place.duration} · 이동 ${place.travel}분`}
                    </small>
                    {place.representativeMenu && <em>대표 메뉴 · {place.representativeMenu}</em>}
                    {place.routeSource && <small className="route-estimate-source">{place.routeSource}</small>}
                  </span>
                </button>
              ))}
            </div>
            <form
              className="route-custom-prompt"
              onSubmit={(event) => {
                event.preventDefault();
                if (!customPlace.trim()) return;
                applyPlaceChange({
                  icon: "✦",
                  name: customPlace.trim(),
                  detail:
                    "사용자가 직접 요청한 장소를 중심으로 이동 시간과 예상 경비를 다시 계산해요.",
                  duration: "90분",
                  travel: 35,
                });
                setCustomPlace("");
              }}
            >
              <label htmlFor="custom-place">혹시 어디로 가고 싶으신가요?</label>
              <div>
                <input
                  id="custom-place"
                  value={customPlace}
                  onChange={(event) => setCustomPlace(event.target.value)}
                  placeholder="가고 싶은 장소를 입력하세요"
                />
                <button type="submit">동선에 반영</button>
              </div>
            </form>
          </section>
        </div>
      )}
      {routeRecalculation && (
        <div
          className="route-recalculation-overlay"
          role="status"
          aria-live="polite"
        >
          <section>
            <TransitionIcon type="plan" />
            <p>TripBuddy AI · ROUTE RECALCULATION</p>
            <h2>
              변경된 장소를 기점으로
              <br />
              경로와 비용을 재설정하고 있어요.
            </h2>
            <span>
              {routeRecalculation.from} → {routeRecalculation.to} 변경을 반영해
              이동 시간과 1인 예상 경비를 다시 계산합니다.
            </span>
            <div className="route-recalculation-dots">
              <i />
              <i />
              <i />
            </div>
          </section>
        </div>
      )}
      {orderRecalculating && (
        <div className="route-recalculation-overlay order-recalculation" role="status" aria-live="polite">
          <section>
            <TransitionIcon type="plan" />
            <p>TripBuddy AI · SCHEDULE OPTIMIZING</p>
            <h2>새로운 순서에 맞춰<br />이동 시간과 경로를 계산하고 있어요.</h2>
            <span>장소 간 거리와 선택한 현지 이동수단을 반영해 모든 방문 시각을 다시 맞춥니다.</span>
            <div className="route-recalculation-dots"><i /><i /><i /></div>
          </section>
        </div>
      )}
      {routeResult && (
        <div className="route-result-backdrop" role="presentation">
          <section
            className="route-result-modal"
            role="dialog"
            aria-modal="true"
            aria-label="장소 변경 완료"
          >
            <TransitionIcon type="plan" />
            <p>✦ TripBuddy AI · ROUTE UPDATE COMPLETE</p>
            <h3>재설정이 완료되었습니다!</h3>
            <span>
              {routeResult.to}를 기준으로 다음 동선과 예상 경비를
              업데이트했어요.
            </span>
            <div>
              <p>
                <small>변경 장소</small>
                <del>{routeResult.from}</del>
                <b>→ {routeResult.to}</b>
              </p>
              <p>
                <small>이동 시간</small>
                <b>다음 장소까지 약 {routeResult.travel}분 반영</b>
              </p>
              <p>
                <small>1인 예상 경비</small>
                <b
                  className={
                    routeResult.delta > 0
                      ? "increase"
                      : routeResult.delta < 0
                        ? "decrease"
                        : ""
                  }
                >
                  {routeResult.delta > 0
                    ? `약 ${money(routeResult.delta)}원 증가`
                    : routeResult.delta < 0
                      ? `약 ${money(Math.abs(routeResult.delta))}원 절감`
                      : "변동 없음"}
                </b>
              </p>
            </div>
            <button type="button" onClick={() => setRouteResult(null)}>
              변경된 일정 확인하기 →
            </button>
          </section>
        </div>
      )}
    </section>
  );
}

export default PlanFullscreen;
