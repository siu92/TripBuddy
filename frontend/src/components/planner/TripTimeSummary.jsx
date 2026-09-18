export default function TripTimeSummary({
  transportLabel,
  schedule,
  startTime,
  arrivalTime,
  endTime,
  onEdit,
}) {
  return (
    <div className="trip-time-summary transport-time-summary" aria-live="polite">
      <b>
        <small>{transportLabel}</small>
        {schedule.ready ? "여행 시간 확정" : "시간 선택 필요"}
      </b>
      {schedule.ready ? (
        <>
          <span>
            <em>가는 날</em>
            <strong>{startTime}</strong> 출발 <i>→</i>{" "}
            <strong>{arrivalTime}</strong> 현지 도착
          </span>
          <span>
            <em>오는 날</em>
            <strong>{endTime}</strong> 현지 출발 <i>→</i>{" "}
            <strong>{schedule.returnArrivalTime}</strong> 귀가 도착
          </span>
        </>
      ) : (
        <span>{schedule.reason}</span>
      )}
      <button type="button" onClick={onEdit}>
        시간·교통편 다시 선택
      </button>
    </div>
  );
}
