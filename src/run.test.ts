// EXAMPLE (ex:) - this file only shows how a unit test works. It is not a requirement test.
//
// A unit test calls one small piece of code (here: the shop rule `buyItem`) with a prepared
// input and checks that the result is what we expect. If the code is ever changed so that the
// result differs, the test turns red and tells us which expectation broke.
//
// How to run it:  pnpm test src/run.test.ts
// Vitest runs every file whose name contains ".test." - that is the only reason this file runs.

// `describe`, `it` and `expect` are the three building blocks. They come from Vitest.
import { describe, expect, it } from "vitest";
import { getItem } from "./items";
import { buyBlocker, buyItem, newRun, REROLL_COST, rerollBlocker, rerollShop, sellBlocker, sellItem, sellPrice, START_GOLD } from "./run";
import { BACKPACK_SIZE, rollShop } from "./shop";
import type { RunState } from "./types";

// `describe(name, fn)` groups related tests. The name shows up in the test output, so it is
// prefixed with "ex:" to mark this as an example (tests for a requirement start with "fr1:", ...).
describe("ex: buyItem", () => {
  // `it(name, fn)` is ONE test. Read the name as a sentence: "it pays the price and ...".
  // The test fails if an `expect` inside does not hold, or if the code throws an error.
  it("pays the price and puts the offer into the backpack", () => {
    // 1. ARRANGE: prepare the input. `newRun(1)` builds a fresh run from the seed 1. A seed
    //    always gives the same shop (see shop.ts), so this test behaves the same on every machine.
    const run = newRun(1);
    // The `!` tells TypeScript "this offer is not null". It is safe here: a fresh shop is full.
    const itemId = run.shop[0]!;

    // 2. ACT: call the code under test, exactly once. `buyItem` is a pure function: it does not
    //    change `run` but returns a new state, so we keep the result in `after`.
    const after = buyItem(run, 0);

    // 3. ASSERT: `expect(actual).matcher(expected)` compares what we got with what we want.
    //    `toBe` compares with `===` (fine for numbers and strings, and for "the very same object").
    expect(after.gold).toBe(START_GOLD - getItem(itemId).price);
    // We look at the backpack instead of a fixed slot, because the rule decides where the item
    // goes. `toHaveLength(1)` also proves the item was not duplicated.
    expect(after.backpack.filter((slot) => slot?.itemId === itemId)).toHaveLength(1);
    // The bought offer is gone from the shop. `toBeNull` checks for exactly `null`.
    expect(after.shop[0]).toBeNull();
  });

  it("does not change the state it was given", () => {
    const run = newRun(1);
    // `structuredClone` makes a deep copy: a second object with the same content, so that
    // changing one of them can never change the other.
    const copy = structuredClone(run);

    buyItem(run, 0);

    // `toEqual` compares the CONTENT of two objects (field by field), not whether they are the
    // same object. If `buyItem` had changed `run` in place, `run` would now differ from `copy`.
    expect(run).toEqual(copy);
  });

  it("changes nothing when the player cannot afford the offer", () => {
    // `{ ...newRun(1), gold: 0 }` copies the run and overrides one field: a player without gold.
    const poorRun = { ...newRun(1), gold: 0 };

    // The rule explains WHY the action is not possible - the interface shows this text.
    expect(buyBlocker(poorRun, 0)).toBe("Not enough gold");
    // `toBe` is stricter than `toEqual` here: it demands the very same object back, which proves
    // that a refused action returned the old state untouched and did not build a new one.
    expect(buyItem(poorRun, 0)).toBe(poorRun);
  });
});

const itemCount = (run: RunState) => run.backpack.filter((slot) => slot !== null).length;

/** A run whose backpack holds `itemIds` in its first slots; all other slots are free. */
function runWithBackpack(itemIds: string[], gold = START_GOLD): RunState {
  const run = newRun(1);
  const backpack = run.backpack.map((_, index) => (itemIds[index] ? { uid: `item-${index}`, itemId: itemIds[index] } : null));
  return { ...run, gold, backpack };
}

describe("fr1: sellItem", () => {
  it.each([
    ["chipped-dagger", 1],
    ["oak-buckler", 1],
    ["hunting-bow", 2],
    ["iron-cleaver", 2],
  ])("sells %s for half its price, rounded down (%i gold)", (itemId, expectedGold) => {
    expect(sellPrice(itemId)).toBe(expectedGold);

    const after = sellItem(runWithBackpack([itemId], 0), 0);

    expect(after.gold).toBe(expectedGold);
  });

  it("removes only the sold item and leaves the other slots untouched", () => {
    const run = runWithBackpack(["pot-lid", "hunting-bow", "oak-buckler"]);

    const after = sellItem(run, 1);

    expect(after.backpack[1]).toBeNull();
    expect(after.backpack[0]).toBe(run.backpack[0]);
    expect(after.backpack[2]).toBe(run.backpack[2]);
    expect(itemCount(after)).toBe(itemCount(run) - 1);
  });

  it("does not change the state it was given", () => {
    const run = runWithBackpack(["pot-lid"]);
    const copy = structuredClone(run);

    sellItem(run, 0);

    expect(run).toEqual(copy);
  });

  it("changes nothing when the slot is empty", () => {
    const run = runWithBackpack(["pot-lid"]);

    expect(sellBlocker(run, 3)).toBe("Nothing to sell here");
    expect(sellItem(run, 3)).toBe(run);
    expect(sellItem(run, 99)).toBe(run);
  });

  it("buying and selling an item again never creates gold or items", () => {
    const run = newRun(1);

    const bought = buyItem(run, 0);
    const slot = bought.backpack.findIndex((entry) => entry !== null);
    const sold = sellItem(bought, slot);

    expect(itemCount(sold)).toBe(0);
    expect(sold.gold).toBeLessThanOrEqual(run.gold);
  });
});

describe("fr1: rerollShop", () => {
  it("pays the reroll price and rolls new offers from the run's seed", () => {
    const run = newRun(1);
    const expectedRoll = rollShop(run.seed);

    const after = rerollShop(run);

    expect(after.gold).toBe(run.gold - REROLL_COST);
    expect(after.shop).toEqual(expectedRoll.offers);
    expect(after.seed).toBe(expectedRoll.seed);
  });

  it("is deterministic: the same run rerolls to the same offers", () => {
    expect(rerollShop(newRun(7)).shop).toEqual(rerollShop(newRun(7)).shop);
  });

  it("refreshes offers that were already sold", () => {
    const run = buyItem(newRun(1), 0);
    expect(run.shop[0]).toBeNull();

    expect(rerollShop(run).shop.every((offer) => offer !== null)).toBe(true);
  });

  it("changes nothing without gold, so gold never becomes negative", () => {
    const poorRun = { ...newRun(1), gold: REROLL_COST - 1 };

    expect(rerollBlocker(poorRun)).toBe("Not enough gold");
    expect(rerollShop(poorRun)).toBe(poorRun);
  });

  it("can use up the last gold exactly", () => {
    const after = rerollShop({ ...newRun(1), gold: REROLL_COST });

    expect(after.gold).toBe(0);
  });
});

describe("fr1: buyItem keeps gold and items consistent", () => {
  it("never lets gold drop below zero", () => {
    let run = { ...newRun(1), gold: 3 };

    for (let offerIndex = 0; offerIndex < run.shop.length; offerIndex++) {
      run = buyItem(run, offerIndex);
      expect(run.gold).toBeGreaterThanOrEqual(0);
    }
  });

  it("does not take gold or the offer when the backpack is full", () => {
    const fullRun = runWithBackpack(Array(BACKPACK_SIZE).fill("pot-lid"));

    expect(buyBlocker(fullRun, 0)).toBe("Backpack is full");
    expect(buyItem(fullRun, 0)).toBe(fullRun);
  });

  it("makes room again after a sale", () => {
    const fullRun = runWithBackpack(Array(BACKPACK_SIZE).fill("pot-lid"), 10);

    const afterSale = sellItem(fullRun, 2);
    const afterBuy = buyItem(afterSale, 0);

    expect(itemCount(afterBuy)).toBe(BACKPACK_SIZE);
    expect(afterBuy.backpack[2]?.itemId).toBe(fullRun.shop[0]);
  });
});
