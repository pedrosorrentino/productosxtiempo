import type { APIRoute } from "astro";
import { aCsv, descarga, filasHorasDeTrabajo } from "../../lib/datasets.ts";

/**
 * /datos/horas-de-trabajo.csv — el dato que da nombre al proyecto: cada precio
 * tomado en el país convertido a horas, jornadas y meses de trabajo con el
 * sueldo de referencia de ese país. Solo precios de origen «local» (no
 * conversiones), así que ninguna fila dice de un país algo que no sea de allí.
 */
export const GET: APIRoute = () =>
  new Response(aCsv(filasHorasDeTrabajo() as unknown as Array<Record<string, unknown>>), {
    headers: descarga("precioentiempo-horas-de-trabajo.csv", "csv"),
  });
