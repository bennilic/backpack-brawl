import { describe, expect, it } from "vitest";
import { buildFighter, simulateBattle } from "./battle";

describe("B3: Status effects", () => {
  it("Poison stacks up and ignores block", () => {
    // 1. Arrange: Prepare two fighters.
    const player = buildFighter(["dung-pile"], 40);
    const opponent = buildFighter(["pot-lid"], 40);

    // 2. Act: Simulate the battle.
    const result = simulateBattle(player, opponent);

    // 3. Assert: Check the expected results.
    expect(result.frames[4].opponent.poison).toBe(1);
    expect(result.frames[8].opponent.poison).toBe(2);
    expect(result.frames[8].opponent.hp).toBe(37);
    expect(result.frames[8].opponent.block).toBe(4);
  });


  it("Heal restores HP but never exceeds max HP", () => {
    // 1. Arrange: Zwei fighter vorbereiten.
    const player = buildFighter(["chipped-dagger"], 40);
    const opponent = buildFighter(["heavys-sandvich"], 20);

    // 2. Act: Simulate the battle.
    const result = simulateBattle(player, opponent);

    // 3. Assert: Check the expected results.
    expect(result.frames[4].opponent.hp).toBe(17);
    expect(result.frames[5].opponent.hp).toBe(20);
    expect(result.frames.every((frame) => frame.opponent.hp <= 20)).toBe(true);
  });


  it("Battle results are deterministic", () => {
    // 1. Arrange: Zwei fighter vorbereiten.
    const player = buildFighter(["dung-pile"], 40);
    const opponent = buildFighter(["heavys-sandvich"], 40);

    // 2. Act: Simulate the same battle twice.
    const result1 = simulateBattle(player, opponent);
    const result2 = simulateBattle(player, opponent);

    // 3. Assert: Both results must be identical.
    expect(result1).toEqual(result2);
  });




});