import {
  eventPrice,
  estimateIntercityFare,
  localOptions,
  outboundOptions,
  money,
  placeEntryCost,
  transportName,
} from "../data/mockData.js";
import { getPlaceCostEstimate } from "../utils/placeCostEstimates.js";
import {
  addPriceVariationBuffer,
  stablePlanEstimate,
  sumCostGroups,
} from "../utils/costEstimate.js";
import { isAirportRouteSegment } from "../utils/routeFilters.js";
import {
  VEHICLE_EFFICIENCY_KMPL,
  VEHICLE_FUEL_TYPE_MAP,
  inferRentalFuelType,
} from "./domainMappings.js";

/** 1인/공동 경비와 서버 견적을 조정하는 순수 계산. 조회·화면 상태·저장은 담당하지 않습니다. */
export function calculateTripCosts({
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
}) {
  const originLabel =
    departureLocation?.detail ||
    departureLocation?.name ||
    departureLocation?.region ||
    "출발지";

  const destinationLabel =
    destinationLocation?.detail ||
    destinationLocation?.name ||
    destinationLocation?.region ||
    "선택한 여행지";

  const selectedTransportMode = transport || (selectedFlight ? "FLIGHT" : "");

  const selectedTransportLabel = transportName(
    selectedTransportMode,
    outboundOptions,
  );

  const selectedLocalTransportLabel = transportName(
    localTransport,
    localOptions,
  );

  const intercityTransportTotal =
    selectedTransportMode === "FLIGHT"
      ? selectedFlight?.fare || 0
      : selectedTicket
        ? selectedTicket.fare
        : selectedTransportMode
          ? estimateIntercityFare({
              mode: selectedTransportMode,

              origin: departureLocation,

              destination: destinationLocation,

              travelers: party,
            })
          : 0;

  const routedItineraryDistanceKm = (backendPlan?.routes || [])
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

  const vehicleEfficiency = VEHICLE_EFFICIENCY_KMPL[carType] || 12.5;

  const backendVehicleRouteCostTotal = (backendPlan?.routes || [])
    .flatMap((route) => route?.segments || [])
    .filter((segment) =>
      ["RENTAL_CAR", "OWN_CAR"].includes(
        String(segment?.mode || "").toUpperCase(),
      ),
    )
    .reduce((sum, segment) => {
      const cost = Number(segment?.cost);
      return sum + (Number.isFinite(cost) && cost > 0 ? cost : 0);
    }, 0);

  const selectedVehicleFuelType =
    localTransport === "RENTAL" && selectedRental
      ? inferRentalFuelType(selectedRental)
      : VEHICLE_FUEL_TYPE_MAP[carFuel] || "GASOLINE";

  const fuelPrice =
    {
      휘발유: 1750,

      경유: 1650,

      LPG: 1100,
    }[carFuel] || 1750;

  const localFuelAndParkingTotal =
    backendVehicleRouteCostTotal > 0
      ? Math.round(backendVehicleRouteCostTotal + nights * 9000)
      : selectedVehicleFuelType === "ELECTRIC"
        ? Math.round(nights * 9000)
        : Math.round(
            (itineraryDistanceKm / vehicleEfficiency) * fuelPrice +
              nights * 9000,
          );

  const usesRental = localTransport === "RENTAL" && Boolean(selectedRental);

  const rentalFeePerPerson = usesRental ? selectedRental.price / party : 0;

  const localFuelAndParkingPerPerson =
    usesRental || selectedTransportMode === "CAR"
      ? localFuelAndParkingTotal / party
      : 0;

  const localTransitTotal =
    localTransport === "TRANSIT"
      ? Math.max(
          6000,

          nights * 12000 + 5000,
        )
      : localTransport === "TAXI"
        ? Math.max(
            18000,

            nights * 28000 + 10000,
          )
        : 0;

  const localTravelTotal =
    rentalFeePerPerson + localFuelAndParkingPerPerson + localTransitTotal;

  const tripDurationLabel = `${nights}박 ${Math.max(1, nights + 1)}일`;

  const costForEvent = (name, metadata = {}) => {
    const suppliedPrice = Number(metadata.pricePerPerson);
    if (Number.isFinite(suppliedPrice) && suppliedPrice > 0)
      return suppliedPrice;

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

  const itineraryCostRows = dayPlans.flatMap((day, dayIndex) =>
    (day?.[2] || []).flatMap(([time, icon, name, , , , metadata = {}]) => {
      const backendType = String(metadata?.type || "").toUpperCase();

      /*
       * 비용 상세에는 실제로 개인별 결제가 발생하는 장소만 넣는다.
       * FLIGHT / AIRPORT / ACCOMMODATION 같은 이동·예약 이벤트는
       * 아래의 항공권·숙소·렌터카 그룹에서 한 번만 계산하므로
       * 일정 장소 비용에 다시 넣으면 중복 노출된다.
       */
      const isBackendMeal =
        backendType === "RESTAURANT" || backendType === "CAFE";

      const isBackendActivity = backendType === "ATTRACTION";

      const hasBackendType = Boolean(backendType);

      if (
        !name ||
        (hasBackendType && !isBackendMeal && !isBackendActivity) ||
        (!hasBackendType &&
          /항공|공항|렌터카|숙소|호텔|체크인|체크아웃|탑승 준비|출발 준비|귀가|이동 준비|편 출발$/.test(
            name,
          ))
      ) {
        return [];
      }

      const isMeal =
        isBackendMeal ||
        (!hasBackendType &&
          (/🍽|🍚|🍜|🍲|☕|🥐/.test(icon || "") ||
            /점심|저녁|식사|카페|간식|조식|시장/.test(name)));

      const placeEstimate = getPlaceCostEstimate(name, metadata);

      return [
        {
          type: isMeal ? "meal" : "activity",

          row: [
            name,

            costForEvent(name, metadata),

            `${dayIndex + 1}일차 ${time} · ${
              metadata.provider
                ? `${metadata.provider} 제공가`
                : isMeal
                  ? `${placeEstimate.source} · 1인 예상`
                  : "1인 입장·체험 기준"
            }`,
          ],
        },
      ];
    }),
  );

  const mealRows = itineraryCostRows
    .filter((item) => item.type === "meal")
    .map((item) => item.row);

  const activityRows = itineraryCostRows
    .filter((item) => item.type === "activity")
    .map((item) => item.row);

  const foodTotal = mealRows.reduce(
    (sum, [, value]) => sum + value,

    0,
  );

  const activityTotal = Math.max(
    0,

    activityRows.reduce(
      (sum, [, value]) => sum + value,

      0,
    ) + placeEditAdjustment,
  );

  /*
   * 숙소 비용 계산은 priceAvg 기준.
   * null이면 계산에서는 0 처리.
   * 숙소 자체는 목록에서 제거하지 않음.
   */
  const stayTotal =
    selectedStay?.priceAvg != null
      ? (selectedStay.priceAvg * nights * rooms) / party
      : 0;

  const driveTotal = localTravelTotal;

  const items = (() => [
    {
      name:
        selectedTransportMode === "FLIGHT"
          ? "항공"
          : selectedTransportMode
            ? `${selectedTransportLabel} 이동`
            : "출발 이동",

      total: intercityTransportTotal,

      color: "flight",
    },

    {
      name: "숙소",

      total: stayTotal,

      color: "stay",
    },

    {
      name: usesRental
        ? "렌터카·현지 이동"
        : localTransport
          ? `${selectedLocalTransportLabel} 현지 이동`
          : "현지 이동",

      total: driveTotal,

      color: "drive",
    },

    {
      name: "식비",

      total: foodTotal,

      color: "food",
    },

    {
      name: "관광·체험",

      total: activityTotal,

      color: "play",
    },
  ])();

  const mockCostDetails = (() =>
    [
      {
        group: "개인 교통비 · 1인 기준",

        rows: [
          [
            selectedTransportMode === "FLIGHT"
              ? "왕복 항공권"
              : `${selectedTransportLabel} 이동`,

            intercityTransportTotal,

            selectedTransportMode === "FLIGHT"
              ? selectedFlight
                ? `${originLabel} ↔ ${destinationLabel} · 왕복 1인`
                : "가는 편과 오는 편을 모두 선택하면 반영됩니다."
              : selectedTransportMode === "CAR"
                ? `${originLabel} ↔ ${destinationLabel} · 왕복 약 ${routeDistanceKm * 2}km · 유류비·통행료 ${party}명 분할`
                : selectedTransportMode
                  ? `${originLabel} → ${destinationLabel} · 왕복 1인 예상`
                  : "출발 이동수단 미선택",
          ],

          ...(localTransport && !usesRental && localTravelTotal
            ? [
                [
                  `${destinationLabel} ${selectedLocalTransportLabel}`,

                  localTravelTotal,

                  `${tripDurationLabel} 현지 이동 1인 예상`,
                ],
              ]
            : []),
        ],
      },

      {
        group: "식사·관광비 · 1인 기준",

        rows: [...mealRows, ...activityRows],
      },

      {
        group: `공동 예약·차량비 · ${party}명 N/1`,

        rows: [
          ...(usesRental
            ? [
                [
                  `${selectedRental.company} 렌터카 · ${tripDurationLabel}`,

                  rentalFeePerPerson,

                  `${selectedRental.car} · 총 대여료를 ${party}명 분할`,
                ],

                [
                  "현지 유류·통행료·주차",

                  localFuelAndParkingPerPerson,

                  `${destinationLabel} 일정 약 ${itineraryDistanceKm}km · 오피넷 유가·통행료·주차 포함 · ${party}명 분할`,
                ],
              ]
            : selectedTransportMode === "CAR"
              ? [
                  [
                    "현지 유류·통행료·주차",

                    localFuelAndParkingPerPerson,

                    `${destinationLabel} 일정 약 ${itineraryDistanceKm}km · 오피넷 유가·통행료·주차 포함 · ${party}명 분할`,
                  ],
                ]
              : []),

          [
            selectedStay ? `${selectedStay.name} · ${nights}박` : "선택 숙소",

            stayTotal,

            selectedStay
              ? selectedStay.priceAvg != null
                ? `평균 1박 ${money(
                    selectedStay.priceAvg,
                  )}원 · 객실 ${rooms}개 총액을 ${party}명 분할`
                : `${
                    selectedStay.priceText || "가격 정보 확인"
                  } · 객실 ${rooms}개 · ${party}명 분할`
              : "숙소 미선택",
          ],
        ],
      },

      ...(Object.entries(planEdits).length
        ? [
            {
              group: "장소 변경 차액 · 1인 기준",

              rows: Object.entries(planEdits).map(([key, place]) => {
                const [dayIndex, stopIndex] = key.split("-").map(Number);

                const originalName =
                  baseDayPlans[dayIndex]?.[2]?.[stopIndex]?.[2] || "기존 장소";

                return [
                  place.name,

                  placeEntryCost(place.name) - placeEntryCost(originalName),

                  `${originalName} 대신 선택한 입장·체험비 차이`,
                ];
              }),
            },
          ]
        : []),
    ].filter((group) => Array.isArray(group.rows) && group.rows.length > 0))();

  const backendCostItems = Array.isArray(backendPlan?.costEstimate?.items)
    ? backendPlan.costEstimate.items
    : [];

  const isSharedBackendCostItem = (item, itemLabel) =>
    String(item.scope || "").toLowerCase() === "shared" ||
    /숙박|숙소|호텔|렌터카|주유|유류|통행료|주차/.test(itemLabel);

  const resolveBackendCostItem = (item, { isShared = false } = {}) => {
    const itemLabel = String(
      item.placeName ||
        item.vendorName ||
        item.name ||
        item.label ||
        item.category ||
        "여행 비용",
    );
    const normalizedLabel = itemLabel.replace(/\s+/g, "");
    const itineraryMatch = itineraryCostRows.find(({ row }) => {
      const rowLabel = String(row?.[0] || "");
      const normalizedRowLabel = rowLabel.replace(/\s+/g, "");
      return (
        normalizedRowLabel === normalizedLabel ||
        normalizedRowLabel.includes(normalizedLabel) ||
        normalizedLabel.includes(normalizedRowLabel)
      );
    });
    const perPersonValue = Number(item.perPerson);
    const totalValue = Number(item.total);
    const rawValue =
      Number.isFinite(perPersonValue) && perPersonValue > 0
        ? perPersonValue
        : Number.isFinite(totalValue) && totalValue > 0
          ? isShared
            ? totalValue / party
            : totalValue
          : 0;
    const matchedValue = Number(itineraryMatch?.row?.[1] || 0);
    const itemType = String(
      item.type || item.itemType || item.category || "",
    ).toUpperCase();
    const likelyMeal =
      itineraryMatch?.type === "meal" ||
      /RESTAURANT|CAFE|FOOD|MEAL/.test(itemType) ||
      /식비|식사|카페|커피|메뉴/.test(itemLabel);
    const fallback = getPlaceCostEstimate(itemLabel, {
      type: likelyMeal
        ? /CAFE/.test(itemType)
          ? "CAFE"
          : "RESTAURANT"
        : itemType,
    });
    const value =
      rawValue > 0
        ? rawValue
        : matchedValue > 0
          ? matchedValue
          : fallback.price;

    return {
      itemLabel,
      itineraryMatch,
      likelyMeal,
      rawValue,
      value,
      note:
        rawValue > 0
          ? item.note ||
            (item.approximate ? "백엔드 예상 견적" : "백엔드 확정 견적")
          : itineraryMatch?.row?.[2] || `${fallback.source} · 1인 예상`,
    };
  };

  const costDetails = backendCostItems.length
    ? Object.values(
        backendCostItems.reduce((groups, item) => {
          const itemLabel = String(
            item.placeName ||
              item.vendorName ||
              item.name ||
              item.label ||
              item.category ||
              "여행 비용",
          );
          const isShared = isSharedBackendCostItem(item, itemLabel);
          const resolvedItem = resolveBackendCostItem(item, { isShared });

          const isMealOrActivity =
            resolvedItem.itineraryMatch?.type === "activity" ||
            resolvedItem.likelyMeal ||
            /식비|식사|카페|커피|메뉴|관광|체험|입장/.test(itemLabel);

          const key = isShared
            ? `공동 예약·차량비 · ${party}명 N/1`
            : isMealOrActivity
              ? "식사·관광비 · 1인 기준"
              : "개인 교통비 · 1인 기준";

          groups[key] ||= {
            group: key,

            rows: [],
          };

          groups[key].rows.push([
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
        }, {}),
      )
    : mockCostDetails;

  const mockTotal = items.reduce(
    (sum, item) => sum + item.total,

    0,
  );

  const backendPerPerson = Number(backendPlan?.costEstimate?.perPerson);

  const backendGrandTotal = Number(backendPlan?.costEstimate?.total);

  const backendMissingCostAdjustment = backendCostItems.reduce((sum, item) => {
    const itemLabel = String(
      item.placeName ||
        item.vendorName ||
        item.name ||
        item.label ||
        item.category ||
        "여행 비용",
    );
    const resolved = resolveBackendCostItem(item, {
      isShared: isSharedBackendCostItem(item, itemLabel),
    });
    return (
      sum + (resolved.rawValue <= 0 && resolved.value > 0 ? resolved.value : 0)
    );
  }, 0);

  const calculatedTotal =
    Number.isFinite(backendPerPerson) && backendPerPerson >= 0
      ? backendPerPerson + backendMissingCostAdjustment
      : Number.isFinite(backendGrandTotal) && backendGrandTotal >= 0
        ? backendGrandTotal / party + backendMissingCostAdjustment
        : mockTotal;

  const detailedTotal = sumCostGroups(costDetails);

  const total = stablePlanEstimate({
    calculatedTotal,
    announcedTotal: backendPlan ? announcedPlanEstimate : 0,
    detailedTotal,
  });

  const reconciledCostDetails = addPriceVariationBuffer(costDetails, total);

  const confirmedTotal = selectedStay ? total : budgetStatus?.total || total;

  const confirmedInBudget = budget >= confirmedTotal;

  const gap = Math.abs(budget - total);

  const inBudget = budget >= total;

  return {
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
  };
}
