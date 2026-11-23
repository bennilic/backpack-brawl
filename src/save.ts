import { CATALOG } from "./items";
import { startBattle } from "./game";
import { START_LIVES, WINS_TO_VICTORY, runOutcome } from "./run";
import { BACKPACK_SIZE, SHOP_SIZE } from "./shop";
import type { Backpack, GameState, Opponent, Phase, RunState } from "./types";

/** The part of `localStorage` we use; a plain object can stand in for it in tests. */
export interface SaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const SAVE_KEY = "backpack-brawl-save";
/** Bump when the saved shape changes; saves of another version are discarded. */
export const SAVE_VERSION = 1;

const MAX_OPPONENT_ITEMS = 6;
const MAX_OPPONENT_HP = 1000;
const MAX_UINT32 = 2 ** 32 - 1;

/** What is written to storage: the run, the phase and, in a battle, which opponent and frame. */
interface SavedGame {
  version: number;
  phase: Phase;
  run: RunState;
  battle: { opponent: Opponent; frame: number } | null;
}

/**
 * Turns the game into its saved form. A search in progress is saved as the shop:
 * nothing was paid or decided yet and the opponent only depends on the round (see D-007).
 * The battle result is not saved, it is simulated again on loading.
 */
export function toSavedGame(game: GameState): SavedGame {
  const phase = game.phase === "searching" ? "shop" : game.phase;
  const battle = game.battle ? { opponent: game.battle.opponent, frame: game.battle.frame } : null;
  return { version: SAVE_VERSION, phase, run: game.run, battle };
}

/** Writes the game to storage. Returns `false` if storage is unavailable or full; the game goes on unsaved. */
export function saveGame(storage: SaveStorage, game: GameState): boolean {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(toSavedGame(game)));
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads the saved game. Returns `null` for a missing, unreadable, malformed, incompatible or
 * impossible save (the caller then starts without a run). Broken saves are removed from storage.
 */
export function loadGame(storage: SaveStorage): GameState | null {
  let text: string | null;
  try {
    text = storage.getItem(SAVE_KEY);
  } catch {
    return null;
  }
  if (text === null) return null;
  const game = parseSavedGame(text);
  if (!game) clearSave(storage);
  return game;
}

export function clearSave(storage: SaveStorage): void {
  try {
    storage.removeItem(SAVE_KEY);
  } catch {
    // Nothing more to do: an undeletable broken save is rejected again on the next load.
  }
}

/** Validates the JSON text and rebuilds the game from it; `null` if anything is wrong. */
export function parseSavedGame(text: string): GameState | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRecord(data) || data.version !== SAVE_VERSION) return null;
  if (!isRunState(data.run)) return null;
  const run = data.run;
  const finished = runOutcome(run) !== null;

  switch (data.phase) {
    case "shop":
      return finished || data.battle !== null ? null : { phase: "shop", run, battle: null, error: null };
    case "finished":
      return !finished || data.battle !== null ? null : { phase: "finished", run, battle: null, error: null };
    case "battle":
      return isSavedBattle(data.battle) ? restoreBattle(run, data.battle) : null;
    default:
      return null;
  }
}

function restoreBattle(run: RunState, saved: { opponent: Opponent; frame: number }): GameState | null {
  const started = startBattle({ phase: "shop", run, battle: null, error: null }, saved.opponent);
  const replay = started.battle!;
  if (saved.frame > replay.result.frames.length - 1) return null;
  // The frame is set directly (not via showFrame) so a finished replay does not apply its result twice.
  return { ...started, battle: { ...replay, frame: saved.frame } };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isIntegerBetween = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;

const isKnownItemId = (value: unknown): value is string =>
  typeof value === "string" && CATALOG.some((item) => item.id === value);

function isRunState(value: unknown): value is RunState {
  if (!isRecord(value)) return false;
  const { round, gold, lives, wins, seed, shop, backpack, nextUid } = value;
  if (!isIntegerBetween(wins, 0, WINS_TO_VICTORY)) return false;
  if (!isIntegerBetween(lives, 0, START_LIVES)) return false;
  if (!isIntegerBetween(gold, 0, Number.MAX_SAFE_INTEGER)) return false;
  if (!isIntegerBetween(seed, 0, MAX_UINT32)) return false;
  if (!isIntegerBetween(nextUid, 1, Number.MAX_SAFE_INTEGER)) return false;
  // Every battle ends in a win or a lost life and starts the next round, unless that ends the run.
  const battlesFought = wins + (START_LIVES - lives);
  const isOver = wins >= WINS_TO_VICTORY || lives <= 0;
  if (round !== battlesFought + (isOver ? 0 : 1)) return false;
  if (wins >= WINS_TO_VICTORY && lives <= 0) return false;
  if (!Array.isArray(shop) || shop.length !== SHOP_SIZE) return false;
  if (!shop.every((offer) => offer === null || isKnownItemId(offer))) return false;
  return isBackpack(backpack, nextUid);
}

function isBackpack(value: unknown, nextUid: number): value is Backpack {
  if (!Array.isArray(value) || value.length !== BACKPACK_SIZE) return false;
  const uids = new Set<string>();
  return value.every((slot) => {
    if (slot === null) return true;
    if (!isRecord(slot) || !isKnownItemId(slot.itemId) || typeof slot.uid !== "string") return false;
    const match = /^item-(\d+)$/.exec(slot.uid);
    if (!match || Number(match[1]) >= nextUid || uids.has(slot.uid)) return false;
    uids.add(slot.uid);
    return true;
  });
}

function isSavedBattle(value: unknown): value is { opponent: Opponent; frame: number } {
  if (!isRecord(value) || !isIntegerBetween(value.frame, 0, Number.MAX_SAFE_INTEGER)) return false;
  const opponent = value.opponent;
  if (!isRecord(opponent)) return false;
  return (
    typeof opponent.id === "string" &&
    typeof opponent.name === "string" &&
    typeof opponent.icon === "string" &&
    isIntegerBetween(opponent.hp, 1, MAX_OPPONENT_HP) &&
    isIntegerBetween(opponent.round, 1, Number.MAX_SAFE_INTEGER) &&
    Array.isArray(opponent.items) &&
    opponent.items.length <= MAX_OPPONENT_ITEMS &&
    opponent.items.every(isKnownItemId)
  );
}
