import { describe, expect, it } from "vitest";
import { fightBlocker, newGame, searchFailed, startBattle, startSearch, updateRun } from "./game";
import { buyItem, rerollShop, sellItem } from "./run";
import type { GameState, Opponent } from "./types";

describe("B1: shop and backpack actions only while shopping", () => {
  it.each(["searching", "battle", "finished"] as const)("ignores shop actions in the %s phase", (phase) => {
    const game = { ...newGame(1), phase };

    expect(updateRun(game, rerollShop)).toBe(game);
    expect(updateRun(game, (run) => sellItem(run, 0))).toBe(game);
  });

  it("applies a shop action while shopping", () => {
    const game = newGame(1);

    expect(updateRun(game, rerollShop).run.gold).toBe(game.run.gold - 1);
  });
});

const opponentForRound = (round: number): Opponent => ({
  id: "test-opponent",
  name: "Test Opponent",
  icon: "🐢",
  hp: 25,
  round,
  items: ["chipped-dagger"],
});

/** A run with one bought item, ready to search. */
function readyGame(): GameState {
  const game = newGame(1);
  return updateRun(game, (run) => buyItem(run, 0));
}

describe("B5: resilient matchmaking", () => {
  it("starts exactly one search and shows the searching phase", () => {
    const searching = startSearch(readyGame());

    expect(searching.phase).toBe("searching");
    expect(searching.search).toEqual({ id: "1:1", round: 1 });
    expect(fightBlocker(searching)).not.toBeNull();
  });

  it("does not start a second search while one is running", () => {
    const searching = startSearch(readyGame());

    expect(startSearch(searching)).toBe(searching);
  });

  it("does not start a search with an empty backpack", () => {
    const game = newGame(1);

    expect(startSearch(game)).toBe(game);
  });

  it("starts the battle when the current search is answered", () => {
    const battleGame = startBattle(startSearch(readyGame()), "1:1", opponentForRound(1));

    expect(battleGame.phase).toBe("battle");
    expect(battleGame.battle?.opponent.round).toBe(1);
    expect(battleGame.search).toBeNull();
  });

  it("ignores an answer outside a search", () => {
    const game = readyGame();

    expect(startBattle(game, "1:1", opponentForRound(1))).toBe(game);
  });

  it("applies a duplicate answer only once", () => {
    const battleGame = startBattle(startSearch(readyGame()), "1:1", opponentForRound(1));

    expect(startBattle(battleGame, "1:1", opponentForRound(1))).toBe(battleGame);
  });

  it("ignores a late answer of an earlier search", () => {
    const failed = searchFailed(startSearch(readyGame()), "1:1", "down");
    const secondSearch = startSearch(failed);

    expect(startBattle(secondSearch, "1:1", opponentForRound(1))).toBe(secondSearch);
    expect(startBattle(secondSearch, "1:2", opponentForRound(1)).phase).toBe("battle");
  });

  it("ignores an answer that arrives after a new run was started", () => {
    const oldSearch = startSearch(readyGame());
    const newRunSearching = startSearch(updateRun(newGame(2), (run) => buyItem(run, 0)));

    expect(startBattle(newRunSearching, oldSearch.search!.id, opponentForRound(1))).toBe(newRunSearching);
  });

  it("does not start a battle with an opponent of another round", () => {
    const result = startBattle(startSearch(readyGame()), "1:1", opponentForRound(3));

    expect(result.phase).toBe("shop");
    expect(result.battle).toBeNull();
    expect(result.error).toMatch(/wrong round/);
  });

  it("returns to a usable shop with the error message when the search fails", () => {
    const failed = searchFailed(startSearch(readyGame()), "1:1", "The arena gates are shut.");

    expect(failed.phase).toBe("shop");
    expect(failed.error).toBe("The arena gates are shut.");
    expect(failed.search).toBeNull();
    expect(fightBlocker(failed)).toBeNull();
  });

  it("ignores a late failure of a search that is no longer current", () => {
    const failed = searchFailed(startSearch(readyGame()), "1:1", "down");
    const secondSearch = startSearch(failed);

    expect(searchFailed(secondSearch, "1:1", "late")).toBe(secondSearch);
  });

  it("allows retrying after a failure and clears the old error", () => {
    const failed = searchFailed(startSearch(readyGame()), "1:1", "down");
    const retry = startSearch(failed);

    expect(retry.phase).toBe("searching");
    expect(retry.error).toBeNull();
    expect(retry.search?.id).toBe("1:2");
  });
});
