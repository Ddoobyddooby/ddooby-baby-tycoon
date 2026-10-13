/**
 * 화면 효과(아기 반응 애니메이션)를 틀 신호.
 * 게임 규칙이 아니라 "무슨 일이 막 일어났나"만 판정하는 순수 함수다.
 */
import type { GameState, ResolveResult } from "./engine";

export type FxKind = "need" | "happy" | "no" | "meltdown";

/** seq 가 바뀔 때마다 같은 종류의 효과도 처음부터 다시 재생된다 */
export interface Fx {
  kind: FxKind;
  seq: number;
}

/** tick 전후 상태를 비교해 효과를 고른다 */
export function fxFromTick(prev: GameState, next: GameState): FxKind | null {
  if (next.stats.meltdowns > prev.stats.meltdowns) return "meltdown";
  if (prev.need === null && next.need !== null) return "need";
  return null;
}

export function fxFromResult(result: ResolveResult): FxKind | null {
  if (result.kind === "ok") return "happy";
  if (result.kind === "wrong") return "no";
  return null;
}
