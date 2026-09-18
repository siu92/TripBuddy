import { BusFront, Car, CarFront, Fuel, Gauge } from "lucide-react";
import "./car-details-step.css";

const CAR_TYPES = [
  { id: "경차", label: "경차", description: "도심 이동·높은 연비", Icon: Gauge },
  { id: "세단", label: "세단", description: "편안한 승차감", Icon: CarFront },
  { id: "SUV", label: "SUV", description: "넉넉한 짐 공간", Icon: Car },
  { id: "승합", label: "승합", description: "다인원·가족 여행", Icon: BusFront },
];
const FUEL_TYPES = ["휘발유", "경유", "LPG"];

export default function CarDetailsStep({ carType, carFuel, onTypeChange, onFuelChange, onComplete, onBack }) {
  return <>
    <h3 id="ai-transport-title">차량에 맞춰<br />이동 비용을 더 정확하게 계산할게요.</h3>
    <span>차량 정보는 예상 유류비와 통행료 계산에만 사용됩니다.</span>
    <div className="premium-car-options">
      <section>
        <div className="car-option-heading"><small>VEHICLE TYPE</small><b>차종을 선택하세요</b></div>
        <div className="car-type-grid">
          {CAR_TYPES.map(({ id, label, description, Icon }) => (
            <button type="button" className={carType === id ? "active" : ""} aria-pressed={carType === id} onClick={() => onTypeChange(id)} key={id}>
              <i><Icon size={30} strokeWidth={1.55} /></i><b>{label}</b><small>{description}</small>
            </button>
          ))}
        </div>
      </section>
      <section className="fuel-option-section">
        <div className="car-option-heading"><small>FUEL</small><b><Fuel size={15} /> 연료를 선택하세요</b></div>
        <div className="fuel-chip-list">
          {FUEL_TYPES.map((fuel) => <button type="button" className={carFuel === fuel ? "active" : ""} aria-pressed={carFuel === fuel} onClick={() => onFuelChange(fuel)} key={fuel}>{fuel}</button>)}
        </div>
      </section>
    </div>
    <button type="button" className="car-detail-complete" onClick={onComplete}>선택 완료 · 숙소 선택으로 이동</button>
    <button type="button" className="modal-back" onClick={onBack}>← 이동수단 다시 고르기</button>
  </>;
}
