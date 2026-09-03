# Guía de Sincronización Automática de Catálogo

Este sistema permite mantener el catálogo de **Coste en Tiempo** en constante actualización desde diversas APIs públicas, fuentes oficiales y listas de datos sin coste alguno y con despliegue automático en Cloudflare Pages.

---

## 1. Arquitectura del Sistema

El sincronizador se compone de tres piezas clave:

1. **Proveedores Modulares (`scripts/sources/`):** Cada fuente de datos externa es un módulo independiente que implementa la interfaz `CatalogSourceProvider`.
2. **Orquestador Central (`scripts/sync-catalog.ts`):** Consulta todos los proveedores en paralelo con `Promise.allSettled`, aplica límites de tiempo y actualiza `src/data/products.json` recalculando las divisas internacionales (Frankfurter/BCE) de forma automática.
3. **Automatización GitHub Actions (`.github/workflows/update-catalog.yml`):** Un robot programado que corre semanalmente o bajo demanda, actualiza el catálogo y hace commit a `master`, activando el redespliegue en Cloudflare Pages.

---

## 2. Cómo Añadir una Nueva Fuente o API en 5 Minutos

Para conectar una nueva API pública o scraper, sigue estos 2 sencillos pasos:

### Paso 1: Crear el archivo del proveedor en `scripts/sources/`

Crea un archivo nuevo, por ejemplo `scripts/sources/mi-api.ts`:

```typescript
import type { CatalogSourceProvider, NormalizedPriceUpdate } from './types.ts';

export const miApiProvider: CatalogSourceProvider = {
  id: 'mi-proveedor',
  name: 'Nombre de la Fuente',
  description: 'Extrae precios de X producto a través de su API pública.',
  enabled: true,

  async fetchPrices(): Promise<NormalizedPriceUpdate[]> {
    // 1. Consulta la API con timeout para evitar cuelgues
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch('https://api.ejemplo.com/precios', {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const date = new Date().toISOString().slice(0, 7);

      // 2. Devuelve los precios normalizados
      return [
        {
          productId: 'mi-producto-id', // ID en products.json (o nuevo)
          productName: 'Nombre del Producto',
          shortName: 'Producto',
          category: 'tecnologia', // 'vivienda' | 'transporte' | 'tecnologia' | 'dia-a-dia' | 'vida'
          countryCode: 'ES',
          value: Number(data.precio),
          date,
          note: 'Precio oficial extraído automáticamente.',
          source: 'Nombre de la Fuente Oficial',
          origin: 'local',
          visible: true,
        },
      ];
    } finally {
      clearTimeout(timeout);
    }
  },
};
```

### Paso 2: Registrarlo en `scripts/sources/index.ts`

Importa tu proveedor y añádelo al array `CATALOG_PROVIDERS`:

```typescript
import { miApiProvider } from './mi-api.ts';

export const CATALOG_PROVIDERS: CatalogSourceProvider[] = [
  mitecoFuelProvider,
  cheapsharkGamingProvider,
  supermarketStaplesProvider,
  manualQueueProvider,
  miApiProvider, // <-- Añadir aquí
];
```

¡Listo! La próxima vez que corra `pnpm sync-catalog` (o el cron de GitHub Actions), el nuevo proveedor se ejecutará en paralelo y sus precios se propagarán a todos los países.

---

## 3. Añadir Nuevos Productos sin Tocar Código (Cola Manual)

Si quieres incorporar nuevos productos rápidamente sin programar un proveedor:

1. Abre el archivo `scripts/data/incoming-products.json`.
2. Añade los objetos que desees:

```json
[
  {
    "productId": "nintendo-switch-2",
    "productName": "Nintendo Switch 2",
    "shortName": "Switch 2",
    "category": "tecnologia",
    "countryCode": "ES",
    "value": 449,
    "note": "Precio estimado de lanzamiento.",
    "source": "Nintendo Store",
    "visible": true
  }
]
```

3. Ejecuta `pnpm sync-catalog`. El producto se creará, se calcularán sus monedas para los 11 países y se publicará en el catálogo.

---

## 4. Ejecución y Comandos

* **Sincronizar manualmente:**
  ```bash
  pnpm sync-catalog
  ```
* **Comprobar catálogo:**
  ```bash
  pnpm test
  ```
* **Ejecutar en la nube:**
  Ve a la pestaña **Actions** en tu repositorio de GitHub, selecciona el workflow **"Sincronización Automática de Catálogo"** y pulsa en **"Run workflow"**.
