import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Fuel,
  MapPin,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import "./rental-comparison-modal.css";

const FILTERS = [
  { id: "ALL", label: "전체 차량" },
  { id: "COMPACT", label: "경차·소형" },
  { id: "SEDAN", label: "준중형·세단" },
  { id: "SUV", label: "SUV·전기차" },
];

const categoryFor = (rental) => {
  const value = `${rental.car} ${rental.category || ""}`;
  if (/SUV|전기/.test(value)) return "SUV";
  if (/경차|소형|레이/.test(value)) return "COMPACT";
  return "SEDAN";
};

const specValue = (specs, index, fallback) => {
  const values = String(specs || "").split("·").map((value) => value.trim());
  return values[index] || fallback;
};

export default function RentalComparisonModal({
  rentals,
  selectedId,
  selectedFlight,
  arrivalTime,
  departureTime,
  money,
  timeLabel,
  onChoose,
  onClose,
  onBackToFlight,
}) {
  const [filter, setFilter] = useState("ALL");
  const [sort, setSort] = useState("recommended");
  const filtered = useMemo(() => {
    const visible = filter === "ALL" ? rentals : rentals.filter((item) => categoryFor(item) === filter);
    return [...visible].sort((a, b) => sort === "price" ? a.price - b.price : Number(b.score) - Number(a.score));
  }, [filter, rentals, sort]);
  const lowestPrice = Math.min(...rentals.map((item) => item.price));

  return (
    <div className="ai-modal-backdrop" role="presentation">
      <section className="ai-modal rental-modal rental-premium-modal" role="dialog" aria-modal="true" aria-labelledby="rental-modal-title">
        <button
          type="button"
          className="modal-close rental-modal-close"
          onClick={onClose}
          aria-label="렌터카 비교 닫기"
          title="닫기"
        >
          <X size={19} strokeWidth={1.8} aria-hidden="true" />
        </button>

        <header className="rental-premium-head">
          <p>✦ TripBuddy AI · JEJU CAR MATCH</p>
          <div className="journey-chip">
            <span>제주공항</span><i>→</i><b>제주 전역</b><em>48시간 비교</em>
          </div>
          <h3 id="rental-modal-title">제주 여행에 맞는<br />차량을 비교해 보세요.</h3>
          <span>{selectedFlight ? `${selectedFlight.airline} 도착 시간에 맞춰 ` : ""}제주 도착 {timeLabel(arrivalTime)} · 출발 {timeLabel(departureTime)} 기준의 총 대여료예요.</span>
        </header>

        <section className="rental-trust-bar" aria-label="검색 조건">
          <div><MapPin size={17} /><span><small>인수·반납</small><b>제주공항 렌터카하우스</b></span></div>
          <div><span><small>대여 기간</small><b className="rental-number">2박 3일 · 48시간</b></span></div>
          <div><ShieldCheck size={17} /><span><small>비교 기준</small><b>보험 포함 총액</b></span></div>
        </section>

        <section className="rental-recommendation">
          <Sparkles size={18} />
          <span><small>TRIPBUDDY PICK</small><b>최저가만 보지 말고 보험 면책금과 공항 셔틀 시간을 함께 확인하세요.</b></span>
          <strong><small>총 대여료 최저</small><b className="rental-number">{money(lowestPrice)}원</b></strong>
        </section>

        <div className="rental-toolbar">
          <div className="rental-filter-list" role="group" aria-label="차종 필터">
            {FILTERS.map((item) => <button key={item.id} type="button" className={filter === item.id ? "active" : ""} onClick={() => setFilter(item.id)}>{filter === item.id && <Check size={13} />}{item.label}</button>)}
          </div>
          <label className="rental-sort"><span>정렬</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recommended">추천순</option><option value="price">낮은 가격순</option></select><ChevronDown size={15} /></label>
        </div>

        <div className="rental-result-count"><b>{filtered.length}개 상품</b><span>세금·기본 보험을 포함한 48시간 총액</span></div>
        <div className="rental-offer-list">
          {filtered.map((rental, index) => {
            const selected = rental.id === selectedId;
            const seats = specValue(rental.specs, 0, "5인승");
            const transmission = specValue(rental.specs, 1, "자동");
            const luggage = specValue(rental.specs, 2, "캐리어 3개");
            return (
              <article key={rental.id} className={`rental-offer-card${selected ? " selected" : ""}`}>
                <div className="rental-offer-image">
                  <img
                    src={rental.image}
                    alt={`${rental.car} 대표 차종`}
                    loading={index < 2 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={index === 0 ? "high" : "auto"}
                  />
                  <span>{index === 0 ? "추천 1순위" : rental.badge}</span>
                  <small>대표 차종 또는 동급</small>
                </div>
                <div className="rental-offer-main">
                  <div className="rental-company-row"><span><b>{rental.company}</b><small>★ {rental.score} · 후기 {money(rental.reviews)}개</small></span>{rental.cancellation.includes("무료") && <em>무료 취소</em>}</div>
                  <h4>{rental.car}</h4>
                  <div className="rental-spec-line"><span><UsersRound size={15} />{seats}</span><span><BriefcaseBusiness size={15} />{luggage}</span><span>{transmission}</span></div>
                  <div className="rental-policy-grid">
                    <span><ShieldCheck size={15} /><i><small>보험</small><b>{rental.insurance}</b></i></span>
                    <span><MapPin size={15} /><i><small>인수</small><b>{rental.pickup}</b></i></span>
                    <span><Fuel size={15} /><i><small>연료 정책</small><b>{rental.fuel}</b></i></span>
                  </div>
                  <p>{rental.benefit}</p>
                </div>
                <div className="rental-offer-price">
                  <span>{rental.discount ? <><del>{money(rental.originalPrice)}원</del><em>{rental.discount}% 할인</em></> : <small>세금·보험 포함</small>}</span>
                  <strong className="rental-number">{money(rental.price)}원</strong>
                  <small>48시간 총 대여료</small>
                  <b className="rental-number">1일 약 {money(Math.round(rental.price / 2))}원</b>
                  <button type="button" onClick={() => onChoose(rental.id)}>{selected ? "선택됨" : "이 차량 선택"}</button>
                </div>
              </article>
            );
          })}
        </div>
        <footer className="rental-modal-footer">
          <p>차종은 현장 상황에 따라 동급 차량으로 배정될 수 있습니다. 카시트·추가 운전자·연료 비용과 보험 제외 항목은 예약 단계에서 확인해 주세요. <a href="https://commons.wikimedia.org/" target="_blank" rel="noreferrer">차량 이미지 출처: Wikimedia Commons</a></p>
          <button type="button" className="modal-back" onClick={onBackToFlight}>← 항공편 다시 보기</button>
        </footer>
      </section>
    </div>
  );
}
