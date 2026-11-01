# 여행 계획의 독립 기능

`hooks/useTripPlanner.js`에서 독립적으로 읽을 수 있는 변환·초안 처리 기능을 분리했습니다. 항공·숙소 조회 상태와 경비 스냅샷 effect는 [전용 훅](../hooks)에, 입력 변경에 따른 후속 선택 초기화와 일정 생성·편집 조율은 핵심 훅에 있습니다.

| 모듈 | 책임 | 읽을 때 주의할 계약 |
| --- | --- | --- |
| [flightCandidates](flightCandidates.js) | 항공 후보의 화면 카드·저장 요청 변환 | 편도 예상가와 기존 카드의 왕복 호환값 구분 |
| [preferences](preferences.js) | 취향 허용값·중복 제거·선택 수 제한 | 허용되지 않은 저장값 제거, 최대 3개 |
| [domainMappings](domainMappings.js) | 화면 코드 ↔ 서버 enum·연료/연비 추정 | `CASUAL` → `SNACK`, 차량 수치는 추정값 |
| [plannerStorage](plannerStorage.js) | 로컬 초안·경비 스냅샷 | 지난 날짜/역전 범위의 종속 선택 초기화, 서버 저장과 구분 |
| [planDraftEdits](planDraftEdits.js) | 화면의 순서·추가·제외 초안 | 재정렬 후 시간 재계산, 서버 payload는 별도 구성 |
| [tripCostModel](tripCostModel.js) | 1인/공동 경비·서버 견적·안내액 조정 | 공동 비용만 인원 분할, 일정의 예약 이벤트 중복 제외 |
| [latestRequest](latestRequest.js) | 조회 결과 적용 순서 제어 | 오래된 성공·실패·finally 모두 무시, 네트워크 캐시는 별도 유지 |

서버 통신은 [`src/api`](../api), 공통 계산은 [`src/utils`](../utils), 시연 데이터는 [`src/data`](../data)를 확인하세요.
