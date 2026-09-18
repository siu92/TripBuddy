import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Compass,
  MapPinned,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import KoreaRegionMap from "./KoreaRegionMap";
import RegionDetailMap from "./RegionDetailMap";
import { flattenDistricts } from "../data/locationCatalog";
import jejuCoastPhoto from "../assets/jeju-main-hero.jpeg";
import "./destination-explorer.css";

const TAB = {
  TRENDING: "trending",
  MAP: "map",
};

const DESTINATION_IMAGE_FALLBACKS = {
  "destination-jeju": jejuCoastPhoto,
  "destination-busan": "https://yaimg.yanolja.com/v5/2026/01/30/05/1280/697c45a04bcde3.06159282.jpg",
  "destination-yeosu": "https://img.einet.kr/P202101006/travel/42924/01.jpg?v=1684740236",
  "destination-gapyeong-chuncheon": "https://a.travel-assets.com/findyours-php/viewfinder/images/res70/463000/463964-Nami-Island.jpg?h=500&impolicy=fcrop&q=medium&w=1200",
  "destination-danyang": "https://d3h30waly5w5yx.cloudfront.net/images/tour/pictures/danyang-dodam-1.jpg",
  "destination-suncheon-boseong": "https://commons.wikimedia.org/wiki/Special:FilePath/Suncheon%20Ecological%20Bay-%20%EC%88%9C%EC%B2%9C%EB%A7%8C%EC%8A%B5%EC%A7%80.jpg?width=1200",
  "destination-pohang": "https://tong.visitkorea.or.kr/cms/resource/30/2917730_image2_1.jpg",
};

export const TRENDING_DESTINATIONS = [
  { id: "destination-jeju", title: "제주도", subtitle: "제주시 · 협재 · 성산", region: "제주특별자치도", regionCode: "KR-49", latitude: 33.4996, longitude: 126.5312, tags: ["바다", "힐링", "맛집·카페"], image: "https://images.unsplash.com/photo-1589136785350-93a3881bcce2?q=80&w=600&auto=format&fit=crop", subSpots: [{"name":"성산일출봉","latitude":33.4581,"longitude":126.9426,"image":"https://images.unsplash.com/photo-1785686856914-828bceeb9e64?auto=format&fit=crop&w=1200&q=85"},{"name":"애월 한담해안산책로","latitude":33.4626,"longitude":126.3108,"image":"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85"},{"name":"오설록 티뮤지엄","latitude":33.3059,"longitude":126.2895,"image":"https://images.unsplash.com/photo-1764092184365-0c4c62b55d97?auto=format&fit=crop&w=1200&q=85"},{"name":"동문시장","latitude":33.5116,"longitude":126.526,"image":"https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=85"}] },
  { id: "destination-busan", title: "부산", subtitle: "해운대 · 광안리", region: "부산광역시", regionCode: "KR-26", latitude: 35.1796, longitude: 129.0756, tags: ["바다", "맛집·카페", "야경"], image: "https://yaimg.yanolja.com/v5/2026/01/30/05/1280/697c45a04bcde3.06159282.jpg", subSpots: [{"name":"해운대 블루라인파크","latitude":35.1605,"longitude":129.191,"image":"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85"},{"name":"흰여울문화마을","latitude":35.0785,"longitude":129.0447,"image":"https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=85"},{"name":"해동용궁사","latitude":35.1885,"longitude":129.2233,"image":"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85"},{"name":"광안리 해수욕장","latitude":35.1532,"longitude":129.1187,"image":"https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1200&q=85"}] },
  { id: "destination-gangneung", title: "강릉", subtitle: "경포 · 안목", region: "강원특별자치도", regionCode: "KR-42", latitude: 37.7519, longitude: 128.8761, tags: ["바다", "맛집·카페", "힐링"], image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=88", subSpots: [{"name":"경포대","latitude":37.795,"longitude":128.8966,"image":"https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=85"},{"name":"아르떼뮤지엄","latitude":37.7892,"longitude":128.9073,"image":"https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=85"},{"name":"안목해변 커피거리","latitude":37.7712,"longitude":128.9488,"image":"https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=85"},{"name":"강릉 중앙시장","latitude":37.754,"longitude":128.8985,"image":"https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=85"}] },
  { id: "destination-sokcho", title: "속초", subtitle: "설악산 · 영랑호", region: "강원특별자치도", regionCode: "KR-42", latitude: 38.207, longitude: 128.5918, tags: ["자연·숲", "바다", "힐링"], image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=88", subSpots: [{"name":"설악산 케이블카","latitude":38.1727,"longitude":128.489,"image":"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85"},{"name":"속초아이 대관람차","latitude":38.1902,"longitude":128.6014,"image":"https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=85"},{"name":"아바이마을","latitude":38.2007,"longitude":128.5942,"image":"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85"},{"name":"속초관광수산시장","latitude":38.2046,"longitude":128.59,"image":"https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=85"}] },
  { id: "destination-yeosu", title: "여수", subtitle: "오동도 · 낭만포차", region: "전라남도", regionCode: "KR-46", latitude: 34.7604, longitude: 127.6622, tags: ["바다", "야경", "맛집·카페"], image: "https://images.unsplash.com/photo-1598509524136-421c60f2bb97?q=80&w=600&auto=format&fit=crop", subSpots: [{"name":"오동도","latitude":34.7446,"longitude":127.7681,"image":"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85"},{"name":"여수 해상케이블카","latitude":34.7306,"longitude":127.7413,"image":"https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=85"},{"name":"향일암","latitude":34.5913,"longitude":127.8045,"image":"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85"},{"name":"이순신광장","latitude":34.7397,"longitude":127.7361,"image":"https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=85"}] },
  { id: "destination-gyeongju", title: "경주", subtitle: "황리단길 · 대릉원", region: "경상북도", regionCode: "KR-47", latitude: 35.8562, longitude: 129.2247, tags: ["힐링", "맛집·카페", "야경"], image: "https://upload.wikimedia.org/wikipedia/commons/b/bb/Korea-Gyeongju-Bulguksa-24.jpg", subSpots: [{"name":"대릉원","latitude":35.8384,"longitude":129.2121,"image":"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85"},{"name":"황리단길","latitude":35.8377,"longitude":129.2096,"image":"https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=85"},{"name":"불국사","latitude":35.79,"longitude":129.332,"image":"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85"},{"name":"동궁과 월지","latitude":35.8344,"longitude":129.2267,"image":"https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=85"}] },
  { id: "destination-jeonju", title: "전주", subtitle: "한옥마을 · 남부시장", region: "전북특별자치도", regionCode: "KR-45", latitude: 35.8242, longitude: 127.148, tags: ["맛집·카페", "힐링", "야경"], image: "https://tour.jeonju.go.kr/images/visitjj/contents/streetmap/img_hanok00.jpg", subSpots: [{"name":"전주한옥마을","latitude":35.8148,"longitude":127.1526,"image":"https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=85"},{"name":"객리단길","latitude":35.8208,"longitude":127.1405,"image":"https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=85"},{"name":"덕진공원","latitude":35.8476,"longitude":127.1213,"image":"https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=85"},{"name":"남부시장","latitude":35.8125,"longitude":127.147,"image":"https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=85"}] },
  { id: "destination-gapyeong-chuncheon", title: "가평·춘천", subtitle: "남이섬 · 의암호", region: "경기도·강원특별자치도", regionCode: "KR-41", latitude: 37.8564, longitude: 127.62, tags: ["자연·숲", "힐링", "맛집·카페"], image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=600&auto=format&fit=crop", subSpots: [{"name":"남이섬","latitude":37.7915,"longitude":127.5255,"image":"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85"},{"name":"아침고요수목원","latitude":37.7436,"longitude":127.3525,"image":"https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=85"},{"name":"레고랜드","latitude":37.8837,"longitude":127.6994,"image":"https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=85"},{"name":"구봉산 카페거리","latitude":37.8992,"longitude":127.776,"image":"https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=85"}] },
  { id: "destination-taean", title: "태안·안면도", subtitle: "꽃지 · 신두리", region: "충청남도", regionCode: "KR-44", latitude: 36.7456, longitude: 126.2979, tags: ["바다", "자연·숲", "힐링"], image: "https://images.unsplash.com/photo-1455729552865-3658a5d39692?auto=format&fit=crop&w=1200&q=88", subSpots: [{"name":"꽃지해수욕장","latitude":36.501,"longitude":126.334,"image":"https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1200&q=85"},{"name":"신두리 해안사구","latitude":36.8403,"longitude":126.1964,"image":"https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1200&q=85"},{"name":"천리포수목원","latitude":36.7987,"longitude":126.149,"image":"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85"},{"name":"안면도 수산시장","latitude":36.52,"longitude":126.3444,"image":"https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=85"}] },
  { id: "destination-danyang", title: "단양", subtitle: "도담삼봉 · 남한강", region: "충청북도", regionCode: "KR-43", latitude: 36.9847, longitude: 128.365, tags: ["자연·숲", "힐링", "맛집·카페"], image: "https://d3h30waly5w5yx.cloudfront.net/images/tour/pictures/danyang-dodam-1.jpg", subSpots: [{"name":"도담삼봉","latitude":37.0002,"longitude":128.343,"image":"https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=85"},{"name":"패러글라이딩 활공장","latitude":37.011,"longitude":128.374,"image":"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85"},{"name":"만천하스카이워크","latitude":36.9776,"longitude":128.3442,"image":"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85"},{"name":"단양 구경시장","latitude":36.9844,"longitude":128.369,"image":"https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=85"}] },
  { id: "destination-suncheon-boseong", title: "순천·보성", subtitle: "순천만 · 녹차밭", region: "전라남도", regionCode: "KR-46", latitude: 34.9006, longitude: 127.287, tags: ["자연·숲", "힐링", "맛집·카페"], image: "https://commons.wikimedia.org/wiki/Special:FilePath/Suncheon%20Ecological%20Bay-%20%EC%88%9C%EC%B2%9C%EB%A7%8C%EC%8A%B5%EC%A7%80.jpg?width=1200", subSpots: [{"name":"순천만습지","latitude":34.8851,"longitude":127.5091,"image":"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85"},{"name":"순천만국가정원","latitude":34.9278,"longitude":127.498,"image":"https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=85"},{"name":"대한다원 녹차밭","latitude":34.7134,"longitude":127.08,"image":"https://images.unsplash.com/photo-1764092184365-0c4c62b55d97?auto=format&fit=crop&w=1200&q=85"},{"name":"낙안읍성 민속마을","latitude":34.9073,"longitude":127.3387,"image":"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85"}] },
  { id: "destination-pohang", title: "포항", subtitle: "호미곶 · 영일대", region: "경상북도", regionCode: "KR-47", latitude: 36.019, longitude: 129.3435, tags: ["바다", "야경", "맛집·카페"], image: "https://tong.visitkorea.or.kr/cms/resource/30/2917730_image2_1.jpg", subSpots: [{"name":"호미곶","latitude":36.0762,"longitude":129.5662,"image":"https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=85"},{"name":"스페이스워크","latitude":36.0633,"longitude":129.396,"image":"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85"},{"name":"구룡포 일본인가옥거리","latitude":35.9904,"longitude":129.5594,"image":"https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=85"},{"name":"영일대 해수욕장","latitude":36.0564,"longitude":129.3778,"image":"https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1200&q=85"}] },
];

// WGS84 대표 지점. 차량 접근 지점은 경로 API에서 별도 보정합니다.
// 대표 이미지는 제주관광공사 Visit Jeju의 실제 명소 사진을 사용합니다.
const JEJU_DESTINATION_CATALOG = [
  {
    "id": "jeju-spot-1",
    "name": "동문시장",
    "latitude": 33.5116,
    "longitude": 126.526,
    "image": "https://api.cdn.visitjeju.net/photomng/imgpath/202410/16/bdf6c336-fde3-4312-92be-7db8f3a37fbc.webp"
  },
  {
    "id": "jeju-spot-2",
    "name": "함덕해수욕장",
    "latitude": 33.5431,
    "longitude": 126.6692,
    "image": "https://api.cdn.visitjeju.net/photomng/imgpath/202408/20/a397a498-7bc9-4730-963a-cfa29ccffe7d.webp"
  },
  {
    "id": "jeju-spot-3",
    "name": "성산일출봉",
    "latitude": 33.4581,
    "longitude": 126.9426,
    "image": "https://api.cdn.visitjeju.net/photomng/imgpath/202409/20/c8bf6191-832c-4605-a948-96f07f6112d2.webp"
  },
  {
    "id": "jeju-spot-4",
    "name": "한담해안산책로",
    "latitude": 33.4626,
    "longitude": 126.3108,
    "image": "https://api.cdn.visitjeju.net/photomng/imgpath/202110/28/6a66021a-e571-4ebb-8ddd-2f42ceb46c9c.webp"
  },
  {
    "id": "jeju-spot-5",
    "name": "애월 카페 거리",
    "latitude": 33.4635,
    "longitude": 126.3094,
    "image": "https://api.cdn.visitjeju.net/photomng/imgpath/202409/25/4b1eef78-9b25-41c1-8839-30cc8796a7de.webp"
  },
  {
    "id": "jeju-spot-6",
    "name": "곽지해수욕장",
    "latitude": 33.4507,
    "longitude": 126.3055,
    "image": "https://api.cdn.visitjeju.net/photomng/imgpath/202110/25/daaa3e6e-822b-4acc-98df-8ba8e8453dd7.webp"
  },
  {
    "id": "jeju-spot-7",
    "name": "협재해수욕장",
    "latitude": 33.3942,
    "longitude": 126.2398,
    "image": "https://api.cdn.visitjeju.net/photomng/imgpath/202408/27/77cf6bb2-4d0d-4f46-8cfa-3f527a4d06b3.webp"
  },
  {
    "id": "jeju-spot-8",
    "name": "금능해변",
    "latitude": 33.3904,
    "longitude": 126.2359,
    "image": "https://api.cdn.visitjeju.net/photomng/imgpath/202110/25/f633561a-01c8-4e4a-a826-dd704e8bb5d9.webp"
  },
  {
    "id": "jeju-spot-9",
    "name": "새별오름",
    "latitude": 33.3663,
    "longitude": 126.3578,
    "image": "https://api.cdn.visitjeju.net/photomng/imgpath/202410/21/dd078476-3958-40e8-ab31-c3599ef97bcc.webp"
  },
  {
    "id": "jeju-spot-10",
    "name": "오설록 티 뮤지엄",
    "latitude": 33.3059,
    "longitude": 126.2895,
    "image": "https://api.cdn.visitjeju.net/photomng/imgpath/202110/20/003f420c-6efe-41e9-93b7-00fe6ac5e83b.webp"
  },
  {
    "id": "jeju-spot-11",
    "name": "카멜리아힐",
    "latitude": 33.2897,
    "longitude": 126.3701,
    "image": "https://api.cdn.visitjeju.net/photomng/imgpath/202410/15/fb2d2739-5e8e-4a87-9d1d-0281d95efeb7.webp"
  },
  {
    "id": "jeju-spot-12",
    "name": "산방산·용머리 해안",
    "latitude": 33.2316,
    "longitude": 126.3148,
    "image": "https://api.cdn.visitjeju.net/photomng/imgpath/202409/25/88cd0d87-306d-46e1-9b97-956fdf893f88.webp"
  },
  {
    "id": "jeju-spot-13",
    "name": "천제연폭포",
    "latitude": 33.2528,
    "longitude": 126.4173,
    "image": "https://api.cdn.visitjeju.net/photomng/imgpath/202110/27/617daa5f-d818-47c1-b80d-59f45e96371b.webp"
  },
  {
    "id": "jeju-spot-14",
    "name": "중문색달해수욕장",
    "latitude": 33.245,
    "longitude": 126.4115,
    "image": "https://api.cdn.visitjeju.net/photomng/imgpath/202407/24/a524251a-1057-43b5-b744-217f7f3ea78f.webp"
  },
  {
    "id": "jeju-spot-15",
    "name": "주상절리대",
    "latitude": 33.2379,
    "longitude": 126.426,
    "image": "https://api.cdn.visitjeju.net/photomng/imgpath/202410/21/1690de57-e791-4712-84e9-3963a82de0f1.webp"
  }
];

// Lead with Jeju's most scenic landscapes; keep the market available lower down.
const JEJU_DESTINATION_PRIORITY = [
  "성산일출봉",
  "한담해안산책로",
  "협재해수욕장",
  "카멜리아힐",
  "애월 카페 거리",
  "산방산·용머리 해안",
  "함덕해수욕장",
  "오설록 티 뮤지엄",
  "새별오름",
  "금능해변",
  "천제연폭포",
  "주상절리대",
  "중문색달해수욕장",
  "곽지해수욕장",
  "동문시장",
];

const jejuPriorityIndex = new Map(JEJU_DESTINATION_PRIORITY.map((name, index) => [name, index]));

export const JEJU_DESTINATIONS = [...JEJU_DESTINATION_CATALOG].sort(
  (left, right) =>
    (jejuPriorityIndex.get(left.name) ?? Number.MAX_SAFE_INTEGER)
    - (jejuPriorityIndex.get(right.name) ?? Number.MAX_SAFE_INTEGER),
);

let jejuPreloadImages = [];

export function preloadJejuDestinationImages() {
  if (typeof window === "undefined" || jejuPreloadImages.length) return;
  jejuPreloadImages = JEJU_DESTINATIONS.map(({ image }) => {
    const preload = new Image();
    preload.decoding = "async";
    preload.fetchPriority = "low";
    preload.src = image;
    return preload;
  });
}

export const toSpotDestination = (destination, spot, index) => ({
  ...destination,
  ...spot,
  subSpots: undefined,
  id: spot.id || `${destination.id}-spot-${index + 1}`,
  parentDestinationId: destination.id,
  title: spot.name,
  subtitle: destination.title,
  detail: spot.name,
  countryCode: "KR",
  scope: "domestic",
  apiSearchKeyword: `${destination.title} ${spot.name}`,
  needsGeocoding: false,
});

const normalizedText = (value) => String(value || "").replace(/\s+/g, "").toLocaleLowerCase("ko-KR");

const getTitle = (destination) =>
  destination?.title || destination?.name || destination?.detail || destination?.region || "이름 없는 여행지";

const getDetail = (destination) =>
  destination?.subtitle || destination?.city || destination?.detail || destination?.region || "여행지";

const getTags = (destination) => {
  if (Array.isArray(destination?.tags)) return destination.tags.filter(Boolean).slice(0, 3);
  if (typeof destination?.tags === "string") return destination.tags.split(/[#,]/).map((tag) => tag.trim()).filter(Boolean).slice(0, 3);
  if (typeof destination?.tag === "string") return destination.tag.split(/[#,]/).map((tag) => tag.trim()).filter(Boolean).slice(0, 3);
  return [];
};

const destinationSearchText = (destination) =>
  normalizedText([
    getTitle(destination),
    getDetail(destination),
    destination?.region,
    destination?.name,
    destination?.detail,
    destination?.parentArea,
    destination?.apiSearchKeyword,
    ...getTags(destination),
    ...(destination?.subSpots || []).map((spot) => spot.name),
  ].filter(Boolean).join(" "));

/**
 * 도착지에 특화된 탐색 모달입니다.
 *
 * - 국내 12개 핵심 권역과 48개 세부 관광지를 2 Depth로 탐색합니다.
 * - `regions`: 대한민국 17개 시·도 배열 (KoreaRegionMap에 전달)
 * - `onSelect(location)`: 시각 카드/자동완성에서 최종 도착지 선택 시 호출
 * - `onSelectRegion(region)`: 권역별 찾기에서 시·도 선택 시 호출
 *
 * API 연결 전에는 어떤 형태의 데이터도 받을 수 있도록 title/name/detail/tags/image를 유연하게 해석합니다.
 */
export default function DestinationExplorer({
  open = true,
  regions = [],
  selectedId = null,
  selectedRegionId = null,
  title = "어디로 떠나볼까요?",
  subtitle = "도시·관광지 이름을 검색하거나, 인기 여행지에서 바로 골라보세요.",
  initialTab = TAB.TRENDING,
  onSelect,
  onSelectRegion,
  onAiRecommend,
  onClose,
  closeOnSelect = true,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [query, setQuery] = useState("");
  const [activeResult, setActiveResult] = useState(-1);
  const [activeRegionId, setActiveRegionId] = useState(selectedRegionId);
  const [detailDestination, setDetailDestination] = useState(null);
  const [jejuCustomQuery, setJejuCustomQuery] = useState("");
  const panelRef = useRef(null);
  const backRef = useRef(null);
  const returnCardId = useRef(null);
  const inputRef = useRef(null);

  const validDestinations = TRENDING_DESTINATIONS;

  const matchingDestinations = useMemo(() => {
    const keyword = normalizedText(query);
    if (!keyword) return [];
    const places = validDestinations.flatMap((destination) => [
      destination,
      ...(destination.id === "destination-jeju" ? JEJU_DESTINATIONS : destination.subSpots)
        .map((subSpot, index) => toSpotDestination(destination, subSpot, index)),
    ]).concat(regions.flatMap((region) => flattenDistricts(region.districts).map((district) => ({
      ...district,
      title: district.name,
      subtitle: district.parentArea ? `${region.name} · ${district.parentArea}` : region.name,
      region: region.name,
      scope: "domestic",
    }))));
    return places
      .filter((destination) => destinationSearchText(destination).includes(keyword))
      .sort((a, b) => Number(Boolean(b.parentDestinationId)) - Number(Boolean(a.parentDestinationId)))
      .slice(0, 6);
  }, [query, regions, validDestinations]);

  const visibleDestinations = validDestinations;
  const activeRegion = useMemo(
    () => regions.find((region) => region.id === activeRegionId) || null,
    [activeRegionId, regions],
  );

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    setActiveResult(-1);
  }, [query]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (open) setActiveRegionId(selectedRegionId || null);
  }, [open, selectedRegionId]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const selectDestination = (destination) => {
    if (!destination) return;
    if (destination.subSpots && !destination.parentDestinationId) {
      returnCardId.current = destination.id;
      setDetailDestination(destination);
      setQuery("");
      return;
    }
    onSelect?.(destination);
    setQuery("");
    if (closeOnSelect) onClose?.();
  };

  const selectRegion = (region) => {
    if (!region) return;
    setActiveRegionId(region.id);
    onSelectRegion?.(region);
  };

  const selectDistrict = (district) => {
    if (!activeRegion || !district) return;
    selectDestination({
      ...district,
      title: district.detail || district.name,
      name: district.name || district.detail,
      detail: district.detail || district.name,
      region: activeRegion.name || activeRegion.region,
      regionCode: district.regionCode || activeRegion.regionCode,
      countryCode: district.countryCode || "KR",
      scope: "domestic",
    });
  };

  const selectSubSpot = (destination, subSpot, index) => {
    selectDestination(toSpotDestination(destination, subSpot, index));
  };

  const selectCustomJejuDestination = (event) => {
    event.preventDefault();
    const name = jejuCustomQuery.trim();
    if (!name || detailDestination?.id !== "destination-jeju") return;
    selectDestination({
      ...detailDestination,
      id: `destination-jeju-custom-${normalizedText(name)}`,
      parentDestinationId: detailDestination.id,
      title: name,
      name,
      detail: name,
      subtitle: "제주도 직접 입력",
      subSpots: undefined,
      latitude: null,
      longitude: null,
      apiSearchKeyword: `제주도 ${name}`,
      needsGeocoding: true,
    });
    setJejuCustomQuery("");
  };

  useEffect(() => {
    if (!open) { setDetailDestination(null); return; }
    panelRef.current?.scrollTo({ top: 0, behavior: "instant" });
    if (detailDestination) backRef.current?.focus();
    else if (returnCardId.current) {
      document.getElementById(returnCardId.current)?.focus();
      returnCardId.current = null;
    }
  }, [detailDestination, open]);

  const handleSearchKeyDown = (event) => {
    if (!matchingDestinations.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveResult((current) => Math.min(current + 1, matchingDestinations.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveResult((current) => Math.max(current - 1, 0));
    }
    if (event.key === "Enter") {
      event.preventDefault();
      selectDestination(matchingDestinations[Math.max(activeResult, 0)]);
    }
  };

  if (!open) return null;

  return (
    <div className="destination-explorer-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose?.();
    }}>
      <section
        ref={panelRef}
        className="destination-explorer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="destination-explorer-title"
      >
        <button className="destination-explorer-close" type="button" onClick={onClose} aria-label="도착지 선택 닫기">
          <X size={19} strokeWidth={2.25} />
        </button>

        {detailDestination ? (
          <div key={detailDestination.id} className="destination-detail-view">
            <button ref={backRef} className="destination-detail-back" type="button" onClick={() => { setActiveTab(TAB.TRENDING); setDetailDestination(null); }}>← 뒤로 가기</button>
            <header className="destination-explorer-header destination-detail-header">
              <span className="destination-explorer-kicker"><Compass size={14} /> {detailDestination.id === "destination-jeju" ? "JEJU ISLAND" : detailDestination.title}</span>
              <h2 id="destination-explorer-title">{detailDestination.title} 어디를 여행하고 싶으세요?</h2>
              <p>마음에 드는 장소를 골라 나만의 여행을 시작해 보세요.</p>
            </header>
            {detailDestination.id === "destination-jeju" ? (
              <form className="destination-jeju-custom-search" onSubmit={selectCustomJejuDestination}>
                <Search size={20} aria-hidden="true" />
                <label htmlFor="jeju-custom-destination">
                  <b>목록에 없는 제주 여행지도 찾아보세요</b>
                  <span>관광지·해변·오름·마을 이름을 자유롭게 입력할 수 있어요.</span>
                </label>
                <input
                  id="jeju-custom-destination"
                  type="search"
                  value={jejuCustomQuery}
                  onChange={(event) => setJejuCustomQuery(event.target.value)}
                  placeholder="예: 비자림, 검멀레해변, 사려니숲길"
                  aria-label="목록에 없는 제주 여행지 입력"
                />
                <button type="submit" disabled={!jejuCustomQuery.trim()}>이 장소로 여행하기 <ArrowRight size={16} /></button>
              </form>
            ) : null}
            <div className={detailDestination.id === "destination-jeju" ? "destination-detail-grid destination-jeju-grid" : "destination-detail-grid"}>
              {(detailDestination.id === "destination-jeju" ? JEJU_DESTINATIONS : detailDestination.subSpots).map((spot, index) => (
                <button key={spot.name} type="button" className="destination-spot-card" onClick={() => selectSubSpot(detailDestination, spot, index)}>
                  <span className="destination-spot-image"><img src={spot.image} alt="" loading={index < 6 ? "eager" : "lazy"} fetchPriority={index < 3 ? "high" : "auto"} decoding="async" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} /></span>
                  <span className="destination-spot-caption"><b>{spot.name}</b><ArrowRight size={17} aria-hidden="true" /></span>
                </button>
              ))}
            </div>
            <p className="destination-photo-note">제주관광공사 공식 관광지 사진으로 미리 둘러보세요.</p>
            <button className="destination-detail-region" type="button" onClick={() => selectDestination({ ...detailDestination, subSpots: undefined })}>{detailDestination.title} 전체를 여행지로 선택 <ArrowRight size={16} /></button>
          </div>
        ) : (
        <div key="regions" className="destination-overview-view">
        <header className="destination-explorer-header">
          <span className="destination-explorer-kicker"><Sparkles size={14} /> AI 여행지 탐색</span>
          <h2 id="destination-explorer-title">{title}</h2>
          <p>{subtitle}</p>
        </header>

        <div className="destination-explorer-search-wrap">
          <Search size={20} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="예: 제주, 속초, 해운대, 경포대"
            aria-label="도시 또는 관광지 검색"
            aria-autocomplete="list"
            aria-controls="destination-search-results"
            aria-expanded={Boolean(query && matchingDestinations.length)}
          />
          {query ? <button type="button" onClick={() => setQuery("")} aria-label="검색어 지우기"><X size={16} /></button> : null}
          {query ? (
            <div id="destination-search-results" className="destination-search-results" role="listbox" aria-label="추천 검색 결과">
              {matchingDestinations.length ? matchingDestinations.map((destination, index) => (
                <button
                  type="button"
                  key={destination.id || `${getTitle(destination)}-${index}`}
                  className={activeResult === index ? "is-active" : ""}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectDestination(destination)}
                  role="option"
                  aria-selected={activeResult === index}
                >
                  {destination.image ? <img src={destination.image} alt="" /> : <span className="destination-result-fallback"><MapPinned size={17} /></span>}
                  <span><b>{getTitle(destination)}</b><small>{getDetail(destination)}</small></span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              )) : <p className="destination-search-empty">일치하는 여행지가 없어요. 직접 지역 찾기를 이용해 보세요.</p>}
            </div>
          ) : null}
        </div>

        <nav className="destination-explorer-tabs" aria-label="도착지 탐색 방식">
          <button type="button" className={activeTab === TAB.TRENDING ? "is-active" : ""} onClick={() => setActiveTab(TAB.TRENDING)}>
            <Compass size={17} /> 요즘 뜨는 여행지
          </button>
          <button type="button" className={activeTab === TAB.MAP ? "is-active" : ""} onClick={() => setActiveTab(TAB.MAP)}>
            <MapPinned size={17} /> 지도로 찾기
          </button>
        </nav>

        {activeTab === TAB.MAP ? (
          <div className="destination-region-panel">
            {activeRegion ? (
              <div className="destination-region-detail">
                <button type="button" className="destination-region-back" onClick={() => setActiveRegionId(null)}>← 권역별 지도</button>
                <div className="destination-region-heading">
                  <span><MapPinned size={19} /></span>
                  <div><b>{activeRegion.name}에서 어디로 갈까요?</b><small>관광지와 가까운 세부 시·군·구를 골라보세요.</small></div>
                </div>
                <RegionDetailMap
                  region={activeRegion}
                  selectedDistrictId={selectedId}
                  selectDistrict={selectDistrict}
                  ariaLabel={`${activeRegion.name} 도착지 세부 시군구 선택 지도`}
                />
              </div>
            ) : (
              <>
                <div className="destination-region-heading">
                  <span><MapPinned size={19} /></span>
                  <div><b>권역별로 찾아볼까요?</b><small>시·도를 고르면 다음 단계에서 세부 지역을 선택할 수 있어요.</small></div>
                </div>
                <KoreaRegionMap regions={regions} selectedId={selectedRegionId} onSelect={selectRegion} ariaLabel="도착지 권역별 지도" />
              </>
            )}
          </div>
        ) : (
          <div className="destination-visual-panel">
            <div className="destination-visual-heading">
              <div>
                <b>요즘 많이 찾는 국내 여행지</b>
                <small>지역 카드를 눌러 여행하고 싶은 명소를 찾아보세요.</small>
              </div>
              {onAiRecommend ? (
                <button type="button" onClick={onAiRecommend}><Sparkles size={16} /> AI에게 추천받기</button>
              ) : null}
            </div>
            {visibleDestinations.length ? (
              <div className="destination-visual-grid">
                {visibleDestinations.map((destination, index) => {
                  const selected = selectedId === destination.id;
                  const tags = getTags(destination);
                  return (
                    <article
                      key={destination.id || `${getTitle(destination)}-${index}`}
                      className={`destination-visual-card${selected ? " is-selected" : ""}`}
                    >
                      <button type="button" id={destination.id} className="destination-card-main" onClick={() => selectDestination(destination)} aria-pressed={selected}>
                        <span className="destination-card-image">
                          {destination.image ? <img src={destination.image} alt={`${destination.title} 대표 풍경`} onError={(event) => {
                            const fallback = DESTINATION_IMAGE_FALLBACKS[destination.id];
                            if (fallback && event.currentTarget.src !== fallback) event.currentTarget.src = fallback;
                          }} /> : <span className="destination-image-fallback"><MapPinned size={25} /></span>}
                          <span className="destination-card-shade" />
                          <span className="destination-card-select">{selected ? "선택됨" : "여행지 보기"}</span>
                        </span>
                        <span className="destination-card-content">
                          <b>{getTitle(destination)}</b>
                          <small>{getDetail(destination)}</small>
                          {tags.length ? <span className="destination-card-tags">{tags.map((tag) => <em key={tag}>#{tag}</em>)}</span> : null}
                        </span>
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="destination-empty-panel"><MapPinned size={25} /><b>표시할 여행지가 아직 없어요.</b><span>백엔드에서 인기 여행지를 불러오면 이곳에 자동으로 나타납니다.</span></div>
            )}
          </div>
        )}

        <footer className="destination-explorer-footer">
          <span><Sparkles size={15} /> 여행 취향이 정해지지 않았나요?</span>
          {onAiRecommend ? <button type="button" onClick={onAiRecommend}>AI 추천으로 채우기 <ArrowRight size={15} /></button> : <small>메인 프롬프트에 원하는 여행을 자유롭게 적어도 좋아요.</small>}
        </footer>
        </div>
        )}
      </section>
    </div>
  );
}
