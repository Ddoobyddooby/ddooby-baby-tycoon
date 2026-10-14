import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Need, UpgradeId } from "../game/balance";
import { fxFromResult, fxFromTick, type Fx, type FxKind } from "../game/fx";
import {
  buy,
  createInitialState,
  prepare,
  serve,
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
  /** 빈 슬롯에서 준비를 시작한다 */
  prepare: (need: Need) => void;
  /** 슬롯을 꺼내 아기에게 준다 */
  serve: (index: number) => void;
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
  slots: s.slots,
  hp: s.hp,
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

      prepare: (need) => {
        const prev = pickState(get());
        const next = prepare(prev, need);
        if (next !== prev) set(next);
      },

      serve: (index) => {
        const { state, result } = serve(pickState(get()), index);
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
      // 진행 중인 요구/울음/슬롯/체력/하루 시계는 저장하지 않는다 (재접속하자마자 울음 폭발 방지, 하루는 처음부터)
      partialize: (s) => ({ day: s.day, coins: s.coins, levels: s.levels, stats: s.stats }),
    },
  ),
);
