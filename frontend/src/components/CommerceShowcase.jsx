import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, ImageOff, Star } from "lucide-react";
import { eSimProducts, money, saleStays, tourProducts, transportPasses } from "../data/mockData";
import "./commerce-showcase.css";

function InfiniteProductRow({
  id,
  eyebrow,
  title,
  description,
  linkLabel,
  items,
  horizontal = false,
  synchronizedTick = null,
  synchronizedPaused = null,
  onSynchronizedPause,
}) {
  const visible = horizontal ? 3 : 4;
  const clones = useMemo(() => [...items, ...items.slice(0, visible)], [items, visible]);
  const [index, setIndex] = useState(0);
  const [moving, setMoving] = useState(true);
  const [localPaused, setLocalPaused] = useState(false);
  const [likedIds, setLikedIds] = useState(() => new Set());
  const lastSynchronizedTick = useRef(synchronizedTick ?? 0);
  const paused = synchronizedPaused ?? localPaused;
  const setPaused = onSynchronizedPause ?? setLocalPaused;

  useEffect(() => {
    if (synchronizedTick != null || paused || items.length <= visible) return undefined;
    const timer = window.setInterval(() => {
      setMoving(true);
      setIndex((current) => current >= items.length ? current : current + 1);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [items.length, paused, synchronizedTick, visible]);

  useEffect(() => {
    if (synchronizedTick == null || synchronizedTick === 0 || items.length <= visible) return;
    const elapsedTicks = Math.max(0, synchronizedTick - lastSynchronizedTick.current);
    lastSynchronizedTick.current = synchronizedTick;
    if (!elapsedTicks) return;
    setIndex((current) => {
      if (elapsedTicks > 1 || current >= items.length) {
        setMoving(false);
        const synchronizedIndex = synchronizedTick % items.length;
        window.requestAnimationFrame(() => setMoving(true));
        return synchronizedIndex;
      }
      setMoving(true);
      return current + 1;
    });
  }, [items.length, synchronizedTick, visible]);

  const finishMove = () => {
    if (index < items.length) return;
    setMoving(false);
    setIndex(0);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => setMoving(true)));
  };

  return (
    <section id={id} className={`commerce-row${horizontal ? " is-horizontal" : ""}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)}>
      <header>
        <div>
          <small>{eyebrow}</small>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <button type="button">{linkLabel} 전체 보기 →</button>
      </header>
      <div className="commerce-viewport" aria-label={`${title} 자동 슬라이드`}>
        <div
          className="commerce-track"
          style={{
            transform: `translate3d(calc(-${index * (100 / visible)}% - ${index * (16 / visible)}px), 0, 0)`,
            transition: moving ? "transform .72s cubic-bezier(.22,.75,.22,1)" : "none",
          }}
          onTransitionEnd={finishMove}
        >
          {clones.map((item, itemIndex) => (
            <article className="commerce-card" key={`${item.id}-${itemIndex}`} aria-hidden={itemIndex >= items.length ? "true" : undefined}>
              <img src={item.image} alt={`${item.location} ${item.title}`} loading="eager" decoding="async" onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.nextElementSibling?.removeAttribute("hidden"); }} />
              <span className="commerce-image-fallback" hidden><ImageOff size={28} aria-hidden="true" /><small>이미지를 불러오지 못했어요</small></span>
              <span className="commerce-shade" aria-hidden="true" />
              <em>{item.tag}</em>
              <button type="button" tabIndex={itemIndex >= items.length ? -1 : 0} className={`commerce-like${likedIds.has(item.id) ? " is-active" : ""}`} aria-label={`${item.title} ${likedIds.has(item.id) ? "찜 해제" : "찜하기"}`} aria-pressed={likedIds.has(item.id)} onClick={() => setLikedIds((current) => { const next = new Set(current); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); return next; })}><Heart size={17} fill={likedIds.has(item.id) ? "currentColor" : "none"} /></button>
              <div>
                <small>{item.location}</small>
                <h4>{item.title}</h4>
                {!horizontal ? <p><Star size={12} fill="currentColor" /> {item.rating}/5 · 리뷰 {item.reviews}개</p> : <p>오늘 예약 시 타임세일 적용</p>}
                <strong>{money(item.price)}<small>원~</small></strong>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function CommerceShowcase() {
  const [primaryTick, setPrimaryTick] = useState(0);
  const rotationStartedAt = useRef(Date.now());

  useEffect(() => {
    const synchronizeRotation = () => {
      setPrimaryTick(Math.floor((Date.now() - rotationStartedAt.current) / 3000));
    };
    const timer = window.setInterval(synchronizeRotation, 1000);
    window.addEventListener("focus", synchronizeRotation);
    document.addEventListener("visibilitychange", synchronizeRotation);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", synchronizeRotation);
      document.removeEventListener("visibilitychange", synchronizeRotation);
    };
  }, []);

  return (
    <section className="commerce-showcase" aria-label="여행 상품 추천">
      <InfiniteProductRow id="commerce-tours" eyebrow="TRENDING EXPERIENCES · 12" title="사진만 봐도 떠나고 싶은 투어 & 액티비티" description="세계 곳곳의 버킷리스트 경험을 3초마다 새롭게 만나보세요." linkLabel="투어" items={tourProducts} synchronizedTick={primaryTick} synchronizedPaused={false} />
      <InfiniteProductRow id="commerce-stays" eyebrow="LIMITED STAY DEALS" title="예산 방어 필수! 마감 임박 타임세일 숙소" description="여행의 분위기와 예산을 모두 지키는 인기 숙소를 모았어요." linkLabel="숙소" items={saleStays} horizontal synchronizedTick={primaryTick} synchronizedPaused={false} />
      <InfiniteProductRow id="commerce-passes" eyebrow="MOVE SMARTER" title="도시와 도시를 가볍게 잇는 교통패스" description="기차부터 현지 대중교통까지, 이동 횟수와 동선에 맞춰 비교하세요." linkLabel="교통패스" items={transportPasses} synchronizedTick={primaryTick} synchronizedPaused={false} />
      <InfiniteProductRow id="commerce-esim" eyebrow="STAY CONNECTED" title="도착하는 순간 바로 연결되는 글로벌 eSIM" description="여행지 사진과 함께 데이터 용량·사용 지역을 빠르게 비교하세요." linkLabel="eSIM" items={eSimProducts} synchronizedTick={primaryTick} synchronizedPaused={false} />
    </section>
  );
}
