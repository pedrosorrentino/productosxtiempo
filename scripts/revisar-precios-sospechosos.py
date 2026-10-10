#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Rango de plausibilidad para los precios de Google Shopping (SerpApi).

Google Shopping devuelve un resultado que coincide con la consulta, pero no
siempre con el mismo artículo ni la misma unidad: de ahí un «iPhone» suizo a
501 CHF o una consola colombiana a 82 €. Aquí se comparan los precios locales
de esa fuente con el precio español convertido a la divisa del país y, cuando
se salen de la banda, se devuelven a «convertido» (y se marcan como rechazados
en la caché para que el próximo sync no los vuelva a aplicar).

Uso:  python3 revisar_serpapi.py [--aplicar]
Sin --aplicar solo informa.
"""
import json, sys, urllib.request, argparse
from pathlib import Path

REPO = Path("/home/coder/proyectos/precioentiempo/repo")
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
                "note": f"Precio convertido desde España ({es['value']} €). Edítalo.",
                "source": (es.get("source") or "Referencia de producto") + " (convertido)",
                "origin": "converted",
            }
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
