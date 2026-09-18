import { durationToMinutes, timeToMinutes } from "../../data/mockData";

function formatFlightClock(value) {
  const match = String(value || "").match(/T(\d{2}:\d{2})/);
  return match?.[1] || null;
}

function dateTimeToMinutes(value) {
  const clock = formatFlightClock(value);
  return clock ? timeToMinutes(clock) : null;
}

function layoutTimetableEvents(events, { compact, hourHeight, startHour }) {
  const positioned = events.map((event, originalIndex) => {
    const [time, icon, name, detail, duration, travel, metadata = {}] = event;
    const flightStart = formatFlightClock(metadata.flightDepartureAt);
    const flightEnd = formatFlightClock(metadata.flightArrivalAt);
    const flightTime = flightStart && flightEnd ? `${flightStart} → ${flightEnd}` : null;
    const hasFlight = Boolean(metadata.flightLabel);
    const category = String(metadata.category || "").toUpperCase();
    const isAirport = String(metadata.type || "").toUpperCase() === "AIRPORT";
    const isArrivalAirport = category.includes("ARRIVAL_AIRPORT");
    const isDepartureAirport = isAirport && !isArrivalAirport && !hasFlight;
    const displayMinutes = hasFlight
      ? dateTimeToMinutes(metadata.flightDepartureAt)
        ?? dateTimeToMinutes(metadata.startAt)
        ?? timeToMinutes(time)
      : dateTimeToMinutes(metadata.startAt)
        ?? timeToMinutes(time);
    const rawTop = Math.max(0, ((displayMinutes - startHour * 60) / 60) * hourHeight);
    const displayClock = Number.isFinite(displayMinutes)
      ? `${String(Math.floor(displayMinutes / 60)).padStart(2, "0")}:${String(displayMinutes % 60).padStart(2, "0")}`
      : time;
    const flightDurationMinutes = Number(metadata.flightDurationMinutes);
    const normalDurationMinutes = durationToMinutes(duration);
    const shortHeight = compact ? 38 : 44;
    const standardHeight = compact ? 50 : 58;
    const featureHeight = compact ? 64 : 72;
    const height = isArrivalAirport || isDepartureAirport
      ? shortHeight
      : hasFlight && Number.isFinite(flightDurationMinutes) && flightDurationMinutes > 0
        ? featureHeight
        : normalDurationMinutes <= 35
          ? shortHeight
          : normalDurationMinutes <= 65
            ? standardHeight
            : featureHeight;

    return {
      originalIndex,
      time,
      icon,
      name,
      detail,
      duration,
      travel,
      metadata,
      flightTime,
      hasFlight,
      isAirport,
      isArrivalAirport,
      isDepartureAirport,
      displayMinutes,
      displayClock,
      rawTop,
      top: rawTop,
      height,
    };
  }).sort((a, b) => a.displayMinutes - b.displayMinutes || a.originalIndex - b.originalIndex);

  // 실제 시작 시각은 카드 안에 그대로 표시하되, 가까운 시각의 일정은
  // 카드가 겹치지 않도록 아래로 밀어 읽기 순서를 보존한다.
  let previousBottom = -Infinity;
  positioned.forEach((item) => {
    item.top = Math.max(item.rawTop, previousBottom + (compact ? 6 : 7));
    previousBottom = item.top + item.height;
  });

  return positioned;
}

function CampusTimetable({ activeDay = 0, compact = false, dates, dayPlans }) {
  const hourHeight = compact ? 60 : 68;
  const visibleDates = compact ? [dates[activeDay]].filter(Boolean) : dates;
  const visiblePlans = compact ? [dayPlans[activeDay]].filter(Boolean) : dayPlans;

  const eventTimes = visiblePlans
    .flatMap((day) => day?.[2] || [])
    .map(([time, , , , , , metadata = {}]) => {
      const hasFlight = Boolean(metadata.flightLabel);
      const category = String(metadata.category || "").toUpperCase();
      const isArrivalAirport = category.includes("ARRIVAL_AIRPORT");

      if (hasFlight) {
        return dateTimeToMinutes(metadata.flightDepartureAt) ?? timeToMinutes(time);
      }

      if (isArrivalAirport) {
        return dateTimeToMinutes(metadata.startAt) ?? timeToMinutes(time);
      }

      // backend TripPlan의 startAt을 모든 카드의 최우선 시간 기준으로 사용한다.
      // tuple time은 mock/legacy fallback으로만 남긴다.
      return dateTimeToMinutes(metadata.startAt) ?? timeToMinutes(time);
    })
    .filter((minutes) => Number.isFinite(minutes));

  // 기존 08:00 고정 시작 때문에 06~07시 공항/항공 카드가 같은 위치에 겹쳤다.
  // 이른 일정이 있으면 실제 첫 일정 시각부터 시간표를 시작한다.
  const earliestMinutes = eventTimes.length ? Math.min(...eventTimes) : 8 * 60;
  const startHour = Math.max(0, Math.min(8, Math.floor(earliestMinutes / 60)));
  const endHour = 23;
  const hours = Array.from(
    { length: Math.max(1, endHour - startHour + 1) },
    (_, index) => startHour + index,
  );
  const timetableHeight = hours.length * hourHeight;
  const timetableColumns = `62px repeat(${Math.max(1, visibleDates.length)}, minmax(210px, 1fr))`;

  return (
    <div
      className={`campus-timetable${compact ? " mobile-timetable" : ""}`}
      aria-label={compact ? `DAY ${activeDay + 1} 시간표` : `${dates.length}일 통합 시간표`}
    >
      <div className="timetable-top" style={{ gridTemplateColumns: timetableColumns }}>
        <span>TIME</span>
        {visibleDates.map((date, index) => (
          <b key={date}>
            DAY {compact ? activeDay + 1 : index + 1}
            <small>{date.slice(5).replace("-", ".")}</small>
          </b>
        ))}
      </div>
      <div
        className="timetable-content"
        style={{ minHeight: `${timetableHeight}px`, gridTemplateColumns: timetableColumns }}
      >
        <div
          className="timetable-hours"
          style={{ gridTemplateRows: `repeat(${hours.length}, ${hourHeight}px)` }}
        >
          {hours.map((hour) => (
            <span key={hour}>{String(hour).padStart(2, "0")}:00</span>
          ))}
        </div>
        {visiblePlans.map((day, dayIndex) => (
          <div
            className="timetable-day"
            key={day[0]}
            style={{ "--timetable-hour-height": `${hourHeight}px` }}
          >
            {hours.map((hour) => (
              <i key={hour} />
            ))}
            {layoutTimetableEvents(day[2], { compact, hourHeight, startHour }).map(({
              originalIndex, time, icon, name, duration, metadata, flightTime, hasFlight,
              isAirport, isArrivalAirport, isDepartureAirport, displayClock, top, height,
            }) => {
              const timingLabel = isArrivalAirport
                ? `${displayClock} · 도착`
                : isDepartureAirport
                  ? `${displayClock} · 수속·대기`
                : `${displayClock} · ${duration}`;

              return (
                <article
                  key={`${dayIndex}-${originalIndex}-${time}-${name}-${metadata.id || "event"}`}
                  className={`${hasFlight ? "has-flight " : ""}${isAirport ? "is-airport " : ""}${isArrivalAirport ? "is-arrival-airport " : ""}${isDepartureAirport ? "is-departure-airport" : ""}`.trim() || undefined}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    zIndex: hasFlight ? 4 : isAirport ? 3 : 1,
                  }}
                >
                  <span>{icon}</span>
                  <b>{name}</b>
                  {hasFlight && (
                    <em className="timetable-flight-label">
                      ✈ {metadata.flightLabel}
                    </em>
                  )}
                  <small>{hasFlight && flightTime ? flightTime : timingLabel}</small>
                </article>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CampusTimetable;
