import { useState } from "preact/hooks";
import type { JSX } from "preact";
import { priceForm } from "../../i18n/es.ts";

export interface PriceInputProps {
  slug: string;
  currencySymbol: string;
  initialPrice?: number | null;
  initialLabel?: string | null;
  onPriceChange?: (price: number | null) => void;
  onLabelChange?: (label: string | null) => void;
}

const parsePositive = (raw: string): number | null => {
  const value = Number(raw);
  return raw.trim() !== "" && Number.isFinite(value) && value > 0 ? value : null;
};

/**
 * Isla de doble modo:
 * - Navegación (página de país): botón → `/{slug}/precio?precio=&nombre=`.
 *   Si solo hay nombre, navega igualmente con los params presentes.
 * - Inline (ResultView): con `onPriceChange`/`onLabelChange` recalcula en vivo
 *   sin navegar.
 */
export default function PriceInput({
  slug,
  currencySymbol,
  initialPrice = null,
  initialLabel = null,
  onPriceChange,
  onLabelChange,
}: PriceInputProps) {
  const inline = typeof onPriceChange === "function";
  const [priceText, setPriceText] = useState(
    initialPrice != null ? String(initialPrice) : "",
  );
  const [label, setLabel] = useState(initialLabel ?? "");

  const onPriceInput = (event: JSX.TargetedEvent<HTMLInputElement>) => {
    const raw = event.currentTarget.value;
    setPriceText(raw);
    onPriceChange?.(parsePositive(raw));
  };

  const onLabelInput = (event: JSX.TargetedEvent<HTMLInputElement>) => {
    const raw = event.currentTarget.value;
    setLabel(raw);
    const trimmed = raw.trim();
    onLabelChange?.(trimmed === "" ? null : trimmed);
  };

  const navigate = () => {
    const price = parsePositive(priceText);
    const name = label.trim();
    const parts: string[] = [];
    if (price != null) parts.push(`precio=${encodeURIComponent(String(price))}`);
    if (name !== "") parts.push(`nombre=${encodeURIComponent(name)}`);
    location.href =
      parts.length > 0 ? `/${slug}/precio?${parts.join("&")}` : `/${slug}/precio`;
  };

  return (
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="label" for="price-input">
          {priceForm.priceLabel}
        </label>
        <label class="input w-full items-center gap-2">
          <span>{currencySymbol}</span>
          <input
            id="price-input"
            type="number"
            inputmode="decimal"
            min="1"
            class="grow"
            placeholder={priceForm.pricePlaceholder}
            value={priceText}
            onInput={onPriceInput}
          />
        </label>
      </div>
      <div>
        <label class="label" for="price-label">
          {priceForm.nameLabel}
        </label>
        <input
          id="price-label"
          type="text"
          class="input w-full"
          placeholder={priceForm.namePlaceholder}
          value={label}
          onInput={onLabelInput}
        />
      </div>
      {!inline && (
        <div class="sm:col-span-2">
          <button type="button" class="btn btn-primary" onClick={navigate}>
            {priceForm.submit}
          </button>
        </div>
      )}
    </div>
  );
}
