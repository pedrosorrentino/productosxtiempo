import type { APIRoute } from "astro";
import { descarga, filasSueldos, LICENCIA } from "../../lib/datasets.ts";

/** /datos/sueldos.json — los sueldos de referencia y el valor de una hora, en JSON. */
export const GET: APIRoute = () => {
  const cuerpo = {
    fuente: "precioentiempo.com",
    descripcion:
      "Sueldo neto de referencia de cada país (con su organismo y su año) y lo que vale una hora, una jornada de 8 h y un día de sueldo con esa referencia.",
    licencia: LICENCIA,
    generado: new Date().toISOString().slice(0, 10),
    unidades: {
      sueldos: "moneda local del país, netos al mes",
      valor_hora_neta: "moneda local por hora = sueldo mensual ÷ (horas semanales × 52 ÷ 12)",
      valor_jornada_8h: "moneda local por jornada de 8 horas",
    },
    sueldos: filasSueldos(),
  };
  return new Response(JSON.stringify(cuerpo, null, 1), {
    headers: descarga("precioentiempo-sueldos.json", "json"),
  });
};
