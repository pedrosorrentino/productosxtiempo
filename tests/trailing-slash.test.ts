import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SRC_DIR = fileURLToPath(new URL("../src", import.meta.url));

const EXTENSIONS = /\.(astro|tsx)$/;

/**
 * Captura URLs internas escritas como literal en atributos de enlace,
 * navegaciones de JS y URLs compartibles:
 *   href="/ruta"           href={`/ruta`}
 *   location.href = `/ruta`
 *   url={`/ruta`}          buildShareUrl(`/ruta`)
 */
const LINK_RE =
  /(?:href\s*=\s*(?:"([^"]*)"|\{`([^`]*)`\})|location\.href\s*=\s*`([^`]*)`|url\s*=\s*\{`([^`]*)`\}|buildShareUrl\(\s*`([^`]*)`)/g;

const ASSET_RE = /\.[a-z0-9]+$/i;

/**
 * Devuelve true si la ruta interna NO cumple el canónico con barra final.
 * Se ignoran enlaces externos, anclas, assets con extensión y la raíz.
 */
export function isNonCanonicalLink(raw: string | null | undefined): boolean {
  if (raw == null) return false;
  if (/^(https?:|mailto:|tel:|#|\/\/)/.test(raw)) return false;

  // `??` (nullish) y `?.` no son separadores de query.
  const normalized = raw.replace(/\?\?/g, "@@").replace(/\?\./g, "@.");
  const path = normalized.split(/[?#]/)[0];
  if (path === "" || path === "/") return false;
  if (ASSET_RE.test(path)) return false;

  return !path.endsWith("/");
}

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else if (EXTENSIONS.test(full)) files.push(full);
  }
  return files;
}

function findNonCanonicalLinks(content: string): string[] {
  const found: string[] = [];
  for (const match of content.matchAll(LINK_RE)) {
    const raw = match[1] ?? match[2] ?? match[3] ?? match[4] ?? match[5];
    if (isNonCanonicalLink(raw)) found.push(raw);
  }
  return found;
}

describe("Canonical trailing slash", () => {
  it("detecta rutas internas sin barra final (prueba de la regla)", () => {
    expect(isNonCanonicalLink("/alemania/amazon-prime")).toBe(true);
    expect(isNonCanonicalLink(`/\${country.slug}`)).toBe(true);
    expect(isNonCanonicalLink(`/\${slug}/\${productId ?? "precio"}`)).toBe(true);
    expect(isNonCanonicalLink("/metodo")).toBe(true);
  });

  it("acepta rutas canónicas, externas y assets", () => {
    expect(isNonCanonicalLink("/alemania/amazon-prime/")).toBe(false);
    expect(isNonCanonicalLink(`/\${country.slug}/`)).toBe(false);
    expect(isNonCanonicalLink(`/\${slug}/\${productId ?? "precio"}/`)).toBe(false);
    expect(isNonCanonicalLink("/espana/precio/?precio=150")).toBe(false);
    expect(isNonCanonicalLink("/")).toBe(false);
    expect(isNonCanonicalLink("https://example.com/foo")).toBe(false);
    expect(isNonCanonicalLink("mailto:hola@precioentiempo.com")).toBe(false);
    expect(isNonCanonicalLink("/og/espana/cafe.png")).toBe(false);
    expect(isNonCanonicalLink("/favicon.svg")).toBe(false);
  });

  it("no existen enlaces internos sin barra final en src/", () => {
    const offenders: string[] = [];
    for (const file of walk(SRC_DIR)) {
      const content = readFileSync(file, "utf8");
      for (const link of findNonCanonicalLinks(content)) {
        offenders.push(`${file.replace(SRC_DIR, "src")}: ${link}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
