import type { APIRoute } from "astro";
import { aCsv, descarga, filasPrecios } from "../../lib/datasets.ts";

/** /datos/precios.csv — cada precio del catálogo con su país, su fuente y su fecha. */
export const GET: APIRoute = () =>
  new Response(aCsv(filasPrecios() as unknown as Array<Record<string, unknown>>), {
    headers: descarga("precioentiempo-precios.csv", "csv"),
  });
