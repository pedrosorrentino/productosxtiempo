import type { APIRoute } from "astro";
import countriesData from "../../data/countries.json";
import productsData from "../../data/products.json";
import type { Country, Product } from "../../lib/types.ts";
import { renderHomeOgPng } from "../../lib/ogRenderer.ts";

export const GET: APIRoute = async () => {
  const products = productsData as Product[];
  const countries = countriesData as Country[];
  const heroProduct = products.find((p) => p.id === "tesla-model-3") ?? products[0];
  const heroCountry = countries.find((c) => c.code === "ES") ?? countries[0];

  const png = await renderHomeOgPng(heroProduct, heroCountry);

  return new Response(png as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
