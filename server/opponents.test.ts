// EXAMPLE (ex:) - this file only shows how a unit test works on the server. It is not a
// requirement test. Read src/run.test.ts first: it explains describe / it / expect step by step.
//
// The API code in server/ and the tests are both TypeScript. We test the pure functions in opponents.ts directly -
// there is no need to start the Express server, so the tests are fast and need no network or port.
//
// How to run it:  pnpm test server/opponents.test.ts

import { describe, expect, it } from "vitest";
import { HP_PER_EXTRA_ROUND, MAX_ITEMS, OPPONENTS, opponentForRound, parseRound } from "./opponents.ts";

describe("ex: parseRound", () => {
  // `parseRound` turns the text of `?round=...` into a number, or `null` if it is not valid.
  // Good input and bad input are tested separately, so a failure tells us which side broke.
  it("accepts positive whole numbers", () => {
    expect(parseRound("1")).toBe(1);
    expect(parseRound("12")).toBe(12);
  });

  // `it.each(list)(name, fn)` runs the same test once for every value in the list, so we do not
  // have to copy the test seven times. `%j` in the name is replaced by the value (as JSON), so a
  // failure reads e.g. `rejects "1.5"` and shows exactly which input was wrong.
  it.each([undefined, "", "0", "-1", "1.5", "abc", "99999999999999999999"])("rejects %j", (value) => {
    // The API must never crash on bad input: it answers `null` and the route returns a 400 error.
    expect(parseRound(value)).toBeNull();
  });
});

describe("ex: opponentForRound", () => {
  it("returns the hand-built opponent of that round", () => {
    // `toEqual` compares objects by content. The table entry has no `round`, so we add it.
    expect(opponentForRound(1)).toEqual({ ...OPPONENTS[0], round: 1 });
  });

  it("is deterministic: the same round always gives the same opponent", () => {
    // Calling the function twice and comparing the results is the simplest determinism test.
    expect(opponentForRound(4)).toEqual(opponentForRound(4));
  });

  it("past the table reuses the last opponent with more HP and never more than MAX_ITEMS items", () => {
    const last = OPPONENTS[OPPONENTS.length - 1];
    // Two rounds past the end of the table.
    const opponent = opponentForRound(OPPONENTS.length + 2);

    expect(opponent.id).toBe(last.id);
    // We compute the expected HP from the constants instead of writing a magic number, so the
    // test keeps working when the balancing values are changed.
    expect(opponent.hp).toBe(last.hp + 2 * HP_PER_EXTRA_ROUND);
    // `toBeLessThanOrEqual` is a "boundary" check: the exact item list may change, the limit not.
    expect(opponent.items.length).toBeLessThanOrEqual(MAX_ITEMS);
  });
});
