import { useEffect, useRef, useState } from "preact/hooks";
import type { JSX } from "preact";
import { cta } from "../../i18n/es.ts";

export interface ShareButtonProps {
  /** URL canónica ya construida con urls.ts (SPEC §12, paso 1). */
  url: string;
  /**
   * Texto del reparto (builder shareText de i18n). undefined → solo URL
   * (pantalla sin resultado calculado).
   */
  text?: string;
}

type Toast = { kind: "ok" | "warn"; message: string } | null;

/**
 * Copia al portapapeles con fallback jerárquico y veredicto explícito:
 * 1. `navigator.clipboard.writeText` (contexto seguro)
 * 2. `document.execCommand("copy")` (contextos no seguros / permisos)
 * Nunca falla en silencio (contrato de Task 5): devuelve false para que la UI
 * avise. Nota: `execCommand` está deprecado pero sigue vivo como último
 * recurso; su deprecación no invalida este fallback.
 */
async function copyWithFallback(content: string): Promise<boolean> {
  if (navigator.clipboard?.writeText != null) {
    try {
      await navigator.clipboard.writeText(content);
      return true;
    } catch {
      // Permiso denegado o portapapeles ocupado → fallback legacy.
    }
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = content;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Botón Compartir (SPEC §12): 1) `navigator.share` si existe (Web Share API
 * nativa); 2) si no (o si el share nativo falla sin cancelación), copia
 * `texto + URL` al portapapeles y confirma con toast daisyUI "Enlace
 * copiado". Si el portapapeles también falla, toast de aviso — el usuario
 * siempre recibe feedback.
 */
export default function ShareButton({ url, text }: ShareButtonProps) {
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (kind: "ok" | "warn", message: string): void => {
    if (toastTimer.current != null) clearTimeout(toastTimer.current);
    setToast({ kind, message });
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  useEffect(
    () => () => {
      if (toastTimer.current != null) clearTimeout(toastTimer.current);
    },
    [],
  );

  const share = async (event: JSX.TargetedEvent<HTMLButtonElement>) => {
    event.currentTarget.blur();
    // La URL puede llegar relativa (props serializadas en SSR): se resuelve
    // contra el documento para que Web Share y el portapapeles la reciban
    // absoluta.
    const absoluteUrl = new URL(url, location.href).href;
    if (typeof navigator !== "undefined" && navigator.share != null) {
      try {
        await navigator.share({
          title: text?.split("\n")[0],
          text: text ?? undefined,
          url: absoluteUrl,
        });
        return; // El sheet nativo ya es el feedback.
      } catch (error) {
        const name = (error as { name?: string } | null)?.name;
        if (name === "AbortError") return; // Cancelado por el usuario.
        // Fallo real de Web Share → caer al portapapeles.
      }
    }
    const content = text != null ? `${text}\n${absoluteUrl}` : absoluteUrl;
    const ok = await copyWithFallback(content);
    showToast(
      ok ? "ok" : "warn",
      ok ? cta.shareCopied : cta.shareCopyFailed,
    );
  };

  return (
    <div>
      <button type="button" class="btn btn-outline" onClick={share}>
        {cta.share}
      </button>
      {toast && (
        <div class="toast toast-center z-50">
          <div
            role="alert"
            class={`alert ${toast.kind === "ok" ? "alert-success" : "alert-warning"} py-2`}
          >
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
