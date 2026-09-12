# Casa — Precio en Tiempo

Sitio — https://precioentiempo.com
Idioma de interfaz — castellano
Promesa — El precio de las cosas, medido en tu tiempo.
Pregunta madre — ¿Cuánto tiempo de tu vida cuesta lo que compras?

## Que es

Calculadora que pasa un precio a horas y jornadas de 8 h, con fichas de pais y catalogo por categorias. La referencia salarial es nacional y editable. Espana es una ficha, no el unico pais.

No es asesoramiento financiero. No es un ranking de productos ni de paises.

## Paises publicados (comprobado en src/data/countries.json)

Slug en minusculas, sin codigo ISO en la URL. URL canonica siempre con barra final.

| Pais | URL | ISO | Moneda | Hora neta | Neto mediano |
|---|---|---|---|---|---|
| Espana | /espana/ | ES | EUR | 10,38 € | 1800 €/mes |
| Portugal | /portugal/ | PT | EUR | 6,35 € | 1100 €/mes |
| Francia | /francia/ | FR | EUR | 13,85 € | 2100 €/mes |
| Alemania | /alemania/ | DE | EUR | 15,00 € | 2600 €/mes |
| Italia | /italia/ | IT | EUR | 8,65 € | 1500 €/mes |
| Reino Unido | /reino-unido/ | GB | GBP | 13,27 £ | 2300 £/mes |
| Estados Unidos | /estados-unidos/ | US | USD | 23,08 $ | 4000 $/mes |
| Mexico | /mexico/ | MX | MXN | 51,92 $ | 9000 $/mes |
| Chile | /chile/ | CL | CLP | 3409 $ | 650000 $/mes |
| Suiza | /suiza/ | CH | CHF | 37,5 Fr | 6500 Fr/mes |
| Colombia | /colombia/ | CO | COP | sin mediano (la ficha pide tu sueldo) | no disponible |
| Argentina | /argentina/ | AR | ARS | sin mediano (la ficha pide tu sueldo) | no disponible |

La semana legal cambia por pais: FR 35 h; ES, PT, DE, IT, GB, US, MX, CH 40 h; CO 42 h; CL 44 h. La hora neta usa la semana legal de cada pais, no 40 h fijas.

Cifras vistas ~2026-08. Envejecen. Prioriza el brief o la ficha viva. No inventes el hueco: si el mediano es null (CO, AR), la ficha entra en modo sin sueldo y pide el tuyo.

Analizador — `/{slug}/precio/?precio=`

## Arquitectura

- `/` — calculadora + catalogo (la home puede abrir en Espana; el resto de URLs no)
- `/{slug}/` — ficha de pais
- `/{slug}/precio/` — un importe en ese pais
- `/metodo/` — convenciones, limites, fuentes, privacidad (global)

Categorias — Transporte, Tecnología, Vivienda, Vida, Día a día. Precios locales al pais.

## Formula (igual en todos)

Hora neta = sueldo neto mensual / (horas semanales × 52 / 12)

40 h/semana → ≈ 173,3 h/mes.

Modo esfuerzo — horas y jornadas del precio de etiqueta.
Modo vida laboral — fraccion de anios hasta la edad de referencia de ese pais. No es esperanza de vida.

Nadie destina el 100% del sueldo a una sola compra.

## Lo que no se mide

Intereses, TCO, depreciacion, tramos regionales finos, felicidad, estatus, "si lo mereces", "donde se vive mejor".

## Fuentes

- Europa — Eurostat, OCDE, oficinas nacionales, ministerios, SMI
- Americas — Banco Mundial, OCDE si hay serie, INEGI (MX), DANE (CO), INDEC (AR), ministerios
- Energia / cesta — fuentes locales + Open Food Facts Prices
- Cambio — BCE / Frankfurter

Cita la oficina del pais de la pieza. El INE espanol no es fuente de Mexico.

## Privacidad

Calculo en el dispositivo. localStorage para Mis datos. La URL lleva numeros solo al Compartir.

## Voz

- Tu tiempo es tu divisa.
- Sin letra pequena — si algo es una convencion, lo decimos.
- Lo que nunca hacemos es contestar si deberias comprarlo.
- El dato que supera a todas eres tu.
- Preferimos el numero menos favorable y mas honesto.

Etiquetas de catalogo — Café, Medio Turno, Jornada, Picar Piedra, Galera, Hazaña Titánica.

## Titulos SEO tipo (literales del sitio)

- Home — Precio en Tiempo | ¿Cuánto tiempo de tu vida cuesta lo que compras?
- Pais con mediano — Poder Adquisitivo en [Pais] en Horas de Trabajo: Salario [hora] [moneda] · Precio en tiempo
- Pais sin mediano — [Pais]: Coste de la vida en horas de trabajo · Precio en tiempo
- Item con mediano — [Producto] en [Pais]: cuesta [esfuerzo] de trabajo · Precio en tiempo
- Item sin mediano — [Producto] en [Pais] ([precio] [moneda]) · Precio en tiempo
- Metodo — Método de Cálculo · Precio en tiempo

## Dolar ambiguo

MX, CL, CO, AR y US usan `$` en UI. En prosa, la primera mencion lleva ISO (MXN, CLP, COP, ARS, USD).
