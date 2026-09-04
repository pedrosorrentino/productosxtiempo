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
import { isFreshDate, getLatestUpdatedProduct } from "../../lib/freshness.ts";
import { board, categories, home, noSalary, priceForm, result, shareText, userForm } from "../../i18n/es.ts";
import UserForm, { type UserFormFields } from "./UserForm.tsx";
import Odometer from "./Odometer.tsx";
import ShareButton from "./ShareButton.tsx";
import PriceInput from "./PriceInput.tsx";
import BoardRowCard, {
  CATEGORY_COLOR,
  CATEGORY_PATHS,
  CategoryIcon,
  nfPrice,
} from "./BoardRowCard.tsx";
import LifeBarControl from "./LifeBarControl.tsx";
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

  const heroRate = hero
    ? isLifeMode && heroLifeImpact?.pctCareerLeft != null
      ? formatPercent(heroLifeImpact.pctCareerLeft)
      : isLifeMode && heroLifeImpact
      ? formatPercent(heroLifeImpact.lifeWeeksCost)
      : formatWorkdays(hero.workdays)
    : "0";

  const heroUnit = isLifeMode
    ? heroLifeImpact?.pctCareerLeft != null
      ? "% de tu vida laboral"
      : "semanas de vida"
    : home.workdaysUnit;

  const heroAria = hero ? `${heroRate} ${heroUnit}` : "";
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

  const latestUpdated = useMemo(
    () => getLatestUpdatedProduct(products, country.code),
    [products, country.code],
  );

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
    <div class="pt-4 md:pt-6">
      {/* ---- Corriente Cinemática 3D de Partículas (Encima del RateBoard) ---- */}
      {hero && (
        <div class="max-w-6xl mx-auto px-4 mb-6 md:mb-8">
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
      )}

      {/* ---- Placa de operación: Cabina de Cotización ---- */}
      <div class="max-w-6xl mx-auto px-4">
        <div
          class={`board-plate p-4 sm:p-5 transition-all duration-300 ${
            userActive
              ? "board-plate--active shadow-[0_0_30px_rgba(62,201,126,0.12)] border-accent/70"
              : "hover:border-base-300"
          }`}
        >
          {/* ---- Telemetría Superior: Cabina & Estado de Mercado ---- */}
          <div class="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-base-300/80 text-xs font-board-mono">
            <div class="flex items-center gap-2 text-base-content/75">
              <span class="inline-block w-2 h-2 rounded-full bg-primary/80"></span>
              <span class="uppercase tracking-[0.14em] font-medium">Cabina de Cotización</span>
            </div>

            {/* Chip de Catálogo ordenado en su slot de telemetría */}
            <div
              class="flex items-center gap-2 px-2.5 py-1 rounded bg-base-100/90 border border-base-300 text-accent font-medium shadow-sm"
              title="Catálogo con actualización periódica"
            >
              <span class="board-live-dot"></span>
              <span class="tracking-wider uppercase text-[0.7rem] sm:text-xs">
                Catálogo activo · {products.length} productos
              </span>
            </div>
          </div>

          {/* ---- Zona Principal: Identidad del País & Selector Rápido ---- */}
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Izquierda: Bandera + Nombre del País + Badge de Origen + Referencia base */}
            <div class="min-w-0">
              <div class="flex items-center gap-2 text-xs font-board-mono uppercase tracking-[0.1em] text-base-content/75 mb-1.5">
                <span class="font-medium">{board.operatingLabel}</span>
                <span class="text-base-300">/</span>
                {origin === "detected" && (
                  <span
                    class="board-stamp text-accent inline-flex items-center gap-1.5 py-0.5"
                    title="Detectado por tu zona horaria"
                  >
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

                {country.medianNetMonthly && (
                  <span class="text-xs font-board-mono text-base-content/65 whitespace-nowrap">
                    Mediana oficial:{" "}
                    <strong class="text-base-content/90 font-medium">
                      {country.medianNetMonthly} {country.currencySymbol}/mes
                    </strong>{" "}
                    ({country.legalWeeklyHours} h/sem)
                  </span>
                )}
              </div>
            </div>

            {/* Derecha: Selector de País & Ficha */}
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

          {/* ---- HUD de Motor de Cálculo (Máxima Dopamina) ---- */}
          <div class="mt-5 pt-4 border-t border-base-300/80">
            {userActive ? (
              /* ESTADO PERSONALIZADO: Verde fósforo vibrante, baliza en vivo y valor por hora */
              <div class="p-3.5 sm:p-4 rounded bg-accent/10 border-2 border-accent/60 shadow-[0_0_20px_rgba(62,201,126,0.12)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all">
                <div class="flex items-start sm:items-center gap-3">
                  <span class="relative flex h-3 w-3 mt-1 sm:mt-0 flex-shrink-0">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                  </span>
                  <div>
                    <div class="flex items-center gap-2.5 flex-wrap">
                      <span class="font-board-mono text-xs font-bold uppercase tracking-wider text-accent bg-accent/20 border border-accent/40 px-2.5 py-0.5 rounded">
                        ⚡ {board.yourDataStamp}
                      </span>
                      <span class="font-board-mono text-xs text-base-content/90">
                        Tu valor hora:{" "}
                        <strong class="text-accent text-sm sm:text-base font-bold tracking-tight">
                          {formatHourlyWage(activeHourlyWage, country.currencySymbol)}/h
                        </strong>
                      </span>
                    </div>
                    <p class="font-board-mono text-[0.75rem] text-base-content/75 mt-0.5">
                      Base aplicada: {userFields?.netMonthly} {country.currencySymbol}/mes · {userFields?.weeklyHours} h/sem
                      {userFields?.monthlySavings != null && ` · Ahorro: ${userFields.monthlySavings} ${country.currencySymbol}/mes`}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen((prev) => !prev)}
                    class="btn btn-sm btn-ghost border border-accent/50 text-accent hover:bg-accent hover:text-neutral-900 font-board-mono text-xs uppercase font-bold"
                  >
                    {isFormOpen ? "Cerrar ▲" : "Editar nómina ✎"}
                  </button>
                  <button
                    type="button"
                    onClick={onResetUserFields}
                    class="btn btn-sm btn-ghost border border-base-300 text-base-content/70 hover:text-warning hover:border-warning font-board-mono text-xs uppercase"
                    title="Restablecer a la mediana nacional de referencia"
                  >
                    ↺ Mediana
                  </button>
                </div>
              </div>
            ) : (
              /* ESTADO MEDIANA ESTÁNDAR: Invitación táctica al usuario */
              <div class="p-3.5 sm:p-4 rounded bg-base-100/70 border border-base-300/90 hover:border-primary/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-start sm:items-center gap-3">
                  <div class="p-2 rounded bg-base-200 border border-base-300 text-primary flex-shrink-0">
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </div>
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-board-mono text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded">
                        Modo estándar: Mediana nacional
                      </span>
                      {country.medianNetMonthly != null ? (
                        <span class="font-board-mono text-xs text-base-content/80">
                          {country.name}:{" "}
                          <strong class="text-base-content font-medium">
                            {formatHourlyWage(medianHourlyWage, country.currencySymbol)}/h
                          </strong>
                        </span>
                      ) : (
                        <span class="font-board-mono text-xs text-warning font-medium">
                          {country.name}: Sin mediana oficial (introduce tu nómina)
                        </span>
                      )}
                    </div>
                    <p class="font-board-mono text-[0.75rem] text-base-content/65 mt-0.5">
                      {country.medianNetMonthly != null
                        ? `Cifras de referencia de ${country.name}. ¿Quieres saber cuánto te cuesta a ti según tu sueldo real?`
                        : `Por alta informalidad o inflación en ${country.name}, introduce tu sueldo para cotizar la pizarra.`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFormOpen((prev) => !prev)}
                  class="btn btn-sm bg-primary/20 hover:bg-primary text-primary hover:text-primary-content border border-primary/50 font-board-mono text-xs uppercase font-bold tracking-wider self-start sm:self-auto flex-shrink-0 transition-all shadow-sm"
                >
                  {isFormOpen ? "Cerrar ▲" : "⚡ Ajustar con mi nómina"}
                </button>
              </div>
            )}

            {/* ---- Cajón Plegable del Formulario ---- */}
            {isFormOpen && (
              <div class="mt-4 p-4 rounded bg-base-100 border border-base-300 shadow-inner">
                <div class="flex items-center justify-between pb-3 mb-3 border-b border-base-300 text-xs font-board-mono text-base-content/80">
                  <span class="uppercase tracking-wider font-semibold text-primary">
                    Ajuste personalizado de nómina y jornada
                  </span>
                  <span class="text-accent text-[0.75rem]">Recalcula toda la pizarra al instante</span>
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
        </div>
      </div>

      {/* ---- Control de Vida & Modo ---- */}
      <div class="max-w-6xl mx-auto px-4 mt-6">
        <LifeBarControl
          age={userAge}
          viewMode={viewMode}
          onAgeChange={onUserAgeChange}
          onViewModeChange={onViewModeChange}
          retirementAge={country.retirementAge}
        />
      </div>

      {/* ---- Cotización héroe ---- */}
      <section class="max-w-6xl mx-auto px-4 mt-6 md:mt-10">
        {!hero || !netMonthly ? (
          <div class="board-plate p-8 text-center">
            <h1 class="font-signage text-4xl uppercase">{noSalary.title}</h1>
            <p class="mt-3 text-lg opacity-85">{noSalary.body}</p>
            <a href={`/${country.slug}`} class="board-cta mt-6">
              {board.countryFile(country.name)} →
            </a>
          </div>
        ) : (
          <div>
            <p
              key={hero.product.id}
              class="board-hero-swap font-board-mono text-sm md:text-base opacity-90 flex flex-wrap items-center gap-x-3 gap-y-1"
            >
              <span>
                {nfPrice.format(hero.price)} {hero.converted ? "€" : country.currencySymbol}
              </span>
              <span aria-hidden="true" class="text-secondary">·</span>
              <span>
                {board.priceRefLabel} {hero.priceDate}
              </span>
              {hero.converted && (
                <span class="board-stamp text-info" title={result.convertedPriceNote}>
                  {board.esRefBadge}
                </span>
              )}
            </p>
            <h1
              key={`h1-${hero.product.id}`}
              class="board-hero-swap font-signage uppercase text-2xl md:text-4xl mt-3 leading-tight max-w-4xl"
            >
              {board.heroLead(hero.product.name, country.name)}
            </h1>
            <div class="mt-4 flex items-end gap-4 md:gap-6 flex-wrap">
              <Odometer
                value={heroRate}
                label={heroAria}
                class="text-[clamp(4.5rem,16vw,11rem)] leading-none"
              />
              <span class="font-signage uppercase text-primary text-[clamp(1.5rem,4vw,3rem)] leading-none pb-1 md:pb-3">
                {heroUnit}
              </span>
            </div>

            {isLifeMode && heroLifeImpact && (
              <div class="mt-6 w-full max-w-4xl space-y-3">
                <LifeBattery
                  age={userAge}
                  retirementAge={country.retirementAge}
                  yearsFullPay={hero.years}
                  pctCareerLeft={heroLifeImpact.pctCareerLeft}
                  threat={heroLifeImpact.threat}
                  onAgeChange={onUserAgeChange}
                />
                <p class="font-board-mono text-base text-base-content/90 border-l-2 border-primary pl-3 max-w-3xl leading-relaxed break-words">
                  {heroLifeImpact.verdict}
                </p>
              </div>
            )}

            {!isLifeMode && heroWorkImpact && (
              <div class="mt-6 w-full max-w-4xl space-y-3">
                <WorkBattery
                  impact={heroWorkImpact}
                  salaryPct={heroPct}
                  productName={hero.product.name}
                />
                {heroPhrase != null && (
                  <p
                    key={`tail-${hero.product.id}`}
                    class="board-hero-swap text-base md:text-lg opacity-85 break-words"
                  >
                    {home.fullPayTail(heroPhrase)}
                  </p>
                )}
              </div>
            )}

            {heroPct != null && (
              <div class="mt-4 w-full max-w-4xl">
                <div class="flex justify-between font-board-mono text-sm uppercase tracking-[0.08em] opacity-90 mb-1 font-medium">
                  <span>{result.pctRealYearLabel}</span>
                  <span key={`pct-${hero.product.id}`} class="board-hero-swap">
                    {formatPercent(heroPct)}%
                  </span>
                </div>
                <div
                  class="h-4 border border-base-300 bg-base-200"
                  role="img"
                  aria-label={`Barra del año laboral: ocupa el ${formatPercent(heroPct)}%`}
                >
                  <div
                    class="board-pct-fill h-full"
                    style={`width: ${Math.min(100, heroPct).toFixed(1)}%; background: ${!isLifeMode && heroWorkImpact ? heroWorkImpact.effort.color : "var(--color-primary)"}`}
                  />
                </div>
              </div>
            )}
            {userAge != null && heroLifePct != null && (
              <div class={heroPct != null ? "mt-4 w-full max-w-4xl" : "mt-6 w-full max-w-4xl"}>
                <div class="flex justify-between font-board-mono text-sm uppercase tracking-[0.08em] opacity-90 mb-1 font-medium">
                  <span>{board.lifeBarLabel(userAge)}</span>
                  <span key={`life-pct-${hero.product.id}`} class="board-hero-swap">
                    {formatPercent(heroLifePct)}%
                  </span>
                </div>
                <div
                  class="h-4 border border-base-300 bg-base-200"
                  role="img"
                  aria-label={board.lifeBarAria(userAge, formatPercent(heroLifePct))}
                >
                  <div
                    class="board-pct-fill h-full bg-primary"
                    style={`width: ${Math.min(100, heroLifePct).toFixed(1)}%`}
                  />
                </div>
              </div>
            )}

          </div>
        )}
      </section>

      {/* ---- Ticker rodante ---- */}
      {rows.length > 0 && (
        <div class="board-ticker mt-12 md:mt-16" aria-label={board.tickerLabel}>
          <span class="board-live" title="En vivo">
            <span class="board-live-dot" aria-hidden="true" />
            <span class="hidden sm:inline">En vivo</span>
          </span>
          <div class="board-ticker-window">
            <div class="board-ticker-track">
              {[0, 1].map((copy) => (
                <div
                  class="flex gap-10 pr-10"
                  key={copy}
                  aria-hidden={copy === 1 ? "true" : undefined}
                >
                  {latestUpdated && (
                    <span class="board-ticker-item text-primary font-medium" key="latest-update">
                      <span class="text-accent mr-1.5">●</span>
                      ACTUALIZACIÓN: {latestUpdated.product.shortName} ({latestUpdated.source})
                      <span aria-hidden="true" class="board-ticker-dot mx-2">
                        ·
                      </span>
                    </span>
                  )}
                  {rows.map((row) => {
                    const rate = rateOf(row);
                    return (
                      <span class="board-ticker-item" key={row.product.id}>
                        {row.product.shortName}
                        <span aria-hidden="true" class="board-ticker-dot mx-2">
                          ·
                        </span>
                        <strong>{rate.text}</strong> {rate.unit}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---- Pizarra completa ---- */}
      {rows.length > 0 && (
        <section class="max-w-6xl mx-auto px-4 mt-14 md:mt-20">
          <h2 class="font-signage uppercase text-4xl md:text-5xl">{board.boardTitle}</h2>
          <p class="mt-1 mb-6 text-base opacity-80">{board.boardSubtitle}</p>
          <div class="space-y-10" key={boardPulse}>
            {rotatedGrouped.map((group) => (
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

      {/* ---- Tu tipo de cambio ---- */}
      <section class="max-w-6xl mx-auto px-4 mt-16 md:mt-24" id="exchange-panel">
        <div class="board-plate p-6 md:p-8">
          <div class="flex flex-wrap items-start gap-3">
            <span class="board-cat-icon" style="background: #ffb020; color: #14191d">
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
                <path d="M4 17l6-6-6-6" />
                <path d="M12 19h8" />
              </svg>
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="font-signage uppercase text-3xl md:text-4xl">
                  {board.exchangeTitle}
                </h2>
                <span class="board-stamp text-primary">
                  {userForm.currencyStamp(country.currencySymbol)}
                </span>
                {userActive && (
                  <span class="board-stamp board-stamp-alert">{board.yourDataStamp}</span>
                )}
              </div>
              <p class="mt-2 text-sm opacity-80 max-w-2xl">
                {board.exchangeSubtitle(country.name)}
              </p>
            </div>
          </div>
          <div class="mt-6">
            <UserForm
              countryCode={country.code}
              countryNetMonthly={country.medianNetMonthly}
              countryWeeklyHours={country.legalWeeklyHours}
              currencySymbol={country.currencySymbol}
              age={userAge}
              onChange={onUserFields}
            />
          </div>
        </div>
      </section>

      {/* ---- ¿Cuánto cuesta otra cosa? ---- */}
      <section class="max-w-6xl mx-auto px-4 mt-6" aria-label={priceForm.priceLabel}>
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

      {/* ---- CTA ficha del país + compartir cotización ---- */}
      <div class="max-w-5xl mx-auto px-4 mt-14 md:mt-16 pb-20 flex flex-wrap items-center gap-6">
        <a href={`/${country.slug}`} class="board-cta">
          {board.countryFile(country.name)} →
        </a>
        {hero && (
          <div class="board-share">
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
        <p class="text-sm opacity-80 max-w-sm">{board.effortLine}</p>
      </div>
    </div>
  );
}
