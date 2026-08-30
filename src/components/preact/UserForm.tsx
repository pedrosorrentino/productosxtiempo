import { useEffect, useState } from "preact/hooks";
import type { JSX } from "preact";
import {
  WEEKS_PER_MONTH,
  MIN_WEEKLY_HOURS,
  MAX_WEEKLY_HOURS,
} from "../../lib/calc.ts";
import { formatHourlyWage } from "../../lib/format.ts";
import { loadUserState, saveUserState } from "../../lib/storage.ts";
import type { UserState } from "../../lib/types.ts";
import { hourValue, userForm } from "../../i18n/es.ts";

export interface UserFormProps {
  countryCode: string;
  countryNetMonthly: number | null;
  countryWeeklyHours: number;
  currencySymbol: string;
}

/**
 * Stub de Task 4 (Task 5 la completa con ahorro, edad y URL): neto + horas
 * con inputs daisyUI, persistencia en `cet:v1` vía storage.ts y resumen en
 * vivo "Tu hora vale Y". Sin horas escritas usa la jornada del país.
 */
export default function UserForm({
  countryCode,
  countryNetMonthly,
  countryWeeklyHours,
  currencySymbol,
}: UserFormProps) {
  const [netText, setNetText] = useState("");
  const [hoursText, setHoursText] = useState("");
  const [wage, setWage] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadUserState();
    if (!saved) return;
    if (saved.netMonthly != null) setNetText(String(saved.netMonthly));
    if (saved.weeklyHours != null) setHoursText(String(saved.weeklyHours));
  }, []);

  useEffect(() => {
    const net = Number(netText);
    const hours = Number(hoursText);
    const netValid = netText.trim() !== "" && Number.isFinite(net) && net > 0;
    const hoursEmpty = hoursText.trim() === "";
    const hoursValid =
      Number.isFinite(hours) &&
      hours >= MIN_WEEKLY_HOURS &&
      hours <= MAX_WEEKLY_HOURS;
    const effectiveHours = hoursValid ? hours : hoursEmpty ? countryWeeklyHours : null;

    if (!netValid || effectiveHours == null) {
      setWage(null);
      return;
    }

    setWage(formatHourlyWage(net / (effectiveHours * WEEKS_PER_MONTH), currencySymbol));

    const patch: Partial<UserState> = { countryCode };
    if (netValid) patch.netMonthly = net;
    if (hoursValid) patch.weeklyHours = hours;
    saveUserState(patch);
  }, [netText, hoursText, countryCode, countryWeeklyHours, currencySymbol]);

  const onNetInput = (event: JSX.TargetedEvent<HTMLInputElement>) =>
    setNetText(event.currentTarget.value);
  const onHoursInput = (event: JSX.TargetedEvent<HTMLInputElement>) =>
    setHoursText(event.currentTarget.value);

  return (
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="label" for="user-net-monthly">
          {userForm.netMonthly}
        </label>
        <input
          id="user-net-monthly"
          type="number"
          inputmode="decimal"
          min="1"
          class="input w-full"
          placeholder={countryNetMonthly != null ? String(countryNetMonthly) : ""}
          value={netText}
          onInput={onNetInput}
        />
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
      {wage && <p class="sm:col-span-2 text-lg font-medium">{hourValue(wage)}</p>}
    </div>
  );
}
