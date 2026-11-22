import { describe, expect, it } from "vitest";
import { newGame, updateRun } from "./game";
import { rerollShop, sellItem } from "./run";

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
