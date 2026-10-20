#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Rango de plausibilidad para los precios de Google Shopping (SerpApi).

Google Shopping devuelve un resultado que coincide con la consulta, pero no
siempre con el mismo artículo ni la misma unidad: de ahí un «iPhone» suizo a
501 CHF o una consola colombiana a 82 €. Aquí se comparan los precios locales
de esa fuente con el precio español convertido a la divisa del país y, cuando
se salen de la banda, se devuelven a «convertido» (y se marcan como rechazados
en la caché para que el próximo sync no los vuelva a aplicar).

Uso:  python3 scripts/revisar-precios-sospechosos.py [--aplicar]
Sin --aplicar solo informa.
"""
import json, sys, urllib.request, argparse, subprocess
from pathlib import Path

# La raíz del repo se deduce del propio fichero, NUNCA se escribe a mano:
# con una ruta absoluta el script funcionaba en el portátil y reventaba en
# GitHub Actions, cuyo checkout vive en /home/runner/work/<repo>/<repo>. Ese
# fue el fallo que dejó la sincronización de catálogo en rojo dos semanas.
REPO = Path(__file__).resolve().parent.parent


def formato_es(valor: float) -> str:
    """Cifra con separador de millar y coma decimal, como en toda la web."""
    texto = f"{valor:,.2f}"
    if texto.endswith(".00"):
        texto = texto[:-3]
    return texto.replace(",", "\u00a0").replace(".", ",").replace("\u00a0", ".")
MIN, MAX = 0.6, 1.8

ap = argparse.ArgumentParser()
ap.add_argument("--aplicar", action="store_true")
a = ap.parse_args()

products = json.load(open(REPO / "src/data/products.json", encoding="utf-8"))
countries = json.load(open(REPO / "src/data/countries.json", encoding="utf-8"))
cur = {c["code"]: c["currency"] for c in countries}

# Tipos de cambio del BCE (los mismos que usa el sync)
monedas = sorted({v for v in cur.values() if v != "EUR"})
_req = urllib.request.Request(
    f"https://api.frankfurter.app/latest?from=EUR&to={','.join(monedas)}",
    headers={"User-Agent": "precioentiempo/1.0 (+https://precioentiempo.com)"},
)
try:
    with urllib.request.urlopen(_req, timeout=30) as r:
        rates = json.load(r)["rates"]
except Exception as e:  # sin red se usan las tasas de respaldo del sync
    print("aviso: sin tipos de cambio en vivo (%s); uso respaldo" % e)
    rates = {"USD": 1.09, "GBP": 0.85, "CHF": 0.94, "MXN": 21.4, "COP": 4500, "CLP": 1085, "ARS": 1550}
# El BCE no publica COP, CLP ni ARS: se usan las mismas tasas de respaldo que el sync.
rates.setdefault("COP", 4400)
rates.setdefault("CLP", 1020)
rates.setdefault("ARS", 1150)
rates["EUR"] = 1.0

sospechosos = []
for p in products:
    es = p["prices"].get("ES", {}).get("value")
    if not es:
        continue
    for code, d in list(p["prices"].items()):
        if d.get("origin") != "local":
            continue
        fuente = (d.get("source") or "")
        if not ("Shopping" in fuente or "SerpApi" in fuente):
            continue
        tasa = rates.get(cur.get(code, "EUR"))
        if not tasa:
            continue
        esperado = es * tasa
        ratio = d["value"] / esperado if esperado else 1
        if ratio < MIN or ratio > MAX:
            sospechosos.append((code, p["id"], d["value"], round(esperado, 2), round(ratio, 2)))

print(f"precios de Google Shopping fuera de la banda {MIN}–{MAX}: {len(sospechosos)}")
for code, pid, v, esp, ratio in sorted(sospechosos):
    print(f"   {code} {pid:<22} {v:>12} (esperado ~{esp:>10})  ratio {ratio}")

# ---------------------------------------------------------------------------
# Guarda 3 (solo avisa, no toca nada): precios locales imposibles en HORAS.
#
# Comparar precios entre países en su moneda no dice nada; en horas de trabajo,
# sí. Si un país se sale x3 de la mediana de los demás para el mismo producto, o
# el dato es de otra cosa (un casco en vez de una moto) o mide algo distinto (las
# tasas del examen en vez del carnet completo). No se corrige solo: se avisa
# para que alguien lo mire.
def avisar_horas_fuera_de_rango(products, countries):
    salarios = {c["code"]: c for c in countries}
    avisos = []
    for p in products:
        horas = {}
        for code, pr in p["prices"].items():
            if pr.get("origin") != "local" or not pr.get("value"):
                continue
            pais = salarios.get(code)
            if not pais:
                continue
            sueldo = pais.get("medianNetMonthly") or pais.get("minWageMonthly")
            if not sueldo:
                continue
            horas_mes = pais.get("legalWeeklyHours", 40) * 52 / 12
            horas[code] = pr["value"] / (sueldo / horas_mes)
        if len(horas) < 5:
            continue
        ordenados = sorted(horas.values())
        mediana = ordenados[len(ordenados) // 2]
        if not mediana:
            continue
        for code, h in horas.items():
            ratio = h / mediana
            if ratio > 3 or ratio < 1 / 3:
                avisos.append((p["id"], code, round(h, 1), round(mediana, 1), round(ratio, 2)))
    return sorted(avisos, key=lambda x: x[4])


avisos_horas = avisar_horas_fuera_de_rango(products, json.load(open(REPO / "src/data/countries.json", encoding="utf-8")))
print(f"precios locales a mas de x3 de la mediana del producto (en horas): {len(avisos_horas)}")
for pid, code, h, med, ratio in avisos_horas[:15]:
    print(f"   {code} {pid:<20} {h:>9} h  (mediana {med} h, x{ratio})")

if not a.aplicar:
    print("\n(sin --aplicar no se toca nada)")
    raise SystemExit(0)

# 1. Devolver esos precios a «convertido»
for p in products:
    es = p["prices"].get("ES")
    if not es:
        continue
    for code, d in list(p["prices"].items()):
        if any(c == code and i == p["id"] for c, i, *_ in sospechosos):
            tasa = rates.get(cur.get(code, "EUR"), 1)
            valor = round(es["value"] * tasa, 2 if tasa < 100 else 0)
            p["prices"][code] = {
                "value": valor,
                "date": es.get("date"),
                "note": f"Precio convertido desde España ({formato_es(es['value'])} €).",
                "source": (es.get("source") or "Referencia de producto") + " (convertido)",
                "origin": "converted",
            }
# ---------------------------------------------------------------------------
# Guarda 2: cambios bruscos respecto a lo ÚLTIMO PUBLICADO.
#
# La banda de arriba compara cada precio local con el español convertido, así
# que es ciega a un desplazamiento uniforme: si el sync baja el precio español
# y todos los demás a la vez, los ratios cuadran y ningún país sale sospechoso.
# Pasó de verdad el 19-oct con «videojuego AAA»: el scraper devolvió un juego de
# 17,99 € en los doce países (-70%) y la banda dio el cambio por bueno. Aquí se
# compara con el precio que ya estaba publicado y, si el salto es grande, se
# revierte: un AAA a 17,99 € no es una oferta, es otro juego.
UMBRAL_CAMBIO = 0.40
bruscos = []
try:
    crudo = subprocess.run(["git", "-C", str(REPO), "show", "HEAD:src/data/products.json"],
                           capture_output=True, text=True, check=True).stdout
    previos = {x["id"]: x["prices"] for x in json.loads(crudo)}
except Exception as e:  # sin git o sin commit previo: se omite la guarda
    previos = {}
    print(f"aviso: no se pudo leer la versión publicada ({e}); se omite la guarda de cambios bruscos")

for p in products:
    antes = previos.get(p["id"], {})
    for code, d in list(p["prices"].items()):
        valor = d.get("value")
        anterior = (antes.get(code) or {}).get("value")
        if not valor or not anterior:
            continue
        ratio = valor / anterior
        if ratio < 1 - UMBRAL_CAMBIO or ratio > 1 + UMBRAL_CAMBIO:
            bruscos.append((code, p["id"], anterior, valor, round(ratio, 2), d.get("source", "")))

print(f"cambios de más del {UMBRAL_CAMBIO:.0%} respecto a lo publicado: {len(bruscos)}")
for code, pid, antes_v, ahora_v, ratio, fuente in sorted(bruscos):
    print(f"   {code} {pid:<22} {antes_v:>12} -> {ahora_v:>12}  ratio {ratio}  ({fuente[:34]})")

for p in products:
    antes = previos.get(p["id"], {})
    for code, pid, *_ in [(c, i, a, v, r, f) for c, i, a, v, r, f in bruscos if i == p["id"]]:
        if code in antes:
            p["prices"][code] = dict(antes[code])

if bruscos:
    print(f"   -> {len(bruscos)} precios devueltos a como estaban publicados")

json.dump(products, open(REPO / "src/data/products.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)

# 2. Marcar la caché para que el próximo sync no los reaplique
cache_path = REPO / "scripts/data/serpapi-cache.json"
cache = json.load(open(cache_path, encoding="utf-8"))
n = 0
for code, pid, *_ in sospechosos:
    k = f"{code}:{pid}"
    if k in cache.get("prices", {}):
        cache["prices"][k]["rejected"] = True
        n += 1
json.dump(cache, open(cache_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"\naplicado: {len(sospechosos)} precios devueltos a convertido, {n} entradas marcadas en la caché")
