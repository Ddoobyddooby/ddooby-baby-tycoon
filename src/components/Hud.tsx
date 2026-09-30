import { useGame } from "../store/gameStore";

export function Hud({ onOpenShop }: { onOpenShop: () => void }) {
  const coins = useGame((s) => s.coins);
  const resolved = useGame((s) => s.stats.resolved);

  return (
    <header className="hud">
      <div className="hud__coins" aria-label={`코인 ${coins}개`}>
        <span aria-hidden>🪙</span> {coins.toLocaleString()}
      </div>
      <div className="hud__stat">달래준 횟수 {resolved}</div>
      <button type="button" className="hud__shop" onClick={onOpenShop}>
        육아템 상점
      </button>
    </header>
  );
}
