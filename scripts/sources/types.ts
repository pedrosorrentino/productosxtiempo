import type { Product } from '../../src/lib/types.ts';

export interface NormalizedPriceUpdate {
  /** ID del producto en products.json (si no existe, se creará) */
  productId: string;
  /** Nombre completo si es un producto nuevo */
  productName?: string;
  /** Nombre corto para chips y ticker si es nuevo */
  shortName?: string;
  /** Categoría obligatoria si es un producto nuevo */
  category?: Product['category'];
  /** Código del país donde se cotiza el precio base (ej: "ES") */
  countryCode: string;
  /** Valor numérico del precio */
  value: number;
  /** Fecha en formato ISO año-mes (ej: "2026-09") */
  date: string;
  /** Nota explicativa o contexto del precio */
  note: string;
  /** Nombre de la fuente oficial (ej: "MITECO (Gobierno de España)") */
  source: string;
  /** Origen del dato */
  origin: 'local';
  /** Si debe mostrarse en la pizarra */
  visible?: boolean;
}

export interface CatalogSourceProvider {
  /** Identificador único del proveedor */
  id: string;
  /** Nombre legible para logs y auditoría */
  name: string;
  /** Descripción breve de qué datos extrae */
  description: string;
  /** Activar o pausar el proveedor */
  enabled: boolean;
  /** Método principal que obtiene y normaliza los precios */
  fetchPrices(): Promise<NormalizedPriceUpdate[]>;
}
