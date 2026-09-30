/**
 * 순수 함수로만 구성된 게임 엔진.
 * React/Zustand 에 의존하지 않으므로 단위 테스트가 쉽다.
 */
import { BALANCE, NEEDS, UPGRADES, UPGRADE_IDS, type Need, type UpgradeId } from "./balance";

export type Rng = () => number;

export interface GameState {
  coins: number;
  need: Need | null;
  /** 0 ~ 100 */
  cry: number;
  levels: Record<UpgradeId, number>;
  stats: { resolved: number; meltdowns: number; totalEarned: number };
}

export type ResolveResult = { kind: "ok"; reward: number } | { kind: "wrong" } | { kind: "idle" };

export function createInitialState(): GameState {
  const levels = Object.fromEntries(UPGRADE_IDS.map((id) => [id, 0])) as Record<UpgradeId, number>;
  return {
    coins: 0,
    need: null,
    cry: 0,
    levels,
    stats: { resolved: 0, meltdowns: 0, totalEarned: 0 },
  };
}

export function crySpeedFor(state: GameState, need: Need): number {
  let slow = 0;
  for (const id of UPGRADE_IDS) {
    const def = UPGRADES[id];
    if (def.crySlow?.need === need) slow += def.crySlow.perLevel * state.levels[id];
  }
  return BALANCE.baseCrySpeed * Math.max(0.2, 1 - slow);
}

export function rewardMultiplier(state: GameState): number {
  let bonus = 0;
  for (const id of UPGRADE_IDS) {
    bonus += (UPGRADES[id].rewardBonusPerLevel ?? 0) * state.levels[id];
  }
  return 1 + bonus;
}

export function upgradeCost(id: UpgradeId, level: number): number {
  const def = UPGRADES[id];
  return Math.round(def.baseCost * Math.pow(def.costGrowth, level));
}

/** dt(초) 만큼 시간을 진행시킨다. 변화가 없으면 같은 객체를 돌려준다. */
export function tick(state: GameState, rawDt: number, rng: Rng = Math.random): GameState {
  const dt = Math.min(Math.max(rawDt, 0), BALANCE.maxDt);
  if (dt === 0) return state;

  if (state.need === null) {
    // 포아송 과정: dt 동안 최소 1회 발생할 확률 = 1 - e^(-λ·dt)
    const p = 1 - Math.exp(-BALANCE.needRatePerSec * dt);
    if (rng() < p) {
      const need = NEEDS[Math.floor(rng() * NEEDS.length)] ?? "hungry";
      return { ...state, need, cry: 0 };
    }
    return state;
  }

  const cry = state.cry + crySpeedFor(state, state.need) * dt;
  if (cry >= 100) {
    return {
      ...state,
      need: null,
      cry: 0,
      coins: Math.max(0, state.coins - BALANCE.meltdownPenalty),
      stats: { ...state.stats, meltdowns: state.stats.meltdowns + 1 },
    };
  }
  return { ...state, cry };
}

export function resolve(
  state: GameState,
  action: Need,
): { state: GameState; result: ResolveResult } {
  if (state.need === null) return { state, result: { kind: "idle" } };

  if (action !== state.need) {
    const cry = Math.min(99.9, state.cry + BALANCE.wrongActionCry);
    return { state: { ...state, cry }, result: { kind: "wrong" } };
  }

  const speedRatio = Math.max(BALANCE.minRewardRatio, 1 - state.cry / 100);
  const reward = Math.max(1, Math.round(BALANCE.baseReward * speedRatio * rewardMultiplier(state)));

  return {
    state: {
      ...state,
      need: null,
      cry: 0,
      coins: state.coins + reward,
      stats: {
        ...state.stats,
        resolved: state.stats.resolved + 1,
        totalEarned: state.stats.totalEarned + reward,
      },
    },
    result: { kind: "ok", reward },
  };
}

export function canBuy(state: Pick<GameState, "coins" | "levels">, id: UpgradeId): boolean {
  const level = state.levels[id];
  return level < UPGRADES[id].maxLevel && state.coins >= upgradeCost(id, level);
}

export function buy(state: GameState, id: UpgradeId): GameState | null {
  if (!canBuy(state, id)) return null;
  const level = state.levels[id];
  return {
    ...state,
    coins: state.coins - upgradeCost(id, level),
    levels: { ...state.levels, [id]: level + 1 },
  };
}
