/**
 * Módulo de Vida & Dopamina (SPEC-tiempo-de-vida).
 *
 * Transforma el esfuerzo económico en impacto existencial directo:
 * - Semanas de vida consumidas.
 * - Porcentaje de la vida laboral activa restante hasta la jubilación.
 * - Niveles de Amenaza Vital (Pellizco, Mordisco, Hachazo Vital, Hipotecar el Alma).
 * - Batería de Vida (porción vivida, porción restante y mordisco del producto).
 */

import { formatPercent } from "./format.ts";

export const DEFAULT_RETIREMENT_AGE = 67;
export const MIN_USER_AGE = 16;
export const MAX_USER_AGE = 80;

export type ThreatId = "pinch" | "bite" | "slash" | "soul";

export interface ThreatLevel {
  id: ThreatId;
  label: string;
  shortLabel: string;
  emoji: string;
  color: string;
  bgHex: string;
  borderHex: string;
  badgeClass: string;
  description: string;
}

export const THREAT_LEVELS: Record<ThreatId, ThreatLevel> = {
  pinch: {
    id: "pinch",
    label: "Pellizco",
    shortLabel: "Pellizco",
    emoji: "🟢",
    color: "#3ec97e",
    bgHex: "#0c1f14",
    borderHex: "#3ec97e33",
    badgeClass: "bg-success/15 text-success border-success/30",
    description: "Inofensivo. Micro-impacto que apenas roza tu tiempo.",
  },
  bite: {
    id: "bite",
    label: "Mordisco",
    shortLabel: "Mordisco",
    emoji: "🟡",
    color: "#ffb020",
    bgHex: "#261a04",
    borderHex: "#ffb02033",
    badgeClass: "bg-warning/15 text-warning border-warning/30",
    description: "Se nota en el pulso. Le arranca unos días o semanas a tu calendario.",
  },
  slash: {
    id: "slash",
    label: "Hachazo Vital",
    shortLabel: "Hachazo",
    emoji: "🟠",
    color: "#ff7020",
    bgHex: "#2b1204",
    borderHex: "#ff702033",
    badgeClass: "bg-primary/20 text-[#ff8030] border-[#ff7020]/40",
    description: "Corte profundo. Estás entregando meses o años de tu juventud útil.",
  },
  soul: {
    id: "soul",
    label: "Hipotecar el Alma",
    shortLabel: "Alma",
    emoji: "🔴",
    color: "#e8482e",
    bgHex: "#290c08",
    borderHex: "#e8482e44",
    badgeClass: "bg-error/20 text-error border-error/40 animate-pulse",
    description: "Compromiso mayor. Una fracción enorme de lo que te queda de vida activa.",
  },
};

/**
 * Clasifica el nivel de amenaza vital a partir del % de carrera restante o
 * del esfuerzo en horas/años.
 */
export function getThreatLevel(
  pctCareerLeft: number | null,
  hours: number,
  yearsFullPay: number,
): ThreatLevel {
  if (pctCareerLeft != null && Number.isFinite(pctCareerLeft)) {
    if (pctCareerLeft < 0.05) return THREAT_LEVELS.pinch;
    if (pctCareerLeft < 0.5) return THREAT_LEVELS.bite;
    if (pctCareerLeft < 4.0) return THREAT_LEVELS.slash;
    return THREAT_LEVELS.soul;
  }

  // Fallback sin edad del usuario
  if (hours < 16) return THREAT_LEVELS.pinch; // < 2 jornadas
  if (hours < 160) return THREAT_LEVELS.bite; // < 1 mes
  if (yearsFullPay < 1.0) return THREAT_LEVELS.slash; // < 1 año
  return THREAT_LEVELS.soul; // >= 1 año de vida laboral
}

export interface LifeImpactInput {
  hours: number;
  yearsFullPay: number;
  weeklyHours: number;
  userAge: number | null;
  retirementAge?: number;
}

export interface LifeImpactResult {
  hasAge: boolean;
  age: number | null;
  retirementAge: number;
  yearsLeft: number | null;
  weeksLeft: number | null;
  pctCareerLeft: number | null;
  lifeWeeksCost: number;
  threat: ThreatLevel;
  // Desglose de barra de vida
  battery: {
    livedPct: number;
    workingLeftPct: number;
    bitePctOfRemaining: number;
    bitePctOfTotal: number;
  } | null;
  verdict: string;
}

/**
 * Calcula el impacto en vida para el producto / estado actual.
 */
export function computeLifeImpact(input: LifeImpactInput): LifeImpactResult {
  const retirement = input.retirementAge ?? DEFAULT_RETIREMENT_AGE;
  const age =
    input.userAge != null &&
    Number.isInteger(input.userAge) &&
    input.userAge >= MIN_USER_AGE &&
    input.userAge <= MAX_USER_AGE
      ? input.userAge
      : null;

  const hasAge = age !== null;
  const lifeWeeksCost = input.hours / Math.max(1, input.weeklyHours);

  let yearsLeft: number | null = null;
  let weeksLeft: number | null = null;
  let pctCareerLeft: number | null = null;
  let battery = null;

  if (hasAge && age !== null) {
    yearsLeft = Math.max(0, retirement - age);
    weeksLeft = Math.round(yearsLeft * 52);

    if (yearsLeft > 0) {
      pctCareerLeft = (input.yearsFullPay / yearsLeft) * 100;
    } else {
      pctCareerLeft = null;
    }

    const livedPct = Math.min(100, Math.max(0, (age / retirement) * 100));
    const workingLeftPct = Math.max(0, 100 - livedPct);
    const bitePctOfRemaining = pctCareerLeft ? Math.min(100, pctCareerLeft) : 0;
    const bitePctOfTotal = (bitePctOfRemaining / 100) * workingLeftPct;

    battery = {
      livedPct,
      workingLeftPct,
      bitePctOfRemaining,
      bitePctOfTotal,
    };
  }

  const threat = getThreatLevel(pctCareerLeft, input.hours, input.yearsFullPay);

  let verdict: string;
  if (hasAge && age !== null && yearsLeft !== null && pctCareerLeft !== null) {
    if (yearsLeft <= 0) {
      verdict = `A tus ${age} años ya has superado la edad de jubilación de referencia (${retirement} años). Esta compra representa ${formatPercent(input.yearsFullPay)} años de sueldo neto.`;
    } else {
      verdict = `A tus ${age} años, te quedan ~${yearsLeft} años de vida laboral activa. Esta compra se come el ${formatPercent(pctCareerLeft)}% de todo el tiempo de trabajo que te queda en este mundo.`;
    }
  } else {
    verdict = `Tomando la jubilación de referencia (${retirement} años), esta compra equivale a ${lifeWeeksCost >= 1 ? `${formatPercent(lifeWeeksCost)} semanas` : `${formatPercent(input.hours)} horas`} de esfuerzo laboral neto.`;
  }

  return {
    hasAge,
    age,
    retirementAge: retirement,
    yearsLeft,
    weeksLeft,
    pctCareerLeft,
    lifeWeeksCost,
    threat,
    battery,
    verdict,
  };
}
