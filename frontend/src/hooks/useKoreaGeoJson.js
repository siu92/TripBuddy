import { useEffect, useState } from "react";

const responseCache = new Map();

const fetchFromAvailableSource = async (urls) => {
  let lastError = null;
  for (const url of urls) {
    try {
      const response = await fetch(url, { cache: "force-cache" });
      if (!response.ok) throw new Error(`행정구역 데이터를 불러오지 못했습니다. (${response.status})`);
      const data = await response.json();
      if (data?.type !== "FeatureCollection" || !Array.isArray(data.features)) {
        throw new Error("지원하지 않는 행정구역 데이터 형식입니다.");
      }
      return data;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("행정구역 데이터 연결에 실패했습니다.");
};

const loadGeoJson = (urls) => {
  const key = urls.join("|");
  if (!responseCache.has(key)) responseCache.set(key, fetchFromAvailableSource(urls));
  return responseCache.get(key);
};

export default function useKoreaGeoJson(urls) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const key = urls.join("|");

  useEffect(() => {
    let alive = true;
    setState((current) => ({ ...current, error: null, loading: !current.data }));
    loadGeoJson(urls)
      .then((data) => { if (alive) setState({ data, error: null, loading: false }); })
      .catch((error) => { if (alive) setState({ data: null, error, loading: false }); });
    return () => { alive = false; };
  }, [key]);

  return state;
}
