import { useState } from "preact/hooks";
import { cta } from "../../i18n/es.ts";

export interface ShareButtonProps {
  /** URL canónica ya construida con urls.ts (SPEC §12, paso 1). */
  url: string;
}

/**
 * STUB de compartir (SPEC §12): hoy copia la URL canónica al portapapeles y
 * lo confirma con un toast daisyUI. Task 6 lo completa con navigator.share
 * (paso 2 de la spec) y el texto de reparto.
 */
export default function ShareButton({ url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Portapapeles no disponible (permiso o contexto no seguro): sin
      // feedback por ahora; Task 6 añade el fallback nativo.
    }
  };

  return (
    <div>
      <button type="button" class="btn btn-outline" onClick={share}>
        {cta.share}
      </button>
      {copied && (
        <div class="toast toast-center z-50">
          <div role="alert" class="alert alert-success py-2">
            <span>{cta.shareCopied}</span>
          </div>
        </div>
      )}
    </div>
  );
}
