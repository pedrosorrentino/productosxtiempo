// src/pages/sitemap.xml.ts
import type { APIRoute } from 'astro';
import countriesData from '../data/countries.json';
import productsData from '../data/products.json';
import type { Country, Product } from '../lib/types.ts';
import { getProductPrice } from '../lib/selectors.ts';

const CATEGORIES: Product['category'][] = [
  'transporte',
  'tecnologia',
  'vivienda',
  'dia-a-dia',
  'vida',
];

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = (site ? site.href : "https://precioentiempo.com").replace(/\/$/, "");
  const countries = countriesData as Country[];
  const products = productsData as Product[];
  const today = new Date().toISOString().split('T')[0];

  const urls: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }> = [];

  // 1. Portada, Método y Páginas Legales / E-E-A-T
  urls.push({ loc: `${baseUrl}/`, lastmod: today, changefreq: 'daily', priority: '1.0' });
  urls.push({ loc: `${baseUrl}/metodo/`, lastmod: '2026-08-01', changefreq: 'monthly', priority: '0.8' });
  urls.push({ loc: `${baseUrl}/sobre-el-proyecto/`, lastmod: '2026-09-01', changefreq: 'monthly', priority: '0.7' });
  urls.push({ loc: `${baseUrl}/contacto/`, lastmod: '2026-09-01', changefreq: 'monthly', priority: '0.6' });
  urls.push({ loc: `${baseUrl}/aviso-legal/`, lastmod: '2026-09-01', changefreq: 'yearly', priority: '0.4' });
  urls.push({ loc: `${baseUrl}/privacidad/`, lastmod: '2026-09-01', changefreq: 'yearly', priority: '0.4' });
  urls.push({ loc: `${baseUrl}/cookies/`, lastmod: '2026-09-01', changefreq: 'yearly', priority: '0.4' });

  // 2. Hubs por País y Calculadoras de Precio
  for (const country of countries) {
    urls.push({ loc: `${baseUrl}/${country.slug}/`, lastmod: today, changefreq: 'weekly', priority: '0.9' });
    urls.push({ loc: `${baseUrl}/${country.slug}/precio/`, lastmod: '2026-09-01', changefreq: 'monthly', priority: '0.7' });

    // 3. Hubs de Categoría por País
    for (const cat of CATEGORIES) {
      urls.push({
        loc: `${baseUrl}/${country.slug}/categoria/${cat}/`,
        lastmod: today,
        changefreq: 'weekly',
        priority: '0.8',
      });
    }
  }

  // 4. Fichas de Producto Programáticas
  for (const country of countries) {
    // CO y AR no publican mediano neto, pero sí un SMI de referencia: sus
    // fichas de producto se indexan y entran al sitemap.
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
