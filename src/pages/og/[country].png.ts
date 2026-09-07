import type { APIRoute } from "astro";
import countriesData from "../../data/countries.json";
import type { Country } from "../../lib/types.ts";
import { renderCountryOgPng } from "../../lib/ogRenderer.ts";

export function getStaticPaths() {
  return (countriesData as Country[]).map((country) => ({
    params: { country: country.slug },
    props: { country },
  }));
}

export const GET: APIRoute = async ({ props, params }) => {
  let country = props?.country as Country | undefined;

  if (!country && params.country) {
    country = (countriesData as Country[]).find((c) => c.slug === params.country);
  }

  if (!country) {
    return new Response("País no encontrado", { status: 404 });
  }

  const png = await renderCountryOgPng(country);

  return new Response(png as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
