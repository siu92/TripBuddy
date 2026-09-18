import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { useState } from "react";
import { foodPreferenceCardOptions } from "../../data/mockData";
import "./travel-preference-modal.css";

export default function TravelPreferenceModal({
  themes,
  themeOptions,
  onToggleTheme,
  pace,
  paceOptions,
  onPaceChange,
  foodPreferences,
  onFoodPreferencesChange,
  onClose,
  onComplete,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const foodSelectionLimitReached = foodPreferences.length >= 3;

  const toggleFood = (code) => {
    if (code === "ANY") return onFoodPreferencesChange([]);
    if (!foodPreferences.includes(code) && foodSelectionLimitReached) return;
    onFoodPreferencesChange(
      foodPreferences.includes(code)
        ? foodPreferences.filter((item) => item !== code)
        : [...foodPreferences, code],
    );
  };

  return (
    <div className="ai-modal-backdrop preference-modal-backdrop" role="presentation">
      <section className="ai-modal preference-modal preference-step-modal" role="dialog" aria-modal="true" aria-labelledby="preference-modal-title">
        <button type="button" className="modal-close" onClick={onClose} aria-label="여행 취향 설정 닫기"><X size={18} strokeWidth={1.8} aria-hidden="true" /></button>

        <header className="preference-step-header">
          <p>✦ TripBuddy AI · TRAVEL STYLE</p>
          <div className="preference-step-progress" aria-label={`2단계 중 ${currentStep}단계`}>
            {[1, 2].map((step) => (
              <span className={step <= currentStep ? "active" : ""} key={step}>
                <i>{step < currentStep ? <Check size={11} /> : step}</i>
                <b>{step === 1 ? "여행 스타일" : "음식 취향"}</b>
              </span>
            ))}
          </div>
          <h3 id="preference-modal-title">
            {currentStep === 1 ? <>제주에서 어떤 여행을<br />원하세요?</> : <>여행에서 어떤 맛을<br />기억하고 싶으세요?</>}
          </h3>
          <span>
            {currentStep === 1
              ? "테마와 하루의 속도를 먼저 정하면 AI가 일정의 분위기와 밀도를 조율해요."
              : `최대 3개까지 선택하세요. 실제 식사 일정과 동선 주변 식당 추천에 반영됩니다. (${foodPreferences.length}/3)`}
          </span>
        </header>

        {currentStep === 1 ? (
          <div className="preference-step-content">
            <section className="preference-modal-group">
              <small>여행 테마</small>
              <b>마음에 드는 테마를 골라주세요. (최대 3개 · {themes.length}/3)</b>
              <div className="preference-modal-themes">
                {themeOptions.map((theme) => (
                  <button type="button" className={themes.includes(theme.title) ? "active" : ""} disabled={themes.length >= 3 && !themes.includes(theme.title)} onClick={() => onToggleTheme(theme.title)} key={theme.title}>
                    <img src={theme.image} alt="" />
                    <span>{theme.title}</span>
                    {themes.includes(theme.title) && <i className="theme-modal-check" aria-label={`${theme.title} 선택됨`}><Check size={12} /></i>}
                  </button>
                ))}
              </div>
            </section>
            <section className="preference-modal-group preference-pace-group">
              <small>여행 일정</small>
              <b>하루를 어떤 속도로 보낼까요?</b>
              <div>
                {paceOptions.map((option) => (
                  <button type="button" className={pace === option ? "active" : ""} onClick={() => onPaceChange(option)} key={option}>{option}</button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <section className="food-card-step" aria-label="음식 선호 선택">
            <div className="food-image-grid">
              {foodPreferenceCardOptions.map((option) => {
                const active = option.code === "ANY" ? !foodPreferences.length : foodPreferences.includes(option.code);
                return (
                  <button type="button" className={active ? "active" : ""} disabled={option.code !== "ANY" && foodSelectionLimitReached && !active} aria-pressed={active} onClick={() => toggleFood(option.code)} key={option.code}>
                    <img src={option.image} alt="" />
                    <span className="food-card-copy"><b>{option.label}</b><small>{option.description}</small></span>
                    {active && <i className="food-card-check"><Check size={14} /></i>}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <footer className="preference-step-actions">
          {currentStep === 2 && (
            <button type="button" className="preference-previous" onClick={() => setCurrentStep(1)}><ArrowLeft size={15} /> 이전</button>
          )}
          <button type="button" className="preference-confirm" onClick={() => currentStep === 1 ? setCurrentStep(2) : onComplete()}>
            {currentStep === 1 ? <>다음 단계로 <ArrowRight size={16} /></> : "선택 완료 · 일정 생성 단계로 이동"}
          </button>
        </footer>
      </section>
    </div>
  );
}
