import { BALANCE } from "../game/balance";
import { useGame } from "../store/gameStore";

export function DaySummary({ onOpenShop }: { onOpenShop: () => void }) {
  const day = useGame((s) => s.day);
  const today = useGame((s) => s.today);
  const coins = useGame((s) => s.coins);
  const hp = useGame((s) => s.hp);
  const nextDay = useGame((s) => s.nextDay);

  return (
    <div className="sheet-backdrop sheet-backdrop--center">
      <section
        className="sheet sheet--center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-title"
      >
        <h2 id="summary-title" className="summary__title">
          {day}일차 정산
        </h2>
        {today.exhausted && (
          <p className="summary__note">기진맥진… 체력이 바닥나서 일찍 쓰러졌어요</p>
        )}

        <dl className="summary">
          <div>
            <dt>달래준 횟수</dt>
            <dd>{today.resolved}</dd>
          </div>
          <div>
            <dt>울음 폭발</dt>
            <dd>{today.meltdowns}</dd>
          </div>
          <div>
            <dt>남은 체력</dt>
            <dd>❤️ {Math.round(hp)}/{BALANCE.maxHp}</dd>
          </div>
          <div>
            <dt>최고 콤보</dt>
            <dd>🔥 {today.bestCombo}</dd>
          </div>
          <div>
            <dt>번 코인</dt>
            <dd>🪙 {today.earned}</dd>
          </div>
          <div>
            <dt>보유 코인</dt>
            <dd>🪙 {coins.toLocaleString()}</dd>
          </div>
        </dl>

        <div className="summary__actions">
          <button type="button" className="summary__secondary" onClick={onOpenShop}>
            육아템 상점
          </button>
          <button type="button" className="summary__primary" onClick={nextDay} autoFocus>
            {day + 1}일차 시작
          </button>
        </div>
      </section>
    </div>
  );
}
