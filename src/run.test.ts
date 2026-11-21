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
import { buyBlocker, buyItem, newRun, START_GOLD } from "./run";

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
