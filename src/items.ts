import type { ItemDef, ItemEffects } from "./types";

export const CATALOG: ItemDef[] = [
  { id: "chipped-dagger", name: "Chipped Dagger", icon: "🗡️", price: 2, cooldown: 4, effects: { damage: 3 } },
  { id: "hunting-bow", name: "Hunting Bow", icon: "🏹", price: 4, cooldown: 4, effects: { damage: 5 } },
  { id: "iron-cleaver", name: "Iron Cleaver", icon: "🪓", price: 5, cooldown: 8, effects: { damage: 12 } },
  { id: "oak-buckler", name: "Oak Buckler", icon: "🛡️", price: 3, cooldown: 5, effects: { block: 4 } },
  { id: "pot-lid", name: "Pot Lid", icon: "🍳", price: 2, cooldown: 3, effects: { block: 2 } },
  { id: "spiked-shield", name: "Spiked Shield", icon: "⚔️", price: 4, cooldown: 6, effects: { damage: 3, block: 3 } },

  { id: "dung-pile", name: "Dung Pile", icon: "💩", price: 3, cooldown: 4, effects: { poison: 1 } },
  { id: "toxic-blowpipe", name: "Toxic Blowpipe", icon: "🪈", price: 4, cooldown: 6, effects: { damage: 2, poison: 2 } },
  { id: "serpentine-helmet", name: "Serpentine Helmet", icon: "🐍", price: 5, cooldown: 8, effects: { block: 2, poison: 3 } },

  { id: "heavys-sandvich", name: "Heavy's Sandvich", icon: "🥪", price: 3, cooldown: 5, effects: { heal: 3 } },
  { id: "emergency-banana", name: "Emergency Banana", icon: "🍌", price: 3, cooldown: 6, effects: { heal: 4 } },
  { id: "s-budget-energy-drink", name: "S-Budget Energy Drink", icon: "🥤", price: 4, cooldown: 7, effects: { heal: 6 } },


  // B4: Fire Items
  { id: "emberlight", name: "Emberlight", icon: "⚔️", price: 3, cooldown: 3, effects: { damage: 2 }, set: "fire" },
  { id: "fire-cape", name: "Fire Cape", icon: "🔥", price: 3, cooldown: 4, effects: { block: 3 }, set: "fire" },
  { id: "ghast-fireball", name: "Ghast Fireball", icon: "☄️", price: 5, cooldown: 5, effects: { damage: 3 }, set: "fire" },

  // B4: Defence Bonus Items (Havels Set)
  { id: "havels-helm", name: "Havel's Helm", icon: "🪖", price: 3, cooldown: 4, effects: { block: 3 }, set: "havel" },
  { id: "havels-armor", name: "Havel's Armor", icon: "🪨", price: 4, cooldown: 6, effects: { block: 5 }, set: "havel" },
  { id: "havels-greatshield", name: "Havel's Greatshield", icon: "🛡️", price: 5, cooldown: 7, effects: { damage: 2, block: 4 }, set: "havel" },

];

const byId = new Map(CATALOG.map((item) => [item.id, item]));

export function getItem(id: string): ItemDef {
  const item = byId.get(id);
  if (!item) throw new Error(`Unknown item: ${id}`);
  return item;
}

const EFFECT_LABELS: [keyof ItemEffects, (n: number) => string][] = [
  ["damage", (n) => `⚔️ ${n} dmg`],
  ["block", (n) => `🛡️ +${n} block`],
  ["poison", (n) => `☠️ +${n} poison`],
  ["heal", (n) => `❤️ +${n} HP`],
  ["burn", (n) => `🔥 +${n} burn`],
];

/** Short labels for an item's effects, e.g. `[{ effect: "damage", label: "⚔️ 2 dmg" }, …]`. */
export function describeEffects(effects: ItemEffects): { effect: keyof ItemEffects; label: string }[] {
  return EFFECT_LABELS.flatMap(([effect, label]) => (effects[effect] ? [{ effect, label: label(effects[effect]) }] : []));
}
