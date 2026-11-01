import { useState } from "react";
import { searchFlights } from "../api/flightApi.js";
import { flightOriginAirports } from "../data/mockData.js";
import {
  flightLocationName,
  normalizeFlightCandidate,
} from "../planner/flightCandidates.js";
import { useLatestPlannerRequest } from "./useLatestPlannerRequest.js";

/** 항공 후보·선택값·조회 상태를 소유합니다. 공유 API 캐시는 유지하고 오래된 응답만 무시합니다. */
export function useFlightOptions({
  initialBookingSelection,
  departureLocation,
  destinationLocation,
  startDate,
  endDate,
  travelers,
  notify,
}) {
  const [origin, setOrigin] = useState(
    initialBookingSelection.outboundFlight?.departureAirport || "GMP",
  );

  const [flightId, setFlightId] = useState(
    initialBookingSelection.outboundFlight?.id || "",
  );

  const [returnFlightId, setReturnFlightId] = useState(
    initialBookingSelection.returnFlight?.id || "",
  );

  const [flightSearchResult, setFlightSearchResult] = useState({
    departureAirport:
      initialBookingSelection.outboundFlight?.departureAirport || "",

    arrivalAirport:
      initialBookingSelection.outboundFlight?.arrivalAirport || "",

    outboundFlights: initialBookingSelection.outboundFlight
      ? [initialBookingSelection.outboundFlight]
      : [],

    returnFlights: initialBookingSelection.returnFlight
      ? [initialBookingSelection.returnFlight]
      : [],
  });

  const [flightLoading, setFlightLoading] = useState(false);

  const [flightError, setFlightError] = useState("");

  const requests = useLatestPlannerRequest(
    [departureLocation, destinationLocation, startDate, endDate, travelers],
    setFlightLoading,
  );
  const loadFlightOptions = async (
    leg = "outbound",
    requestedAirportCode = origin,
  ) => {
    const isCurrent = requests.begin();
    setFlightLoading(false);
    const isReturn = leg === "return";

    const direction = isReturn ? "RETURN" : "OUTBOUND";

    const requestedAirport = flightOriginAirports.find(
      (airport) => airport.code === requestedAirportCode,
    );

    const departure = requestedAirport
      ? `${requestedAirport.city} ${requestedAirport.name}`
      : flightLocationName(departureLocation);

    const arrival = flightLocationName(destinationLocation);

    if (!departure) {
      notify("항공편 조회를 위해 출발지를 선택해 주세요.");

      return false;
    }

    if (!arrival) {
      notify("항공편 조회를 위해 도착지를 선택해 주세요.");

      return false;
    }

    if (!startDate || !endDate) {
      notify("항공편 조회를 위해 여행 날짜를 선택해 주세요.");

      return false;
    }

    if (!travelers) {
      notify("항공편 조회를 위해 인원수를 입력해 주세요.");

      return false;
    }

    setFlightLoading(true);

    setFlightError("");

    try {
      const result = await searchFlights({
        departure,

        destination: arrival,

        direction,

        startDate,

        startTime: "00:00",

        endDate,

        endTime: "23:59",

        peopleCount: travelers,
      });

      if (!isCurrent()) return false;

      const fetchedOutboundFlights = Array.isArray(result?.outboundFlights)
        ? result.outboundFlights.map(normalizeFlightCandidate)
        : [];

      const fetchedReturnFlights = Array.isArray(result?.returnFlights)
        ? result.returnFlights.map(normalizeFlightCandidate)
        : [];

      setFlightSearchResult((previous) => {
        const lockedOutbound = previous?.outboundFlights?.find(
          (flight) => String(flight.id) === String(flightId),
        );
        const lockedReturn = previous?.returnFlights?.find(
          (flight) => String(flight.id) === String(returnFlightId),
        );
        const nextOutbound = isReturn
          ? previous?.outboundFlights || []
          : lockedOutbound &&
              !fetchedOutboundFlights.some(
                (flight) => String(flight.id) === String(lockedOutbound.id),
              )
            ? [lockedOutbound, ...fetchedOutboundFlights]
            : fetchedOutboundFlights;
        const nextReturn = isReturn
          ? lockedReturn &&
            !fetchedReturnFlights.some(
              (flight) => String(flight.id) === String(lockedReturn.id),
            )
            ? [lockedReturn, ...fetchedReturnFlights]
            : fetchedReturnFlights
          : previous?.returnFlights || [];

        return {
          departureAirport:
            result?.departureAirport || previous?.departureAirport || "",
          arrivalAirport:
            result?.arrivalAirport || previous?.arrivalAirport || "",
          outboundFlights: nextOutbound,
          returnFlights: nextReturn,
        };
      });

      if (!isReturn) {
        setOrigin(result?.departureAirport || origin);
      }

      if (import.meta.env.DEV) {
        console.log(
          `[FLIGHT] ${direction} request:`,

          {
            departure,

            destination: arrival,

            direction,

            startDate,

            startTime: "00:00",

            endDate,

            endTime: "23:59",

            peopleCount: travelers,
          },
        );

        console.log(
          `[FLIGHT] ${direction} response:`,

          result,
        );
      }

      if (!isReturn && !fetchedOutboundFlights.length) {
        setFlightError("조회 가능한 가는 항공편이 없습니다.");

        return false;
      }

      if (isReturn && !fetchedReturnFlights.length) {
        setFlightError("조회 가능한 오는 항공편이 없습니다.");

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
    } catch (error) {
      if (!isCurrent()) return false;
      console.error(
        `[FLIGHT] ${direction} API 호출 실패:`,

        error,
      );

      const nextMessage = error?.message || "항공편을 불러오지 못했습니다.";

      setFlightSearchResult((previous) => ({
        departureAirport: previous?.departureAirport || "",

        arrivalAirport: previous?.arrivalAirport || "",

        outboundFlights: previous?.outboundFlights || [],

        returnFlights: previous?.returnFlights || [],
      }));

      setFlightError(nextMessage);

      notify(nextMessage);

      return false;
    } finally {
      if (isCurrent()) setFlightLoading(false);
    }
  };

  return {
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
    invalidateFlightOptions: requests.invalidate,
  };
}
