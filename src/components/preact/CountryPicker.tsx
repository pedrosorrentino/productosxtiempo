import type { JSX } from "preact";

export type PickerCountry = {
  name: string;
  slug: string;
};

interface CountryPickerProps {
  countries: PickerCountry[];
  label: string;
  placeholder: string;
  /**
   * URL destino por país; por defecto la ficha `/{slug}` (home). ResultView la
   * usa para saltar a `/{slug}/{producto|precio}` conservando los params.
   */
  hrefFor?: (slug: string) => string;
}

/**
 * Isla mínima de la home: un select nativo que navega a `/{slug}`.
 * Sin estado: el país elegido abre su destino (`/[country]` o el que diga
 * `hrefFor`).
 */
export default function CountryPicker({
  countries,
  label,
  placeholder,
  hrefFor,
}: CountryPickerProps) {
  const href = (slug: string): string => (hrefFor ? hrefFor(slug) : `/${slug}`);

  const navigate = (event: JSX.TargetedEvent<HTMLSelectElement>) => {
    const slug = event.currentTarget.value;
    if (slug !== "") {
      location.href = href(slug);
    }
  };

  return (
    <div class="text-left">
      <label class="label" for="country-picker">
        {label}
      </label>
      <select
        id="country-picker"
        class="select w-full max-w-xs"
        value=""
        onChange={navigate}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {countries.map((country) => (
          <option key={country.slug} value={country.slug}>
            {country.name}
          </option>
        ))}
      </select>
    </div>
  );
}
