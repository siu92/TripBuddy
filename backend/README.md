# TripBuddy 백엔드

예산·취향·교통·숙소 조건에서 실제 장소 후보를 선별하고, AI 일정 생성·검증·편집·경비 계산을 처리하는 팀 백엔드입니다. 저는 프론트엔드와 PM을 맡아 요청·응답과 처리 상태를 담당자와 맞추고 화면에 연결했습니다.

**[전체 프로젝트](../README.md) · [전체 구조](../guide/ARCHITECTURE.md) · [코드 지도](../guide/CODE_MAP.md) · [실행 방법](../guide/DEVELOPMENT.md)**

## 먼저 읽을 흐름

```text
TripPlanController
  → TripPlanRequestService → SQS
  → TripPlanWorker → TripPlanService
  → 후보 선별 → Bedrock 제안·검증 → 경로·시간 보정 → 저장
```

| 기능 | 핵심 코드 |
| --- | --- |
| 생성 요청·조회 | [controller](src/main/java/com/travel/trip/plan/controller), [async](src/main/java/com/travel/trip/plan/async) |
| 생성·검증·후처리 | [plan/service](src/main/java/com/travel/trip/plan/service) |
| 일정 수정·revision 검증 | [plan/edit](src/main/java/com/travel/trip/plan/edit) |
| 장소·숙소·항공 추천 | [attraction](src/main/java/com/travel/attraction), [restaurant](src/main/java/com/travel/restaurant), [cafe](src/main/java/com/travel/cafe), [accommodation](src/main/java/com/travel/accommodation), [flight](src/main/java/com/travel/flight) |
| 외부 API·AI 클라이언트 | [external](src/main/java/com/travel/external) |
| 경로·이동비 | [routing](src/main/java/com/travel/routing), [trip/service](src/main/java/com/travel/trip/service) |
| 보안·캐시·오류 | [global](src/main/java/com/travel/global) |

## 폴더 역할

```text
backend/
├─ src/main/java/com/travel/  도메인별 API·서비스·저장소
├─ src/main/resources/       실행 프로필·환경변수 참조
├─ src/test/                 JUnit·H2 테스트 설정
├─ k8s/                      API·Worker 배포 구성
├─ scripts/                  당시 팀 환경의 수동 작업 도구
├─ Dockerfile                컨테이너 이미지
└─ build.gradle              Java 21·Spring Boot·테스트 구성
```

## 분야별 상세 자료

아래 문서는 설계와 시행착오를 보존한 자료입니다. 처음 읽을 때는 위 코드 지도와 현재 [실행 안내](../guide/DEVELOPMENT.md)를 먼저 보시면 됩니다.

| 분류 | 자료 |
| --- | --- |
| AI·비동기 설계 | [API/Worker와 SQS](ASYNC_TRIP_PLAN.md), [사용자 프롬프트 연동](USER_PROMPT_BEDROCK_INTEGRATION.md) |
| 편집·데이터 연동 | [Redis·편집 안내](SCHEDULE_EDIT_REDIS_GUIDE_KO.md), [오피넷](OPINET_INTEGRATION_KO.md) |
| 일정 품질 개선 기록 | [Bedrock 품질](BEDROCK_SCHEDULE_QUALITY_FIX.md), [일정 완성도](SCHEDULE_COMPLETION_FIX_KO.md), [항공 경로](FLIGHT_PATH_FIX.md) |
| 테스트 품질 기록 | [커버리지](SONAR_COVERAGE_FIX_KO.md), [품질 게이트](SONAR_QUALITY_GATE_FIX_KO.md) |
| 배포·운영 | [현재 범위와 참고 설정](../guide/operations/README.md), [당시 수동 배포](MANUAL_DEPLOY_KO.md) |

## 실행

JDK 21과 MariaDB를 준비하고 `.env.example`을 `.env.local`로 복사해 값을 설정합니다. AI 생성에는 SQS·Bedrock 권한과 별도 Worker 실행이 추가로 필요합니다.

```powershell
.\gradlew.bat bootRun --args="--spring.profiles.active=local"
.\gradlew.bat test --no-daemon "-Dspring.profiles.active=test"
```

공개 저장소 CI는 검사만 수행합니다. 과거 팀 배포 파이프라인은 비활성 참고본으로 분리했습니다. [배포 안내](../guide/operations/README.md)
