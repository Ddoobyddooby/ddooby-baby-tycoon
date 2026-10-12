/**
 * 순수 함수로만 구성된 게임 엔진.
 * React/Zustand 에 의존하지 않으므로 단위 테스트가 쉽다.
 */
import { BALANCE, NEEDS, UPGRADES, UPGRADE_IDS, type Need, type UpgradeId } from "./balance";

export type Rng = () => number;

export type Phase = "playing" | "summary";

export interface DayStats {
  resolved: number;
  meltdowns: number;
  earned: number;
  bestCombo: number;
}

export interface GameState {
  /** 1부터 시작하는 날짜 */
  day: number;
  /** 오늘 지나간 시간(초). 0 ~ BALANCE.dayLength */
  dayTime: number;
  /** playing: 하루 진행 중 / summary: 하루가 끝나 정산 중 (시간이 멈춘다) */
  phase: Phase;
  /** 오늘의 기록. 다음 날이 되면 초기화 */
  today: DayStats;
  /** 연속으로 맞게 대응한 횟수. 오답/폭발/하루 종료로 0 이 된다 */
  combo: number;
  coins: number;
  need: Need | null;
  /** 0 ~ 100 */
  cry: number;
  levels: Record<UpgradeId, number>;
  stats: { resolved: number; meltdowns: number; totalEarned: number };
}

export type ResolveResult =
  { kind: "ok"; reward: number; combo: number } | { kind: "wrong" } | { kind: "idle" };

const emptyDay = (): DayStats => ({ resolved: 0, meltdowns: 0, earned: 0, bestCombo: 0 });

export function createInitialState(): GameState {
  const levels = Object.fromEntries(UPGRADE_IDS.map((id) => [id, 0])) as Record<UpgradeId, number>;
  return {
    day: 1,
    dayTime: 0,
    phase: "playing",
    today: emptyDay(),
    combo: 0,
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

/** 콤보에 따라 보상 배율에 더해지는 값 */
export function comboBonus(combo: number): number {
  return Math.min(combo, BALANCE.comboMax) * BALANCE.comboBonusPerStep;
}

export function upgradeCost(id: UpgradeId, level: number): number {
  const def = UPGRADES[id];
  return Math.round(def.baseCost * Math.pow(def.costGrowth, level));
}

/** dt(초) 만큼 시간을 진행시킨다. 정산 중이거나 dt 가 0 이면 같은 객체를 돌려준다. */
export function tick(state: GameState, rawDt: number, rng: Rng = Math.random): GameState {
  const dt = Math.min(Math.max(rawDt, 0), BALANCE.maxDt);
  if (dt === 0 || state.phase !== "playing") return state;

  const dayTime = state.dayTime + dt;
  if (dayTime >= BALANCE.dayLength) {
    // 하루 종료: 남은 요구는 페널티 없이 사라진다
    return { ...state, dayTime: BALANCE.dayLength, phase: "summary", need: null, cry: 0, combo: 0 };
  }
  return tickNeed({ ...state, dayTime }, dt, rng);
}

/** 요구 발생과 울음 게이지만 진행시킨다. */
function tickNeed(state: GameState, dt: number, rng: Rng): GameState {
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
      combo: 0,
      coins: Math.max(0, state.coins - BALANCE.meltdownPenalty),
      stats: { ...state.stats, meltdowns: state.stats.meltdowns + 1 },
      today: { ...state.today, meltdowns: state.today.meltdowns + 1 },
    };
  }
  return { ...state, cry };
}

export function resolve(
  state: GameState,
  action: Need,
): { state: GameState; result: ResolveResult } {
  if (state.phase !== "playing" || state.need === null) return { state, result: { kind: "idle" } };

  if (action !== state.need) {
    const cry = Math.min(99.9, state.cry + BALANCE.wrongActionCry);
    return { state: { ...state, cry, combo: 0 }, result: { kind: "wrong" } };
  }

  const speedRatio = Math.max(BALANCE.minRewardRatio, 1 - state.cry / 100);
  const multiplier = rewardMultiplier(state) + comboBonus(state.combo);
  const reward = Math.max(1, Math.round(BALANCE.baseReward * speedRatio * multiplier));
  const combo = state.combo + 1;

  return {
    state: {
      ...state,
      need: null,
      cry: 0,
      combo,
      coins: state.coins + reward,
      stats: {
        ...state.stats,
        resolved: state.stats.resolved + 1,
        totalEarned: state.stats.totalEarned + reward,
      },
      today: {
        ...state.today,
        resolved: state.today.resolved + 1,
        earned: state.today.earned + reward,
        bestCombo: Math.max(state.today.bestCombo, combo),
      },
    },
    result: { kind: "ok", reward, combo },
  };
}

/** 정산을 마치고 다음 날을 시작한다. 하루가 끝난 상태가 아니면 같은 객체를 돌려준다. */
export function startNextDay(state: GameState): GameState {
  if (state.phase !== "summary") return state;
  return { ...state, day: state.day + 1, dayTime: 0, phase: "playing", today: emptyDay() };
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
