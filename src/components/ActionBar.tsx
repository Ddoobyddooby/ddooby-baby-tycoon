import { NEEDS, NEED_META } from "../game/balance";
import { useGame } from "../store/gameStore";

export function ActionBar() {
  const prepare = useGame((s) => s.prepare);
  const full = useGame((s) => s.phase !== "playing" || !s.slots.includes(null));

  return (
    <nav className="actions" aria-label="준비 시작">
      {NEEDS.map((need) => (
        <button
          key={need}
          type="button"
          className="actions__btn"
          disabled={full}
          onClick={() => prepare(need)}
        >
          <span className="actions__icon" aria-hidden>
            {NEED_META[need].icon}
          </span>
          {NEED_META[need].action}
        </button>
      ))}
    </nav>
  );
}
