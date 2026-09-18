// 출발지·도착지·지도·항공/숙소 검색에서 공통으로 쓰는 위치 카탈로그입니다.
// 모든 좌표는 WGS84(latitude/longitude)이며, 백엔드가 그대로 API 검색 조건으로 사용할 수 있습니다.
// 선택 UI는 이 파일의 이름과 좌표만 사용합니다. 관광지 사진은 가이드/콘텐츠 카드에서 별도로 관리합니다.

const buildDistrict = (region, district, parentArea = null) => {
  const airportCodes = district.airportCodes || region.airportCodes || [];

  const builtDistrict = {
    id: district.id,
    countryCode: "KR",
    regionCode: region.regionCode,
    region: region.name,
    name: district.name,
    detail: district.name,
    latitude: district.latitude,
    longitude: district.longitude,
    airportCodes,
    airportCode: airportCodes[0] || null,
    apiSearchKeyword: district.apiSearchKeyword || `${region.name} ${district.name}`,
    parentArea,
    needsGeocoding: false,
  };

  const children = district.children || [];
  return children.length
    ? { ...builtDistrict, children: children.map((child) => buildDistrict(region, child, district.name)) }
    : builtDistrict;
};

const buildRegion = ({ id, regionCode, name, latitude, longitude, airportCodes, districts }) => {
  const base = {
    id,
    countryCode: "KR",
    regionCode,
    name,
    region: name,
    detail: name,
    latitude,
    longitude,
    airportCodes,
    airportCode: airportCodes[0] || null,
    apiSearchKeyword: name,
    needsGeocoding: false,
  };

  return { ...base, districts: districts.map((district) => buildDistrict(base, district)) };
};

// 17개 시·도와 대표 시·군·구입니다. 실서비스에서는 이 배열을 /api/locations 응답으로 교체할 수 있습니다.
export const koreanRegions = [
  buildRegion({ id: "seoul", regionCode: "KR-11", name: "서울특별시", latitude: 37.5665, longitude: 126.978, airportCodes: ["GMP", "ICN"], districts: [
    { id: "seoul-jongno", name: "종로구", latitude: 37.573, longitude: 126.9794 },
    { id: "seoul-mapogu", name: "마포구", latitude: 37.5663, longitude: 126.9019 },
    { id: "seoul-gangnam", name: "강남구", latitude: 37.4979, longitude: 127.0276 },
    { id: "seoul-songpa", name: "송파구", latitude: 37.5145, longitude: 127.1059 },
    { id: "seoul-yeongdeungpo", name: "영등포구", latitude: 37.5264, longitude: 126.8962 },
  ] }),
  buildRegion({ id: "busan", regionCode: "KR-26", name: "부산광역시", latitude: 35.1796, longitude: 129.0756, airportCodes: ["PUS"], districts: [
    { id: "busan-haeundae", name: "해운대구", latitude: 35.1631, longitude: 129.1635 },
    { id: "busan-suyeong", name: "수영구·광안리", latitude: 35.1532, longitude: 129.1187 },
    { id: "busan-jung", name: "중구·남포동", latitude: 35.106, longitude: 129.0323 },
    { id: "busan-gijang", name: "기장군", latitude: 35.2444, longitude: 129.2224 },
  ] }),
  buildRegion({ id: "daegu", regionCode: "KR-27", name: "대구광역시", latitude: 35.8714, longitude: 128.6014, airportCodes: ["TAE"], districts: [
    { id: "daegu-jung", name: "중구·동성로", latitude: 35.8693, longitude: 128.6062 },
    { id: "daegu-suseong", name: "수성구", latitude: 35.8586, longitude: 128.63 },
    { id: "daegu-dong", name: "동구", latitude: 35.8866, longitude: 128.6357 },
    { id: "daegu-dalseo", name: "달서구", latitude: 35.8299, longitude: 128.532 },
  ] }),
  buildRegion({ id: "incheon", regionCode: "KR-28", name: "인천광역시", latitude: 37.4563, longitude: 126.7052, airportCodes: ["ICN", "GMP"], districts: [
    { id: "incheon-jung", name: "중구", latitude: 37.4738, longitude: 126.6218, airportCodes: ["ICN"] },
    { id: "incheon-yeonsu", name: "연수구·송도", latitude: 37.4104, longitude: 126.6783 },
    { id: "incheon-bupyeong", name: "부평구", latitude: 37.507, longitude: 126.7219, airportCodes: ["GMP", "ICN"] },
    { id: "incheon-ganghwa", name: "강화군", latitude: 37.7469, longitude: 126.4876, airportCodes: ["ICN"] },
  ] }),
  buildRegion({ id: "gwangju", regionCode: "KR-29", name: "광주광역시", latitude: 35.1595, longitude: 126.8526, airportCodes: ["KWJ"], districts: [
    { id: "gwangju-dong", name: "동구", latitude: 35.146, longitude: 126.923 },
    { id: "gwangju-seo", name: "서구", latitude: 35.152, longitude: 126.8895 },
    { id: "gwangju-buk", name: "북구", latitude: 35.1745, longitude: 126.911 },
    { id: "gwangju-gwangsan", name: "광산구", latitude: 35.1395, longitude: 126.793 },
  ] }),
  buildRegion({ id: "daejeon", regionCode: "KR-30", name: "대전광역시", latitude: 36.3504, longitude: 127.3845, airportCodes: ["CJJ"], districts: [
    { id: "daejeon-yuseong", name: "유성구", latitude: 36.3622, longitude: 127.3561 },
    { id: "daejeon-seo", name: "서구", latitude: 36.355, longitude: 127.3839 },
    { id: "daejeon-jung", name: "중구", latitude: 36.3259, longitude: 127.4214 },
    { id: "daejeon-dong", name: "동구", latitude: 36.3117, longitude: 127.454 },
  ] }),
  buildRegion({ id: "ulsan", regionCode: "KR-31", name: "울산광역시", latitude: 35.5384, longitude: 129.3114, airportCodes: ["USN"], districts: [
    { id: "ulsan-nam", name: "남구", latitude: 35.5439, longitude: 129.3297 },
    { id: "ulsan-jung", name: "중구", latitude: 35.5693, longitude: 129.332 },
    { id: "ulsan-ulju", name: "울주군", latitude: 35.5226, longitude: 129.2423 },
    { id: "ulsan-buk", name: "북구", latitude: 35.5823, longitude: 129.3614 },
  ] }),
  buildRegion({ id: "sejong", regionCode: "KR-36", name: "세종특별자치시", latitude: 36.48, longitude: 127.289, airportCodes: ["CJJ"], districts: [
    { id: "sejong-jochiwon", name: "조치원읍", latitude: 36.6009, longitude: 127.2982 },
    { id: "sejong-naseong", name: "나성동", latitude: 36.4846, longitude: 127.2628 },
    { id: "sejong-eojin", name: "어진동", latitude: 36.5041, longitude: 127.2679 },
    { id: "sejong-geumnam", name: "금남면", latitude: 36.4637, longitude: 127.2829 },
  ] }),
  buildRegion({ id: "gyeonggi", regionCode: "KR-41", name: "경기도", latitude: 37.4138, longitude: 127.5183, airportCodes: ["GMP", "ICN"], districts: [
    { id: "gyeonggi-paju", name: "파주시", latitude: 37.7599, longitude: 126.78, airportCodes: ["ICN"] },
    { id: "gyeonggi-suwon", name: "수원시", latitude: 37.2636, longitude: 127.0286, airportCodes: ["GMP"] },
    { id: "gyeonggi-seongnam", name: "성남시", latitude: 37.42, longitude: 127.1267, airportCodes: ["GMP"] },
    { id: "gyeonggi-goyang", name: "고양시", latitude: 37.6584, longitude: 126.832 },
    { id: "gyeonggi-gapyeong", name: "가평군", latitude: 37.8315, longitude: 127.51, airportCodes: ["GMP"] },
    { id: "gyeonggi-yongin", name: "용인시", latitude: 37.2411, longitude: 127.1776, airportCodes: ["GMP"] },
  ] }),
  buildRegion({ id: "gangwon", regionCode: "KR-42", name: "강원특별자치도", latitude: 37.8228, longitude: 128.1555, airportCodes: ["YNY", "GMP"], districts: [
    { id: "gangwon-chuncheon", name: "춘천시", latitude: 37.8813, longitude: 127.73, airportCodes: ["GMP"] },
    { id: "gangwon-gangneung", name: "강릉시", latitude: 37.7519, longitude: 128.8761, airportCodes: ["YNY"] },
    { id: "gangwon-sokcho", name: "속초시", latitude: 38.207, longitude: 128.5918, airportCodes: ["YNY"] },
    { id: "gangwon-pyeongchang", name: "평창군", latitude: 37.3705, longitude: 128.39, airportCodes: ["YNY"] },
    { id: "gangwon-wonju", name: "원주시", latitude: 37.3422, longitude: 127.9202, airportCodes: ["CJJ"] },
  ] }),
  buildRegion({ id: "chungbuk", regionCode: "KR-43", name: "충청북도", latitude: 36.6357, longitude: 127.4912, airportCodes: ["CJJ"], districts: [
    { id: "chungbuk-cheongju", name: "청주시", latitude: 36.6424, longitude: 127.489 },
    { id: "chungbuk-chungju", name: "충주시", latitude: 36.991, longitude: 127.926 },
    { id: "chungbuk-jecheon", name: "제천시", latitude: 37.1326, longitude: 128.191 },
    { id: "chungbuk-danyang", name: "단양군", latitude: 36.9847, longitude: 128.365 },
    { id: "chungbuk-boeun", name: "보은군", latitude: 36.4894, longitude: 127.729 },
  ] }),
  buildRegion({ id: "chungnam", regionCode: "KR-44", name: "충청남도", latitude: 36.5184, longitude: 126.8, airportCodes: ["CJJ", "GMP"], districts: [
    { id: "chungnam-cheonan", name: "천안시", latitude: 36.8151, longitude: 127.1139 },
    { id: "chungnam-asan", name: "아산시", latitude: 36.7898, longitude: 127.0018 },
    { id: "chungnam-gongju", name: "공주시", latitude: 36.4465, longitude: 127.119 },
    { id: "chungnam-taean", name: "태안군", latitude: 36.7456, longitude: 126.2979 },
    { id: "chungnam-boryeong", name: "보령시", latitude: 36.3335, longitude: 126.6127 },
  ] }),
  buildRegion({ id: "jeonbuk", regionCode: "KR-45", name: "전북특별자치도", latitude: 35.7175, longitude: 127.153, airportCodes: ["CJJ", "KUV"], districts: [
    { id: "jeonbuk-jeonju", name: "전주시", latitude: 35.8242, longitude: 127.148, airportCodes: ["CJJ"] },
    { id: "jeonbuk-gunsan", name: "군산시", latitude: 35.9675, longitude: 126.7369, airportCodes: ["KUV"] },
    { id: "jeonbuk-namwon", name: "남원시", latitude: 35.4164, longitude: 127.3904, airportCodes: ["CJJ"] },
    { id: "jeonbuk-buan", name: "부안군", latitude: 35.7315, longitude: 126.7332, airportCodes: ["KUV"] },
    { id: "jeonbuk-muju", name: "무주군", latitude: 36.0079, longitude: 127.6602, airportCodes: ["CJJ"] },
  ] }),
  buildRegion({ id: "jeonnam", regionCode: "KR-46", name: "전라남도", latitude: 34.8679, longitude: 126.991, airportCodes: ["RSU", "MWX", "KWJ"], districts: [
    { id: "jeonnam-yeosu", name: "여수시", latitude: 34.7604, longitude: 127.6622, airportCodes: ["RSU"] },
    { id: "jeonnam-suncheon", name: "순천시", latitude: 34.9506, longitude: 127.4872, airportCodes: ["RSU"] },
    { id: "jeonnam-mokpo", name: "목포시", latitude: 34.8118, longitude: 126.3922, airportCodes: ["MWX"] },
    { id: "jeonnam-damyang", name: "담양군", latitude: 35.3212, longitude: 126.9882, airportCodes: ["KWJ"] },
    { id: "jeonnam-naju", name: "나주시", latitude: 35.0158, longitude: 126.7108, airportCodes: ["KWJ"] },
  ] }),
  buildRegion({ id: "gyeongbuk", regionCode: "KR-47", name: "경상북도", latitude: 36.4919, longitude: 128.8889, airportCodes: ["KPO", "TAE"], districts: [
    { id: "gyeongbuk-gyeongju", name: "경주시", latitude: 35.8562, longitude: 129.2247, airportCodes: ["KPO"] },
    { id: "gyeongbuk-pohang", name: "포항시", latitude: 36.019, longitude: 129.3435, airportCodes: ["KPO"] },
    { id: "gyeongbuk-andong", name: "안동시", latitude: 36.5684, longitude: 128.7294, airportCodes: ["TAE"] },
    { id: "gyeongbuk-yeongju", name: "영주시", latitude: 36.8057, longitude: 128.6241, airportCodes: ["TAE"] },
  ] }),
  buildRegion({ id: "gyeongnam", regionCode: "KR-48", name: "경상남도", latitude: 35.4606, longitude: 128.2132, airportCodes: ["PUS", "HIN"], districts: [
    { id: "gyeongnam-changwon", name: "창원시", latitude: 35.228, longitude: 128.6811, airportCodes: ["PUS"] },
    { id: "gyeongnam-tongyeong", name: "통영시", latitude: 34.8544, longitude: 128.4332, airportCodes: ["PUS"] },
    { id: "gyeongnam-geoje", name: "거제시", latitude: 34.8806, longitude: 128.6211, airportCodes: ["PUS"] },
    { id: "gyeongnam-jinju", name: "진주시", latitude: 35.18, longitude: 128.1076, airportCodes: ["HIN"] },
    { id: "gyeongnam-namhae", name: "남해군", latitude: 34.8377, longitude: 127.8925, airportCodes: ["HIN", "PUS"] },
  ] }),
  buildRegion({ id: "jeju", regionCode: "KR-49", name: "제주특별자치도", latitude: 33.4996, longitude: 126.5312, airportCodes: ["CJU"], districts: [
    { id: "jeju-city", name: "제주시", latitude: 33.4996, longitude: 126.5312, apiSearchKeyword: "제주특별자치도 제주시", children: [
      { id: "jeju-aewol", name: "애월읍", latitude: 33.4622, longitude: 126.3295, apiSearchKeyword: "제주특별자치도 제주시 애월읍 애월" },
      { id: "jeju-jocheon", name: "조천읍", latitude: 33.5343, longitude: 126.6345, apiSearchKeyword: "제주특별자치도 제주시 조천읍 함덕 조천" },
      { id: "jeju-hallim", name: "한림읍", latitude: 33.4106, longitude: 126.2687, apiSearchKeyword: "제주특별자치도 제주시 한림읍 협재 한림" },
      { id: "jeju-gujwa", name: "구좌읍", latitude: 33.5225, longitude: 126.8512, apiSearchKeyword: "제주특별자치도 제주시 구좌읍 월정리 세화" },
      { id: "jeju-hangyeong", name: "한경면", latitude: 33.3501, longitude: 126.1841, apiSearchKeyword: "제주특별자치도 제주시 한경면 신창" },
      { id: "jeju-chuja", name: "추자면", latitude: 33.9637, longitude: 126.2961, apiSearchKeyword: "제주특별자치도 제주시 추자면 추자도" },
      { id: "jeju-udo", name: "우도면", latitude: 33.5065, longitude: 126.9534, apiSearchKeyword: "제주특별자치도 제주시 우도면 우도" },
      { id: "jeju-downtown", name: "제주시내(동 지역)", latitude: 33.4996, longitude: 126.5312, apiSearchKeyword: "제주특별자치도 제주시 동지역 제주시내 제주공항 원도심" },
    ] },
    { id: "seogwipo-city", name: "서귀포시", latitude: 33.253, longitude: 126.5596, apiSearchKeyword: "제주특별자치도 서귀포시", children: [
      { id: "jeju-daejeong", name: "대정읍", latitude: 33.2266, longitude: 126.2525, apiSearchKeyword: "제주특별자치도 서귀포시 대정읍 모슬포" },
      { id: "jeju-namwon", name: "남원읍", latitude: 33.2799, longitude: 126.7207, apiSearchKeyword: "제주특별자치도 서귀포시 남원읍" },
      { id: "jeju-seongsan", name: "성산읍", latitude: 33.4421, longitude: 126.9109, apiSearchKeyword: "제주특별자치도 서귀포시 성산읍 성산 섭지코지" },
      { id: "jeju-andeok", name: "안덕면", latitude: 33.2573, longitude: 126.3307, apiSearchKeyword: "제주특별자치도 서귀포시 안덕면 산방산" },
      { id: "jeju-pyoseon", name: "표선면", latitude: 33.3267, longitude: 126.8311, apiSearchKeyword: "제주특별자치도 서귀포시 표선면 표선" },
      { id: "seogwipo-downtown", name: "서귀포시내(동 지역)", latitude: 33.253, longitude: 126.5596, apiSearchKeyword: "제주특별자치도 서귀포시 동지역 서귀포시내 중문" },
    ] },
  ] }),
];

export const flattenDistricts = (districts = []) => districts.flatMap((district) => [
  district,
  ...flattenDistricts(district.children || []),
]);

const locationFromDistrict = (region, district) => ({
  id: district.id,
  countryCode: district.countryCode,
  regionCode: region.regionCode,
  region: region.name,
  name: district.name,
  detail: district.detail,
  latitude: district.latitude,
  longitude: district.longitude,
  airportCodes: district.airportCodes,
  airportCode: district.airportCode,
  apiSearchKeyword: district.apiSearchKeyword,
  parentArea: district.parentArea || null,
  needsGeocoding: false,
});

// 기존 App.jsx가 사용하던 출발지 export를 유지합니다.
// 새 화면에서는 koreanRegions를 직접 사용하고, 이 배열은 호환성 레이어로 남깁니다.
export const departureRegions = koreanRegions.map((region) => ({
  ...region,
  region: region.name,
  districts: region.districts.map((district) => ({ ...district })),
}));

const domesticLocationIndex = koreanRegions.reduce((index, region) => {
  index[region.name] = locationFromDistrict(region, region.districts[0]);
  flattenDistricts(region.districts).forEach((district) => {
    index[district.name] = locationFromDistrict(region, district);
  });
  return index;
}, {});

const findDomesticLocation = (regionId, districtId) => {
  const region = koreanRegions.find((item) => item.id === regionId);
  const district = flattenDistricts(region?.districts).find((item) => item.id === districtId);
  return region && district ? locationFromDistrict(region, district) : null;
};

// 기존 대표 목적지 명칭을 유지하기 위한 별칭입니다.
const domesticAliases = {
  서울: findDomesticLocation("seoul", "seoul-jongno"),
  부산: findDomesticLocation("busan", "busan-haeundae"),
  대구: findDomesticLocation("daegu", "daegu-jung"),
  인천: findDomesticLocation("incheon", "incheon-jung"),
  광주: findDomesticLocation("gwangju", "gwangju-dong"),
  대전: findDomesticLocation("daejeon", "daejeon-yuseong"),
  울산: findDomesticLocation("ulsan", "ulsan-nam"),
  세종: findDomesticLocation("sejong", "sejong-naseong"),
  제주도: { ...findDomesticLocation("jeju", "jeju-downtown"), id: "destination-jeju", detail: "제주시", apiSearchKeyword: "제주특별자치도 제주시" },
  전주: findDomesticLocation("jeonbuk", "jeonbuk-jeonju"),
  경주: findDomesticLocation("gyeongbuk", "gyeongbuk-gyeongju"),
  여수: findDomesticLocation("jeonnam", "jeonnam-yeosu"),
  속초: findDomesticLocation("gangwon", "gangwon-sokcho"),
  "가평·춘천": { id: "destination-gapyeong-chuncheon", countryCode: "KR", regionCode: "KR-41", region: "경기도·강원특별자치도", name: "가평·춘천", detail: "가평군·춘천시", latitude: 37.8564, longitude: 127.62, airportCodes: ["GMP"], airportCode: "GMP", apiSearchKeyword: "가평군 춘천시", needsGeocoding: false },
};

const overseasDestinationCoordinates = {
  후쿠오카: { id: "destination-fukuoka", countryCode: "JP", regionCode: "JP-40", region: "후쿠오카현", detail: "하카타", latitude: 33.5904, longitude: 130.4017, airportCodes: ["FUK"], airportCode: "FUK", apiSearchKeyword: "Fukuoka Hakata", needsGeocoding: false },
  방콕: { id: "destination-bangkok", countryCode: "TH", regionCode: "TH-10", region: "방콕", detail: "왓 아룬", latitude: 13.7563, longitude: 100.5018, airportCodes: ["BKK", "DMK"], airportCode: "BKK", apiSearchKeyword: "Bangkok Wat Arun", needsGeocoding: false },
  뉴욕: { id: "destination-newyork", countryCode: "US", regionCode: "US-NY", region: "뉴욕주", detail: "맨해튼", latitude: 40.7128, longitude: -74.006, airportCodes: ["JFK", "EWR"], airportCode: "JFK", apiSearchKeyword: "New York Manhattan", needsGeocoding: false },
  오사카: { id: "destination-osaka", countryCode: "JP", regionCode: "JP-27", region: "오사카부", detail: "난바", latitude: 34.6937, longitude: 135.5023, airportCodes: ["KIX", "ITM"], airportCode: "KIX", apiSearchKeyword: "Osaka Namba", needsGeocoding: false },
  다낭: { id: "destination-danang", countryCode: "VN", regionCode: "VN-DN", region: "다낭", detail: "미케비치", latitude: 16.0544, longitude: 108.2022, airportCodes: ["DAD"], airportCode: "DAD", apiSearchKeyword: "Da Nang My Khe Beach", needsGeocoding: false },
  타이베이: { id: "destination-taipei", countryCode: "TW", regionCode: "TW-TPE", region: "타이베이시", detail: "시먼딩", latitude: 25.033, longitude: 121.5654, airportCodes: ["TPE", "TSA"], airportCode: "TPE", apiSearchKeyword: "Taipei Ximending", needsGeocoding: false },
  파리: { id: "destination-paris", countryCode: "FR", regionCode: "FR-IDF", region: "일드프랑스", detail: "에펠탑", latitude: 48.8566, longitude: 2.3522, airportCodes: ["CDG", "ORY"], airportCode: "CDG", apiSearchKeyword: "Paris Eiffel Tower", needsGeocoding: false },
  시드니: { id: "destination-sydney", countryCode: "AU", regionCode: "AU-NSW", region: "뉴사우스웨일스", detail: "하버", latitude: -33.8688, longitude: 151.2093, airportCodes: ["SYD"], airportCode: "SYD", apiSearchKeyword: "Sydney Harbour", needsGeocoding: false },
};

// 기존 App.jsx가 사용하던 목적지 좌표 사전을 유지합니다.
export const destinationCoordinatesByName = { ...domesticLocationIndex, ...domesticAliases, ...overseasDestinationCoordinates };

const jejuLocation = (districtId, override = {}) => ({ ...findDomesticLocation("jeju", districtId), ...override });

// 제주 전용 숙소 권역 선택과 기존 일정 화면의 호환성을 유지합니다.
export const jejuRegionCoordinates = {
  "제주공항·시내": jejuLocation("jeju-downtown", { id: "jeju-airport-city", detail: "제주공항·시내", name: "제주공항·시내", apiSearchKeyword: "제주공항 제주 시내" }),
  애월: jejuLocation("jeju-aewol"),
  "협재·한림": jejuLocation("jeju-hallim", { name: "협재·한림", detail: "협재·한림" }),
  "중문·서귀포": jejuLocation("seogwipo-downtown", { name: "중문·서귀포", detail: "중문·서귀포" }),
  "성산·섭지코지": jejuLocation("jeju-seongsan", { name: "성산·섭지코지", detail: "성산·섭지코지" }),
  "함덕·조천": jejuLocation("jeju-jocheon", { name: "함덕·조천", detail: "함덕·조천" }),
};

// 백엔드 요청용 표준 payload입니다. custom 입력은 needsGeocoding=true로 전달합니다.
export const toApiLocation = (location) =>
  location
    ? {
        id: location.id,
        locationId: location.id,
        name: location.detail || location.name || location.region || "",
        countryCode: location.countryCode || "KR",
        regionCode: location.regionCode || null,
        region: location.region || location.name || null,
        district: location.detail || location.name || null,
        administrativeArea: location.region || location.name || null,
        localArea: location.detail || location.name || null,
        point: {
        latitude: location.latitude ?? location.point?.latitude ?? null,
        longitude: location.longitude ?? location.point?.longitude ?? null,
        },
          latitude: location.latitude ?? location.point?.latitude ?? null,
          longitude: location.longitude ?? location.point?.longitude ?? null,
        airportCodes: location.airportCodes || (location.airportCode ? [location.airportCode] : []),
        airportCode: location.airportCode || location.airportCodes?.[0] || null,
        apiSearchKeyword: location.apiSearchKeyword || location.detail || location.name || null,
        needsGeocoding: Boolean(location.needsGeocoding),
      }
    : null;
