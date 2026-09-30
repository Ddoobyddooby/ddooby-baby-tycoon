import { NEED_META } from "../game/balance";
import { useGame } from "../store/gameStore";

const RADIUS = 92;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function faceFor(cry: number, hasNeed: boolean) {
  if (!hasNeed) return "😊";
  if (cry < 40) return "🥺";
  if (cry < 75) return "😢";
  return "😭";
}

export function Crib() {
  const need = useGame((s) => s.need);
  const cry = useGame((s) => s.cry);
  const lastResult = useGame((s) => s.lastResult);
  const resultSeq = useGame((s) => s.resultSeq);

  const danger = need !== null && cry >= 75;
  const dash = CIRCUMFERENCE * (1 - cry / 100);

  return (
    <section className="crib" aria-live="polite">
      <div className={`crib__bubble ${need ? "is-visible" : ""}`}>
        {need ? (
          <>
            <span aria-hidden>{NEED_META[need].icon}</span> {NEED_META[need].label}
          </>
        ) : (
          "새근새근…"
        )}
      </div>

      <div className={`crib__baby ${danger ? "is-danger" : ""}`}>
        <svg className="crib__ring" viewBox="0 0 200 200" aria-hidden>
          <circle className="crib__ring-track" cx="100" cy="100" r={RADIUS} />
          <circle
            className="crib__ring-fill"
            cx="100"
            cy="100"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dash}
          />
        </svg>
        <span className="crib__face" role="img" aria-label="아기">
          {faceFor(cry, need !== null)}
        </span>
      </div>

      <p className="crib__feedback" key={resultSeq}>
        {lastResult?.kind === "ok" && `+${lastResult.reward}`}
        {lastResult?.kind === "wrong" && "그게 아니에요!"}
      </p>
    </section>
  );
}
