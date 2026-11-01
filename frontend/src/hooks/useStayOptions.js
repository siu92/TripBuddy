import { useEffect, useState } from "react";
import { recommendAccommodations } from "../api/accommodationApi.js";
import jejuCoastPhoto from "../assets/jeju-main-hero.jpeg";
import { useLatestPlannerRequest } from "./useLatestPlannerRequest.js";

/** 숙소 후보·선택값·조회 상태를 소유합니다. 여행지 변경/해제 후의 응답은 적용하지 않습니다. */
export function useStayOptions({
  initialBookingSelection,
  destinationLocation,
  stayOpen,
  notify,
}) {
  /*
   * 실제 숙소 추천 API 결과
   */
  const [stayCatalog, setStayCatalog] = useState(
    initialBookingSelection.stay ? [initialBookingSelection.stay] : [],
  );

  const [stayLoading, setStayLoading] = useState(false);

  const [stayError, setStayError] = useState("");

  const [stayId, setStayId] = useState(initialBookingSelection.stay?.id || "");

  const requests = useLatestPlannerRequest(
    [destinationLocation],
    setStayLoading,
  );
  const loadStayOptions = async () => {
    const isCurrent = requests.begin();
    setStayLoading(false);
    const mergeSelectedStay = (nextCatalog, previousCatalog = []) => {
      const lockedStay = previousCatalog.find(
        (stay) => String(stay.id) === String(stayId),
      );
      if (!lockedStay) return nextCatalog;
      return nextCatalog.some(
        (stay) => String(stay.id) === String(lockedStay.id),
      )
        ? nextCatalog
        : [lockedStay, ...nextCatalog];
    };

    const latitude = Number(destinationLocation?.latitude);

    const longitude = Number(destinationLocation?.longitude);

    const destinationName =
      destinationLocation?.detail ||
      destinationLocation?.name ||
      destinationLocation?.region ||
      "";

    if (
      !destinationName ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      setStayCatalog((previous) => mergeSelectedStay([], previous));

      setStayError("숙소 추천을 위해 도착지 좌표가 필요합니다.");

      return false;
    }

    setStayLoading(true);

    setStayError("");

    try {
      const result = await recommendAccommodations({
        destinationName,
        latitude,
        longitude,

        limit: 20,
      });

      if (!isCurrent()) return false;

      const accommodations = Array.isArray(result?.accommodations)
        ? result.accommodations
        : [];

      /*
       * 백엔드 응답
       * ↓
       * 기존 프론트 숙소 객체로 normalize
       */
      const normalized = accommodations.map((stay) => ({
        id: stay.accommodationId,

        providerId: stay.providerId,

        name: stay.name,

        area: stay.town || stay.city || stay.province || "숙소",

        address: stay.address,

        latitude: stay.latitude,

        longitude: stay.longitude,

        distanceKm: stay.distanceKm,

        estimatedDriveMinutes: stay.estimatedDriveMinutes,

        rating: stay.rating,

        ratingScale: stay.ratingScale,

        reviewCount: stay.reviewCount ?? 0,

        bayesianRating: stay.bayesianRating,

        recommendationScore: stay.recommendationScore,

        starCount: stay.starCount,

        /*
         * 숫자 평균가.
         * null 가능.
         */
        priceAvg: stay.priceAvg == null ? null : Number(stay.priceAvg),

        /*
         * 화면 표시용.
         * 백엔드에서 거의 전부 존재.
         */
        priceText: stay.priceText || "가격 정보 확인",

        image: stay.representativeImageUrl || jejuCoastPhoto,

        providerUrl: stay.providerUrl,

        checkInTime: stay.checkInTime,

        checkOutTime: stay.checkOutTime,

        description: stay.description,

        phoneNumber: stay.phoneNumber,

        isMock: false,

        insight: `${destinationName}에서 약 ${
          stay.distanceKm ?? "-"
        }km · 차량 약 ${stay.estimatedDriveMinutes ?? "-"}분`,
      }));

      setStayCatalog((previous) => mergeSelectedStay(normalized, previous));

      if (import.meta.env.DEV) {
        console.log(
          "[ACCOMMODATION] request:",

          {
            destinationName,
            latitude,
            longitude,
            limit: 20,
          },
        );

        console.log(
          "[ACCOMMODATION] response:",

          result,
        );
      }

      if (normalized.length === 0) {
        setStayError("추천 가능한 숙소를 찾지 못했습니다.");

        return false;
      }

      return true;
    } catch (error) {
      if (!isCurrent()) return false;
      console.error(
        "[ACCOMMODATION] API 호출 실패:",

        error,
      );

      const nextMessage = error?.message || "숙소 정보를 불러오지 못했습니다.";

      setStayCatalog((previous) => mergeSelectedStay([], previous));

      setStayError(nextMessage);

      notify(nextMessage);

      return false;
    } finally {
      if (isCurrent()) setStayLoading(false);
    }
  };

  /*
   * 숙소 모달이 열리면 실제 API 조회.
   */
  useEffect(() => {
    if (!stayOpen) {
      return;
    }

    void loadStayOptions();
  }, [
    stayOpen,

    destinationLocation?.id,

    destinationLocation?.latitude,

    destinationLocation?.longitude,
  ]);

  return {
    stayCatalog,
    setStayCatalog,
    stayLoading,
    stayError,
    setStayError,
    stayId,
    setStayId,
    loadStayOptions,
    invalidateStayOptions: requests.invalidate,
  };
}
