const photo = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=86`;

const profiles = {
  "숙성도 중문점": {
    category: "제주 흑돼지 전문점",
    address: "제주 서귀포시 중문 관광단지 인근",
    imageUrls: [photo("photo-1544025162-d76694265947"), photo("photo-1529692236671-f1f6cf9683ba")],
    rating: 4.7,
    reviewCount: 2840,
    menus: [
      { name: "숙성 흑돼지 모둠", price: 72000, description: "대표 숙성 부위를 함께 즐기는 구성", isSignature: true },
      { name: "흑돼지 목살", price: 24000, description: "두툼하게 구운 제주 흑돼지 목살" },
      { name: "갈치속젓 볶음밥", price: 9000, description: "고기 식사 뒤 곁들이기 좋은 메뉴" },
    ],
    reviewSummary: "숙성육의 식감과 직원 구이 서비스가 좋다는 반응이 많고, 저녁 시간에는 대기 가능성을 고려하는 편이 좋아요.",
    reviewKeywords: ["숙성육", "직원 구이", "가족 식사", "대기 확인"],
  },
  "이춘옥 원조고등어쌈밥": {
    category: "제주 향토음식",
    address: "제주 제주시 애월읍 해안도로 인근",
    imageUrls: [photo("photo-1515003197210-e0cd71810b5f"), photo("photo-1547592180-85f173990554")],
    rating: 4.5,
    reviewCount: 1760,
    menus: [
      { name: "고등어쌈밥", price: 18000, description: "고등어조림과 쌈 채소를 곁들인 대표 한 상", isSignature: true },
      { name: "고등어구이", price: 17000, description: "담백하게 구운 고등어 한 상" },
      { name: "전복뚝배기", price: 18000, description: "제주 해산물을 담은 따뜻한 뚝배기" },
    ],
    reviewSummary: "양념 고등어와 쌈 채소의 조합, 해안도로 접근성이 좋다는 평가가 많아요. 식사 시간에는 혼잡할 수 있어요.",
    reviewKeywords: ["고등어쌈밥", "푸짐한 한 상", "해안도로", "가족 여행"],
  },
  "자매국수": {
    category: "제주 고기국수",
    address: "제주 제주시 공항권",
    imageUrls: [photo("photo-1569718212165-3a8278d5f624"), photo("photo-1612929633738-8fe44f7ec841")],
    rating: 4.4,
    reviewCount: 3910,
    menus: [
      { name: "고기국수", price: 10000, description: "돼지고기 육수와 수육을 올린 제주식 국수", isSignature: true },
      { name: "비빔국수", price: 10000, description: "매콤한 양념과 수육을 곁들인 국수" },
      { name: "돔베고기", price: 32000, description: "도톰하게 썬 제주식 수육" },
    ],
    reviewSummary: "진한 육수와 부드러운 고기, 공항에서의 접근성이 장점으로 자주 언급돼요.",
    reviewKeywords: ["고기국수", "공항 근처", "빠른 식사", "웨이팅"],
  },
  "스시 호시카이": {
    category: "스시 오마카세",
    address: "제주 제주시 도심권",
    imageUrls: [photo("photo-1579871494447-9811cf80d66c"), photo("photo-1553621042-f6e147245754")],
    rating: 4.8,
    reviewCount: 620,
    menus: [
      { name: "런치 오마카세", price: 110000, description: "제주 제철 식재료를 활용한 점심 코스", isSignature: true },
      { name: "디너 오마카세", price: 180000, description: "스시와 계절 요리로 구성한 저녁 코스" },
    ],
    reviewSummary: "제주 식재료를 활용한 구성과 차분한 서비스가 강점으로 꼽혀요. 예약 여부를 먼저 확인해 주세요.",
    reviewKeywords: ["오마카세", "기념일", "제주 식재료", "예약 필수"],
  },
};

const genericMenus = [
  { name: "대표 메뉴", price: 18000, description: "매장에서 가장 많이 찾는 대표 메뉴", isSignature: true },
  { name: "계절 추천 메뉴", price: 22000, description: "방문 시기에 맞춘 추천 메뉴" },
];

export function mockRestaurantDetail({ placeId, name, address, latitude, longitude, representativeMenu }) {
  const profile = profiles[name] ?? {};
  const menus = profile.menus ?? genericMenus.map((menu, index) => index === 0 && representativeMenu
    ? { ...menu, name: representativeMenu }
    : menu);
  return {
    id: placeId || `mock-restaurant-${encodeURIComponent(name || "place")}`,
    name: name || "식당",
    category: profile.category || "지역 추천 식당",
    address: address || profile.address || "상세 주소는 지도에서 확인해 주세요.",
    point: { latitude: latitude ?? null, longitude: longitude ?? null },
    imageUrls: profile.imageUrls ?? [photo("photo-1414235077428-338989a2e8c0")],
    menus,
    rating: profile.rating ?? 4.5,
    reviewCount: profile.reviewCount ?? 320,
    reviewSummary: profile.reviewSummary || "메뉴의 맛과 여행 동선에서의 접근성을 중심으로 만족도가 높은 장소예요.",
    reviewKeywords: profile.reviewKeywords ?? ["현지 추천", "대표 메뉴", "여행 동선"],
    businessHours: "영업시간은 방문 전 지도에서 최신 정보를 확인해 주세요.",
    naverMapUrl: `https://map.naver.com/p/search/${encodeURIComponent(`${name || "식당"} 제주`)}`,
    provider: "DEMO_FIXTURE",
    isMock: true,
    sourceLabel: "TripBuddy 시연용 상세 데이터",
    refreshedAt: "2026-09-10T00:00:00+09:00",
  };
}
