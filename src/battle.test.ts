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







describe("B4: Havel's Set", () => {
  it("Grants +2 block per Havel item activation when at least 2 are equipped", () => {
    // One Havel item: no set bonus
    const oneHavel = buildFighter(["havels-helm"], 40);

    // Two Havel items: set bonus active
    const twoHavel = buildFighter(
      ["havels-helm", "havels-armor"],
      40
    );

    // Three Havel items: same bonus, not stronger
    const threeHavel = buildFighter(
      ["havels-helm", "havels-armor", "havels-greatshield"],
      40
    );

    const opponent = buildFighter(["pot-lid"], 40);

    const resultOne = simulateBattle(oneHavel, opponent);
    const resultTwo = simulateBattle(twoHavel, opponent);
    const resultThree = simulateBattle(threeHavel, opponent);

    // Tick 4: Havel's Helm activates (3 base block)
    expect(resultOne.frames[4].player.block).toBe(3);
    expect(resultTwo.frames[4].player.block).toBe(5); // bei Tick 4 ist nur der Havel's Helm aktiv, also 3 + 2 = 5 block
    expect(resultThree.frames[4].player.block).toBe(5); // bei Tick 4 ist nur der Havel's Helm aktiv, also 3 + 2 = 5 block

    // Tick 6: Havel's Armor activates too (5 + 2 block Set Effect)
    // Previous 5 block + new 7 block = 12
    expect(resultTwo.frames[6].player.block).toBe(12);
  });
});




describe("B4: Fire Set and Burn", () => {
  it("Activates with 2 Fire items, does not scale with 3, and burn decays", () => {
    const oneFire = buildFighter(["emberlight"], 40);
    const twoFire = buildFighter(["emberlight", "fire-cape"], 40);
    const threeFire = buildFighter(
      ["emberlight", "fire-cape", "ghast-fireball"],
      40
    );

    const opponent = buildFighter([], 100);

    const resultOne = simulateBattle(oneFire, opponent);
    const resultTwo = simulateBattle(twoFire, opponent);
    const resultThree = simulateBattle(threeFire, opponent);

    // One Fire item does not activate Burn.
    expect(resultOne.frames[4].opponent.burn).toBe(0);

    // Tick 4: +2 stacks, 4 damage, then 1 stack decays.
    expect(resultTwo.frames[4].opponent.burn).toBe(1);

    // Tick 6: Remaining stack deals 2 damage and decays.
    expect(resultTwo.frames[6].opponent.burn).toBe(0);

    // Tick 8: Fire set applies 2 new stacks.
    expect(resultTwo.frames[8].opponent.burn).toBe(1);

    // A third Fire item does not increase the Burn bonus.
    expect(resultThree.frames[4].opponent.burn).toBe(1);
    expect(resultThree.frames[6].opponent.burn).toBe(0);
    expect(resultThree.frames[8].opponent.burn).toBe(1);
  });

  it("Burn damage is absorbed by block", () => {
    const player = buildFighter(
      ["fire-cape", "ghast-fireball"],
      40
    );
    const opponent = buildFighter(["pot-lid"], 100);

    const result = simulateBattle(player, opponent);

    // Tick 3: Pot Lid grants 2 block.
    expect(result.frames[3].opponent.block).toBe(2);

    // Tick 4: Burn causes 4 damage.
    // 2 are blocked, 2 are deducted from HP.
    expect(result.frames[4].opponent.block).toBe(0);
    expect(result.frames[4].opponent.hp).toBe(98);

    // Tick 6: Pot Lid grants 2 new block.
    // The remaining burn stack deals 2 damage,
    // fully absorbed by block.
    expect(result.frames[6].opponent.hp).toBe(
      result.frames[5].opponent.hp
    );
    expect(result.frames[6].opponent.burn).toBe(0);
  });
});