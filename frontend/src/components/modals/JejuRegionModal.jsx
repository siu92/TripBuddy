import { X } from "lucide-react";
import { jejuRegionOptions } from "../../data/mockData";

export default function JejuRegionModal({
  currentArea,
  customArea,
  onClose,
  onChoose,
  onCustomAreaChange,
  onChooseCustom,
}) {
  return (
    <div className="ai-modal-backdrop" role="presentation">
      <section
        className="ai-modal jeju-area-modal jeju-region-guide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="jeju-area-title"
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="제주 세부지역 선택 닫기"
        >
          <X size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>
        <p>✦ TripBuddy AI · JEJU REGION GUIDE</p>
        <h3 id="jeju-area-title">
          제주를 선택하셨네요!
          <br />
          제주 어느 지역을 방문하고 싶으세요?
        </h3>
        <span>
          머무를 지역을 먼저 고르면 관광지·숙소·이동 동선을 더 자연스럽게 이어서
          추천할 수 있어요.
        </span>
        <div className="jeju-area-options">
          {jejuRegionOptions.map((option) => (
            <button
              type="button"
              key={option.area}
              className={currentArea === option.area ? "active" : ""}
              onClick={() => onChoose(option.area, option.stayArea)}
            >
              <img
                src={option.image}
                alt={`${option.title} 관광지`}
                loading="lazy"
              />
              <div>
                <b>{option.title}</b>
                <small>{option.description}</small>
              </div>
            </button>
          ))}
          <button
            type="button"
            className="jeju-other-option"
            onClick={() =>
              document.querySelector("#jeju-custom-region")?.focus()
            }
          >
            <i>＋</i>
            <div>
              <b>기타 지역</b>
              <small>원하는 제주 세부지역을 직접 입력할 수 있어요.</small>
            </div>
          </button>
        </div>
        <label className="jeju-custom-field">
          <span>원하는 제주 세부지역 직접 입력</span>
          <div>
            <input
              id="jeju-custom-region"
              value={customArea}
              onChange={(event) => onCustomAreaChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onChooseCustom();
                }
              }}
              placeholder="예: 표선, 우도, 안덕"
            />
            <button type="button" onClick={onChooseCustom}>
              이 지역으로 선택
            </button>
          </div>
        </label>
      </section>
    </div>
  );
}
