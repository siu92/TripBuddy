const KAKAO_NAVI_SCRIPT_ID = "tripbuddy-kakao-navi-sdk";
const KAKAO_NAVI_SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.3/kakao.min.js";

let sdkPromise = null;

function initializeKakaoNavi() {
  const appKey = String(import.meta.env.VITE_KAKAO_MAP_JS_KEY ?? "").trim();

  if (!appKey) {
    throw new Error("VITE_KAKAO_MAP_JS_KEY가 설정되지 않았습니다.");
  }

  if (!window.Kakao) {
    throw new Error("카카오 JavaScript SDK를 불러오지 못했습니다.");
  }

  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(appKey);
  }

  if (!window.Kakao.Navi?.start) {
    throw new Error("카카오내비 기능을 사용할 수 없습니다.");
  }

  return window.Kakao;
}

export function loadKakaoNaviSdk() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저에서만 내비게이션을 실행할 수 있습니다."));
  }

  if (window.Kakao?.Navi?.start) {
    try {
      return Promise.resolve(initializeKakaoNavi());
    } catch (error) {
      return Promise.reject(error);
    }
  }

  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(KAKAO_NAVI_SCRIPT_ID);
    const script = existingScript || document.createElement("script");

    const handleLoad = () => {
      try {
        resolve(initializeKakaoNavi());
      } catch (error) {
        sdkPromise = null;
        reject(error);
      }
    };

    const handleError = () => {
      sdkPromise = null;
      reject(new Error("카카오내비 연결 모듈을 불러오지 못했습니다."));
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (!existingScript) {
      script.id = KAKAO_NAVI_SCRIPT_ID;
      script.src = KAKAO_NAVI_SDK_URL;
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }
  });

  return sdkPromise;
}

function toNaviLocation(location, fallbackName) {
  const latitude = Number(location?.latitude ?? location?.lat ?? location?.y);
  const longitude = Number(location?.longitude ?? location?.lng ?? location?.x);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    name: String(location?.name || fallbackName),
    x: longitude,
    y: latitude,
  };
}

export function startKakaoNavigation(destination, viaPoints = []) {
  const latitude = Number(destination?.latitude ?? destination?.lat ?? destination?.y);
  const longitude = Number(destination?.longitude ?? destination?.lng ?? destination?.x);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("내비게이션을 시작할 장소 좌표가 없습니다.");
  }

  if (!window.Kakao?.Navi?.start || !window.Kakao?.isInitialized?.()) {
    throw new Error("카카오내비 연결을 준비하고 있습니다.");
  }

  const Kakao = window.Kakao;
  const normalizedViaPoints = viaPoints
    .map((point, index) => toNaviLocation(point, `경유지 ${index + 1}`))
    .filter(Boolean)
    .slice(0, 3);

  Kakao.Navi.start({
    name: String(destination?.name || "다음 여행지"),
    x: longitude,
    y: latitude,
    coordType: "wgs84",
    rpOption: 100,
    routeInfo: false,
    viaPoints: normalizedViaPoints,
  });
}
