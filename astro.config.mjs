// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  // Dominio oficial de producción: precioentiempo.com
  site: process.env.SITE_URL || 'https://precioentiempo.com',
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [preact()]
});
