import { useEffect, useMemo, useState } from "preact/hooks";
import { calc, WEEKS_PER_MONTH } from "../../lib/calc.ts";
import {
  formatHours,
  formatMinutes,
  formatPercent,
  formatWorkdays,
  formatHumanDuration,
  formatHourlyWage,
} from "../../lib/format.ts";
import { getCountry, getProductPrice } from "../../lib/selectors.ts";
import { loadUserState, saveUserState } from "../../lib/storage.ts";
import { parseUserStateFromQuery } from "../../lib/urls.ts";
import type { Country, Product } from "../../lib/types.ts";
import { isFreshDate } from "../../lib/freshness.ts";
import { board, categories, home, noSalary, priceForm, result, shareText } from "../../i18n/es.ts";
import UserForm, { type UserFormFields } from "./UserForm.tsx";
import ShareButton from "./ShareButton.tsx";
import PriceInput from "./PriceInput.tsx";
import BoardRowCard, {
  CATEGORY_COLOR,
  CATEGORY_PATHS,
  CategoryIcon,
  nfPrice,
} from "./BoardRowCard.tsx";
import LifeBattery from "./LifeBattery.tsx";
import WorkBattery from "./WorkBattery.tsx";
import TimeStream3D from "./TimeStream3D.tsx";
import { computeLifeImpact } from "../../lib/life.ts";
import { computeWorkImpact } from "../../lib/work.ts";

export interface RateBoardProps {
  countries: Country[];
  products: Product[];
  heroProductId: string;
}

/** Zonas horarias → países del catálogo. Detección local, sin red. */
const TZ_TO_COUNTRY: Record<string, string> = {
  "Europe/Madrid": "ES",
  "Africa/Ceuta": "ES",
  "Atlantic/Canary": "ES",
  "Europe/Lisbon": "PT",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Rome": "IT",
  "Europe/London": "GB",
  "Europe/Zurich": "CH",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Phoenix": "US",
  "America/Los_Angeles": "US",
  "America/Mexico_City": "MX",
  "America/Monterrey": "MX",
  "America/Tijuana": "MX",
  "America/Cancun": "MX",
  "America/Argentina/Buenos_Aires": "AR",
  "America/Bogota": "CO",
  "America/Santiago": "CL",
};

/** Orden de la pizarra: lo que se cotiza primero en la vida de alguien. */
const CATEGORY_ORDER: Product["category"][] = [
  "transporte",
  "tecnologia",
  "vivienda",
  "vida",
  "dia-a-dia",
];

type Row = {
  product: Product;
  price: number;
  converted: boolean;
  priceDate: string;
  hours: number;
  workdays: number;
  months: number;
  years: number;
};

/** Cadencia de rotación del héroe: cada cuánto cambia de artículo (14s para contemplar el producto y su física con calma). */
const HERO_ROTATE_MS = 14000;

/** Filas visibles por categoría en la pizarra; el resto rota por turnos. */
const BOARD_ROWS_VISIBLE = 3;

/** Texto + unidad honestos según magnitud (nunca "0 jornadas"), con
 * singular cuando la cifra redondea a 1 ("1 hora", no "1 horas"). */
function rateOf(row: Row): { text: string; unit: string } {
  if (row.hours < 1) {
    const text = formatMinutes(row.hours * 60);
    return { text, unit: text === "1" ? "minuto" : "minutos" };
  }
  if (row.workdays < 1) {
    const text = formatHours(row.hours);
    return { text, unit: text === "1" ? "hora" : "horas" };
  }
  return { text: formatWorkdays(row.workdays), unit: board.rateUnitShort };
}

function getCountryFlagEmoji(countryCode: string): string {
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return "🌐";
  }
}

/**
 * La portada como tablero de cotizaciones: placa de país, cotización héroe a
 * dígitos rodantes, ticker de productos, pizarra completa por categorías y el
 * panel "Tu tipo de cambio" (UserForm) que recalcula todo en vivo.
 *
 * El país arranca en ES (HTML estático); al montar se resuelve
 * guardado → zona horaria → ES, y el tablero vuelve a cotizar con rodada.
 */
export default function RateBoard({ countries, products, heroProductId }: RateBoardProps) {
  const [countryCode, setCountryCode] = useState("ES");
  const [origin, setOrigin] = useState<"default" | "detected" | "saved">("default");
  const [heroOffset, setHeroOffset] = useState(0);
  /** Latido de la pizarra: cada tick re-estampa las filas en cascada. */
  const [boardPulse, setBoardPulse] = useState(0);
  const [viewMode, setViewMode] = useState<"work" | "life">("work");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userFields, setUserFields] = useState<{
    netMonthly: number | null;
    weeklyHours: number | null;
    monthlySavings: number | null;
    age: number | null;
  } | null>(null);

  useEffect(() => {
    const saved = loadUserState();
    const fromQuery =
      typeof window !== "undefined"
        ? parseUserStateFromQuery(new URLSearchParams(window.location.search))
        : null;
    const effective = { ...saved, ...fromQuery };

    if (effective?.viewMode) {
      setViewMode(effective.viewMode);
    } else if (effective?.age != null) {
      setViewMode("life");
    }

    const countryParam = fromQuery?.compareCountryCode?.toUpperCase();
    const resolvedCountry =
      countryParam && countries.some((c) => c.code === countryParam)
        ? countryParam
        : effective?.countryCode && countries.some((c) => c.code === effective.countryCode)
        ? effective.countryCode
        : null;

    if (resolvedCountry) {
      setCountryCode(resolvedCountry);
      setOrigin("saved");
    } else {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const detected = tz ? TZ_TO_COUNTRY[tz] : undefined;
        if (detected && countries.some((c) => c.code === detected)) {
          setCountryCode(detected);
          setOrigin("detected");
          saveUserState({ countryCode: detected });
        }
      } catch {
        // Sin zona horaria disponible: se queda el país por defecto.
      }
    }
    if (effective && (effective.netMonthly != null || effective.weeklyHours != null || effective.age != null)) {
      setUserFields({
        netMonthly: effective.netMonthly ?? null,
        weeklyHours: effective.weeklyHours ?? null,
        monthlySavings: effective.monthlySavings ?? null,
        age: effective.age ?? null,
      });
    }
  }, [countries]);

  const country = getCountry(countries, countryCode) ?? countries[0];

  const netMonthly = userFields?.netMonthly ?? country.medianNetMonthly ?? null;
  const weeklyHours = userFields?.weeklyHours ?? country.legalWeeklyHours;

  const rows = useMemo<Row[]>(() => {
    if (!netMonthly || netMonthly <= 0 || weeklyHours < 1) return [];
    return products.flatMap((product) => {
      const price = getProductPrice(product, country.code);
      if (!price) return [];
      try {
        const r = calc({
          price: price.value,
          netMonthly,
          weeklyHours,
          realAnnualHours: null,
          monthlySavings: null,
          age: null,
          retirementAge: country.retirementAge,
        });
        return [
          {
            product,
            price: price.value,
            converted: product.prices[country.code] == null,
            priceDate: price.date,
            hours: r.hours,
            workdays: r.workdays8h,
            months: r.monthsFullPay,
            years: r.yearsFullPay,
          },
        ];
      } catch {
        return [];
      }
    });
  }, [products, country, netMonthly, weeklyHours]);

  /** El héroe vive: rota entre los artículos cotizados. Arranca en el
   * artículo héroe (heroProductId) y avanza cíclicamente. Se respeta
   * prefers-reduced-motion y se pausa con la pestaña oculta. */
  const heroBase = useMemo(() => {
    const i = rows.findIndex((r) => r.product.id === heroProductId);
    return i === -1 ? 0 : i;
  }, [rows, heroProductId]);

  useEffect(() => {
    if (rows.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      setHeroOffset((offset) => offset + 1);
    }, HERO_ROTATE_MS);
    return () => clearInterval(id);
  }, [rows.length]);

  useEffect(() => {
    if (rows.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      setBoardPulse((pulse) => pulse + 1);
    }, HERO_ROTATE_MS);
    return () => clearInterval(id);
  }, [rows.length]);

  const hero =
    rows.length > 0 ? rows[(heroBase + heroOffset) % rows.length] : undefined;
  const userAge = userFields?.age ?? null;
  const isLifeMode = viewMode === "life";

  const heroLifeImpact = useMemo(() => {
    if (!hero) return null;
    return computeLifeImpact({
      hours: hero.hours,
      yearsFullPay: hero.years,
      weeklyHours,
      userAge,
      retirementAge: country.retirementAge,
    });
  }, [hero, weeklyHours, userAge, country.retirementAge]);

  const heroWorkImpact = useMemo(() => {
    if (!hero) return null;
    return computeWorkImpact({
      hours: hero.hours,
      workdays: hero.workdays,
      netMonthly,
      weeklyHours,
      price: hero.price,
    });
  }, [hero, netMonthly, weeklyHours]);

  const heroPct =
    hero && country.realAnnualHours ? (hero.hours / country.realAnnualHours) * 100 : null;

  const heroPhrase = hero
    ? formatHumanDuration(hero.hours, hero.workdays, hero.months, hero.years)
    : null;

  const heroLifePct =
    hero && userAge != null && hero.years >= 0.05
      ? (hero.years / userAge) * 100
      : null;

  const userActive =
    userFields != null && (userFields.netMonthly != null || userFields.weeklyHours != null);

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    rows: rows.filter((r) => r.product.category === category),
  })).filter((g) => g.rows.length > 0);

  /** Ventana rotatoria: cada categoría muestra BOARD_ROWS_VISIBLE filas y el
   * resto va entrando por turnos en cada latido de la pizarra. */
  const rotatedGrouped = grouped.map((g) => {
    if (g.rows.length <= BOARD_ROWS_VISIBLE) return g;
    const start = boardPulse % g.rows.length;
    const rotated = [...g.rows.slice(start), ...g.rows.slice(0, start)];
    return { ...g, rows: rotated.slice(0, BOARD_ROWS_VISIBLE) };
  });

  /** Pestaña de categoría activa en la pizarra. */
  const [selectedCategory, setSelectedCategory] = useState<Product["category"] | "todas">("todas");

  /** Presets dinámicos de sueldo adaptados a la economía del país actual. */
  const salaryPresets = useMemo(() => {
    const med = country.medianNetMonthly ?? 1800;
    const p1 = Math.round((med * 0.65) / 50) * 50;
    const p2 = Math.round((med * 0.85) / 50) * 50;
    const p3 = Math.round(med / 50) * 50;
    const p4 = Math.round((med * 1.35) / 50) * 50;
    const p5 = Math.round((med * 1.75) / 50) * 50;
    return Array.from(new Set([p1, p2, p3, p4, p5])).filter((n) => n > 0);
  }, [country.medianNetMonthly]);

  const applyPresetSalary = (amount: number) => {
    setUserFields((prev) => ({
      netMonthly: amount,
      weeklyHours: prev?.weeklyHours ?? country.legalWeeklyHours,
      monthlySavings: prev?.monthlySavings ?? null,
      age: prev?.age ?? null,
    }));
    saveUserState({
      netMonthly: amount,
      weeklyHours: userFields?.weeklyHours ?? country.legalWeeklyHours,
      countryCode: country.code,
    });
  };

  /** Grupos a mostrar: si se elige una categoría, se despliegan todas sus filas; si es 'todas', las 3 rotatorias. */
  const displayedGroups = useMemo(() => {
    if (selectedCategory === "todas") {
      return rotatedGrouped;
    }
    const match = grouped.find((g) => g.category === selectedCategory);
    return match ? [match] : [];
  }, [selectedCategory, rotatedGrouped, grouped]);

  /** Orden global de cada fila visible, para la cascada del latido. */
  const rowOrder = new Map(
    rotatedGrouped.flatMap((g) => g.rows).map((r, i) => [r.product.id, i] as const),
  );

  const onCountryChange = (event: Event) => {
    const code = (event.currentTarget as HTMLSelectElement).value;
    if (!code || !countries.some((c) => c.code === code)) return;
    setCountryCode(code);
    setOrigin("saved");
    setHeroOffset(0);
    setBoardPulse(0);
    saveUserState({ countryCode: code });
  };

  const onUserAgeChange = (newAge: number | null) => {
    setUserFields((prev) => ({
      netMonthly: prev?.netMonthly ?? null,
      weeklyHours: prev?.weeklyHours ?? null,
      monthlySavings: prev?.monthlySavings ?? null,
      age: newAge,
    }));
    saveUserState({ age: newAge, viewMode: "life" });
    setViewMode("life");
  };

  const onViewModeChange = (mode: "work" | "life") => {
    setViewMode(mode);
    saveUserState({ viewMode: mode });
  };

  const onUserFields = (fields: UserFormFields) => {
    setUserFields({
      netMonthly: fields.netMonthly,
      weeklyHours: fields.weeklyHours,
      monthlySavings: fields.monthlySavings,
      age: fields.age,
    });
    if (fields.age != null && viewMode === "work") {
      setViewMode("life");
      saveUserState({ viewMode: "life" });
    }
  };

  const onResetUserFields = () => {
    setUserFields((prev) => ({
      netMonthly: null,
      weeklyHours: null,
      monthlySavings: null,
      age: prev?.age ?? null,
    }));
    saveUserState({
      netMonthly: null,
      weeklyHours: null,
      monthlySavings: null,
    });
  };

  const activeNetMonthly = userFields?.netMonthly ?? country.medianNetMonthly ?? 0;
  const activeWeeklyHours = userFields?.weeklyHours ?? country.legalWeeklyHours ?? 40;
  const activeHourlyWage =
    activeNetMonthly > 0 && activeWeeklyHours > 0
      ? activeNetMonthly / (activeWeeklyHours * WEEKS_PER_MONTH)
      : 0;

  const medianHourlyWage =
    country.medianNetMonthly && country.legalWeeklyHours
      ? country.medianNetMonthly / (country.legalWeeklyHours * WEEKS_PER_MONTH)
      : 0;

  return (
    <div class="pt-2 md:pt-4">
      {/* =========================================================================
          BLOQUE 1: CABECERA & IDENTIDAD (Estación de Cotizaciones + Selector de País)
          ========================================================================= */}
      <div class="max-w-6xl mx-auto px-4">
        <div class="board-plate p-4 sm:p-5">
          {/* Telemetría Superior */}
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-base-300/80 text-xs font-board-mono">
            <div class="flex items-center gap-2 text-base-content/75">
              <span class="inline-block w-2 h-2 rounded-full bg-primary animate-pulse shrink-0"></span>
              <span class="uppercase tracking-[0.1em] font-medium text-[11px] sm:text-xs">
                Estación de Cotizaciones · Tiempo Real
              </span>
            </div>

            <div
              class="flex items-center gap-2 px-2.5 py-1 rounded bg-base-100/90 border border-base-300 text-accent font-medium shadow-sm self-start sm:self-auto shrink-0"
              title="Catálogo activo sincronizado"
            >
              <span class="board-live-dot shrink-0"></span>
              <span class="tracking-wider uppercase text-[0.7rem] sm:text-xs">
                Catálogo activo · {products.length} artículos
              </span>
            </div>
          </div>

          {/* Identidad de País + Selector */}
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div class="min-w-0">
              <div class="flex items-center gap-2 text-xs font-board-mono uppercase tracking-[0.1em] text-base-content/75 mb-1.5">
                <span class="font-medium">{board.operatingLabel}</span>
                <span class="text-base-300">/</span>
                {origin === "detected" && (
                  <span class="board-stamp text-accent inline-flex items-center gap-1.5 py-0.5" title="Detectado por tu zona horaria">
                    <span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                    {board.detectedStamp}
                  </span>
                )}
                {origin === "saved" && (
                  <span
                    class="board-stamp text-primary hidden sm:inline-flex items-center gap-1.5 py-0.5"
                    title="País fijado por tu elección"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    {board.savedStamp}
                  </span>
                )}
                {origin === "default" && (
                  <span class="board-stamp text-base-content/70 inline-flex items-center gap-1.5 py-0.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-base-content/50"></span>
                    referencia inicial
                  </span>
                )}
              </div>

              <div class="flex items-baseline gap-3 flex-wrap">
                <div class="flex items-center gap-2.5">
                  <span class="text-3xl sm:text-4xl select-none" aria-hidden="true">
                    {getCountryFlagEmoji(country.code)}
                  </span>
                  <strong class="font-signage text-3xl sm:text-4xl md:text-5xl uppercase leading-none tracking-tight">
                    {country.name}
                  </strong>
                </div>

                {country.medianNetMonthly ? (
                  <span class="text-xs font-board-mono text-base-content/65 whitespace-nowrap">
                    Mediana nacional:{" "}
                    <strong class="text-base-content/90 font-medium">
                      {country.medianNetMonthly} {country.currencySymbol}/mes
                    </strong>{" "}
                    ({country.legalWeeklyHours} h/sem)
                  </span>
                ) : (
                  <span class="text-xs font-board-mono text-warning font-medium">
                    Sin salario mediano oficial
                  </span>
                )}
              </div>
            </div>

            {/* Selector de País & Enlace a su ficha */}
            <div class="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
              <div class="w-full sm:w-auto">
                <label for="board-country" class="sr-only">
                  {board.changeCountryLabel}
                </label>
                <select
                  id="board-country"
                  class="select select-bordered w-full sm:w-56 h-11 font-board-mono text-sm bg-base-100"
                  value={countryCode}
                  onChange={onCountryChange}
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {getCountryFlagEmoji(c.code)} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <a
                href={`/${country.slug}`}
                class="board-navlink whitespace-nowrap inline-flex items-center justify-center px-3.5 h-11 text-xs font-board-mono uppercase tracking-wider text-base-content/85 hover:text-primary hover:border-primary border border-base-300 bg-base-100/60 transition-colors"
              >
                {board.countryFile(country.name)} →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BLOQUE 2: EL NÚCLEO DE IMPACTO (Cifra Hero Gigante + Partículas 3D)
          ========================================================================= */}
      <section class="max-w-6xl mx-auto px-4 mt-6 md:mt-8">
        {!hero || !netMonthly ? (
          <div class="board-plate p-8 text-center">
            <h1 class="font-signage text-4xl uppercase">{noSalary.title}</h1>
            <p class="mt-3 text-lg opacity-85">{noSalary.body}</p>
            <a href={`/${country.slug}`} class="board-cta mt-6">
              {board.countryFile(country.name)} →
            </a>
          </div>
        ) : (
          <div class="board-plate p-5 sm:p-7 space-y-6">
            {/* Telemetría y Controles del Artículo Héroe */}
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-base-300/80">
              {/* Izquierda: Categoría + Precio de Referencia */}
              <div class="flex items-center gap-2.5 flex-wrap">
                <span
                  class="board-cat-icon shrink-0"
                  style={`background: ${CATEGORY_COLOR[hero.product.category]}; color: #14191d`}
                >
                  <CategoryIcon category={hero.product.category} />
                </span>
                <span class="font-board-mono text-xs uppercase tracking-wider font-semibold text-base-content/75">
                  {categories[hero.product.category]}
                </span>
                <span class="text-base-300 font-board-mono">/</span>
                <span class="font-board-mono text-sm font-bold text-primary px-2.5 py-0.5 rounded bg-primary/10 border border-primary/25">
                  {nfPrice.format(hero.price)} {hero.converted ? "€" : country.currencySymbol}
                </span>
                <span class="font-board-mono text-xs opacity-60">
                  Ref. {hero.priceDate}
                </span>
                {hero.converted && (
                  <span class="board-stamp text-info text-[10px] py-0.5" title={result.convertedPriceNote}>
                    {board.esRefBadge}
                  </span>
                )}
              </div>

              {/* Derecha: Indicador de Rotación en Vivo + Botón para cambiar artículo */}
              <div class="flex items-center gap-2.5 self-start sm:self-auto">
                <span class="inline-flex items-center gap-1.5 font-board-mono text-xs text-accent bg-accent/10 border border-accent/30 px-2.5 py-1 rounded select-none">
                  <span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  Rotación automática
                </span>
                <button
                  type="button"
                  class="btn btn-sm btn-ghost border border-base-300 font-board-mono text-xs text-base-content/85 hover:text-primary hover:border-primary transition-all cursor-pointer flex items-center gap-1.5"
                  title="Cambiar al siguiente artículo del catálogo"
                  onClick={() => setHeroOffset((prev) => prev + 1)}
                >
                  <span>Siguiente artículo</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </div>
            </div>

            {/* Titular estilizado con pregunta natural y badge de tiempo */}
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div class="space-y-1 max-w-2xl">
                <span class="font-board-mono text-xs uppercase tracking-widest text-base-content/60 block">
                  Cotización en tiempo de vida
                </span>
                <h1
                  key={`h1-${hero.product.id}`}
                  class="board-hero-swap font-signage uppercase text-3xl sm:text-4xl md:text-5xl leading-tight text-base-content"
                >
                  ¿Cuánto tiempo cuesta {hero.product.name} en {country.name}?
                </h1>
              </div>

              {heroPhrase != null && (
                <div
                  key={`cost-badge-${hero.product.id}`}
                  class="board-hero-swap self-start lg:self-center shrink-0 bg-base-100/90 border border-primary/30 shadow-md px-4 py-2.5 rounded-lg text-left lg:text-right"
                >
                  <span class="font-board-mono text-[10px] sm:text-xs uppercase tracking-wider text-base-content/70 block">
                    Equivale exactamente a
                  </span>
                  <span class="font-signage text-2xl sm:text-3xl md:text-4xl text-primary uppercase font-bold tracking-tight block">
                    {heroPhrase}
                  </span>
                  <span class="font-board-mono text-[11px] text-base-content/60 block">
                    de trabajo neto ({formatHours(hero.hours)} h de esfuerzo)
                  </span>
                </div>
              )}
            </div>

            {/* Lienzo Cinemático 3D de Partículas sincronizado */}
            <div class="w-full rounded-xl overflow-hidden border border-base-300/90 bg-base-100/80 shadow-xl">
              <TimeStream3D
                workdays={hero.workdays}
                hours={hero.hours}
                yearsFullPay={hero.years}
                salaryPct={heroPct}
                userAge={userAge}
                retirementAge={country.retirementAge}
                productName={hero.product.name}
                class="w-full"
              />
            </div>

            {/* Baterías de impacto visual */}
            {isLifeMode && heroLifeImpact && (
              <div class="mt-6 w-full space-y-3">
                <LifeBattery
                  age={userAge}
                  retirementAge={country.retirementAge}
                  yearsFullPay={hero.years}
                  pctCareerLeft={heroLifeImpact.pctCareerLeft}
                  threat={heroLifeImpact.threat}
                  onAgeChange={onUserAgeChange}
                />
                <p class="font-board-mono text-base text-base-content/90 border-l-2 border-primary pl-3 w-full leading-relaxed break-words">
                  {heroLifeImpact.verdict}
                </p>
              </div>
            )}

            {!isLifeMode && heroWorkImpact && (
              <div class="mt-6 w-full space-y-3">
                <WorkBattery
                  impact={heroWorkImpact}
                  salaryPct={heroPct}
                  productName={hero.product.name}
                />
                {heroPhrase != null && (
                  <p
                    key={`tail-${hero.product.id}`}
                    class="board-hero-swap text-base md:text-lg opacity-85 break-words w-full"
                  >
                    {home.fullPayTail(heroPhrase)}
                  </p>
                )}
              </div>
            )}

            {/* Barra del año laboral real */}
            {heroPct != null && (
              <div class="mt-4 w-full">
                <div class="flex justify-between font-board-mono text-sm uppercase tracking-[0.08em] opacity-90 mb-1 font-medium">
                  <span>{result.pctRealYearLabel}</span>
                  <span key={`pct-${hero.product.id}`} class="board-hero-swap">
                    {formatPercent(heroPct)}%
                  </span>
                </div>
                <div
                  class="h-4 border border-base-300 bg-base-200 rounded-xs overflow-hidden"
                  role="img"
                  aria-label={`Barra del año laboral: ocupa el ${formatPercent(heroPct)}%`}
                >
                  <div
                    class="board-pct-fill h-full transition-all duration-500"
                    style={`width: ${Math.min(100, heroPct).toFixed(1)}%; background: ${!isLifeMode && heroWorkImpact ? heroWorkImpact.effort.color : "var(--color-primary)"}`}
                  />
                </div>
              </div>
            )}

            {/* Barra de vida cuando hay edad introducida */}
            {userAge != null && heroLifePct != null && (
              <div class={heroPct != null ? "mt-4 w-full" : "mt-6 w-full"}>
                <div class="flex justify-between font-board-mono text-sm uppercase tracking-[0.08em] opacity-90 mb-1 font-medium">
                  <span>{board.lifeBarLabel(userAge)}</span>
                  <span key={`life-pct-${hero.product.id}`} class="board-hero-swap">
                    {formatPercent(heroLifePct)}%
                  </span>
                </div>
                <div
                  class="h-4 border border-base-300 bg-base-200 rounded-xs overflow-hidden"
                  role="img"
                  aria-label={board.lifeBarAria(userAge, formatPercent(heroLifePct))}
                >
                  <div
                    class="board-pct-fill h-full bg-primary transition-all duration-500"
                    style={`width: ${Math.min(100, heroLifePct).toFixed(1)}%`}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* =========================================================================
          BLOQUE 3: CENTRO DE MANDO UNIFICADO (PERSPECTIVA + DATOS EN VIVO)
          ========================================================================= */}
      <section class="max-w-6xl mx-auto px-4 mt-8 md:mt-10">
        <div
          class={`board-plate p-5 sm:p-7 transition-all duration-300 shadow-xl space-y-6 ${
            userActive
              ? "board-plate--active shadow-[0_0_35px_rgba(62,201,126,0.16)] border-accent/80 bg-accent/5"
              : "border-primary/40 bg-base-200/60 hover:border-primary/70"
          }`}
        >
          {/* 1. SELECCIÓN DE PERSPECTIVA: BOTONES DESTACADOS (TRABAJO VS TIEMPO DE VIDA) */}
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-base-content/10">
            <div>
              <span class="font-board-mono text-xs uppercase tracking-widest opacity-70 block mb-2">
                Elige tu perspectiva de análisis
              </span>
              <div class="grid grid-cols-1 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                {/* Botón MODO TRABAJO (Destacado) */}
                <button
                  type="button"
                  onClick={() => onViewModeChange("work")}
                  class={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg font-board-mono text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer select-none ${
                    viewMode === "work"
                      ? "bg-primary text-neutral-900 font-black shadow-lg ring-2 ring-primary/50 scale-[1.01]"
                      : "bg-base-100 hover:bg-base-300 text-base-content/80 font-medium border border-base-content/15"
                  }`}
                  title="Ver cotizaciones en horas y jornadas de trabajo"
                >
                  <span class="text-xl shrink-0">💼</span>
                  <div class="text-left min-w-0">
                    <span class="block leading-none font-bold text-xs sm:text-sm">Modo Trabajo</span>
                    <span class="text-[10px] opacity-75 font-normal block mt-0.5 lowercase">horas y jornadas de curro</span>
                  </div>
                </button>

                {/* Botón MODO TIEMPO DE VIDA (Destacado) */}
                <button
                  type="button"
                  onClick={() => onViewModeChange("life")}
                  class={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg font-board-mono text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer select-none relative ${
                    viewMode === "life"
                      ? "bg-warning text-neutral-900 font-black shadow-lg ring-2 ring-warning/50 scale-[1.01]"
                      : "bg-base-100 hover:bg-base-300 text-base-content/80 font-medium border border-base-content/15"
                  }`}
                  title="Ver el impacto en semanas de tu vida finita"
                >
                  <span class="text-xl shrink-0">⏳</span>
                  <div class="text-left min-w-0">
                    <span class="block leading-none font-bold text-xs sm:text-sm">Modo Tiempo de Vida</span>
                    <span class="text-[10px] opacity-75 font-normal block mt-0.5 lowercase">semanas de futuro consumidas</span>
                  </div>
                  <span class="inline-block w-2 h-2 rounded-full bg-error animate-ping ml-auto" />
                </button>
              </div>
            </div>

            {/* Estado de la cotización & botón de restablecer */}
            <div class="flex items-center gap-2 self-start md:self-center flex-wrap">
              {userActive ? (
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-board-mono text-xs font-bold text-accent bg-accent/15 border border-accent/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    ⚡ Cotizando con tus datos
                  </span>
                  <button
                    type="button"
                    onClick={onResetUserFields}
                    class="btn btn-xs btn-ghost border border-base-300 text-base-content/70 hover:text-warning hover:border-warning font-board-mono"
                    title="Restablecer a la mediana nacional de referencia"
                  >
                    ↺ Mediana ({country.medianNetMonthly} {country.currencySymbol})
                  </button>
                </div>
              ) : (
                <span class="font-board-mono text-xs text-base-content/75 bg-base-100 px-3 py-1 rounded-full border border-base-content/10">
                  📌 Mediana nacional ({country.name}: {formatHourlyWage(medianHourlyWage, country.currencySymbol)}/h)
                </span>
              )}
            </div>
          </div>

          {/* 2. GRID UNIFICADO: CONFIGURACIÓN INTEGRAL DE DATOS (NÓMINA + EDAD + JORNADA) */}
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Columna 1: Tu Nómina y Valor de la Hora (7 cols) */}
            <div class="lg:col-span-7 bg-base-100/70 p-4 sm:p-5 rounded-xl border border-base-content/10 flex flex-col justify-between space-y-4">
              <div class="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <span class="font-board-mono text-xs uppercase opacity-70 block">
                    Tu valor hora neto
                  </span>
                  <div class="flex items-baseline gap-1.5 mt-0.5">
                    <span class="font-signage text-3xl sm:text-4xl text-primary font-black tabular-nums">
                      {formatHourlyWage(activeHourlyWage, country.currencySymbol)}
                    </span>
                    <span class="font-board-mono text-xs opacity-75 font-semibold">/ hora</span>
                  </div>
                </div>

                <div class="text-left sm:text-right">
                  <span class="font-board-mono text-xs opacity-70 block">Sueldo neto mensual</span>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <input
                      type="number"
                      min="300"
                      max="20000"
                      step="50"
                      value={netMonthly ?? 1800}
                      onInput={(e) => {
                        const val = Number((e.target as HTMLInputElement).value);
                        if (val > 0) applyPresetSalary(val);
                      }}
                      class="input input-xs w-28 font-board-mono text-right font-bold bg-base-200 text-primary border-base-content/20"
                      aria-label="Salario neto mensual"
                    />
                    <span class="font-board-mono text-xs font-bold text-primary">{country.currencySymbol}</span>
                  </div>
                </div>
              </div>

              {/* Slider de Sueldo */}
              <div>
                <input
                  type="range"
                  min={Math.max(400, Math.round((country.medianNetMonthly ?? 1800) * 0.35))}
                  max={Math.round((country.medianNetMonthly ?? 1800) * 3)}
                  step="25"
                  value={netMonthly ?? 1800}
                  onInput={(e) => applyPresetSalary(Number((e.target as HTMLInputElement).value))}
                  class="range range-primary range-sm w-full cursor-pointer"
                  aria-label="Ajustar sueldo mensual con barra deslizante"
                />
              </div>

              {/* Presets Rápidos de Nómina */}
              <div class="flex items-center gap-1.5 flex-wrap pt-1">
                <span class="font-board-mono text-[11px] opacity-70 mr-1">Sueldos de referencia:</span>
                {salaryPresets.map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => applyPresetSalary(preset)}
                    class={`px-2.5 py-1 rounded font-board-mono text-xs font-semibold transition-all cursor-pointer ${
                      netMonthly === preset
                        ? "bg-primary text-neutral-900 font-bold shadow-xs"
                        : "bg-base-200 hover:bg-base-300 text-base-content/85 border border-base-content/10"
                    }`}
                  >
                    {preset} {country.currencySymbol}
                  </button>
                ))}
              </div>

              {/* Ajuste Rápido de Jornada Semanal */}
              <div class="flex items-center justify-between gap-2 pt-2 border-t border-base-content/10 text-xs font-board-mono opacity-80">
                <span>Jornada semanal:</span>
                <div class="flex items-center gap-1">
                  {[35, 37.5, 40, 42].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        setUserFields((prev) => ({
                          netMonthly: prev?.netMonthly ?? country.medianNetMonthly ?? 1800,
                          weeklyHours: h,
                          monthlySavings: prev?.monthlySavings ?? null,
                          age: prev?.age ?? null,
                        }));
                        saveUserState({ weeklyHours: h });
                      }}
                      class={`px-2 py-0.5 rounded text-[11px] font-board-mono transition-colors cursor-pointer ${
                        weeklyHours === h
                          ? "bg-primary/20 text-primary font-bold border border-primary/40"
                          : "bg-base-200 hover:bg-base-300 text-base-content/70"
                      }`}
                    >
                      {h} h/sem
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Columna 2: Tu Edad y Horizonte Existencial (5 cols) */}
            <div class="lg:col-span-5 bg-base-100/70 p-4 sm:p-5 rounded-xl border border-base-content/10 flex flex-col justify-between space-y-4">
              <div class="flex items-center justify-between gap-2">
                <div>
                  <span class="font-board-mono text-xs uppercase opacity-70 block">
                    ¿Qué edad tienes?
                  </span>
                  <span class="font-board-mono text-xs text-warning font-semibold block mt-0.5">
                    Te quedan ~{Math.max(0, country.retirementAge - (userAge ?? 30))} años de trabajo activo
                  </span>
                </div>

                {/* Contador de edad - / + */}
                <div class="flex items-center gap-1 bg-base-200 p-1 rounded-lg border border-base-content/10">
                  <button
                    type="button"
                    class="w-7 h-7 rounded bg-base-100 hover:bg-warning hover:text-neutral-900 font-bold transition-all flex items-center justify-center cursor-pointer text-sm"
                    onClick={() => onUserAgeChange(Math.max(16, (userAge ?? 30) - 1))}
                  >
                    -
                  </button>
                  <span class="font-board-mono text-base font-bold text-warning px-2 tabular-nums">
                    {userAge ?? 30} <span class="text-xs font-normal opacity-70">años</span>
                  </span>
                  <button
                    type="button"
                    class="w-7 h-7 rounded bg-base-100 hover:bg-warning hover:text-neutral-900 font-bold transition-all flex items-center justify-center cursor-pointer text-sm"
                    onClick={() => onUserAgeChange(Math.min(80, (userAge ?? 30) + 1))}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Slider de Edad */}
              <div>
                <input
                  type="range"
                  min="18"
                  max="75"
                  value={userAge ?? 30}
                  onInput={(e) => onUserAgeChange(Number((e.target as HTMLInputElement).value))}
                  class="range range-warning range-sm w-full cursor-pointer"
                  aria-label="Ajustar edad con barra deslizante"
                />
                <div class="flex justify-between text-[10px] font-board-mono opacity-60 mt-1">
                  <span>18 a (Comienzo)</span>
                  <span>40 a (Medio)</span>
                  <span>{country.retirementAge} a (Jubilación)</span>
                </div>
              </div>

              {/* Métrica de Semanas Laborables Restantes */}
              <div class="p-3 rounded-lg bg-warning/10 border border-warning/25 flex items-center justify-between font-board-mono text-xs">
                <span class="opacity-80">Semanas laborales restantes:</span>
                <strong class="text-warning font-bold text-sm tabular-nums">
                  ~{Math.round(Math.max(0, country.retirementAge - (userAge ?? 30)) * 52).toLocaleString("es-ES")} semanas
                </strong>
              </div>

              {/* Pie con enlace a opciones avanzadas */}
              <div class="pt-2 border-t border-base-content/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsFormOpen((prev) => !prev)}
                  class="text-xs font-board-mono text-primary hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>{isFormOpen ? "Cerrar opciones ▲" : "Opciones avanzadas (ahorro...) ✎"}</span>
                </button>
                <span class="text-[10px] font-board-mono opacity-50">
                  Jubilación oficial: {country.retirementAge} años
                </span>
              </div>
            </div>
          </div>

          {/* Formulario avanzado expandible (UserForm con ahorro mensual, etc.) */}
          {isFormOpen && (
            <div class="mt-4 p-4 rounded-xl bg-base-100 border border-base-300 shadow-inner">
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-base-content/10 text-xs font-board-mono text-base-content/80">
                <span class="uppercase tracking-wider font-semibold text-primary">
                  Personalización detallada (Ahorro mensual y datos)
                </span>
                <span class="text-accent text-[0.75rem]">Recalcula todo el tablero al instante</span>
              </div>
              <UserForm
                countryCode={country.code}
                countryNetMonthly={country.medianNetMonthly}
                countryWeeklyHours={country.legalWeeklyHours}
                currencySymbol={country.currencySymbol}
                age={userAge}
                onChange={onUserFields}
              />
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          BLOQUE 6: LA PIZARRA DE COTIZACIONES (Catálogo por Categorías con Filtros)
          ========================================================================= */}
      {rows.length > 0 && (
        <section class="max-w-6xl mx-auto px-4 mt-12 md:mt-16">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 class="font-signage uppercase text-4xl md:text-5xl">{board.boardTitle}</h2>
              <p class="mt-1 text-base opacity-80">{board.boardSubtitle}</p>
            </div>

            {/* Píldoras de Filtro Rápido por Categoría */}
            <div class="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedCategory("todas")}
                class={`px-3 py-1.5 rounded font-board-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedCategory === "todas"
                    ? "bg-primary text-neutral-900 shadow-sm font-bold"
                    : "bg-base-200 hover:bg-base-300 text-base-content/80 border border-base-300"
                }`}
              >
                Todas ({rows.length})
              </button>
              {CATEGORY_ORDER.map((cat) => {
                const count = rows.filter((r) => r.product.category === cat).length;
                if (count === 0) return null;
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    class={`px-3 py-1.5 rounded font-board-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-primary text-neutral-900 shadow-sm font-bold"
                        : "bg-base-200 hover:bg-base-300 text-base-content/80 border border-base-300"
                    }`}
                  >
                    {categories[cat]} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Listado de Categorías y Tarjetas */}
          <div class="space-y-10" key={boardPulse}>
            {displayedGroups.map((group) => (
              <div key={group.category}>
                <h3 class="flex items-center gap-3 mb-3">
                  <span
                    class="board-cat-icon"
                    style={`background: ${CATEGORY_COLOR[group.category]}; color: #14191d`}
                  >
                    <CategoryIcon category={group.category} />
                  </span>
                  <span class="font-signage uppercase text-2xl">
                    {categories[group.category]}
                  </span>
                  <span class="font-board-mono text-xs opacity-60">
                    ({group.rows.length} {group.rows.length === 1 ? "artículo" : "artículos"})
                  </span>
                </h3>
                <div class="grid gap-1.5">
                  {group.rows.map((row) => {
                    const rate = rateOf(row);
                    const rowI = rowOrder.get(row.product.id) ?? 0;
                    return (
                      <BoardRowCard
                        key={row.product.id}
                        href={`/${country.slug}/${row.product.id}`}
                        name={row.product.name}
                        icon={CATEGORY_PATHS[row.product.category]}
                        color={CATEGORY_COLOR[row.product.category]}
                        price={row.price}
                        priceSymbol={row.converted ? "€" : country.currencySymbol}
                        priceFallback={null}
                        converted={row.converted}
                        rateText={rate.text}
                        rateUnit={rate.unit}
                        rateCta={null}
                        years={row.years}
                        userAge={userAge}
                        retirementAge={country.retirementAge}
                        hours={row.hours}
                        viewMode={viewMode}
                        isFresh={isFreshDate(row.priceDate)}
                        rowI={rowI}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================================
          BLOQUE 7: LA CALCULADORA LIBRE ("¿Cuánto cuesta otra cosa?")
          ========================================================================= */}
      <section class="max-w-6xl mx-auto px-4 mt-14 md:mt-20" aria-label={priceForm.priceLabel}>
        <div class="board-plate p-6 md:p-8">
          <div class="flex flex-wrap items-start gap-3">
            <span class="board-cat-icon" style="background: #3ec97e; color: #14191d">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width={2}
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="font-signage uppercase text-3xl md:text-4xl">
                  {priceForm.priceTitle}
                </h2>
                <span class="board-stamp text-primary">{priceForm.priceStamp}</span>
              </div>
              <p class="mt-1 text-sm opacity-80 max-w-2xl">{priceForm.priceNote}</p>
            </div>
          </div>
          <div class="mt-6">
            <PriceInput
              slug={country.slug}
              currencySymbol={country.currencySymbol}
              submitInline
            />
          </div>
        </div>
      </section>

      {/* =========================================================================
          BLOQUE 8: CIERRE, VIRALIDAD Y CREDIBILIDAD
          ========================================================================= */}
      <div class="max-w-6xl mx-auto px-4 mt-12 md:mt-16 pb-20 flex flex-wrap items-center justify-between gap-6 border-t border-base-300/80 pt-8">
        <div class="flex items-center gap-4 flex-wrap">
          <a href={`/${country.slug}`} class="board-cta">
            {board.countryFile(country.name)} →
          </a>
          <a href="/metodo" class="btn btn-outline font-board-mono text-xs uppercase tracking-wider">
            Metodología y Fuentes
          </a>
        </div>
        {hero && (
          <div class="board-share flex items-center gap-3">
            <ShareButton
              url="/"
              text={shareText({
                productName: hero.product.name,
                countryName: country.name,
                hours: hero.hours,
                workdays8h: hero.workdays,
                fullPayPhrase: formatHumanDuration(
                  hero.hours,
                  hero.workdays,
                  hero.months,
                  hero.years,
                ),
                age: userFields?.age ?? null,
                yearsFullPay: hero.years,
              })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
