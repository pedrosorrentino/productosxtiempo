import type { APIRoute } from "astro";
import countriesData from "../../../data/countries.json";
import productsData from "../../../data/products.json";
import type { Country, Product } from "../../../lib/types.ts";
import { renderProductOgPng } from "../../../lib/ogRenderer.ts";

export function getStaticPaths() {
  const paths = [];
  const products = (productsData as Product[]).filter((p) => p.visible);
  const countries = countriesData as Country[];

  for (const country of countries) {
    for (const product of products) {
      const price = product.prices[country.code] ?? product.prices["ES"];
      if (!price) continue;
      paths.push({
        params: { country: country.slug, product: product.id },
        props: { country, product },
      });
    }
  }

  return paths;
}

export const GET: APIRoute = async ({ props, params }) => {
  let country = props?.country as Country | undefined;
  let product = props?.product as Product | undefined;

  if (!country && params.country) {
    country = (countriesData as Country[]).find((c) => c.slug === params.country);
  }

  if (!product && params.product) {
    product = (productsData as Product[]).find(
      (p) => p.id === params.product && p.visible,
    );
  }

  if (!country || !product) {
    return new Response("Producto o país no encontrado", { status: 404 });
  }

  const png = await renderProductOgPng(product, country);

  return new Response(png as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
