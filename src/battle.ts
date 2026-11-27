import { getItem } from "./items";
import { itemIdsOf } from "./shop";
import type { Backpack, BattleEvent, BattleResult, Fighter, FighterItem, FighterSnapshot, ItemSet, Opponent, Side } from "./types";


/** Seconds per battle tick. */
export const TICK_SECONDS = 0.5;
/** Battles that last longer are decided by the timeout rule. */
export const MAX_TICKS = 60;
export const HERO_BASE_HP = 40;


/** B3: Poison deals damage every 4 ticks (2 seconds). */
export const POISON_TICK_INTERVAL = 4;


// B4: Fire set and Burn rules
export const FIRE_APPLY_INTERVAL = 4;
export const FIRE_STACKS_PER_APPLY = 2;
export const BURN_TICK_INTERVAL = 2;
export const BURN_DAMAGE_PER_STACK = 2;


/** B4: A set is active when the fighter owns at least 2 items of that set. */
export function hasActiveSet(fighter: Fighter, set: ItemSet): boolean {
  const count = fighter.items.filter((item) => item.set === set).length;
  return count >= 2; // true or false
}


/** Turns a list of item ids into a fighter with the catalog values of each item. */
export function buildFighter(itemIds: string[], baseHp: number, name = "Fighter"): Fighter {
  const items: FighterItem[] = itemIds.map((id) => {
    const def = getItem(id);
    return { itemId: def.id, name: def.name, icon: def.icon, cooldown: def.cooldown, effects: { ...def.effects }, set: def.set };
  });
  return { name, maxHp: baseHp, items };
}

/** The player's fighter: every backpack item and the hero's base HP. */
export function buildPlayerFighter(backpack: Backpack): Fighter {
  return buildFighter(itemIdsOf(backpack), HERO_BASE_HP, "Hero");
}

export function buildOpponentFighter(opponent: Opponent): Fighter {
  return buildFighter(opponent.items, opponent.hp, opponent.name);
}

interface FighterState {
  fighter: Fighter;
  hp: number;
  block: number;
  poison: number; // für B3
  burn: number; // B4: Current burn stacks
  /** Ticks each item has charged towards its cooldown. */
  charge: number[];
}

const other = (side: Side): Side => (side === "player" ? "opponent" : "player");

const snapshot = (s: FighterState): FighterSnapshot => ({
  hp: Math.max(0, s.hp),
  maxHp: s.fighter.maxHp,
  block: s.block,
  poison: s.poison, // für B3
  burn: s.burn, // für B4: Die aktuellen Burn-Stacks
});

const isDown = (s: FighterState) => s.hp <= 0;

/**
 * Runs a full battle. Pure and deterministic: the same fighters always give
 * the same result.
 *
 * Each tick:
 * 1. Each fighter charges all items by one tick; items whose charge reaches their cooldown fire.
 * 2. Fired items resolve (player first, then opponent). Both sides fire "simultaneously":
 *    which items fire is decided before any effect is applied.
 * After step 2 the battle ends if someone is down; if both are down, the player loses.
 * After `MAX_TICKS` the higher HP percentage wins; a tie is a player loss.
 */
export function simulateBattle(player: Fighter, opponent: Fighter): BattleResult {
  const state: Record<Side, FighterState> = {
    player: initState(player),
    opponent: initState(opponent),
  };
  const frames: BattleResult["frames"] = [
    { tick: 0, player: snapshot(state.player), opponent: snapshot(state.opponent), events: [] },
  ];
  const events: BattleEvent[] = [];

  const knockoutWinner = (): Side | null => {
    if (isDown(state.player)) return "opponent";
    if (isDown(state.opponent)) return "player";
    return null;
  };

  let winner: Side | null = null;
  let tick = 0;
  while (winner === null && tick < MAX_TICKS) {
    tick += 1;
    const tickEvents: BattleEvent[] = [];
    const emit = (event: Omit<BattleEvent, "tick">) => tickEvents.push({ tick, ...event });

    const fired: Record<Side, FighterItem[]> = {
      player: chargeItems(state.player),
      opponent: chargeItems(state.opponent),
    };
    for (const side of ["player", "opponent"] as const) {
      for (const item of fired[side]) resolveItem(item, state[side], state[other(side)], side, emit);
    }


    // B4: An active Fire set applies 2 burn stacks every 4 ticks.
    if (tick % FIRE_APPLY_INTERVAL === 0) {
      for (const side of ["player", "opponent"] as const) {
        const attacker = state[side];
        const enemySide = other(side);
        const enemy = state[enemySide];

        if (hasActiveSet(attacker.fighter, "fire")) {
          enemy.burn += FIRE_STACKS_PER_APPLY;

          emit({
            source: side,
            target: enemySide,
            kind: "burn",
            amount: FIRE_STACKS_PER_APPLY,
            itemId: null,
            message: `${attacker.fighter.name}'s Fire set adds ${FIRE_STACKS_PER_APPLY} burn stacks to ${enemy.fighter.name}`,
          });
        }
      }
    }

    // B4: Burn deals damage every 2 ticks and loses 1 stack.
    if (tick % BURN_TICK_INTERVAL === 0) {
      for (const side of ["player", "opponent"] as const) {
        const fighter = state[side];

        if (fighter.burn > 0 && fighter.hp > 0) {
          const damage = fighter.burn * BURN_DAMAGE_PER_STACK;

          // Unlike poison, burn damage hits block first.
          const absorbed = Math.min(fighter.block, damage);
          fighter.block -= absorbed;

          const hpDamage = Math.min(fighter.hp, damage - absorbed);
          fighter.hp -= hpDamage;

          // One burn stack disappears after each burn tick.
          fighter.burn = Math.max(0, fighter.burn - 1);

          emit({
            source: other(side),
            target: side,
            kind: "burn-tick",
            amount: hpDamage,
            itemId: null,
            message: `${fighter.fighter.name} takes ${hpDamage} burn damage (${absorbed} blocked); 1 burn stack decays (${fighter.burn} remaining)`,
          });
        }
      }
    }


    // B3: Poison Schadensblock - Apply and log poison damage every 4 ticks.
    if (tick % POISON_TICK_INTERVAL === 0) {
      for (const side of ["player", "opponent"] as const) {
        const fighter = state[side];

        if (fighter.poison > 0 && fighter.hp > 0) {
          const damage = Math.min(fighter.poison, fighter.hp);
          fighter.hp -= damage;

          emit({
            source: other(side),
            target: side,
            kind: "poison-tick",
            amount: damage,
            itemId: null,
            message: `${fighter.fighter.name} takes ${damage} poison damage (ignores block)`,
          });
        }
      }
    }


    winner = knockoutWinner();

    frames.push({ tick, player: snapshot(state.player), opponent: snapshot(state.opponent), events: tickEvents });
    events.push(...tickEvents);
  }

  if (winner !== null) return { winner, reason: "knockout", frames, events };
  return { winner: timeoutWinner(state.player, state.opponent), reason: "timeout", frames, events };
}

function initState(fighter: Fighter): FighterState {
  return { fighter, hp: fighter.maxHp, block: 0, poison: 0,  burn: 0, charge: fighter.items.map(() => 0) }; // für B3 auch "poison" hinzugefügt, für B4 auch "burn" hinzugefügt
}

/** Advances one tick of cooldowns and returns the items that fire this tick. */
function chargeItems(s: FighterState): FighterItem[] {
  const fired: FighterItem[] = [];
  s.fighter.items.forEach((item, i) => {
    s.charge[i] += 1;
    if (s.charge[i] >= item.cooldown) {
      s.charge[i] = 0;
      fired.push(item);
    }
  });
  return fired;
}

function resolveItem(
  item: FighterItem,
  self: FighterState,
  enemy: FighterState,
  side: Side,
  emit: (event: Omit<BattleEvent, "tick">) => void,
) {
  const { damage, block, poison, heal } = item.effects;
  const base = { source: side, itemId: item.itemId };
  const enemySide = other(side);

  if (damage) {
    const absorbed = Math.min(enemy.block, damage);
    enemy.block -= absorbed;
    enemy.hp -= damage - absorbed;
    const note = absorbed > 0 ? ` (${absorbed} blocked)` : "";
    emit({ ...base, target: enemySide, kind: "damage", amount: damage, message: `${item.name} hits ${enemy.fighter.name} for ${damage}${note}` });
  }

  // B4: Havel's Set grants +2 block when a Havel item activates.
  const havelBonus =
    item.set === "havel" && hasActiveSet(self.fighter, "havel")
      ? 2
      : 0;

  const totalBlock = (block ?? 0) + havelBonus;

  if (totalBlock > 0) {
    self.block += totalBlock;

    const bonusText =
      havelBonus > 0 ? " (+2 Havel set bonus)" : "";

    emit({
      ...base,
      target: side,
      kind: "block",
      amount: totalBlock,
      message: `${item.name} grants ${self.fighter.name} ${totalBlock} block${bonusText}`,
    });
  }

  // B3: poison effect
  if (poison) {
    enemy.poison += poison;

    emit({
      ...base,
      target: enemySide,
      kind: "poison",
      amount: poison,
      message: `${item.name} adds ${poison} poison stack(s) to ${enemy.fighter.name}`,
    });
  }

  // B3: heal effect
  if (heal) {
    const healed = Math.min(heal, Math.max(0, self.fighter.maxHp - self.hp));
    self.hp += healed;

    emit({
      ...base,
      target: side,
      kind: "heal",
      amount: healed,
      message: `${item.name} heals ${self.fighter.name} for ${healed} HP`,
    });
  }

}

function timeoutWinner(player: FighterState, opponent: FighterState): Side {
  const ratio = (s: FighterState) => s.hp / s.fighter.maxHp;
  return ratio(player) > ratio(opponent) ? "player" : "opponent";
}
