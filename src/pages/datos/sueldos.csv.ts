import type { APIRoute } from "astro";
import { aCsv, descarga, filasSueldos } from "../../lib/datasets.ts";

/** /datos/sueldos.csv — un sueldo de referencia por país, con su fuente y su año. */
export const GET: APIRoute = () =>
  new Response(aCsv(filasSueldos() as unknown as Array<Record<string, unknown>>), {
    headers: descarga("precioentiempo-sueldos.csv", "csv"),
  });
