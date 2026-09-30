import { NEEDS, NEED_META } from "../game/balance";
import { useGame } from "../store/gameStore";

export function ActionBar() {
  const act = useGame((s) => s.act);

  return (
    <nav className="actions" aria-label="육아 행동">
      {NEEDS.map((need) => (
        <button key={need} type="button" className="actions__btn" onClick={() => act(need)}>
          <span className="actions__icon" aria-hidden>
            {NEED_META[need].icon}
          </span>
          {NEED_META[need].action}
        </button>
      ))}
    </nav>
  );
}
