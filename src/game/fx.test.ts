import { describe, expect, it } from "vitest";
import { createInitialState, type GameState } from "./engine";
import { fxFromResult, fxFromTick } from "./fx";

const base = createInitialState();
const withNeed: GameState = { ...base, need: "hungry" };

describe("fxFromTick", () => {
  it("요구가 새로 생기면 need", () => {
    expect(fxFromTick(base, withNeed)).toBe("need");
  });

  it("울음 폭발 횟수가 늘면 meltdown", () => {
    const next = { ...base, stats: { ...base.stats, meltdowns: 1 } };
    expect(fxFromTick(withNeed, next)).toBe("meltdown");
  });

  it("그 외(울음만 오름 등)에는 효과 없음", () => {
    expect(fxFromTick(withNeed, { ...withNeed, cry: 10 })).toBeNull();
    expect(fxFromTick(base, base)).toBeNull();
  });
});

describe("fxFromResult", () => {
  it("정답은 happy, 오답은 no, 헛손질은 효과 없음", () => {
    expect(fxFromResult({ kind: "ok", reward: 10, combo: 1 })).toBe("happy");
    expect(fxFromResult({ kind: "wrong" })).toBe("no");
    expect(fxFromResult({ kind: "idle" })).toBeNull();
  });
});
