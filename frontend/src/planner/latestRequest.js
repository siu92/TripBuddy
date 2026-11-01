/**
 * 새 조회/조건 변경/언마운트 이후 도착한 응답이 화면 상태를 덮어쓰지 못하게 합니다.
 * 네트워크 취소와는 별개입니다. 항공 API의 공유 요청·캐시 소유권을 유지합니다.
 */
export function createLatestRequest() {
  let sequence = 0;
  return {
    begin() {
      const current = ++sequence;
      return () => current === sequence;
    },
    invalidate() {
      sequence += 1;
    },
  };
}
