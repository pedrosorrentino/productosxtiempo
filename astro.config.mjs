// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  // Canonical de URLs: SIEMPRE con barra final. Evita que Google indexe
  // versiones duplicadas (/ruta y /ruta/) y que los enlaces internos
  // provoquen redirecciones 308 en cada navegación/rastreo.
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  // Dominio oficial de producción: precioentiempo.com
  site: process.env.SITE_URL || 'https://precioentiempo.com',
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [preact()]
});
