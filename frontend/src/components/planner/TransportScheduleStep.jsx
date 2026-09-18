import { Clock3 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { dateLabel, money } from "../../data/mockData";
import { normalizeTypedTime } from "../../data/travelSchedule";
import "./transport-schedule.css";

function TimePopoverInput({ value, onChange, label }) {
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const options = useMemo(() => Array.from({ length: 36 }, (_, index) => {
    const minutes = 6 * 60 + index * 30;
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  }), []);

  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeWithEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [open]);

  const updateDraft = (rawValue) => {
    const formatted = normalizeTypedTime(rawValue);
    setDraft(formatted);
    if (/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(formatted)) onChange(formatted);
  };

  return (
    <div className="time-popover-field" ref={rootRef}>
      <div className="time-input-shell">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          required
          pattern={"(?:[01]\\d|2[0-3]):[0-5]\\d"}
          value={draft}
          aria-label={label}
          aria-haspopup="listbox"
          aria-expanded={open}
          placeholder="예: 1830"
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(event) => updateDraft(event.target.value)}
          onBlur={() => {
            if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft)) setDraft(value);
          }}
        />
        <button type="button" aria-label={`${label} 목록 열기`} onClick={() => setOpen((current) => !current)}><Clock3 size={18} /></button>
      </div>
      {open && (
        <div className="time-option-popover" role="listbox" aria-label={`${label} 30분 단위 선택`}>
          <p><b>시간 선택</b><small>30분 단위 · 직접 입력 가능</small></p>
          <div>
            {options.map((time) => (
              <button type="button" role="option" aria-selected={time === value} className={time === value ? "selected" : ""} onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(time); setDraft(time); setOpen(false); }} key={time}>{time}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ManualTravelTimeStep({ startDate, endDate, startTime, endTime, estimatedMinutes, onConfirm, onBack }) {
  const [departure, setDeparture] = useState(startTime || "09:00");
  const [arrival, setArrival] = useState(endTime || "18:00");
  const [error, setError] = useState("");
  return <>
    <h3 id="ai-transport-title">자차로 언제 출발하고<br />언제 돌아오실까요?</h3>
    <span>출발일에는 출발지에서 떠나는 시각을, 마지막 날에는 출발지로 돌아올 시각을 선택해 주세요.</span>
    <form className="manual-travel-times" onSubmit={(event) => { event.preventDefault(); setError(onConfirm({ startTime: departure, endTime: arrival }) || ""); }}>
      <label><b>출발 시간</b><small>{dateLabel(startDate)} · 출발지에서 출발</small><TimePopoverInput label="출발 시간" value={departure} onChange={setDeparture} /></label>
      <label><b>도착 시간</b><small>{dateLabel(endDate)} · 출발지로 귀가</small><TimePopoverInput label="도착 시간" value={arrival} onChange={setArrival} /></label>
      <p>편도 약 {Math.floor(estimatedMinutes / 60)}시간 {estimatedMinutes % 60}분의 이동 여유를 반영해요. 거리 기준 예상치이며 실제 교통 상황에 따라 달라질 수 있어요.</p>
      {error ? <p className="transport-time-error" role="alert">{error}</p> : null}
      <button type="submit" className="car-detail-complete">시간 확정하고 차량 정보 입력 →</button>
    </form>
    <button type="button" className="modal-back" onClick={onBack}>← 이동수단 다시 고르기</button>
  </>;
}

export function TicketScheduleStep({ mode, leg, tickets, startDate, endDate, origin, destination, selectedOutbound, onSelect, onBack }) {
  const isOut = leg === "outbound";
  const label = mode === "KTX" ? "KTX" : "고속·시외버스";
  return <>
    <h3 id="ai-transport-title">{dateLabel(isOut ? startDate : endDate)}<br />{label} {isOut ? "가는 편" : "오는 편"}을 골라주세요.</h3>
    <span>{isOut ? `${origin} → ${destination}` : `${destination} → ${origin}`} · {isOut ? "1 / 2" : "2 / 2"}</span>
    <p className="transport-ticket-notice">시연용 시간표·견적입니다. 실제 운행 시간과 요금은 예약 시 확인해 주세요.</p>
    {!isOut && selectedOutbound ? <p className="transport-ticket-selected">가는 편 선택 완료 · {selectedOutbound.out}</p> : null}
    <div className="transport-ticket-list">
      {tickets.map((ticket) => <button type="button" key={ticket.id} onClick={() => onSelect(ticket.id)}>
        <span><b>{ticket.name}</b><strong>{isOut ? ticket.out : ticket.back}</strong></span>
        <span><b>{money(ticket.fare)}원</b><small>편도 · 1인</small></span>
      </button>)}
    </div>
    <button type="button" className="modal-back" onClick={onBack}>← 이동수단 다시 고르기</button>
  </>;
}
