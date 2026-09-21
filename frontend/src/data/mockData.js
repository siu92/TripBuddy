import jejuCoastPhoto from "../assets/jeju-main-hero.jpeg";
import { koreanRegions } from "./locationCatalog";
import { safeTime, parseTicketLeg } from "./travelSchedule";

// Mock catalog and state-independent planning helpers.
export const heroSlides = [
  {
    id: "santorini",
    label: "그리스 산토리니",
    src: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=2200&q=90",
  },
  {
    id: "zhangjiajie",
    label: "중국 장가계",
    src: "https://unsplash.com/photos/CRvaC071ZXo/download?force=true&w=2400",
  },
  {
    id: "kyoto",
    label: "일본 교토 전통 거리",
    src: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=2200&q=90",
  },
  {
    id: "borabora",
    label: "프렌치폴리네시아 보라보라",
    src: "https://unsplash.com/photos/TOvYrc0D9y4/download?force=true&w=2400",
  },
  {
    id: "venice",
    label: "이탈리아 베네치아",
    src: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=2200&q=90",
  },
  {
    id: "niagara",
    label: "캐나다 나이아가라 폭포",
    src: "https://images.unsplash.com/photo-1598402453861-4fbcbf6ced3b?auto=format&fit=max&w=3600&q=95",
  },
];

export const images = {
  // 가이드 카드는 메인 히어로·여행지 탐색 카드와 겹치지 않는 실제 명소 사진을 사용합니다.
  jeju:
    "https://tong.visitkorea.or.kr/cms/resource/56/3114756_image2_1.jpg",
  fukuoka:
    "https://unsplash.com/photos/7KsDG_v_v7g/download?force=true&w=1600",
  bangkok:
    "https://api.tourismthailand.org/upload/live/content_article/1124-17204.png",
  newyork:
    "https://unsplash.com/photos/Zmod14qJWws/download?force=true&w=1600",
  coast: "https://cdn.sisunnews.co.kr/news/photo/201810/91116_202218_2718.jpg",
};
export const destinations = [
  {
    id: "jeju",
    title: "제주도",
    city: "Jeju, Korea",
    tag: "성산일출봉과 푸른 제주 바다",
    image: images.jeju,
  },
  {
    id: "fukuoka",
    title: "후쿠오카",
    city: "Fukuoka, Japan",
    tag: "텐진 야타이와 붉은 초롱의 밤",
    image: images.fukuoka,
  },
  {
    id: "bangkok",
    title: "방콕",
    city: "Bangkok, Thailand",
    tag: "짜오프라야 강변의 왓 아룬",
    image: images.bangkok,
  },
  {
    id: "newyork",
    title: "뉴욕",
    city: "New York, USA",
    tag: "골든아워의 맨해튼 스카이라인",
    image: images.newyork,
  },
];
export const quickLinks = [
  {
    icon: "sparkles",
    title: "AI 일정 설계",
    text: "조건만 고르면 일정 완성",
    target: "#planner",
  },
  {
    icon: "plane",
    title: "항공권 비교",
    text: "출발지와 날짜별 비교",
    target: "#planner",
  },
  {
    icon: "home",
    title: "숙소 찾기",
    text: "취향에 맞는 숙소 한눈에",
    target: "#commerce-stays",
  },
  {
    icon: "ticket",
    title: "투어·액티비티",
    text: "테마파크부터 로컬 체험까지",
    target: "#commerce-tours",
  },
  {
    icon: "car",
    title: "교통·렌터카",
    text: "KTX부터 렌터카까지 편하게",
    target: "#commerce-passes",
  },
  {
    icon: "smartphone",
    title: "유심·eSIM",
    text: "데이터 끊김 없는 여행 준비",
    target: "#commerce-esim",
  },
];

const product = (id, title, location, tag, price, image, rating = "4.8", reviews = "2,410") => ({ id, title, location, tag, price, image, rating, reviews });
export const tourProducts = [
  product("tour-01", "카파도키아 프리미엄 선라이즈 열기구", "튀르키예 · 괴레메", "호텔 픽업 · 조식 · 60분 비행", 319000, "https://images.unsplash.com/photo-1733303986601-16512557075c?auto=format&fit=crop&w=900&q=88", "4.93", "3,284"),
  product("tour-02", "스위스 알프스 텐덤 패러글라이딩", "스위스 · 인터라켄", "전문 파일럿 · 장비 · 이동 포함", 329000, "https://images.unsplash.com/photo-1754415238305-0fe96068ee44?auto=format&fit=crop&w=900&q=88", "4.87", "1,746"),
  product("tour-03", "팔라완 프라이빗 호핑투어", "필리핀 · 엘니도", "보트 1대 · 최대 5인 · 런치 포함", 399000, "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=900&q=88", "4.91", "892"),
  product("tour-04", "파리 센강 파노라마 디너 크루즈", "프랑스 · 파리", "3코스 디너와 에펠탑 야경", 129000, "https://www.pelago.com/img/products/FR-France/seine-river-dinner-cruise-with-3course-gourmet-meal/96172bd8f2804167b3d7bb816a305fcf_seine-river-3-course-gourmet-dinner-cruise.jpg", "4.72", "5,108"),
  product("tour-05", "두바이 프리미엄 사막 사파리", "아랍에미리트 · 두바이", "호텔 픽업 · 듄 드라이브 · 디너", 179000, "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=900&q=88", "4.89", "7,431"),
  product("tour-06", "시드니 하버 올인클루시브 디너 크루즈", "호주 · 시드니", "3코스 디너 · 음료 · 선셋 항해", 169000, "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=900&q=88", "4.76", "2,965"),
  product("tour-07", "방콕 왕궁 & 왓 아룬 프라이빗 투어", "태국 · 방콕", "호텔 픽업 · 입장권 · 전용 가이드", 189000, "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=900&q=88", "4.84", "1,538"),
  product("tour-08", "뉴욕 탑오브더락 선셋", "미국 · 뉴욕", "프라임 타임 지정 입장권", 79000, "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=900&q=88", "4.79", "9,216"),
  product("tour-09", "하와이 터틀 캐년 스노클링", "미국 · 오아후", "왕복 셔틀 · 장비 · 선상 공연", 169000, "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=88", "4.86", "4,027"),
  product("tour-10", "그랜드 캐년 랜딩 헬기투어", "미국 · 라스베이거스", "왕복 비행 · 협곡 착륙 · 호텔 이동", 809000, "https://images.unsplash.com/photo-1631811033319-f491bee790d5?auto=format&fit=crop&w=900&q=88", "4.97", "684"),
  product("tour-11", "사그라다 파밀리아 패스트트랙", "스페인 · 바르셀로나", "입장권 · 공인 가이드 · 헤드셋", 119000, "https://d2prydcqrq5962.cloudfront.net/image/journal/article?img_id=1671564&t=1770326242028", "4.82", "6,573"),
  product("tour-12", "아이슬란드 오로라 포토 헌팅", "아이슬란드 · 레이캬비크", "소그룹 · 전문 사진 · 핫초코", 229000, "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&w=900&q=88", "4.95", "2,119"),
];
export const transportPasses = [
  product("pass-01", "유레일 글로벌 패스 4일권", "유럽 33개국", "1개월 내 4일 · 성인 2등석", 443000, "https://images.unsplash.com/photo-1473445361085-b9a07f55608b?auto=format&fit=crop&w=900&q=88"),
  product("pass-02", "스위스 트래블 패스 3일권", "스위스 전역", "연속 3일 · 성인 2등석", 423000, "https://images.unsplash.com/photo-1527668752968-14dc70a27c95?auto=format&fit=crop&w=900&q=88"),
  product("pass-03", "JR 일본 전국 패스 7일권", "일본 전역", "연속 7일 · 성인 보통차", 436000, "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=900&q=88"),
  product("pass-04", "파리 뮤지엄 패스 2일권", "프랑스 · 파리", "48시간 · 박물관 50곳 이상", 133000, "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=900&q=88"),
  product("pass-05", "런던 익스플로러 패스 3개권", "영국 · 런던", "30일 내 원하는 명소 3곳", 162000, "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=88"),
  product("pass-06", "뉴욕 시티패스 5개권", "미국 · 뉴욕", "9일간 핵심 명소 5곳", 201000, "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=900&q=88"),
  product("pass-07", "로마 패스 72시간권", "이탈리아 · 로마", "명소 2곳 · 시내 대중교통", 92000, "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=900&q=88"),
  product("pass-08", "싱가포르 투어리스트 패스 3일권", "싱가포르 전역", "연속 3일 · MRT·버스 무제한", 31000, "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=900&q=88"),
];
export const eSimProducts = [
  product("esim-01", "일본 5G 데이터 eSIM", "일본 전역", "QR 즉시 발송 · 3GB부터", 5900, "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=900&q=88"),
  product("esim-02", "유럽 33개국 통합 eSIM", "유럽 전역", "국경을 넘어도 자동 연결", 27900, "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=900&q=88"),
  product("esim-03", "베트남 무제한 eSIM", "베트남 전역", "매일 고속 데이터 · 핫스팟", 8900, "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=88"),
  product("esim-04", "미국·캐나다 데이터 eSIM", "북미 2개국", "5G 고속 데이터 · 현지 개통", 43900, "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=900&q=88"),
  product("esim-05", "대만 무제한 eSIM", "대만 전역", "타이베이 공항 도착 즉시 연결", 6900, "https://images.unsplash.com/photo-1470004914212-05527e49370b?auto=format&fit=crop&w=900&q=88"),
  product("esim-06", "태국 데이터 eSIM", "태국 전역", "방콕·푸껫 하나로 연결", 7500, "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=900&q=88"),
  product("esim-07", "호주·뉴질랜드 eSIM", "오세아니아 2개국", "도시와 로드트립 모두 커버", 24900, "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=900&q=88"),
  product("esim-08", "싱가포르·말레이시아 eSIM", "동남아 2개국", "환승 여행도 재설정 없이", 9900, "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=900&q=88"),
];
export const saleStays = [
  product("sale-01", "제주 신라호텔 오션뷰", "대한민국 · 제주", "무료 조식 · 오늘 마감", 280000, "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop"),
  product("sale-02", "반얀트리 방콕", "태국 · 방콕", "루프탑 · 무료 취소", 185000, "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=600&auto=format&fit=crop"),
  product("sale-03", "호시노야 도쿄", "일본 · 도쿄", "도심 온천 · 조식 포함", 650000, "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop"),
  product("sale-04", "마리나 베이 샌즈", "싱가포르", "인피니티 풀 포함", 530000, "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=600&auto=format&fit=crop"),
  product("sale-05", "파리 부티크 호텔", "프랑스 · 파리", "에펠탑 도보권", 249000, "https://images.unsplash.com/photo-1455587734955-081b22074882?q=80&w=600&auto=format&fit=crop"),
];
export const paceOptions = ["여유롭게", "보통", "빡빡하게"];
export const foodPreferenceOptions = [
  { code: "KOREAN", label: "한식", description: "향토음식·고기·국수", image: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=900&q=90" },
  { code: "JAPANESE", label: "일식", description: "스시·우동·이자카야", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=90" },
  { code: "CHINESE", label: "중식", description: "면·딤섬·요리", image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=900&q=90" },
  { code: "WESTERN", label: "양식", description: "파스타·브런치·그릴", image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=90" },
  { code: "ASIAN", label: "아시안", description: "태국·베트남·동남아", image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=900&q=90" },
  { code: "CASUAL", label: "분식·간편식", description: "김밥·떡볶이·간단한 한 끼", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=90" },
  { code: "CAFE", label: "카페·디저트", description: "베이커리·커피·디저트", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=90" },
  { code: "VEGETARIAN", label: "채식·건강식", description: "비건·샐러드·건강식", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=90" },
];
export const foodPreferenceCardOptions = [
  { code: "ANY", label: "상관없음", description: "동선과 평점 우선", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=90" },
  ...foodPreferenceOptions,
];
export const themeOptions = [
  {
    title: "맛집",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=88",
  },
  {
    title: "관광",
    image:
      "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=500&q=88",
  },
  {
    title: "휴식",
    image:
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=500&q=88",
  },
  {
    title: "자연",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=500&q=88",
  },
  {
    title: "액티비티",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=500&q=88",
  },
];
export const jejuRegionOptions = [
  {
    area: "제주공항·시내",
    stayArea: "제주공항·시내",
    title: "제주공항·시내",
    description:
      "공항 10분 거리 도두동 무지개해안도로에서 제주의 바다를 먼저 만나요.",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Yongduam_in_jeju.jpg?width=1600",
  },
  {
    area: "애월",
    stayArea: "애월",
    title: "애월",
    description: "애월 해안도로와 카페, 노을을 즐기기 좋아요.",
    image:
      "https://www.nexentire.com/webzine/201603/en/assets/images/contents/009_03.jpg?v=2",
  },
  {
    area: "협재·한림",
    stayArea: "협재·한림",
    title: "협재·한림",
    description: "협재 해변과 한림공원 중심의 서쪽 바다 여행이에요.",
    image: jejuCoastPhoto,
  },
  {
    area: "중문·서귀포",
    stayArea: "중문·서귀포",
    title: "중문·서귀포",
    description: "폭포·주상절리와 휴양을 함께 즐기는 남쪽 여행이에요.",
    image:
      "https://media.triple.guide/triple-cms/c_limit%2Cf_auto%2Ch_2048%2Cw_2048/897e9903-e344-47e1-93ea-b06a22b69ac9.jpeg",
  },
  {
    area: "성산·섭지코지",
    stayArea: "전체",
    title: "성산·섭지코지",
    description: "성산일출봉과 섭지코지의 동쪽 바다를 만나보세요.",
    image:
      "https://pimg.mk.co.kr/news/cms/202404/22/news-p.v1.20240422.7d69bb6b0f67423e8897b66d48dcfd1c_P1.jpg",
  },
  {
    area: "함덕·조천",
    stayArea: "전체",
    title: "함덕·조천",
    description: "에메랄드빛 함덕 바다와 조천 해안 풍경이에요.",
    image: "https://inblu.kr/uploads/place/640x/image_1637507654_56367.jpg",
  },
];
export const outboundOptions = [
  { id: "CAR", icon: "🚙", title: "자차", text: "유류비·통행료까지 계산" },
  { id: "KTX", icon: "🚆", title: "KTX", text: "철도 시간표 기반 비교" },
  { id: "FLIGHT", icon: "✈", title: "항공", text: "가는 편·오는 편 따로 비교" },
  { id: "BUS", icon: "🚌", title: "고속·시외버스", text: "노선과 환승 시간을 비교" },
];
export const localOptions = [
  { id: "RENTAL", icon: "🚗", title: "렌터카", text: "자유로운 동선 추천" },
  { id: "TRANSIT", icon: "🚌", title: "대중교통", text: "버스 중심으로 이동" },
  {
    id: "TAXI",
    icon: "🚕",
    title: "택시·카셰어링",
    text: "필요할 때만 편하게",
  },
  { id: "WALK", icon: "🚶", title: "도보", text: "걸어서 여행하기" },
];
export const departureTimeOptions = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];
export const returnTimeOptions = [
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];
export const transportName = (id, options) =>
  options.find((option) => option.id === id)?.title || "미선택";

// API가 붙기 전에도 선택값에 따라 서로 다른 견적을 보여 주는 계산용 기준입니다.
// 실서비스 연동 시에도 이 출력 구조를 유지해 화면 로직을 안정적으로 교체합니다.
export const toRadians = (value) => (Number(value) * Math.PI) / 180;
export const distanceBetween = (from, to) => {
  if (!from || !to || from.latitude == null || to.latitude == null) return 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return Math.max(25, Math.round(earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))));
};

export const estimateIntercityFare = ({ mode, origin, destination, travelers = 1 }) => {
  const distance = distanceBetween(origin, destination);
  const party = Math.max(1, Number(travelers) || 1);
  const roundTripDistance = distance * 2;
  if (mode === "CAR") {
    const fuel = Math.round((roundTripDistance / 12.5) * 1750);
    const toll = Math.round(roundTripDistance * 74);
    return Math.ceil((fuel + toll) / party);
  }
  if (mode === "KTX") return Math.max(18000, Math.round(distance * 210 + 13000));
  if (mode === "BUS") return Math.max(12000, Math.round(distance * 145 + 9000));
  if (mode === "FERRY") return Math.max(28000, Math.round(distance * 180 + 22000));
  if (mode === "OTHER") return Math.max(0, Math.round(distance * 125));
  return 0;
};

export const demoStayImages = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=90",
];

export const generateMockHotels = (location) => {
  const region = koreanRegions.find((item) => item.regionCode === location?.regionCode);
  const districts = region?.districts?.map((district) => district.name) || [location?.detail || location?.region || "선택 지역"];
  const regionName = location?.detail || location?.region || "선택 지역";
  const nameSuffixes = ["오션뷰 호텔", "시그니엘", "프리미어 스테이", "부티크 리조트", "그랜드 레지던스", "힐사이드 호텔", "센트럴 스위트", "베이 프라이빗 풀빌라", "가든 테라스 호텔", "로컬 스테이", "루프탑 레지던스", "아트 하우스"];
  const prices = [89000, 98000, 126000, 148000, 171000, 196000, 218000, 245000, 278000, 315000, 365000, 428000];
  return Array.from({ length: 12 }, (_, index) => {
    const area = districts[index % districts.length];
    return {
      id: `mock-stay-${location?.id || regionName}-${index}`,
      area,
      name: `${area} ${nameSuffixes[index]}`,
      price: prices[index],
      image: hotelImages[index % hotelImages.length],
      rating: (4.92 - index * 0.035).toFixed(2),
      reviewCount: 1540 + index * 437,
      tags: index % 3 === 0 ? ["무료취소", "오션뷰"] : index % 3 === 1 ? ["조식포함", "도심"] : ["신규오픈", "주차가능"],
      deal: [0, 3, 7].includes(index),
      left: 2 + (index % 5),
      insight: `${area} 권역과 선택한 여행 기간을 기준으로 구성한 시연 숙소 견적이에요.`,
      isMock: true,
    };
  });
};

const exactDistanceKm = (from, to) => {
  if (!from || !to || !Number.isFinite(from.latitude) || !Number.isFinite(from.longitude) || !Number.isFinite(to.latitude) || !Number.isFinite(to.longitude)) return null;
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return Math.round(earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
};

export const demoStaysForLocation = (location) => {
  if (location?.regionCode !== "KR-49") return generateMockHotels(location);
  return stays.map((stay) => {
    const distanceKm = exactDistanceKm(location, stay);
    return {
      ...stay,
      distanceKm,
      insight: distanceKm == null
        ? stay.insight
        : `${location.detail || location.name || "선택한 관광지"}에서 약 ${distanceKm}km 거리로, 선택한 동선을 시작하기 편리해요.`,
    };
  });
};

export const demoRentalsForLocation = (location) => {
  if (!location || location.regionCode === "KR-49") return rentals;
  const area = location.detail || location.region || "선택 지역";
  return [
    ["현지 렌터카 특가", "경차 · 2박 3일", 96800, "완전자차 선택 가능", "영업소 10분 내 인수", "24시간 전 무료", "4.71"],
    ["지역 제휴 렌터카", "준중형 · 2박 3일", 132000, "일반자차 · 면책 30만원", "도심 영업소 인수", "48시간 전 무료", "4.78"],
    ["프리미엄 모빌리티", "SUV · 2박 3일", 176000, "완전자차 · 면책 0원", "숙소 배송 옵션", "24시간 전 무료", "4.86"],
  ].map(([company, car, price, insurance, pickup, cancellation, score], index) => ({
    id: `mock-rental-${location.id || area}-${index}`,
    company,
    car,
    price,
    originalPrice: Math.round(price * 1.26),
    discount: index === 0 ? 21 : 0,
    badge: index === 0 ? "시연 특가" : index === 1 ? "균형 추천" : "편의 추천",
    note: "2박 3일 · 48시간 · 더미 견적",
    insurance,
    fuel: "동일 연료 또는 충전량 반납",
    pickup,
    cancellation,
    score,
    reviews: 1800 + index * 901,
    age: "만 21세 · 1년",
    specs: index === 0 ? "4인승 · 자동 · 캐리어 2개" : index === 1 ? "5인승 · 자동 · 캐리어 3개" : "5인승 · 자동 · 캐리어 4개",
    benefit: `${area} 기준으로 생성한 시연 차량 견적입니다. 실제 계약 전 보장 범위와 반납 조건을 확인하세요.`,
    image: rentalImages[["billycar", "jeju-pass", "lotte-rent"][index]],
    isMock: true,
  }));
};
export const rentals = [
  {
  id: "billycar",
  company: "빌리카",
  car: "더 뉴 레이 · 경차",
  price: 89800,
  originalPrice: 133000,
  discount: 32,
  badge: "오늘만 특가",
  note: "2박 3일 48시간 · 시연 계약 조건 기준",
  insurance: "완전자차 · 면책 0원",
  fuel: "동일 연료 반납",
  pickup: "공항 셔틀 약 8분",
  cancellation: "24시간 전 무료",
  score: "4.82",
  reviews: 4821,
  age: "만 21세 · 1년",
  specs: "4인승 · 자동 · 캐리어 2개",
  benefit: "최저가인데 완전자차 포함 · 단, 휴차보상료는 현장 약관 확인",
  category: "COMPACT",
  image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kia_Ray_PE_II_Clear_White_(2).jpg?width=900",

  latitude: 33.5041086,
  longitude: 126.5008161,
  estimatedShuttleMinutes: 8,
},
{
  id: "jeju-pass",
  company: "제주렌트카",
  car: "K3 · 준중형",
  price: 112000,
  badge: "제휴 특가",
  note: "2박 3일 48시간 · 시연 계약 조건 기준",
  insurance: "일반자차 · 면책 30만원",
  fuel: "동일 연료 반납",
  pickup: "공항 셔틀 약 7~8분",
  cancellation: "48시간 전 무료",
  score: "4.76",
  reviews: 3926,
  age: "만 21세 · 1년",
  specs: "5인승 · 자동 · 캐리어 3개",
  benefit:
    "준중형 공간이 장점 · 사고 시 면책금과 보장 제외 항목을 확인하세요",
  category: "SEDAN",
  image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kia_k3_bd_white_(1).jpg?width=900",

  latitude: 33.50499435,
  longitude: 126.4971834,
  estimatedShuttleMinutes: 8,
},
{
  id: "sk-rent",
  company: "SK렌터카 제주",
  car: "캐스퍼 · 경형 SUV",
  price: 128000,
  badge: "빠른 인수",
  note: "2박 3일 48시간 · 시연 계약 조건 기준",
  insurance: "일반자차 · 면책 50만원",
  fuel: "동일 연료 반납",
  pickup: "공항 셔틀 약 5분",
  cancellation: "24시간 전 무료",
  score: "4.79",
  reviews: 3670,
  age: "만 21세 · 1년",
  specs: "5인승 · 자동 · 캐리어 3개",
  benefit: "공항에서 가까운 제주지점 · 보장 범위는 상품별 확인",
  category: "SUV",
  image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Hyundai_Casper_Active_1.0_Turbo_AX1_white_(1).jpg?width=900",

  latitude: 33.5037519,
  longitude: 126.5013717,
  estimatedShuttleMinutes: 5,
},
{
  id: "lotte-rent",
  company: "롯데렌터카 제주",
  car: "코나 · SUV",
  price: 156000,
  badge: "인기 차종",
  note: "2박 3일 48시간 · 시연 계약 조건 기준",
  insurance: "완전자차 · 면책 0원",
  fuel: "동일 연료 반납",
  pickup: "오토하우스 셔틀 약 10분",
  cancellation: "24시간 전 무료",
  score: "4.88",
  reviews: 6452,
  age: "만 21세 · 1년",
  specs: "5인승 · 자동 · 캐리어 4개",
  benefit:
    "SUV·완전자차·오토하우스 인수로 편의성 강화 · 비싼 이유를 한눈에 비교",
  category: "SUV",
  image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Hyundai_Kona_2.0_Inspiration_SX2_Atlas_White_(1)_(cropped).jpg?width=900",

  latitude: 33.509006995327,
  longitude: 126.50357848078,
  estimatedShuttleMinutes: 10,
},
{
  id: "d-rent",
  company: "제주엔젤카",
  car: "아반떼 · 준중형",
  price: 119000,
  badge: "후기 추천",
  note: "2박 3일 48시간 · 시연 계약 조건 기준",
  insurance: "일반자차 · 면책 30만원",
  fuel: "동일 연료 반납",
  pickup: "공항 셔틀 약 5~10분",
  cancellation: "48시간 전 무료",
  score: "4.71",
  reviews: 2814,
  age: "만 21세 · 1년",
  specs: "5인승 · 자동 · 캐리어 3개",
  benefit: "48시간 전 무료 취소가 강점 · 사고 보장 한도는 예약 전 확인",
  category: "SEDAN",
  image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Hyundai_Avante_CN7_white_(3)_(cropped).jpg?width=900",

  latitude: 33.496346045986,
  longitude: 126.49294835285,
  estimatedShuttleMinutes: 10,
},
{
  id: "free-rent",
  company: "자유렌터카",
  car: "니로 EV · 전기차",
  price: 144000,
  badge: "친환경 픽",
  note: "2박 3일 48시간 · 시연 계약 조건 기준",
  insurance: "완전자차 · 면책 0원",
  fuel: "충전 70% 이상 반납",
  pickup: "공항 셔틀 약 10분 이내",
  cancellation: "24시간 전 무료",
  score: "4.75",
  reviews: 3198,
  age: "만 26세 · 2년",
  specs: "5인승 · 자동 · 캐리어 3개",
  benefit: "충전카드·완전자차 포함 · 반납 전 충전 잔량 조건을 확인하세요",
  category: "SUV",
  image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kia_Niro_EV_SG2_EV_Snow_White_Pearl_(2).jpg?width=900",

  latitude: 33.499430900069,
  longitude: 126.47871421846,
  estimatedShuttleMinutes: 10,
  },
];
export const rentalImages = {
  billycar: rentals[0].image,
  "jeju-pass": rentals[1].image,
  "sk-rent": rentals[2].image,
  "lotte-rent": rentals[3].image,
  "d-rent": rentals[4].image,
  "free-rent": rentals[5].image,
};
export const domestic = [
  "서울",
  "부산",
  "제주도",
  "전주",
  "경주",
  "여수",
  "가평·춘천",
  "속초",
];
export const overseas = [
  "후쿠오카",
  "방콕",
  "뉴욕",
  "오사카",
  "다낭",
  "타이베이",
  "파리",
  "시드니",
];
export const placePhotos = [
  images.coast,
  images.fukuoka,
  images.newyork,
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=88",
  images.jeju,
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=88",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=88",
  "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=900&q=88",
];
export const carriers = [
  [
    "대한항공",
    "KE 1201 · KE 1248",
    "07:15 → 08:25",
    "19:50 → 21:00",
    218000,
    "navy",
  ],
  [
    "아시아나항공",
    "OZ 8111 · OZ 8142",
    "08:25 → 09:35",
    "20:10 → 21:20",
    205000,
    "brown",
  ],
  [
    "제주항공",
    "7C 401 · 7C 432",
    "10:15 → 11:25",
    "20:40 → 21:50",
    142800,
    "orange",
  ],
  [
    "티웨이항공",
    "TW 501 · TW 536",
    "11:30 → 12:40",
    "19:05 → 20:15",
    148900,
    "red",
  ],
  [
    "대한항공",
    "KE 1211 · KE 1158",
    "12:50 → 14:00",
    "18:30 → 19:40",
    238000,
    "navy",
  ],
  [
    "진에어",
    "LJ 401 · LJ 430",
    "13:40 → 14:50",
    "20:15 → 21:25",
    154600,
    "green",
  ],
  [
    "에어부산",
    "BX 401 · BX 432",
    "14:30 → 15:40",
    "19:30 → 20:40",
    149800,
    "blue",
  ],
  [
    "대한항공",
    "KE 1131 · KE 1168",
    "16:05 → 17:15",
    "20:35 → 21:45",
    245000,
    "navy",
  ],
  [
    "이스타항공",
    "ZE 401 · ZE 436",
    "17:20 → 18:30",
    "21:05 → 22:15",
    139900,
    "purple",
  ],
  [
    "제주항공",
    "7C 111 · 7C 136",
    "18:10 → 19:20",
    "21:25 → 22:35",
    135800,
    "orange",
  ],
];
export const incheonCarriers = [
  [
    "대한항공",
    "KE 1107 · KE 1160",
    "10:00 → 11:15",
    "18:15 → 19:25",
    264000,
    "navy",
  ],
  [
    "아시아나항공",
    "OZ 8911 · OZ 8924",
    "07:50 → 09:00",
    "20:20 → 21:30",
    221000,
    "brown",
  ],
  [
    "진에어",
    "LJ 531 · LJ 548",
    "09:15 → 10:25",
    "19:35 → 20:45",
    168000,
    "green",
  ],
  [
    "제주항공",
    "7C 871 · 7C 886",
    "10:50 → 12:00",
    "21:05 → 22:15",
    151000,
    "orange",
  ],
  [
    "티웨이항공",
    "TW 721 · TW 738",
    "12:15 → 13:25",
    "18:10 → 19:20",
    159000,
    "red",
  ],
  [
    "에어부산",
    "BX 821 · BX 836",
    "13:40 → 14:50",
    "20:40 → 21:50",
    163000,
    "blue",
  ],
  [
    "대한항공",
    "KE 1119 · KE 1172",
    "15:10 → 16:20",
    "21:20 → 22:30",
    278000,
    "navy",
  ],
  [
    "이스타항공",
    "ZE 721 · ZE 736",
    "16:35 → 17:45",
    "19:10 → 20:20",
    146000,
    "purple",
  ],
  [
    "제주항공",
    "7C 883 · 7C 898",
    "18:05 → 19:15",
    "20:55 → 22:05",
    154000,
    "orange",
  ],
  [
    "진에어",
    "LJ 539 · LJ 556",
    "19:25 → 20:35",
    "22:10 → 23:20",
    171000,
    "green",
  ],
  [
    "제주항공",
    "7C 841 · 7C 848",
    "06:35 → 07:45",
    "08:20 → 09:30",
    137000,
    "orange",
  ],
  [
    "아시아나항공",
    "OZ 8935 · OZ 8940",
    "14:45 → 15:55",
    "10:35 → 11:45",
    214000,
    "brown",
  ],
];
export const flightDeals = {
  "GMP-2": { fare: 89900, originalFare: 169000, discount: 47, seats: 3 },
  "GMP-3": { fare: 94900, originalFare: 160900, discount: 41, seats: 4 },
  "ICN-0": { fare: 149000, originalFare: 264000, discount: 44, seats: 2 },
  "ICN-7": { fare: 99900, originalFare: 169900, discount: 41, seats: 3 },
};
export const flightOriginAirports = [
  { code: "GMP", city: "서울", name: "김포국제공항", shortName: "김포", region: "수도권" },
  { code: "ICN", city: "인천", name: "인천국제공항", shortName: "인천", region: "수도권" },
  { code: "PUS", city: "부산", name: "김해국제공항", shortName: "김해", region: "경상권" },
  { code: "CJJ", city: "청주", name: "청주국제공항", shortName: "청주", region: "충청권" },
  { code: "TAE", city: "대구", name: "대구국제공항", shortName: "대구", region: "경상권" },
  { code: "KWJ", city: "광주", name: "광주공항", shortName: "광주", region: "호남권" },
  { code: "RSU", city: "여수", name: "여수공항", shortName: "여수", region: "호남권" },
  { code: "MWX", city: "무안", name: "무안국제공항", shortName: "무안", region: "호남권" },
  { code: "WJU", city: "원주", name: "원주공항", shortName: "원주", region: "강원권" },
  { code: "USN", city: "울산", name: "울산공항", shortName: "울산", region: "경상권" },
  { code: "YNY", city: "양양", name: "양양국제공항", shortName: "양양", region: "강원권" },
  { code: "KUV", city: "군산", name: "군산공항", shortName: "군산", region: "호남권" },
  { code: "KPO", city: "포항", name: "포항경주공항", shortName: "포항경주", region: "경상권" },
  { code: "HIN", city: "사천", name: "사천공항", shortName: "사천", region: "경상권" },
];
const regionalFlightProfiles = {
  PUS: { duration: 65, baseFare: 118000 }, CJJ: { duration: 65, baseFare: 124000 },
  TAE: { duration: 65, baseFare: 121000 }, KWJ: { duration: 55, baseFare: 108000 },
  RSU: { duration: 55, baseFare: 112000 }, MWX: { duration: 60, baseFare: 126000 },
  WJU: { duration: 75, baseFare: 139000 },
  USN: { duration: 65, baseFare: 128000 }, YNY: { duration: 80, baseFare: 146000 },
  KUV: { duration: 60, baseFare: 122000 }, KPO: { duration: 70, baseFare: 134000 },
  HIN: { duration: 60, baseFare: 126000 },
};
const flightClockMinutes = (time) => {
  const [hour, minute] = String(time || "00:00").split(":").map(Number);
  return hour * 60 + minute;
};
const routeTime = (timeRange, duration) => {
  const departure = timeRange.slice(0, 5);
  const total = flightClockMinutes(departure) + duration;
  return `${departure} → ${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};
const enrichFlight = (flight, airport) => ({
  ...flight,
  originName: airport.name,
  originCity: airport.city,
  destination: "CJU",
  destinationName: "제주국제공항",
  durationMinutes: Math.max(45, flightClockMinutes(flight.out.slice(-5)) - flightClockMinutes(flight.out.slice(0, 5))),
  cabin: "일반석",
  baggage: /대한항공|아시아나/.test(flight.airline) ? "위탁 20kg 포함" : "기내 10kg · 위탁 별도",
  fareNote: "세금·유류할증료 포함",
  isMock: true,
});
const baseFlights = [
  ...carriers.map(([airline, code, out, back, fare, tone], index) => ({
    id: `GMP-${index}`,
    origin: "GMP",
    airline,
    code,
    out,
    back,
    originalFare: fare,
    fare: fare - 6000,
    tone,
  })),
  ...incheonCarriers.map(([airline, code, out, back, fare, tone], index) => ({
    id: `ICN-${index}`,
    origin: "ICN",
    airline,
    code,
    out,
    back,
    originalFare: fare,
    fare: fare - 6000,
    tone,
  })),
].map((flight) => enrichFlight({ ...flight, ...(flightDeals[flight.id] || {}) }, flightOriginAirports.find((airport) => airport.code === flight.origin)));
const regionalFlights = Object.entries(regionalFlightProfiles).flatMap(([origin, profile], airportIndex) => {
  const airport = flightOriginAirports.find((item) => item.code === origin);
  return carriers.slice(0, 6).map(([airline, code, out, back, , tone], index) => enrichFlight({
    id: `${origin}-${index}`,
    origin,
    airline,
    code,
    out: routeTime(out, profile.duration),
    back: routeTime(back, profile.duration),
    originalFare: profile.baseFare + index * 12800 + airportIndex * 1700,
    fare: profile.baseFare - 9000 + index * 11200 + airportIndex * 1500,
    tone,
  }, airport));
});
export const flights = [...baseFlights, ...regionalFlights];
export const saleFlightIds = new Set(Object.keys(flightDeals));
export const isSaleFlight = (flight) => saleFlightIds.has(flight.id);
export const oneWayFare = (flight) => Math.round((flight?.fare || 0) / 2);
export const oneWayOriginalFare = (flight) =>
  Math.round((flight?.originalFare || flight?.fare || 0) / 2);
export const hotelImages = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1562790351-d273a961e0e9?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1601918774946-25832a4be0d6?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=90",
];
export const hotelPhotoOverrides = {
  "메종 글래드 제주":
    "https://tong.visitkorea.or.kr/cms/resource/59/2476659_image2_1.jpg",
  "롯데시티호텔 제주":
    "https://d2pyzcqibfhr70.cloudfront.net/images/0/2023-07-19/KEJG1T2NOrFDhHNeFzMmXzvjmlMk5WrYI7oTviX1.jpg",
  "호텔 난타 제주":
    "https://images.trvl-media.com/lodging/18000000/17370000/17363100/17363086/66e16674.jpg?impolicy=resizecrop&ra=fill&rh=575&rw=575",
  "호텔 리젠트마린 제주":
    "https://yaimg.yanolja.com/v5/2022/09/27/11/1280/6332e0447706b9.59126938.jpg",
  "마레보 비치 호텔":
    "https://yaimg.yanolja.com/v5/2024/12/17/03/1280/6760f4fe5d3889.80696667.jpg",
  "탐라스테이 호텔 제주":
    "https://yaimg.yanolja.com/v5/2022/09/01/14/1280/6310c11a953111.27194708.jpg",
  한림리조트:
    "https://images.trvl-media.com/lodging/6000000/5970000/5963800/5963738/9836e8c1.jpg?impolicy=resizecrop&ra=fill&rh=575&rw=575",
  "호텔 더 그랑 중문":
    "https://cf.bstatic.com/xdata/images/hotel/max1024x768/269097594.jpg?k=a71d4e65e24de3e8b631d897c8fa2a31670721618dcbed438d95c136a50e8aa1&o=",
  "제주 부영호텔&리조트":
    "https://cdn.ostrovok.ru/t/1200x616/content/75/72/7572c5144344c41e4c9d8f59411ca562a2e98c14.jpeg",
  "히든 클리프 호텔&네이쳐":
    "https://cf.bstatic.com/xdata/images/hotel/max1024x768/230411426.jpg?k=efef58e0d78db08d22efa503dfa12d003cd4631404646576c00567d777374fdc&o=",
};
export const hotelGroups = [
  [
    "제주공항·시내",
    [
      ["메종 글래드 제주", 185000],
      ["롯데시티호텔 제주", 198000],
      ["신라스테이 제주", 178000],
      ["호텔 난타 제주", 142000],
      ["호텔 리젠트마린 제주", 164000],
    ],
  ],
  [
    "애월",
    [
      ["마레보 비치 호텔", 190000],
      ["다인오세아노 호텔", 176000],
      ["탐라스테이 호텔 제주", 154000],
      ["스탠포드 호텔앤리조트 제주", 198000],
      ["애월 스테이 인 제주", 138000],
    ],
  ],
  [
    "협재·한림",
    [
      ["블루스프링 부띠끄 호텔", 168000],
      ["한림리조트", 149000],
      ["라온 호텔 앤 리조트", 156000],
      ["제주 라온프라이빗타운", 192000],
      ["한림오션캐슬", 134000],
    ],
  ],
  [
    "중문·서귀포",
    [
      ["호텔 더 그랑 중문", 172000],
      ["제주 부영호텔&리조트", 198000],
      ["히든 클리프 호텔&네이쳐", 199000],
      ["골든데이지 서귀포 오션 호텔", 139000],
      ["호텔 케니 서귀포", 126000],
    ],
  ],
  [
    "안덕·오설록",
    [
      ["제주신화월드 메리어트 리조트", 248000],
      ["랜딩관 제주신화월드", 176000],
      ["서머셋 제주신화월드", 289000],
      ["루체빌 리조트", 132000],
      ["호텔 스카브로", 158000],
    ],
  ],
  [
    "함덕·조천",
    [
      ["유탑 유블레스 호텔 제주", 146000],
      ["소노벨 제주", 189000],
      ["에벤에셀 호텔", 124000],
    ],
  ],
  [
    "성산·표선",
    [
      ["휘닉스 아일랜드 제주", 264000],
      ["골든튤립 제주 성산 호텔", 128000],
      ["코업시티호텔 성산", 116000],
      ["소노캄 제주", 218000],
      ["해비치 호텔앤드리조트 제주", 342000],
    ],
  ],
];
hotelGroups.push(["기타 지역", []]);
const jejuStayAreaCenters = {
  "제주공항·시내": { latitude: 33.4996, longitude: 126.5180 },
  애월: { latitude: 33.4625, longitude: 126.3300 },
  "협재·한림": { latitude: 33.3908, longitude: 126.2520 },
  "중문·서귀포": { latitude: 33.2525, longitude: 126.4770 },
  "안덕·오설록": { latitude: 33.3060, longitude: 126.3020 },
  "함덕·조천": { latitude: 33.5400, longitude: 126.6680 },
  "성산·표선": { latitude: 33.4200, longitude: 126.8420 },
};
export const stays = hotelGroups.flatMap(([area, list], region) =>
  list.map(([name, price], index) => {
    const order = region * 5 + index;
    return {
      id: `${region}-${index}`,
      area,
      name,
      price,
      image:
        hotelPhotoOverrides[name] || hotelImages[order % hotelImages.length],
      rating: (4.97 - order * 0.021).toFixed(2),
      reviewCount: 3460 + ((order * 317) % 4210),
      deal: [0, 6, 11, 17].includes(order),
      left: 2 + (order % 5),
      latitude: jejuStayAreaCenters[area]?.latitude ?? null,
      longitude: jejuStayAreaCenters[area]?.longitude ?? null,
      insight:
        region === 1
          ? "애월 해안 동선과 노을 시간에 잘 맞아요."
          : region === 2
            ? "협재·한림 해변을 둘러보기 좋은 위치예요."
            : region === 3
              ? "중문 관광지와 휴식 일정을 함께 즐기기 좋아요."
              : "공항 접근성과 첫날 동선이 편리해요.",
    };
  }),
);
export const days = [
  [
    "공항에서 애월의 노을까지",
    "첫날은 이동 시간을 여유롭게 두고 서쪽 바다를 만나요.",
    [
      [
        "10:10",
        "✈",
        "제주국제공항 도착",
        "수하물 수령 후, 미리 선택한 현지 이동 수단으로 여행을 시작해요.",
        "50분",
      ],
      [
        "11:05",
        "🚗",
        "렌터카 수령 · 출발 준비",
        "차량 상태와 보험을 확인하고 애월 방향으로 출발해요.",
        "35분",
      ],
      [
        "11:50",
        "🍚",
        "이춘옥 원조고등어쌈밥",
        "애월의 실제 고등어쌈밥 식당에서 첫 끼를 여유롭게 즐겨요.",
        "70분",
      ],
      [
        "13:25",
        "◌",
        "한담해안산책로",
        "곽지에서 한담까지 이어지는 바닷길을 천천히 걸어요.",
        "90분",
      ],
      [
        "15:20",
        "☕",
        "애월 카페 거리",
        "노을 시간 전, 바다 전망 카페에서 휴식과 사진 시간을 가져요.",
        "75분",
      ],
      [
        "17:20",
        "⌂",
        "선택한 숙소 체크인",
        "선택한 숙소 위치를 기준으로 동선을 마무리하고 잠시 쉬어가요.",
        "80분",
      ],
      [
        "19:10",
        "🍊",
        "애월 저녁 · 로컬 메뉴",
        "숙소와 가까운 지역 맛집에서 제주 첫날의 저녁을 즐겨요.",
        "90분",
      ],
    ],
  ],
  [
    "협재의 물빛과 제주 숲",
    "바다·초록·노을을 한 번에 담는 서쪽 중심의 하루예요.",
    [
      [
        "08:30",
        "🥐",
        "숙소 조식 · 출발 준비",
        "조식과 이동 시간을 고려해 여유롭게 하루를 열어요.",
        "60분",
      ],
      [
        "09:50",
        "⌇",
        "협재 해수욕장",
        "비양도가 보이는 얕고 맑은 바다에서 산책과 물빛을 즐겨요.",
        "100분",
      ],
      [
        "11:40",
        "◌",
        "금능해변 산책",
        "협재와 이어지는 조용한 해변에서 사진을 남겨요.",
        "55분",
      ],
      [
        "12:50",
        "🍜",
        "한림 로컬 점심",
        "오후 숲·오름 동선 전, 한림에서 가볍게 점심을 즐겨요.",
        "70분",
      ],
      [
        "14:20",
        "🌿",
        "오설록 티 뮤지엄",
        "녹차밭과 티 라운지에서 제주만의 쉼을 경험해요.",
        "95분",
      ],
      [
        "16:30",
        "◌",
        "새별오름",
        "해 질 무렵 가벼운 오름 산책으로 서쪽 풍경을 바라봐요.",
        "80분",
      ],
      [
        "18:30",
        "🍽",
        "제주 흑돼지 저녁",
        "하루의 마지막은 이동 동선을 줄인 저녁 식사로 마무리해요.",
        "100분",
      ],
    ],
  ],
  [
    "제주를 담아 돌아가는 날",
    "체크아웃부터 공항까지 여유 시간을 확보한 귀가 동선이에요.",
    [
      [
        "08:40",
        "⌂",
        "체크아웃 · 짐 정리",
        "출발 전 짐을 싣고 마지막 바다를 보기 위한 준비를 해요.",
        "35분",
      ],
      [
        "09:30",
        "◌",
        "곽지해수욕장",
        "체크아웃 뒤 마지막 바다 산책과 기념 사진을 남겨요.",
        "55분",
      ],
      [
        "10:45",
        "☕",
        "제주 로컬 카페",
        "공항 이동 전, 제주 감성이 남은 카페에서 잠시 쉬어가요.",
        "50분",
      ],
      [
        "11:50",
        "🍊",
        "동문시장",
        "선물과 제주 간식을 한곳에서 고르고 포장 시간을 확보해요.",
        "85분",
      ],
      [
        "13:30",
        "🍜",
        "제주시 로컬 점심",
        "공항 근처에서 가볍게 제주 한 끼를 즐겨요.",
        "65분",
      ],
      [
        "14:50",
        "🚗",
        "렌터카 반납 · 공항 이동",
        "주유와 차량 반납 시간을 여유 있게 포함했어요.",
        "50분",
      ],
      [
        "16:00",
        "✈",
        "제주국제공항 출발 준비",
        "수하물 위탁과 면세 쇼핑을 위한 여유 시간 후 귀가해요.",
        "출발",
      ],
    ],
  ],
];
export const money = (value) =>
  new Intl.NumberFormat("ko-KR").format(
    Math.round(Number.isFinite(value) ? value : 0),
  );
export const today = (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
})();
export const dateLabel = (date) => (date ? date.replaceAll("-", ". ") : "날짜 미선택");
export const timeLabel = (time) => time || "시간 미선택";
export const timeToMinutes = (time) => {
  const [hour = 0, minute = 0] = safeTime(time, "00:00")
    .split(":")
    .map(Number);
  return hour * 60 + minute;
};
export const minutesToTime = (minutes) => {
  const normalized = ((Math.round(Number.isFinite(minutes) ? minutes : 0) % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
};
export const durationToMinutes = (duration) => {
  const value = Number.parseInt(duration, 10);
  return Number.isFinite(value) && value >= 0 ? value : 55;
};
export const shiftDayTimes = (day, fromTime, toTime) => {
  const base = timeToMinutes(fromTime);
  const target = timeToMinutes(toTime);
  const delta = target - base;
  return [
    day[0],
    day[1],
    day[2].map(([time, ...rest]) => [
      minutesToTime(timeToMinutes(time) + delta),
      ...rest,
    ]),
  ];
};
export const scheduleEvent = (icon, name, detail, duration, travel = 15) => ({
  icon,
  name,
  detail,
  duration,
  travel,
});
export const makeSequentialPlan = (title, description, firstTime, rows) => {
  let cursor = timeToMinutes(firstTime);
  return [
    title,
    description,
    rows.map((row) => {
      const event = [
        minutesToTime(cursor),
        row.icon,
        row.name,
        row.detail,
        row.duration,
        row.travel,
      ];
      cursor += durationToMinutes(row.duration) + row.travel;
      return event;
    }),
  ];
};
export const stayProfileFor = (stay) => {
  const isHallim = stay?.area === "협재·한림";
  const isAewol = stay?.area === "애월";
  const isJungmun = stay?.area === "중문·서귀포";
  const stayName = stay?.name || "선택한 숙소";
  if (isHallim)
    return {
      key: "hallim",
      stayName,
      areaLabel: "한림",
      arrivalPlace: "협재해수욕장",
      arrivalDetail:
        "한림 숙소 체크인 전, 비양도가 보이는 해변에서 서쪽 바다를 먼저 만나요.",
      dinner: "한림 로컬 저녁",
      dinnerDetail: "협재·한림 권역 안에서 이동을 줄인 저녁 식사예요.",
      secondDay: [
        scheduleEvent(
          "🥐",
          "숙소 조식 · 출발 준비",
          "한림 숙소에서 조식 후, 해변과 숲 동선을 시작해요.",
          "60분",
          20,
        ),
        scheduleEvent(
          "◌",
          "금능해변 산책",
          "협재 바로 옆의 조용한 해변을 여유롭게 걸어요.",
          "80분",
          15,
        ),
        scheduleEvent(
          "🌿",
          "한림공원",
          "야자수 길과 정원을 천천히 둘러봐요.",
          "95분",
          20,
        ),
        scheduleEvent(
          "🍜",
          "한림 로컬 점심",
          "오설록 방향으로 이동 전, 한림에서 점심을 즐겨요.",
          "70분",
          40,
        ),
        scheduleEvent(
          "🍵",
          "오설록 티 뮤지엄",
          "녹차밭과 티 라운지에서 제주만의 쉼을 경험해요.",
          "100분",
          35,
        ),
        scheduleEvent(
          "◌",
          "새별오름",
          "노을 시간에 맞춰 서쪽 풍경을 바라봐요.",
          "80분",
          35,
        ),
        scheduleEvent(
          "🍽",
          "한림 흑돼지 저녁",
          "숙소 권역으로 돌아와 이동 없이 하루를 마무리해요.",
          "95분",
          15,
        ),
      ],
      departurePlace: "협재해수욕장",
      departureDetail: "체크아웃 뒤 숙소와 가까운 마지막 바다 산책이에요.",
    };
  if (isAewol)
    return {
      key: "aewol",
      stayName,
      areaLabel: "애월",
      arrivalPlace: "한담해안산책로",
      arrivalDetail:
        "애월 숙소 체크인 전, 곽지에서 한담까지 이어지는 바닷길을 걸어요.",
      dinner: "애월 로컬 저녁",
      dinnerDetail: "애월 숙소와 가까운 로컬 식당에서 첫날을 마무리해요.",
      secondDay: [
        scheduleEvent(
          "🥐",
          "숙소 조식 · 출발 준비",
          "애월 숙소에서 여유롭게 하루를 시작해요.",
          "60분",
          20,
        ),
        scheduleEvent(
          "◌",
          "곽지해수욕장",
          "한담과 이어지는 맑은 바다에서 산책과 사진을 즐겨요.",
          "85분",
          20,
        ),
        scheduleEvent(
          "☕",
          "애월 카페 거리",
          "오전 바다 전망 카페에서 잠시 쉬어가요.",
          "70분",
          45,
        ),
        scheduleEvent(
          "🌿",
          "오설록 티 뮤지엄",
          "녹차밭과 티 라운지에서 제주만의 쉼을 경험해요.",
          "100분",
          35,
        ),
        scheduleEvent(
          "◌",
          "새별오름",
          "해 질 무렵 가벼운 오름 산책을 해요.",
          "80분",
          35,
        ),
        scheduleEvent(
          "🍽",
          "애월 흑돼지 저녁",
          "숙소로 돌아가는 길에 저녁을 즐겨요.",
          "95분",
          15,
        ),
      ],
      departurePlace: "한담해안산책로",
      departureDetail: "체크아웃 후, 공항으로 향하기 전 마지막 바다를 만나요.",
    };
  if (isJungmun)
    return {
      key: "jungmun",
      stayName,
      areaLabel: "중문",
      arrivalPlace: "중문색달해수욕장",
      arrivalDetail:
        "히든 클리프 체크인 전, 중문색달의 해안 풍경을 보며 첫날 이동 피로를 가볍게 풀어요.",
      dinner: "중문 로컬 저녁",
      dinnerDetail:
        "숙소와 가까운 중문권 식당에서 이동을 줄여 첫날을 마무리해요.",
      firstDay: [
        scheduleEvent(
          "🍜",
          "중문 로컬 점심",
          "제주공항에서 렌터카를 인수한 뒤, 중문으로 이동해 첫 식사를 해요.",
          "75분",
          10,
        ),
        scheduleEvent(
          "⌂",
          "히든 클리프 호텔&네이쳐 체크인",
          "15시 체크인 시간에 맞춰 짐을 풀고, 중문·서귀포 중심 동선을 시작해요.",
          "50분",
          15,
        ),
        scheduleEvent(
          "💧",
          "천제연폭포",
          "히든 클리프에서 가까운 천제연폭포 산책로를 먼저 둘러봐요.",
          "75분",
          12,
        ),
        scheduleEvent(
          "🌊",
          "중문색달해수욕장",
          "해 질 무렵 색달해변의 파도와 해안 풍경을 즐겨요.",
          "70분",
          15,
        ),
        scheduleEvent(
          "🍽",
          "중문 흑돼지 저녁",
          "숙소와 가까운 중문권에서 이동을 줄여 첫날을 마무리해요.",
          "90분",
          15,
        ),
      ],
      secondDay: [
        scheduleEvent(
          "🥐",
          "숙소 조식 · 출발 준비",
          "중문 숙소에서 조식 후, 서귀포 핵심 명소를 시계 방향으로 둘러봐요.",
          "65분",
          18,
        ),
        scheduleEvent(
          "💧",
          "천제연폭포",
          "개장 시간에 맞춰 폭포 산책로를 먼저 둘러보고 혼잡을 피해요.",
          "85분",
          15,
        ),
        scheduleEvent(
          "🪨",
          "주상절리대",
          "중문에서 가까운 해안 절벽과 산책로를 여유 있게 즐겨요.",
          "75분",
          25,
        ),
        scheduleEvent(
          "🍜",
          "중문 로컬 점심",
          "오후 서귀포 동선 전, 중문권에서 식사와 휴식 시간을 확보해요.",
          "75분",
          35,
        ),
        scheduleEvent(
          "🌺",
          "카멜리아힐",
          "계절 정원 산책과 사진 촬영 시간을 충분히 배정해요.",
          "100분",
          45,
        ),
        scheduleEvent(
          "🌅",
          "산방산·용머리 해안",
          "노을 전 서귀포 서남부 해안 풍경을 보고 숙소 방향으로 돌아와요.",
          "90분",
          35,
        ),
        scheduleEvent(
          "🍽",
          "중문 흑돼지 저녁",
          "히든 클리프와 가까운 중문권에서 하루를 마무리해요.",
          "95분",
          15,
        ),
      ],
      departurePlace: "외돌개·황우지 해안",
      departureDetail:
        "체크아웃 뒤 서귀포 해안 산책을 짧게 즐긴 후 공항으로 향해요.",
    };
  return stayProfileFor({ area: "애월", name: stayName });
};
export const makeJejuDayPlans = (arrivalTime, endTime, stay, flight, dayCount = 3) => {
  const profile = stayProfileFor(stay);
  const arrivalAt = timeToMinutes(arrivalTime);
  const outboundCode = flight?.code?.split("·")[0]?.trim();
  const flightName = flight
    ? `제주국제공항 도착 · ${flight.airline}${outboundCode ? ` ${outboundCode}` : ""}`
    : "제주국제공항 도착";
  const flightDetail = flight
    ? `${flight.originName || flight.origin || "출발 공항"} ${flight.out.slice(0, 5)} 출발 · 제주 ${flight.out.slice(-5)} 도착 항공편을 기준으로 수하물 수령과 현지 이동을 시작해요.`
    : "수하물 수령 후, 선택한 제주 이동 수단으로 여행을 시작해요.";
  const arrivalRows = [
    scheduleEvent("✈", flightName, flightDetail, "30분", 25),
    scheduleEvent(
      "🚗",
      "렌터카 수령 · 출발 준비",
      "차량 상태와 보험을 확인한 뒤 숙소 권역으로 출발해요.",
      "35분",
      profile.key === "jungmun" ? 45 : 35,
    ),
  ];
  if (profile.firstDay) arrivalRows.push(...profile.firstDay);
  else {
    if (arrivalAt <= 11 * 60 + 30)
      arrivalRows.push(
        scheduleEvent(
          "🍚",
          "이춘옥 원조고등어쌈밥",
          "늦지 않은 도착 시간이라 첫 끼를 먼저 즐긴 뒤 서쪽으로 이동해요.",
          "70분",
          20,
        ),
      );
    if (arrivalAt <= 15 * 60 + 30)
      arrivalRows.push(
        scheduleEvent(
          "◌",
          profile.arrivalPlace,
          profile.arrivalDetail,
          "85분",
          20,
        ),
      );
    arrivalRows.push(
      scheduleEvent(
        "⌂",
        `${profile.stayName} 체크인`,
        `${profile.areaLabel} 숙소를 기준으로 짐을 풀고 잠시 쉬어가요.`,
        "55분",
        20,
      ),
      scheduleEvent("🍽", profile.dinner, profile.dinnerDetail, "90분", 15),
    );
    if (arrivalAt <= 13 * 60)
      arrivalRows.splice(
        arrivalRows.length - 2,
        0,
        scheduleEvent(
          "☕",
          profile.key === "hallim" ? "협재 오션 카페" : "애월 카페 거리",
          "숙소 체크인 전, 바다를 보며 잠시 쉬어가요.",
          "60분",
          15,
        ),
      );
  }

  const departureMinutes = timeToMinutes(endTime);
  const earlyReturn = departureMinutes <= 13 * 60;
  const departureRows = earlyReturn
    ? [
        scheduleEvent(
          "⌂",
          "체크아웃 · 짐 정리",
          "도착 시간이 이른 편이라 짐과 차량을 먼저 정리해요.",
          "35분",
          20,
        ),
        scheduleEvent(
          "🚗",
          "렌터카 반납 · 공항 이동",
          "주유와 차량 반납, 셔틀 이동 시간을 포함했어요.",
          "50분",
          10,
        ),
        scheduleEvent(
          "✈",
          "제주국제공항 출발 준비",
          "출발 90분 전 수하물 위탁과 탑승 준비를 마쳐요.",
          "출발",
          0,
        ),
      ]
    : [
        scheduleEvent(
          "⌂",
          "체크아웃 · 짐 정리",
          "숙소에서 짐을 정리한 뒤 마지막 제주 동선을 시작해요.",
          "35분",
          20,
        ),
        scheduleEvent(
          "◌",
          profile.departurePlace,
          profile.departureDetail,
          "65분",
          45,
        ),
        scheduleEvent(
          "🍊",
          "동문시장",
          "선물과 제주 간식을 한곳에서 고르고 포장 시간을 확보해요.",
          "80분",
          15,
        ),
        scheduleEvent(
          "🍜",
          "제주시 로컬 점심",
          "공항 근처에서 가볍게 제주 한 끼를 즐겨요.",
          "65분",
          35,
        ),
        scheduleEvent(
          "🚗",
          "렌터카 반납 · 공항 이동",
          "주유와 차량 반납, 셔틀 이동 시간을 포함했어요.",
          "50분",
          10,
        ),
        scheduleEvent(
          "✈",
          "제주국제공항 출발 준비",
          "출발 90분 전 수하물 위탁과 탑승 준비를 마쳐요.",
          "출발",
          0,
        ),
      ];
  const departureStart = earlyReturn
    ? Math.max(7 * 60 + 30, departureMinutes - 210)
    : Math.max(8 * 60 + 30, departureMinutes - 510);
  const firstDay = makeSequentialPlan(
      `공항에서 ${profile.areaLabel}의 첫날까지`,
      flight
        ? `${flight.airline} ${flight.out} 항공편 도착 후, 렌터카·체크인 순서를 현실적으로 배치했어요.`
        : "도착·인수·체크인 순서를 현실적으로 배치했어요.",
      minutesToTime(arrivalAt),
      arrivalRows,
    );
  const middleDays = Array.from({ length: Math.max(0, dayCount - 2) }, (_, index) =>
    makeSequentialPlan(
      `${profile.areaLabel} 중심의 제주 ${index + 2}일차`,
      "선택한 숙소 권역을 중심으로 대표 장소를 연결하고, 장기 일정에서도 하루 동선이 비지 않도록 구성했어요.",
      "08:30",
      profile.secondDay.map((row, rowIndex) =>
        rowIndex === 0 && index > 0
          ? { ...row, name: `${row.name} · 새로운 동선` }
          : { ...row },
      ),
    ),
  );
  const lastDay = makeSequentialPlan(
      "제주를 담아 돌아가는 날",
      "도착 시각 90분 전 공항 도착을 기준으로 마지막 동선을 설계했어요.",
      minutesToTime(departureStart),
      departureRows,
    );
  return dayCount <= 1 ? [firstDay] : [firstDay, ...middleDays, lastDay];
};

// 지역을 선택한 뒤에는 특정 발표 시나리오가 아니라, 선택한 권역을 중심으로
// 기본 동선을 만듭니다. 실제 서비스에서는 이 프로필을 한국관광공사·지도 경로
// API 응답으로 대체할 수 있도록 장소/이동 시간을 분리해 두었습니다.
export const regionalTripProfiles = {
  "서울특별시": {
    focus: "서울 도심",
    arrival: ["🏯", "경복궁", "궁궐과 북촌을 한 동선으로 둘러보기 좋아요.", "85분", 20],
    dinner: ["🍽", "익선동 저녁", "도보 이동이 편한 골목 식당가에서 첫날을 마무리해요.", "90분", 15],
    dayTwo: [
      ["☕", "성수동 카페 거리", "서울숲과 함께 여유롭게 둘러보는 오전 동선이에요.", "75분", 25],
      ["🌿", "서울숲", "도심 속 산책과 휴식 시간을 확보해요.", "80분", 30],
      ["🍜", "한강 인근 점심", "오후 동선 전, 이동이 편한 권역에서 식사해요.", "70분", 35],
      ["🌇", "남산서울타워", "해 질 무렵 서울 전경을 감상하는 일정이에요.", "95분", 25],
      ["🍽", "을지로 저녁", "숙소 복귀가 편한 도심 식당가를 추천해요.", "90분", 15],
    ],
    departure: ["🛍", "광장시장", "귀가 전 간식과 선물을 둘러보기 좋은 마지막 동선이에요.", "75분", 35],
  },
  "부산광역시": {
    focus: "부산 해안",
    arrival: ["🌊", "해운대해수욕장", "바다를 보며 첫날 이동 피로를 가볍게 풀어요.", "80분", 25],
    dinner: ["🍽", "해운대 로컬 저녁", "숙소와 가까운 해운대권 식당가에서 마무리해요.", "90분", 15],
    dayTwo: [
      ["🏘", "감천문화마을", "아침 혼잡을 피해 골목 풍경을 먼저 둘러봐요.", "95분", 40],
      ["🌉", "송도해상케이블카", "해안 경관을 즐기며 이동 시간을 줄인 코스예요.", "75분", 35],
      ["🍜", "남포동 점심", "시장과 관광지 사이에서 식사 시간을 확보해요.", "70분", 30],
      ["🌁", "광안리 해변", "노을 전 광안대교 풍경을 즐겨요.", "85분", 20],
      ["🍽", "광안리 저녁", "해변 인근에서 하루를 마무리해요.", "90분", 20],
    ],
    departure: ["🛍", "국제시장", "귀가 전 부산 간식과 선물을 살펴봐요.", "75분", 35],
  },
  "대구광역시": {
    focus: "대구 도심",
    arrival: ["🎵", "김광석다시그리기길", "도심 산책으로 여행의 첫 리듬을 만들어요.", "75분", 20],
    dinner: ["🍽", "동성로 저녁", "숙소와 이동이 편한 중심 상권에서 마무리해요.", "90분", 15],
    dayTwo: [
      ["🌿", "앞산전망대", "오전 시간대에 대구 전경을 여유롭게 감상해요.", "95분", 35],
      ["🏛", "대구근대골목", "도보로 이어지는 근대문화 동선을 즐겨요.", "85분", 25],
      ["🍜", "서문시장 점심", "시장 먹거리와 함께 점심 시간을 확보해요.", "75분", 30],
      ["💡", "수성못", "저녁 전 호수 산책으로 이동 피로를 풀어요.", "80분", 25],
      ["🍽", "수성구 저녁", "숙소 복귀 동선을 고려한 저녁이에요.", "90분", 20],
    ],
    departure: ["🛍", "서문시장", "귀가 전 지역 먹거리와 선물을 둘러봐요.", "70분", 30],
  },
  "인천광역시": {
    focus: "인천 항구 도시",
    arrival: ["🏮", "인천 차이나타운", "개항장 역사 거리부터 가볍게 둘러봐요.", "80분", 20],
    dinner: ["🍽", "개항로 저녁", "개항장 인근 식당가에서 첫날을 마무리해요.", "90분", 15],
    dayTwo: [
      ["🏛", "개항장 문화지구", "역사 건축과 전시를 한 동선으로 둘러봐요.", "85분", 25],
      ["🌳", "송도센트럴파크", "수변 산책과 휴식 시간을 확보해요.", "90분", 25],
      ["🍜", "송도 점심", "공원 인근에서 이동을 줄여 식사해요.", "70분", 35],
      ["🌉", "월미도", "바다 전망과 야경을 즐기기 좋은 오후 코스예요.", "85분", 25],
      ["🍽", "인천항 저녁", "항구 인근에서 하루를 마무리해요.", "90분", 20],
    ],
    departure: ["🛍", "신포국제시장", "공항·역 이동 전 간식과 선물을 준비해요.", "70분", 30],
  },
  "광주광역시": {
    focus: "광주 문화",
    arrival: ["🏘", "양림동 역사문화마을", "고즈넉한 골목에서 첫날을 시작해요.", "80분", 20],
    dinner: ["🍽", "동명동 저녁", "카페·식당이 모인 동명동에서 여유롭게 마무리해요.", "90분", 15],
    dayTwo: [
      ["🏛", "국립아시아문화전당", "전시 관람 시간을 충분히 확보한 오전 일정이에요.", "100분", 20],
      ["🌿", "푸른길공원", "도심 산책으로 전시 뒤 휴식을 이어가요.", "70분", 30],
      ["🍜", "충장로 점심", "중심 상권에서 식사와 이동을 함께 해결해요.", "75분", 35],
      ["🏯", "무등산 증심사", "오후의 자연·문화 동선을 가볍게 즐겨요.", "95분", 35],
      ["🍽", "광주 로컬 저녁", "숙소 복귀가 편한 권역에서 마무리해요.", "90분", 15],
    ],
    departure: ["🛍", "1913송정역시장", "이동 전 시장 먹거리와 기념품을 둘러봐요.", "75분", 35],
  },
  "대전광역시": {
    focus: "대전 과학·도심",
    arrival: ["🌳", "한밭수목원", "도심 속 산책으로 가볍게 여행을 시작해요.", "75분", 20],
    dinner: ["🍽", "둔산동 저녁", "숙소와 가까운 중심 상권에서 첫날을 마무리해요.", "90분", 15],
    dayTwo: [
      ["🔬", "국립중앙과학관", "관람 시간을 넉넉히 잡은 과학 문화 코스예요.", "100분", 20],
      ["🌿", "엑스포과학공원", "수변 산책과 사진 시간을 함께 확보해요.", "80분", 25],
      ["🍜", "대전역 인근 점심", "오후 동선 전, 이동이 편한 곳에서 식사해요.", "70분", 30],
      ["☕", "소제동 카페 거리", "근대 건축과 카페를 함께 즐기는 휴식 코스예요.", "80분", 20],
      ["🍽", "은행동 저녁", "도심에서 하루를 여유롭게 마무리해요.", "90분", 20],
    ],
    departure: ["🥖", "성심당 본점", "이동 전 대표 빵과 선물을 준비해요.", "55분", 30],
  },
  "울산광역시": {
    focus: "울산 바다·산업",
    arrival: ["🌊", "대왕암공원", "해안 산책로를 따라 첫날 바다 풍경을 즐겨요.", "85분", 25],
    dinner: ["🍽", "일산해수욕장 저녁", "바다 인근에서 이동을 줄여 마무리해요.", "90분", 15],
    dayTwo: [
      ["🌊", "간절곶", "해가 좋은 오전에 동해안 풍경을 감상해요.", "95분", 40],
      ["🏛", "장생포고래문화마을", "울산만의 해양·산업 이야기를 만나는 코스예요.", "90분", 35],
      ["🍜", "태화강 점심", "강변 인근에서 여유롭게 식사해요.", "70분", 25],
      ["🌿", "태화강국가정원", "오후 산책과 휴식을 위한 코스예요.", "85분", 25],
      ["🍽", "삼산동 저녁", "숙소 복귀가 편한 중심 상권에서 마무리해요.", "90분", 20],
    ],
    departure: ["🛍", "울산중앙시장", "귀가 전 지역 먹거리와 선물을 둘러봐요.", "65분", 30],
  },
  "세종특별자치시": {
    focus: "세종 호수·정원",
    arrival: ["🌊", "세종호수공원", "수변 산책으로 여유롭게 첫날을 시작해요.", "80분", 20],
    dinner: ["🍽", "나성동 저녁", "생활권 중심 식당가에서 첫날을 마무리해요.", "90분", 15],
    dayTwo: [
      ["🌿", "국립세종수목원", "온실과 정원을 충분히 즐기는 오전 코스예요.", "100분", 25],
      ["🏛", "국립세종도서관", "건축과 전시를 함께 즐기는 휴식 일정이에요.", "65분", 20],
      ["🍜", "어진동 점심", "이동이 편한 정부청사 인근에서 식사해요.", "70분", 25],
      ["🌳", "금강보행교", "금강 풍경을 따라 오후 산책을 즐겨요.", "75분", 25],
      ["🍽", "세종 로컬 저녁", "숙소 주변에서 편안하게 마무리해요.", "90분", 15],
    ],
    departure: ["🛍", "세종전통시장", "이동 전 지역 먹거리와 선물을 살펴봐요.", "60분", 25],
  },
  "경기도": {
    focus: "경기 근교",
    arrival: ["🌳", "지역 대표 공원", "선택한 시·군과 가까운 산책 명소부터 가볍게 시작해요.", "80분", 25],
    dinner: ["🍽", "지역 로컬 저녁", "숙소와 가까운 생활권 식당에서 첫날을 마무리해요.", "90분", 15],
    dayTwo: [
      ["🏛", "지역 문화 명소", "선택한 시·군의 대표 문화 공간을 여유롭게 둘러봐요.", "90분", 30],
      ["🌿", "지역 자연 산책", "도심과 자연을 함께 즐기는 동선으로 구성했어요.", "80분", 25],
      ["🍜", "지역 로컬 점심", "오후 이동 전 가까운 권역에서 식사해요.", "70분", 35],
      ["☕", "지역 카페 거리", "여행 취향에 맞춘 휴식 시간을 확보해요.", "70분", 25],
      ["🍽", "지역 특색 저녁", "숙소 복귀 동선을 고려한 저녁이에요.", "90분", 20],
    ],
    departure: ["🛍", "지역 전통시장", "귀가 전 기념품과 간식을 둘러봐요.", "65분", 30],
  },
  "강원특별자치도": {
    focus: "강원 자연",
    arrival: ["🌊", "속초해변", "동해 바다를 보며 첫날 이동 피로를 풀어요.", "80분", 25],
    dinner: ["🍽", "속초 로컬 저녁", "숙소와 가까운 해안권 식당에서 마무리해요.", "90분", 15],
    dayTwo: [
      ["🏔", "설악산 국립공원", "오전 시간대에 자연 풍경을 여유롭게 즐겨요.", "110분", 45],
      ["🌊", "영금정", "동해안 전망과 산책을 이어가는 코스예요.", "75분", 25],
      ["🍜", "속초 중앙시장 점심", "시장 먹거리로 식사와 간식을 함께 해결해요.", "75분", 30],
      ["☕", "청초호 카페", "호수 전망을 보며 오후 휴식을 가져요.", "70분", 25],
      ["🍽", "강원 로컬 저녁", "숙소 권역에서 이동을 줄여 마무리해요.", "90분", 15],
    ],
    departure: ["🛍", "속초관광수산시장", "귀가 전 강원 특산품을 살펴봐요.", "65분", 30],
  },
  "충청북도": {
    focus: "충북 호수·도시",
    arrival: ["🌊", "청남대", "대청호 풍경과 함께 여유롭게 첫날을 시작해요.", "85분", 30],
    dinner: ["🍽", "청주 로컬 저녁", "숙소와 가까운 청주 중심권에서 마무리해요.", "90분", 15],
    dayTwo: [
      ["🏛", "국립청주박물관", "지역 역사와 문화를 만나는 오전 일정이에요.", "90분", 25],
      ["🌿", "상당산성", "성곽 산책과 도시 전망을 함께 즐겨요.", "85분", 25],
      ["🍜", "성안길 점심", "도심 상권에서 식사와 휴식을 이어가요.", "70분", 30],
      ["🍷", "청주공예비엔날레 권역", "전시·카페 등 취향에 맞춘 오후 시간을 보내요.", "80분", 25],
      ["🍽", "충북 로컬 저녁", "숙소 복귀 동선을 고려한 저녁이에요.", "90분", 15],
    ],
    departure: ["🛍", "육거리종합시장", "이동 전 지역 먹거리와 선물을 둘러봐요.", "65분", 30],
  },
  "충청남도": {
    focus: "충남 바다·역사",
    arrival: ["🏛", "공주 공산성", "역사 유적을 따라 가볍게 첫날을 시작해요.", "85분", 25],
    dinner: ["🍽", "공주 로컬 저녁", "숙소와 가까운 지역 식당에서 마무리해요.", "90분", 15],
    dayTwo: [
      ["🏛", "국립부여박물관", "백제 문화권을 이해하는 오전 코스예요.", "90분", 25],
      ["🌿", "궁남지", "호수 산책과 사진 시간을 확보해요.", "75분", 25],
      ["🍜", "부여 로컬 점심", "오후 이동 전 가까운 권역에서 식사해요.", "70분", 35],
      ["🌊", "대천해수욕장", "서해 풍경을 즐기며 여유로운 오후를 보내요.", "85분", 35],
      ["🍽", "충남 로컬 저녁", "숙소 복귀가 편한 곳에서 마무리해요.", "90분", 15],
    ],
    departure: ["🛍", "공주산성시장", "귀가 전 지역 특산품을 둘러봐요.", "65분", 30],
  },
  "전북특별자치도": {
    focus: "전북 한옥·미식",
    arrival: ["🏯", "전주한옥마을", "골목 산책으로 전주의 첫 풍경을 만나봐요.", "90분", 20],
    dinner: ["🍽", "전주 한정식 저녁", "한옥마을과 가까운 곳에서 첫날을 마무리해요.", "90분", 15],
    dayTwo: [
      ["🏛", "경기전", "한옥마을 안에서 역사와 건축을 함께 즐겨요.", "75분", 15],
      ["🌿", "전주향교", "조용한 골목으로 이어지는 오전 산책이에요.", "70분", 20],
      ["🍜", "남부시장 점심", "지역 먹거리로 식사와 간식을 함께 해결해요.", "75분", 30],
      ["☕", "자만벽화마을", "오후 사진·카페 시간을 확보해요.", "80분", 25],
      ["🍽", "전주 로컬 저녁", "숙소와 가까운 권역에서 마무리해요.", "90분", 15],
    ],
    departure: ["🛍", "전주남부시장", "귀가 전 전주 간식과 기념품을 살펴봐요.", "65분", 25],
  },
  "전라남도": {
    focus: "전남 해안",
    arrival: ["🌊", "여수 해상케이블카", "바다와 섬 풍경을 보며 첫날을 시작해요.", "80분", 25],
    dinner: ["🍽", "여수 낭만포차 거리", "해안 야경과 함께 첫날을 마무리해요.", "90분", 15],
    dayTwo: [
      ["🌿", "오동도", "동백숲과 해안 산책을 여유롭게 즐겨요.", "95분", 30],
      ["🏛", "여수 예술랜드", "바다 전망과 체험을 함께 즐기는 코스예요.", "85분", 25],
      ["🍜", "여수 게장 점심", "지역 대표 메뉴로 점심 시간을 확보해요.", "75분", 35],
      ["🌉", "돌산대교 전망", "노을 전 해안 드라이브·산책을 즐겨요.", "75분", 25],
      ["🍽", "전남 로컬 저녁", "숙소 권역에서 편안하게 마무리해요.", "90분", 15],
    ],
    departure: ["🛍", "여수수산시장", "귀가 전 해산물 간식과 선물을 둘러봐요.", "65분", 30],
  },
  "경상북도": {
    focus: "경북 역사",
    arrival: ["🏯", "불국사", "고즈넉한 사찰 풍경으로 첫날을 시작해요.", "90분", 25],
    dinner: ["🍽", "황리단길 저녁", "숙소와 가까운 경주 중심 상권에서 마무리해요.", "90분", 15],
    dayTwo: [
      ["🏛", "대릉원", "오전 산책으로 신라 문화권을 천천히 둘러봐요.", "80분", 20],
      ["🏯", "첨성대", "도보로 이어지는 대표 유적 동선이에요.", "65분", 20],
      ["🍜", "황리단길 점심", "오후 이동 전 지역 식사를 즐겨요.", "75분", 25],
      ["🌊", "동궁과 월지", "해질 무렵 야경이 아름다운 역사 명소예요.", "80분", 25],
      ["🍽", "경주 로컬 저녁", "숙소 복귀 동선을 고려한 저녁이에요.", "90분", 15],
    ],
    departure: ["🛍", "경주중앙시장", "귀가 전 지역 먹거리와 선물을 둘러봐요.", "65분", 30],
  },
  "경상남도": {
    focus: "경남 항구·자연",
    arrival: ["🌊", "동피랑 벽화마을", "항구를 내려다보는 골목에서 첫날을 시작해요.", "80분", 20],
    dinner: ["🍽", "통영 중앙시장 저녁", "해산물과 지역 음식을 즐기며 마무리해요.", "90분", 15],
    dayTwo: [
      ["🌊", "미륵산 케이블카", "오전 바다와 섬 풍경을 감상하는 코스예요.", "100분", 35],
      ["🏛", "통영 강구안", "항구 풍경과 문화공간을 둘러봐요.", "75분", 20],
      ["🍜", "통영 로컬 점심", "시장 인근에서 지역 메뉴를 즐겨요.", "75분", 30],
      ["🌿", "이순신공원", "바다 전망 산책으로 오후 여유를 가져요.", "85분", 25],
      ["🍽", "경남 로컬 저녁", "숙소와 가까운 권역에서 마무리해요.", "90분", 15],
    ],
    departure: ["🛍", "통영중앙시장", "귀가 전 지역 특산품을 살펴봐요.", "65분", 30],
  },
  default: {
    focus: "선택한 여행지",
    arrival: ["📍", "지역 대표 명소", "도착 후 선택한 여행지의 중심 명소부터 시작해요.", "80분", 25],
    dinner: ["🍽", "지역 로컬 저녁", "숙소와 가까운 식당에서 첫날을 마무리해요.", "90분", 15],
    dayTwo: [
      ["🌿", "지역 자연 명소", "여행지의 대표 자연 경관을 여유롭게 즐겨요.", "90분", 30],
      ["🏛", "지역 문화 명소", "문화·역사 공간을 한 동선으로 묶었어요.", "85분", 25],
      ["🍜", "지역 로컬 점심", "오후 일정 전 가까운 곳에서 식사해요.", "70분", 35],
      ["☕", "지역 카페 거리", "취향에 맞춘 휴식 시간을 확보해요.", "75분", 25],
      ["🍽", "지역 특색 저녁", "숙소 복귀가 편한 곳에서 마무리해요.", "90분", 15],
    ],
    departure: ["🛍", "지역 전통시장", "귀가 전 지역 먹거리와 기념품을 둘러봐요.", "65분", 30],
  },
};

export const locationLabel = (location, fallback = "선택한 여행지") =>
  location?.detail || location?.name || location?.region || fallback;

export const profileForLocation = (destinationLocation) => {
  const region = destinationLocation?.region || destinationLocation?.name;
  const detail = destinationLocation?.detail || "";
  if (region === "경기도" && detail.includes("파주")) {
    return {
      ...regionalTripProfiles["경기도"],
      focus: "파주 평화·예술",
      arrival: ["🕊", "임진각 평화누리", "파주의 대표 평화 문화 공간에서 여행을 시작해요.", "85분", 25],
      dinner: ["🍽", "헤이리 로컬 저녁", "예술마을 인근에서 이동을 줄여 마무리해요.", "90분", 15],
      dayTwo: [
        ["🏛", "헤이리 예술마을", "전시·서점·카페를 취향에 맞춰 즐겨요.", "100분", 25],
        ["🌳", "마장호수 출렁다리", "호수 전망 산책을 충분히 즐기는 자연 코스예요.", "90분", 35],
        ["🍜", "파주 로컬 점심", "오후 이동 전 가까운 권역에서 식사해요.", "70분", 30],
        ["☕", "출판도시 카페", "책과 건축을 함께 즐기는 휴식 시간이에요.", "75분", 20],
        ["🍽", "파주 로컬 저녁", "숙소 복귀가 편한 동선으로 마무리해요.", "90분", 15],
      ],
      departure: ["🛍", "파주 프리미엄 아울렛", "귀가 전 쇼핑·휴식 시간을 선택할 수 있어요.", "65분", 30],
    };
  }
  if (region === "경기도" && detail.includes("수원")) {
    return {
      ...regionalTripProfiles["경기도"],
      focus: "수원 역사·도심",
      arrival: ["🏯", "수원화성", "성곽 산책으로 수원의 첫 풍경을 만나봐요.", "85분", 20],
      dinner: ["🍽", "행궁동 저녁", "행리단길 인근에서 첫날을 마무리해요.", "90분", 15],
      dayTwo: [
        ["🏛", "화성행궁", "오전 관람으로 역사 동선을 여유 있게 시작해요.", "90분", 20],
        ["☕", "행궁동 카페 거리", "골목 카페와 편집숍을 함께 즐겨요.", "80분", 20],
        ["🍜", "수원 로컬 점심", "오후 이동 전 지역 메뉴를 즐겨요.", "70분", 25],
        ["🌿", "광교호수공원", "호수 산책으로 휴식 시간을 확보해요.", "85분", 25],
        ["🍽", "수원 갈비 저녁", "숙소 복귀 동선을 고려한 대표 메뉴 저녁이에요.", "90분", 15],
      ],
      departure: ["🛍", "팔달문시장", "귀가 전 지역 먹거리와 선물을 둘러봐요.", "65분", 25],
    };
  }
  return regionalTripProfiles[region] || regionalTripProfiles.default;
};

export const makeRegionalDayPlans = (
  arrivalTime,
  endTime,
  stay,
  flight,
  destinationLocation,
  originLocation,
  transport,
  dayCount = 3,
) => {
  const profile = profileForLocation(destinationLocation);
  const destination = locationLabel(destinationLocation);
  const origin = locationLabel(originLocation, "출발지");
  const arrivalAt = timeToMinutes(arrivalTime || "10:00");
  const arrivalTransport = transportName(transport, outboundOptions) || (flight ? "항공" : "선택한 교통수단");
  const flightCode = flight?.code?.split("·")[0]?.trim();
  const arrivalName = flight
    ? `${destination} 도착 · ${flight.airline || flight.name || arrivalTransport}${flightCode ? ` ${flightCode}` : ""}`
    : `${destination} 도착`;
  const arrivalDetail = flight
    ? `${origin}에서 출발한 ${flight.out || "선택 티켓"}의 도착 시간을 반영했어요.`
    : `${origin}에서 ${arrivalTransport}으로 이동한 뒤, 선택한 지역의 실제 이동 시간을 반영해 여행을 시작해요.`;
  const arrivalRows = [scheduleEvent(transport === "CAR" ? "🚗" : transport === "KTX" ? "🚆" : transport === "BUS" ? "🚌" : "✈", arrivalName, arrivalDetail, "30분", 25)];
  if (stay) {
    arrivalRows.push(
      scheduleEvent(
        stay?.area ? "🚗" : "🧭",
        stay?.area ? "현지 이동 · 체크인 준비" : "숙소 권역 이동 준비",
        "교통수단·숙소 위치를 기준으로 첫 이동 시간을 연결해요.",
        "35분",
        30,
      ),
    );
  }
  if (arrivalAt <= 15 * 60 + 30) {
    arrivalRows.push(
      scheduleEvent(profile.arrival[0], profile.arrival[1], profile.arrival[2], profile.arrival[3], profile.arrival[4]),
    );
  }
  if (stay) {
    arrivalRows.push(
      scheduleEvent(
        "⌂",
        `${stay.name} 체크인`,
        `${stay.area || destination} 숙소를 기준으로 짐을 풀고 잠시 쉬어가요.`,
        "55분",
        15,
      ),
    );
  }
  arrivalRows.push(
    scheduleEvent(profile.dinner[0], profile.dinner[1], profile.dinner[2], profile.dinner[3], profile.dinner[4]),
  );

  const departureMinutes = timeToMinutes(endTime || "18:00");
  const earlyReturn = departureMinutes <= 13 * 60;
  const departureRows = earlyReturn
    ? [
        scheduleEvent("⌂", "체크아웃 · 짐 정리", "도착·귀가 시간이 이른 편이라 짐과 이동 준비를 먼저 마쳐요.", "35분", 25),
        scheduleEvent("🧭", "마지막 이동 · 출발지 이동", `${destination}에서 출발지로 돌아가기 위한 이동 시간을 반영했어요.`, "65분", 0),
      ]
    : [
        scheduleEvent("⌂", "체크아웃 · 짐 정리", "숙소에서 짐을 정리한 뒤 마지막 동선을 시작해요.", "35분", 20),
        scheduleEvent(profile.departure[0], profile.departure[1], profile.departure[2], profile.departure[3], profile.departure[4]),
        scheduleEvent("🍜", "출발 전 로컬 점심", "터미널·역·공항 이동 전 여유 있게 식사 시간을 확보해요.", "65분", 40),
        scheduleEvent("🧭", "출발지 이동 준비", `${origin}으로 돌아가는 ${arrivalTransport} 탑승·환승 시간을 반영했어요.`, "50분", 0),
      ];
  const departureStart = earlyReturn
    ? Math.max(7 * 60 + 30, departureMinutes - 190)
    : Math.max(8 * 60 + 30, departureMinutes - 420);

  const firstDay = makeSequentialPlan(
      `${destination}에 도착한 첫날`,
      `${origin}에서 출발한 ${arrivalTransport} 일정과 ${destination} 권역의 첫 이동을 연결했어요.`,
      minutesToTime(arrivalAt),
      arrivalRows,
    );
  const middleDays = Array.from({ length: Math.max(0, dayCount - 2) }, (_, index) =>
    makeSequentialPlan(
      `${profile.focus} 중심의 ${index + 2}일차`,
      "선택한 여행지의 대표 명소를 되돌아가지 않도록 같은 권역으로 묶었어요.",
      "09:00",
      [
        scheduleEvent("🥐", "숙소 조식 · 출발 준비", "숙소 위치와 다음 관광지의 이동 시간을 고려해 여유 있게 시작해요.", "60분", 20),
        ...profile.dayTwo.map(([icon, name, detail, duration, travel]) => scheduleEvent(icon, name, detail, duration, travel)),
      ],
    ),
  );
  const lastDay = makeSequentialPlan(
      `${destination}을 담아 돌아가는 날`,
      `${arrivalTransport} 출발 시각 전 이동·탑승 준비 시간을 반영해 마지막 동선을 설계했어요.`,
      minutesToTime(departureStart),
      departureRows,
    );
  return dayCount <= 1 ? [firstDay] : [firstDay, ...middleDays, lastDay];
};

export const makeDayPlans = (
  arrivalTime,
  endTime,
  stay,
  flight,
  destinationLocation,
  originLocation,
  transport,
  dayCount = 3,
) => {
  const ticketMode = ["FLIGHT", "KTX", "BUS"].includes(transport) || (!transport && Boolean(flight));
  const outbound = ticketMode ? parseTicketLeg(flight?.out) : null;
  const inbound = ticketMode ? parseTicketLeg(flight?.back) : null;
  const safeArrival = outbound?.arrival || safeTime(arrivalTime, "10:00");
  const safeEnd = inbound?.departure || safeTime(endTime, "18:00");
  const count = Number.isFinite(dayCount) ? Math.max(1, Math.min(60, Math.floor(dayCount))) : 3;
  const activeTicket = ticketMode && outbound && inbound ? flight : null;
  if (count === 1 && timeToMinutes(safeEnd) <= timeToMinutes(safeArrival)) return [];
  const isJejuDestination =
    destinationLocation?.regionCode === "KR-49" ||
    /제주/.test(`${destinationLocation?.region || ""} ${destinationLocation?.detail || ""}`);
  const plans = (isJejuDestination || !destinationLocation) && (!transport || transport === "FLIGHT")
    ? makeJejuDayPlans(safeArrival, safeEnd, stay, activeTicket, count)
    : makeRegionalDayPlans(
    safeArrival,
    safeEnd,
    stay,
    activeTicket,
    destinationLocation,
    originLocation,
    transport,
    count,
  );
  return decoratePlanEvents(constrainPlanTimes(plans, safeArrival, safeEnd, transport));
};

const lockedStopPattern = /항공|공항 도착|오는 편 출발|역·터미널|귀가 출발|렌터카|체크인|체크아웃|탑승 준비/;
const bookableStopPattern = /항공|오는 편|렌터카|체크인|숙소|뮤지엄|케이블카|아쿠아|테마파크/;
const knownPlanCoordinates = [
  ["제주국제공항", 33.5104, 126.4914],
  ["한담해안산책로", 33.4626, 126.3108],
  ["애월 카페 거리", 33.4635, 126.3094],
  ["곽지해수욕장", 33.4507, 126.3055],
  ["협재해수욕장", 33.3942, 126.2398],
  ["금능해변", 33.3904, 126.2359],
  ["새별오름", 33.3663, 126.3578],
  ["오설록", 33.3059, 126.2895],
  ["카멜리아힐", 33.2897, 126.3701],
  ["숙성도 중문점", 33.2516, 126.4168],
  ["숙성도", 33.4850, 126.4817],
  ["고이정", 33.4611, 126.3111],
  ["성안식당", 33.4630, 126.3100],
  ["애월은혜전복", 33.4487, 126.3065],
  ["애월돈가스집", 33.4641, 126.3090],
  ["제주김만복 애월점", 33.4720, 126.3500],
  ["이춘옥 원조고등어쌈밥", 33.4838, 126.3774],
  ["자매국수", 33.5167, 126.5142],
  ["스시 호시카이", 33.4918, 126.4787],
];
const coordinatesForPlanName = (name = "") => {
  const match = knownPlanCoordinates.find(([keyword]) => name.includes(keyword));
  return match ? { latitude: match[1], longitude: match[2] } : {};
};

export const decoratePlanEvents = (plans = []) => plans.map((day, dayIndex) => [
  day[0],
  day[1],
  day[2].map((event, stopIndex) => {
    const name = event[2] || "일정";
    const coordinates = coordinatesForPlanName(name);
    return [
      ...event.slice(0, 6),
      {
        ...(event[6] || {}),
        latitude: event[6]?.latitude ?? coordinates.latitude,
        longitude: event[6]?.longitude ?? coordinates.longitude,
        id: event[6]?.id || `day-${dayIndex + 1}-stop-${stopIndex + 1}`,
        isLocked: event[6]?.isLocked ?? lockedStopPattern.test(name),
        bookingUrl: event[6]?.bookingUrl || (bookableStopPattern.test(name) ? `pending:${encodeURIComponent(name)}` : null),
      },
    ];
  }),
]);

const jejuRestaurantsByCuisine = {
  KOREAN: ["숙성도 중문점", "자매국수", "이춘옥 원조고등어쌈밥"],
  JAPANESE: ["스시 호시카이", "제주 해녀의집 회국수", "모리노아루요"],
  CHINESE: ["도두반점 제주사수점", "아서원", "신해바라기분식 짬뽕"],
  WESTERN: ["글라글라하와이", "르토아 베이스먼트", "제주 키친오즈"],
  ASIAN: ["반미하노이 제주", "타이웍 제주", "제주 아시안키친"],
  CASUAL: ["오는정김밥", "명랑스낵", "제주김만복 애월점"],
  CAFE: ["카페 델문도", "원앤온리", "우무 제주점"],
  VEGETARIAN: ["앤드유 카페", "제주 비건 테이블", "제주 샐러드랩"],
};

export const applyFoodPreferences = (plans = [], preferences = [], destinationLocation) => {
  if (!preferences.length) return plans;
  const preferenceLabels = new Map(foodPreferenceOptions.map((item) => [item.code, item.label]));
  let restaurantIndex = 0;
  return plans.map((day) => [
    day[0],
    day[1],
    (day[2] || []).map((event) => {
      const [time, icon, name, detail, duration, travel, metadata = {}] = event;
      const isDiningStop = /🍽|🍚|🍜|🍲|☕/.test(icon || "") || /점심|저녁|식사|카페|간식/.test(name || "");
      if (!isDiningStop || /조식|숙소/.test(name || "")) return event;
      const preference = preferences[restaurantIndex % preferences.length];
      const candidates = jejuRestaurantsByCuisine[preference] || [];
      const replacement = candidates[Math.floor(restaurantIndex / preferences.length) % Math.max(1, candidates.length)];
      restaurantIndex += 1;
      if (!replacement || destinationLocation?.regionCode !== "KR-49") return event;
      return [
        time,
        icon,
        replacement,
        `${preferenceLabels.get(preference) || "음식"} 선호도와 현재 여행 동선을 반영해 추천한 식당이에요. ${detail || ""}`.trim(),
        duration,
        travel,
        {
          ...metadata,
          cuisineCode: preference,
          originalRecommendation: name,
          apiSearchKeyword: `${replacement} 제주`,
          isGeographical: true,
        },
      ];
    }),
  ]);
};

// A ticket deadline is a hard boundary: never wrap late activities to the next morning.
export const constrainPlanTimes = (plans, arrivalTime, endTime, mode) => {
  const deadline = timeToMinutes(safeTime(endTime, "18:00"));
  const buffer = mode === "FLIGHT" ? 90 : ["KTX", "BUS"].includes(mode) ? 30 : 0;
  return plans.map((day, index) => {
    const isLast = index === plans.length - 1;
    const start = index === 0 ? timeToMinutes(safeTime(arrivalTime, "10:00")) : 0;
    const cutoff = isLast ? Math.max(start, deadline - buffer) : 1439;
    let previous = start;
    const events = day[2].filter((event) => {
      const minute = timeToMinutes(event[0]);
      const finish = minute + durationToMinutes(event[4]) + (Number(event[5]) || 0);
      if (minute < previous || finish > cutoff) return false;
      previous = finish;
      return true;
    });
    if (isLast) {
      if (buffer) events.push([minutesToTime(Math.max(start, deadline - buffer)), "🎫", mode === "FLIGHT" ? "공항 도착 · 탑승 준비" : "역·터미널 도착 · 탑승 준비", "선택한 오는 편의 출발 시각에 맞춰 탑승을 준비해요.", `${buffer}분`, 0]);
      events.push([minutesToTime(deadline), mode === "CAR" ? "🚗" : "🎫", mode === "CAR" ? "귀가 출발" : "오는 편 출발", mode === "CAR" ? "설정한 귀가 도착 시각에 맞춰 출발해요." : "선택한 왕복 티켓의 출발 시각입니다.", "0분", 0]);
    }
    return [day[0], day[1], events];
  });
};

export const regionalPlaceAlternatives = {
  "제주특별자치도": [
    { icon: "🌊", name: "곽지해수욕장", latitude: 33.4507, longitude: 126.3055, detail: "한담과 이어지는 애월 대표 해변에서 산책과 물빛을 즐겨요.", duration: "80분", image: "https://api.cdn.visitjeju.net/photomng/imgpath/202110/25/daaa3e6e-822b-4acc-98df-8ba8e8453dd7.webp" },
    { icon: "🌊", name: "협재해수욕장", latitude: 33.3942, longitude: 126.2398, detail: "비양도가 보이는 제주 서부 대표 해변을 둘러봐요.", duration: "85분", image: "https://api.cdn.visitjeju.net/photomng/imgpath/202408/27/77cf6bb2-4d0d-4f46-8cfa-3f527a4d06b3.webp" },
    { icon: "🌊", name: "금능해변", latitude: 33.3904, longitude: 126.2359, detail: "협재 옆 한적한 해변에서 여유로운 시간을 보내요.", duration: "75분", image: "https://api.cdn.visitjeju.net/photomng/imgpath/202110/25/f633561a-01c8-4e4a-a826-dd704e8bb5d9.webp" },
    { icon: "📸", name: "새별오름", latitude: 33.3663, longitude: 126.3578, detail: "애월 중산간의 억새와 탁 트인 전망을 감상해요.", duration: "95분", image: "https://api.cdn.visitjeju.net/photomng/imgpath/202410/21/dd078476-3958-40e8-ab31-c3599ef97bcc.webp" },
    { icon: "🌿", name: "오설록 티 뮤지엄", latitude: 33.3059, longitude: 126.2895, detail: "서부 녹차밭과 전시 공간을 함께 둘러봐요.", duration: "90분", image: "https://api.cdn.visitjeju.net/photomng/imgpath/202110/20/003f420c-6efe-41e9-93b7-00fe6ac5e83b.webp" },
    { icon: "🌺", name: "카멜리아힐", latitude: 33.2897, longitude: 126.3701, detail: "계절 꽃과 정원 산책을 중심으로 일정을 구성해요.", duration: "95분", image: "https://api.cdn.visitjeju.net/photomng/imgpath/202410/15/fb2d2739-5e8e-4a87-9d1d-0281d95efeb7.webp" },
    { icon: "📸", name: "성산일출봉", latitude: 33.4613627, longitude: 126.9349424, detail: "동부 대표 명소를 중심으로 이동 동선을 다시 계산해요.", duration: "100분", image: "https://api.cdn.visitjeju.net/photomng/imgpath/202409/20/c8bf6191-832c-4605-a948-96f07f6112d2.webp" },
    { icon: "🛍", name: "동문시장", latitude: 33.5116, longitude: 126.5260, detail: "제주 원도심의 시장 먹거리와 기념품을 함께 둘러봐요.", duration: "80분", image: "https://api.cdn.visitjeju.net/photomng/imgpath/202410/16/bdf6c336-fde3-4312-92be-7db8f3a37fbc.webp" },
    { icon: "🌊", name: "함덕해수욕장", latitude: 33.5431, longitude: 126.6692, detail: "맑고 얕은 바다와 서우봉 산책을 한 동선으로 즐겨요.", duration: "90분", image: "https://api.cdn.visitjeju.net/photomng/imgpath/202408/20/a397a498-7bc9-4730-963a-cfa29ccffe7d.webp" },
    { icon: "🌅", name: "한담해안산책로", latitude: 33.4626, longitude: 126.3108, detail: "현무암 해안과 애월 바다를 따라 여유롭게 걸어요.", duration: "70분", image: "https://api.cdn.visitjeju.net/photomng/imgpath/202110/28/6a66021a-e571-4ebb-8ddd-2f42ceb46c9c.webp" },
    { icon: "🌅", name: "애월 카페 거리", latitude: 33.4635, longitude: 126.3094, detail: "오션뷰 카페와 한담 해안을 이어 휴식 중심의 동선을 만들어요.", duration: "80분", image: "https://api.cdn.visitjeju.net/photomng/imgpath/202409/25/4b1eef78-9b25-41c1-8839-30cc8796a7de.webp", category: "sight" },
    { icon: "⛰", name: "산방산·용머리 해안", latitude: 33.2316, longitude: 126.3148, detail: "산방산과 독특한 해안 지질 경관을 함께 둘러봐요.", duration: "105분", image: "https://api.cdn.visitjeju.net/photomng/imgpath/202409/25/88cd0d87-306d-46e1-9b97-956fdf893f88.webp" },
    { icon: "💧", name: "천제연폭포", latitude: 33.2528, longitude: 126.4173, detail: "중문의 폭포와 난대림 산책로를 따라 걸어요.", duration: "90분", image: "https://api.cdn.visitjeju.net/photomng/imgpath/202110/27/617daa5f-d818-47c1-b80d-59f45e96371b.webp" },
    { icon: "🏖", name: "중문색달해수욕장", latitude: 33.2450, longitude: 126.4115, detail: "해안 절벽과 힘찬 파도가 어우러진 중문 해변을 감상해요.", duration: "80분", image: "https://api.cdn.visitjeju.net/photomng/imgpath/202407/24/a524251a-1057-43b5-b744-217f7f3ea78f.webp" },
    { icon: "🪨", name: "주상절리대", latitude: 33.2379, longitude: 126.4260, detail: "용암이 만든 돌기둥과 중문 바다 전망을 둘러봐요.", duration: "70분", image: "https://api.cdn.visitjeju.net/photomng/imgpath/202410/21/1690de57-e791-4712-84e9-3963a82de0f1.webp" },
    { icon: "🍖", name: "고이정 애월", latitude: 33.4611, longitude: 126.3111, detail: "한담 산책로와 가까운 흑돼지 전문점이에요.", duration: "85분", representativeMenu: "보리짚불 흑돼지 근고기", image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=86" },
    { icon: "🍲", name: "성안식당", latitude: 33.4630, longitude: 126.3100, detail: "애월의 오래된 향토음식점에서 따뜻한 해물 한 끼를 즐겨요.", duration: "70분", representativeMenu: "전복뚝배기·갈치국", image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=86" },
    { icon: "🍚", name: "애월은혜전복", latitude: 33.4487, longitude: 126.3065, detail: "애월 해안과 가까운 전복 요리 전문점이에요.", duration: "70분", representativeMenu: "전복돌솥밥·전복물회", image: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=86" },
    { icon: "🍽", name: "애월돈가스집", latitude: 33.4641, longitude: 126.3090, detail: "제주산 흑돼지로 만든 든든한 돈가스를 맛봐요.", duration: "70분", representativeMenu: "흑돼지 왕돈가스", image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=86" },
    { icon: "🍱", name: "제주김만복 애월점", latitude: 33.4720, longitude: 126.3500, detail: "이동 중 가볍게 즐기기 좋은 제주식 김밥을 추천해요.", duration: "55분", representativeMenu: "전복김밥·오징어무침", image: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=900&q=86" },
    { icon: "🍜", name: "이춘옥 원조고등어쌈밥", latitude: 33.4838, longitude: 126.3774, detail: "애월 해안도로에서 즐기는 제주식 고등어 한 상이에요.", duration: "75분", representativeMenu: "고등어쌈밥·고등어조림", image: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=86" },
    { icon: "🍚", name: "꽃밥", latitude: 33.4515541, longitude: 126.3085195, detail: "제주 식재료를 담은 정갈한 한식 한 상을 즐겨요.", duration: "70분", representativeMenu: "꽃밥정식·삼색들깨수제비", image: "https://api.cdn.visitjeju.net/photomng/imgpath/202305/19/3aa4cf3f-d1a8-4f65-b515-75fd764a2c93.webp" },
    { icon: "🥩", name: "애월회관", latitude: 33.4668, longitude: 126.3209, detail: "애월 해안권에서 제주 흑돼지를 즐기는 저녁 동선이에요.", duration: "80분", representativeMenu: "흑오겹살·흑목살", image: "https://api.cdn.visitjeju.net/photomng/imgpath/202511/18/242c4d62-e6cc-4d71-935e-e668f2bee0dd.webp" },
    { icon: "🍜", name: "언덕집국수", latitude: 33.4567, longitude: 126.3098, detail: "애월 인근에서 제주식 국수로 가볍게 한 끼를 해결해요.", duration: "60분", representativeMenu: "고기국수·비빔국수", image: "https://cdn.visitkorea.or.kr/img/call?cmd=VIEW&id=251421ff-3e04-451d-926a-703bc635bc13" },
    { icon: "🥩", name: "바다풍경정육식당", latitude: 33.4620, longitude: 126.3118, detail: "바다 가까이에서 제주 흑돼지를 합리적인 구성으로 즐겨요.", duration: "80분", representativeMenu: "흑돼지 오겹살·목살", image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=86" },
    { icon: "☕", name: "클린 제주", latitude: 33.4652, longitude: 126.3106, detail: "애월 바다를 보며 음료와 디저트로 쉬어가는 카페예요.", duration: "60분", representativeMenu: "시그니처 음료·디저트", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=86" },
    { icon: "🥩", name: "작산 애월 흑돼지", latitude: 33.4701, longitude: 126.3228, detail: "숙성 흑돼지와 제주식 곁들임을 함께 맛봐요.", duration: "85분", representativeMenu: "숙성 흑돼지·김치찌개", image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=86" },
    { icon: "🥩", name: "마초스테이크 제주직영점", latitude: 33.4509, longitude: 126.3063, detail: "곽지 해안 동선에서 스테이크 중심의 식사를 즐겨요.", duration: "80분", representativeMenu: "립아이 스테이크", image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=900&q=86" },
    { icon: "🍽", name: "블루그라스", latitude: 33.4597, longitude: 126.3122, detail: "애월의 캐주얼 다이닝에서 다양한 메뉴를 함께 즐겨요.", duration: "75분", representativeMenu: "토리 세트·브런치", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=86" },
  ],
  "서울특별시": [
    { icon: "🏯", name: "북촌한옥마을", detail: "궁궐과 가까운 전통 골목으로 동선을 다시 계산해요.", duration: "80분", travel: 25 },
    { icon: "🌳", name: "서울숲", detail: "성수권 자연 산책을 넣어 휴식 시간을 조정해요.", duration: "85분", travel: 30 },
    { icon: "🌇", name: "남산서울타워", detail: "도심 전망 코스로 바꾸고 이동·입장 시간을 반영해요.", duration: "95분", travel: 35 },
    { icon: "🛍", name: "광장시장", detail: "시장 먹거리와 간식 비용을 포함해 다시 설계해요.", duration: "75분", travel: 25 },
  ],
  "부산광역시": [
    { icon: "🌊", name: "해운대해수욕장", detail: "해안 산책을 넣어 부산 동선을 조정해요.", duration: "85분", travel: 25 },
    { icon: "🏘", name: "감천문화마을", detail: "골목 관광과 이동 시간을 함께 반영해요.", duration: "95분", travel: 40 },
    { icon: "🌉", name: "광안리 해변", detail: "야경·해변 산책 중심으로 오후 동선을 바꿔요.", duration: "80분", travel: 30 },
    { icon: "🛍", name: "국제시장", detail: "시장 방문과 간식 예산을 반영해요.", duration: "75분", travel: 25 },
  ],
  "경기도": [
    { icon: "🕊", name: "임진각 평화누리", detail: "파주 평화 문화권으로 이동 시간을 다시 계산해요.", duration: "85분", travel: 35 },
    { icon: "🏛", name: "헤이리 예술마을", detail: "전시·카페 중심으로 오후 동선을 조정해요.", duration: "95분", travel: 30 },
    { icon: "🌳", name: "마장호수 출렁다리", detail: "호수 산책을 넣어 자연 체험 시간을 반영해요.", duration: "90분", travel: 45 },
    { icon: "🏯", name: "수원화성", detail: "수원 역사 동선과 입장·이동 시간을 다시 계산해요.", duration: "90분", travel: 35 },
  ],
  default: [
    { icon: "📍", name: "지역 대표 관광지", detail: "한국관광공사 기반 대표 관광지 후보로 동선을 다시 계산해요.", duration: "90분", travel: 35 },
    { icon: "🌿", name: "지역 자연 명소", detail: "자연·휴식 취향을 반영해 이동 시간을 조정해요.", duration: "85분", travel: 30 },
    { icon: "🏛", name: "지역 문화 명소", detail: "전시·역사 공간을 포함해 일정과 경비를 재계산해요.", duration: "90분", travel: 30 },
    { icon: "🛍", name: "지역 전통시장", detail: "시장 식사·간식·선물 예산을 포함해 반영해요.", duration: "75분", travel: 25 },
  ],
};

const foodIcons = /🍽|🍜|🥐|☕|🍴|🍲|🥘|🍱|🍣|🍖|🍗|🥩|🍛|🍚/;
const placeCategory = (item) => foodIcons.test(item?.icon || item?.[1] || "") ? "food" : "sight";

const recommendationTemplates = {
  food: [
    ["🍽", "로컬 식당", "현지 대표 메뉴를 맛보는 식사 동선으로 바꿔요.", "70분"],
    ["🍜", "향토 음식점", "지역 향토 메뉴와 대기 시간을 일정에 반영해요.", "65분"],
    ["🍱", "전통시장 맛집", "시장 먹거리와 간식 예산을 함께 계산해요.", "75분"],
    ["☕", "로컬 카페", "이동 중 쉬어가기 좋은 카페 시간을 넣어요.", "60분"],
    ["🍲", "현지인 추천 식당", "숙소와 가까운 식당 중심으로 동선을 줄여요.", "70분"],
    ["🍽", "제철 음식점", "여행 시기의 제철 메뉴를 반영해요.", "70분"],
  ],
  sight: [
    ["📸", "대표 관광지", "지역 대표 명소 중심으로 관람 동선을 다시 계산해요.", "90분"],
    ["🌿", "자연 명소", "산책과 휴식 시간을 포함해 일정을 조정해요.", "85분"],
    ["🏛", "문화 명소", "전시·역사 공간의 관람 시간을 반영해요.", "90분"],
    ["🌊", "풍경 명소", "전망과 사진 촬영 시간을 일정에 넣어요.", "80분"],
    ["🛍", "전통시장", "시장 구경과 이동 시간을 함께 반영해요.", "75분"],
    ["🎨", "체험 공간", "현지 체험과 예약 소요 시간을 반영해요.", "90분"],
  ],
};

export const getPlaceAlternatives = (destinationLocation, currentItem) => {
  const region = destinationLocation?.region || destinationLocation?.name;
  const area = destinationLocation?.detail || destinationLocation?.name || region || "여행지";
  const category = placeCategory(currentItem);
  const reference = Number.isFinite(currentItem?.latitude) && Number.isFinite(currentItem?.longitude)
    ? currentItem
    : destinationLocation;
  const normalizePlaceName = (value) => String(value || "").replace(/제주특별자치도|제주도|제주시|서귀포시|\s|·/g, "");
  const currentName = currentItem?.name || currentItem?.[2] || "";
  const normalizedCurrentName = normalizePlaceName(currentName);
  const preferenceText = [
    ...(Array.isArray(destinationLocation?.tags) ? destinationLocation.tags : []),
    currentItem?.detail,
    currentItem?.category,
    currentItem?.type,
  ].filter(Boolean).join(" ");
  const preferenceKeywords = ["바다", "해변", "자연", "산책", "카페", "맛집", "시장", "문화", "체험", "오름", "정원"]
    .filter(keyword => preferenceText.includes(keyword));
  const localCandidates = (regionalPlaceAlternatives[region] || regionalPlaceAlternatives.default)
    .filter((place) => placeCategory(place) === category)
    .filter((place) => {
      const candidateName = normalizePlaceName(place.name);
      return candidateName !== normalizedCurrentName &&
        !candidateName.includes(normalizedCurrentName) &&
        !normalizedCurrentName.includes(candidateName);
    })
    .map((place) => {
      const straightDistance = exactDistanceKm(reference, place);
      const distanceKm = straightDistance == null ? null : Math.max(.8, Math.round(straightDistance * 1.24 * 10) / 10);
      const travel = distanceKm == null ? 30 : Math.max(5, Math.round((distanceKm / 34 * 60 + 4) / 5) * 5);
      const candidateText = `${place.name} ${place.detail || ""}`;
      const preferenceMatches = preferenceKeywords.filter(keyword => candidateText.includes(keyword)).length;
      const proximityScore = distanceKm == null ? 30 : Math.max(0, 100 - distanceKm * 2.2);
      const deterministicVariety = [...`${currentName}:${place.name}`].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 13;
      const recommendationScore = Math.round(Math.min(99, proximityScore * .72 + preferenceMatches * 10 + deterministicVariety));
      return {
        ...place,
        distanceKm,
        travel,
        recommendationScore,
        routeSource: `거리·취향 적합도 ${recommendationScore}점 · 좌표 기반 예상`,
      };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore || (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY));
  const generatedCandidates = recommendationTemplates[category].map(([icon, suffix, detail, duration], index) => ({
    icon,
    name: `${area} ${suffix}`,
    detail,
    duration,
    travel: 20 + index * 5,
    distanceKm: null,
    routeSource: "백엔드 검색 대기",
    category,
  }));
  return [...localCandidates, ...generatedCandidates]
    .filter((place, index, list) => normalizePlaceName(place.name) !== normalizedCurrentName && list.findIndex((item) => item.name === place.name) === index)
    .slice(0, 9);
};

export const stayChangeSummaryFor = (change) => {
  const isJungmun = change?.to?.area === "중문·서귀포";
  if (isJungmun)
    return [
      {
        category: "숙소",
        title: "베이스캠프",
        before: change.from.name,
        after: change.to.name,
        note: "한림·협재 권역에서 중문·서귀포 권역으로 숙소 중심을 옮겼어요.",
      },
      {
        category: "식당",
        title: "식사 동선",
        before: "한림 로컬 점심 · 한림 흑돼지",
        after: "중문 로컬 점심 · 중문 흑돼지",
        note: "숙소와 가까운 식당으로 바꿔 저녁 이동과 대기 시간을 줄였어요.",
      },
      {
        category: "볼거리",
        title: "핵심 관광지",
        before: "협재해수욕장 · 한림공원 · 금능해변",
        after: "천제연폭포 · 주상절리대 · 중문색달해수욕장",
        note: "서쪽 해변 위주에서 중문 해안·폭포 중심 일정으로 새로 구성했어요.",
      },
      {
        category: "체험·휴식",
        title: "오후 프로그램",
        before: "오설록 티 뮤지엄 · 새별오름",
        after: "카멜리아힐 · 산방산·용머리 해안",
        note: "숙소 이동을 줄이면서 정원 산책과 서귀포 해안 풍경을 추가했어요.",
      },
    ];
  return [
    {
      category: "숙소",
      title: "베이스캠프",
      before: change?.from?.name || "기존 숙소",
      after: change?.to?.name || "새 숙소",
      note: "새 숙소 권역을 중심으로 체크인·식사·관광 순서를 다시 정리했어요.",
    },
    {
      category: "식당",
      title: "식사 동선",
      before: "기존 숙소 인근 식당",
      after: "새 숙소 인근 식당",
      note: "숙소와 식사 장소 사이의 불필요한 왕복을 줄였어요.",
    },
    {
      category: "볼거리",
      title: "관광지 구성",
      before: "기존 권역 관광지",
      after: "새 권역 관광지",
      note: "새 숙소와 가까운 대표 관광지를 중심으로 다시 묶었어요.",
    },
    {
      category: "체험·휴식",
      title: "여유 시간",
      before: "기존 휴식 장소",
      after: "새 숙소 주변 휴식 장소",
      note: "이동 시간을 줄여 실제 머무는 시간을 더 확보했어요.",
    },
  ];
};
export const applyPlanEdits = (plans, edits) => {
  const safeEdits = edits && typeof edits === "object" ? edits : {};

  // 백엔드 TripPlan은 startAt/endAt이 이미 실제 routing 결과를 반영한다.
  // 수정사항이 하나도 없는데도 기존 함수가 모든 시각을 0분 이동 기준으로
  // 다시 계산하면서 TransportSegment와 화면 시간이 달라지는 문제가 있었다.
  if (Object.keys(safeEdits).length === 0) {
    return plans;
  }

  return plans.map((day, dayIndex) => {
    const events = Array.isArray(day?.[2]) ? day[2] : [];
    const hasBackendTimeline = events.some((event) => Boolean(event?.[6]?.startAt));

    // 실제 백엔드 일정은 장소 텍스트만 교체하고 시간은 그대로 유지한다.
    // 경로/시간 재계산은 backend revision API가 담당해야 하므로 프론트가
    // 임의의 15분/직선거리 추정으로 startAt을 덮어쓰지 않는다.
    if (hasBackendTimeline) {
      const rows = events.map((event, stopIndex) => {
        const replacement = safeEdits[`${dayIndex}-${stopIndex}`];
        if (!replacement) return event;

        return [
          event[0],
          replacement.icon ?? event[1],
          replacement.name ?? event[2],
          replacement.detail ?? event[3],
          replacement.duration ?? event[4],
          event[5],
          {
            ...(event[6] || {}),
            bookingUrl: replacement.bookingUrl ?? event[6]?.bookingUrl ?? null,
            latitude: replacement.latitude ?? event[6]?.latitude ?? null,
            longitude: replacement.longitude ?? event[6]?.longitude ?? null,
            type: replacement.type ?? event[6]?.type ?? null,
            placeId: replacement.placeId ?? event[6]?.placeId ?? null,
            replacement:
              replacement.placeId && replacement.type
                ? { type: replacement.type, placeId: Number(replacement.placeId) }
                : event[6]?.replacement ?? null,
            isGeographical: true,
          },
        ];
      });

      return [day[0], day[1], rows];
    }

    // mock 일정은 기존 방식대로 화면용 시간을 다시 계산한다.
    let cursor = timeToMinutes(events[0]?.[0] || "08:30");
    const rows = events.map((event, stopIndex) => {
      const replacement = safeEdits[`${dayIndex}-${stopIndex}`];
      const source = replacement
        ? [
            event[0],
            replacement.icon,
            replacement.name,
            replacement.detail,
            replacement.duration,
            replacement.travel,
            {
              ...(event[6] || {}),
              bookingUrl: replacement.bookingUrl ?? event[6]?.bookingUrl ?? null,
              latitude: replacement.latitude ?? null,
              longitude: replacement.longitude ?? null,
              isGeographical: true,
            },
          ]
        : event;
      const next = [minutesToTime(cursor), ...source.slice(1)];
      cursor += durationToMinutes(source[4]) + (source[5] ?? 15);
      return next;
    });

    return [day[0], day[1], rows];
  });
};
export const placeEntryCost = (name) => {
  if (/아르떼뮤지엄|케이블카|서울타워|과학관|수목원/.test(name)) return 20000;
  if (/카멜리아힐|한림공원|박물관|화성행궁|경기전|공산성|불국사/.test(name)) return 10000;
  if (/동문시장|국제시장|광장시장|서문시장|남부시장|전통시장|중앙시장/.test(name)) return 14000;
  if (/오설록|카페/.test(name)) return 10000;
  if (/성산일출봉|공원|해수욕장|해안|호수|산책|전망/.test(name)) return 5000;
  return 0;
};
export const eventPrice = (
  name,
  { selectedFlight, selectedRental, selectedStay, party, rooms, nights },
) => {
  // 항공·렌터카·숙소는 해당 비용이 처음 발생하는 지점에서 한 번만 보여 줍니다.
  // 이렇게 해야 일정 카드의 금액과 오른쪽 1인 예산의 합계가 달라지지 않습니다.
  if ((name.includes("도착 ·") || name.includes("공항 도착")) && selectedFlight)
    return selectedFlight.fare || 0;
  if (name.includes("렌터카 수령") || name.includes("현지 이동 ·"))
    return selectedRental ? selectedRental.price / party : 0;
  if (name.includes("렌터카 반납")) return selectedRental ? 52000 / party : 0;
  if (name.includes("체크인"))
    return selectedStay ? (selectedStay.price * nights * rooms) / party : 0;
  if (name.includes("숙소 조식")) return 0;
  // 네이버 지도에 공개된 대표 메뉴 가격을 참고한 데모용 1인 평균입니다.
  // 백엔드 견적이 연결되면 event.metadata.pricePerPerson 값이 이 값을 우선합니다.
  if (name.includes("숙성도")) return 35000;
  if (name.includes("스시 호시카이")) return 150000;
  if (name.includes("글라글라하와이")) return 32000;
  if (name.includes("자매국수")) return 12000;
  if (name.includes("제주 해녀의집") || name.includes("해녀의집 회국수")) return 18000;
  if (name.includes("고집돌우럭")) return 30000;
  if (name.includes("네거리식당")) return 16000;
  if (name.includes("오는정김밥")) return 7000;
  if (name.includes("명진전복")) return 18000;
  if (name.includes("이춘옥")) return 26000;
  if (name.includes("카페")) return 10000;
  if (name.includes("점심")) return 22000;
  if (name.includes("저녁")) return 30000;
  if (name.includes("한림 로컬 저녁") || name.includes("중문 로컬 저녁"))
    return 30000;
  if (name.includes("한림 로컬 점심") || name.includes("중문 로컬 점심"))
    return 20000;
  if (name.includes("흑돼지")) return 55000;
  if (name.includes("제주시 로컬 점심")) return 26000;
  if (name.includes("동문시장")) return 14000;
  if (name.includes("새별오름")) return 20000;
  return placeEntryCost(name);
};
export const getDates = (start, end) => {
  if (!start) return [];
  if (!end) return [start];
  const dates = [];
  const last = new Date(`${end}T00:00:00`);
  for (
    const day = new Date(`${start}T00:00:00`);
    day <= last && dates.length < 12;
    day.setDate(day.getDate() + 1)
  )
    dates.push(
      `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`,
    );
  return dates;
};
export const destinationImageByName = {
  서울: "https://anniehoa.com/Korea/Gyeongbokgung/Hall/3.jpg",
  경주:
    "https://cdn.welfarehello.com/naver-blog/production/gyeongju_e/2025-05/223857733508/gyeongju_e_223857733508_2.jpg?f=webp&q=80&w=1200",
  전주: "https://tour.jeonju.go.kr/images/visitjj/contents/streetmap/img_hanok00.jpg",
  제주도: jejuCoastPhoto,
  부산: "https://media.grandvoyage.com/__sized__/voyages/Viaje_a_Corea_del_Sur_de_9_dias__de_Seul_a_Busan_pM5Y5VD_urjfjJv-thumbnail_webp-1920x960.webp",
  // 실제 관광지의 분위기가 바로 느껴지도록 오동도와 남이섬 사진으로 교체했습니다.
  여수: "https://img.einet.kr/P202101006/travel/42924/01.jpg?v=1684740236",
  "가평·춘천":
    "https://a.travel-assets.com/findyours-php/viewfinder/images/res70/463000/463964-Nami-Island.jpg?h=500&impolicy=fcrop&q=medium&w=1200",
  속초: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=90",
  후쿠오카:
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1400&q=90",
  방콕: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=1400&q=90",
  뉴욕: "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=1400&q=90",
  오사카:
    "https://images.unsplash.com/photo-1590559899731-a382839e5549?auto=format&fit=crop&w=1400&q=90",
  다낭: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1400&q=90",
  타이베이:
    "https://images.unsplash.com/photo-1470004914212-05527e49370b?auto=format&fit=crop&w=1400&q=90",
  파리: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1400&q=90",
  시드니:
    "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=1400&q=90",
};

// 도착지 모달용 UI 데이터입니다. 실제 좌표·공항 코드는 locationCatalog의 표준 데이터를 사용하고,
// 이 배열은 여행자가 빠르게 이해할 수 있는 사진·테마·검색 별칭만 담당합니다.
export const destinationExplorerItems = [
  { id: "destination-jeju", title: "제주도", lookupName: "제주도", subtitle: "제주시 · 협재 · 성산", tags: ["바다", "휴식", "맛집"], image: destinationImageByName["제주도"], countryCode: "KR", scope: "domestic" },
  { id: "busan-haeundae", title: "부산", lookupName: "부산", subtitle: "해운대 · 광안리", tags: ["바다", "맛집", "야경"], image: destinationImageByName["부산"], countryCode: "KR", scope: "domestic" },
  { id: "gangwon-gangneung", title: "강릉", lookupName: "강릉시", subtitle: "경포 · 안목", tags: ["바다", "카페", "드라이브"], image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=90", countryCode: "KR", scope: "domestic" },
  { id: "gangwon-sokcho", title: "속초", lookupName: "속초", subtitle: "설악산 · 영랑호", tags: ["자연", "바다", "힐링"], image: destinationImageByName["속초"], countryCode: "KR", scope: "domestic" },
  { id: "jeonnam-yeosu", title: "여수", lookupName: "여수", subtitle: "오동도 · 낭만포차", tags: ["바다", "야경", "맛집"], image: destinationImageByName["여수"], countryCode: "KR", scope: "domestic" },
  { id: "gyeongbuk-gyeongju", title: "경주", lookupName: "경주", subtitle: "황리단길 · 대릉원", tags: ["역사", "감성", "카페"], image: destinationImageByName["경주"], countryCode: "KR", scope: "domestic" },
  { id: "jeonbuk-jeonju", title: "전주", lookupName: "전주", subtitle: "한옥마을 · 남부시장", tags: ["맛집", "한옥", "산책"], image: destinationImageByName["전주"], countryCode: "KR", scope: "domestic" },
  { id: "destination-gapyeong-chuncheon", title: "가평·춘천", lookupName: "가평·춘천", subtitle: "남이섬 · 의암호", tags: ["자연", "데이트", "드라이브"], image: destinationImageByName["가평·춘천"], countryCode: "KR", scope: "domestic" },
  { id: "destination-fukuoka", title: "후쿠오카", lookupName: "후쿠오카", subtitle: "하카타 · 다자이후", tags: ["미식", "온천", "쇼핑"], image: destinationImageByName["후쿠오카"], countryCode: "JP", scope: "overseas" },
  { id: "destination-osaka", title: "오사카", lookupName: "오사카", subtitle: "난바 · 유니버설", tags: ["맛집", "쇼핑", "액티비티"], image: destinationImageByName["오사카"], countryCode: "JP", scope: "overseas" },
  { id: "destination-bangkok", title: "방콕", lookupName: "방콕", subtitle: "왓 아룬 · 짜오프라야", tags: ["도시", "미식", "힐링"], image: destinationImageByName["방콕"], countryCode: "TH", scope: "overseas" },
  { id: "destination-danang", title: "다낭", lookupName: "다낭", subtitle: "미케비치 · 호이안", tags: ["휴양", "바다", "가성비"], image: destinationImageByName["다낭"], countryCode: "VN", scope: "overseas" },
  { id: "destination-taipei", title: "타이베이", lookupName: "타이베이", subtitle: "시먼딩 · 야시장", tags: ["미식", "도시", "쇼핑"], image: destinationImageByName["타이베이"], countryCode: "TW", scope: "overseas" },
  { id: "destination-paris", title: "파리", lookupName: "파리", subtitle: "에펠탑 · 마레", tags: ["예술", "도시", "감성"], image: destinationImageByName["파리"], countryCode: "FR", scope: "overseas" },
  { id: "destination-sydney", title: "시드니", lookupName: "시드니", subtitle: "오페라하우스 · 본다이", tags: ["도시", "바다", "자연"], image: destinationImageByName["시드니"], countryCode: "AU", scope: "overseas" },
  { id: "destination-newyork", title: "뉴욕", lookupName: "뉴욕", subtitle: "맨해튼 · 센트럴파크", tags: ["도시", "문화", "쇼핑"], image: destinationImageByName["뉴욕"], countryCode: "US", scope: "overseas" },
];
