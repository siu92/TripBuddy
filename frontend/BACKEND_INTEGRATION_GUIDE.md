# TripBuddy 백엔드·외부 API 연동 기준서

이 문서는 현재 React 화면을 실제 선택값에 따라 동작하는 여행 플랫폼으로 연결하기 위한 백엔드 작업 기준서입니다.

## 1. 서비스의 절대 원칙

1. 출발지, 도착지, 세부지역, 날짜, 인원, 교통수단, 숙소, 장소는 모두 일정과 비용의 입력값입니다.
2. 제주라고 해서 항공을 미리 정하지 않습니다. 서버가 가능한 이동수단을 계산해 보여주고 사용자가 선택합니다.
3. 식당은 이름만 생성하지 않습니다. 공공 인허가 데이터에서 영업 중인 곳만 추천 후보가 됩니다.
4. 관광지는 한국관광공사 등 신뢰 가능한 원천의 콘텐츠 ID, 좌표, 주소를 가진 곳만 추천합니다.
5. 항공, KTX, 숙소, 렌터카, 배편 가격은 계약된 공급자 API가 연결되기 전까지 시연용 더미 견적입니다. 응답에는 isMock, sourceLabel, refreshedAt이 반드시 있어야 합니다.
6. 한 번 만든 비용 견적은 estimateId 또는 같은 CostEstimate 응답을 일정 화면까지 재사용합니다. 화면마다 독립 계산하면 안 됩니다.

## 2. 권장 구조

React 화면
  → src/api 어댑터
  → TripBuddy 백엔드 BFF
  → 위치·행정구역 / 이동수단 가능성 / 지도 경로 / 관광지 / 식당 인허가 / 견적 / 비용 / 일정 엔진
  → DB, 캐시, 작업 큐, 로그·모니터링

### 역할 분리

- React: 입력과 결과 표시만 담당합니다. 외부 API 키와 제휴사 인증 정보는 넣지 않습니다.
- BFF: 네이버, 티맵, 한국관광공사, 식품 인허가, 제휴사 응답을 화면에 필요한 동일한 DTO로 바꿉니다.
- DB: 행정구역 좌표, 관광지 원천 ID, 식당 영업 상태, 견적 버전, 생성 일정, 공유 링크를 보관합니다.
- 캐시: 경로와 관광 검색은 중복 호출을 줄입니다.
- 작업 큐: 식당 인허가와 관광 콘텐츠를 주기적으로 동기화합니다.

## 3. 실제 연동과 더미 데이터의 경계

### 실제 연동 우선 데이터

- 지도·자동차 경로: 네이버 지도 Directions 또는 TMAP
- 관광지: 한국관광공사 관광콘텐츠랩 OpenAPI
- 식당 영업 여부: 식품의약품안전처 식품접객업정보 및 지방행정 인허가 데이터

한국관광공사 관광 콘텐츠: https://api.visitkorea.or.kr/

식품의약품안전처 식품접객업정보: https://www.data.go.kr/data/15064859/openapi.do

네이버 지도 Directions 문서: https://api.ncloud-docs.com/docs/ai-naver-mapsdirections-driving

### 초기에는 더미로 유지할 데이터

- 항공 운임과 좌석
- KTX 운임과 좌석
- 숙소 객실과 가격
- 렌터카 재고와 가격
- 배편 운임과 차량 선적 재고

KTX도 초기에는 더미 견적이 맞습니다. 공식 또는 계약된 공급자 데이터가 준비되지 않은 상태에서 시간표나 운임을 사실처럼 보여주면 안 됩니다. 실제 연동 뒤에도 공급자 응답이 없으면 가격은 UNAVAILABLE로 표시하고, 임의 금액을 만들지 않습니다.

## 4. 위치와 행정구역

### 필수 API

- GET /api/v1/locations/regions?countryCode=KR
  - 대한민국 17개 시·도 반환
- GET /api/v1/locations/regions/{regionCode}/districts
  - 선택한 시·도의 시·군·구 반환
- GET /api/v1/locations/search?query=파주시&role=origin
  - 직접 입력한 출발지/도착지 검색
- GET /api/v1/locations/geocode?query=...
  - 주소와 장소명을 위도·경도로 변환

### Location 응답에 반드시 필요한 값

{
  id: kr-gyeonggi-paju,
  name: 파주시,
  region: 경기도,
  district: 파주시,
  countryCode: KR,
  regionCode: GYEONGGI,
  point: { latitude: 37.7599, longitude: 126.7805 },
  airportCodes: [GMP, ICN],
  administrativePath: [대한민국, 경기도, 파주시],
  placeType: DISTRICT,
  timezone: Asia/Seoul,
  source: 행정구역 기준 데이터,
  sourceUpdatedAt: 2026-08-27T00:00:00+09:00
}

직접 입력 장소는 좌표가 확정되기 전 needsGeocoding: true로 저장하고, 일정 생성 전에 반드시 지오코딩을 완료합니다.

## 5. 이동수단을 동적으로 판단하는 API

POST /api/v1/journey-options

입력: 출발지, 도착지, 출발일, 도착일, 인원

출력: 자차, KTX, 항공, 고속·시외버스, 배편 중 가능한 수단과 다음 단계를 반환합니다.

예시 응답:

{
  items: [
    {
      mode: FLIGHT,
      label: 항공,
      available: true,
      requiredSteps: [가는 편 선택, 오는 편 선택, 현지 이동수단 선택]
    },
    {
      mode: KTX,
      label: KTX,
      available: false,
      unavailableReason: 철도만으로 도착할 수 없어 항공 또는 배편 환승이 필요합니다.
    }
  ]
}

이 API가 있어야 프런트에 제주면 항공이라는 규칙을 넣지 않아도 됩니다. 자차로 도서 지역에 갈 때는 차량 선적 배편을 추가하고, 내륙 이동일 때는 유류비와 통행료를 계산합니다.

## 6. 지도·경로 API

POST /api/v1/routing/route

입력:

- origin, destination, waypoints
- mode
- departureAt, arrivalAt
- strategy: fastest, lowest_cost, balanced
- vehicle: 유종, 연비, 차종, 왕복 여부

출력:

- distanceKm
- durationMinutes
- tollFee
- fuelFee
- parkingFee
- polyline
- legs
- trafficObservedAt
- calculatedAt
- quoteExpiresAt
- assumptions

네이버 Directions는 시작과 목적지 좌표를 경도,위도 순서로 받습니다. 내부 DTO는 WGS84 latitude, longitude 순서로 유지하고, BFF 어댑터에서만 순서를 바꿉니다.

카카오 Local의 `x`는 경도, `y`는 위도이며 문자열입니다. 카카오 Mobility와 TMAP의 거리·시간은 각각 `m`, `sec`이므로 BFF 또는 `src/api/normalizers.js`에서 `km`, `minute`로 바꿉니다. 지도별 원본 필드를 화면 컴포넌트에 직접 전달하지 않습니다.

경유지는 공급자별 허용 개수가 다르므로 일정 전체를 한 요청에 넣지 않고, 인접 일정 사이를 leg 단위로 계산해 합칩니다. 응답에는 `dayIndex`, `fromEventId`, `toEventId`를 보존하면 드래그 후 어떤 구간을 다시 계산할지 안정적으로 식별할 수 있습니다.

## 7. 관광지와 식당의 신뢰성 규칙

### 관광지

POST /api/v1/tourism/spots

관광지 결과는 아래 조건을 만족해야 합니다.

- 한국관광공사 또는 지자체 관광 데이터의 원천 ID가 있음
- 이름, 주소, WGS84 좌표가 있음
- source와 sourceUpdatedAt이 있음
- 목적지와 반경 또는 이동 시간 조건에 맞음

### 식당

POST /api/v1/restaurants/search
POST /api/v1/restaurants/eligibility
GET /api/v1/restaurants/{placeId}

식당 자동 추천 규칙:

1. 상호명, 도로명·지번 주소, 좌표 반경으로 인허가 후보를 찾습니다.
2. 인허가 번호가 있으면 최우선으로 매칭합니다.
3. 인허가 번호가 없으면 상호명 정규화와 주소 일치도를 함께 사용합니다.
4. businessStatus가 OPEN이고 lastVerifiedAt이 허용 기간 안인 곳만 자동 추천합니다.
5. CLOSED 또는 UNKNOWN은 자동 일정에 절대 넣지 않습니다.
6. 매칭이 애매한 업소는 직접 선택만 허용하고 AI 추천 표시는 하지 않습니다.

RestaurantEligibility 응답에는 eligible, businessStatus, licenseNumber, lastVerifiedAt, source, sourceUpdatedAt, matchedBy, reasons를 넣습니다.

식당 카드를 누르면 상세 API를 호출합니다. 상세 응답은 안정적인 `placeId`, `name`, `address`, `point`, HTTPS `imageUrls`, `menus[]`, `rating`, `reviewCount`, `reviewSummary`, `reviewKeywords`, `businessHours`, `naverMapUrl`, `sourceLabel`, `refreshedAt`을 반환합니다. `menus[]`의 가격은 숫자 KRW로 정규화하고 대표 메뉴에는 `isSignature=true`를 지정합니다. 리뷰 원문을 브라우저가 직접 수집하지 않으며, 계약·이용 조건이 허용된 원천을 백엔드가 수집·요약해 제공합니다. 데이터가 없으면 빈 배열 또는 null을 반환하고 가짜 실데이터로 채우지 않습니다.

## 8. 견적 API

- POST /api/v1/offers/flights
- POST /api/v1/offers/ktx
- POST /api/v1/offers/ferries
- POST /api/v1/offers/lodging
- POST /api/v1/offers/rental-cars

모든 견적에는 아래 값을 넣습니다.

{
  id: offer-001,
  kind: flight,
  provider: 공급자명,
  title: 김포 → 제주,
  pricePerPerson: 79900,
  currency: KRW,
  isMock: true,
  priceStatus: MOCK,
  sourceLabel: 시연용 더미 데이터,
  refreshedAt: 2026-08-27T10:00:00+09:00,
  quoteExpiresAt: null
}

실제 공급자가 없으면 originalPricePerPerson, discountRate, remainingInventory를 내려주지 않습니다. 실제 근거 없이 특가, 할인율, 잔여석 문구를 표시하면 안 됩니다.

## 9. 비용 계산 API

POST /api/v1/costs/estimate

### 비용 구분

- 개인 비용: 항공, KTX, 배 승객운임, 식비, 체험비
- 공통 비용 N/1: 렌터카, 자차 유류비, 통행료, 주차비, 공용 객실, 차량 선적료

유류비 계산식:

유류비 = (장거리 이동 km + 현지 이동 km) ÷ 연비(km/L) × 유가(원/L)

1인 공통비 = ceil(공통비 총액 ÷ 인원)

오피넷 평균 유가는 `GET /api/v1/fuel-prices/average?fuelType=gasoline&regionCode=KR-49` BFF로 조회합니다. 오피넷 원본의 휘발유 `B027`, 경유 `D047`, LPG `K015`를 내부 `gasoline`, `diesel`, `lpg`로 매핑하고 `PRICE`는 원/L 숫자로 변환합니다. 인증키는 프런트에 전달하지 않습니다.

비용 응답에는 estimateId, total, perPerson, items, assumptions, isMock, calculatedAt을 넣습니다. 특히 유가 기준값/관측 시각, 통행료 기준값/관측 시각, 주차 산출 근거, 반올림 방식, N/1 분배 방식을 assumptions에 보관합니다.

숙소나 장소가 바뀌면 새 route, 새 estimateId, 새 revisionId를 만들어 반환합니다. 화면은 같은 estimateId의 결과를 메인과 일정 화면에 그대로 표시합니다.

## 10. 일정 생성 API

POST /api/v1/trips/plans
GET /api/v1/trips/plans/{planId}
POST /api/v1/trips/plans/{planId}/recalculate
POST /api/v1/trips/plans/{planId}/share

일정 생성 입력에는 다음이 필요합니다.

- 출발지/도착지의 좌표와 행정구역
- 여행 날짜와 출발·도착 제약 시간
- 인원
- 장거리 이동수단과 선택 견적
- 현지 이동수단
- 숙소 좌표와 체크인·체크아웃
- 사용자 테마와 여행 속도
- 고정 장소, 변경된 장소, 제외할 장소

일정 생성 규칙:

1. 교통편 도착 시간 이후에 첫 일정이 시작됩니다.
2. 숙소 체크인/체크아웃과 영업시간을 위반하지 않습니다.
3. 식당은 OPEN, 최근 검증, 이동 가능한 거리 조건을 모두 만족해야 합니다.
4. 장소를 바꾸면 이후 이동시간, 다음 장소, 비용, 지도 polyline을 다시 계산합니다.
5. 변경 전후 일정은 revisionId로 보관해 숙소, 식당, 관광, 액티비티별 변화 화면을 만들 수 있어야 합니다.

`/recalculate`는 `REPLACE_STOP` 또는 `REORDER_STOPS` 연산과 `baseRevisionId`를 받습니다. 서버는 새 `revisionId`, 전체 dayPlans, routes, costEstimate를 한 응답으로 반환해야 합니다. `baseRevisionId`가 최신이 아니면 409를 반환해 오래된 모바일/브라우저 탭이 최신 일정을 덮지 않게 합니다.

## 11. 환경변수와 보안

프런트 .env:

VITE_API_BASE_URL=
VITE_USE_MOCK=true

운영에서는 `VITE_USE_MOCK=false`와 HTTPS API 주소를 함께 설정합니다. `VITE_API_BASE_URL`이 없으면 운영 빌드는 같은 출처의 `/api` 리버스 프록시를 사용하므로 사용자 브라우저의 localhost를 호출하지 않습니다.

### 프런트 연결 상태

- `/api/v1/trips/plans`는 `VITE_USE_MOCK=false`에서 실제 일정 생성 흐름에 연결되어 있습니다.
- 위치, 경로, 관광·식당, 예약 견적, 비용, 유가 어댑터는 `src/api/index.js`의 `travelApi`로 제공됩니다.
- 현재 항공·숙박·렌터카 선택 모달의 최초 목록은 시연 카탈로그를 사용합니다. 공급자 계약이 끝나면 각 모달의 조회 시점에 `travelApi.booking`을 호출하고, 반환한 offer `id`를 일정 생성 요청에 전달해야 합니다.
- 일정 지도는 장소 좌표로 즉시 표시하며, 백엔드 route의 `deepLink`가 있으면 외부 길찾기 링크에 우선 적용합니다. 공급자 polyline을 앱 지도 위에 그리려면 카카오/TMAP 지도 SDK 렌더러를 별도로 연결해야 합니다.
- 식당 상세는 `contentApi.getRestaurantDetail`이 공통 DTO로 정규화합니다. 기본 `VITE_USE_MOCK=true`에서는 `TripBuddy 시연용 상세 데이터`가 표시되고, 운영에서는 반드시 `false`로 전환해 백엔드 상세 응답과 출처·갱신 시각을 사용합니다.

백엔드 환경변수 예시:

DATABASE_URL=
REDIS_URL=
JWT_SECRET=
NAVER_MAPS_API_KEY_ID=
NAVER_MAPS_API_KEY=
TMAP_APP_KEY=
KTO_SERVICE_KEY=
FOOD_SAFETY_SERVICE_KEY=
OFFER_PROVIDER_BASE_URL=
OFFER_PROVIDER_API_KEY=
ALLOWED_ORIGINS=http://127.0.0.1:5175,https://service.example.com

보안 원칙:

- 지도, 관광, 인허가, 제휴사 키는 브라우저·Git 저장소·Network 응답에 노출하지 않습니다.
- 외부 호출은 서버에서 timeout, retry, rate limit, circuit breaker를 둡니다.
- 공유 일정 링크는 추측 불가능한 토큰과 만료 시간을 사용합니다.
- CORS는 실제 프런트 도메인만 허용합니다.
- 외부 API 실패 시 provider, requestId, 마지막 성공 시각, 오류 코드를 로그로 남깁니다.

## 12. 캐시와 동기화

- 행정구역/시군구: 30일 캐시
- 관광지: 1일 캐시, 원천 updatedAt 보관
- 식당 인허가: 최소 일 1회 동기화 + 검색 응답에 최종 검증 시각 표시
- 지도 경로: 출발 시각을 고려해 5~15분 캐시
- 유가: 하루 단위 갱신, 지역·유종·관측 시각 저장
- 더미 견적: 시연 데이터 버전과 refreshedAt 표기

## 13. 백엔드 구현 순서

1. 위치, 행정구역, 위도·경도 API부터 연결합니다.
2. journey-options와 지도 경로 API를 연결해 교통수단을 동적으로 판단합니다.
3. 비용 계산 엔진을 연결하고 모든 화면이 하나의 CostEstimate만 사용하게 합니다.
4. 한국관광공사 관광지와 식당 인허가 검증을 연결합니다.
5. 일정 생성, 장소 변경, 숙소 변경의 revision API를 연결합니다.
6. 마지막에 항공, KTX, 숙소, 렌터카 견적 공급자만 단계적으로 실제 데이터로 교체합니다.

## 14. 최종 체크리스트

- 출발지와 도착지는 항상 latitude, longitude, regionCode를 가집니다.
- 직접 입력 장소는 지오코딩 실패 시 일정 생성을 막고 다시 입력받습니다.
- 도서 지역의 이동수단은 journey-options 결과를 따릅니다.
- 자동차/렌터카 비용은 거리, 연비, 유가, 통행료, 주차를 모두 표시합니다.
- 더미 가격에는 isMock과 안내 문구가 있습니다.
- 식당 자동 추천은 OPEN과 최근 검증 시각이 있을 때만 가능합니다.
- 관광지에는 원천 ID, 주소, 좌표, 출처, 갱신 시각이 있습니다.
- 메인 화면과 일정 화면은 동일한 estimateId의 1인 비용을 사용합니다.
- 숙소, 장소, 날짜, 인원, 교통수단을 바꾸면 새 route, estimate, revision을 만듭니다.
