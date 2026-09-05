import { useEffect, useMemo, useState } from "preact/hooks";
import { calc } from "../../lib/calc.ts";
import {
  formatHours,
  formatMinutes,
  formatWorkdays,
} from "../../lib/format.ts";
import { loadUserState, saveUserState } from "../../lib/storage.ts";
import type { Country, Product } from "../../lib/types.ts";
import { categories, countryPage, board } from "../../i18n/es.ts";
import BoardRowCard, {
  CATEGORY_COLOR,
  CATEGORY_PATHS,
  CategoryIcon,
} from "./BoardRowCard.tsx";
import CountryHeroCenter, { type BenchmarkItem } from "./CountryHeroCenter.tsx";

export interface CatalogRowItem {
  id: string;
  name: string;
  price: number | null;
  local: boolean;
  category: Product["category"];
  isFresh?: boolean;
  /** Valores estáticos precalculados de respaldo */
  defaultHours?: number | null;
  defaultYears?: number | null;
  defaultRateText?: string | null;
  defaultRateUnit?: string | null;
}

export interface CalculatedRowItem extends CatalogRowItem {
  hours: number | null;
  years: number | null;
  rateText: string | null;
  rateUnit: string | null;
}

export interface CatalogGroup {
  category: Product["category"];
  rows: CatalogRowItem[];
}

export interface CalculatedGroup {
  category: Product["category"];
  rows: CalculatedRowItem[];
}

export interface CountryViewProps {
  country: Country;
  groups: CatalogGroup[];
  anchors?: Record<string, number | null>;
}

export default function CountryView({
  country,
  groups,
  anchors,
}: CountryViewProps) {
  // Estado de usuario hidratado de localStorage
  const [userNetMonthly, setUserNetMonthly] = useState<number | null>(null);
  const [userWeeklyHours, setUserWeeklyHours] = useState<number | null>(null);
  const [userAge, setUserAge] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"work" | "life">("work");

  // Filtro de categorías y búsqueda
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Calculadora rápida de precio libre
  const [quickPrice, setQuickPrice] = useState<string>("");

  useEffect(() => {
    const saved = loadUserState();
    if (saved?.netMonthly != null) setUserNetMonthly(saved.netMonthly);
    if (saved?.weeklyHours != null) setUserWeeklyHours(saved.weeklyHours);
    if (saved?.age != null) setUserAge(saved.age);
    if (saved?.viewMode) {
      setViewMode(saved.viewMode);
    } else if (saved?.age != null) {
      setViewMode("life");
    }
  }, []);

  // Handlers reactivos que persisten en localStorage
  const handleSalaryChange = (newSalary: number) => {
    setUserNetMonthly(newSalary);
    saveUserState({ netMonthly: newSalary });
  };

  const handleHoursChange = (newHours: number) => {
    setUserWeeklyHours(newHours);
    saveUserState({ weeklyHours: newHours });
  };

  const handleAgeChange = (newAge: number) => {
    setUserAge(newAge);
    saveUserState({ age: newAge, viewMode: "life" });
  };

  const handleViewModeChange = (mode: "work" | "life") => {
    setViewMode(mode);
    saveUserState({ viewMode: mode });
  };

  // Valores activos para el cálculo dinámico
  const activeSalary = userNetMonthly ?? country.medianNetMonthly ?? 1500;
  const activeWeeklyHours = userWeeklyHours ?? country.legalWeeklyHours;
  const activeAge = userAge ?? 30;

  // Construcción del Barómetro de Esfuerzo Nacional desde anchors.json
  const benchmarksList: BenchmarkItem[] = useMemo(() => {
    const fallbackPrice = (p: number | null | undefined, def: number) =>
      p != null && p > 0 ? p : def;

    return [
      {
        key: "cafe",
        name: "Café expreso",
        icon: "☕",
        price: fallbackPrice(anchors?.cafe, country.currency === "EUR" ? 1.5 : 30),
      },
      {
        key: "menu",
        name: "Menú del día",
        icon: "🍽️",
        price: fallbackPrice(anchors?.menu, country.currency === "EUR" ? 14 : 120),
      },
      {
        key: "super",
        name: "Compra semanal",
        icon: "🛒",
        price: fallbackPrice(
          anchors?.menu ? anchors.menu * 5 : null,
          country.currency === "EUR" ? 75 : 600,
        ),
      },
      {
        key: "iphone",
        name: "iPhone de catálogo",
        icon: "📱",
        price: fallbackPrice(anchors?.iphone, country.currency === "EUR" ? 1000 : 22000),
      },
      {
        key: "alquiler",
        name: "Mes de alquiler",
        icon: "🏠",
        price: fallbackPrice(anchors?.alquiler, country.currency === "EUR" ? 900 : 13000),
      },
    ];
  }, [anchors, country.currency]);

  // Recálculo dinámico a 60 FPS de todo el catálogo según salario activo
  const recalculatedCatalog: CalculatedGroup[] = useMemo(() => {
    return groups.map((group) => {
      const rows: CalculatedRowItem[] = group.rows.map((row) => {
        if (row.price == null || activeSalary <= 0 || activeWeeklyHours <= 0) {
          return {
            ...row,
            hours: null,
            years: null,
            rateText: null,
            rateUnit: null,
          };
        }

        try {
          const res = calc({
            price: row.price,
            netMonthly: activeSalary,
            weeklyHours: activeWeeklyHours,
            realAnnualHours: country.realAnnualHours,
            monthlySavings: null,
            age: activeAge,
            retirementAge: country.retirementAge,
          });

          let text: string;
          let unit: string;

          if (res.hours < 1) {
            text = formatMinutes(res.hours * 60);
            unit = text === "1" ? "minuto" : "minutos";
          } else if (res.workdays8h < 1) {
            text = formatHours(res.hours);
            unit = text === "1" ? "hora" : "horas";
          } else {
            text = formatWorkdays(res.workdays8h);
            unit = "jornadas";
          }

          return {
            ...row,
            hours: res.hours,
            years: res.yearsFullPay,
            rateText: text,
            rateUnit: unit,
          };
        } catch {
          return {
            ...row,
            hours: null,
            years: null,
            rateText: null,
            rateUnit: null,
          };
        }
      });

      return {
        category: group.category,
        rows,
      };
    });
  }, [
    groups,
    activeSalary,
    activeWeeklyHours,
    activeAge,
    country.realAnnualHours,
    country.retirementAge,
  ]);

  // Filtrado por categoría y búsqueda de texto
  const filteredCatalog: CalculatedGroup[] = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const result: CalculatedGroup[] = [];
    for (const group of recalculatedCatalog) {
      if (selectedCategory !== "all" && group.category !== selectedCategory) {
        continue;
      }
      const matchingRows = group.rows.filter((r) =>
        q === "" ? true : r.name.toLowerCase().includes(q),
      );
      if (matchingRows.length > 0) {
        result.push({
          category: group.category,
          rows: matchingRows,
        });
      }
    }
    return result;
  }, [recalculatedCatalog, selectedCategory, searchQuery]);

  // Total de productos disponibles
  const totalProductsCount = useMemo(() => {
    return groups.reduce((acc, g) => acc + g.rows.length, 0);
  }, [groups]);

  // Recálculo del precio libre rápido
  const quickCalculation = useMemo(() => {
    const p = parseFloat(quickPrice.replace(",", "."));
    if (!p || p <= 0 || activeSalary <= 0 || activeWeeklyHours <= 0) return null;
    try {
      const res = calc({
        price: p,
        netMonthly: activeSalary,
        weeklyHours: activeWeeklyHours,
        realAnnualHours: country.realAnnualHours,
        monthlySavings: null,
        age: activeAge,
        retirementAge: country.retirementAge,
      });
      let text: string;
      let unit: string;
      if (res.hours < 1) {
        text = formatMinutes(res.hours * 60);
        unit = text === "1" ? "minuto" : "minutos";
      } else if (res.workdays8h < 1) {
        text = formatHours(res.hours);
        unit = text === "1" ? "hora" : "horas";
      } else {
        text = formatWorkdays(res.workdays8h);
        unit = "jornadas de 8 h";
      }
      return { hours: res.hours, text, unit, price: p };
    } catch {
      return null;
    }
  }, [quickPrice, activeSalary, activeWeeklyHours, activeAge, country.realAnnualHours, country.retirementAge]);

  /** Orden global para el dibujo escalonado */
  const rowOrder = useMemo(() => {
    return new Map(
      filteredCatalog.flatMap((g) => g.rows).map((r, i) => [r.id, i] as const),
    );
  }, [filteredCatalog]);

  return (
    <div class="space-y-10">
      {/* 1. HERO DESCOMUNAL: Tacómetro de la Hora + Modo Tiempo de Vida + Sliders */}
      <CountryHeroCenter
        countryName={country.name}
        currencySymbol={country.currencySymbol}
        medianNetMonthly={country.medianNetMonthly}
        legalWeeklyHours={country.legalWeeklyHours}
        realAnnualHours={country.realAnnualHours}
        retirementAge={country.retirementAge}
        userNetMonthly={userNetMonthly}
        userWeeklyHours={userWeeklyHours}
        userAge={userAge}
        viewMode={viewMode}
        onSalaryChange={handleSalaryChange}
        onHoursChange={handleHoursChange}
        onAgeChange={handleAgeChange}
        onViewModeChange={handleViewModeChange}
        benchmarks={benchmarksList}
      />

      {/* 2. CALCULADORA RÁPIDA DE CUALQUIER COMPRA */}
      <div class="board-plate p-5 bg-base-200/90 border border-base-300 shadow-md">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-start gap-3">
            <span class="board-cat-icon" style="background: #3ec97e; color: #14191d">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
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
            <div>
              <h2 class="font-signage uppercase text-xl sm:text-2xl leading-none">
                ¿Tienes otro gasto en mente en {country.name}?
              </h2>
              <p class="font-board-mono text-xs opacity-75 mt-1">
                Escribe cualquier importe y descubre cuántas horas o jornadas te cuesta exactamente:
              </p>
            </div>
          </div>

          {/* Formulario rápido en línea */}
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <div class="relative flex-1 sm:flex-initial">
              <input
                type="number"
                min="1"
                placeholder="Ej. 150"
                value={quickPrice}
                onInput={(e) => setQuickPrice((e.target as HTMLInputElement).value)}
                class="input input-sm w-full sm:w-44 font-board-mono font-bold pr-8 text-right bg-base-100 border-base-content/20 text-primary"
                aria-label="Precio a calcular"
              />
              <span class="absolute right-3 top-1.5 font-board-mono text-xs font-bold opacity-60">
                {country.currencySymbol}
              </span>
            </div>

            <a
              href={`/${country.slug}/precio?precio=${encodeURIComponent(quickPrice || "150")}`}
              class={`btn btn-sm btn-primary font-board-mono text-xs uppercase tracking-wider shrink-0 transition-opacity ${
                quickPrice ? "opacity-100" : "opacity-60 pointer-events-none"
              }`}
            >
              Analizar &rarr;
            </a>
          </div>
        </div>

        {/* Resultado del cálculo rápido al vuelo */}
        {quickCalculation && (
          <div class="mt-4 pt-3 border-t border-base-content/10 flex flex-wrap items-center justify-between gap-3 bg-base-100/60 p-3 rounded-lg animate-fade-in">
            <div class="flex items-center gap-2 font-board-mono text-sm">
              <span class="opacity-75">Una compra de</span>
              <span class="font-bold text-base-content">
                {quickCalculation.price.toLocaleString("es-ES")} {country.currencySymbol}
              </span>
              <span class="opacity-75">te cuesta exactamente:</span>
            </div>

            <div class="flex items-baseline gap-1.5">
              <span class="font-signage text-2xl font-black text-primary">
                {quickCalculation.text}
              </span>
              <span class="font-board-mono text-xs uppercase tracking-wider font-semibold opacity-80">
                {quickCalculation.unit}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. CATÁLOGO NACIONAL COMPLETO REACTIVO */}
      <section aria-label={board.countryBoard(country.name)} class="space-y-6">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 class="font-signage uppercase text-3xl sm:text-4xl md:text-5xl">
              {board.countryBoard(country.name)}
            </h2>
            <p class="font-board-mono text-xs sm:text-sm opacity-80 mt-1">
              {viewMode === "life"
                ? "Nivel de amenaza vital y semanas de futuro consumidas por cada artículo:"
                : "Todo el catálogo nacional cotizado en jornadas y horas de esfuerzo laboral:"}
            </p>
          </div>

          {/* Buscador en vivo de productos */}
          <div class="w-full md:w-64">
            <div class="relative">
              <input
                type="text"
                placeholder="Buscar artículo..."
                value={searchQuery}
                onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                class="input input-sm w-full font-board-mono bg-base-200/90 border-base-content/20 text-xs pl-8 pr-3"
                aria-label="Buscar en el catálogo"
              />
              <span class="absolute left-2.5 top-2 opacity-50 text-xs">🔍</span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  class="absolute right-2 top-1.5 opacity-60 hover:opacity-100 font-bold text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Píldoras de filtro por categoría */}
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
          <button
            type="button"
            class={`px-3 py-1.5 rounded-full font-board-mono text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === "all"
                ? "bg-primary text-primary-content font-bold shadow-xs"
                : "bg-base-200/80 hover:bg-base-200 text-base-content/75"
            }`}
            onClick={() => setSelectedCategory("all")}
          >
            Todos ({totalProductsCount})
          </button>
          {groups.map((g) => (
            <button
              key={g.category}
              type="button"
              class={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-board-mono text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === g.category
                  ? "bg-primary text-primary-content font-bold shadow-xs"
                  : "bg-base-200/80 hover:bg-base-200 text-base-content/75"
              }`}
              onClick={() => setSelectedCategory(g.category)}
            >
              <span>{categories[g.category]}</span>
              <span class="opacity-60 text-[10px]">({g.rows.length})</span>
            </button>
          ))}
        </div>

        {/* Lista de productos por grupos */}
        {filteredCatalog.length === 0 ? (
          <div class="board-plate p-10 text-center">
            <span class="text-4xl block mb-2">🔍</span>
            <p class="font-signage uppercase text-xl">Sin resultados</p>
            <p class="font-board-mono text-xs opacity-75 mt-1">
              No hemos encontrado productos que coincidan con "{searchQuery}".
            </p>
            <button
              type="button"
              class="btn btn-xs btn-outline btn-primary font-board-mono mt-4"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
            >
              Ver todo el catálogo
            </button>
          </div>
        ) : (
          <div class="space-y-10">
            {filteredCatalog.map((group) => (
              <div key={group.category} class="space-y-3">
                <h3 class="flex items-center gap-3">
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
                  {group.rows.map((row) => (
                    <BoardRowCard
                      key={row.id}
                      href={`/${country.slug}/${row.id}`}
                      name={row.name}
                      icon={CATEGORY_PATHS[group.category]}
                      color={CATEGORY_COLOR[group.category]}
                      price={row.price}
                      priceSymbol={row.price != null ? country.currencySymbol : null}
                      priceFallback={row.price != null ? null : countryPage.noLocalPriceBadge}
                      converted={false}
                      rateText={row.rateText}
                      rateUnit={row.rateUnit}
                      rateCta={row.rateText != null ? null : countryPage.noLocalPriceCta}
                      years={row.years}
                      userAge={userAge}
                      retirementAge={country.retirementAge}
                      hours={row.hours ?? undefined}
                      viewMode={viewMode}
                      isFresh={row.isFresh}
                      rowI={rowOrder.get(row.id) ?? 0}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
