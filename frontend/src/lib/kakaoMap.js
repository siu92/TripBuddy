const KAKAO_MAP_SCRIPT_ID = "tripbuddy-kakao-map-sdk";

let kakaoMapsPromise = null;

function resolveLoadedSdk(resolve, reject) {
  if (!window.kakao?.maps) {
    reject(new Error("카카오 지도 SDK를 불러오지 못했습니다."));
    return;
  }

  if (typeof window.kakao.maps.load === "function") {
    window.kakao.maps.load(() => resolve(window.kakao.maps));
    return;
  }

  resolve(window.kakao.maps);
}

export function loadKakaoMapsSdk() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("브라우저 환경에서만 카카오 지도를 사용할 수 있습니다."));
  }

  if (window.kakao?.maps?.Map && window.kakao?.maps?.LatLng) {
    return Promise.resolve(window.kakao.maps);
  }

  const appKey = String(import.meta.env.VITE_KAKAO_MAP_JS_KEY ?? "").trim();

  if (!appKey) {
    return Promise.reject(
      new Error("VITE_KAKAO_MAP_JS_KEY가 설정되지 않았습니다."),
    );
  }

  if (kakaoMapsPromise) {
    return kakaoMapsPromise;
  }

  kakaoMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(KAKAO_MAP_SCRIPT_ID);

    if (existingScript) {
      if (window.kakao?.maps) {
        resolveLoadedSdk(resolve, reject);
        return;
      }

      existingScript.addEventListener(
        "load",
        () => resolveLoadedSdk(resolve, reject),
        { once: true },
      );
      existingScript.addEventListener(
        "error",
        () => reject(new Error("카카오 지도 SDK 로딩에 실패했습니다.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = KAKAO_MAP_SCRIPT_ID;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.onload = () => resolveLoadedSdk(resolve, reject);
    script.onerror = () => reject(new Error("카카오 지도 SDK 로딩에 실패했습니다."));
    document.head.appendChild(script);
  }).catch((error) => {
    kakaoMapsPromise = null;
    throw error;
  });

  return kakaoMapsPromise;
}
