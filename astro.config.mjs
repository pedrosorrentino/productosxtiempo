// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  // Dominio pendiente de producción: se fija con SITE_URL al desplegar
  // (og:url y og:image absolutas salen de aquí).
  site: process.env.SITE_URL || 'https://costeentiempo.example',
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [preact()]
});
