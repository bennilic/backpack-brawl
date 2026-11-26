import { describe, expect, it } from "vitest";
import { advanceReplay, isReplayDone, leaveBattle, newGame, nextSearchId, skipReplay, startBattle, startSearch } from "./game";
import { buyItem } from "./run";
import { SAVE_KEY, SAVE_VERSION, loadGame, parseSavedGame, saveGame, toSavedGame, type SaveStorage } from "./save";
import type { GameState, Opponent } from "./types";

/** The untyped JSON of a save, so tests can break it in any way. */
type Saved = ReturnType<typeof JSON.parse>;

const OPPONENT: Opponent = { id: "rat", name: "Rat", icon: "🐀", hp: 20, round: 1, items: ["chipped-dagger"] };

/** In-memory stand-in for `localStorage`. */
function fakeStorage(initial: Record<string, string> = {}): SaveStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
    removeItem: (key) => {
      delete data[key];
    },
  };
}

function shoppingGame(): GameState {
  const game = newGame(7);
  return { ...game, run: buyItem(game.run, 0) };
}

/** A battle started the way the app does it: a search, then the opponent's answer for its id. */
function battleGame(opponent: Opponent = OPPONENT): GameState {
  const searching = startSearch(shoppingGame());
  return startBattle(searching, nextSearchId(shoppingGame()), opponent);
}

const roundTrip = (game: GameState) => loadGame(fakeStorage({ [SAVE_KEY]: JSON.stringify(toSavedGame(game)) }));

/** The saved JSON of a game, edited by `change`, as the text a tampered save would contain. */
const tampered = (game: GameState, change: (saved: Saved) => void) => {
  const saved = JSON.parse(JSON.stringify(toSavedGame(game)));
  change(saved);
  return JSON.stringify(saved);
};

describe("B6: save and resume", () => {
  it("restores a shopping run exactly", () => {
    const game = shoppingGame();

    expect(roundTrip(game)).toEqual(game);
  });

  it("does not offer a different shop after a refresh (no free reroll)", () => {
    const game = shoppingGame();

    expect(roundTrip(game)?.run.shop).toEqual(game.run.shop);
    expect(roundTrip(game)?.run.seed).toBe(game.run.seed);
  });

  it("resumes a search in progress as the shop with the same run", () => {
    const searching = startSearch(shoppingGame());
    expect(searching.phase).toBe("searching");

    const loaded = roundTrip(searching);

    expect(loaded?.phase).toBe("shop");
    expect(loaded?.run).toEqual(searching.run);
  });

  it("resumes a battle at the saved frame with the same opponent and result", () => {
    const battle = advanceReplay(advanceReplay(battleGame()));

    const loaded = roundTrip(battle);

    expect(loaded?.phase).toBe("battle");
    expect(loaded?.battle?.frame).toBe(2);
    expect(loaded?.battle?.opponent).toEqual(OPPONENT);
    expect(loaded?.battle?.result).toEqual(battle.battle?.result);
    expect(loaded?.run).toEqual(battle.run);
  });

  it("gives a resumed run its game id and no search state", () => {
    const game = shoppingGame();

    const loaded = roundTrip({ ...game, searchCount: 3 });

    expect(loaded?.gameId).toBe(game.gameId);
    expect(loaded?.searchCount).toBe(0);
    expect(loaded?.search).toBeNull();
  });

  it("lets a resumed shop search again with an id that can be answered", () => {
    const loaded = roundTrip(startSearch(shoppingGame()))!;

    const searching = startSearch(loaded);
    const battle = startBattle(searching, nextSearchId(loaded), OPPONENT);

    expect(searching.phase).toBe("searching");
    expect(battle.phase).toBe("battle");
  });

  it("applies the result exactly once when a resumed battle is played to the end", () => {
    const loaded = roundTrip(advanceReplay(battleGame()))!;
    const unresolved = loaded.run;

    const done = skipReplay(loaded);

    expect(done.run).not.toEqual(unresolved);
    expect(skipReplay(done).run).toEqual(done.run);
    expect(done.run.wins + (3 - done.run.lives)).toBe(1);
  });

  it("can leave a battle that was resumed after its last frame", () => {
    const loaded = roundTrip(skipReplay(battleGame()))!;

    expect(isReplayDone(loaded.battle!)).toBe(true);
    expect(leaveBattle(loaded).phase).toBe("shop");
  });

  it("does not apply the battle result twice when saved after the last frame", () => {
    const done = skipReplay(battleGame());

    const loaded = roundTrip(done);

    expect(loaded?.run).toEqual(done.run);
    expect(loaded?.run).not.toEqual(shoppingGame().run);
  });

  it("restores a finished run on the result phase", () => {
    const finished: GameState = { ...shoppingGame(), phase: "finished" };
    finished.run = { ...finished.run, lives: 0, round: 3, wins: 0 };

    expect(roundTrip(finished)?.phase).toBe("finished");
  });

  it("saves to and loads from storage; a missing save gives no run", () => {
    const storage = fakeStorage();
    expect(loadGame(storage)).toBeNull();

    expect(saveGame(storage, shoppingGame())).toBe(true);

    expect(loadGame(storage)).toEqual(shoppingGame());
  });

  it("survives storage that throws", () => {
    const broken: SaveStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };

    expect(loadGame(broken)).toBeNull();
    expect(saveGame(broken, shoppingGame())).toBe(false);
  });

  describe("corrupt data falls back to no run", () => {
    it.each(["", "{", "null", "42", "[]", '"text"', "{}"])("rejects %j", (text) => {
      expect(parseSavedGame(text)).toBeNull();
    });

    it("removes a broken save from storage", () => {
      const storage = fakeStorage({ [SAVE_KEY]: "{not json" });

      expect(loadGame(storage)).toBeNull();
      expect(storage.data[SAVE_KEY]).toBeUndefined();
    });

    it("rejects another save version", () => {
      const text = tampered(shoppingGame(), (saved) => (saved.version = SAVE_VERSION + 1));

      expect(parseSavedGame(text)).toBeNull();
    });

    it.each([
      ["wrong field type", (s: Saved) => (s.run.gold = "10")],
      ["negative gold", (s: Saved) => (s.run.gold = -1)],
      ["fractional gold", (s: Saved) => (s.run.gold = 1.5)],
      ["missing run field", (s: Saved) => delete s.run.lives],
      ["missing game id", (s: Saved) => delete s.gameId],
      ["fractional game id", (s: Saved) => (s.gameId = 1.5)],
      ["unknown phase", (s: Saved) => (s.phase = "cheating")],
      ["unknown shop item", (s: Saved) => (s.run.shop[0] = "laser-sword")],
      ["short shop", (s: Saved) => s.run.shop.pop()],
      ["short backpack", (s: Saved) => s.run.backpack.pop()],
      ["unknown backpack item", (s: Saved) => (s.run.backpack[0].itemId = "laser-sword")],
      ["duplicate item uid", (s: Saved) => (s.run.backpack[1] = { ...s.run.backpack[0] })],
      ["uid not below nextUid", (s: Saved) => (s.run.nextUid = 1)],
      ["too many lives", (s: Saved) => (s.run.lives = 99)],
      ["round that does not match the results", (s: Saved) => (s.run.round = 4)],
      ["won and lost at once", (s: Saved) => ((s.run.wins = 5), (s.run.lives = 0), (s.run.round = 7))],
      ["finished run in the shop", (s: Saved) => ((s.run.wins = 5), (s.run.round = 5))],
      ["running run on the result page", (s: Saved) => (s.phase = "finished")],
      ["battle phase without battle", (s: Saved) => (s.phase = "battle")],
      ["shop phase with a battle", (s: Saved) => (s.battle = { opponent: OPPONENT, frame: 0 })],
    ])("rejects %s", (_name, change) => {
      expect(parseSavedGame(tampered(shoppingGame(), change))).toBeNull();
    });

    it.each([
      ["frame beyond the replay", (s: Saved) => (s.battle.frame = 100000)],
      ["negative frame", (s: Saved) => (s.battle.frame = -1)],
      ["unknown opponent item", (s: Saved) => (s.battle.opponent.items = ["laser-sword"])],
      ["opponent from a different round", (s: Saved) => (s.battle.opponent.round = 4)],
      ["opponent without hp", (s: Saved) => delete s.battle.opponent.hp],
      ["opponent with absurd hp", (s: Saved) => (s.battle.opponent.hp = 1e9)],
      ["opponent that is not an object", (s: Saved) => (s.battle.opponent = "rat")],
    ])("rejects a battle with %s", (_name, change) => {
      const battle = battleGame();

      expect(parseSavedGame(tampered(battle, change))).toBeNull();
    });
  });
});
