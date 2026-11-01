# 기능별 코드 지도

파일 전체를 순서대로 읽기보다 아래 관심 기능의 진입점부터 따라가시면 됩니다. 경로는 실제 소스에 연결되어 있습니다.

## 프론트엔드

| 관심 기능 | 진입점 | 이어서 읽을 코드 |
| --- | --- | --- |
| 화면 구성과 조건 입력 | [App.jsx](../frontend/src/App.jsx) | [여행 상태 조율](../frontend/src/hooks/useTripPlanner.js) |
| 초안 복원·로컬 경비 보존 | [plannerStorage.js](../frontend/src/planner/plannerStorage.js) | [훅에서 사용하는 위치](../frontend/src/hooks/useTripPlanner.js) |
| 항공·숙소 조회 상태 | [useFlightOptions](../frontend/src/hooks/useFlightOptions.js), [useStayOptions](../frontend/src/hooks/useStayOptions.js) | [오래된 응답 방지](../frontend/src/hooks/useLatestPlannerRequest.js) |
| 경비 모델·스냅샷 | [tripCostModel](../frontend/src/planner/tripCostModel.js) | [계산·저장 훅](../frontend/src/hooks/useTripCostEstimate.js) |
| 알림 수명 | [usePlannerNotice](../frontend/src/hooks/usePlannerNotice.js) | 연속 알림 타이머 교체와 언마운트 정리 |
| 항공 후보 표시와 저장 형식 | [flightCandidates.js](../frontend/src/planner/flightCandidates.js) | [항공 API](../frontend/src/api/flightApi.js), [항공 정렬](../frontend/src/utils/flightRanking.js) |
| UI 선택값 ↔ 서버 코드 | [domainMappings.js](../frontend/src/planner/domainMappings.js) | [취향 허용값](../frontend/src/planner/preferences.js) |
| 비동기 생성·응답 변환 | [tripPlanApi.js](../frontend/src/api/tripPlanApi.js) | [공통 인증·HTTP 처리](../frontend/src/api/apiClient.js) |
| 일정 편집 UI | [PlanFullscreen.jsx](../frontend/src/components/planner/PlanFullscreen.jsx) | [로컬 편집 초안](../frontend/src/planner/planDraftEdits.js) |
| 서버에 편집 저장 | [planEditPayload.js](../frontend/src/utils/planEditPayload.js) | [planEditorApi.js](../frontend/src/api/planEditorApi.js) |
| 예상 경비와 시간 | [costEstimate.js](../frontend/src/utils/costEstimate.js) | [travelSchedule.js](../frontend/src/data/travelSchedule.js) |
| 지도와 이동 경로 | [RouteMap.jsx](../frontend/src/components/planner/RouteMap.jsx) | [지도 로더](../frontend/src/lib/kakaoMap.js) |
| 모바일·반응형 | [useMediaQuery.js](../frontend/src/hooks/useMediaQuery.js) | [App.jsx](../frontend/src/App.jsx), [PlanFullscreen.jsx](../frontend/src/components/planner/PlanFullscreen.jsx) |

### 큰 파일의 읽는 순서

- **useTripPlanner:** 상태 초기화 → 저장/복원 effect → 후보·경비 계산 → 선택 처리 → 편집 저장 → 생성 → 저장 여행 복원 순서입니다. 파일의 번호 주석과 [분리 모듈 안내](../frontend/src/planner/README.md)를 함께 보세요.
- **tripPlanApi:** 먼저 `requestTripPlan`과 `getTripPlanStatus`를 읽고 `normalizeTripPlanResponse`에서 서버 응답이 화면 모델로 바뀌는 경계를 확인합니다.
- **App:** 상태와 콜백을 훅에서 받아 조건 입력·모달·결과 화면에 전달하는 조합 지점입니다.
- **index.css:** 공통 토큰과 전역 규칙이 누적된 파일입니다. 컴포넌트 전용 CSS는 해당 컴포넌트 옆에 있습니다. 뒤쪽 보정 규칙의 적용 순서를 보존해야 합니다.

## 백엔드

기준 패키지는 [`backend/src/main/java/com/travel`](../backend/src/main/java/com/travel)입니다.

| 관심 기능 | 진입점 | 이어서 읽을 코드 |
| --- | --- | --- |
| 여행 조건 생성·조회 | [TripController](../backend/src/main/java/com/travel/trip/controller/TripController.java) | [TripService](../backend/src/main/java/com/travel/trip/service/TripService.java) |
| 일정 생성 요청·상태 조회 | [TripPlanController](../backend/src/main/java/com/travel/trip/plan/controller/TripPlanController.java) | [TripPlanRequestService](../backend/src/main/java/com/travel/trip/plan/async/TripPlanRequestService.java) |
| API → SQS | [TripPlanQueuePublisher](../backend/src/main/java/com/travel/trip/plan/async/TripPlanQueuePublisher.java) | [SQS 설정](../backend/src/main/java/com/travel/global/config/SqsConfig.java) |
| Worker의 실제 생성 | [TripPlanWorker](../backend/src/main/java/com/travel/trip/plan/async/TripPlanWorker.java) | [TripPlanService](../backend/src/main/java/com/travel/trip/plan/service/TripPlanService.java) |
| 후보 선별·AI 결과 검증 | [TripPlanCandidateService](../backend/src/main/java/com/travel/trip/plan/service/TripPlanCandidateService.java) | [TripPlanBedrockService](../backend/src/main/java/com/travel/trip/plan/service/TripPlanBedrockService.java) |
| 시간·빈 구간 후처리 | [TripPlanSchedulePostProcessor](../backend/src/main/java/com/travel/trip/plan/service/TripPlanSchedulePostProcessor.java) | [실제 경로 연동](../backend/src/main/java/com/travel/routing/service/RoutingService.java) |
| 편집 검증·저장 | [PlanEditController](../backend/src/main/java/com/travel/trip/plan/edit/PlanEditController.java) | [PlanEditService](../backend/src/main/java/com/travel/trip/plan/edit/PlanEditService.java) |
| 인증과 공통 예외 | [SecurityConfig](../backend/src/main/java/com/travel/global/config/SecurityConfig.java) | [공통 예외 처리](../backend/src/main/java/com/travel/global/exception/GlobalExceptionHandler.java) |

### TripPlanService의 책임

`createPlan` → 후보 구성 → 모델 제안 → 일정 조립 → 실제 경로·시간 보정 → 항공 귀환 마감 검증 → 일정·이동 구간 저장으로 읽습니다. `persistEditedPlan`은 AI를 새로 호출하는 경로가 아니라 변경한 날짜를 반영하는 경로입니다.

## 테스트·배포·포트폴리오

| 분류 | 위치 | 용도 |
| --- | --- | --- |
| 프론트 회귀 검사 | [frontend/tests](../frontend/tests) | API 변환·생성 polling·일정 시간·경비·편집 계약 |
| 백엔드 검사 | [backend/src/test](../backend/src/test) | 서비스·정책·편집·캐시 등의 검사 |
| 통합 저장소 CI | [code-checks.yml](../.github/workflows/code-checks.yml) | 테스트·빌드만 수행, AWS 배포 없음 |
| 컨테이너·K8s | [Dockerfile](../backend/Dockerfile), [k8s](../backend/k8s) | 팀 배포 구성의 실행 설정 |
| 웹 포트폴리오 | [docs/index.html](../docs/index.html) | GitHub Pages 설명·영상·발표자료 |
