import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Need, UpgradeId } from "../game/balance";
import {
  buy,
  createInitialState,
  resolve,
  tick,
  type GameState,
  type ResolveResult,
} from "../game/engine";

interface GameStore extends GameState {
  lastResult: ResolveResult | null;
  /** 결과 피드백 애니메이션을 매번 다시 재생하기 위한 카운터 */
  resultSeq: number;
  tick: (dt: number) => void;
  act: (action: Need) => void;
  buyUpgrade: (id: UpgradeId) => void;
  reset: () => void;
}

const pickState = (s: GameStore): GameState => ({
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

      tick: (dt) => {
        const prev = pickState(get());
        const next = tick(prev, dt);
        if (next !== prev) set(next);
      },

      act: (action) => {
        const { state, result } = resolve(pickState(get()), action);
        set({ ...state, lastResult: result, resultSeq: get().resultSeq + 1 });
      },

      buyUpgrade: (id) => {
        const next = buy(pickState(get()), id);
        if (next) set(next);
      },

      reset: () => set({ ...createInitialState(), lastResult: null, resultSeq: 0 }),
    }),
    {
      name: "ddooby-baby-tycoon-save",
      version: 1,
      // 진행 중인 요구/울음은 저장하지 않는다 (재접속하자마자 울음 폭발 방지)
      partialize: (s) => ({ coins: s.coins, levels: s.levels, stats: s.stats }),
    },
  ),
);
