export const KOREA_PROVINCES_GEOJSON_URLS = [
  "https://cdn.jsdelivr.net/gh/southkorea/southkorea-maps@master/kostat/2018/json/skorea-provinces-2018-geo.json",
  "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-provinces-2018-geo.json",
];

export const KOREA_MUNICIPALITIES_GEOJSON_URLS = [
  "https://cdn.jsdelivr.net/gh/southkorea/southkorea-maps@master/kostat/2018/json/skorea-municipalities-2018-geo.json",
  "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-geo.json",
];

export const PROVINCE_GEO_CODE_BY_REGION_ID = {
  seoul: "11", busan: "21", daegu: "22", incheon: "23", gwangju: "24",
  daejeon: "25", ulsan: "26", sejong: "29", gyeonggi: "31", gangwon: "32",
  chungbuk: "33", chungnam: "34", jeonbuk: "35", jeonnam: "36",
  gyeongbuk: "37", gyeongnam: "38", jeju: "39",
};

export const REGION_ID_BY_PROVINCE_GEO_CODE = Object.fromEntries(
  Object.entries(PROVINCE_GEO_CODE_BY_REGION_ID).map(([regionId, code]) => [code, regionId]),
);

export const EXCLUDED_MUNICIPALITY_NAMES = new Set(["옹진군", "울릉군"]);

export const shortRegionName = (name = "") =>
  String(name)
    .replace("특별자치도", "")
    .replace("특별자치시", "")
    .replace("특별시", "")
    .replace("광역시", "")
    .replace(/도$/, "")
    .replace("충청북", "충북")
    .replace("충청남", "충남")
    .replace("전라남", "전남")
    .replace("경상북", "경북")
    .replace("경상남", "경남");

export const regionIdForProvinceFeature = (feature) =>
  REGION_ID_BY_PROVINCE_GEO_CODE[String(feature?.properties?.code || "").slice(0, 2)] || null;

export const municipalityFeaturesForRegion = (geoJson, regionId) => {
  const prefix = PROVINCE_GEO_CODE_BY_REGION_ID[regionId];
  if (!prefix || !Array.isArray(geoJson?.features)) return [];
  return geoJson.features.filter((feature) =>
    String(feature?.properties?.code || "").startsWith(prefix)
    && !EXCLUDED_MUNICIPALITY_NAMES.has(feature?.properties?.name),
  );
};
