import { describe, expect, it } from "vitest";
import { BALANCE } from "./balance";
import {
  buy,
  createInitialState,
  crySpeedFor,
  resolve,
  rewardMultiplier,
  tick,
  upgradeCost,
  type GameState,
} from "./engine";

const withNeed = (overrides: Partial<GameState> = {}): GameState => ({
  ...createInitialState(),
  need: "hungry",
  ...overrides,
});

describe("tick", () => {
  it("요구가 없고 확률에 걸리면 새 요구가 생긴다", () => {
    const rolls = [0, 0]; // 첫 값: 발생 판정, 두 번째: 요구 종류(0 → hungry)
    const next = tick(createInitialState(), 0.1, () => rolls.shift() ?? 0);
    expect(next.need).toBe("hungry");
    expect(next.cry).toBe(0);
  });

  it("확률에 안 걸리면 같은 객체를 돌려준다 (불필요한 리렌더 방지)", () => {
    const state = createInitialState();
    expect(tick(state, 0.1, () => 0.999)).toBe(state);
  });

  it("요구가 있으면 울음 게이지가 dt 에 비례해 오른다", () => {
    const next = tick(withNeed(), 0.1);
    expect(next.cry).toBeCloseTo(BALANCE.baseCrySpeed * 0.1);
  });

  it("dt 는 maxDt 로 잘린다 (탭 전환 후 복귀 시 폭주 방지)", () => {
    const next = tick(withNeed(), 10);
    expect(next.cry).toBeCloseTo(BALANCE.baseCrySpeed * BALANCE.maxDt);
  });

  it("울음이 100 에 닿으면 폭발: 요구 초기화 + 페널티 + 통계 기록", () => {
    const next = tick(withNeed({ cry: 99.9, coins: 20 }), 0.1);
    expect(next.need).toBeNull();
    expect(next.coins).toBe(20 - BALANCE.meltdownPenalty);
    expect(next.stats.meltdowns).toBe(1);
  });

  it("코인은 음수가 되지 않는다", () => {
    expect(tick(withNeed({ cry: 99.9, coins: 1 }), 0.1).coins).toBe(0);
  });
});

describe("resolve", () => {
  it("맞는 대응: 빨리 할수록 보상이 크다", () => {
    const fast = resolve(withNeed({ cry: 0 }), "hungry");
    const slow = resolve(withNeed({ cry: 60 }), "hungry");
    expect(fast.result).toEqual({ kind: "ok", reward: BALANCE.baseReward });
    expect(slow.result.kind === "ok" && slow.result.reward).toBeLessThan(BALANCE.baseReward);
    expect(fast.state.need).toBeNull();
    expect(fast.state.stats.resolved).toBe(1);
  });

  it("최소 보상 비율이 보장된다", () => {
    const { result } = resolve(withNeed({ cry: 99 }), "hungry");
    expect(result).toEqual({
      kind: "ok",
      reward: Math.round(BALANCE.baseReward * BALANCE.minRewardRatio),
    });
  });

  it("틀린 대응은 울음을 올리지만 100 을 넘기진 않는다", () => {
    const { state, result } = resolve(withNeed({ cry: 95 }), "diaper");
    expect(result.kind).toBe("wrong");
    expect(state.cry).toBeLessThan(100);
  });

  it("요구가 없을 때 누르면 아무 일도 없다", () => {
    const state = createInitialState();
    expect(resolve(state, "hungry")).toEqual({ state, result: { kind: "idle" } });
  });
});

describe("upgrades", () => {
  it("비용은 레벨마다 기하급수로 오른다", () => {
    expect(upgradeCost("bottleWarmer", 0)).toBe(30);
    expect(upgradeCost("bottleWarmer", 1)).toBe(48);
    expect(upgradeCost("bottleWarmer", 2)).toBe(77);
  });

  it("돈이 부족하면 구매 실패", () => {
    expect(buy(createInitialState(), "bottleWarmer")).toBeNull();
  });

  it("구매하면 코인 차감 + 레벨 상승 + 대상 요구의 울음 속도 감소", () => {
    const rich = { ...createInitialState(), coins: 100 };
    const next = buy(rich, "bottleWarmer");
    expect(next?.coins).toBe(70);
    expect(next?.levels.bottleWarmer).toBe(1);
    expect(crySpeedFor(next!, "hungry")).toBeLessThan(crySpeedFor(rich, "hungry"));
    expect(crySpeedFor(next!, "diaper")).toBe(crySpeedFor(rich, "diaper"));
  });

  it("자장가 스피커는 보상 배율을 올린다", () => {
    const state = {
      ...createInitialState(),
      levels: { ...createInitialState().levels, lullaby: 2 },
    };
    expect(rewardMultiplier(state)).toBeCloseTo(1.4);
  });

  it("최대 레벨이면 더 못 산다", () => {
    const state = {
      ...createInitialState(),
      coins: 1_000_000,
      levels: { ...createInitialState().levels, mobile: 5 },
    };
    expect(buy(state, "mobile")).toBeNull();
  });
});
