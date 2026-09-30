import { useEffect, useState } from "react";
import { startLoop } from "./game/loop";
import { useGame } from "./store/gameStore";
import { Hud } from "./components/Hud";
import { Crib } from "./components/Crib";
import { ActionBar } from "./components/ActionBar";
import { Shop } from "./components/Shop";

export default function App() {
  const [shopOpen, setShopOpen] = useState(false);

  useEffect(() => startLoop((dt) => useGame.getState().tick(dt)), []);

  return (
    <main className="game">
      <Hud onOpenShop={() => setShopOpen(true)} />
      <Crib />
      <ActionBar />
      {shopOpen && <Shop onClose={() => setShopOpen(false)} />}
    </main>
  );
}
