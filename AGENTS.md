## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Datos y precios

El catálogo real por país se sincroniza con `pnpm sync-catalog` (proveedores en `scripts/sources/`). Nunca editar `src/data/products.json` a mano si puede venir de un proveedor.

- `SERPAPI_KEY` vive en `.env` (gitignored); sin ella, SerpApi se salta y no gasta cuota. Control: `SERPAPI_MAX_CALLS`, `SERPAPI_RESERVE`.
- Cachés en `scripts/data/` (SerpApi, Numbeo) y precios manuales en `curated-prices.json`.
- Detalle de fuentes, presupuestos y cómo añadir proveedores: `docs/fuentes-y-catalogo.md`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
