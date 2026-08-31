import { useEffect, useMemo, useState } from "preact/hooks";
import type { JSX } from "preact";
import { calc } from "../../lib/calc.ts";
import {
  formatHours,
  formatMinutes,
  formatPercent,
  formatWorkdays,
  formatHumanDuration,
} from "../../lib/format.ts";
import { getCountry, getProductPrice } from "../../lib/selectors.ts";
import { loadUserState, saveUserState } from "../../lib/storage.ts";
import type { Country, Product } from "../../lib/types.ts";
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

/** Cadencia de rotación del héroe: cada cuánto cambia de artículo. */
const HERO_ROTATE_MS = 6000;

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
  const [userFields, setUserFields] = useState<{
    netMonthly: number | null;
    weeklyHours: number | null;
    monthlySavings: number | null;
    age: number | null;
  } | null>(null);

  useEffect(() => {
    const saved = loadUserState();
    if (saved?.countryCode && countries.some((c) => c.code === saved.countryCode)) {
      setCountryCode(saved.countryCode);
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
    if (saved) {
      setUserFields({
        netMonthly: saved.netMonthly ?? null,
        weeklyHours: saved.weeklyHours ?? null,
        monthlySavings: saved.monthlySavings ?? null,
        age: saved.age ?? null,
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
  const heroRate = hero ? formatWorkdays(hero.workdays) : "0";
  const heroAria = hero ? `${heroRate} ${home.workdaysUnit}` : "";
  const heroPct =
    hero && country.realAnnualHours ? (hero.hours / country.realAnnualHours) * 100 : null;

  const heroPhrase = hero
    ? formatHumanDuration(hero.hours, hero.workdays, hero.months, hero.years)
    : null;
  const userAge = userFields?.age ?? null;
  // La compra también cuesta vida: yearsFullPay años de la vida del usuario.
  // La barra se omite si la compra es minúscula (mismo corte yearsFullPay
  // < 0.05 que la línea de edad de ResultView): un "0,0 %" miente igual que
  // "0,0 cafés".
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

  /** Orden global de cada fila visible, para la cascada del latido. */
  const rowOrder = new Map(
    rotatedGrouped.flatMap((g) => g.rows).map((r, i) => [r.product.id, i] as const),
  );

  const onCountryChange = (event: JSX.TargetedEvent<HTMLSelectElement>) => {
    const code = event.currentTarget.value;
    if (!code || !countries.some((c) => c.code === code)) return;
    setCountryCode(code);
    setOrigin("saved");
    setHeroOffset(0);
    setBoardPulse(0);
    saveUserState({ countryCode: code });
  };

  const onUserFields = (fields: UserFormFields) => {
    setUserFields({
      netMonthly: fields.netMonthly,
      weeklyHours: fields.weeklyHours,
      monthlySavings: fields.monthlySavings,
      age: fields.age,
    });
  };

  /** El chip "añade tus datos" baja a la sección del formulario. */
  const scrollToExchange = (): void => {
    const panel = document.getElementById("exchange-panel");
    panel?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div class="pt-6">
      {/* ---- Placa de operación ---- */}
      <div class="max-w-5xl mx-auto px-4">
        <div class="board-plate p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
          <div class="min-w-0">
            <label
              for="board-country"
              class="font-board-mono text-xs uppercase tracking-[0.14em] opacity-70"
            >
              {board.operatingLabel}
            </label>
            <div class="flex items-center gap-3 flex-wrap mt-1">
              <strong class="font-signage text-3xl md:text-4xl uppercase leading-none">
                {country.name}
              </strong>
              {origin === "detected" && (
                <span class="board-stamp text-accent" title="Detectado por tu zona horaria">
                  {board.detectedStamp}
                </span>
              )}
              {origin === "saved" && (
                <span class="board-stamp text-primary">{board.savedStamp}</span>
              )}
              {userActive && (
                <span class="board-stamp board-stamp-alert">{board.yourDataStamp}</span>
              )}
              {!userActive && (
                <button
                  type="button"
                  class="board-stamp text-primary cursor-pointer"
                  onClick={() => scrollToExchange()}
                >
                  {board.addYourDataStamp} ↓
                </button>
              )}
            </div>
          </div>
          <div class="md:ml-auto flex items-end gap-3">
            <div>
              <span class="font-board-mono text-xs uppercase tracking-[0.14em] opacity-70 block mb-1">
                {board.changeCountryLabel}
              </span>
              <select
                id="board-country"
                class="select w-56 h-11 font-board-mono"
                value={countryCode}
                onChange={onCountryChange}
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <a
              href={`/${country.slug}`}
              class="board-navlink whitespace-nowrap hidden sm:inline-flex items-center h-11"
            >
              {board.countryFile(country.name)} →
            </a>
          </div>
        </div>
      </div>

      {/* ---- Cotización héroe ---- */}
      <section class="max-w-5xl mx-auto px-4 mt-10 md:mt-14">
        {!hero || !netMonthly ? (
          <div class="board-plate p-8 text-center">
            <h1 class="font-signage text-4xl uppercase">{noSalary.title}</h1>
            <p class="mt-3 text-lg opacity-80">{noSalary.body}</p>
            <a href={`/${country.slug}`} class="board-cta mt-6">
              {board.countryFile(country.name)} →
            </a>
          </div>
        ) : (
          <div>
            <p
              key={hero.product.id}
              class="board-hero-swap font-board-mono text-sm md:text-base opacity-80 flex flex-wrap items-center gap-x-3 gap-y-1"
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
              class="board-hero-swap font-signage uppercase text-2xl md:text-4xl mt-3 leading-tight max-w-3xl"
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
                {home.workdaysUnit}
              </span>
            </div>
            {heroPhrase != null && (
              <p
                key={`tail-${hero.product.id}`}
                class="board-hero-swap mt-4 text-lg md:text-xl"
              >
                {home.fullPayTail(heroPhrase)}
              </p>
            )}
            {heroPct != null && (
              <div class="mt-6 max-w-xl">
                <div class="flex justify-between font-board-mono text-xs uppercase tracking-[0.12em] opacity-80 mb-1">
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
                    class="board-pct-fill h-full bg-primary"
                    style={`width: ${Math.min(100, heroPct).toFixed(1)}%`}
                  />
                </div>
              </div>
            )}
            {userAge != null && heroLifePct != null && (
              <div class={heroPct != null ? "mt-4 max-w-xl" : "mt-6 max-w-xl"}>
                <div class="flex justify-between font-board-mono text-xs uppercase tracking-[0.12em] opacity-80 mb-1">
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
          <span class="board-live">
            <span class="board-live-dot" aria-hidden="true" />
            En vivo
          </span>
          <div class="board-ticker-window">
            <div class="board-ticker-track">
              {[0, 1].map((copy) => (
                <div
                  class="flex gap-10 pr-10"
                  key={copy}
                  aria-hidden={copy === 1 ? "true" : undefined}
                >
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
        <section class="max-w-5xl mx-auto px-4 mt-14 md:mt-20">
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
      <section class="max-w-5xl mx-auto px-4 mt-16 md:mt-24" id="exchange-panel">
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
              onChange={onUserFields}
            />
          </div>
        </div>
      </section>

      {/* ---- ¿Cuánto cuesta otra cosa? ---- */}
      <section class="max-w-5xl mx-auto px-4 mt-6" aria-label={priceForm.priceLabel}>
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
