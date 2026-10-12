import { useEffect, useState } from "react";
import { startLoop } from "./game/loop";
import { useGame } from "./store/gameStore";
import { Hud } from "./components/Hud";
import { Crib } from "./components/Crib";
import { ActionBar } from "./components/ActionBar";
import { DaySummary } from "./components/DaySummary";
import { Shop } from "./components/Shop";

export default function App() {
  const [shopOpen, setShopOpen] = useState(false);
  const phase = useGame((s) => s.phase);

  // 상점이 열려 있는 동안은 루프를 멈춘다 (닫으면 startLoop 가 시계를 새로 잡으므로 dt 가 튀지 않는다)
  useEffect(() => {
    if (shopOpen) return;
    return startLoop((dt) => useGame.getState().tick(dt));
  }, [shopOpen]);

  return (
    <main className="game">
      <Hud onOpenShop={() => setShopOpen(true)} />
      <Crib />
      <ActionBar />
      {phase === "summary" && <DaySummary onOpenShop={() => setShopOpen(true)} />}
      {shopOpen && <Shop onClose={() => setShopOpen(false)} />}
    </main>
  );
}
