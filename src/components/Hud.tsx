import { BALANCE } from "../game/balance";
import { useGame } from "../store/gameStore";

export function Hud({ onOpenShop }: { onOpenShop: () => void }) {
  const coins = useGame((s) => s.coins);
  const day = useGame((s) => s.day);
  // 초 단위로만 구독해서 매 프레임 리렌더하지 않는다
  const secondsLeft = useGame((s) => Math.ceil(BALANCE.dayLength - s.dayTime));
  const hp = useGame((s) => s.hp);
  const hpRatio = hp / BALANCE.maxHp;

  return (
    <header className="hud">
      <div className="hud__coins" aria-label={`코인 ${coins}개`}>
        <span aria-hidden>🪙</span> {coins.toLocaleString()}
      </div>
      <div className="hud__stat" aria-label={`${day}일차, 남은 시간 ${secondsLeft}초`}>
        {day}일차 · ⏱ {secondsLeft}s
      </div>
      <button type="button" className="hud__shop" onClick={onOpenShop}>
        육아템 상점
      </button>
      <div
        className={`hud__hp ${hpRatio <= 0.3 ? "is-low" : ""}`}
        role="meter"
        aria-label="체력"
        aria-valuemin={0}
        aria-valuemax={BALANCE.maxHp}
        aria-valuenow={hp}
      >
        <span aria-hidden>❤️</span>
        <span className="hud__hp-track">
          <span className="hud__hp-fill" style={{ width: `${hpRatio * 100}%` }} />
        </span>
      </div>
    </header>
  );
}
