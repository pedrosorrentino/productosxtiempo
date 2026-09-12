---
name: seo-human-web-writing
description: Redacta y reescribe contenido para Precio en Tiempo (precioentiempo.com) en voz humana, castellano y SEO on-page, para cualquier pais del catalogo. Usar al escribir fichas, paises, fuentes, FAQs, metas, catalogo, landings o al humanizar texto IA del sitio.
metadata:
  type: workflow
  version: "1.3"
  language: es-ES
  site: precioentiempo.com
---

# Precio en Tiempo — escritura web

Skill de casa para [precioentiempo.com](https://precioentiempo.com). Convierte precios en tiempo de trabajo en **varios paises**. Espana es una ficha mas, no el unico marco.

Antes de redactar una pieza larga, lee `references/precioentiempo.md`, `references/ai-tells.md` y `references/seo-onpage.md`.

## Quien habla

Marca — Precio en Tiempo.
Promesa — El precio de las cosas, medido en tu tiempo.
Lector — Quien mira un precio en su pais (o compara paises) y quiere saber cuantas horas de nomina son.
Tono — Directo, concreto, un poco seco y con ironia puntual. Numeros primero. Analogias de bar, nomina y despertador. Sin moralina de "deberias comprarlo".
Idioma de UI — castellano (tu, no usted). La moneda y el dato oficial son los del pais de la pieza.

No suenes a startup, a newsletter de productividad ni a comparador de seguros.

## Pais primero

Toda pieza lleva un **pais activo**. Si el usuario no lo dice, pregunta. No asumas Espana.

Mapa vivo (URLs canonicas, siempre con barra final):

- `/espana/` ES EUR
- `/portugal/` PT EUR
- `/francia/` FR EUR
- `/alemania/` DE EUR
- `/italia/` IT EUR
- `/reino-unido/` GB GBP
- `/estados-unidos/` US USD
- `/mexico/` MX MXN
- `/chile/` CL CLP
- `/suiza/` CH CHF
- `/colombia/` CO COP (sin mediano en ficha: pide tu sueldo)
- `/argentina/` AR ARS (sin mediano en ficha: pide tu sueldo)

Detalle de cifras y simbolos en `references/precioentiempo.md`. Si aparece un pais nuevo, replica el mismo molde y no inventes el sueldo.

Reglas multi-pais:

- Usa la moneda del pais. Si el simbolo `$` es ambiguo (MXN, USD, CLP, COP, ARS), nombra el codigo ISO al menos una vez.
- No conviertas de oficio a euros salvo que la pieza sea una comparacion.
- En comparaciones, tabla corta pais | hora neta | moneda | enlace interno al slug.
- CTA de analisis — `/{slug}/precio/?precio=`
- Internos de la pieza — ficha del pais activo + 2-4 fichas vecinas + `/` + `/metodo/`
- Catalogo y alquileres son locales. Un menu del dia en Mexico no lleva precio de Espana.

## Briefing (una sola tanda si falta)

- Tipo de pieza
- Pais activo (obligatorio) / item / precio / keyword
- Datos oficiales (sueldo, moneda, fuente, fecha). Si no vienen, usa solo la tabla de `references/precioentiempo.md` o `[FALTA DATO]`
- Enlaces destino
- Longitud

## Flujo

1. Fija pais + moneda + slug.
2. H1 en pregunta o dato (como el sitio).
3. Respuesta numerica al inicio (hora neta, horas del item, % del sueldo).
4. Contexto honesto (neto, mediano, convencion, limites).
5. Catalogo / FAQ / comparar paises / CTA a calcular.
6. Pasada anti-slop sin borrar voz de marca.
7. Meta title, description y slug.

## Voz

- Castellano de la marca. Tu. Horas, jornadas, nomina, sueldo neto.
- Cifra exacta antes que adjetivo. "6,35 €/h en Portugal" gana a "un salario bajo".
- Segunda persona para el calculo personal. Tercera para el dato oficial del pais.
- Analogias cortas — la media la tuerce el multimillonario del bar; el mediano no.
- Teatro de catalogo (madrugones, placa de bronce) en fichas de item. En `/metodo/` y avisos, bajo.
- Cierra con calcular / ficha de pais / comparar, no con "el tiempo es el recurso mas valioso".

## Lo que esta web siempre dice

- Neto, no bruto. Mediano, no medio.
- El mejor dato de tu hora es el tuyo. La referencia del pais es orientativa.
- Esfuerzo laboral, no veredicto de compra.
- Cuenta deliberadamente simple. Intereses, TCO, depreciacion y felicidad fuera.
- Privacidad en el dispositivo, salvo al compartir enlace.
- Dato oficial de mas de 18 meses — avisar que puede estar desfasado.
- Si el mediano nacional "no esta disponible" en esa ficha, no lo rellenes. Usa lo que la pagina declara (a veces SMI u hora de referencia) y dilo.

## Lo que esta web nunca dice

- Deberias / no deberias comprarlo.
- Reloj de la muerte o dias que te quedan.
- Sueldo medio cuando toca mediano, salvo para explicar el vicio de la media.
- Inventar INE, OCDE, Eurostat, INEGI, DANE, INDEC, SMI, inflacion o precios.
- Prometer ahorro, ranking o "la mejor hipoteca".
- Tratar todos los `$` como dolares.
- Jerga de IA o growth.

Slop extra en `references/ai-tells.md`. Etiquetas del catalogo (Hazaña Titánica, Galera, Café) son voz de marca.

## SEO del dominio

Titulos tipo (literales del sitio):

- Home — Precio en Tiempo | ¿Cuánto tiempo de tu vida cuesta lo que compras?
- Pais con mediano — Poder Adquisitivo en [Pais] en Horas de Trabajo: Salario [hora] [moneda] · Precio en tiempo
- Pais sin mediano — [Pais]: Coste de la vida en horas de trabajo · Precio en tiempo
- Item con mediano — [Producto] en [Pais]: cuesta [esfuerzo] de trabajo · Precio en tiempo
- Item sin mediano — [Producto] en [Pais] ([precio] [moneda]) · Precio en tiempo
- Fuentes — Método de Cálculo · Precio en tiempo

Entidades — precio en tiempo, horas de trabajo, sueldo mediano neto, valor hora, poder adquisitivo, jornada, salario minimo, OCDE, Banco Mundial + oficina estadistica del pais (INE, INEGI, DANE, INDEC…).

On-page:

- Pais + moneda + cifra en H1 o en los primeros ~100 palabras.
- H2 con el nombre del pais ("¿Cuál es el salario mediano neto por hora en México?").
- FAQ local + bloque comparar con otros paises (enlaces a slugs).
- Internos — `/`, `/{slug}/`, `/{slug}/precio/`, `/metodo/`, 2-4 paises.
- Meta con cifra + pais + CTA a calcular.
- Slug — `/{pais}/` y `/{pais}/precio/`.

## Formatos

**Ficha de item.** Precio en moneda local. Horas. Jornadas de 8 h. % del año sueldo. Etiqueta de esfuerzo. Una frase de textura. CTA calcular en mi tiempo.

**Pagina de pais.** Radiografia del pais activo. Barometro local. Catalogo. FAQ. Comparar paises. CTA `/{slug}/precio/`.

**Fuentes / transparencia.** Receta global, convenciones, limites, oficinas de datos por pais, privacidad.

**FAQ.** Pregunta con pais. Respuesta con formula o cifra de esa ficha.

**Comparativa.** Misma cesta o misma hora neta entre 3-6 paises. Sin ranking moral ("se vive mejor en…").

**Meta.** 3 opciones si no hay una fijada.

## Autocomprobacion

- Pais activo correcto, moneda no ambigua
- No cuela datos de Espana en otra ficha
- Neto / mediano bien usados
- Cero cifras oficiales inventadas
- Sin veredicto de compra
- Keyword + numero + pais al inicio
- Internos al slug del pais y a 2+ paises
- Meta title + description + slug
