import { describe, it, expect } from "vitest";
import {
  generateProductSchema,
  generateCategorySchema,
  generateWebApplicationSchema,
  getProductBrand,
} from "../src/lib/seo.ts";
import productsData from "../src/data/products.json";
import countriesData from "../src/data/countries.json";
import type { Product, Country } from "../src/lib/types.ts";

describe("Schema.org generation (Google Search Central compliance)", () => {
  const products = productsData as Product[];
  const countries = countriesData as Country[];
  const spain = countries.find((c) => c.code === "ES")!;

  it("every product has a valid non-empty brand name", () => {
    for (const p of products) {
      const brandName = getProductBrand(p);
      expect(brandName).toBeDefined();
      expect(typeof brandName).toBe("string");
      expect(brandName.trim().length).toBeGreaterThan(0);
    }
  });

  it("generates legitimate Product schema with quantitative labor effort properties", () => {
    const tesla = products.find((p) => p.id === "tesla-model-3")!;
    const price = tesla.prices["ES"]!;

    const schema = generateProductSchema({
      product: tesla,
      country: spain,
      price,
      canonicalUrl: "https://precioentiempo.com/espana/tesla-model-3/",
      imageUrl: "https://precioentiempo.com/og/espana/tesla-model-3.png",
      hours: 3850.5,
      workdays8h: 481.3,
      monthsFullPay: 23.4,
    });

    // 1. Basic Product fields
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("Product");
    expect(schema.name).toBe(tesla.name);
    expect(schema.sku).toBe("tesla-model-3-es");

    // 2. Brand
    expect(schema.brand).toBeDefined();
    expect(schema.brand["@type"]).toBe("Brand");
    expect(schema.brand.name).toBe("Tesla");

    // 4. Magnitudes de esfuerzo laboral
    expect(schema.additionalProperty).toBeDefined();
    expect(Array.isArray(schema.additionalProperty)).toBe(true);
    expect(schema.additionalProperty?.length).toBe(3);

    const hoursProp = schema.additionalProperty?.find((p: any) => p.name === "Horas de trabajo necesarias");
    expect(hoursProp).toBeDefined();
    expect(hoursProp.value).toBe(3850.5);

    // 5. URL canónica del producto
    expect(schema.url).toBe("https://precioentiempo.com/espana/tesla-model-3/");

    // 6. Sin datos inventados: nada de reseñas, ratings ni ofertas de comercio
    // (el sitio no vende y Google trata ese markup como spam).
    expect(schema.review).toBeUndefined();
    expect(schema.aggregateRating).toBeUndefined();
    expect(schema.offers).toBeUndefined();
  });

  it("generates Category schema (CollectionPage)", () => {
    const schema = generateCategorySchema({
      categoryName: "Tecnología",
      categoryDescription: "Dispositivos tecnológicos medidos en horas de trabajo",
      country: spain,
      canonicalUrl: "https://precioentiempo.com/espana/categoria/tecnologia/",
      items: [
        { name: "iPhone", url: "https://precioentiempo.com/espana/iphone/" },
        { name: "Portátil", url: "https://precioentiempo.com/espana/portatil/" },
      ],
    });

    expect(schema["@type"]).toBe("CollectionPage");
    expect(schema.mainEntity).toBeDefined();
    expect(schema.mainEntity["@type"]).toBe("ItemList");
    expect(schema.mainEntity.itemListElement.length).toBe(2);
  });

  it("generates WebApplication schema for calculators", () => {
    const schema = generateWebApplicationSchema({
      name: "Calculadora de Precios en Tiempo",
      description: "Convierte precios a horas de trabajo",
      url: "https://precioentiempo.com/espana/precio/",
    });

    expect(schema["@type"]).toBe("WebApplication");
    expect(schema.operatingSystem).toBe("All");
    expect(schema.browserRequirements).toBeDefined();
  });
});
