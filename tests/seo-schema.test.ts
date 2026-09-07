import { describe, it, expect } from "vitest";
import { generateProductSchema, getProductBrand } from "../src/lib/seo.ts";
import productsData from "../src/data/products.json";
import countriesData from "../src/data/countries.json";
import type { Product, Country } from "../src/lib/types.ts";

describe("generateProductSchema (Google Search Console compliance)", () => {
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

  it("generates complete schema satisfying both Product Snippets and Merchant Listings", () => {
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

    // 2. Brand & international identifier (Solves GSC: 'No se ha proporcionado ningún identificador internacional, como el GTIN o la marca')
    expect(schema.brand).toBeDefined();
    expect(schema.brand["@type"]).toBe("Brand");
    expect(schema.brand.name).toBe("Tesla");

    // 3. Review (Solves GSC: 'Falta el campo review')
    expect(schema.review).toBeDefined();
    expect(schema.review["@type"]).toBe("Review");
    expect(schema.review.author).toBeDefined();
    expect(schema.review.author["@type"]).toBe("Organization");
    expect(schema.review.reviewRating).toBeDefined();
    expect(schema.review.reviewRating["@type"]).toBe("Rating");
    expect(schema.review.reviewRating.bestRating).toBe("5");
    expect(schema.review.reviewRating.worstRating).toBe("1");
    expect(schema.review.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // 4. AggregateRating (Solves GSC: 'Falta el campo aggregateRating')
    expect(schema.aggregateRating).toBeDefined();
    expect(schema.aggregateRating["@type"]).toBe("AggregateRating");
    expect(schema.aggregateRating.ratingValue).toBeDefined();
    expect(schema.aggregateRating.bestRating).toBe("5");
    expect(schema.aggregateRating.worstRating).toBe("1");
    expect(schema.aggregateRating.ratingCount).toBeGreaterThan(0);

    // 5. Offers - validFrom (Solves GSC: 'Falta el campo validFrom (en offers)')
    expect(schema.offers).toBeDefined();
    expect(schema.offers["@type"]).toBe("Offer");
    expect(schema.offers.validFrom).toBeDefined();
    expect(schema.offers.validFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(schema.offers.priceValidUntil).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // 6. Offers - hasMerchantReturnPolicy (Solves GSC: 'Falta el campo hasMerchantReturnPolicy (en offers)')
    expect(schema.offers.hasMerchantReturnPolicy).toBeDefined();
    expect(schema.offers.hasMerchantReturnPolicy["@type"]).toBe("MerchantReturnPolicy");
    expect(schema.offers.hasMerchantReturnPolicy.applicableCountry).toBe("ES");
    expect(schema.offers.hasMerchantReturnPolicy.returnPolicyCategory).toBe(
      "https://schema.org/MerchantReturnNotPermitted"
    );

    // 7. Offers - shippingDetails (Solves GSC: 'Falta el campo shippingDetails (en offers)')
    expect(schema.offers.shippingDetails).toBeDefined();
    expect(schema.offers.shippingDetails["@type"]).toBe("OfferShippingDetails");
    expect(schema.offers.shippingDetails.shippingRate).toBeDefined();
    expect(schema.offers.shippingDetails.shippingRate["@type"]).toBe("MonetaryAmount");
    expect(schema.offers.shippingDetails.shippingRate.value).toBe(0);
    expect(schema.offers.shippingDetails.shippingRate.currency).toBe("EUR");
    expect(schema.offers.shippingDetails.shippingDestination.addressCountry).toBe("ES");
    expect(schema.offers.shippingDetails.deliveryTime["@type"]).toBe("ShippingDeliveryTime");
  });

  it("handles products with different price date formats", () => {
    const cafe = products.find((p) => p.id === "cafe")!;
    const price = cafe.prices["ES"]!;

    const schema = generateProductSchema({
      product: cafe,
      country: spain,
      price,
      canonicalUrl: "https://precioentiempo.com/espana/cafe/",
      imageUrl: "https://precioentiempo.com/og/espana/cafe.png",
    });

    expect(schema.offers.validFrom).toBe("2026-08-01");
    expect(schema.offers.priceValidUntil).toBe("2026-12-31");
    expect(schema.brand.name).toBe("Hostelería Local");
  });

  it("handles international countries correctly (US, MX, GB)", () => {
    const us = countries.find((c) => c.code === "US")!;
    const iphone = products.find((p) => p.id === "iphone")!;
    const price = iphone.prices["US"]!;

    const schema = generateProductSchema({
      product: iphone,
      country: us,
      price,
      canonicalUrl: "https://precioentiempo.com/estados-unidos/iphone/",
      imageUrl: "https://precioentiempo.com/og/estados-unidos/iphone.png",
    });

    expect(schema.brand.name).toBe("Apple");
    expect(schema.offers.shippingDetails.shippingDestination.addressCountry).toBe("US");
    expect(schema.offers.hasMerchantReturnPolicy.applicableCountry).toBe("US");
    expect(schema.offers.priceCurrency).toBe("USD");
  });
});
