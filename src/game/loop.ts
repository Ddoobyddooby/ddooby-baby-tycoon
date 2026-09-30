/**
 * requestAnimationFrame 기반 게임 루프.
 * setInterval 을 쓰지 않는 이유: 탭 비활성화 시 타이밍이 튀고, 화면 갱신과 동기화되지 않는다.
 * @returns 루프를 멈추는 함수
 */
export function startLoop(onTick: (dt: number) => void): () => void {
  let last = performance.now();
  let rafId = 0;

  const frame = (now: number) => {
    const dt = (now - last) / 1000;
    last = now;
    onTick(dt);
    rafId = requestAnimationFrame(frame);
  };

  rafId = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(rafId);
}
