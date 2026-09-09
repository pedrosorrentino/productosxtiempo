import { useState } from "preact/hooks";
import { cta } from "../../i18n/es.ts";
import ShareModal from "./ShareModal.tsx";

export interface ShareButtonProps {
  /** URL canónica ya construida con urls.ts (SPEC §12, paso 1). */
  url: string;
  /** Texto del reparto (builder shareText de i18n). */
  text?: string | null;
  productName?: string | null;
  countryName?: string | null;
  countrySlug?: string | null;
  price?: number | null;
  currencySymbol?: string | null;
  hours?: number | null;
  workdays8h?: number | null;
  months?: number | null;
  years?: number | null;
  ogImageUrl?: string | null;
  buttonClass?: string;
  buttonLabel?: string;
}

/**
 * Botón Compartir enriquecido con Ventana Modal Viral:
 * Al pulsar, despliega la modal interactiva con preview y opciones para
 * Facebook, Instagram, X (Twitter), WhatsApp y Telegram.
 */
export default function ShareButton({
  url,
  text,
  productName,
  countryName,
  countrySlug,
  price,
  currencySymbol,
  hours,
  workdays8h,
  months,
  years,
  ogImageUrl,
  buttonClass,
  buttonLabel,
}: ShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div class="flex justify-center sm:justify-end w-full sm:w-auto">
      <button
        type="button"
        class={buttonClass || "btn btn-outline w-full sm:w-auto justify-center border-base-300 hover:border-primary hover:bg-primary/10 hover:text-primary transition-all flex items-center gap-2 cursor-pointer"}
        onClick={(e) => {
          (e.currentTarget as HTMLButtonElement | null)?.blur?.();
          setIsModalOpen(true);
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width={2}
          stroke-linecap="round"
          stroke-linejoin="round"
          class="shrink-0"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span>{buttonLabel || cta.share}</span>
      </button>

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        url={url}
        defaultText={text}
        productName={productName}
        countryName={countryName}
        countrySlug={countrySlug}
        price={price}
        currencySymbol={currencySymbol}
        hours={hours}
        workdays8h={workdays8h}
        months={months}
        years={years}
        ogImageUrl={ogImageUrl}
      />
    </div>
  );
}
