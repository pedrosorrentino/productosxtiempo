import { useEffect, useRef, useState } from "preact/hooks";
import {
  calc,
  MIN_WEEKLY_HOURS,
  MAX_WEEKLY_HOURS,
} from "../../lib/calc.ts";
import { formatHourlyWage } from "../../lib/format.ts";
import { loadUserState, saveUserState } from "../../lib/storage.ts";
import { buildShareUrl, parseUserStateFromQuery } from "../../lib/urls.ts";
import { sameCurrency } from "../../lib/currencies.ts";
import { hourValue, userForm } from "../../i18n/es.ts";
import type { UserState } from "../../lib/types.ts";

/** Los 4 campos del formulario (SPEC §10 "Mis datos"). null = vacío/inválido. */
export interface UserFormFields {
  netMonthly: number | null;
  weeklyHours: number | null;
  monthlySavings: number | null;
  age: number | null;
}

export interface UserFormProps {
  countryCode: string;
  countryNetMonthly: number | null;
  countryWeeklyHours: number;
  currencySymbol: string;
  age?: number | null;
  /**
   * Modo isla (ResultView): emite los 4 campos al padre para el recálculo en
   * vivo; la URL la sincroniza el padre (tiene además precio y nombre). Sin
   * `onChange` (ficha de país) el formulario sincroniza su propia URL.
   */
  onChange?: (fields: UserFormFields) => void;
}

const MIN_AGE = 16;
const MAX_AGE = 80;

const parsePositive = (raw: string): number | null => {
  const value = Number(raw);
  return raw.trim() !== "" && Number.isFinite(value) && value > 0 ? value : null;
};

const parseHours = (raw: string): number | null => {
  const value = parsePositive(raw);
  return value !== null && value >= MIN_WEEKLY_HOURS && value <= MAX_WEEKLY_HOURS
    ? value
    : null;
};

const parseAge = (raw: string): number | null => {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isInteger(value) && value >= MIN_AGE && value <= MAX_AGE
    ? value
    : null;
};

/**
 * Formulario "Mis datos": neto mensual, horas/semana, ahorro mensual
 * (opcional) y edad (opcional). Recálculo EN VIVO sin botón Calcular
 * (SPEC §4.7, §19): cada cambio emite los 4 campos, persiste en `cet:v1`
 * y (en modo standalone) sincroniza la URL con `urls.ts`.
 *
 * Al montar lee query params + localStorage; los params PISAN el storage
 * (SPEC §7). Los inputs mantienen texto local (los valores parciales tipo
 * "18," no pelean contra el estado del padre).
 */
export default function UserForm({
  countryCode,
  countryNetMonthly,
  countryWeeklyHours,
  currencySymbol,
  age: externalAge,
  onChange,
}: UserFormProps) {
  const [netText, setNetText] = useState("");
  const [hoursText, setHoursText] = useState("");
  const [savingsText, setSavingsText] = useState("");
  const [ageText, setAgeText] = useState("");
  const [wage, setWage] = useState<string | null>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Montaje: query params pisan localStorage (SPEC §7). Ambos modos (isla y
  // standalone) leen las mismas fuentes, así que el valor inicial coincide
  // con el que ResultView calcula por su cuenta.
  useEffect(() => {
    const saved = loadUserState() ?? {};
    const fromQuery = parseUserStateFromQuery(
      new URLSearchParams(location.search),
    );
    const currencyMatches = !saved.countryCode || sameCurrency(saved.countryCode, countryCode);
    const net = fromQuery.netMonthly ?? (currencyMatches ? saved.netMonthly : null);
    const savings = fromQuery.monthlySavings ?? (currencyMatches ? saved.monthlySavings : null);
    const hours = fromQuery.weeklyHours ?? saved.weeklyHours;
    const age = externalAge ?? fromQuery.age ?? saved.age;

    if (net != null) setNetText(String(net));
    if (hours != null) setHoursText(String(hours));
    if (savings != null) setSavingsText(String(savings));
    if (age != null) setAgeText(String(age));
  }, [countryCode]);

  // Sincronización reactiva con externalAge (ej: LifeBarControl)
  useEffect(() => {
    if (externalAge !== undefined) {
      const currentVal = parseAge(ageText);
      if (currentVal !== externalAge) {
        setAgeText(externalAge != null ? String(externalAge) : "");
      }
    }
  }, [externalAge]);

  // Sincronización entre islas independientes via evento global cet:statechange
  useEffect(() => {
    const onStateChange = (e: Event) => {
      const customEvent = e as CustomEvent<Partial<UserState>>;
      const nextAge = customEvent.detail?.age;
      if (nextAge !== undefined) {
        const currentVal = parseAge(ageText);
        if (currentVal !== nextAge) {
          setAgeText(nextAge != null ? String(nextAge) : "");
        }
      }
    };
    window.addEventListener("cet:statechange", onStateChange);
    return () => window.removeEventListener("cet:statechange", onStateChange);
  }, [ageText]);

  // Resumen en vivo "Tu hora vale Y" SIEMPRE vía calc() (contrato: prohibido
  // duplicar la fórmula de hourlyWage).
  useEffect(() => {
    const net = parsePositive(netText);
    const hours = parseHours(hoursText);
    const effectiveHours = hours ?? countryWeeklyHours;
    if (
      net != null &&
      effectiveHours >= MIN_WEEKLY_HOURS &&
      effectiveHours <= MAX_WEEKLY_HOURS
    ) {
      try {
        setWage(
          formatHourlyWage(
            calc({
              price: 1,
              netMonthly: net,
              weeklyHours: effectiveHours,
              realAnnualHours: null,
              monthlySavings: null,
              age: null,
              retirementAge: 67,
            }).hourlyWage,
            currencySymbol,
          ),
        );
        return;
      } catch {
        // inalcanzable con las guardas de arriba; defensa ante CalcError.
      }
    }
    setWage(null);
  }, [netText, hoursText, countryWeeklyHours, currencySymbol]);

  const emit = (texts: {
    net: string;
    hours: string;
    savings: string;
    age: string;
  }) => {
    const fields: UserFormFields = {
      netMonthly: parsePositive(texts.net),
      weeklyHours: parseHours(texts.hours),
      monthlySavings: parsePositive(texts.savings),
      age: parseAge(texts.age),
    };

    saveUserState({ countryCode, ...fields });

    if (!onChangeRef.current) {
      // Modo standalone (ficha de país): la URL solo lleva los campos de aquí.
      history.replaceState(null, "", buildShareUrl(location.pathname, fields));
    }
    onChangeRef.current?.(fields);
  };

  const makeHandler =
    (field: "net" | "hours" | "savings" | "age", setText: (v: string) => void) =>
    (event: Event) => {
      const value = (event.currentTarget as HTMLInputElement).value;
      setText(value);
      emit({
        net: field === "net" ? value : netText,
        hours: field === "hours" ? value : hoursText,
        savings: field === "savings" ? value : savingsText,
        age: field === "age" ? value : ageText,
      });
    };

  const onNetInput = makeHandler("net", setNetText);
  const onHoursInput = makeHandler("hours", setHoursText);
  const onSavingsInput = makeHandler("savings", setSavingsText);
  const onAgeInput = makeHandler("age", setAgeText);

  return (
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="label" for="user-net-monthly">
          {userForm.netMonthly}
        </label>
        <label class="input w-full items-center gap-2">
          <span class="font-board-mono text-base opacity-80">{currencySymbol}</span>
          <input
            id="user-net-monthly"
            type="number"
            inputmode="decimal"
            min="1"
            class="grow"
            placeholder={countryNetMonthly != null ? String(countryNetMonthly) : ""}
            value={netText}
            onInput={onNetInput}
          />
        </label>
        <p class="mt-1 font-board-mono text-xs uppercase tracking-[0.08em] opacity-80">
          {userForm.netCurrencyNote(currencySymbol)}
        </p>
      </div>
      <div>
        <label class="label" for="user-weekly-hours">
          {userForm.weeklyHours}
        </label>
        <input
          id="user-weekly-hours"
          type="number"
          inputmode="numeric"
          min={MIN_WEEKLY_HOURS}
          max={MAX_WEEKLY_HOURS}
          class="input w-full"
          placeholder={String(countryWeeklyHours)}
          value={hoursText}
          onInput={onHoursInput}
        />
      </div>
      <div>
        <label class="label" for="user-monthly-savings">
          {userForm.monthlySavings}
        </label>
        <label class="input w-full items-center gap-2">
          <span class="font-board-mono text-base opacity-80">{currencySymbol}</span>
          <input
            id="user-monthly-savings"
            type="number"
            inputmode="decimal"
            min="1"
            class="grow"
            value={savingsText}
            onInput={onSavingsInput}
          />
        </label>
      </div>
      <div>
        <label class="label" for="user-age">
          {userForm.age}
        </label>
        <input
          id="user-age"
          type="number"
          inputmode="numeric"
          min={MIN_AGE}
          max={MAX_AGE}
          step="1"
          class="input w-full"
          value={ageText}
          onInput={onAgeInput}
        />
      </div>
      {wage && (
        <p class="sm:col-span-2 font-board-mono text-sm uppercase tracking-[0.12em]">
          {hourValue(wage)}
        </p>
      )}
    </div>
  );
}
