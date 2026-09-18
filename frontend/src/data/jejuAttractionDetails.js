const JEJU_ATTRACTION_DETAILS = [
  {
    aliases: ["동문시장", "제주동문시장"], name: "동문시장",
    latitude: 33.5116, longitude: 126.526, address: "제주특별자치도 제주시 관덕로14길 20",
    image: "https://api.cdn.visitjeju.net/photomng/imgpath/202410/16/bdf6c336-fde3-4312-92be-7db8f3a37fbc.webp",
    introduction: "제주 원도심의 대표 전통시장입니다. 제주 먹거리와 농수산물, 기념품을 한자리에서 둘러볼 수 있어 공항 이동 전후 일정에도 잘 어울립니다.",
    tags: ["제주도여행", "전통시장", "먹거리", "원도심", "기념품"],
  },
  {
    aliases: ["함덕해수욕장", "함덕서우봉해변"], name: "함덕해수욕장",
    latitude: 33.5431, longitude: 126.6692, address: "제주특별자치도 제주시 조천읍 조함해안로 525",
    image: "https://api.cdn.visitjeju.net/photomng/imgpath/202408/20/a397a498-7bc9-4730-963a-cfa29ccffe7d.webp",
    introduction: "고운 모래와 얕고 맑은 바다로 유명한 제주 동북부 해변입니다. 해변 산책과 서우봉 전망, 인근 카페를 한 동선으로 묶기 좋습니다.",
    tags: ["제주바다", "해수욕장", "서우봉", "산책", "카페"],
  },
  {
    aliases: ["성산일출봉"], name: "성산일출봉",
    latitude: 33.4581, longitude: 126.9426, address: "제주특별자치도 서귀포시 성산읍 일출로 284-12",
    image: "https://api.cdn.visitjeju.net/photomng/imgpath/202409/20/c8bf6191-832c-4605-a948-96f07f6112d2.webp",
    introduction: "바다 위로 솟은 응회구 지형과 정상 전망이 인상적인 제주 동부 대표 명소입니다. 일출과 해안 풍경을 함께 감상할 수 있습니다.",
    tags: ["세계자연유산", "일출", "오름", "전망", "제주동부"],
  },
  {
    aliases: ["한담해안산책로", "애월한담해안산책로"], name: "한담해안산책로",
    latitude: 33.4626, longitude: 126.3108, address: "제주특별자치도 제주시 애월읍 애월리 2461",
    image: "https://api.cdn.visitjeju.net/photomng/imgpath/202110/28/6a66021a-e571-4ebb-8ddd-2f42ceb46c9c.webp",
    introduction: "애월의 바다와 현무암 해안을 가까이에서 따라 걷는 산책로입니다. 애월 카페 거리와 곽지해수욕장을 잇는 서부 해안 일정의 중심 구간입니다.",
    tags: ["애월", "해안산책", "노을", "제주서부", "바다"],
  },
  {
    aliases: ["애월카페거리", "애월 카페 거리", "제주특별자치도 애월 카페 거리"], name: "애월 카페 거리",
    latitude: 33.4635, longitude: 126.3094, address: "제주특별자치도 제주시 애월읍 애월북서길 일대",
    image: "https://api.cdn.visitjeju.net/photomng/imgpath/202409/25/4b1eef78-9b25-41c1-8839-30cc8796a7de.webp",
    introduction: "한담해안산책로와 애월항 사이에 오션뷰 카페와 식당이 이어지는 애월의 대표 여행 구역입니다. 바다 산책, 카페 휴식, 노을 감상을 한 번에 연결하기 좋습니다.",
    tags: ["애월", "오션뷰카페", "한담해안", "노을", "제주서부", "데이트"],
  },
  {
    aliases: ["곽지해수욕장", "곽지과물해변"], name: "곽지해수욕장",
    latitude: 33.4507, longitude: 126.3055, address: "제주특별자치도 제주시 애월읍 곽지9길 26",
    image: "https://api.cdn.visitjeju.net/photomng/imgpath/202110/25/daaa3e6e-822b-4acc-98df-8ba8e8453dd7.webp",
    introduction: "넓은 백사장과 맑은 바다, 용천수 노천탕으로 알려진 애월의 해변입니다. 한담해안산책로와 이어서 걷는 코스로 구성하기 좋습니다.",
    tags: ["애월", "해수욕장", "과물", "가족여행", "해안산책"],
  },
  {
    aliases: ["협재해수욕장", "협재해변"], name: "협재해수욕장",
    latitude: 33.3942, longitude: 126.2398, address: "제주특별자치도 제주시 한림읍 한림로 329-10",
    image: "https://api.cdn.visitjeju.net/photomng/imgpath/202408/27/77cf6bb2-4d0d-4f46-8cfa-3f527a4d06b3.webp",
    introduction: "비양도가 마주 보이는 에메랄드빛 바다와 고운 모래가 특징인 제주 서부 대표 해변입니다. 금능해변, 한림공원과 함께 둘러보기 좋습니다.",
    tags: ["한림", "비양도", "해수욕장", "에메랄드바다", "제주서부"],
  },
  {
    aliases: ["금능해변", "금능해수욕장", "금능해변산책"], name: "금능해변",
    latitude: 33.3904, longitude: 126.2359, address: "제주특별자치도 제주시 한림읍 금능리",
    image: "https://api.cdn.visitjeju.net/photomng/imgpath/202110/25/f633561a-01c8-4e4a-a826-dd704e8bb5d9.webp",
    introduction: "협재해수욕장과 이어지는 비교적 잔잔한 해변입니다. 비양도와 얕은 바다를 바라보며 여유롭게 산책하거나 일몰을 보기 좋습니다.",
    tags: ["한림", "비양도", "일몰", "산책", "제주바다"],
  },
  {
    aliases: ["새별오름"], name: "새별오름",
    latitude: 33.3663, longitude: 126.3578, address: "제주특별자치도 제주시 애월읍 봉성리 산59-8",
    image: "https://api.cdn.visitjeju.net/photomng/imgpath/202410/21/dd078476-3958-40e8-ab31-c3599ef97bcc.webp",
    introduction: "완만한 능선과 계절마다 달라지는 억새 풍경으로 사랑받는 애월 중산간 오름입니다. 정상에서는 제주 서부의 넓은 들판을 조망할 수 있습니다.",
    tags: ["오름", "억새", "애월", "트레킹", "전망"],
  },
  {
    aliases: ["오설록티뮤지엄", "오설록 티 뮤지엄", "오설록"], name: "오설록 티 뮤지엄",
    latitude: 33.3059, longitude: 126.2895, address: "제주특별자치도 서귀포시 안덕면 신화역사로 15",
    image: "https://api.cdn.visitjeju.net/photomng/imgpath/202110/20/003f420c-6efe-41e9-93b7-00fe6ac5e83b.webp",
    introduction: "제주 차 문화와 녹차밭 풍경을 함께 경험할 수 있는 공간입니다. 전시, 티 클래스, 카페와 정원을 한 장소에서 둘러볼 수 있습니다.",
    tags: ["녹차", "뮤지엄", "티하우스", "정원", "제주서부"],
  },
  {
    aliases: ["카멜리아힐", "카멜리아 힐"], name: "카멜리아힐",
    latitude: 33.2897, longitude: 126.3701, address: "제주특별자치도 서귀포시 안덕면 병악로 166",
    image: "https://api.cdn.visitjeju.net/photomng/imgpath/202410/15/fb2d2739-5e8e-4a87-9d1d-0281d95efeb7.webp",
    introduction: "동백을 비롯한 다양한 수목과 계절 꽃을 감상하는 정원형 관광지입니다. 산책로와 사진 명소가 잘 연결되어 있어 천천히 둘러보기 좋습니다.",
    tags: ["동백", "수목원", "정원", "사진명소", "안덕"],
  },
  {
    aliases: ["산방산용머리해안", "산방산·용머리 해안", "용머리해안"], name: "산방산·용머리 해안",
    latitude: 33.2316, longitude: 126.3148, address: "제주특별자치도 서귀포시 안덕면 사계리",
    image: "https://api.cdn.visitjeju.net/photomng/imgpath/202409/25/88cd0d87-306d-46e1-9b97-956fdf893f88.webp",
    introduction: "산방산 아래 해안 절벽과 층층이 쌓인 지질 경관을 만나는 곳입니다. 용머리해안은 기상과 파도 상황에 따라 출입이 통제될 수 있습니다.",
    tags: ["지질명소", "산방산", "용머리해안", "해안산책", "안덕"],
  },
  {
    aliases: ["천제연폭포"], name: "천제연폭포",
    latitude: 33.2528, longitude: 126.4173, address: "제주특별자치도 서귀포시 천제연로 132",
    image: "https://api.cdn.visitjeju.net/photomng/imgpath/202110/27/617daa5f-d818-47c1-b80d-59f45e96371b.webp",
    introduction: "중문 관광단지 인근의 세 구간 폭포와 울창한 난대림을 함께 걷는 명소입니다. 계단과 산책 구간이 있어 편한 신발이 좋습니다.",
    tags: ["폭포", "중문", "난대림", "산책", "자연"],
  },
  {
    aliases: ["중문색달해수욕장", "중문해수욕장"], name: "중문색달해수욕장",
    latitude: 33.245, longitude: 126.4115, address: "제주특별자치도 서귀포시 색달동",
    image: "https://api.cdn.visitjeju.net/photomng/imgpath/202407/24/a524251a-1057-43b5-b744-217f7f3ea78f.webp",
    introduction: "절벽과 야자수 풍경이 어우러진 중문 지역의 대표 해변입니다. 파도가 힘찬 편이라 해변 산책과 전망 감상 코스로도 인기가 높습니다.",
    tags: ["중문", "해수욕장", "서핑", "해안절벽", "노을"],
  },
  {
    aliases: ["주상절리대", "대포주상절리", "중문대포주상절리대"], name: "주상절리대",
    latitude: 33.2379, longitude: 126.426, address: "제주특별자치도 서귀포시 이어도로 36-24",
    image: "https://api.cdn.visitjeju.net/photomng/imgpath/202410/21/1690de57-e791-4712-84e9-3963a82de0f1.webp",
    introduction: "용암이 식으며 만들어진 육각형 돌기둥이 해안선을 따라 이어지는 제주 대표 지질 명소입니다. 전망대에서 파도와 절벽을 안전하게 감상할 수 있습니다.",
    tags: ["주상절리", "지질명소", "중문", "해안전망", "자연"],
  },
];

const normalized = value => String(value || "")
  .replace(/제주특별자치도|제주도|제주시|서귀포시/g, "")
  .replace(/[\s·()_-]+/g, "")
  .replace(/산책$/, "");

export function getJejuAttractionDetail(name) {
  const query = normalized(name);
  const item = JEJU_ATTRACTION_DETAILS.find(entry =>
    entry.aliases.some(alias => {
      const candidate = normalized(alias);
      return query === candidate || query.includes(candidate) || candidate.includes(query);
    }),
  );
  if (!item) return null;
  return {
    name: item.name,
    representativeImageUrl: item.image,
    categoryName: "관광지",
    region1Name: "제주특별자치도",
    region2Name: item.address.includes("서귀포시") ? "서귀포시" : "제주시",
    introduction: item.introduction,
    tags: item.tags,
    address: item.address,
    latitude: item.latitude,
    longitude: item.longitude,
    sourceLabel: "Visit Jeju 기반 지역 상세 정보",
    isLocalFallback: true,
  };
}

export function hasJejuAttractionDetail(name) {
  return Boolean(getJejuAttractionDetail(name));
}
