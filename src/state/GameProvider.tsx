import { useEffect, useState, type ReactNode } from "react";
import { newGame } from "../game";
import { loadGame, saveGame, type SaveStorage } from "../save";
import type { GameState } from "../types";
import { GameContext, type GameContextValue } from "./GameContext";

const randomSeed = () => Math.floor(Math.random() * 2 ** 32);

/** Browser storage, or `null` where it is blocked (e.g. some private modes); the game then runs unsaved. */
function browserStorage(): SaveStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Holds the game state for all routes, so it survives navigating between pages and (via `save.ts`) a browser refresh. */
export function GameProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<GameState | null>(() => {
    const storage = browserStorage();
    return storage ? loadGame(storage) : null;
  });

  // Saving after every change keeps the stored state in step with what the player sees,
  // so a refresh can never undo a decision or a battle result.
  useEffect(() => {
    const storage = browserStorage();
    if (game && storage) saveGame(storage, game);
  }, [game]);

  const value: GameContextValue = {
    game,
    startNewRun: () => setGame(newGame(randomSeed())),
    update: (transition) => setGame((current) => (current ? transition(current) : current)),
  };

  return <GameContext value={value}>{children}</GameContext>;
}
