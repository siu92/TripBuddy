import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudRain,
  CloudSun,
  Clock3,
  Info,
  Sun,
} from "lucide-react";
import "./travel-date-picker.css";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const WEATHER_VARIANTS = [
  { kind: "sunny", label: "맑음", highOffset: 4, lowOffset: -3 },
  { kind: "partly", label: "구름 조금", highOffset: 2, lowOffset: -4 },
  { kind: "cloudy", label: "흐림", highOffset: 0, lowOffset: -5 },
  { kind: "rain", label: "비", highOffset: -2, lowOffset: -6 },
];

const toIsoDate = (year, month, day) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const parseIsoDate = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
};

const formatIsoDate = (date) =>
  toIsoDate(date.getFullYear(), date.getMonth(), date.getDate());

const getToday = () => {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
};

const addMonths = (date, amount) =>
  new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);

const daysBetween = (from, to) => {
  const start = parseIsoDate(from);
  const end = parseIsoDate(to);
  if (!start || !end) return 0;
  return Math.round((end - start) / 86_400_000);
};

const dateHash = (value) =>
  String(value)
    .split("")
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);

const getWeatherMock = (value, forecastBaseDate) => {
  const forecastDay = daysBetween(forecastBaseDate, value);
  // 기상청 단기 예보 범위처럼 오늘부터 10일까지만 mock 데이터를 보여줍니다.
  if (forecastDay < 0 || forecastDay > 9) return null;

  const variant = WEATHER_VARIANTS[dateHash(value) % WEATHER_VARIANTS.length];
  const seasonalBase = Math.round(17 + Math.sin((parseIsoDate(value)?.getMonth() ?? 0) / 11 * Math.PI) * 12);
  const high = seasonalBase + variant.highOffset + (dateHash(value) % 3);
  const low = high + variant.lowOffset;
  return { ...variant, high, low };
};

const getWeatherIcon = (weather, size = 15) => {
  if (!weather) return null;
  const iconProps = { size, strokeWidth: 2.2, "aria-hidden": true };
  if (weather.kind === "sunny") return <Sun {...iconProps} />;
  if (weather.kind === "partly") return <CloudSun {...iconProps} />;
  if (weather.kind === "rain") return <CloudRain {...iconProps} />;
  return <Cloud {...iconProps} />;
};

const formatDateLabel = (value, fallback = "날짜를 선택해 주세요") => {
  const date = parseIsoDate(value);
  if (!date) return fallback;
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`;
};

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 ? "30" : "00";
  return `${String(hour).padStart(2, "0")}:${minute}`;
});

function MonthGrid({
  month,
  minDate,
  startDate,
  endDate,
  forecastBaseDate,
  onDateSelect,
}) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1, 12).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, index) => {
    if (index < firstDay) return null;
    return toIsoDate(year, monthIndex, index - firstDay + 1);
  });

  return (
    <section className="travel-date-picker__month" aria-label={`${year}년 ${monthIndex + 1}월`}>
      <h3>{year}년 {monthIndex + 1}월</h3>
      <div className="travel-date-picker__weekdays" aria-hidden="true">
        {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="travel-date-picker__days">
        {cells.map((value, index) => {
          if (!value) return <span className="travel-date-picker__blank" key={`blank-${index}`} />;

          const date = parseIsoDate(value);
          const day = date.getDate();
          const disabled = value < minDate;
          const isStart = value === startDate;
          const isEnd = value === endDate;
          const inRange = Boolean(startDate && endDate && value > startDate && value < endDate);
          const weather = getWeatherMock(value, forecastBaseDate);
          const dayClass = [
            "travel-date-picker__day",
            disabled ? "is-disabled" : "",
            isStart ? "is-start" : "",
            isEnd ? "is-end" : "",
            inRange ? "is-in-range" : "",
          ].filter(Boolean).join(" ");

          return (
            <button
              className={dayClass}
              type="button"
              key={value}
              disabled={disabled}
              onClick={() => onDateSelect(value)}
              aria-label={`${value} ${weather ? `${weather.label}, 최고 ${weather.high}도 최저 ${weather.low}도` : "날씨 정보 없음"}${isStart ? ", 출발일" : ""}${isEnd ? ", 도착일" : ""}`}
            >
              <span className="travel-date-picker__day-number">{day}</span>
              {weather ? (
                <span className={`travel-date-picker__weather is-${weather.kind}`} title={`Mock 예보 · ${weather.label}`}>
                  {getWeatherIcon(weather)}
                  <small>{weather.high}°/{weather.low}°</small>
                </span>
              ) : <span className="travel-date-picker__weather-placeholder" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/**
 * 기상청 API 연결 전에도 사용할 수 있는, 일정 범위 선택용 날짜 컴포넌트입니다.
 * 날씨 데이터는 오늘부터 10일까지만 결정론적 mock 값으로 보여주며, API 응답으로
 * 교체할 때에는 getWeatherMock 반환값 자리에 일자별 예보 객체를 연결하면 됩니다.
 */
export default function TravelDatePicker({
  startDate = "",
  endDate = "",
  onStartDateChange,
  onEndDateChange,
  travelers,
  onNeedTravelers,
  startTime = "09:00",
  endTime = "18:00",
  onStartTimeChange,
  onEndTimeChange,
  minDate = getToday(),
  title = "여행 날짜와 시간을 선택하세요",
  description = "출발일과 도착일을 고르면 여행 기간과 이동 기준 시간을 함께 잡을 수 있어요.",
  className = "",
}) {
  const safeMinDate = minDate || getToday();
  const firstSelectedDate = parseIsoDate(startDate) || parseIsoDate(safeMinDate) || new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(firstSelectedDate.getFullYear(), firstSelectedDate.getMonth(), 1, 12),
  );
  const [selectionTarget, setSelectionTarget] = useState(startDate ? "end" : "start");
  const hasTimeControls = typeof onStartTimeChange === "function" || typeof onEndTimeChange === "function";
  const minimumMonth = new Date(
    (parseIsoDate(safeMinDate) || new Date()).getFullYear(),
    (parseIsoDate(safeMinDate) || new Date()).getMonth(),
    1,
    12,
  );
  const isPreviousDisabled = visibleMonth <= minimumMonth;
  const tripNights = useMemo(() => Math.max(0, daysBetween(startDate, endDate)), [startDate, endDate]);

  const requestTravelersIfNeeded = () => {
    if (travelers) return false;
    if (typeof onNeedTravelers === "function") onNeedTravelers();
    return true;
  };

  useEffect(() => {
    if (!startDate) setSelectionTarget("start");
    else if (!endDate) setSelectionTarget("end");
  }, [startDate, endDate]);

  const selectDate = (value) => {
    if (requestTravelersIfNeeded()) return;

    if (!startDate || selectionTarget === "start") {
      onStartDateChange?.(value);
      if (endDate && endDate <= value) onEndDateChange?.("");
      setSelectionTarget("end");
      return;
    }

    if (value <= startDate) {
      onStartDateChange?.(value);
      onEndDateChange?.("");
      setSelectionTarget("end");
      return;
    }

    onEndDateChange?.(value);
  };

  return (
    <section className={`travel-date-picker ${className}`.trim()} aria-label="여행 날짜 선택">
      <div className="travel-date-picker__header">
        <div>
          <span className="travel-date-picker__eyebrow"><CalendarDays size={14} aria-hidden="true" /> 여행 일정</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="travel-date-picker__mock-badge"><CloudSun size={14} aria-hidden="true" /> 날씨 mock</span>
      </div>

      <div className="travel-date-picker__selection-summary" aria-live="polite">
        <button
          className={`travel-date-picker__summary-card ${startDate ? "is-filled" : ""} ${selectionTarget === "start" ? "is-target" : ""}`}
          type="button"
          aria-pressed={selectionTarget === "start"}
          onClick={() => {
            if (requestTravelersIfNeeded()) return;
            setSelectionTarget("start");
            const selected = parseIsoDate(startDate);
            if (selected) setVisibleMonth(new Date(selected.getFullYear(), selected.getMonth(), 1, 12));
          }}
        >
          <span>출발</span>
          <b>{formatDateLabel(startDate, "출발일을 선택해 주세요")}</b>
        </button>
        <ArrowRight className="travel-date-picker__summary-arrow" size={22} aria-hidden="true" />
        <button
          className={`travel-date-picker__summary-card ${endDate ? "is-filled" : ""} ${selectionTarget === "end" ? "is-target" : ""}`}
          type="button"
          aria-pressed={selectionTarget === "end"}
          onClick={() => {
            if (requestTravelersIfNeeded()) return;
            setSelectionTarget("end");
            const selected = parseIsoDate(endDate);
            if (selected) setVisibleMonth(new Date(selected.getFullYear(), selected.getMonth(), 1, 12));
          }}
        >
          <span>도착</span>
          <b>{formatDateLabel(endDate)}</b>
        </button>
        <div className="travel-date-picker__range-caption">
          {endDate ? <><strong>{tripNights}박 {tripNights + 1}일</strong><span>선택됨</span></> : <><strong>날짜를 이어 선택</strong><span>출발일 → 도착일</span></>}
        </div>
      </div>

      {!travelers ? (
        <button className="travel-date-picker__traveler-notice" type="button" onClick={onNeedTravelers}>
          <Info size={17} aria-hidden="true" />
          <span><b>인원을 먼저 선택해 주세요.</b> 인원 선택 후 출발일과 도착일을 정할 수 있어요.</span>
        </button>
      ) : null}

      <div className="travel-date-picker__calendar-toolbar">
        <div>
          <b>{selectionTarget === "start" ? "출발일을 선택해 주세요" : startDate && !endDate ? "도착일을 선택해 주세요" : "달력에서 여행 기간을 선택하세요"}</b>
          <span>오늘부터 10일 이내 날짜에는 날씨 mock 예보를 표시해요.</span>
        </div>
        <div className="travel-date-picker__month-controls" aria-label="달력 월 이동">
          <button
            type="button"
            aria-label="이전 달"
            disabled={isPreviousDisabled}
            onClick={() => setVisibleMonth((month) => addMonths(month, -1))}
          ><ChevronLeft size={19} /></button>
          <strong>{visibleMonth.getFullYear()}년 {visibleMonth.getMonth() + 1}월</strong>
          <button type="button" aria-label="다음 달" onClick={() => setVisibleMonth((month) => addMonths(month, 1))}><ChevronRight size={19} /></button>
        </div>
      </div>

      <div className="travel-date-picker__calendar" aria-live="polite">
        <MonthGrid
          month={visibleMonth}
          minDate={safeMinDate}
          startDate={startDate}
          endDate={endDate}
          forecastBaseDate={safeMinDate}
          onDateSelect={selectDate}
        />
        <MonthGrid
          month={addMonths(visibleMonth, 1)}
          minDate={safeMinDate}
          startDate={startDate}
          endDate={endDate}
          forecastBaseDate={safeMinDate}
          onDateSelect={selectDate}
        />
      </div>

      {hasTimeControls ? (
        <div className="travel-date-picker__time-panel">
          <div className="travel-date-picker__time-field">
            <span><Clock3 size={16} aria-hidden="true" /> 출발 시간</span>
            <select value={startTime} onChange={(event) => onStartTimeChange?.(event.target.value)} aria-label="출발 시간">
              {timeOptions.map((time) => <option value={time} key={time}>{time}</option>)}
            </select>
          </div>
          <ArrowRight size={19} aria-hidden="true" />
          <div className="travel-date-picker__time-field">
            <span><Clock3 size={16} aria-hidden="true" /> 귀가 시간</span>
            <select value={endTime} onChange={(event) => onEndTimeChange?.(event.target.value)} aria-label="귀가 시간">
              {timeOptions.map((time) => <option value={time} key={time}>{time}</option>)}
            </select>
          </div>
          <p>자차·항공·KTX 등 선택한 이동수단의 시간 계산 기준으로 사용됩니다.</p>
        </div>
      ) : null}
    </section>
  );
}
