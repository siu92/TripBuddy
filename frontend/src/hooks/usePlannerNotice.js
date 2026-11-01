import { useCallback, useEffect, useRef, useState } from "react";

/** 연속 알림에서는 이전 타이머를 취소해 최신 메시지가 일찍 사라지지 않게 합니다. */
export function usePlannerNotice() {
  const [message, setMessage] = useState("");
  const timer = useRef(null);
  const notify = useCallback((text) => {
    clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(""), 2600);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);
  return { message, notify };
}
