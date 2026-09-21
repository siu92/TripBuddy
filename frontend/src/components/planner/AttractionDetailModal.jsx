import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { getAttractionDetail } from "../../api/attractionApi.js";
import { getJejuAttractionDetail } from "../../data/jejuAttractionDetails.js";
import "./attraction-detail-modal.css";

function imageUrl(value) {
  return /^https?:\/\//i.test(String(value || "")) ? value : null;
}

function tagList(value) {
  if (!value) return [];
  let tags = value;
  if (typeof value === "string") {
    try { tags = JSON.parse(value); } catch { tags = value.split(/[,#;\n|]+/); }
  }
  if (!Array.isArray(tags)) tags = [tags];
  return [...new Set(tags.filter(t => typeof t === "string").map(t => t.trim()).filter(Boolean))];
}

export default function AttractionDetailModal({ attractionId, name, onClose, compact = false }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [failedImages, setFailedImages] = useState([]);
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError("");
    setDetail(null);
    setFailedImages([]);
    (async () => {
      try {
        const fallback = getJejuAttractionDetail(name);
        const hasDatabaseId = /^[1-9]\d*$/.test(String(attractionId ?? ""));
        const result = hasDatabaseId
          ? await getAttractionDetail(attractionId, { signal: controller.signal }).catch(cause => {
              if (fallback) return fallback;
              throw cause;
            })
          : fallback || await getAttractionDetail(attractionId, { signal: controller.signal });
        if (active) setDetail(result);
      } catch (cause) {
        if (active) setError(cause?.status === 404
          ? "관광지 정보를 찾을 수 없습니다."
          : cause?.message || "상세 정보를 불러오지 못했습니다.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; controller.abort(); };
  }, [attractionId, name, attempt]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); }
      if (event.key !== "Tab") return;
      const targets = [...(panelRef.current?.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]') || [])];
      const first = targets[0];
      const last = targets.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panelRef.current)) {
        event.preventDefault(); first?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  const title = detail?.name || name || "관광지";
  const photo = [detail?.representativeImageUrl, detail?.thumbnailImageUrl]
    .map(imageUrl).find(url => url && !failedImages.includes(url));
  const tags = tagList(detail?.tags || detail?.allTags);
  const address = detail?.roadAddress || detail?.address;
  const latitude = detail?.latitude;
  const longitude = detail?.longitude;
  const hasCoordinates = Number.isFinite(latitude) && Math.abs(latitude) <= 90
    && Number.isFinite(longitude) && Math.abs(longitude) <= 180;
  const mapUrl = hasCoordinates
    ? `https://map.kakao.com/link/map/${encodeURIComponent(title)},${latitude},${longitude}`
    : `https://map.kakao.com/?q=${encodeURIComponent([title, address].filter(Boolean).join(" "))}`;
  const phone = String(detail?.phoneNumber || "").trim();
  const callable = /^\+?[\d\s()-]+$/.test(phone);

  const modal = (
    <div className={`attraction-detail-backdrop${compact ? " is-mobile-preview" : ""}`} onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="attraction-detail-modal" ref={panelRef} tabIndex={-1}
        role="dialog" aria-modal="true" aria-label={`${title} 상세 정보`} aria-busy={loading}>
        <header><h2>{title}</h2><button type="button" onClick={onClose} aria-label="관광지 상세 닫기"><X size={20} /></button></header>
        {loading ? <p role="status">관광지 정보를 불러오고 있어요.</p>
          : error ? <div role="alert"><p>{error}</p><button type="button" onClick={() => setAttempt(n => n + 1)}>다시 시도</button></div>
          : detail && <>
            {photo ? <img className="attraction-detail-photo" src={photo} alt={`${title} 대표 이미지`}
              onError={() => setFailedImages(urls => [...urls, photo])} />
              : <div className="attraction-detail-no-photo">등록된 이미지가 없습니다.</div>}
            <p className="attraction-detail-category">{[detail.categoryName, detail.region1Name, detail.region2Name].filter(Boolean).join(" · ")}</p>
            <h3>관광지 소개</h3>
            <p className="attraction-detail-introduction">{detail.introduction?.trim() || "등록된 소개가 없습니다."}</p>
            {tags.length > 0 && <ul className="attraction-detail-tags">{tags.map(tag => <li key={tag}>#{tag.replace(/^#/, "")}</li>)}</ul>}
            <dl><dt>주소</dt><dd>{address || "등록된 주소가 없습니다."}{detail.postcode && ` (${detail.postcode})`}</dd>
              <dt>문의</dt><dd>{callable ? <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a> : phone || "등록된 전화번호가 없습니다."}</dd></dl>
            <a className="attraction-detail-map-link" href={mapUrl} target="_blank" rel="noopener noreferrer">카카오맵에서 위치 보기 ↗</a>
          </>}
      </section>
    </div>
  );

  return compact ? modal : createPortal(modal, document.body);
}
