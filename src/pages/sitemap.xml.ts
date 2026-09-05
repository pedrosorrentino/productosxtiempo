// src/pages/sitemap.xml.ts
import type { APIRoute } from 'astro';
import countriesData from '../data/countries.json';
import productsData from '../data/products.json';
import type { Country, Product } from '../lib/types.ts';
import { getProductPrice } from '../lib/selectors.ts';

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = (site ? site.href : "https://precioentiempo.com").replace(/\/$/, "");
  const countries = countriesData as Country[];
  const products = productsData as Product[];
  const today = new Date().toISOString().split('T')[0];

  const urls: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }> = [];

  // 1. Portada y Método
  urls.push({ loc: `${baseUrl}/`, lastmod: today, changefreq: 'daily', priority: '1.0' });
  urls.push({ loc: `${baseUrl}/metodo/`, lastmod: '2026-08-01', changefreq: 'monthly', priority: '0.8' });

  // 2. Hubs por País y Calculadoras de Precio
  for (const country of countries) {
    urls.push({ loc: `${baseUrl}/${country.slug}/`, lastmod: today, changefreq: 'weekly', priority: '0.9' });
    urls.push({ loc: `${baseUrl}/${country.slug}/precio/`, lastmod: '2026-08-01', changefreq: 'monthly', priority: '0.7' });
  }

  // 3. Fichas de Producto Programáticas
  for (const country of countries) {
    // Excluir países sin sueldo mediano (AR, CO) para mantener sitemap limpio de noindex
    if (country.medianNetMonthly == null) continue;

    for (const product of products) {
      if (!product.visible) continue;
      const price = getProductPrice(product, country.code);
      if (!price) continue;

      urls.push({
        loc: `${baseUrl}/${country.slug}/${product.id}/`,
        lastmod: price.date ? `${price.date}-01` : today,
        changefreq: 'monthly',
        priority: '0.8',
      });
    }
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
