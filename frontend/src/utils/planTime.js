// API의 날짜·시간은 한국 현지 시각이므로 브라우저 시간대로 변환하지 않습니다.
export function planClock(value) {
  return (
    String(value || "").match(/(?:T|^)(\d{2}:\d{2})/)?.[1] ?? null
  );
}

export function eventClock(time, metadata = {}) {
  return (
    planClock(metadata.startAt) ??
    (metadata.type === "FLIGHT"
      ? planClock(metadata.flightDepartureAt)
      : null) ??
    time
  );
}

export function eventMinutes(time, metadata = {}) {
  const [hours, minutes] = String(
    eventClock(time, metadata) || "",
  )
    .split(":")
    .map(Number);

  return Number.isFinite(hours) && Number.isFinite(minutes)
    ? hours * 60 + minutes
    : null;
}