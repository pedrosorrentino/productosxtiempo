import type { CatalogSourceProvider, NormalizedPriceUpdate } from './types.ts';

interface CarConfig {
  productId: string;
  productName: string;
  shortName: string;
  category: 'transporte';
  value: number;
  note: string;
  source: string;
}

/**
 * Los coches más vendidos del mercado según datos oficiales de matriculaciones
 * de ANFAC (Asociación Española de Fabricantes de Automóviles y Camiones),
 * JATO Dynamics y patronales de automoción.
 */
const TOP_SELLING_CARS: CarConfig[] = [
  {
    productId: 'toyota-corolla',
    productName: 'Toyota Corolla Híbrido 140H',
    shortName: 'Toyota Corolla',
    category: 'transporte',
    value: 26000.0,
    note: 'PVP oficial recomendado para el compacto híbrido más vendido del mundo (versión 140H Active Plus). Edítalo.',
    source: 'Toyota España / ANFAC',
  },
  {
    productId: 'mg-zs',
    productName: 'MG ZS 1.5 VTi-tech (SUV)',
    shortName: 'MG ZS',
    category: 'transporte',
    value: 17890.0,
    note: 'PVP del SUV compacto low-cost revelación de ventas en España (acabado Comfort). Edítalo.',
    source: 'MG Motor España / ANFAC',
  },
  {
    productId: 'seat-ibiza',
    productName: 'SEAT Ibiza 1.0 TSI',
    shortName: 'SEAT Ibiza',
    category: 'transporte',
    value: 15450.0,
    note: 'PVP orientativo del utilitario histórico superventas en España (motor 1.0 TSI 95 CV). Edítalo.',
    source: 'SEAT España / ANFAC',
  },
  {
    productId: 'hyundai-tucson',
    productName: 'Hyundai Tucson 1.6 TGDI (SUV)',
    shortName: 'Hyundai Tucson',
    category: 'transporte',
    value: 28400.0,
    note: 'PVP de partida del SUV familiar líder de matriculaciones en España (acabado Klass). Edítalo.',
    source: 'Hyundai España / ANFAC',
  },
  {
    productId: 'renault-clio',
    productName: 'Renault Clio TCe 90',
    shortName: 'Renault Clio',
    category: 'transporte',
    value: 16900.0,
    note: 'PVP oficial del utilitario superventas europeo (acabado Evolution 90 CV). Edítalo.',
    source: 'Renault España / ANFAC',
  },
  {
    productId: 'toyota-yaris-cross',
    productName: 'Toyota Yaris Cross 120H (B-SUV)',
    shortName: 'Yaris Cross',
    category: 'transporte',
    value: 24500.0,
    note: 'PVP del crossover urbano híbrido más vendido en España (acabado Active Plus). Edítalo.',
    source: 'Toyota España / ANFAC',
  },
  {
    productId: 'peugeot-208',
    productName: 'Peugeot 208 PureTech 100',
    shortName: 'Peugeot 208',
    category: 'transporte',
    value: 18300.0,
    note: 'PVP oficial del utilitario líder de ventas en Europa (acabado Active). Edítalo.',
    source: 'Peugeot España / JATO Dynamics',
  },
  {
    productId: 'kia-sportage',
    productName: 'Kia Sportage 1.6 T-GDi (SUV)',
    shortName: 'Kia Sportage',
    category: 'transporte',
    value: 29200.0,
    note: 'PVP de partida del SUV familiar superventas de Kia (acabado Concept). Edítalo.',
    source: 'Kia España / ANFAC',
  },
  {
    productId: 'toyota-c-hr',
    productName: 'Toyota C-HR 140H (SUV Coupé)',
    shortName: 'Toyota C-HR',
    category: 'transporte',
    value: 31750.0,
    note: 'PVP oficial del SUV híbrido coupé superventas (acabado Active). Edítalo.',
    source: 'Toyota España / ANFAC',
  },
  {
    productId: 'volkswagen-golf',
    productName: 'Volkswagen Golf 1.5 TSI',
    shortName: 'VW Golf',
    category: 'transporte',
    value: 31500.0,
    note: 'PVP oficial del compacto de referencia europeo (motor 1.5 TSI 115 CV). Edítalo.',
    source: 'Volkswagen España / KBA',
  },
  {
    productId: 'tesla-model-y',
    productName: 'Tesla Model Y Tracción Trasera',
    shortName: 'Tesla Model Y',
    category: 'transporte',
    value: 44490.0,
    note: 'PVP oficial del vehículo eléctrico y SUV más vendido del mundo (versión estándar RWD sin ayudas). Edítalo.',
    source: 'Tesla España / JATO Dynamics',
  },
  {
    productId: 'nissan-versa',
    productName: 'Nissan Versa Sense',
    shortName: 'Nissan Versa',
    category: 'transporte',
    value: 16500.0,
    note: 'PVP de referencia del sedán subcompacto más vendido en México y Latinoamérica. Edítalo.',
    source: 'AMDA / Nissan México',
  },
];

export const automotiveProvider: CatalogSourceProvider = {
  id: 'automotive-top-sellers',
  name: 'ANFAC / JATO Dynamics · Coches Más Vendidos',
  description: 'Precios de referencia oficiales de los turismos y SUVs líderes de ventas en el mercado',
  enabled: true,

  async fetchPrices(): Promise<NormalizedPriceUpdate[]> {
    const today = new Date().toISOString().slice(0, 7); // YYYY-MM
    const updates: NormalizedPriceUpdate[] = [];

    for (const car of TOP_SELLING_CARS) {
      updates.push({
        productId: car.productId,
        productName: car.productName,
        shortName: car.shortName,
        category: car.category,
        countryCode: 'ES',
        value: car.value,
        source: car.source,
        date: today,
        note: car.note,
        origin: 'local',
        visible: true,
      });
    }

    return updates;
  },
};
