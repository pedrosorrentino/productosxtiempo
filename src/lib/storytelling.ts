export type ViralAngle = "shock" | "reality" | "curiosity" | "challenge";
export type MetricFocus = "workdays" | "hours" | "months";
export type SocialNetwork = "x" | "whatsapp" | "telegram" | "facebook" | "instagram";

export const VIRAL_HASHTAGS = [
  "#EducacionFinanciera",
  "#PrecioEnTiempo",
  "#FinanzasPersonales",
  "#Salarios",
  "#EconomiaReal",
];

export interface StorytellingOptions {
  viralAngle: ViralAngle;
  metricFocus: MetricFocus;
  selectedNetwork: SocialNetwork;
  productName: string;
  countryName: string;
  price?: number;
  currencySymbol: string;
  hours: number;
  workdays8h: number;
  months: number;
  years: number;
  includeHashtags?: boolean;
}

/** Formatea la frase de esfuerzo según la métrica elegida */
export function formatEffortPhrase(
  metricFocus: MetricFocus,
  hours: number,
  workdays8h: number,
  months: number,
  years: number,
): string {
  const nf = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
  if (metricFocus === "hours") {
    const h = Math.round(hours);
    return `${new Intl.NumberFormat("es-ES").format(h)} horas de trabajo real`;
  }
  if (metricFocus === "months") {
    if (years >= 1) {
      return `${nf.format(years)} años enteros de salario íntegro`;
    }
    return `${nf.format(months)} meses enteros de salario mediano`;
  }
  const d = nf.format(workdays8h);
  return `${d} jornadas de 8 horas (${new Intl.NumberFormat("es-ES").format(Math.round(hours))} horas de trabajo)`;
}

/** Generador puro de textos de Storytelling Viral de Alto Impacto */
export function generateStorytellingCopy(options: StorytellingOptions): string {
  const {
    viralAngle,
    metricFocus,
    selectedNetwork,
    productName,
    countryName,
    price,
    currencySymbol,
    hours,
    workdays8h,
    months,
    years,
    includeHashtags = true,
  } = options;

  const effortPhrase = formatEffortPhrase(metricFocus, hours, workdays8h, months, years);
  const priceStr = price != null ? ` (${new Intl.NumberFormat("es-ES").format(price)} ${currencySymbol})` : "";
  const isWp = selectedNetwork === "whatsapp";
  const bold = (txt: string) => (isWp ? `*${txt}*` : txt);

  let story = "";

  switch (viralAngle) {
    case "shock":
      story = isWp
        ? `🚨 ${bold("Me he parado a hacer números y se me ha caído el alma a los pies...")}\n\nPara comprar ${bold(productName)}${priceStr} en ${bold(countryName)}, una persona con el sueldo mediano tiene que trabajar nada menos que ${bold(effortPhrase)}.\n\nNo hablamos de dinero en el banco: hablamos de madrugar, aguantar atascos y entregar parte de tu vida solo para poder pagarlo. ¿En qué momento normalizamos este disparate?\n\n👉 ${bold("Calcula cuántos días de tu vida te cuesta según tu nómina real aquí:")}`
        : `🚨 Me he parado a hacer números y se me ha caído el alma a los pies...\n\nPara comprar ${productName}${priceStr} en ${countryName}, una persona con el salario mediano tiene que trabajar exactamente ${effortPhrase}.\n\nNo hablamos de dinero: hablamos de semanas enteras madrugando y entregando tu tiempo solo para pagarlo. ¿En qué momento normalizamos este disparate?\n\n👉 Descubre cuántas semanas o meses de tu vida te cuesta según tu sueldo:`;
      break;

    case "reality":
      story = isWp
        ? `⌛ ${bold("«Cuando compras algo, no lo pagas con dinero. Lo pagas con el tiempo de tu vida que tuviste que trabajar para conseguirlo.»")} — Pepe Mújica.\n\nHe calculado el coste en tiempo real de ${bold(productName)}${priceStr} en ${bold(countryName)}: equivale exactamente a ${bold(effortPhrase)}.\n\nLa próxima vez que vayas a comprar algo, pregúntate si realmente vale tantas horas de tu existencia.\n\n👉 ${bold("Descubre el precio real en horas de lo que compras:")}`
        : `⌛ «Cuando compras algo, no lo pagas con dinero. Lo pagas con el tiempo de tu vida que tuviste que gastar para conseguirlo.» — Pepe Mújica.\n\nHe calculado el coste en horas de ${productName}${priceStr} en ${countryName} y el resultado impresiona: son ${effortPhrase}.\n\nLa próxima vez que vayas a comprarlo, pregúntate si realmente compensa tantas horas de tu existencia.\n\n👉 Mira cuánto tiempo de trabajo te cuesta a ti:`;
      break;

    case "curiosity":
      story = isWp
        ? `🤯 ${bold("El dato económico que casi nadie calcula y que te cambia la perspectiva por completo:")}\n\nEn ${bold(countryName)}, comprar ${bold(productName)}${priceStr} absorbe nada menos que ${bold(effortPhrase)}.\n\nLo más impactante es la brecha salarial: lo que a unos les cuesta un par de semanas, a otros les exige media vida. ¿En qué lado estás tú?\n\n👉 ${bold("Pon tu sueldo real en la calculadora y mira tu cifra exacta:")}`
        : `🤯 El dato económico que casi nadie se para a calcular y que te cambia la perspectiva por completo:\n\nEn ${countryName}, comprar ${productName}${priceStr} absorbe nada menos que ${effortPhrase} con el salario mediano.\n\nLo impactante es la brecha brutal entre el Salario Mínimo y otros sectores. ¿En qué lado estás tú?\n\n👉 Pon tu nómina en la calculadora y compruébalo aquí:`;
      break;

    case "challenge":
      story = isWp
        ? `📊 ${bold("Reto para abrir los ojos:")} ¿Cuántos días o meses de tu trabajo te cuesta realmente ${bold(productName)}?\n\nLa cifra oficial en ${countryName} es de ${bold(effortPhrase)} con el sueldo mediano.\n\nIntroduce tu nómina neta en esta herramienta y dime en las respuestas si te parece razonable o una locura. Yo me he quedado helado 👇`
        : `📊 Reto para abrir los ojos: ¿Cuántos días o meses de tu trabajo te cuesta realmente ${productName}?\n\nLa cifra oficial en ${countryName} asusta: ${effortPhrase} dedicados íntegramente a este gasto.\n\nPon tu nómina neta en esta herramienta y dime si te parece justo o una barbaridad. Yo me he quedado helado 👇`;
      break;
  }

  if (includeHashtags && selectedNetwork !== "whatsapp") {
    story += `\n\n${VIRAL_HASHTAGS.slice(0, 3).join(" ")}`;
  }

  return story;
}
