import { useEffect, useMemo } from "react";
import { calculateTripCosts } from "../planner/tripCostModel.js";
import { saveTripCostSnapshot } from "../planner/plannerStorage.js";

/** 경비 모델을 계산하고 여행별 스냅샷을 보존합니다. 모달/알림 변경으로는 다시 저장하지 않습니다. */
export function useTripCostEstimate({
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
  const costs = useMemo(
    () =>
      calculateTripCosts({
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
      }),
    [
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
    ],
  );
  const { total, reconciledCostDetails } = costs;
  // Backend가 보존하지 않는 시연용 숙소/렌터카 가격을 tripId별로 저장한다.
  // 내 예약에서 다시 열 때 동일 스냅샷을 복원해 총액 0원 문제를 방지한다.
  useEffect(() => {
    const tripId = backendPlan?.tripId || backendPlan?.id;
    if (!tripId || !Number.isFinite(Number(total)) || Number(total) <= 0)
      return;

    const costItems = reconciledCostDetails.flatMap((group) =>
      (group.rows || []).map(([name, value, note]) => ({
        name,
        perPerson: Number(value) || 0,
        note: note || "",
        scope: /공동 예약·차량비/.test(group.group || "")
          ? "shared"
          : "personal",
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
      stay: selectedStay
        ? {
            id: selectedStay.id,
            priceAvg: selectedStay.priceAvg,
            priceText: selectedStay.priceText,
          }
        : null,
      rental: selectedRental
        ? {
            id: selectedRental.id,
            price: selectedRental.price,
            company: selectedRental.company,
            car: selectedRental.car,
          }
        : null,
    });
  }, [
    backendPlan?.tripId,
    backendPlan?.id,
    total,
    party,
    reconciledCostDetails,
    selectedStay,
    selectedRental,
  ]);

  return costs;
}
