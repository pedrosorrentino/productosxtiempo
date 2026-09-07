import type { CatalogSourceProvider, NormalizedPriceUpdate } from './types.ts';

interface ServiceItemConfig {
  productId: string;
  productName: string;
  shortName: string;
  category: 'dia-a-dia' | 'tecnologia' | 'transporte' | 'vivienda' | 'vida';
  value: number;
  note: string;
  source: string;
}

const CURATED_ITEMS: ServiceItemConfig[] = [
  // Tecnología y Suscripciones Digitales
  {
    productId: 'chatgpt-plus',
    productName: 'ChatGPT Plus (suscripción 1 año)',
    shortName: 'ChatGPT Plus (año)',
    category: 'tecnologia',
    value: 240.0,
    note: 'Suscripción anual a ChatGPT Plus (tarifa oficial de 20 $/mes + impuestos).',
    source: 'OpenAI (Tarifa Oficial)',
  },
  {
    productId: 'spotify-anual',
    productName: 'Spotify Premium (suscripción 1 año)',
    shortName: 'Spotify (año)',
    category: 'tecnologia',
    value: 131.88,
    note: 'Plan individual de Spotify Premium (10,99 €/mes prorrateado en 12 meses).',
    source: 'Spotify (Tarifa Oficial)',
  },
  {
    productId: 'amazon-prime',
    productName: 'Amazon Prime (suscripción anual)',
    shortName: 'Amazon Prime (año)',
    category: 'tecnologia',
    value: 49.9,
    note: 'Cuota anual del servicio de suscripción y envíos Amazon Prime España.',
    source: 'Amazon (Tarifa Oficial)',
  },

  // Transporte y Movilidad
  {
    productId: 'carnet-conducir',
    productName: 'Carnet de conducir B (autoescuela completa)',
    shortName: 'Carnet de conducir',
    category: 'transporte',
    value: 950.0,
    note: 'Coste medio de obtención del permiso B (matrícula, clases prácticas y tasas DGT).',
    source: 'DGT / Estudio de precios FACUA',
  },
  {
    productId: 'itv-turismo',
    productName: 'ITV de turismo (inspección periódica oficial)',
    shortName: 'Inspección ITV',
    category: 'transporte',
    value: 48.0,
    note: 'Tarifa media oficial de inspección técnica periódica para turismos.',
    source: 'Tarifas Oficiales Autonómicas de ITV',
  },

  // Vivienda y Climatización
  {
    productId: 'placas-solares',
    productName: 'Instalación solar fotovoltaica (4 kW autoconsumo)',
    shortName: 'Placas solares (4 kW)',
    category: 'vivienda',
    value: 4600.0,
    note: 'Instalación residencial estándar llave en mano de 4 kW para autoconsumo doméstico.',
    source: 'IDAE / Unión Española Fotovoltaica',
  },
  {
    productId: 'aire-acondicionado',
    productName: 'Aire acondicionado split con instalación',
    shortName: 'Aire acondicionado',
    category: 'vivienda',
    value: 950.0,
    note: 'Equipo de climatización tipo split de 3.000 frigorías con instalación autorizada RITE.',
    source: 'Tarifas Medias de Climatización Residencial',
  },
  {
    productId: 'fianza-alquiler',
    productName: 'Fianza legal de alquiler (2 meses)',
    shortName: 'Fianza de alquiler',
    category: 'vivienda',
    value: 1800.0,
    note: 'Fianza legal exigida de dos mensualidades según la Ley de Arrendamientos Urbanos (LAU).',
    source: 'Ley de Arrendamientos Urbanos (LAU)',
  },

  // Vida, Salud y Bienestar
  {
    productId: 'sesion-psicologo',
    productName: 'Sesión de psicólogo privado (1 hora)',
    shortName: 'Sesión de psicólogo',
    category: 'vida',
    value: 60.0,
    note: 'Tarifa media de consulta clínica individual de psicología sanitaria privada.',
    source: 'Consejo General de la Psicología',
  },
  {
    productId: 'ortodoncia-invisible',
    productName: 'Tratamiento de ortodoncia invisible',
    shortName: 'Ortodoncia invisible',
    category: 'vida',
    value: 3400.0,
    note: 'Tratamiento correctivo completo mediante alineadores transparentes (18-24 meses).',
    source: 'Consejo General de Dentistas de España',
  },
  {
    productId: 'gafas-graduadas',
    productName: 'Gafas graduadas completas (montura + cristales)',
    shortName: 'Gafas graduadas',
    category: 'vida',
    value: 210.0,
    note: 'Montura graduada con cristales orgánicos antirreflejantes de gama media.',
    source: 'FEDAO (Federación Española de Óptica)',
  },
  {
    productId: 'guarderia-mes',
    productName: 'Guardería privada mensual (0 a 3 años)',
    shortName: 'Guardería (mes)',
    category: 'vida',
    value: 410.0,
    note: 'Mensualidad media en escuela infantil privada para el primer ciclo de educación infantil.',
    source: 'Gasto Medio en Educación Infantil (INE)',
  },
  {
    productId: 'seguro-salud',
    productName: 'Seguro médico privado individual (año)',
    shortName: 'Seguro médico (año)',
    category: 'vida',
    value: 650.0,
    note: 'Póliza médica privada individual completa sin copago para un adulto.',
    source: 'UNESPA (Asociación Empresarial del Seguro)',
  },
];

export const curatedServicesProvider: CatalogSourceProvider = {
  id: 'curated-social-services',
  name: 'Servicios de Referencia Social y Decisiones Vitales',
  description:
    'Provee precios oficiales de mercado contrastados para gastos ineludibles y servicios de alta búsqueda (salud, educación, carnets, streaming).',
  enabled: true,

  async fetchPrices(): Promise<NormalizedPriceUpdate[]> {
    const date = new Date().toISOString().slice(0, 7);

    return CURATED_ITEMS.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      shortName: item.shortName,
      category: item.category,
      countryCode: 'ES',
      value: item.value,
      date,
      note: item.note,
      source: item.source,
      origin: 'local',
      visible: true,
    }));
  },
};
