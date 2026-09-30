import { useEffect } from "react";
import { UPGRADES, UPGRADE_IDS } from "../game/balance";
import { canBuy, upgradeCost } from "../game/engine";
import { useGame } from "../store/gameStore";

export function Shop({ onClose }: { onClose: () => void }) {
  const coins = useGame((s) => s.coins);
  const levels = useGame((s) => s.levels);
  const buyUpgrade = useGame((s) => s.buyUpgrade);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shop-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__head">
          <h2 id="shop-title">육아템 상점</h2>
          <button type="button" className="sheet__close" onClick={onClose}>
            닫기
          </button>
        </div>

        <ul className="shop">
          {UPGRADE_IDS.map((id) => {
            const def = UPGRADES[id];
            const level = levels[id];
            const maxed = level >= def.maxLevel;
            const cost = upgradeCost(id, level);
            const affordable = canBuy({ coins, levels }, id);
            return (
              <li key={id} className="shop__item">
                <span className="shop__icon" aria-hidden>
                  {def.icon}
                </span>
                <div className="shop__body">
                  <strong>
                    {def.name} <small>Lv.{level}</small>
                  </strong>
                  <p>{def.desc}</p>
                </div>
                <button
                  type="button"
                  className="shop__buy"
                  disabled={maxed || !affordable}
                  onClick={() => buyUpgrade(id)}
                >
                  {maxed ? "최대" : `🪙 ${cost}`}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
