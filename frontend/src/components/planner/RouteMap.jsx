import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CarFront, Maximize2, Minus, Navigation, Plus, X } from "lucide-react";
import { locationLabel } from "../../data/mockData";
import { loadKakaoMapsSdk } from "../../lib/kakaoMap";
import { loadKakaoNaviSdk, startKakaoNavigation } from "../../lib/kakaoNavi";
import { apiClient } from "../../api/apiClient";
import { isAirportEvent, isAirportRouteSegment } from "../../utils/routeFilters";

const ROUTE_SEGMENT_COLORS = [
  "#0b766d",
  "#e9713e",
  "#4b73c5",
  "#8b5fbf",
  "#d85f78",
  "#6f8f3d",
  "#c48b2d",
  "#2f91a5",
  "#b85f45",
  "#5f6fc4",
];

function finiteCoordinate(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function pointFrom(value = {}) {
  const latitude = finiteCoordinate(value.latitude ?? value.lat ?? value.y);
  const longitude = finiteCoordinate(value.longitude ?? value.lng ?? value.lon ?? value.x);

  if (latitude == null || longitude == null) {
    return null;
  }

  return { latitude, longitude };
}

function segmentPoint(segment, prefix) {
  return pointFrom({
    latitude: segment?.[`${prefix}Latitude`],
    longitude: segment?.[`${prefix}Longitude`],
  });
}

function uniqueStops(stops = []) {
  const seen = new Set();

  return stops.filter((stop) => {
    const point = pointFrom(stop);
    if (!point) return false;

    const key = `${point.latitude.toFixed(6)}:${point.longitude.toFixed(6)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function stopsFromSegments(segments = []) {
  const localSegments = segments.filter((segment) => !isAirportRouteSegment(segment));
  if (!localSegments.length) return [];

  const stops = [];

  localSegments.forEach((segment, segmentIndex) => {
    const departure = segmentPoint(segment, "departure");
    const arrival = segmentPoint(segment, "arrival");

    if (segmentIndex === 0 && departure) {
      stops.push({
        name: segment?.departureName || "출발",
        ...departure,
      });
    }

    if (arrival) {
      stops.push({
        name: segment?.arrivalName || `경유지 ${segmentIndex + 1}`,
        ...arrival,
      });
    }
  });

  return uniqueStops(stops);
}

function stopsFromDayPlan(selectedDay) {
  return uniqueStops(
    (selectedDay?.[2] || [])
      .filter((event) => event?.[6]?.isGeographical !== false)
      .filter((event) => !isAirportEvent(event?.[2], event?.[6]))
      .filter((event) => !/체크인|체크아웃|준비|짐 정리|탑승|귀가|오는 편/.test(event?.[2] || ""))
      .map(([, , name, , , , metadata = {}]) => ({
        name: name?.trim(),
        latitude: metadata.latitude ?? metadata.point?.latitude,
        longitude: metadata.longitude ?? metadata.point?.longitude,
      }))
      .filter((stop) => Boolean(stop.name)),
  );
}

function buildKakaoMapLink(stop) {
  const point = pointFrom(stop);
  const name = String(stop?.name || "여행지").trim();

  if (!point) {
    return `https://map.kakao.com/?q=${encodeURIComponent(name)}`;
  }

  return `https://map.kakao.com/link/map/${encodeURIComponent(name)},${point.latitude},${point.longitude}`;
}

function buildKakaoDirectionsLink(stops = [], mode = "car") {
  const routeStops = uniqueStops(stops)
    .filter((stop) => pointFrom(stop))
    .slice(0, 7);

  if (routeStops.length < 2) {
    return buildKakaoMapLink(routeStops[0]);
  }

  const path = routeStops.map((stop) => {
    const point = pointFrom(stop);
    return `${encodeURIComponent(String(stop.name || "여행지").trim())},${point.latitude},${point.longitude}`;
  }).join("/");

  return `https://map.kakao.com/link/by/${mode}/${path}`;
}

function createMarkerElement(stop, index, color, onSelect) {
  const marker = document.createElement("button");
  marker.type = "button";
  marker.className = "kakao-route-marker";
  marker.title = stop.name || `일정 ${index + 1}`;
  marker.setAttribute("aria-label", `${index + 1}번 ${stop.name || "여행지"} 경로 선택`);
  marker.style.setProperty("--route-marker-color", color || ROUTE_SEGMENT_COLORS[0]);

  const number = document.createElement("span");
  number.className = "kakao-route-marker-number";
  number.textContent = String(index + 1);

  const label = document.createElement("span");
  label.className = "kakao-route-marker-label";
  label.textContent = stop.name || `일정 ${index + 1}`;

  marker.append(number, label);
  if (typeof onSelect === "function") {
    marker.addEventListener("click", onSelect);
  }

  return marker;
}

function applyPolylineSelection(polylineEntries, selectedSegmentIndex) {
  polylineEntries.forEach(({ polyline, segmentIndex, baseWeight, estimated }) => {
    const hasSelection = selectedSegmentIndex != null;
    const selected = segmentIndex === selectedSegmentIndex;

    polyline.setOptions({
      strokeWeight: selected ? baseWeight + 3 : baseWeight,
      strokeOpacity: hasSelection
        ? (selected ? 1 : 0.28)
        : (estimated ? 0.42 : 0.86),
    });
  });
}

function KakaoRouteCanvas({
  stops,
  segments,
  fallbackPoint,
  selectedSegmentIndex = null,
  onSegmentSelect,
  visible = true,
  showControls = false,
  className = "",
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const boundsRef = useRef(null);
  const boundsCountRef = useRef(0);
  const wasHiddenRef = useRef(false);
  const overlaysRef = useRef([]);
  const polylinesRef = useRef([]);
  const polylineEntriesRef = useRef([]);
  const selectedSegmentIndexRef = useRef(selectedSegmentIndex);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const overlays = [];
    const polylines = [];
    const polylineListeners = [];

    const initialize = async () => {
      try {
        setStatus("loading");
        setErrorMessage("");

        const maps = await loadKakaoMapsSdk();
        if (cancelled || !containerRef.current) return;

        const firstStop = stops.find((stop) => pointFrom(stop));
        const fallback = pointFrom(fallbackPoint);
        const initial = pointFrom(firstStop) || fallback || { latitude: 33.4996, longitude: 126.5312 };

        const map = new maps.Map(containerRef.current, {
          center: new maps.LatLng(initial.latitude, initial.longitude),
          level: 6,
        });
        mapRef.current = map;

        const bounds = new maps.LatLngBounds();
        let boundsCount = 0;
        const nextPolylineEntries = [];

        segments.forEach((segment, segmentIndex) => {
          const routePath = Array.isArray(segment?.path)
            ? segment.path.map(pointFrom).filter(Boolean)
            : [];

          if (routePath.length < 2) return;

          const path = routePath.map((point) => {
            const latLng = new maps.LatLng(point.latitude, point.longitude);
            bounds.extend(latLng);
            boundsCount += 1;
            return latLng;
          });

          const baseWeight = segment?.mode === "SHUTTLE" ? 5 : 6;
          const estimated = segment?.routeProvider === "ESTIMATED";
          const polyline = new maps.Polyline({
            map,
            path,
            clickable: true,
            strokeWeight: baseWeight,
            strokeColor: segment?._routeColor || ROUTE_SEGMENT_COLORS[0],
            strokeOpacity: estimated ? 0.42 : 0.86,
            strokeStyle: estimated ? "shortdash" : "solid",
          });

          const clickHandler = () => onSegmentSelect?.(segmentIndex);
          const overHandler = () => {
            const currentSelectedIndex = selectedSegmentIndexRef.current;
            if (currentSelectedIndex == null || currentSelectedIndex === segmentIndex) {
              polyline.setOptions({ strokeWeight: baseWeight + 2 });
            }
          };
          const outHandler = () => {
            applyPolylineSelection(nextPolylineEntries, selectedSegmentIndexRef.current);
          };

          maps.event.addListener(polyline, "click", clickHandler);
          maps.event.addListener(polyline, "mouseover", overHandler);
          maps.event.addListener(polyline, "mouseout", outHandler);

          polylineListeners.push({ polyline, clickHandler, overHandler, outHandler });
          polylines.push(polyline);
          nextPolylineEntries.push({
            polyline,
            segmentIndex,
            baseWeight,
            estimated,
          });
        });

        polylineEntriesRef.current = nextPolylineEntries;
        applyPolylineSelection(nextPolylineEntries, selectedSegmentIndexRef.current);

        const localSegments = segments.filter((segment) => segment?.mode !== "AIR");

        stops.forEach((stop, index) => {
          const point = pointFrom(stop);
          if (!point) return;

          const position = new maps.LatLng(point.latitude, point.longitude);
          bounds.extend(position);
          boundsCount += 1;

          const routeForStop = index < localSegments.length
            ? localSegments[index]
            : localSegments[index - 1] ?? localSegments[localSegments.length - 1];
          const routeSegmentIndex = routeForStop?._segmentIndex;
          const markerColor = routeForStop?._routeColor || ROUTE_SEGMENT_COLORS[0];

          const overlay = new maps.CustomOverlay({
            map,
            position,
            content: createMarkerElement(
              stop,
              index,
              markerColor,
              routeSegmentIndex == null ? undefined : () => onSegmentSelect?.(routeSegmentIndex),
            ),
            xAnchor: 0.5,
            yAnchor: 1.08,
            zIndex: 5,
          });
          overlays.push(overlay);
        });

        // 경비 탭처럼 지도 컨테이너가 잠시 숨겨졌다 다시 나타날 때
        // Kakao CustomOverlay/Polyline을 같은 map 인스턴스에 재부착할 수 있도록 보관한다.
        overlaysRef.current = overlays;
        polylinesRef.current = polylines;

        boundsRef.current = bounds;
        boundsCountRef.current = boundsCount;

        if (boundsCount >= 2) {
          map.setBounds(bounds);
        } else {
          map.setCenter(new maps.LatLng(initial.latitude, initial.longitude));
          map.setLevel(5);
        }

        requestAnimationFrame(() => {
          map.relayout();
          if (boundsCount >= 2) map.setBounds(bounds);
        });

        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(error?.message || "카카오 지도를 불러오지 못했습니다.");
      }
    };

    initialize();

    return () => {
      cancelled = true;
      overlays.forEach((overlay) => overlay.setMap(null));
      polylines.forEach((polyline) => polyline.setMap(null));
      polylineListeners.forEach(({ polyline, clickHandler, overHandler, outHandler }) => {
        mapsSafeRemoveListener(polyline, "click", clickHandler);
        mapsSafeRemoveListener(polyline, "mouseover", overHandler);
        mapsSafeRemoveListener(polyline, "mouseout", outHandler);
      });
      overlaysRef.current = [];
      polylinesRef.current = [];
      polylineEntriesRef.current = [];
      boundsRef.current = null;
      boundsCountRef.current = 0;
      mapRef.current = null;
    };
  }, [fallbackPoint, onSegmentSelect, segments, stops]);

  useEffect(() => {
    if (!visible) return;

    window.requestAnimationFrame(() => {
      const map = mapRef.current;
      if (!map) return;

      // display:none 상태를 거치면 overlay가 보이지 않는 경우가 있어
      // 기존 객체를 새로 만들지 않고 현재 map에 다시 부착한다.
      overlaysRef.current.forEach((overlay) => overlay.setMap(map));
      polylinesRef.current.forEach((polyline) => polyline.setMap(map));
      map.relayout();

      window.requestAnimationFrame(() => {
        const bounds = boundsRef.current;
        if (bounds && boundsCountRef.current >= 2) {
          map.setBounds(bounds);
        }
        applyPolylineSelection(
          polylineEntriesRef.current,
          selectedSegmentIndexRef.current,
        );
      });
    });
  }, [visible]);

  // 경비 탭에서 지도 aside가 display:none 이 되었다가 다시 보이면
  // Kakao Map 내부 projection 크기가 0으로 남아 마커/오버레이가 사라진 것처럼 보일 수 있다.
  // 컨테이너가 다시 보이는 순간 relayout + 기존 bounds를 복원해 마커와 경로를 유지한다.
  useEffect(() => {
    const container = containerRef.current;

    if (!container || typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const width = entry?.contentRect?.width ?? container.clientWidth;
      const height = entry?.contentRect?.height ?? container.clientHeight;
      const visible = width > 0 && height > 0;

      if (!visible) {
        wasHiddenRef.current = true;
        return;
      }

      if (!wasHiddenRef.current) {
        return;
      }

      wasHiddenRef.current = false;

      window.requestAnimationFrame(() => {
        const map = mapRef.current;
        if (!map) return;

        overlaysRef.current.forEach((overlay) => overlay.setMap(map));
        polylinesRef.current.forEach((polyline) => polyline.setMap(map));
        map.relayout();

        window.requestAnimationFrame(() => {
          const bounds = boundsRef.current;
          if (bounds && boundsCountRef.current >= 2) {
            map.setBounds(bounds);
          }
          applyPolylineSelection(
            polylineEntriesRef.current,
            selectedSegmentIndexRef.current,
          );
        });
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    selectedSegmentIndexRef.current = selectedSegmentIndex;
    applyPolylineSelection(polylineEntriesRef.current, selectedSegmentIndex);
  }, [selectedSegmentIndex]);

  const zoomIn = () => {
    const map = mapRef.current;
    if (!map) return;
    map.setLevel(Math.max(1, map.getLevel() - 1), { animate: true });
  };

  const zoomOut = () => {
    const map = mapRef.current;
    if (!map) return;
    map.setLevel(Math.min(14, map.getLevel() + 1), { animate: true });
  };

  return (
    <div className={`kakao-route-canvas-wrap ${className}`.trim()}>
      <div ref={containerRef} className="kakao-route-canvas" aria-label="카카오 지도 여행 동선" />
      {status === "loading" && <div className="kakao-map-state">카카오 지도를 불러오는 중...</div>}
      {status === "error" && (
        <div className="kakao-map-state is-error">
          <b>지도를 표시하지 못했어요.</b>
          <span>{errorMessage}</span>
        </div>
      )}
      {showControls && status === "ready" && (
        <div className="map-zoom-controls" aria-label="지도 확대 축소">
          <button type="button" onClick={zoomIn} aria-label="지도 확대"><Plus size={18} /></button>
          <button type="button" onClick={zoomOut} aria-label="지도 축소"><Minus size={18} /></button>
        </div>
      )}
    </div>
  );
}

function mapsSafeRemoveListener(target, eventName, handler) {
  if (typeof window === "undefined") return;
  const kakaoEvent = window.kakao?.maps?.event;
  if (!kakaoEvent?.removeListener || !target || !handler) return;
  kakaoEvent.removeListener(target, eventName, handler);
}

function RouteMap({ activeDay, dayPlans, destinationLocation, originLocation, routeResults = [], localTransport = "RENTAL", compact = false, hideHeader = false, visible = true }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState(null);
  const [navigationMessage, setNavigationMessage] = useState("");
  const [navigationReady, setNavigationReady] = useState(false);
  const selectedDay = dayPlans[activeDay] || dayPlans[0];
  const destinationContext = locationLabel(destinationLocation, "대한민국");
  const originContext = locationLabel(originLocation, "출발지");
  const [editedRoute, setEditedRoute] = useState(null);
  const editedStopsKey = selectedDay?.[2]?.some((event) => event?.[6]?.locallyReordered)
    ? JSON.stringify(stopsFromDayPlan(selectedDay)) : "";
  useEffect(() => {
    if (!editedStopsKey) return undefined;
    const controller = new AbortController();
    const stops = JSON.parse(editedStopsKey);
    if (!["RENTAL", "CAR", "TAXI"].includes(localTransport)) {
      setEditedRoute({ key: editedStopsKey, segments: [] });
      return () => controller.abort();
    }
    Promise.all(stops.slice(0, -1).map(async (from, index) => {
      const to = stops[index + 1];
      const response = await apiClient.request("/api/routes/driving", {
        method: "POST", signal: controller.signal,
        body: { originLatitude: from.latitude, originLongitude: from.longitude,
          destinationLatitude: to.latitude, destinationLongitude: to.longitude },
      });
      const result = response?.data ?? response;
      return { ...result, mode: "CAR", departureName: from.name, arrivalName: to.name,
        departureLatitude: from.latitude, departureLongitude: from.longitude,
        arrivalLatitude: to.latitude, arrivalLongitude: to.longitude };
    })).then((segments) => {
      if (!controller.signal.aborted) setEditedRoute({ key: editedStopsKey, segments });
    }).catch(() => {
      // Never display the previous order as though it were the updated route.
      if (!controller.signal.aborted) setEditedRoute({ key: editedStopsKey, segments: [] });
    });
    return () => controller.abort();
  }, [editedStopsKey, localTransport]);

  const providerRoute = useMemo(
    () => routeResults.find((item) => item?.dayIndex === activeDay) ?? routeResults[activeDay] ?? null,
    [activeDay, routeResults],
  );

  const segments = useMemo(
    () => editedStopsKey
      ? (editedRoute?.key === editedStopsKey ? editedRoute.segments : [])
      : Array.isArray(providerRoute?.segments) ? providerRoute.segments : [],
    [providerRoute, editedStopsKey, editedRoute],
  );

  const coloredSegments = useMemo(() => {
    let routeOrder = 0;

    return segments.map((segment, segmentIndex) => {
      if (segment?.mode === "AIR") {
        return {
          ...segment,
          _segmentIndex: segmentIndex,
          _routeOrder: null,
          _routeColor: null,
        };
      }

      const color = ROUTE_SEGMENT_COLORS[routeOrder % ROUTE_SEGMENT_COLORS.length];
      const next = {
        ...segment,
        _segmentIndex: segmentIndex,
        _routeOrder: routeOrder,
        _routeColor: color,
      };
      routeOrder += 1;
      return next;
    });
  }, [segments]);

  const handleSegmentSelect = useCallback((segmentIndex) => {
    setSelectedSegmentIndex((current) => current === segmentIndex ? null : segmentIndex);
  }, []);

  useEffect(() => {
    setSelectedSegmentIndex(null);
  }, [activeDay]);

  useEffect(() => {
    if (!navigationMessage) return undefined;

    const timeoutId = window.setTimeout(() => setNavigationMessage(""), 2800);
    return () => window.clearTimeout(timeoutId);
  }, [navigationMessage]);

  useEffect(() => {
    let active = true;

    loadKakaoNaviSdk()
      .then(() => {
        if (active) setNavigationReady(true);
      })
      .catch(() => {
        if (active) setNavigationReady(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const route = useMemo(() => {
    const segmentStops = stopsFromSegments(coloredSegments);
    const fallbackStops = stopsFromDayPlan(selectedDay);

    return {
      label: selectedDay?.[0] || `${destinationContext} 여행 동선`,
      stops: segmentStops.length ? segmentStops : fallbackStops,
    };
  }, [coloredSegments, destinationContext, selectedDay]);

  const localSegments = coloredSegments.filter((segment) => !isAirportRouteSegment(segment));
  const actualSegments = localSegments.filter((segment) =>
    String(segment?.routeProvider || "").startsWith("KAKAO_MOBILITY"),
  );
  const estimatedSegments = localSegments.filter((segment) => segment?.routeProvider === "ESTIMATED");
  const totalDistanceKm = localSegments.reduce(
    (sum, segment) => sum + (Number.isFinite(Number(segment?.distanceKm)) ? Number(segment.distanceKm) : 0),
    0,
  );
  const totalDurationMinutes = localSegments.reduce(
    (sum, segment) => sum + (Number.isFinite(Number(segment?.durationMinutes)) ? Number(segment.durationMinutes) : 0),
    0,
  );

  const selectedSegment = selectedSegmentIndex == null
    ? null
    : coloredSegments[selectedSegmentIndex] ?? null;
  const selectedDistanceKm = Number.isFinite(Number(selectedSegment?.distanceKm))
    ? Number(selectedSegment.distanceKm)
    : null;
  const selectedDurationMinutes = Number.isFinite(Number(selectedSegment?.durationMinutes))
    ? Number(selectedSegment.durationMinutes)
    : null;

  const openMapUrl = buildKakaoDirectionsLink(route.stops, "car");

  const navigationPlan = useMemo(() => {
    if (selectedSegment) {
      const arrival = segmentPoint(selectedSegment, "arrival");
      if (arrival) {
        return {
          destination: {
            name: selectedSegment.arrivalName || "다음 여행지",
            ...arrival,
          },
          viaPoints: [],
          stopCount: 1,
        };
      }
    }

    const upcomingStops = route.stops
      .slice(route.stops.length > 1 ? 1 : 0)
      .map((stop) => ({ ...stop, ...pointFrom(stop) }))
      .filter((stop) => pointFrom(stop))
      .slice(0, 4);

    return {
      destination: upcomingStops.at(-1) || null,
      viaPoints: upcomingStops.slice(0, -1),
      stopCount: upcomingStops.length,
    };
  }, [route.stops, selectedSegment]);

  const mobileDevice = typeof navigator !== "undefined" && (
    navigator.userAgentData?.mobile === true ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "")
  );

  const handleNavigationStart = async () => {
    if (!navigationPlan.destination) {
      setNavigationMessage("내비게이션을 시작할 장소 좌표가 없어요.");
      return;
    }

    if (!mobileDevice) {
      setNavigationMessage("실주행 음성 안내는 실제 휴대폰에서 카카오내비 앱으로 실행됩니다.");
      return;
    }

    try {
      if (!navigationReady) {
        await loadKakaoNaviSdk();
        setNavigationReady(true);
      }
      startKakaoNavigation(navigationPlan.destination, navigationPlan.viaPoints);
      setNavigationMessage(
        navigationPlan.stopCount > 1
          ? `다음 ${navigationPlan.stopCount}개 장소의 실주행 안내를 시작합니다.`
          : `${navigationPlan.destination.name} 실주행 안내를 시작합니다.`,
      );
    } catch (error) {
      setNavigationMessage(`${error?.message || "카카오내비 앱을 열지 못했습니다."} 카카오맵 경로를 엽니다.`);
      window.location.assign(openMapUrl);
    }
  };

  const routeForStopIndex = (stopIndex) => {
    if (!localSegments.length) return null;
    return stopIndex < localSegments.length
      ? localSegments[stopIndex]
      : localSegments[Math.max(0, stopIndex - 1)];
  };

  return (
    <section
      className={`full-route-map${compact ? " mobile-route-map" : ""}`}
      aria-label={`DAY ${activeDay + 1} 지도`}
    >
      {!hideHeader && <header>
        <div>
          <span>DAY {activeDay + 1} · KAKAO MOBILITY ROUTE</span>
          <b>{route.label}</b>
        </div>
        <a href={openMapUrl} target="_blank" rel="noreferrer noopener">
          <Navigation size={13} /> 전체 길찾기
        </a>
      </header>}

      <div className="route-map-frame">
        <KakaoRouteCanvas
          stops={route.stops}
          segments={localSegments}
          fallbackPoint={destinationLocation}
          selectedSegmentIndex={selectedSegmentIndex}
          onSegmentSelect={handleSegmentSelect}
          visible={visible}
        />

        {compact && (
          <button type="button" className="map-expand-trigger" onClick={() => setExpanded(true)}>
            <Maximize2 size={15} /> 전체 화면으로 경로 보기
          </button>
        )}
      </div>

      <small className="route-map-context route-map-context-outside">
        {selectedSegment
          ? `${selectedSegment.departureName} → ${selectedSegment.arrivalName} · 선택한 경로 기준`
          : `${originContext} → ${destinationContext} · 경로선 또는 번호를 누르면 구간별 시간 확인`}
      </small>

      <div className="route-map-below-panel">
        <div className={`route-map-status route-map-status-outside${selectedSegment ? " is-segment" : ""}`}>
          {selectedSegment ? (
            <>
              <button type="button" className="route-status-reset" onClick={() => setSelectedSegmentIndex(null)}>
                전체
              </button>
              <strong style={{ color: selectedSegment._routeColor }}>
                {selectedSegment.departureName} → {selectedSegment.arrivalName}
              </strong>
              {selectedDistanceKm != null && <span>{selectedDistanceKm.toFixed(1)}km</span>}
              {selectedDurationMinutes != null && <span>{Math.round(selectedDurationMinutes)}분</span>}
              {selectedSegment.routeProvider === "ESTIMATED" && <small>추정 경로</small>}
            </>
          ) : (
            <>
              <strong>{actualSegments.length ? `전체 ${actualSegments.length}구간` : "장소 좌표 표시"}</strong>
              {totalDistanceKm > 0 && <span>{totalDistanceKm.toFixed(1)}km</span>}
              {totalDurationMinutes > 0 && <span>{Math.round(totalDurationMinutes)}분</span>}
              {estimatedSegments.length > 0 && <small>추정 {estimatedSegments.length}구간 포함</small>}
            </>
          )}
        </div>

        <section className="route-stop-section" aria-label={`DAY ${activeDay + 1} 경로 목록`}>
          <div className="route-stop-section-head">
            <b>경로 목록</b>
            <span>{route.stops.length}개 장소</span>
          </div>

          <div
            id={`route-stop-list-day-${activeDay + 1}`}
            className="route-stop-list route-stop-list-outside"
          >
            {route.stops.map((stop, index) => {
              const linkedSegment = routeForStopIndex(index);
              const linkedSegmentIndex = linkedSegment?._segmentIndex;
              const active = linkedSegmentIndex != null && linkedSegmentIndex === selectedSegmentIndex;

              return (
                <button
                  type="button"
                  key={`${stop.name}-${index}`}
                  className={active ? "is-active" : ""}
                  onClick={() => {
                    if (linkedSegmentIndex != null) {
                      handleSegmentSelect(linkedSegmentIndex);
                    }
                  }}
                  title={linkedSegment
                    ? `${linkedSegment.departureName} → ${linkedSegment.arrivalName} 구간 보기`
                    : stop.name}
                >
                  <i style={{ background: linkedSegment?._routeColor || ROUTE_SEGMENT_COLORS[0] }}>
                    {index + 1}
                  </i>
                  <span>{stop.name}</span>
                  {linkedSegment?.durationMinutes != null && (
                    <em>{Math.round(Number(linkedSegment.durationMinutes))}분</em>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {compact && expanded && (
        <div className="mobile-map-expanded" role="dialog" aria-modal="true" aria-label={`DAY ${activeDay + 1} 전체 경로 지도`}>
          <header>
            <span>
              <small><em>DAY {activeDay + 1}</em> ROUTE OVERVIEW</small>
              <b>{route.label}</b>
              <i>{route.stops.length}개 장소 · {totalDistanceKm.toFixed(1)}km · {Math.round(totalDurationMinutes)}분</i>
            </span>
            <button type="button" onClick={() => setExpanded(false)} aria-label="전체 지도 닫기">
              <X size={19} /><span>닫기</span>
            </button>
          </header>

          <div className="mobile-expanded-map-canvas">
            <KakaoRouteCanvas
              stops={route.stops}
              segments={localSegments}
              fallbackPoint={destinationLocation}
              selectedSegmentIndex={selectedSegmentIndex}
              onSegmentSelect={handleSegmentSelect}
              visible={visible}
              showControls
              className="is-expanded"
            />
          </div>

          <div className="mobile-map-stop-sheet">
            <div className="mobile-map-sheet-head">
              <span><b>오늘의 이동 순서</b><small>{route.stops.length}개 장소</small></span>
              <span className="mobile-map-totals">
                {totalDistanceKm > 0 && <b>{totalDistanceKm.toFixed(1)}km</b>}
                {totalDurationMinutes > 0 && <b>{Math.round(totalDurationMinutes)}분</b>}
              </span>
            </div>
            <div className="mobile-map-stop-scroll">
              {route.stops.map((stop, index) => {
                const linkedSegment = routeForStopIndex(index);
                const linkedSegmentIndex = linkedSegment?._segmentIndex;
                return (
                  <button
                    type="button"
                    key={`${stop.name}-expanded-${index}`}
                    className={linkedSegmentIndex === selectedSegmentIndex ? "is-active" : ""}
                    onClick={() => linkedSegmentIndex != null && handleSegmentSelect(linkedSegmentIndex)}
                  >
                    <i style={{ background: linkedSegment?._routeColor || ROUTE_SEGMENT_COLORS[0] }}>{index + 1}</i>
                    <span>{stop.name}</span>
                    {linkedSegment?.durationMinutes != null && <small>{Math.round(Number(linkedSegment.durationMinutes))}분</small>}
                  </button>
                );
              })}
            </div>
            <div className="mobile-map-actions">
              <button
                type="button"
                className={`mobile-kakao-navi-cta${mobileDevice ? "" : " is-mobile-handoff"}`}
                onClick={handleNavigationStart}
                disabled={!navigationPlan.destination}
              >
                <CarFront size={16} />
                <span>
                  <small>{mobileDevice ? (selectedSegment ? "선택 구간 길안내" : `다음 ${navigationPlan.stopCount}곳 연속 안내`) : "휴대폰 카카오내비 연동"}</small>
                  <b>실주행 내비게이션</b>
                </span>
                <em>→</em>
              </button>
              <a className="mobile-kakao-route-cta" href={openMapUrl} target="_blank" rel="noreferrer noopener">
                <Navigation size={15} /> 전체 경로 <span>↗</span>
              </a>
            </div>
            {navigationMessage && <p className="mobile-navigation-message" role="status">{navigationMessage}</p>}
          </div>
        </div>
      )}
    </section>
  );
}

export default RouteMap;
