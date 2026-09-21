const CURATED_PLACE_COSTS = [
  { match: /꽃밥/, price: 15000, source: "꽃밥정식 공개 메뉴가" },
  { match: /애월회관/, price: 28000, source: "흑오겹살 250g 공개 메뉴가" },
  { match: /언덕집국수/, price: 10000, source: "고기국수 공개 메뉴가" },
  { match: /바다풍경정육식당/, price: 22000, source: "흑돼지 1인 권장량 환산" },
  { match: /클린\s*제주/, price: 9000, source: "애월 카페 음료·디저트 평균" },
  { match: /작산.*흑돼지|흑돼지.*작산|작산애월흑돼지/, price: 33000, source: "숙성 흑돼지 300g 공개 메뉴가" },
  { match: /마초스테이크/, price: 33900, source: "립아이 스테이크 공개 메뉴가" },
  { match: /블루그라스/, price: 17700, source: "토리 세트 공개 메뉴가" },
  { match: /이춘옥/, price: 26000, source: "고등어쌈밥 대표 메뉴가" },
  { match: /숙성도/, price: 35000, source: "흑돼지 대표 구성 1인 환산" },
  { match: /스시\s*호시카이/, price: 150000, source: "오마카세 대표 코스" },
  { match: /자매국수/, price: 12000, source: "국수·곁들임 평균" },
  { match: /고집돌우럭/, price: 30000, source: "대표 세트 1인 환산" },
  { match: /명진전복/, price: 18000, source: "전복돌솥밥 대표 메뉴가" },
  { match: /핸즈\s*웍스|맨즈\s*윅스/, price: 30000, source: "제주 공방 체험 공개가 비교 예상" },
  { match: /수목원테마파크|아이스뮤지엄/, price: 20000, source: "대표 입장권 공개가 기준" },
  { match: /카멜리아힐/, price: 10000, source: "성인 입장권 공개가 기준" },
  { match: /오설록.*뮤지엄/, price: 0, source: "무료 입장 관광지" },
  { match: /제주올레길|올레길|순례길|산지천|한담해안산책로|새별오름|고내봉|그린비즈/, price: 0, source: "무료 개방 관광지" },
];

export function getPlaceCostEstimate(name, metadata = {}) {
  const normalizedName = String(name || "").trim();
  const curated = CURATED_PLACE_COSTS.find(({ match }) => match.test(normalizedName));
  if (curated) return { price: curated.price, source: curated.source, curated: true };

  const type = String(metadata.type || metadata.category || "").toUpperCase();
  if (type === "CAFE" || /카페|커피|디저트|베이커리/.test(normalizedName)) {
    return { price: 9000, source: "지역 카페 대표 메뉴 평균", curated: false };
  }
  if (type === "RESTAURANT" || /식당|국수|스테이크|흑돼지|회관|점심|저녁|식사/.test(normalizedName)) {
    return { price: 20000, source: "동일 업종 대표 메뉴 평균", curated: false };
  }
  if (/박물관|미술관|뮤지엄|전시/.test(normalizedName)) {
    return { price: 12000, source: "제주 전시·박물관 성인 입장료 평균", curated: false };
  }
  if (/테마파크|놀이|공원|정원/.test(normalizedName)) {
    return { price: 18000, source: "제주 유료 관광지 성인 입장료 평균", curated: false };
  }
  if (/체험|공방|클래스|액티비티|승마|카트/.test(normalizedName) || /ACTIVITY|EXPERIENCE/.test(type)) {
    return { price: 30000, source: "제주 체험 상품 1인 평균", curated: false };
  }
  return { price: 15000, source: "제주 관광·체험 1인 평균", curated: false };
}
