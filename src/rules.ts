import {
  HERO_BASE_HP,
  MAX_TICKS,
  TICK_SECONDS,
  POISON_TICK_INTERVAL,
  FIRE_APPLY_INTERVAL,
  FIRE_STACKS_PER_APPLY,
  BURN_TICK_INTERVAL,
  BURN_DAMAGE_PER_STACK,
} from "./battle"; // für B3: Poison-Stacks und für B4: Burn-Stacks
import { GOLD_PER_ROUND, REROLL_COST, START_GOLD, START_LIVES, WINS_TO_VICTORY } from "./run";
import { BACKPACK_COLS, BACKPACK_ROWS, SHOP_SIZE } from "./shop";
import type { ItemEffects } from "./types";

/**
 * Player-facing explanations of the rules. Built from the game constants so
 * the texts stay correct when numbers are rebalanced.
 */

const BATTLE_SECONDS = MAX_TICKS * TICK_SECONDS;

/** Tooltip per item effect. */
export const EFFECT_HELP: Record<keyof ItemEffects, string> = {
  damage: "Damage: hits the enemy. Block absorbs it first, the rest is lost from HP.",
  block: "Block: absorbs incoming damage until used up. Unused block stays for the rest of the battle.",
  poison: `Poison: adds stacks to the enemy. Every ${POISON_TICK_INTERVAL * TICK_SECONDS} seconds, each stack deals 1 HP damage, ignoring block. Stacks accumulate and last until the battle ends.`, // für B3
  heal: "Heal: restores your own HP, but never above your maximum HP.",
  burn: `Burn: every ${BURN_TICK_INTERVAL * TICK_SECONDS} seconds, each stack deals ${BURN_DAMAGE_PER_STACK} damage. Block absorbs damage first. After each Burn tick, 1 stack disappears, even if the damage was fully blocked.`, // für B4: Burn-Stacks
};


export const COOLDOWN_HELP = `Cooldown: the item fires every time this much battle time has passed (1 tick = ${TICK_SECONDS} s).`;

/** Tooltip per fighter status shown in battle. */
export const STATUS_HELP = {
  hp: "HP: reaching 0 is a knockout.",
  block: EFFECT_HELP.block,
  poison: EFFECT_HELP.poison, // für B3
  burn: EFFECT_HELP.burn, // für B4: Burn-Stacks
  timer: `After ${BATTLE_SECONDS} s the fighter with the higher share of HP wins; a tie counts as your loss.`,
};

export interface RuleSection {
  title: string;
  rules: string[];
}

export const RULES: RuleSection[] = [
  {
    title: "🏆 The run",
    rules: [
      `Reach ${WINS_TO_VICTORY} wins before you lose all ${START_LIVES} lives.`,
      `Each battle is one round: a win gives +1 win, a loss costs 1 life.`,
      `Opponents get tougher every round.`,
    ],
  },
  {
    title: "🏪 Shop & backpack",
    rules: [
      `You start with ${START_GOLD} 🪙 and earn ${GOLD_PER_ROUND} 🪙 at the start of every new round. Unspent gold carries over.`,
      `The shop offers ${SHOP_SIZE} new items every round.`,
      `Reroll rolls ${SHOP_SIZE} new offers for ${REROLL_COST} 🪙.`,
      `Bought items go to the first free slot of your ${BACKPACK_COLS}×${BACKPACK_ROWS} backpack. With a full backpack you can't buy until you sell something.`,
      `Sell an item from the backpack for half its price, rounded down.`,
      `Only items in your backpack fight. Their position doesn't matter.`,
    ],
  },
  {
    title: "⚔️ Battle",
    rules: [
      `Battles run on their own. Your hero has ${HERO_BASE_HP} HP; every item fires whenever its cooldown is up.`,
      `Damage hits block first; only the rest is lost from HP. Unused block stays for the rest of the battle.`,
      `Knock the enemy out to win. ${STATUS_HELP.timer} If both fall at once, you lose.`,
      // Für B3:
      `Poison adds stacks to the enemy. Every ${POISON_TICK_INTERVAL * TICK_SECONDS} seconds, each stack deals 1 HP damage directly, ignoring block. Stacks accumulate and do not decay.`,
      `Heal restores the fighter's own HP, but never above their maximum HP.`,

    ],
  },

  // Für B4: Item Sets & Burn
  {
    title: "🔥 Item Sets & Burn (B4)",
    rules: [
      "There are two item sets: Fire & Havel. Each set contains 3 items.",
      "A set bonus is active when a fighter owns at least 2 items of that set. Set bonuses work for both the player and opponents.",

      `Fire Set: every ${FIRE_APPLY_INTERVAL * TICK_SECONDS} seconds, the enemy receives ${FIRE_STACKS_PER_APPLY} Burn stacks while the set is active.`,

      `Burn: every ${BURN_TICK_INTERVAL * TICK_SECONDS} seconds, each stack deals ${BURN_DAMAGE_PER_STACK} damage. Block absorbs this damage before HP is reduced.`,

      "After every Burn damage tick, 1 Burn stack disappears, even if all damage was blocked & even on the same tick the Burn-stacks were applied",

      "Unlike Poison, Burn deals more damage per stack, ticks more frequently and decays over time.",

      "Having 3 Fire items instead of 2 does not increase the Burn set bonus.",

      "Havel's Set: every Havel item activation grants 2 additional Block while the set is active. The bonus per activation does not increase with a third Havel item.",
    ],
  },


];
