import { useEffect, useState } from "preact/hooks";
import { loadUserState, saveUserState } from "../../lib/storage.ts";
import { categories, countryPage } from "../../i18n/es.ts";
import type { Product } from "../../lib/types.ts";
import BoardRowCard, {
  CATEGORY_COLOR,
  CATEGORY_PATHS,
  CategoryIcon,
} from "./BoardRowCard.tsx";
import LifeBarControl from "./LifeBarControl.tsx";

export interface CountryBoardRowData {
  id: string;
  name: string;
  price: number | null;
  local: boolean;
  hours?: number | null;
  years: number | null;
  rateText: string | null;
  rateUnit: string | null;
  isFresh?: boolean;
}

export interface CountryBoardGroup {
  category: Product["category"];
  rows: CountryBoardRowData[];
}

export interface CountryBoardProps {
  slug: string;
  currencySymbol: string;
  groups: CountryBoardGroup[];
  retirementAge?: number;
}

/**
 * La pizarra de la ficha de país: MISMAS cards que la portada
 * (BoardRowCard). Las cotizaciones llegan calculadas en build time; la edad
 * se lee de localStorage al montar para pintar la barra de vida y activar
 * el Modo Vida con sus niveles de amenaza vital.
 */
export default function CountryBoard({
  slug,
  currencySymbol,
  groups,
  retirementAge = 67,
}: CountryBoardProps) {
  const [userAge, setUserAge] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"work" | "life">("work");

  useEffect(() => {
    const saved = loadUserState();
    if (saved?.age != null) setUserAge(saved.age);
    if (saved?.viewMode) {
      setViewMode(saved.viewMode);
    } else if (saved?.age != null) {
      setViewMode("life");
    }
  }, []);

  const onAgeChange = (newAge: number | null) => {
    setUserAge(newAge);
    saveUserState({ age: newAge, viewMode: "life" });
    setViewMode("life");
  };

  const onViewModeChange = (mode: "work" | "life") => {
    setViewMode(mode);
    saveUserState({ viewMode: mode });
  };

  /** Orden global de las filas visibles, para el dibujado escalonado. */
  const rowOrder = new Map(
    groups.flatMap((g) => g.rows).map((r, i) => [r.id, i] as const),
  );

  return (
    <div class="space-y-8">
      {/* Control interactivo de Vida & Modo */}
      <LifeBarControl
        age={userAge}
        viewMode={viewMode}
        onAgeChange={onAgeChange}
        onViewModeChange={onViewModeChange}
        retirementAge={retirementAge}
      />

      <div class="space-y-10">
        {groups.map((group) => (
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
              {group.rows.map((row) => (
                <BoardRowCard
                  key={row.id}
                  href={`/${slug}/${row.id}`}
                  name={row.name}
                  icon={CATEGORY_PATHS[group.category]}
                  color={CATEGORY_COLOR[group.category]}
                  price={row.price}
                  priceSymbol={row.price != null ? currencySymbol : null}
                  priceFallback={row.price != null ? null : countryPage.noLocalPriceBadge}
                  converted={false}
                  rateText={row.rateText}
                  rateUnit={row.rateUnit}
                  rateCta={row.rateText != null ? null : countryPage.noLocalPriceCta}
                  years={row.years}
                  userAge={userAge}
                  retirementAge={retirementAge}
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
    </div>
  );
}
