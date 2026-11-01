import { useCallback, useEffect, useRef } from "react";
import { createLatestRequest } from "../planner/latestRequest.js";

/** 같은 조건의 재렌더는 유지하고 검색 조건 변경 시 진행 중 결과를 무효화합니다. */
export function useLatestPlannerRequest(conditions, setLoading) {
  const requestRef = useRef(null);
  if (!requestRef.current) requestRef.current = createLatestRequest();
  const requests = requestRef.current;
  const conditionKey = JSON.stringify(conditions);

  const invalidate = useCallback(() => {
    requests.invalidate();
    setLoading(false);
  }, [requests, setLoading]);

  useEffect(() => {
    invalidate();
    return () => requests.invalidate();
  }, [conditionKey, invalidate, requests]);

  return { begin: requests.begin, invalidate };
}
