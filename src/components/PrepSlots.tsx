import type { CSSProperties } from "react";
import { BALANCE, NEED_META } from "../game/balance";
import { prepStage, type PrepStage } from "../game/engine";
import { useGame } from "../store/gameStore";

const STAGE_LABEL: Record<PrepStage, string> = {
  warming: "준비 중…",
  ready: "딱 좋아요!",
  spoiled: "",
};

/** '딱 좋아요' 상태가 유지되는 시간(초) */
const READY_SPAN = BALANCE.prepSpoilAt - BALANCE.prepReadyAt;

/** 붕어빵 틀에 해당하는 준비 슬롯. 탭하면 꺼내서 아기에게 준다 */
export function PrepSlots() {
  const slots = useGame((s) => s.slots);
  const serve = useGame((s) => s.serve);

  return (
    <ul className="slots" aria-label="준비 슬롯">
      {slots.map((slot, i) => {
        if (!slot) {
          return (
            <li key={i}>
              <div className="slots__slot is-empty">비어 있음</div>
            </li>
          );
        }
        const stage = prepStage(slot);
        const meta = NEED_META[slot.need];
        const label = stage === "spoiled" ? meta.spoiled : STAGE_LABEL[stage];
        // 0 → 1: 준비 완료까지 / 1 → 2: 망치기까지
        const progress =
          stage === "warming"
            ? slot.t / BALANCE.prepReadyAt
            : 1 + Math.min(1, (slot.t - BALANCE.prepReadyAt) / READY_SPAN);
        const golden = slot.golden && stage === "ready";
        return (
          <li key={i}>
            <button
              type="button"
              className={`slots__slot is-${stage} ${golden ? "is-golden" : ""}`}
              style={{ "--progress": progress / 2 } as CSSProperties}
              onClick={() => serve(i)}
              aria-label={`${meta.action}: ${label}${golden ? " (반짝)" : ""}`}
            >
              <span className="slots__icon" aria-hidden>
                {meta.icon}
                {golden && <span className="slots__sparkle">✨</span>}
              </span>
              <span className="slots__label">{label}</span>
              <span className="slots__bar" aria-hidden />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
