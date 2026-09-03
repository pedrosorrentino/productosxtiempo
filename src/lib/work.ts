import { formatPercent, formatWorkdays } from "./format.ts";

export interface WorkEffortLevel {
  id: "coffee" | "shift_half" | "sweat_day" | "stone" | "galley" | "titan";
  label: string;
  shortLabel: string;
  emoji: string;
  color: string;
  badgeClass: string;
  barColor: string;
  description: string;
  punchline: string;
}

export const WORK_EFFORT_LEVELS: Record<string, WorkEffortLevel> = {
  coffee: {
    id: "coffee",
    label: "Pausa del Café",
    shortLabel: "Café",
    emoji: "☕",
    color: "#3ec97e",
    badgeClass: "bg-[#3ec97e]/15 text-[#3ec97e] border-[#3ec97e]/30",
    barColor: "#3ec97e",
    description: "< 2 horas de curro",
    punchline: "Micro-esfuerzo. Te lo pagas casi en la pausa del café mientras esperas a que termine una reunión.",
  },
  shift_half: {
    id: "shift_half",
    label: "Medio Turno",
    shortLabel: "Medio Turno",
    emoji: "⚡",
    color: "#00d2ff",
    badgeClass: "bg-[#00d2ff]/15 text-[#00d2ff] border-[#00d2ff]/30",
    barColor: "#00d2ff",
    description: "2 a 8 horas",
    punchline: "Unas pocas horas de concentración y llamadas aburridas y queda totalmente liquidado.",
  },
  sweat_day: {
    id: "sweat_day",
    label: "Jornada Sudada",
    shortLabel: "Jornada",
    emoji: "💼",
    color: "#ffb020",
    badgeClass: "bg-[#ffb020]/15 text-[#ffb020] border-[#ffb020]/30",
    barColor: "#ffb020",
    description: "1 a 4 jornadas",
    punchline: "Varios días madrugando con el despertador, aguantando atascos y dando el callo frente al monitor.",
  },
  stone: {
    id: "stone",
    label: "Picar Piedra",
    shortLabel: "Picar Piedra",
    emoji: "⛏️",
    color: "#ff7b00",
    badgeClass: "bg-[#ff7b00]/15 text-[#ff7b00] border-[#ff7b00]/30",
    barColor: "#ff7b00",
    description: "1 a 4 semanas",
    punchline: "Semanas enteras de fichar religiosamente. Cada mañana del lunes al viernes va dedicada a financiar esto.",
  },
  galley: {
    id: "galley",
    label: "Modo Galera",
    shortLabel: "Galera",
    emoji: "🔥",
    color: "#e8482e",
    badgeClass: "bg-[#e8482e]/15 text-[#e8482e] border-[#e8482e]/30",
    barColor: "#e8482e",
    description: "1 a 4 meses",
    punchline: "Meses de nóminas enteras evaporadas. Estás remando semanas enteras gratis para pagar este capricho.",
  },
  titan: {
    id: "titan",
    label: "Hazaña Titánica",
    shortLabel: "Titánico",
    emoji: "👑",
    color: "#d946ef",
    badgeClass: "bg-[#d946ef]/15 text-[#d946ef] border-[#d946ef]/30",
    barColor: "#d946ef",
    description: "> 4 meses de sueldo",
    punchline: "Una odisea laboral épica. En tu empresa deberían poner una placa de bronce con tu nombre en la entrada.",
  },
};

export function getWorkEffortLevel(hours: number): WorkEffortLevel {
  if (hours < 2) return WORK_EFFORT_LEVELS.coffee;
  if (hours < 8) return WORK_EFFORT_LEVELS.shift_half;
  if (hours < 35) return WORK_EFFORT_LEVELS.sweat_day;
  if (hours < 150) return WORK_EFFORT_LEVELS.stone;
  if (hours < 650) return WORK_EFFORT_LEVELS.galley;
  return WORK_EFFORT_LEVELS.titan;
}

export interface WorkImpact {
  effort: WorkEffortLevel;
  hours: number;
  workdays: number;
  workdaysFormatted: string;
  alarmsCount: number;
  coffeeCount: number;
  payoffSchedule: string;
  salaryPercent: number | null;
  salaryPercentFormatted: string | null;
  salaryLabel: string;
  shiftsBlocks: number;
}

export function computeWorkImpact(input: {
  hours: number;
  workdays: number;
  netMonthly: number | null;
  weeklyHours: number;
  price?: number;
}): WorkImpact {
  const { hours, workdays, netMonthly, weeklyHours, price } = input;
  const effort = getWorkEffortLevel(hours);
  const dailyHours = weeklyHours > 0 ? weeklyHours / 5 : 8;

  // Cuántos despertadores a las 7 AM
  const alarmsCount = Math.max(1, Math.round(workdays));

  // Cafés de oficina (aprox 1 cada 3.5h)
  const coffeeCount = Math.max(1, Math.round(hours / 3.5));

  // Bloques de media jornada o jornada completa para representación visual (max 10 bloques)
  const shiftsBlocks = Math.min(10, Math.max(1, Math.round(hours / dailyHours)));

  // Momento exacto de pago simbólico dentro de la jornada semanal
  let payoffSchedule = "";
  if (hours <= 2) {
    payoffSchedule = "El lunes a las 11:00 AM ya es tuyo";
  } else if (hours <= 4) {
    payoffSchedule = "El lunes antes de comer queda liquidado";
  } else if (hours <= 8) {
    payoffSchedule = "El lunes a la salida del curro";
  } else if (hours <= 16) {
    payoffSchedule = "El martes a media tarde";
  } else if (hours <= 24) {
    payoffSchedule = "El miércoles al terminar la jornada";
  } else if (hours <= 32) {
    payoffSchedule = "El jueves a última hora";
  } else if (hours <= 40) {
    payoffSchedule = "El viernes a punto de empezar el fin de semana";
  } else if (hours <= 80) {
    payoffSchedule = "2 semanas consecutivas de lunes a viernes";
  } else if (hours <= 160) {
    payoffSchedule = "1 mes entero de nómina sin gastar un céntimo";
  } else {
    const months = Math.round(hours / (dailyHours * 21.66));
    payoffSchedule = `${months} meses completos de trabajo diario`;
  }

  // % de la nómina mensual
  let salaryPercent: number | null = null;
  let salaryPercentFormatted: string | null = null;
  let salaryLabel = "";

  if (netMonthly != null && netMonthly > 0 && price != null) {
    salaryPercent = (price / netMonthly) * 100;
    salaryPercentFormatted = formatPercent(salaryPercent);
    if (salaryPercent < 100) {
      salaryLabel = `${salaryPercentFormatted}% de tu nómina mensual`;
    } else {
      const monthsEquiv = (salaryPercent / 100).toFixed(1).replace(".", ",");
      salaryLabel = `${monthsEquiv} nóminas enteras limpias dedicadas`;
    }
  }

  return {
    effort,
    hours,
    workdays,
    workdaysFormatted: formatWorkdays(workdays),
    alarmsCount,
    coffeeCount,
    payoffSchedule,
    salaryPercent,
    salaryPercentFormatted,
    salaryLabel,
    shiftsBlocks,
  };
}
