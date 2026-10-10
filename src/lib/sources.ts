/**
 * De dónde sale cada precio.
 *
 * El campo `source` de cada precio trae el nombre de la fuente tal cual lo
 * escribe el proveedor («Numbeo (coste de la vida, colaborativo)», «Eurostat
 * nrg_pc_204 (electricidad doméstica, con impuestos)»…). Antes ese nombre se
 * enseñaba como texto y no enlazaba a ninguna parte: el sitio decía «dato
 * oficial» sin dejar comprobarlo. Aquí se mapea cada fuente a su dirección real
 * para poder enlazarla desde la ficha.
 */

const FUENTES: Array<{ coincide: string; nombre: string; url: string }> = [
  { coincide: 'numbeo', nombre: 'Numbeo · coste de la vida', url: 'https://www.numbeo.com/cost-of-living/' },
  { coincide: 'google shopping', nombre: 'Google Shopping', url: 'https://shopping.google.com/' },
  { coincide: 'apple store', nombre: 'Apple Store', url: 'https://www.apple.com/' },
  { coincide: 'steam', nombre: 'Steam', url: 'https://store.steampowered.com/' },
  { coincide: 'coingecko', nombre: 'CoinGecko', url: 'https://www.coingecko.com/' },
  { coincide: 'cheapshark', nombre: 'CheapShark', url: 'https://www.cheapshark.com/' },
  { coincide: 'big mac', nombre: 'The Economist · Big Mac Index', url: 'https://www.economist.com/big-mac-index' },
  { coincide: 'miteco', nombre: 'MITECO · Geoportal Gasolineras', url: 'https://geoportalgasolineras.es/' },
  { coincide: 'nrg_pc_204', nombre: 'Eurostat · electricidad doméstica (nrg_pc_204)', url: 'https://ec.europa.eu/eurostat/databrowser/view/nrg_pc_204/' },
  { coincide: 'nrg_pc_202', nombre: 'Eurostat · gas natural doméstico (nrg_pc_202)', url: 'https://ec.europa.eu/eurostat/databrowser/view/nrg_pc_202/' },
  { coincide: 'eurostat', nombre: 'Eurostat', url: 'https://ec.europa.eu/eurostat' },
  { coincide: 'ine', nombre: 'INE (España)', url: 'https://www.ine.es/' },
  { coincide: 'banco mundial', nombre: 'Banco Mundial · datos abiertos', url: 'https://data.worldbank.org/' },
  { coincide: 'mercadona', nombre: 'Mercadona', url: 'https://tienda.mercadona.es/' },
  { coincide: 'open food facts', nombre: 'Open Food Facts Prices', url: 'https://prices.openfoodfacts.org/' },
  { coincide: 'falabella', nombre: 'Falabella Chile', url: 'https://www.falabella.com/' },
  { coincide: 'liverpool', nombre: 'Liverpool México', url: 'https://www.liverpool.com.mx/' },
  { coincide: 'mercadolibre', nombre: 'MercadoLibre', url: 'https://www.mercadolibre.com/' },
  { coincide: 'anfac', nombre: 'ANFAC', url: 'https://anfac.com/' },
  { coincide: 'jato', nombre: 'JATO Dynamics', url: 'https://www.jato.com/' },
  { coincide: 'netflix', nombre: 'Netflix', url: 'https://help.netflix.com/es/node/24926' },
  { coincide: 'spotify', nombre: 'Spotify', url: 'https://www.spotify.com/premium/' },
  { coincide: 'openai', nombre: 'OpenAI · ChatGPT', url: 'https://openai.com/chatgpt/pricing/' },
  { coincide: 'amazon', nombre: 'Amazon Prime', url: 'https://www.amazon.es/prime' },
];

/** Devuelve la fuente enlazable de un precio, o null si no está en el mapa. */
export function sourceLink(source: string | undefined | null): { nombre: string; url: string } | null {
  if (!source) return null;
  const s = source.toLowerCase();
  for (const f of FUENTES) {
    if (s.includes(f.coincide)) return { nombre: f.nombre, url: f.url };
  }
  return null;
}
