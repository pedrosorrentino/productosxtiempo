import type { JSX } from "preact";

export type PickerCountry = {
  name: string;
  slug: string;
};

interface CountryPickerProps {
  countries: PickerCountry[];
  label: string;
  placeholder: string;
}

/**
 * Isla mínima de la home: un select nativo que navega a `/{slug}`.
 * Sin estado: el país elegido abre su ficha (`/[country]`).
 */
export default function CountryPicker({
  countries,
  label,
  placeholder,
}: CountryPickerProps) {
  const navigate = (event: JSX.TargetedEvent<HTMLSelectElement>) => {
    const slug = event.currentTarget.value;
    if (slug !== "") {
      location.href = `/${slug}`;
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
