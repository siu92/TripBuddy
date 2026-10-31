# 실행과 검증

## 환경

| 영역 | 준비 |
| --- | --- |
| 프론트엔드 | Node.js 24 LTS 권장, npm, `frontend/package-lock.json` |
| 백엔드 | JDK 21, 포함된 Gradle Wrapper |
| 실제 데이터 연동 | MariaDB, 필요에 따른 Redis, 외부 API 키 |
| 비동기 AI 생성 | 별도 API/Worker 실행, AWS 자격 증명·SQS·Bedrock 접근 권한 |

GitHub Pages의 `docs/`는 포트폴리오 사이트입니다. React 애플리케이션의 빌드 결과와 구분합니다.

## 프론트엔드

저장소 루트에서 PowerShell로 실행합니다.

```powershell
cd frontend
npm ci
Copy-Item .env.example .env.development.local
# .env.development.local의 API 주소와 Kakao JavaScript 키를 설정합니다.
npm run dev
```

API 주소·실제 지도 키를 설정하지 않은 상태에서도 첫 화면을 검토할 수 있지만, 로그인·지도·실제 일정 생성까지 연결되는 것은 아닙니다.

```powershell
npm test
npm run build
# 운영 API·지도 환경값을 준비한 뒤 별도 확인합니다.
npm run build:release
```

`npm test`는 `.test.mjs`와 `.test.cjs`를 모두 포함합니다. 운영 전용 `build:release`는 지도 키와 로컬 API 주소 혼입도 검사하므로 일반 빌드와 구분합니다.

## 백엔드

저장소 루트의 새 터미널에서 실행합니다.

```powershell
cd backend
Copy-Item .env.example .env.local
# DB·JWT·외부 API 값을 자신의 환경에 맞게 설정합니다.
.\gradlew.bat bootRun --args="--spring.profiles.active=local"
```

로컬 프로필은 `.env.local`을 읽습니다. 이 파일과 실제 키는 커밋하지 않습니다. `docker-compose.yml`은 로컬 Redis만 제공하며 DB·AWS까지 한 번에 준비하는 설정은 아닙니다.

테스트 프로필은 H2와 테스트용 설정을 사용합니다.

```powershell
.\gradlew.bat test --no-daemon "-Dspring.profiles.active=test"
```

macOS/Linux에서는 `./gradlew`를 사용합니다. 운영 DB나 AWS 환경에서 테스트를 실행하지 않습니다.

## 자동 검사와 실제 확인의 차이

[루트 CI](../.github/workflows/code-checks.yml)는 프론트 테스트·빌드와 백엔드 테스트를 실행합니다. AWS 로그인·이미지 업로드·EKS 변경은 하지 않습니다.

자동 검사 외에도 PC/모바일 입력, 저장 초안 복원, 결과 편집과 실패 상태를 확인해야 합니다. 실제 지도·인증·AWS 생성의 전체 연결은 유효한 실행 환경이 필요합니다. 테스트나 빌드 통과만으로 이를 모두 검증했다고 표현하지 않습니다.
