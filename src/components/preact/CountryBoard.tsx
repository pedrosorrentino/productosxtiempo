import { useEffect, useState } from "preact/hooks";
import { loadUserState } from "../../lib/storage.ts";
import { categories, countryPage } from "../../i18n/es.ts";
import type { Product } from "../../lib/types.ts";
import BoardRowCard, {
  CATEGORY_COLOR,
  CATEGORY_PATHS,
  CategoryIcon,
} from "./BoardRowCard.tsx";

export interface CountryBoardRowData {
  id: string;
  name: string;
  price: number | null;
  local: boolean;
  years: number | null;
  rateText: string | null;
  rateUnit: string | null;
}

export interface CountryBoardGroup {
  category: Product["category"];
  rows: CountryBoardRowData[];
}

export interface CountryBoardProps {
  slug: string;
  currencySymbol: string;
  groups: CountryBoardGroup[];
}

/**
 * La pizarra de la ficha de país: MISMAS cards que la portada
 * (BoardRowCard). Las cotizaciones llegan calculadas en build time; la edad
 * se lee de localStorage al montar para pintar la barra de vida.
 */
export default function CountryBoard({ slug, currencySymbol, groups }: CountryBoardProps) {
  const [userAge, setUserAge] = useState<number | null>(null);

  useEffect(() => {
    const saved = loadUserState();
    if (saved?.age != null) setUserAge(saved.age);
  }, []);

  /** Orden global de las filas visibles, para el dibujado escalonado. */
  const rowOrder = new Map(
    groups.flatMap((g) => g.rows).map((r, i) => [r.id, i] as const),
  );

  return (
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
                rowI={rowOrder.get(row.id) ?? 0}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
