
import { useState } from "react"; // für B2: useState hinzugefügt
import { TICK_SECONDS } from "../battle";
import { describeEffects, getItem } from "../items";
import { sellPrice } from "../run";
import { BACKPACK_COLS } from "../shop";
import type { Backpack as BackpackSlots, ItemDef } from "../types";

/** Hover text for a backpack slot. */
const tooltip = (item: ItemDef) =>
  [item.name, ...describeEffects(item.effects).map(({ label }) => label), `⏱️ every ${item.cooldown * TICK_SECONDS}s`].join("\n");

interface BackpackProps {
  backpack: BackpackSlots;
  onSell: (slotIndex: number) => void;
  onMove: (fromIndex: number, toIndex: number) => void; // für B2: onMove hinzugefügt
}

export function Backpack({ backpack, onSell, onMove }: BackpackProps) {
  // B2: null means no item is selected.
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  function handleSlotClick(index: number) {
    // First click: select an occupied slot.
    if (selectedIndex === null) {
      if (backpack[index] !== null) {
        setSelectedIndex(index);
      }
      return;
    }

    // Clicking the selected slot again cancels the selection.
    if (selectedIndex === index) {
      setSelectedIndex(null);
      return;
    }

    // Move or swap, then clear the selection.
    if (backpack[selectedIndex] !== null) {
      onMove(selectedIndex, index);
    }

    setSelectedIndex(null);
  }

  function handleSell(index: number) {
    setSelectedIndex(null);
    onSell(index);
  }

  return (
    <section className="rounded-lg border border-panel-edge bg-panel p-4">
      <h2 className="font-display text-xl font-bold">🎒 Backpack</h2>

      <p className="mb-3 text-sm text-muted">
        Click an item to select it. Then click another slot to move or swap.
        Hover an item to see its stats.
      </p>

      {selectedIndex !== null && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-gold">
            Selected slot {selectedIndex + 1}. Choose a green target.
          </span>

          <button
            type="button"
            onClick={() => setSelectedIndex(null)}
            className="rounded border border-gold px-2 py-1 text-gold"
          >
            Cancel selection
          </button>
        </div>
      )}

      <ul
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${BACKPACK_COLS}, minmax(0, 1fr))`,
        }}
      >
        {backpack.map((slot, index) => {
          const item = slot ? getItem(slot.itemId) : null;

          // B2: Highlight the selection and valid target slots.
          let slotStyle = "border-dashed border-panel-edge";
          let actionText = "";

          if (selectedIndex === index) {
            slotStyle = "border-gold bg-gold/10";
            actionText = "Selected";
          } else if (selectedIndex !== null) {
            slotStyle = "border-green-500 bg-green-500/10";
            actionText = item ? "Swap here" : "Move here";
          } else if (item) {
            slotStyle = "border-gold/40 bg-ink/40";
          }

          return (
            <li
              key={slot?.uid ?? `empty-${index}`}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-md border-2 p-1 ${slotStyle}`}
            >
              <button
                type="button"
                onClick={() => handleSlotClick(index)}
                disabled={selectedIndex === null && item === null}
                aria-pressed={selectedIndex === index}
                aria-label={`Backpack slot ${index + 1}: ${item?.name ?? "empty"}`}
                title={item ? tooltip(item) : undefined}
                className="flex w-full min-h-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 disabled:cursor-default"
              >
                {item ? (
                  <>
                    <span className="text-3xl leading-none sm:text-4xl" aria-hidden>
                      {item.icon}
                    </span>
                    <span className="text-center text-xs leading-tight">
                      {item.name}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-muted">Empty</span>
                )}

                {selectedIndex !== null && (
                  <span className="text-center text-xs font-bold">
                    {actionText}
                  </span>
                )}
              </button>

              {item && (
                <button
                  type="button"
                  onClick={() => handleSell(index)}
                  aria-label={`Sell ${item.name} for ${sellPrice(item.id)} gold`}
                  className="rounded bg-gold px-1.5 py-0.5 text-xs font-bold text-ink hover:brightness-110"
                >
                  Sell +{sellPrice(item.id)} 🪙
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
