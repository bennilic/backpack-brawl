import { useRef } from "react";
import { fetchOpponent } from "../api";
import { Backpack } from "../components/Backpack";
import { FightBar } from "../components/FightBar";
import { RulesPanel } from "../components/RulesPanel";
import { RunHeader } from "../components/RunHeader";
import { Shop } from "../components/Shop";
import { fightBlocker, nextSearchId, searchFailed, startBattle, startSearch, updateRun } from "../game";
import { buyItem, moveBackpackItem, rerollShop, sellItem } from "../run";
import { useActiveGame } from "../state/GameContext";

export function ShopPage() {
  const { game, update } = useActiveGame();
  const { run, phase } = game;

  function handleBuy(offerIndex: number) {
    update((current) => updateRun(current, (currentRun) => buyItem(currentRun, offerIndex)));
  }

  function handleSell(slotIndex: number) {
    update((current) => updateRun(current, (currentRun) => sellItem(currentRun, slotIndex)));
  }

  //für B2:
  function handleMove(fromIndex: number, toIndex: number) {
    update((current) =>
      updateRun(current, (currentRun) =>
        moveBackpackItem(currentRun, fromIndex, toIndex)
      )
    );
  }


  function handleReroll() {
    update((current) => updateRun(current, rerollShop));
  }

  // The ref blocks a second click in the same tick, before React has re-rendered the disabled button.
  const isRequestRunning = useRef(false);

  // Once the opponent is found the phase becomes "battle" and RequireRoute redirects to the battle page.
  // The search id makes sure only the answer to *this* search is applied (see startBattle/searchFailed).
  async function handleFindOpponent() {
    if (isRequestRunning.current || fightBlocker(game) !== null) return;
    isRequestRunning.current = true;
    const searchId = nextSearchId(game);
    const round = run.round;
    update(startSearch);
    try {
      const opponent = await fetchOpponent(round);
      update((current) => startBattle(current, searchId, opponent));
    } catch (error) {
      const message = error instanceof Error ? error.message : "The opponent search failed unexpectedly. Try again.";
      update((current) => searchFailed(current, searchId, message));
    } finally {
      isRequestRunning.current = false;
    }
  }

  return (
    <>
      <RunHeader run={run} />
      <FightBar phase={phase} blocker={fightBlocker(game)} error={game.error} onFight={handleFindOpponent} />

      {/* While searching, the whole shop/backpack area is disabled so the fighting build can't change. */}
      <fieldset disabled={phase !== "shop"} className="grid min-w-0 gap-4 disabled:opacity-60 lg:grid-cols-[1fr_16rem_18rem]">
        <Shop run={run} onBuy={handleBuy} onReroll={handleReroll} />
        <Backpack backpack={run.backpack} onSell={handleSell} onMove={handleMove} /> {/* Für B2: onMove hinzugefügt */}
        <aside className="flex flex-col gap-4">
          <RulesPanel open={run.round === 1} />
        </aside>
      </fieldset>
    </>
  );
}
