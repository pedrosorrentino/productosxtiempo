# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Principal: el curioso viral. Llega por un enlace compartido (o de pasada), sin intención de compra formada. La portada debe engancharlo en segundos: ver cifras traducidas a tiempo de trabajo a primera vista, jugar y compartir su resultado.

Secundario (confirmado, mismo peso de usabilidad): el decisor que duda antes de una compra y quiere verla en tiempo de trabajo antes de decidir.

## Product Purpose

Convertir precios en tiempo de trabajo: eliges un país (o pones tu sueldo) y una cosa, y la web te dice cuántas horas, jornadas de 8 h, meses o años de sueldo entero representa. Traduce el dinero a la unidad que todo el mundo siente: su vida laborando. Éxito = que el visitante entienda el mecanismo en un vistazo y comparta su resultado.

## Positioning

El precio de las cosas, medido en TU tiempo: cálculo por sueldo mediano real del país (jornada legal incluida), anclas cotidianas (cafés, iPhones, meses de alquiler), barra del año laboral y contexto por edad ("X % de los años laborales que te quedan"). El cálculo corre 100 % en el dispositivo; no se guarda sueldo ni edad.

## Operating Context

- Lectura rápida y compartible: enlaces compartidos en redes, resultados como texto para compartir (ShareButton).
- Comparación entre países: el MISMO precio calculado con distintas nóminas (CompareStrip).
- Ficha de país con catálogo de cosas calculadas; ficha de producto dentro del país.

## Capabilities and Constraints

- Catálogo de productos (src/data/products.json) y países con sueldo mediano, jornada legal y horas reales anuales (src/data/countries.json): ES, PT y más. Precios orientativos, editables por el usuario.
- Cálculo: sueldo entero (modo A, techo teórico) y con ahorro mensual (modo B). Cifras redondeadas y unidades según magnitud (minutos/horas/jornadas/meses/años; nunca "0,1 jornadas").
- Stack existente: Astro 7 + Tailwind 4 + DaisyUI + islas Preact; despliegue en Cloudflare (wrangler).
- Detector de país desde la conexión (geolocalización por IP): DECISIÓN PENDIENTE de implementación; con Cloudflare está disponible la cabecera CF-IPCountry como vía natural. La portada debe mostrar por defecto el país detectado y permitir cambiarlo.
- La portada debe mostrar de un vistazo información ya calculada (coche, móvil, viaje, artículos cotidianos del país detectado) con gráficas, iconos (animados) y textos a varias escalas; el acceso a la ficha del país y la edición de datos propios (sueldo, horas, edad) quedan a un toque.

## Brand Commitments

- Nombre "Coste en tiempo": PROVISIONAL (usuario aún sin decidir; dominio placeholder). El mundo visual debe tolerar un cambio de marca.
- Tono del copy existente: seco, claro, un poco ingenioso, cero moralina (i18n/es.ts). No reescribir el tono sin permiso.
- Brief visual ligado por el usuario para el rediseño de portada: disruptivo, impactante, textos grandes y pequeños, iconos de colores, iconos animados, gráficas, máxima dopamina visual. Es una restricción, no una sugerencia.

## Evidence on Hand

- Copy ES completo con tono definido (src/i18n/es.ts).
- Datos de referencia reales por país y precios orientativos (JSON en src/data). Absencia a respetar: no existen fuentes oficiales citadas aún, testimonios ni métricas reales de tráfico; no inventarlas.
- Cálculos verificables con src/lib/calc.ts; ejemplo seed: Tesla Model 3 en España ≈ 402 jornadas de 8 h (build time).

## Product Principles

1. Cero fricción: la información ya calculada se ve antes de tocar nada; editar datos propios es opcional, nunca una barrera.
2. La cifra es el héroe: todo gira alrededor del número en tiempo de trabajo, a la escala que merece.
3. Traducción, no moralina: informar del esfuerzo laboral sin juzgar la compra.
4. Compartir es parte del producto: cada resultado debe querer reenviarse.
5. Rapidez primero: web rápida de usar y de cargar; el impacto visual no puede costar usabilidad.

## Accessibility & Inclusion

- Cifras grandes y jerarquía clara deben seguir siendo legibles y navegables; contraste y responsive son parte del brief (fácil de leer, fácil de usar).
- Cálculo accesible en el dispositivo; no se piden datos personales obligatorios.
