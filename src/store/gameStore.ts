import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Need, UpgradeId } from "../game/balance";
import { fxFromResult, fxFromTick, type Fx, type FxKind } from "../game/fx";
import {
  buy,
  createInitialState,
  resolve,
  startNextDay,
  tick,
  type GameState,
  type ResolveResult,
} from "../game/engine";

interface GameStore extends GameState {
  lastResult: ResolveResult | null;
  /** 결과 피드백 애니메이션을 매번 다시 재생하기 위한 카운터 */
  resultSeq: number;
  /** 아기 반응 애니메이션 신호. 저장하지 않는다 */
  fx: Fx | null;
  tick: (dt: number) => void;
  act: (action: Need) => void;
  buyUpgrade: (id: UpgradeId) => void;
  nextDay: () => void;
  reset: () => void;
}

const nextFx = (s: GameStore, kind: FxKind | null): Fx | null =>
  kind ? { kind, seq: (s.fx?.seq ?? 0) + 1 } : s.fx;

const pickState = (s: GameStore): GameState => ({
  day: s.day,
  dayTime: s.dayTime,
  phase: s.phase,
  today: s.today,
  combo: s.combo,
  coins: s.coins,
  need: s.need,
  cry: s.cry,
  levels: s.levels,
  stats: s.stats,
});

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      lastResult: null,
      resultSeq: 0,
      fx: null,

      tick: (dt) => {
        const prev = pickState(get());
        const next = tick(prev, dt);
        if (next !== prev) set({ ...next, fx: nextFx(get(), fxFromTick(prev, next)) });
      },

      act: (action) => {
        const { state, result } = resolve(pickState(get()), action);
        set({
          ...state,
          lastResult: result,
          resultSeq: get().resultSeq + 1,
          fx: nextFx(get(), fxFromResult(result)),
        });
      },

      buyUpgrade: (id) => {
        const next = buy(pickState(get()), id);
        if (next) set(next);
      },

      nextDay: () => set(startNextDay(pickState(get()))),

      reset: () => set({ ...createInitialState(), lastResult: null, resultSeq: 0, fx: null }),
    }),
    {
      name: "ddooby-baby-tycoon-save",
      version: 1,
      // 진행 중인 요구/울음/하루 시계는 저장하지 않는다 (재접속하자마자 울음 폭발 방지, 하루는 처음부터)
      partialize: (s) => ({ day: s.day, coins: s.coins, levels: s.levels, stats: s.stats }),
    },
  ),
);
