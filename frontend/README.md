# TripBuddy — AI 국내 여행 플래너

TripBuddy는 예산과 취향에 맞춰 국내 여행의 이동, 숙소, 음식점, 관광지를 한 번에 구성하는 React 기반 여행 플래너입니다. 발표 시나리오는 3명이 함께 떠나는 제주도 2박 3일 여행이며, 사용자가 선택한 조건과 현재 예산을 바탕으로 일정과 예상 경비를 구성합니다.

## 현재 구현 범위

- 출발지 행정구역과 현재 위치 선택
- 국내 대표 여행지와 세부 관광지 선택 및 직접 입력
- 출발일·도착일 달력과 기상청 기반 날씨 조회
- 자차, KTX, 항공, 시외버스 비교
- 왕복 항공편 검색·정렬·선택
- 여행지 내 렌터카 등 현지 이동 수단 선택
- 여행지와 가격대를 고려한 숙소 추천
- 여행 테마, 속도, 선호 음식 설정
- Amazon Bedrock Nova Lite 기반 AI 일정 생성
- 날짜별 일정, 카카오맵 이동 동선, 시간표, 상세 경비 확인
- 드래그 앤 드롭 일정 순서 변경
- 음식점 메뉴·후기 및 대체 장소 확인
- PC와 모바일 화면 지원
- PWA 설치 및 오프라인 자산 캐시

## 데이터 기준

TripBuddy는 가능한 범위에서 실제 장소와 공공 데이터를 사용합니다. 다만 제휴 계약이 필요한 가격과 예약 정보는 발표·시연을 위한 현실적인 예상값입니다.

- 날씨: 기상청 API 기반 데이터
- 항공편: 실제 국내선 운항 정보를 기반으로 구성하며, 운임은 제휴 없이 만든 예상 가격
- 숙소: 백엔드에 적재된 국내 숙소 데이터를 여행지와 가격대로 필터링
- 관광지·음식점·카페: 실제 장소와 백엔드 데이터를 우선 사용하고, 상세 정보 요청이 실패하면 시연용 대체 데이터 사용
- 렌터카: 실제 차량 유형을 참고한 시연용 업체·가격 데이터
- 자차 비용: 이동 거리, 평균 연비, 연료 종류와 유가 기준을 조합한 예상 비용

화면에 표시되는 금액은 일정 비교와 예산 판단을 돕는 예상치이며, 실제 예약 시점의 업체 가격과 다를 수 있습니다.

## 기술 구성

- React 19
- Vite 8
- Tailwind CSS 4
- `@hello-pangea/dnd`
- Kakao Maps JavaScript API
- Spring 백엔드 API
- Vite PWA

## 로컬 실행

Node.js와 백엔드를 먼저 실행한 뒤 프론트 폴더에서 다음 명령을 사용합니다.

```powershell
npm install
npm run dev
```

개발용 설정은 `.env.example`을 참고해 `.env.development.local`에 작성합니다.

```text
VITE_API_BASE_URL=http://localhost:8080
VITE_KAKAO_MAP_JS_KEY=발급받은_JavaScript_키
VITE_USE_MOCK=false
```

개인 키가 포함된 `.env.development.local`은 Git과 백업 파일에 포함하지 않습니다.

## 운영 빌드

운영 배포 전에는 `.env.production.local`에 카카오 JavaScript 키만 설정합니다. API 주소를 적지 않으면 CloudFront의 같은 주소 아래 `/api`를 사용합니다.

```text
VITE_KAKAO_MAP_JS_KEY=발급받은_JavaScript_키
VITE_USE_MOCK=false
```

```powershell
npm run build:release
```

빌드 결과는 `dist` 폴더에 생성됩니다. 운영 빌드에서는 로컬 개발 주소를 사용하지 않으며, 현재 CloudFront 주소의 `/api` 경로를 통해 백엔드에 연결합니다. 별도 API 도메인을 사용하는 환경이라면 빌드 전에 운영 전용 환경변수로 `VITE_API_BASE_URL`을 지정해야 합니다.

CloudFront에 배포할 때는 `dist`의 내용을 업로드하고, 이전 파일이 보이면 CloudFront 캐시 무효화를 진행합니다.

## 검증

```powershell
npm run build
node --test tests/*.test.mjs
```

현재 기준으로 운영 빌드와 프론트 자동 테스트 29개가 통과합니다. 제주 대표 명소 15곳의 일정 요청 이름과 좌표도 자동으로 검사합니다. `npm run build:release`는 운영 번들에 `localhost:8080`이 포함되거나 카카오 지도 키가 빠지면 실패하므로, 잘못된 파일이 배포되는 것을 사전에 차단합니다.

## 백엔드 연결

프론트 API 코드는 `src/api`에 있습니다.

- 로그인·세션: `authApi.js`, `apiClient.js`
- 날씨: `weatherApi.js`
- 항공편: `flightApi.js`
- 숙소: `accommodationApi.js`
- AI 일정: `tripPlanApi.js`
- 식당·카페 상세: `contentApi.js`

API 규격과 데이터 연결 설명은 `BACKEND_INTEGRATION_GUIDE.md`를 참고합니다. 렌터카와 일부 가격 데이터는 제휴 API가 없으므로 프론트의 활성 목업 데이터를 유지합니다.

숙소·관광지·식당·카페의 데이터 출처와 필터링 순서, 일정 생성 원리는 `RECOMMENDATION_DATA_LOGIC_KO.md`에 비전공자도 이해할 수 있는 표현으로 정리했습니다.

## 백업 복원

`Backup 파일`의 최신 ZIP을 원하는 위치에 압축 해제한 뒤 다음 순서로 복원합니다.

```powershell
npm install
npm run build:release
npm test
```

개인 환경값은 백업에 포함되지 않으므로 `.env.example`을 복사해 `.env.development.local`을 다시 작성합니다.
