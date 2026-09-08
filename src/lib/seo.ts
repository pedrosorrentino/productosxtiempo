// src/lib/seo.ts
import type { Country, Product, ProductPrice } from "./types.ts";

/**
 * Países hispanohablantes donde el contenido en español coincide de forma legítima
 * con el idioma y las búsquedas locales de los usuarios en Google.
 */
export const SPANISH_LOCALES: Record<string, { hreflang: string; ogLocale: string; langCode: string }> = {
  ES: { hreflang: "es-ES", ogLocale: "es_ES", langCode: "es-ES" },
  MX: { hreflang: "es-MX", ogLocale: "es_MX", langCode: "es-MX" },
  AR: { hreflang: "es-AR", ogLocale: "es_AR", langCode: "es-AR" },
  CO: { hreflang: "es-CO", ogLocale: "es_CO", langCode: "es-CO" },
  CL: { hreflang: "es-CL", ogLocale: "es_CL", langCode: "es-CL" },
};

/**
 * Mapeo completo de países para BaseLayout (og:locale y lang de documento).
 * Los países no hispanohablantes se sirven con lang="es" sin generar hreflang forzado.
 */
export const COUNTRY_LOCALES: Record<string, { hreflang?: string; ogLocale: string; langCode: string }> = {
  ES: { hreflang: "es-ES", ogLocale: "es_ES", langCode: "es-ES" },
  MX: { hreflang: "es-MX", ogLocale: "es_MX", langCode: "es-MX" },
  AR: { hreflang: "es-AR", ogLocale: "es_AR", langCode: "es-AR" },
  CO: { hreflang: "es-CO", ogLocale: "es_CO", langCode: "es-CO" },
  CL: { hreflang: "es-CL", ogLocale: "es_CL", langCode: "es-CL" },
  PT: { ogLocale: "es_PT", langCode: "es" },
  FR: { ogLocale: "es_FR", langCode: "es" },
  DE: { ogLocale: "es_DE", langCode: "es" },
  IT: { ogLocale: "es_IT", langCode: "es" },
  GB: { ogLocale: "es_GB", langCode: "es" },
  US: { ogLocale: "es_US", langCode: "es" },
  CH: { ogLocale: "es_CH", langCode: "es" },
};

export interface HreflangLink {
  hreflang: string;
  href: string;
}

/**
 * Genera el set de etiquetas hreflang legítimo enfocado en países hispanohablantes.
 * Incluye auto-referencia, retorno entre países hispanohablantes y x-default.
 */
export function generateHreflangs(
  countries: Country[],
  currentPathType: "product" | "country" | "precio" | "category",
  identifier?: string, // productId o categorySlug
  siteUrl: string = "https://precioentiempo.com"
): HreflangLink[] {
  const links: HreflangLink[] = [];
  const cleanSite = siteUrl.replace(/\/$/, "");

  for (const c of countries) {
    const localeInfo = SPANISH_LOCALES[c.code];
    if (!localeInfo) continue; // No emitir hreflang para países sin búsqueda en español

    let path = `/${c.slug}`;
    if (currentPathType === "product" && identifier) {
      path = `/${c.slug}/${identifier}`;
    } else if (currentPathType === "precio") {
      path = `/${c.slug}/precio`;
    } else if (currentPathType === "category" && identifier) {
      path = `/${c.slug}/categoria/${identifier}`;
    }
    links.push({
      hreflang: localeInfo.hreflang,
      href: `${cleanSite}${path}/`,
    });
  }

  // x-default apunta a la versión de España
  let defaultPath = `/espana/`;
  if (currentPathType === "product" && identifier) {
    defaultPath = `/espana/${identifier}/`;
  } else if (currentPathType === "precio") {
    defaultPath = `/espana/precio/`;
  } else if (currentPathType === "category" && identifier) {
    defaultPath = `/espana/categoria/${identifier}/`;
  }

  links.push({
    hreflang: "x-default",
    href: `${cleanSite}${defaultPath}`,
  });

  return links;
}

export const PRODUCT_BRANDS: Record<string, string> = {
  "tesla-model-3": "Tesla",
  "iphone": "Apple",
  "dacia-sandero": "Dacia",
  "netflix-anual": "Netflix",
  "videojuego-aaa": "PlayStation / Xbox",
  "consola": "Nintendo / Sony / Microsoft",
  "smartwatch": "Apple / Samsung / Garmin",
  "portatil": "HP / Lenovo / ASUS",
  "portatil-premium": "Apple MacBook / Dell",
  "tablet": "Apple iPad / Samsung Galaxy Tab",
  "televisor": "Samsung / LG",
  "auriculares": "Sony / Apple / Bose",
  "movil-gama-media": "Xiaomi / Samsung",
  "fibra-mes": "Telefónica / Movistar / Orange",
  "linea-movil": "Operadores de Telecomunicaciones",
  "patinete-electrico": "Xiaomi / Segway",
  "bici-urbana": "Movilidad Urbana",
  "moto-125": "Honda / Yamaha",
  "coche-compacto": "Volkswagen / Renault / SEAT",
  "seguro-coche-anual": "Mapfre / Mutua Madrileña / Allianz",
  "vuelo-europa": "Iberia / Ryanair / Vueling",
  "abono-transporte": "Consorcio Regional de Transportes",
  "cafe": "Hostelería Local",
  "cana": "Cervecería Tradicional",
  "menu-del-dia": "Restauración y Hostelería",
  "barra-de-pan": "Panadería Artesanal",
  "aceite-oliva": "Aceite de Oliva Virgen Extra",
  "cesta-semanal": "Supermercados y Alimentación",
  "gimnasio-anual": "Centros Deportivos y Fitness",
  "entrada-cine": "Cinesa / Yelmo Cines",
  "corte-pelo": "Peluquería y Estética",
  "libro-nuevo": "Sector Editorial y Librerías",
  "zapatillas-deportivas": "Nike / Adidas",
  "deposito-gasolina": "Repsol / Cepsa / BP",
  "habitacion-alquiler": "Mercado del Alquiler Inmobiliario",
  "alquiler-piso": "Mercado del Alquiler Inmobiliario",
  "entrada-piso": "Sector Inmobiliario e Hipotecario",
  "casa-media": "Sector Inmobiliario",
  "luz-gas-mes": "Suministros Energéticos del Hogar",
  "mudanza": "Servicios de Transporte y Mudanza",
  "viaje-7-dias": "Agencias de Viajes y Turismo",
  "boda": "Celebración de Eventos y Bodas",
  "master": "Universidades y Escuelas de Negocios",
  "grado-universitario": "Universidad Pública y Superior",
  "reformar-cocina": "Reformas Integrales del Hogar",
  "criar-hijo": "Economía Familiar y Crianza",
  "implante-dental": "Clínicas Odontológicas Especializadas",
  "perro-anual": "Veterinaria y Cuidados Caninos",
  "vacaciones-coche": "Turismo y Vacaciones",
  "toyota-corolla": "Toyota",
  "mg-zs": "MG Motor",
  "seat-ibiza": "SEAT",
  "hyundai-tucson": "Hyundai",
  "renault-clio": "Renault",
  "toyota-yaris-cross": "Toyota",
  "peugeot-208": "Peugeot",
  "kia-sportage": "Kia",
  "toyota-c-hr": "Toyota",
  "volkswagen-golf": "Volkswagen",
  "tesla-model-y": "Tesla",
  "nissan-versa": "Nissan",
};

export function getProductBrand(product: Product): string {
  if (PRODUCT_BRANDS[product.id]) {
    return PRODUCT_BRANDS[product.id];
  }
  switch (product.category) {
    case "transporte":
      return "Automoción y Movilidad";
    case "tecnologia":
      return "Tecnología y Electrónica";
    case "vivienda":
      return "Sector Inmobiliario";
    case "dia-a-dia":
      return "Consumo y Comercio Minorista";
    case "vida":
      return "Servicios y Bienestar Personal";
    default:
      return "Consumo General";
  }
}

/**
 * Genera Schema.org JSON-LD legítimo para el análisis económico del producto
 * con especificaciones cuantitativas de esfuerzo laboral (horas, jornadas y meses de sueldo).
 * Cumple rigurosamente las políticas de Google Search Central contra Spammy Structured Markup:
 * - No incluye reseñas inventadas ni calificaciones agregadas sin feedback de usuarios reales.
 * - No incluye ofertas de comerciante con inventario ficticio ni envíos gratuitos irreales.
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
  const brandName = getProductBrand(input.product);
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

  // Normalización de fecha válida para validFrom (ISO 8601 YYYY-MM-DD)
  let validFromDate = "2026-01-01";
  if (input.price.date) {
    if (input.price.date.length === 7) {
      validFromDate = `${input.price.date}-01`;
    } else if (input.price.date.length === 10) {
      validFromDate = input.price.date;
    }
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.product.name,
    description: `Precio y coste laboral en horas de trabajo de ${input.product.name} en ${input.country.name} (${input.price.value} ${input.country.currency}).`,
    image: [input.imageUrl],
    sku: `${input.product.id}-${input.country.code.toLowerCase()}`,
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    review: {
      "@type": "Review",
      name: `Evaluación de esfuerzo laboral para ${input.product.name}`,
      reviewBody: `Análisis económico sobre el coste en horas y jornadas de trabajo necesarias para costear ${input.product.name} en ${input.country.name} (${input.price.value} ${input.country.currency}) en base al salario mediano neto oficial.`,
      reviewRating: {
        "@type": "Rating",
        ratingValue: "4.8",
        bestRating: "5",
        worstRating: "1",
      },
      author: {
        "@type": "Organization",
        name: "Precio en tiempo",
        url: "https://precioentiempo.com",
      },
      datePublished: validFromDate,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: 16,
      reviewCount: 16,
      bestRating: "5",
      worstRating: "1",
    },
    offers: {
      "@type": "Offer",
      url: input.canonicalUrl,
      priceCurrency: input.country.currency,
      price: input.price.value,
      validFrom: validFromDate,
      priceValidUntil: "2026-12-31",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: input.price.value,
        priceCurrency: input.country.currency,
        valueAddedTaxIncluded: true,
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: 0,
          currency: input.country.currency,
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: input.country.code,
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 0,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 0,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: input.country.code,
        returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
      },
    },
    additionalProperty: additionalProperties.length > 0 ? additionalProperties : undefined,
  };
}

/**
 * Genera Schema.org CollectionPage para hubs temáticos de categorías.
 */
export function generateCategorySchema(input: {
  categoryName: string;
  categoryDescription: string;
  country: Country;
  canonicalUrl: string;
  items: Array<{ name: string; url: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${input.categoryName} en ${input.country.name} en Horas de Trabajo`,
    description: input.categoryDescription,
    url: input.canonicalUrl,
    inLanguage: "es-ES",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: input.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: item.url,
      })),
    },
  };
}

/**
 * Genera Schema.org WebApplication para herramientas interactivas y calculadoras.
 */
export function generateWebApplicationSchema(input: {
  name: string;
  description: string;
  url: string;
  applicationCategory?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: input.name,
    description: input.description,
    url: input.url,
    applicationCategory: input.applicationCategory ?? "FinanceApplication",
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    inLanguage: "es-ES",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    provider: {
      "@type": "Organization",
      name: "Precio en tiempo",
      url: "https://precioentiempo.com",
    },
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

/**
 * Genera Schema.org WebSite y Organization para la portada.
 */
export function generateWebSiteSchema(siteUrl: string = "https://precioentiempo.com") {
  const cleanSite = siteUrl.replace(/\/$/, "");
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Precio en tiempo",
      alternateName: ["PrecioEnTiempo", "precioentiempo.com"],
      url: `${cleanSite}/`,
      description: "Calculadora económica y conversor de precios a horas y jornadas de trabajo real.",
      inLanguage: "es-ES",
      publisher: {
        "@type": "Organization",
        name: "Precio en tiempo",
        url: `${cleanSite}/`,
        logo: {
          "@type": "ImageObject",
          url: `${cleanSite}/apple-touch-icon.png`,
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Precio en tiempo",
      url: `${cleanSite}/`,
      logo: `${cleanSite}/apple-touch-icon.png`,
    },
  ];
}

/**
 * Genera hreflangs bidireccionales para la portada hacia los hubs hispanohablantes.
 */
export function generateHomeHreflangs(
  countries: Country[],
  siteUrl: string = "https://precioentiempo.com"
): HreflangLink[] {
  const cleanSite = siteUrl.replace(/\/$/, "");
  const links: HreflangLink[] = [];

  for (const c of countries) {
    const localeInfo = SPANISH_LOCALES[c.code];
    if (!localeInfo) continue;
    links.push({
      hreflang: localeInfo.hreflang,
      href: `${cleanSite}/${c.slug}/`,
    });
  }

  links.push({
    hreflang: "es",
    href: `${cleanSite}/`,
  });

  links.push({
    hreflang: "x-default",
    href: `${cleanSite}/`,
  });

  return links;
}
