import type { CSSProperties } from "react";
import { BALANCE, NEED_META, type Need } from "../game/balance";
import type { Phase } from "../game/engine";
import type { FxKind } from "../game/fx";
import { useGame } from "../store/gameStore";

const RADIUS = 92;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** 계속 반복되는 기본 움직임. 이벤트 반응(fx)과는 다른 요소에 걸어서 서로 덮어쓰지 않게 한다 */
type Mood = "asleep" | "calm" | "fidget" | "sway" | "wail";

function moodFor(phase: Phase, need: Need | null, cry: number): Mood {
  if (phase === "summary") return "asleep";
  if (need === null) return "calm";
  if (cry < 40) return "fidget";
  if (cry < 75) return "sway";
  return "wail";
}

/** 이벤트마다 아기 주위로 튀는 이모지 */
const PARTICLES: Record<FxKind, readonly string[]> = {
  need: [],
  happy: ["💕", "✨", "💕", "✨", "💕", "✨"],
  no: ["❓"],
  meltdown: ["💦", "💦", "💦", "💦", "💦", "💦", "💦", "💦"],
};

const TEARS: Record<Mood, number> = { asleep: 0, calm: 0, fidget: 0, sway: 2, wail: 4 };

/** 덜 되거나 망친 걸 꺼냈을 때의 피드백 문구 */
function badServeText(need: Need, stage: "warming" | "spoiled"): string {
  const why = stage === "warming" ? "아직 덜 됐어요" : NEED_META[need].spoiled;
  return `${why}! 체력 −${BALANCE.badServeHp}`;
}

export function Crib() {
  const phase = useGame((s) => s.phase);
  const need = useGame((s) => s.need);
  const cry = useGame((s) => s.cry);
  const lastResult = useGame((s) => s.lastResult);
  const resultSeq = useGame((s) => s.resultSeq);
  const combo = useGame((s) => s.combo);
  const fx = useGame((s) => s.fx);

  const mood = moodFor(phase, need, cry);
  const danger = mood === "wail";
  const dash = CIRCUMFERENCE * (1 - cry / 100);
  const particles = fx ? PARTICLES[fx.kind] : [];
  const comboMaxed = combo >= BALANCE.comboMax;

  return (
    <section className="crib" aria-live="polite">
      <div key={need ?? "none"} className={`crib__bubble ${need ? "is-visible" : ""}`}>
        {need ? (
          <>
            <span aria-hidden>{NEED_META[need].icon}</span> {NEED_META[need].label}
          </>
        ) : phase === "summary" ? (
          "쿨쿨…"
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

        <div className={`crib__mood mood-${mood}`}>
          {/* key 가 바뀌면 같은 반응도 처음부터 다시 재생된다 */}
          <span
            key={fx?.seq ?? 0}
            className={`crib__face ${fx ? `fx-${fx.kind}` : ""}`}
            role="img"
            aria-label="아기"
          >
            👶
          </span>
        </div>

        {TEARS[mood] > 0 && (
          <div className="crib__tears" aria-hidden>
            {Array.from({ length: TEARS[mood] }, (_, i) => (
              <span key={i} style={{ "--i": i, "--side": i % 2 } as CSSProperties}>
                💧
              </span>
            ))}
          </div>
        )}

        {(mood === "calm" || mood === "asleep") && (
          <span className="crib__zzz" aria-hidden>
            💤
          </span>
        )}

        {fx && particles.length > 0 && (
          <div key={fx.seq} className={`crib__fx fx-${fx.kind}`} aria-hidden>
            {particles.map((emoji, i) => (
              <span
                key={i}
                style={{ "--angle": `${(360 / particles.length) * i}deg` } as CSSProperties}
              >
                {emoji}
              </span>
            ))}
          </div>
        )}
      </div>

      <p
        key={combo}
        className={`crib__combo ${combo >= 2 ? "is-visible" : ""} ${comboMaxed ? "is-max" : ""}`}
        style={{ "--combo": Math.min(combo, BALANCE.comboMax) } as CSSProperties}
      >
        {combo >= 2 && (
          <>
            <span aria-hidden>🔥</span> {combo}콤보
            {comboMaxed && " (MAX)"}
          </>
        )}
      </p>

      <p className="crib__feedback" key={resultSeq}>
        {lastResult?.kind === "ok" && `+${lastResult.reward}`}
        {lastResult?.kind === "ok" && lastResult.golden && " ✨"}
        {lastResult?.kind === "wrong" && "그게 아니에요!"}
        {lastResult?.kind === "bad" && badServeText(lastResult.need, lastResult.stage)}
      </p>
    </section>
  );
}
