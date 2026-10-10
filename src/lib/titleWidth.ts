/**
 * Ancho real del `<title>` servido, medido en píxeles.
 *
 * Google corta el título por ancho renderizado, no por número de caracteres: un
 * título de 60 caracteres con muchas «i» cabe y otro de 55 con muchas «m» no.
 * Este módulo mide con la tabla de anchos de Liberation Sans Bold 20 px (la
 * fuente métricamente idéntica a Arial Bold que usa Google), en unidades de em,
 * así que el resultado es comparable con el presupuesto de ~600 px que Google
 * muestra antes de recortar.
 *
 * La tabla se generó con FreeType sobre la fuente real; `titleWidth` reproduce
 * exactamente las mismas cifras que medir con la fuente (comprobado).
 */

/** Presupuesto de ancho del título en la página de resultados (Arial Bold 20 px). */
export const MAX_TITLE_PX = 600;

const EM: Record<string, number> =
{
  " ": 0.278, "a": 0.556, "b": 0.611, "c": 0.556, "d": 0.611, "e": 0.556, "f": 0.333, "g": 0.611, "h": 0.611,
  "i": 0.278, "j": 0.278, "k": 0.556, "l": 0.278, "m": 0.889, "n": 0.611, "o": 0.611, "p": 0.611, "q": 0.611,
  "r": 0.389, "s": 0.556, "t": 0.333, "u": 0.611, "v": 0.556, "w": 0.778, "x": 0.556, "y": 0.556, "z": 0.5,
  "A": 0.722, "B": 0.722, "C": 0.722, "D": 0.722, "E": 0.667, "F": 0.611, "G": 0.778, "H": 0.722, "I": 0.278,
  "J": 0.556, "K": 0.722, "L": 0.611, "M": 0.833, "N": 0.722, "O": 0.778, "P": 0.667, "Q": 0.778, "R": 0.722,
  "S": 0.667, "T": 0.611, "U": 0.722, "V": 0.667, "W": 0.944, "X": 0.667, "Y": 0.667, "Z": 0.611, "0": 0.556,
  "1": 0.556, "2": 0.556, "3": 0.556, "4": 0.556, "5": 0.556, "6": 0.556, "7": 0.556, "8": 0.556, "9": 0.556,
  ".": 0.278, ",": 0.278, ";": 0.333, ":": 0.333, "!": 0.333, "?": 0.611, "¡": 0.333, "¿": 0.611, "(": 0.333,
  ")": 0.333, "[": 0.333, "]": 0.333, "{": 0.389, "}": 0.389, "%": 0.889, "&": 0.722, "/": 0.278,
  "\\": 0.278, "|": 0.28, "+": 0.584, "-": 0.333, "*": 0.389, "=": 0.584, "<": 0.584, ">": 0.584, "@": 0.975,
  "#": 0.556, "\"": 0.474, "'": 0.237, "`": 0.333, "´": 0.333, "^": 0.584, "~": 0.584, "_": 0.556,
  "$": 0.556, "€": 0.556, "£": 0.556, "¥": 0.556, "á": 0.556, "é": 0.556, "í": 0.278, "ó": 0.611, "ú": 0.611,
  "ü": 0.611, "ñ": 0.611, "Á": 0.722, "É": 0.667, "Í": 0.278, "Ó": 0.778, "Ú": 0.722, "Ü": 0.722, "Ñ": 0.722,
  "à": 0.556, "è": 0.556, "ì": 0.278, "ò": 0.611, "ù": 0.611, "â": 0.556, "ê": 0.556, "î": 0.278, "ô": 0.611,
  "û": 0.611, "ä": 0.556, "ë": 0.556, "ï": 0.278, "ö": 0.611, "ç": 0.556, "Ç": 0.722, "°": 0.4, "º": 0.366,
  "ª": 0.37, "·": 0.333, "—": 1.0, "–": 0.556, "…": 1.0, "«": 0.556, "»": 0.556
};

const DEFAULT_EM = EM["m"];

/** Ancho en píxeles del texto tal como lo renderiza Google (Arial Bold 20 px). */
export function titleWidth(text: string): number {
  let em = 0;
  for (const ch of text) em += EM[ch] ?? DEFAULT_EM;
  return em * 20;
}

/**
 * Elige el primer titular que quepa en el presupuesto, del más largo al más
 * corto. Si ninguno cabe con el sufijo de marca, se prueba sin él; si aun así
 * no cabe, se recorta por palabra.
 *
 * `heads` va en orden de prioridad (el primero es el más informativo).
 */
export function pickTitle(
  heads: string[],
  suffix = "",
  maxPx: number = MAX_TITLE_PX,
): string {
  const limpios = heads.map((h) => h.trim()).filter((h) => h !== "");
  if (limpios.length === 0) return suffix.trim();

  for (const head of limpios) {
    const conSufijo = suffix ? `${head}${suffix}` : head;
    if (titleWidth(conSufijo) <= maxPx) return conSufijo;
  }
  for (const head of limpios) {
    if (titleWidth(head) <= maxPx) return head;
  }

  // Ni el más corto cabe: se recorta por palabras.
  const base = limpios[limpios.length - 1];
  const palabras = base.split(" ");
  let recorte = "";
  for (const palabra of palabras) {
    const prueba = recorte === "" ? palabra : `${recorte} ${palabra}`;
    if (titleWidth(prueba) > maxPx) break;
    recorte = prueba;
  }
  return recorte === "" ? base.slice(0, 60) : recorte;
}
