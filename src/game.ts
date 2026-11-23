import { buildOpponentFighter, buildPlayerFighter, simulateBattle } from "./battle";
import { applyBattleResult, newRun, runOutcome } from "./run";
import { itemIdsOf } from "./shop";
import type { ActiveSearch, BattleReplay, GameState, Opponent, RunState } from "./types";

/**
 * Phase transitions of one run: shop → searching → battle → shop … → finished.
 * Every function is pure, so they can be passed straight to `setState`.
 */

export function newGame(seed: number): GameState {
  return { phase: "shop", gameId: seed, searchCount: 0, search: null, run: newRun(seed), battle: null, error: null };
}

/** Applies a shop/backpack action; only allowed while shopping. */
export function updateRun(game: GameState, action: (run: RunState) => RunState): GameState {
  if (game.phase !== "shop") return game;
  const run = action(game.run);
  return run === game.run ? game : { ...game, run };
}

/** Why the player can't look for an opponent right now, or `null` if they can. */
export function fightBlocker(game: GameState): string | null {
  if (game.phase === "searching") return "Searching…";
  if (game.phase !== "shop") return "Not available right now";
  if (itemIdsOf(game.run.backpack).length === 0) return "Buy at least one item first";
  return null;
}

/** The id the next `startSearch` will give its search, so the caller can recognise its own answer. */
export const nextSearchId = (game: GameState) => `${game.gameId}:${game.searchCount + 1}`;

/** Starts a search for the current round; ignored unless the player is shopping, so a second search can't start. */
export function startSearch(game: GameState): GameState {
  if (fightBlocker(game) !== null) return game;
  const search: ActiveSearch = { id: nextSearchId(game), round: game.run.round };
  return { ...game, phase: "searching", searchCount: game.searchCount + 1, search, error: null };
}

/** Whether `searchId` belongs to the search that is running right now. */
export const isCurrentSearch = (game: GameState, searchId: string) =>
  game.phase === "searching" && game.search?.id === searchId;

/** Ends the search with an error and returns to a usable shop; ignored for a search that is not the current one. */
export function searchFailed(game: GameState, searchId: string, error: string): GameState {
  if (!isCurrentSearch(game, searchId)) return game;
  return { ...game, phase: "shop", search: null, error };
}

/**
 * Simulates the battle against `opponent` and starts its replay at the first frame.
 * Only applied if `searchId` is the current search and the opponent was made for the search's round,
 * so a late, duplicate or stale answer changes nothing.
 */
export function startBattle(game: GameState, searchId: string, opponent: Opponent): GameState {
  if (!isCurrentSearch(game, searchId) || game.search?.round !== game.run.round) return game;
  if (opponent.round !== game.run.round) {
    return searchFailed(game, searchId, "The arena sent a challenger for the wrong round. Please try again.");
  }
  const player = buildPlayerFighter(game.run.backpack);
  const enemy = buildOpponentFighter(opponent);
  const result = simulateBattle(player, enemy);
  return { ...game, phase: "battle", search: null, battle: { opponent, player, enemy, result, frame: 0 } };
}

export const isReplayDone = (battle: BattleReplay) => battle.frame >= battle.result.frames.length - 1;

/** Shows the given frame; reaching the last frame applies the battle result to the run (exactly once). */
export function showFrame(game: GameState, frame: number): GameState {
  const { battle } = game;
  if (game.phase !== "battle" || !battle || isReplayDone(battle)) return game;
  const last = battle.result.frames.length - 1;
  const next = { ...battle, frame: Math.min(Math.max(frame, battle.frame), last) };
  if (!isReplayDone(next)) return { ...game, battle: next };
  return { ...game, battle: next, run: applyBattleResult(game.run, battle.result.winner) };
}

export const advanceReplay = (game: GameState) => showFrame(game, (game.battle?.frame ?? 0) + 1);
export const skipReplay = (game: GameState) => showFrame(game, Infinity);

/** Leaves a finished replay: back to the shop, or to the end screen if the run is over. */
export function leaveBattle(game: GameState): GameState {
  if (game.phase !== "battle" || !game.battle || !isReplayDone(game.battle)) return game;
  return { ...game, phase: runOutcome(game.run) ? "finished" : "shop", battle: null };
}

/** URL paths of the app's screens. */
export const ROUTES = { start: "/", shop: "/shop", battle: "/battle", result: "/result" } as const;
export type GameRoute = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * The screen that matches the game's phase. Shop, battle and result pages
 * redirect here when they don't match, so the URL always follows the phase.
 */
export function routeForGame(game: GameState | null): GameRoute {
  if (!game) return ROUTES.start;
  switch (game.phase) {
    case "shop":
    case "searching":
      return ROUTES.shop;
    case "battle":
      return ROUTES.battle;
    case "finished":
      return ROUTES.result;
  }
}
