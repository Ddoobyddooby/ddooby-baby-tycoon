import { describe, expect, it } from "vitest";
import { BALANCE } from "./balance";
import {
  buy,
  comboBonus,
  createInitialState,
  crySpeedFor,
  resolve,
  rewardMultiplier,
  startNextDay,
  tick,
  upgradeCost,
  type GameState,
} from "./engine";

const emptyToday = { resolved: 0, meltdowns: 0, earned: 0, bestCombo: 0 };

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

  it("확률에 안 걸리면 요구는 생기지 않는다", () => {
    expect(tick(createInitialState(), 0.1, () => 0.999).need).toBeNull();
  });

  it("dt 0 이면 같은 객체를 돌려준다", () => {
    const state = createInitialState();
    expect(tick(state, 0)).toBe(state);
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
    expect(next.today.meltdowns).toBe(1);
  });

  it("코인은 음수가 되지 않는다", () => {
    expect(tick(withNeed({ cry: 99.9, coins: 1 }), 0.1).coins).toBe(0);
  });
});

describe("resolve", () => {
  it("맞는 대응: 빨리 할수록 보상이 크다", () => {
    const fast = resolve(withNeed({ cry: 0 }), "hungry");
    const slow = resolve(withNeed({ cry: 60 }), "hungry");
    expect(fast.result).toEqual({ kind: "ok", reward: BALANCE.baseReward, combo: 1 });
    expect(slow.result.kind === "ok" && slow.result.reward).toBeLessThan(BALANCE.baseReward);
    expect(fast.state.need).toBeNull();
    expect(fast.state.stats.resolved).toBe(1);
    expect(fast.state.today).toEqual({
      resolved: 1,
      meltdowns: 0,
      earned: BALANCE.baseReward,
      bestCombo: 1,
    });
  });

  it("최소 보상 비율이 보장된다", () => {
    const { result } = resolve(withNeed({ cry: 99 }), "hungry");
    expect(result).toEqual({
      kind: "ok",
      reward: Math.round(BALANCE.baseReward * BALANCE.minRewardRatio),
      combo: 1,
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

describe("day cycle", () => {
  const nearEnd = (overrides: Partial<GameState> = {}): GameState => ({
    ...createInitialState(),
    dayTime: BALANCE.dayLength - 0.05,
    ...overrides,
  });

  it("tick 마다 하루 시계가 흐른다", () => {
    expect(tick(createInitialState(), 0.1, () => 0.999).dayTime).toBeCloseTo(0.1);
  });

  it("하루가 끝나면 정산 단계가 되고 진행 중이던 요구는 페널티 없이 사라진다", () => {
    const next = tick(nearEnd({ need: "hungry", cry: 50, coins: 20 }), 0.1);
    expect(next.phase).toBe("summary");
    expect(next.dayTime).toBe(BALANCE.dayLength);
    expect(next.need).toBeNull();
    expect(next.cry).toBe(0);
    expect(next.coins).toBe(20);
    expect(next.stats.meltdowns).toBe(0);
  });

  it("정산 단계에서는 시간이 흐르지 않고 요구도 생기지 않는다", () => {
    const summary = tick(nearEnd(), 0.1);
    expect(tick(summary, 0.1, () => 0)).toBe(summary);
  });

  it("정산 단계에서 눌러도 아무 일도 없다", () => {
    const summary = { ...nearEnd(), phase: "summary" as const };
    expect(resolve(summary, "hungry")).toEqual({ state: summary, result: { kind: "idle" } });
  });

  it("다음 날을 시작하면 날짜 +1, 시계와 오늘 기록 초기화, 코인/레벨은 유지", () => {
    const summary = tick(
      nearEnd({
        day: 3,
        coins: 77,
        today: { resolved: 5, meltdowns: 1, earned: 40, bestCombo: 3 },
        levels: { ...createInitialState().levels, rattle: 2 },
      }),
      0.1,
    );
    const next = startNextDay(summary);
    expect(next.day).toBe(4);
    expect(next.phase).toBe("playing");
    expect(next.dayTime).toBe(0);
    expect(next.today).toEqual({ resolved: 0, meltdowns: 0, earned: 0, bestCombo: 0 });
    expect(next.coins).toBe(77);
    expect(next.levels.rattle).toBe(2);
  });

  it("진행 중인 하루에는 다음 날로 넘어갈 수 없다", () => {
    const state = createInitialState();
    expect(startNextDay(state)).toBe(state);
  });
});

describe("combo", () => {
  it("보너스는 콤보 수 × 단계값이고 상한이 있다", () => {
    expect(comboBonus(0)).toBe(0);
    expect(comboBonus(2)).toBeCloseTo(2 * BALANCE.comboBonusPerStep);
    expect(comboBonus(99)).toBeCloseTo(BALANCE.comboMax * BALANCE.comboBonusPerStep);
  });

  it("맞게 대응하면 콤보가 쌓이고 오늘의 최고 콤보가 갱신된다", () => {
    let state = withNeed();
    for (let i = 0; i < 3; i++) {
      state = resolve({ ...state, need: "hungry" }, "hungry").state;
    }
    expect(state.combo).toBe(3);
    expect(state.today.bestCombo).toBe(3);
  });

  it("보상에 현재 콤보의 보너스가 붙는다 (첫 성공은 보너스 없음)", () => {
    const first = resolve(withNeed({ combo: 0 }), "hungry").result;
    const third = resolve(withNeed({ combo: 2 }), "hungry").result;
    expect(first.kind === "ok" && first.reward).toBe(BALANCE.baseReward);
    expect(third.kind === "ok" && third.reward).toBe(
      Math.round(BALANCE.baseReward * (1 + comboBonus(2))),
    );
  });

  it("업그레이드 배율과 콤보 보너스는 더해진다 (곱하지 않는다)", () => {
    const state = withNeed({
      combo: 2,
      levels: { ...createInitialState().levels, lullaby: 1 },
    });
    const { result } = resolve(state, "hungry");
    expect(result.kind === "ok" && result.reward).toBe(
      Math.round(BALANCE.baseReward * (1 + 0.2 + comboBonus(2))),
    );
  });

  it("틀린 대응은 콤보를 끊는다 (최고 기록은 유지)", () => {
    const { state } = resolve(
      withNeed({ combo: 4, today: { ...emptyToday, bestCombo: 4 } }),
      "diaper",
    );
    expect(state.combo).toBe(0);
    expect(state.today.bestCombo).toBe(4);
  });

  it("울음 폭발은 콤보를 끊는다", () => {
    expect(tick(withNeed({ cry: 99.9, combo: 3 }), 0.1).combo).toBe(0);
  });

  it("하루가 끝나면 콤보가 끊긴다", () => {
    const state = { ...createInitialState(), combo: 3, dayTime: BALANCE.dayLength - 0.05 };
    expect(tick(state, 0.1).combo).toBe(0);
  });
});
