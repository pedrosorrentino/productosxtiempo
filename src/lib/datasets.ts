/**
 * Conjuntos de datos publicados (página /datos/).
 *
 * El sitio vive de datos, así que los publica en abierto: el sueldo de
 * referencia de cada país con su fuente y su año, los precios tomados en cada
 * país y, sobre todo, la conversión de esos precios a horas de trabajo, que es
 * lo que este proyecto aporta y lo que casi nadie publica.
 *
 * Este módulo es la ÚNICA fuente de esos ficheros: lo consumen los endpoints
 * (/datos/*.csv, /datos/*.json) y la propia página, para que los números de la
 * vista previa y los del fichero descargado no puedan divergir.
 *
 * Reglas que no se saltan:
 *  - Un precio sin fuente enlazable se publica marcando `origen` y sin inventar
 *    nada: el campo `origen` distingue «local» (tomado en el país) de
 *    «convertido» (el de España pasado a la divisa del país).
 *  - Las horas de trabajo solo se calculan con el sueldo de referencia del país
 *    y su jornada legal, nunca con un sueldo inventado.
 */
import countriesData from "../data/countries.json";
import productsData from "../data/products.json";
import { calcHourlyWage, STANDARD_DAY_HOURS } from "./calc.ts";
import { referenceSalary } from "./selectors.ts";
import type { Country, Product, ProductPrice } from "./types.ts";

export const LICENCIA = {
  nombre: "CC BY 4.0",
  url: "https://creativecommons.org/licenses/by/4.0/deed.es",
  cita:
    "Precio en Tiempo (precioentiempo.com), «Datos de sueldos y precios medidos en horas de trabajo», CC BY 4.0",
  nota:
    "Puedes reutilizarlos, también comercialmente, citando la fuente y enlazando a precioentiempo.com. Cada fila lleva su propia fuente: la del sueldo y la del precio.",
};

const countries = countriesData as Country[];
const products = productsData as Product[];

export interface FilaSueldo {
  pais: string;
  codigo: string;
  moneda: string;
  simbolo: string;
  sueldo_mediano_neto_mensual: number | "";
  sueldo_minimo_mensual: number | "";
  jornada_semanal_horas: number;
  horas_reales_al_anio: number | "";
  tipo_de_dato: string;
  fuente: string;
  etiqueta_fuente: string;
  url_fuente: string;
  anyo_del_dato: string;
  valor_hora_neta: number | "";
  valor_jornada_8h: number | "";
  valor_dia_de_sueldo_mes_30: number | "";
}

export interface FilaPrecio {
  producto_id: string;
  producto: string;
  categoria: string;
  pais: string;
  pais_slug: string;
  codigo: string;
  moneda: string;
  simbolo: string;
  precio: number;
  origen: "local" | "converted";
  fecha: string;
  fuente: string;
  url_fuente: string;
  nota: string;
  horas_de_trabajo: number | "";
  jornadas_de_8h: number | "";
  meses_de_sueldo: number | "";
}

const redondea = (v: number, dec = 2): number => Math.round(v * 10 ** dec) / 10 ** dec;

export function filasSueldos(): FilaSueldo[] {
  return countries.map((c) => {
    const ref = referenceSalary(c);
    const hora = ref ? calcHourlyWage(ref.monthly, c.legalWeeklyHours) : null;
    return {
      pais: c.name,
      codigo: c.code,
      moneda: c.currency,
      simbolo: c.currencySymbol,
      sueldo_mediano_neto_mensual: c.medianNetMonthly ?? "",
      sueldo_minimo_mensual: c.minWageMonthly ?? "",
      jornada_semanal_horas: c.legalWeeklyHours,
      horas_reales_al_anio: c.realAnnualHours ?? "",
      tipo_de_dato: c.salaryDataKind ?? "",
      fuente: c.salariesSource,
      etiqueta_fuente: c.salarySourceLabel ?? "",
      url_fuente: c.salariesSourceUrl ?? "",
      anyo_del_dato: c.salariesUpdatedAt,
      valor_hora_neta: hora != null ? redondea(hora, 2) : "",
      valor_jornada_8h: hora != null ? redondea(hora * STANDARD_DAY_HOURS, 2) : "",
      valor_dia_de_sueldo_mes_30: c.medianNetMonthly != null ? redondea(c.medianNetMonthly / 30, 2) : "",
    };
  });
}

export function filasPrecios(): FilaPrecio[] {
  const filas: FilaPrecio[] = [];
  for (const c of countries) {
    const ref = referenceSalary(c);
    const hora = ref ? calcHourlyWage(ref.monthly, c.legalWeeklyHours) : null;
    for (const p of products) {
      if (!p.visible) continue;
      const precio: ProductPrice | undefined = p.prices[c.code];
      if (!precio) continue;
      const horas = hora != null && hora > 0 ? precio.value / hora : null;
      filas.push({
        producto_id: p.id,
        producto: p.name,
        categoria: p.category,
        pais: c.name,
        pais_slug: c.slug,
        codigo: c.code,
        moneda: c.currency,
        simbolo: c.currencySymbol,
        precio: redondea(precio.value, 2),
        origen: precio.origin,
        fecha: precio.date,
        fuente: precio.source,
        url_fuente: precio.url ?? "",
        nota: precio.note ?? "",
        horas_de_trabajo: horas != null ? redondea(horas, 2) : "",
        jornadas_de_8h: horas != null ? redondea(horas / STANDARD_DAY_HOURS, 2) : "",
        meses_de_sueldo: horas != null && ref ? redondea(precio.value / ref.monthly, 2) : "",
      });
    }
  }
  return filas;
}

/** Solo lo que este sitio publica de verdad: precio tomado en el país. */
export function filasHorasDeTrabajo(): FilaPrecio[] {
  return filasPrecios().filter((f) => f.origen === "local" && f.horas_de_trabajo !== "");
}

// ------------------------------------------------------------------ salida
function celda(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function aCsv(filas: Array<Record<string, unknown>>, columnas?: string[]): string {
  if (filas.length === 0) return "";
  const cols = columnas ?? Object.keys(filas[0]);
  const lineas = [cols.join(",")];
  for (const f of filas) lineas.push(cols.map((c) => celda(f[c])).join(","));
  return lineas.join("\n") + "\n";
}

/** Cabeceras de descarga de los ficheros de /datos/. */
export function descarga(nombre: string, tipo: "csv" | "json"): HeadersInit {
  return {
    "Content-Type": tipo === "csv" ? "text/csv; charset=utf-8" : "application/json; charset=utf-8",
    "Content-Disposition": `attachment; filename="${nombre}"`,
    "Cache-Control": "public, max-age=3600",
  };
}
