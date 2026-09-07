import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import {
  generateStorytellingCopy,
  type ViralAngle,
  type MetricFocus,
  type SocialNetwork,
} from "../../lib/storytelling.ts";

export type { SocialNetwork, ViralAngle, MetricFocus };

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  defaultText?: string | null;
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
}

export default function ShareModal({
  isOpen,
  onClose,
  url,
  productName: rawProductName,
  countryName: rawCountryName,
  countrySlug: rawCountrySlug,
  price,
  currencySymbol: rawCurrencySymbol,
  hours: rawHours,
  workdays8h: rawWorkdays,
  months: rawMonths,
  years: rawYears,
  ogImageUrl,
}: ShareModalProps) {
  const productName = rawProductName || "este producto";
  const countryName = rawCountryName || "España";
  const countrySlug = rawCountrySlug || "espana";
  const currencySymbol = rawCurrencySymbol || "€";
  const hours = rawHours ?? 40;
  const workdays8h = rawWorkdays ?? 5;
  const months = rawMonths ?? 0.25;
  const years = rawYears ?? 0.02;

  const [selectedNetwork, setSelectedNetwork] = useState<SocialNetwork>("x");
  const [viralAngle, setViralAngle] = useState<ViralAngle>("shock");
  const [metricFocus, setMetricFocus] = useState<MetricFocus>("workdays");
  const [includeHashtags, setIncludeHashtags] = useState<boolean>(true);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [customText, setCustomText] = useState<string>("");
  const [isEditingText, setIsEditingText] = useState<boolean>(false);
  const notificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // URL canónica absoluta
  const absoluteUrl = useMemo(() => {
    if (typeof location !== "undefined") {
      try {
        return new URL(url, location.href).href;
      } catch {
        return url;
      }
    }
    return `https://precioentiempo.com${url.startsWith("/") ? url : `/${url}`}`;
  }, [url]);

  // URL de la imagen OG con cache-buster para garantizar que cargue el diseño actualizado
  const resolvedOgImage = useMemo(() => {
    let base = ogImageUrl;
    if (!base) {
      base = `/og/${countrySlug}.png`;
    }
    if (typeof location !== "undefined" && base.startsWith("/")) {
      return `${location.origin}${base}`;
    }
    return base.startsWith("http") ? base : `https://precioentiempo.com${base}`;
  }, [ogImageUrl, countrySlug]);

  const updateStory = (
    nextAngle: ViralAngle,
    nextMetric: MetricFocus,
    nextNetwork: SocialNetwork,
    nextHashtags: boolean
  ) => {
    const text = generateStorytellingCopy({
      viralAngle: nextAngle,
      metricFocus: nextMetric,
      selectedNetwork: nextNetwork,
      productName,
      countryName,
      price: price ?? undefined,
      currencySymbol,
      hours,
      workdays8h,
      months,
      years,
      includeHashtags: nextHashtags,
    });
    setCustomText(text);
  };

  // Manejo de scroll corporal al abrir/cerrar y sincronización inicial de texto
  useEffect(() => {
    if (isOpen) {
      setIsEditingText(false);
      updateStory(viralAngle, metricFocus, selectedNetwork, includeHashtags);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const showNotification = (msg: string) => {
    if (notificationTimer.current) clearTimeout(notificationTimer.current);
    setCopiedNotification(msg);
    notificationTimer.current = setTimeout(() => {
      setCopiedNotification(null);
    }, 2800);
  };

  const copyToClipboard = async (content: string, successMsg: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
        showNotification(successMsg);
        return true;
      }
    } catch {}
    try {
      const textarea = document.createElement("textarea");
      textarea.value = content;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (ok) showNotification(successMsg);
      return ok;
    } catch {
      showNotification("Error al copiar al portapapeles");
      return false;
    }
  };

  const handleCopyLink = () => {
    copyToClipboard(absoluteUrl, "¡Enlace copiado al portapapeles!");
  };

  const handleCopyText = () => {
    const textToCopy = `${customText}\n\n${absoluteUrl}`;
    copyToClipboard(textToCopy, "¡Texto viral y enlace copiados! Listos para pegar.");
  };

  const handleShareNative = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `${productName} en ${countryName} · Precio en tiempo`,
          text: customText,
          url: absoluteUrl,
        });
      } catch (err: unknown) {
        if ((err as { name?: string })?.name !== "AbortError") {
          handleCopyText();
        }
      }
    } else {
      handleCopyText();
    }
  };

  const handleDownloadImage = async () => {
    try {
      showNotification("Descargando infografía de alto impacto...");
      const res = await fetch(resolvedOgImage);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `precio-en-tiempo-${productName.toLowerCase().replace(/\s+/g, "-")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      showNotification("¡Infografía descargada! Lista para Stories o Redes.");
    } catch {
      window.open(resolvedOgImage, "_blank");
      showNotification("Imagen abierta en nueva pestaña para guardar.");
    }
  };

  const handleExecuteShare = () => {
    const shareMessage = customText.trim();
    let targetShareUrl = "";

    switch (selectedNetwork) {
      case "x": {
        targetShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(absoluteUrl)}`;
        window.open(targetShareUrl, "_blank", "noopener,noreferrer");
        break;
      }
      case "whatsapp": {
        const fullWp = `${shareMessage}\n\n${absoluteUrl}`;
        targetShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullWp)}`;
        window.open(targetShareUrl, "_blank", "noopener,noreferrer");
        break;
      }
      case "telegram": {
        targetShareUrl = `https://t.me/share/url?url=${encodeURIComponent(absoluteUrl)}&text=${encodeURIComponent(shareMessage)}`;
        window.open(targetShareUrl, "_blank", "noopener,noreferrer");
        break;
      }
      case "facebook": {
        targetShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(absoluteUrl)}&quote=${encodeURIComponent(shareMessage)}`;
        window.open(targetShareUrl, "_blank", "noopener,noreferrer,width=600,height=500");
        break;
      }
      case "instagram": {
        handleCopyText();
        setTimeout(() => {
          window.open("https://instagram.com", "_blank", "noopener,noreferrer");
        }, 600);
        break;
      }
    }
  };

  // Acciones de cambio con reactividad inmediata y síncrona
  const selectAngle = (angle: ViralAngle) => {
    setViralAngle(angle);
    setIsEditingText(false);
    updateStory(angle, metricFocus, selectedNetwork, includeHashtags);
  };

  const selectMetric = (metric: MetricFocus) => {
    setMetricFocus(metric);
    setIsEditingText(false);
    updateStory(viralAngle, metric, selectedNetwork, includeHashtags);
  };

  const selectNetwork = (net: SocialNetwork) => {
    setSelectedNetwork(net);
    if (!isEditingText) {
      updateStory(viralAngle, metricFocus, net, includeHashtags);
    }
  };

  const toggleHashtags = (enabled: boolean) => {
    setIncludeHashtags(enabled);
    if (!isEditingText) {
      updateStory(viralAngle, metricFocus, selectedNetwork, enabled);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        class="board-plate border border-base-300 bg-base-100 shadow-2xl rounded-xl max-w-5xl w-full my-auto max-h-[94vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* ---- Cabecera del modal ---- */}
        <div class="flex items-center justify-between px-5 py-3.5 border-b border-base-300 bg-base-200/60 shrink-0">
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width={2}>
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </span>
            <div>
              <h2 id="share-modal-title" class="font-signage uppercase text-xl sm:text-2xl text-primary tracking-wide leading-none">
                Estudio de Compartición Viral
              </h2>
              <p class="font-board-mono text-xs opacity-75 mt-0.5">
                Storytelling persuasivo e infografía de alto impacto diseñados para maximizar clics
              </p>
            </div>
          </div>
          <button
            type="button"
            class="w-9 h-9 rounded-md hover:bg-base-300 flex items-center justify-center transition-colors text-base-content/80 hover:text-base-content cursor-pointer"
            aria-label="Cerrar modal"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width={2}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ---- Notificación flotante de copiado ---- */}
        {copiedNotification && (
          <div class="bg-accent text-accent-content font-board-mono text-xs px-4 py-2 font-bold text-center flex items-center justify-center gap-2 animate-in slide-in-from-top duration-150 shrink-0">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width={2.5}>
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span>{copiedNotification}</span>
          </div>
        )}

        {/* ---- Selector de Red Social: Barra 100% fluida SIN scrollbars ---- */}
        <div class="px-4 sm:px-5 py-3 border-b border-base-300 bg-base-200/40 shrink-0">
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full">
            {/* X / Twitter */}
            <button
              type="button"
              class={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-board-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                selectedNetwork === "x"
                  ? "bg-black text-white ring-2 ring-white/40 shadow-lg font-bold scale-[1.02]"
                  : "bg-base-200 text-base-content/75 hover:bg-base-300 hover:text-base-content"
              }`}
              onClick={() => selectNetwork("x")}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>X (Twitter)</span>
            </button>

            {/* WhatsApp */}
            <button
              type="button"
              class={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-board-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                selectedNetwork === "whatsapp"
                  ? "bg-[#25D366] text-slate-950 font-bold shadow-lg ring-2 ring-emerald-400 scale-[1.02]"
                  : "bg-base-200 text-base-content/75 hover:bg-base-300 hover:text-base-content"
              }`}
              onClick={() => selectNetwork("whatsapp")}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span>WhatsApp</span>
            </button>

            {/* Telegram */}
            <button
              type="button"
              class={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-board-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                selectedNetwork === "telegram"
                  ? "bg-[#229ED9] text-white font-bold shadow-lg ring-2 ring-sky-300 scale-[1.02]"
                  : "bg-base-200 text-base-content/75 hover:bg-base-300 hover:text-base-content"
              }`}
              onClick={() => selectNetwork("telegram")}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              <span>Telegram</span>
            </button>

            {/* Facebook */}
            <button
              type="button"
              class={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-board-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                selectedNetwork === "facebook"
                  ? "bg-[#1877F2] text-white font-bold shadow-lg ring-2 ring-blue-300 scale-[1.02]"
                  : "bg-base-200 text-base-content/75 hover:bg-base-300 hover:text-base-content"
              }`}
              onClick={() => selectNetwork("facebook")}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </button>

            {/* Instagram */}
            <button
              type="button"
              class={`col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-board-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                selectedNetwork === "instagram"
                  ? "bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white font-bold shadow-lg ring-2 ring-pink-400 scale-[1.02]"
                  : "bg-base-200 text-base-content/75 hover:bg-base-300 hover:text-base-content"
              }`}
              onClick={() => selectNetwork("instagram")}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>Instagram</span>
            </button>
          </div>
        </div>

        {/* ---- Cuerpo del modal: 2 Columnas ---- */}
        <div class="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 overscroll-contain">
          
          {/* ---- Columna Izquierda: Ganchos, Métricas y Storytelling ---- */}
          <div class="lg:col-span-5 space-y-4">
            {/* 1. Ganchos Virales Interactivos */}
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="font-signage uppercase text-sm tracking-wider text-base-content font-bold">
                  1. Enfoque de Storytelling
                </label>
                <span class="text-[11px] font-board-mono text-primary font-semibold">
                  Toca para cambiar la historia
                </span>
              </div>
              <div class="grid grid-cols-2 gap-2 font-board-mono text-xs">
                <button
                  type="button"
                  class={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    viralAngle === "shock"
                      ? "bg-secondary/20 border-secondary ring-1 ring-secondary text-base-content font-bold shadow-md"
                      : "bg-base-200/70 border-base-300 text-base-content/75 hover:bg-base-200 hover:border-base-content/30"
                  }`}
                  onClick={() => selectAngle("shock")}
                >
                  <span class="flex items-center gap-1.5 text-secondary font-bold text-sm">
                    ⚡ Indignación
                  </span>
                  <span class="text-[11px] opacity-80 leading-tight">Shock de realidad y debate masivo</span>
                </button>

                <button
                  type="button"
                  class={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    viralAngle === "reality"
                      ? "bg-primary/20 border-primary ring-1 ring-primary text-base-content font-bold shadow-md"
                      : "bg-base-200/70 border-base-300 text-base-content/75 hover:bg-base-200 hover:border-base-content/30"
                  }`}
                  onClick={() => selectAngle("reality")}
                >
                  <span class="flex items-center gap-1.5 text-primary font-bold text-sm">
                    ⌛ Tiempo de Vida
                  </span>
                  <span class="text-[11px] opacity-80 leading-tight">Reflexión profunda de Pepe Mújica</span>
                </button>

                <button
                  type="button"
                  class={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    viralAngle === "curiosity"
                      ? "bg-accent/20 border-accent ring-1 ring-accent text-base-content font-bold shadow-md"
                      : "bg-base-200/70 border-base-300 text-base-content/75 hover:bg-base-200 hover:border-base-content/30"
                  }`}
                  onClick={() => selectAngle("curiosity")}
                >
                  <span class="flex items-center gap-1.5 text-accent font-bold text-sm">
                    🤯 Dato Revelador
                  </span>
                  <span class="text-[11px] opacity-80 leading-tight">Loop de curiosidad y sorpresa</span>
                </button>

                <button
                  type="button"
                  class={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    viralAngle === "challenge"
                      ? "bg-info/20 border-info ring-1 ring-info text-base-content font-bold shadow-md"
                      : "bg-base-200/70 border-base-300 text-base-content/75 hover:bg-base-200 hover:border-base-content/30"
                  }`}
                  onClick={() => selectAngle("challenge")}
                >
                  <span class="flex items-center gap-1.5 text-info font-bold text-sm">
                    🎯 Reto Abierto
                  </span>
                  <span class="text-[11px] opacity-80 leading-tight">Desafío para calcular su nómina</span>
                </button>
              </div>
            </div>

            {/* 2. Métrica de Impacto */}
            <div>
              <label class="block font-signage uppercase text-sm tracking-wider text-base-content font-bold mb-1.5">
                2. Cifra que Protagoniza la Historia
              </label>
              <div class="grid grid-cols-3 gap-1.5 font-board-mono text-xs">
                <button
                  type="button"
                  class={`py-2 px-2 text-center rounded-lg border transition-all cursor-pointer ${
                    metricFocus === "workdays"
                      ? "bg-primary text-primary-content font-bold border-primary shadow-md"
                      : "bg-base-200/70 border-base-300 text-base-content/75 hover:bg-base-200"
                  }`}
                  onClick={() => selectMetric("workdays")}
                >
                  Jornadas de 8h
                </button>
                <button
                  type="button"
                  class={`py-2 px-2 text-center rounded-lg border transition-all cursor-pointer ${
                    metricFocus === "hours"
                      ? "bg-primary text-primary-content font-bold border-primary shadow-md"
                      : "bg-base-200/70 border-base-300 text-base-content/75 hover:bg-base-200"
                  }`}
                  onClick={() => selectMetric("hours")}
                >
                  Horas de vida
                </button>
                <button
                  type="button"
                  class={`py-2 px-2 text-center rounded-lg border transition-all cursor-pointer ${
                    metricFocus === "months"
                      ? "bg-primary text-primary-content font-bold border-primary shadow-md"
                      : "bg-base-200/70 border-base-300 text-base-content/75 hover:bg-base-200"
                  }`}
                  onClick={() => selectMetric("months")}
                >
                  Meses de sueldo
                </button>
              </div>
            </div>

            {/* 3. Editor de Texto con Contador y Restaurar */}
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="font-signage uppercase text-sm tracking-wider text-base-content font-bold">
                  3. Mensaje a Publicar (Editable)
                </label>
                <div class="flex items-center gap-3">
                  <label class="flex items-center gap-1.5 font-board-mono text-xs cursor-pointer select-none opacity-85 hover:opacity-100">
                    <input
                      type="checkbox"
                      checked={includeHashtags}
                      onChange={(e) => toggleHashtags((e.target as HTMLInputElement).checked)}
                      class="checkbox checkbox-xs checkbox-primary"
                    />
                    <span>Hashtags</span>
                  </label>
                  <span class={`font-board-mono text-[11px] ${customText.length > 280 ? "text-error font-bold" : "opacity-60"}`}>
                    {customText.length} car.
                  </span>
                </div>
              </div>

              <div class="relative">
                <textarea
                  class="w-full h-36 p-3 font-sans text-xs bg-base-200 border border-base-300 rounded-lg focus:border-primary focus:outline-none resize-none leading-relaxed text-base-content"
                  value={customText}
                  onInput={(e) => {
                    setIsEditingText(true);
                    setCustomText((e.target as HTMLTextAreaElement).value);
                  }}
                  placeholder="El texto se actualiza automáticamente al pulsar cualquier gancho o métrica..."
                />
                {isEditingText && (
                  <button
                    type="button"
                    class="absolute bottom-2 right-2 text-[10px] font-board-mono px-2 py-1 rounded bg-base-300 hover:bg-primary hover:text-primary-content transition-colors cursor-pointer flex items-center gap-1"
                    onClick={() => {
                      setIsEditingText(false);
                      updateStory(viralAngle, metricFocus, selectedNetwork, includeHashtags);
                      showNotification("Historia original restaurada");
                    }}
                  >
                    <span>↺</span> Restaurar Historia Original
                  </button>
                )}
              </div>
            </div>

            {/* Microinstrucciones para Instagram */}
            {selectedNetwork === "instagram" && (
              <div class="p-3 rounded-lg bg-gradient-to-r from-[#833ab4]/10 via-[#fd1d1d]/10 to-[#fcb045]/10 border border-pink-500/30 text-xs font-board-mono space-y-1.5 text-base-content/90">
                <p class="font-bold text-pink-400 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z" />
                  </svg>
                  <span>3 Pasos para viralizar en Instagram:</span>
                </p>
                <ol class="list-decimal list-inside space-y-1 opacity-85 text-[11px]">
                  <li>Pulsa <strong>Descargar Infografía</strong> para guardarla en tu carrete.</li>
                  <li>Abre Instagram y sube la imagen a <strong>Stories</strong> o <strong>Post</strong>.</li>
                  <li>Pega el texto viral copiado y añade el sticker de enlace <strong>precioentiempo.com</strong>.</li>
                </ol>
              </div>
            )}
          </div>

          {/* ---- Columna Derecha: Vista Previa en Vivo y Descarga ---- */}
          <div class="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="font-signage uppercase text-sm tracking-wider text-base-content/90 flex items-center gap-1.5">
                  <span>Vista Previa en Vivo ·</span>
                  <strong class="text-primary uppercase">
                    {selectedNetwork === "x" ? "X (Twitter)" : selectedNetwork}
                  </strong>
                </span>
                <span class="font-board-mono text-[11px] text-accent font-semibold flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span>Datos 100% concordantes</span>
                </span>
              </div>

              {/* ---- PREVIEW EN X (TWITTER) ---- */}
              {selectedNetwork === "x" && (
                <div class="bg-black text-white p-4 rounded-xl border border-[#2f3336] shadow-xl font-sans text-xs sm:text-sm space-y-3 select-none">
                  <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-full bg-primary/30 border border-primary/40 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                      PET
                    </div>
                    <div class="min-w-0 flex-1 leading-tight">
                      <div class="flex items-center gap-1">
                        <span class="font-bold text-white text-xs sm:text-sm truncate">Precio en tiempo</span>
                        <svg viewBox="0 0 24 24" width="14" height="14" class="text-[#1d9bf0] shrink-0" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                        <span class="text-gray-500 text-xs">@precioentiempo · Ahora</span>
                      </div>
                    </div>
                  </div>

                  <p class="whitespace-pre-line text-xs sm:text-sm leading-relaxed text-gray-100">
                    {customText}
                  </p>

                  {/* Tarjeta Infográfica OG */}
                  <div class="rounded-xl overflow-hidden border border-[#2f3336] bg-[#16181c] shadow-lg">
                    <div class="aspect-[1.91/1] w-full bg-[#0c100d] relative overflow-hidden flex items-center justify-center">
                      <img
                        src={resolvedOgImage}
                        alt="Infografía de impacto"
                        class="w-full h-full object-cover"
                        loading="eager"
                      />
                    </div>
                    <div class="p-2.5 border-t border-[#2f3336] flex items-center justify-between">
                      <div class="min-w-0 pr-2">
                        <span class="text-[11px] text-gray-400 block font-board-mono">precioentiempo.com</span>
                        <span class="font-bold text-xs sm:text-sm text-white line-clamp-1">
                          {productName} en {countryName}: ¿Cuántas horas cuesta?
                        </span>
                      </div>
                      <span class="px-2.5 py-1 rounded bg-[#2f3336] text-[11px] font-bold text-primary shrink-0">
                        Ver cálculo
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center justify-between text-gray-500 text-xs pt-1 border-t border-[#2f3336]/60">
                    <span class="flex items-center gap-1">💬 482</span>
                    <span class="flex items-center gap-1">🔁 1.8K</span>
                    <span class="flex items-center gap-1">❤️ 6.4K</span>
                    <span class="flex items-center gap-1">📊 118K</span>
                  </div>
                </div>
              )}

              {/* ---- PREVIEW EN WHATSAPP ---- */}
              {selectedNetwork === "whatsapp" && (
                <div class="bg-[#0b141a] p-4 rounded-xl border border-[#1f2c34] shadow-xl space-y-3 font-sans text-xs sm:text-sm select-none">
                  <div class="flex justify-end">
                    <div class="max-w-[95%] sm:max-w-[88%] bg-[#005c4b] text-[#e9edef] p-3 rounded-2xl rounded-tr-xs shadow-md space-y-2">
                      <div class="rounded-lg overflow-hidden bg-[#025143] border border-white/10">
                        <div class="aspect-[1.91/1] w-full bg-[#0c100d] relative overflow-hidden">
                          <img
                            src={resolvedOgImage}
                            alt="Infografía de impacto"
                            class="w-full h-full object-cover"
                            loading="eager"
                          />
                        </div>
                        <div class="p-2 leading-tight">
                          <span class="font-bold text-xs line-clamp-1 text-white">
                            {productName} en {countryName} · Calculadora de Esfuerzo
                          </span>
                          <span class="text-[11px] text-[#8696a0] block font-board-mono mt-0.5">
                            precioentiempo.com
                          </span>
                        </div>
                      </div>

                      <p class="whitespace-pre-line text-xs leading-relaxed">
                        {customText}
                      </p>

                      <div class="flex items-center justify-end gap-1 text-[10px] text-[#8696a0]">
                        <span>12:45</span>
                        <span class="text-[#53bdeb]">✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---- PREVIEW EN TELEGRAM ---- */}
              {selectedNetwork === "telegram" && (
                <div class="bg-[#17212b] p-4 rounded-xl border border-[#242f3d] shadow-xl space-y-3 font-sans text-xs sm:text-sm select-none">
                  <div class="max-w-[92%] bg-[#182533] p-3.5 rounded-xl border-l-4 border-[#2481cc] shadow-md space-y-2 text-[#f5f5f5]">
                    <div class="font-bold text-xs text-[#5288c1]">
                      Precio en tiempo
                    </div>
                    <p class="whitespace-pre-line text-xs leading-relaxed">
                      {customText}
                    </p>
                    <div class="rounded-lg overflow-hidden border border-white/10 mt-2">
                      <div class="aspect-[1.91/1] w-full bg-[#0c100d] relative">
                        <img
                          src={resolvedOgImage}
                          alt="Infografía"
                          class="w-full h-full object-cover"
                          loading="eager"
                        />
                      </div>
                      <div class="p-2 bg-[#212d3b]">
                        <span class="font-bold text-xs text-white block">
                          {productName} en {countryName}
                        </span>
                        <span class="text-[11px] text-gray-400 font-board-mono">
                          precioentiempo.com
                        </span>
                      </div>
                    </div>
                    <div class="text-right text-[10px] text-gray-400">
                      12:45 · ✓
                    </div>
                  </div>
                </div>
              )}

              {/* ---- PREVIEW EN FACEBOOK ---- */}
              {selectedNetwork === "facebook" && (
                <div class="bg-[#242526] text-[#e4e6eb] p-4 rounded-xl border border-[#3e4042] shadow-xl font-sans text-xs sm:text-sm space-y-3 select-none">
                  <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-full bg-primary/30 flex items-center justify-center font-bold text-primary text-xs">
                      PET
                    </div>
                    <div class="leading-tight">
                      <span class="font-bold text-xs sm:text-sm text-white block">Precio en tiempo</span>
                      <span class="text-[11px] text-gray-400">Hace un momento · 🌍 Público</span>
                    </div>
                  </div>
                  <p class="whitespace-pre-line text-xs leading-relaxed">
                    {customText}
                  </p>
                  <div class="border border-[#3e4042] rounded-lg overflow-hidden bg-[#3a3b3c]">
                    <div class="aspect-[1.91/1] w-full bg-[#0c100d] relative">
                      <img
                        src={resolvedOgImage}
                        alt="Infografía"
                        class="w-full h-full object-cover"
                        loading="eager"
                      />
                    </div>
                    <div class="p-2.5 flex items-center justify-between">
                      <div class="min-w-0 pr-2">
                        <span class="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-board-mono block">
                          PRECIOENTIEMPO.COM
                        </span>
                        <span class="font-bold text-xs sm:text-sm text-white line-clamp-1">
                          {productName} en {countryName}: ¿Cuántas horas de tu vida cuesta?
                        </span>
                      </div>
                      <span class="px-3 py-1 rounded bg-[#4e4f50] text-xs font-semibold shrink-0">
                        Calcular
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ---- PREVIEW EN INSTAGRAM ---- */}
              {selectedNetwork === "instagram" && (
                <div class="bg-gradient-to-b from-[#1a0b2e] via-[#0d1117] to-[#161b22] p-4 rounded-xl border border-pink-500/30 shadow-xl space-y-3 font-sans text-xs select-none">
                  <div class="rounded-xl overflow-hidden border border-white/20 shadow-2xl relative bg-[#0c100d]">
                    <div class="aspect-[1.91/1] w-full">
                      <img
                        src={resolvedOgImage}
                        alt="Infografía para Instagram"
                        class="w-full h-full object-cover"
                        loading="eager"
                      />
                    </div>
                    <div class="p-3 bg-black/80 flex items-center justify-between">
                      <span class="text-pink-400 font-bold text-xs flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-pink-500" />
                        Infografía oficial en alta resolución (1200x630)
                      </span>
                      <button
                        type="button"
                        class="px-3 py-1 rounded bg-gradient-to-r from-[#833ab4] to-[#fd1d1d] text-white font-bold text-xs cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={handleDownloadImage}
                      >
                        Descargar para Story / Post
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ---- Botones de Acción Inmediata ---- */}
            <div class="pt-3 border-t border-base-300 space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                {/* Botón Principal: Compartir ahora en la red seleccionada */}
                <button
                  type="button"
                  class={`flex-1 min-w-[200px] py-3 px-4 rounded-lg font-board-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl ${
                    selectedNetwork === "x"
                      ? "bg-black text-white hover:bg-zinc-800 ring-2 ring-white/30"
                      : selectedNetwork === "whatsapp"
                        ? "bg-[#25D366] text-slate-950 hover:bg-emerald-400 ring-2 ring-emerald-300"
                        : selectedNetwork === "telegram"
                          ? "bg-[#229ED9] text-white hover:bg-sky-400 ring-2 ring-sky-300"
                          : selectedNetwork === "facebook"
                            ? "bg-[#1877F2] text-white hover:bg-blue-600 ring-2 ring-blue-300"
                            : "bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white hover:opacity-95 ring-2 ring-pink-400"
                  }`}
                  onClick={handleExecuteShare}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width={2}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <span>
                    {selectedNetwork === "x" && "Publicar en X (Twitter)"}
                    {selectedNetwork === "whatsapp" && "Enviar por WhatsApp"}
                    {selectedNetwork === "telegram" && "Compartir en Telegram"}
                    {selectedNetwork === "facebook" && "Publicar en Facebook"}
                    {selectedNetwork === "instagram" && "Copiar Texto y Abrir Instagram"}
                  </span>
                </button>

                {/* Botón Descargar Infografía */}
                <button
                  type="button"
                  class="py-3 px-3.5 rounded-lg bg-base-200 border border-base-300 hover:border-primary/60 text-base-content font-board-mono text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer font-semibold shadow-sm"
                  title="Descargar infografía oficial en alta resolución (1200x630)"
                  onClick={handleDownloadImage}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width={2}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  <span>Descargar Imagen</span>
                </button>

                {/* Botón Copiar Texto */}
                <button
                  type="button"
                  class="py-3 px-3.5 rounded-lg bg-base-200 border border-base-300 hover:border-primary/60 text-base-content font-board-mono text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer font-semibold shadow-sm"
                  title="Copiar texto con ganchos al portapapeles"
                  onClick={handleCopyText}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width={2}>
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copiar Texto</span>
                </button>

                {/* Botón Copiar Enlace Directo */}
                <button
                  type="button"
                  class="py-3 px-3.5 rounded-lg bg-base-200 border border-base-300 hover:border-primary/60 text-base-content font-board-mono text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer font-semibold shadow-sm"
                  title="Copiar URL directa al portapapeles"
                  onClick={handleCopyLink}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width={2}>
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <span>Enlace</span>
                </button>

                {/* Botón Móvil Nativo */}
                {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                  <button
                    type="button"
                    class="py-3 px-3.5 rounded-lg bg-base-200 border border-base-300 hover:border-accent/60 text-accent font-board-mono text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer font-semibold shadow-sm"
                    title="Abrir menú nativo de compartir del teléfono"
                    onClick={handleShareNative}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width={2}>
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                    <span>Móvil</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ---- Pie del modal ---- */}
        <div class="px-5 py-3 border-t border-base-300 bg-base-200/60 flex items-center justify-between font-board-mono text-xs text-base-content/75 shrink-0">
          <span class="truncate pr-4">URL canónica: <strong class="text-primary">{absoluteUrl}</strong></span>
          <button
            type="button"
            class="hover:text-primary transition-colors cursor-pointer font-bold uppercase tracking-wider shrink-0"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
