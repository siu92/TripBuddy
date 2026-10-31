# 배포 자료와 현재 실행 범위

## 공개 저장소의 자동 실행

[`code-checks.yml`](../../.github/workflows/code-checks.yml)은 테스트·빌드만 수행합니다. AWS 배포 단계와 운영 자격 증명은 사용하지 않습니다.

## 팀 배포 구성의 근거

| 자료 | 설명 |
| --- | --- |
| [Dockerfile](../../backend/Dockerfile) | 백엔드 이미지 구성 |
| [Kubernetes 설정](../../backend/k8s) | API·Worker·Service·Ingress 구성 |
| [비동기 생성 안내](../../backend/ASYNC_TRIP_PLAN.md) | API/Worker의 역할과 SQS 설정 |
| [기존 수동 배포 안내](../../backend/MANUAL_DEPLOY_KO.md) | 당시 팀 환경의 배포 절차 |
| [기존 팀 CI/CD 원문](backend-deploy.original.yml.example) | 기존 백엔드 단독 저장소용 파이프라인, 비활성 참고본 |

기존 CI/CD 원문은 테스트·SonarQube·이미지 검사·ECR·배포 설정을 포함합니다. 통합 저장소 루트에서 곧바로 실행할 수 있는 설정이 아니며, 팀 환경의 계정·권한·경로를 전제로 합니다. 따라서 `.github/workflows` 밖의 `.example` 파일로 보존했습니다.

실습용 AWS 환경은 종료됐습니다. 배포 자료를 다시 사용할 때는 대상 환경, `backend/` 작업 경로, 이미지 빌드 문맥, 역할·권한과 자원명을 새 환경에 맞춰 검토해야 합니다. 이 안내의 코드 정리 작업은 운영 AWS 자원을 변경하지 않습니다.

## 영상·발표자료

`docs/media/`의 시연 영상은 웹 포트폴리오의 직접 재생 주소에 연결되어 있어 이번 코드 정리에서는 옮기지 않았습니다. 기존 [Release](https://github.com/siu92/TripBuddy/releases/tag/demo-2026-10-02)에도 다운로드 자료가 있습니다. 향후 배포 위치를 바꾸려면 기존 주소 호환과 실제 재생을 먼저 검수해야 합니다.
