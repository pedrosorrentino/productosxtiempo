// src/lib/seo.ts
import type { Country, Product, ProductPrice } from "./types.ts";

export const COUNTRY_LOCALES: Record<string, { hreflang: string; ogLocale: string; langCode: string }> = {
  ES: { hreflang: "es-ES", ogLocale: "es_ES", langCode: "es-ES" },
  PT: { hreflang: "es-PT", ogLocale: "es_PT", langCode: "es-PT" },
  FR: { hreflang: "es-FR", ogLocale: "es_FR", langCode: "es-FR" },
  DE: { hreflang: "es-DE", ogLocale: "es_DE", langCode: "es-DE" },
  IT: { hreflang: "es-IT", ogLocale: "es_IT", langCode: "es-IT" },
  GB: { hreflang: "es-GB", ogLocale: "es_GB", langCode: "es-GB" },
  US: { hreflang: "es-US", ogLocale: "es_US", langCode: "es-US" },
  MX: { hreflang: "es-MX", ogLocale: "es_MX", langCode: "es-MX" },
  AR: { hreflang: "es-AR", ogLocale: "es_AR", langCode: "es-AR" },
  CO: { hreflang: "es-CO", ogLocale: "es_CO", langCode: "es-CO" },
  CL: { hreflang: "es-CL", ogLocale: "es_CL", langCode: "es-CL" },
  CH: { hreflang: "es-CH", ogLocale: "es_CH", langCode: "es-CH" },
};

export interface HreflangLink {
  hreflang: string;
  href: string;
}

/**
 * Genera el set completo y bidireccional de etiquetas hreflang para una ruta.
 * Incluye auto-referencia, retorno entre todos los países y x-default (apuntando a España).
 */
export function generateHreflangs(
  countries: Country[],
  currentPathType: "product" | "country" | "precio",
  productId?: string,
  siteUrl: string = "https://precioentiempo.com"
): HreflangLink[] {
  const links: HreflangLink[] = [];
  const cleanSite = siteUrl.replace(/\/$/, "");

  for (const c of countries) {
    const localeInfo = COUNTRY_LOCALES[c.code] ?? { hreflang: `es-${c.code}`, ogLocale: `es_${c.code}`, langCode: "es" };
    let path = `/${c.slug}`;
    if (currentPathType === "product" && productId) {
      path = `/${c.slug}/${productId}`;
    } else if (currentPathType === "precio") {
      path = `/${c.slug}/precio`;
    }
    links.push({
      hreflang: localeInfo.hreflang,
      href: `${cleanSite}${path}/`,
    });
  }

  // x-default apunta a la versión de España o a la raíz
  const defaultPath = currentPathType === "product" && productId ? `/espana/${productId}/` : currentPathType === "precio" ? `/espana/precio/` : `/espana/`;
  links.push({
    hreflang: "x-default",
    href: `${cleanSite}${defaultPath}`,
  });

  return links;
}

/**
 * Genera Schema.org JSON-LD para Product con QuantitativeValue en horas y jornadas.
 */
export function generateProductSchema(input: {
  product: Product;
  country: Country;
  price: ProductPrice;
  canonicalUrl: string;
  imageUrl: string;
  workdays8h?: number | null;
  hours?: number | null;
  monthsFullPay?: number | null;
}) {
  const additionalProperties: any[] = [];

  if (input.hours != null) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "Horas de trabajo necesarias",
      value: Math.round(input.hours * 10) / 10,
      unitText: "horas",
    });
  }
  if (input.workdays8h != null) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "Jornadas laborales (8 horas)",
      value: Math.round(input.workdays8h * 10) / 10,
      unitText: "jornadas",
    });
  }
  if (input.monthsFullPay != null) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "Meses de sueldo neto mediano dedicados",
      value: Math.round(input.monthsFullPay * 10) / 10,
      unitText: "meses de nómina",
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.product.name,
    description: `Precio y coste laboral en horas de trabajo de ${input.product.name} en ${input.country.name}.`,
    image: [input.imageUrl],
    offers: {
      "@type": "Offer",
      url: input.canonicalUrl,
      priceCurrency: input.country.currency,
      price: input.price.value,
      priceValidUntil: "2026-12-31",
      availability: "https://schema.org/InStock",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: input.price.value,
        priceCurrency: input.country.currency,
        valueAddedTaxIncluded: true,
      },
    },
    additionalProperty: additionalProperties.length > 0 ? additionalProperties : undefined,
  };
}

/**
 * Genera Schema.org BreadcrumbList.
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Genera Schema.org TechArticle para la metodología.
 */
export function generateMethodArticleSchema(siteUrl: string = "https://precioentiempo.com") {
  const cleanSite = siteUrl.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "Metodología de cálculo: El precio de los bienes medido en horas y jornadas de trabajo",
    description: "Formulación técnica y matemática para convertir importes económicos en unidades de esfuerzo laboral real: salario mediano neto, convención 52/12 y ajuste de horas anuales reales OCDE.",
    url: `${cleanSite}/metodo/`,
    inLanguage: "es-ES",
    datePublished: "2025-01-15T00:00:00Z",
    dateModified: "2026-08-01T00:00:00Z",
    author: {
      "@type": "Organization",
      name: "Precio en tiempo",
      url: cleanSite,
    },
    publisher: {
      "@type": "Organization",
      name: "Precio en tiempo",
      url: cleanSite,
      logo: {
        "@type": "ImageObject",
        url: `${cleanSite}/favicon.svg`,
      },
    },
  };
}

/**
 * Genera Schema.org FAQPage para preguntas frecuentes.
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
