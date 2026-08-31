---
name: Coste en tiempo
description: El precio de las cosas, medido en tu tiempo — tablero de cotizaciones en jornadas de trabajo.
colors:
  carbon-base: "#151a17"
  carbon-plate: "#1c231f"
  carbon-line: "#28332d"
  cream: "#f2ead8"
  cream-on-red: "#fff3ec"
  quote-amber: "#ffb020"
  signal-red: "#e8482e"
  phosphor: "#3ec97e"
  enamel-blue: "#4aa3ff"
  enamel-pink: "#f26db6"
  glyph-ink: "#14191d"
  red-hover: "#f25c42"
  alert-red: "#f2664f"
  chip-edge: "rgba(255, 255, 255, 0.14)"
typography:
  display:
    fontFamily: "Big Shoulders Variable, Arial Narrow, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3rem)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0.01em"
  quote:
    fontFamily: "Big Shoulders Variable, Arial Narrow, sans-serif"
    fontSize: "clamp(4.5rem, 16vw, 11rem)"
    fontWeight: 700
    lineHeight: 1
  body:
    fontFamily: "Chivo Variable, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Chivo Mono Variable, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.06em"
  label-sm:
    fontFamily: "Chivo Mono Variable, ui-monospace, monospace"
    fontSize: "0.625rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.14em"
  tagline:
    fontFamily: "Chivo Mono Variable, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.08em"
  brand:
    fontFamily: "Big Shoulders Variable, Arial Narrow, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.01em"
  cta:
    fontFamily: "Big Shoulders Variable, Arial Narrow, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.02em"
rounded:
  none: "0px"
  control: "4px"
  box: "6px"
  flap: "0.09em"
components:
  cta-red:
    backgroundColor: "{colors.signal-red}"
    textColor: "{colors.cream-on-red}"
    rounded: "{rounded.none}"
    padding: "0.75rem 1.5rem"
  cta-red-hover:
    backgroundColor: "{colors.red-hover}"
    textColor: "{colors.cream-on-red}"
    rounded: "{rounded.none}"
    padding: "0.75rem 1.5rem"
  button-ghost:
    backgroundColor: "{colors.carbon-base}"
    textColor: "{colors.cream}"
    rounded: "{rounded.control}"
  input-field:
    backgroundColor: "{colors.carbon-base}"
    textColor: "{colors.cream}"
    rounded: "{rounded.control}"
    height: "2.75rem"
  stamp-detected:
    backgroundColor: "transparent"
    textColor: "{colors.phosphor}"
    rounded: "{rounded.none}"
    padding: "0.2rem 0.45rem"
  stamp-alert:
    backgroundColor: "transparent"
    textColor: "{colors.alert-red}"
    rounded: "{rounded.none}"
    padding: "0.2rem 0.45rem"
  board-cell:
    backgroundColor: "{colors.carbon-base}"
    textColor: "{colors.cream}"
    rounded: "{rounded.none}"
    padding: "0.875rem 1rem"
  board-cell--fill:
    backgroundColor: "{colors.quote-amber}"
    textColor: "{colors.glyph-ink}"
    rounded: "{rounded.none}"
    padding: "0.875rem 1rem"
  board-cell--rate:
    backgroundColor: "{colors.carbon-base}"
    textColor: "{colors.quote-amber}"
    rounded: "{rounded.none}"
    padding: "0.875rem 1rem"
  board-anchor:
    backgroundColor: "{colors.carbon-base}"
    textColor: "{colors.cream}"
    rounded: "{rounded.none}"
    padding: "0.5rem 0.875rem"
---

# Design System: Coste en tiempo

## Overview

**Creative North Star: "El Tablero de Cotizaciones"**

La portada es una chapa esmaltada de tablero de cambio: tu hora es la divisa y cada precio se publica cotizado en jornadas de trabajo. Las fichas de país y de producto son la misma chapa por la otra cara: la ficha de país cotiza la hora del país y repite la pizarra a escala local; la ficha de producto publica el resultado en gramática de marcador — placa de identidad, marcador gigante a flaps, retícula de magnitudes, bandas de anclas, placas gemelas y placa de acciones. Todo el sistema habla de mecánica expuesta — dígitos crema split-flap con costura y bisagra, ticker rodante, placa de operación con sellos — nunca de software pulido ni de calculadora con input héroe: la información ya está cotizada cuando llegas. La densidad es alta y el número es el héroe; el copy seco (cero moralina) va en la misma voz que la señalética.

El material es esmalte plano sobre carbón-verdoso: cero glow, cero gradiente, cero sombra de elevación. La profundidad no se finge con luz; se construye con hairlines de 1 px y un escalón tonal entre chapa base y placa. El color trabaja por oficio: ámbar para lo cotizado, rojo señal para la acción, verde fósforo para lo vivo, esmaltes de color para las categorías. Tres voces tipográficas: señalización condensada que anuncia, mono tabular que cuenta, grotesco que explica.

**Key Characteristics:**
- Mundo "tablero" aplicado a todo el sitio vía tema daisyUI `board` (`data-theme="board"`); la portada y las fichas de país y producto (`/{país}`, `/{país}/{producto}`, `/{país}/precio`) están comprometidas con su vocabulario de componentes. `/metodo` y el 404 conservan estructura daisyUI genérica, pendientes de rediseño.
- Cifra héroe a dígitos rodantes split-flap con rodada única al llegar (portada, hora del país, marcador de producto); ticker ambiente de productos con chip "En vivo".
- Números siempre en mono tabular ámbar; la celda que manda de cada retícula lleva el ámbar como relleno con dígitos en tinta glifo; acción siempre en rojo señal; vida siempre en verde fósforo.
- Iconografía de línea (trazo 2, un solo peso) sobre esmaltes cuadrados de color por categoría — también en las bandas de anclas del marcador.
- Sin imágenes ni rasters en el build: tipografía autoalojada, SVG de línea y CSS.

## Colors

Paleta de chapa esmaltada: fondo carbón-verdoso profundo, dígitos crema pintados, y tres señales de oficio (ámbar, rojo, fósforo) más esmaltes de categoría. Los tokens viven en el tema daisyUI `board` (`src/styles/global.css`); los esmaltes y derivados de estado son constantes del componente y CSS de tablero.

### Primary
- **Ámbar de cotización** (#ffb020, `--color-primary`): el color de lo cotizado — la cifra de cada fila, la unidad "jornadas de 8 h" junto al odómetro, los valores del ticker, el relleno de la barra del año laboral, el dígito ámbar de la celda "% del año laboral real" y de los recuentos de las bandas de anclas. También es relleno: la celda que manda de cada retícula (`board-cell--fill` — jornadas en el marcador, jornada semanal en la ficha de país) se pinta entera de ámbar con dígitos en tinta glifo. Y es el color de la interacción enfocada: `::selection` y el anillo `:focus-visible` (2 px + offset 2 px) son ámbar, y el hover de la marca lo toma. Nunca decora: siempre señala una cifra o un foco.

### Secondary
- **Rojo señal** (#e8482e, `--color-secondary`/`--color-error`): el color de la acción — fondo del CTA "Ficha de España →", del botón "Calcular en mi tiempo" de la placa de precio libre, y puntuación decorativa (los separadores `·` del ticker y de las líneas de datos de las fichas). Hover del CTA usa el derivado **rojo hover** (#f25c42). Nunca porta un dato.

### Tertiary
- **Verde fósforo** (#3ec97e, `--color-accent`/`--color-success`): lo vivo — chip "En vivo" con su punto pulsante y sello "detectado".
- **Azul esmalte** (#4aa3ff, `--color-info`): esmalte de la categoría Tecnología y sello "ref. España".
- **Rosa esmalte** (#f26db6): esmalte de la categoría Vida. Los esmaltes de Transporte y Día a día son el rojo señal y el ámbar; cada esmalte lleva glifos de línea en **tinta glifo** (#14191d).

### Neutral
- **Carbón base** (#151a17, `--color-base-100`): fondo de página, filas de pizarra, ticker, inputs y botones fantasma. También el color de los dígitos pintados sobre celdas crema.
- **Carbón placa** (#1c231f, `--color-base-200`): marquesina, placas, y el escalón de hover de las filas.
- **Carbón línea** (#28332d, `--color-base-300`/`--color-neutral`): todas las hairlines de 1 px y el pulgar del scrollbar.
- **Crema** (#f2ead8, `--color-base-content`): texto de todo el sitio y, a la vez, la cara esmaltada de las celdas split-flap — los dígitos son crema con números carbón.
- **Crema sobre rojo** (#fff3ec, `--color-secondary-content`): texto del CTA y del sello de error.
- **Rojo alerta** (#f2664f): derivado del rojo señal, aclarado para garantizar ≥ 4.5:1 en texto de 10 px sobre placa (sellos "cotizando con tus datos").
- **Rojo hover** (#f25c42): derivado de estado del CTA.

### Named Rules
**La Regla del Ámbar Cotizado.** El ámbar es la cotización y el foco, nada más. Si un elemento no es una cifra, el relleno de la celda que manda ni un anillo de foco, no es ámbar.

**La Regla del Rojo Señal.** El rojo es acción y puntuación — el CTA y los puntos del ticker — nunca un valor de datos.

**La Regla del Esmalte Plano.** Cero glow, cero gradiente, cero sombra de elevación. La única sombra permitida en todo el sistema es la mecánica de la celda flap (inset inferior que simula el pliegue del dígito).

## Typography

**Display Font:** Big Shoulders Variable (fallback "Arial Narrow", sans-serif) — autoalojada vía `@fontsource-variable/big-shoulders`.
**Body Font:** Chivo Variable (fallback system-ui, sans-serif) — autoalojada vía `@fontsource-variable/chivo`.
**Label/Mono Font:** Chivo Mono Variable (fallback ui-monospace, monospace) — autoalojada vía `@fontsource-variable/chivo-mono`.

**Character:** señalización condensada que grita cifras a la manera de un panel de estación; mono tabular que cuenta con dígitos alineados (`tabular-nums` en las columnas de la pizarra); grotesca de trabajo que explica sin levantar la voz. Tres voces, cero solapamiento.

### Hierarchy
- **Quote** (Big Shoulders 700, line-height 1): la cifra héroe del odómetro, la única escala de este tamaño en el sitio. Tres montajes del mismo componente: portada `clamp(4.5rem, 16vw, 11rem)`, marcador de producto `clamp(4rem, 14vw, 10rem)` y hora de referencia de la ficha de país `clamp(3.5rem, 12vw, 8rem)`. Cuando la cifra no es rodable ("menos de un minuto"), cae a signage 400 a `clamp(3rem, 10vw, 7rem)` con la unidad en ámbar. Su unidad la acompaña en Big Shoulders 400 ámbar a `clamp(1.5rem, 4vw, 3rem)` (producto) o `clamp(1.25rem, 3vw, 2.25rem)` (país, "€ / hora").
- **Display** (Big Shoulders 400 para h1–h3, 1.5–3 rem, uppercase): marquesina de marca (800), títulos de sección, nombre del país, categorías de la pizarra. La señalética condensada a peso regular lee como pintura de placa; marca y CTA van a 700–800.
- **Body** (Chivo 400, 1–1.25 rem, line-height 1.5): subtítulos, frases de contexto, aviso de esfuerzo, cuerpo del estado sin sueldo. Opacidades 70–85 % sobre carbón para jerarquizar sin inventar grises.
- **Label** (Chivo Mono 400, 0.625–0.8125 rem, letter-spacing 0.06–0.14 em, uppercase): micro-etiquetas de placa ("OPERANDO CON"), navlinks, ticker, chip "En vivo", sellos, pie legal, y las etiquetas y cifras de las celdas de magnitud. Y la cifra de cada fila de la pizarra: mono 1.5–1.875 rem `tabular-nums` ámbar — la voz contadora también hace de número grande. En las celdas del marcador el dígito sube a mono 1.5–1.875 rem `tabular-nums` (ámbar en la celda de tasa), y en las bandas de anclas el recuento va en mono ámbar `tabular-nums` dentro de la frase en cuerpo.

### Named Rules
**La Regla de las Tres Voces.** Big Shoulders anuncia, Chivo Mono cuenta, Chivo explica. Ninguna cifra va en la voz de cuerpo; ningún párrafo va en signage.

**La Regla del Contador Tabular.** Toda cifra calculada viaja en Chivo Mono; donde los números forman columna, `tabular-nums`.

## Layout

Contenedor único `max-w-5xl` (64 rem) centrado con `px-4`; marquesina, ticker y pie van a sangre completa. El cuerpo es `min-h-screen flex flex-col` con `main` en `flex-1`.

Ritmo vertical observado entre secciones (móvil → `md`): placa de operación `pt-6`; cotización héroe `mt-10 → mt-14`; ticker `mt-12 → mt-16`; pizarra `mt-14 → mt-20`; panel de tipo de cambio `mt-16 → mt-24`; fila CTA final `mt-14 → mt-16` con `pb-20`. El espaciado interno sigue la escala por defecto de Tailwind (placas `p-4 md:p-5`, panel de cambio `p-6 md:p-8`).

Responsive en tres cortes Tailwind (`sm` 640 px, `md` 768 px, `lg` 1024 px): la tagline de la marquesina solo aparece en `md`; el enlace "Ficha de X" de la placa en `sm`; el formulario pasa a 2 columnas en `sm`; la placa de operación apila en móvil y va en fila en `md`; la cifra héroe escala con el viewport vía clamp; las **placas gemelas** (tipo de cambio | precio libre en la ficha de país; modo B | comparador en el marcador) apilan y se reparten en `lg:grid-cols-2` con `gap-4`. Las retículas de celdas van en `grid-cols-2 → sm:grid-cols-3` con `gap-1.5`. La pizarra agrupa por categoría en filas de grilla de una columna con `gap-1.5` (6 px) entre filas y `space-y-10` entre grupos.

Ritmo de las fichas: placa de identidad `p-5 pt-8` (contenedor); marcador u hora de referencia `mt-8`; retícula de magnitudes `mt-10` en el marcador, `mt-8` en el país; bandas de anclas `mt-10`; placas gemelas `mt-10`; placa de acciones `mt-10 space-y-4`; pizarra del país `mt-14` y navlink final `mt-14 pb-20`.

## Elevation & Depth

Sistema plano por declaración: el tema fija `--depth: 0` y `--noise: 0`, y no existe ninguna sombra de elevación en el build. La profundidad se construye con dos recursos: hairlines de 1 px en carbón línea (#28332d) que delimitan cada pieza (marquesina, placas, filas, ticker) y un escalón tonal de una parada (#151a17 fondo → #1c231f placa/hover). La única sombra del sistema es la sombra mecánica interna de la celda flap (`inset 0 -0.07em 0 rgba(0,0,0,0.22)`), que no eleva: plega.

### Shadow Vocabulary
- **Flap fold** (`box-shadow: inset 0 -0.07em 0 rgba(0,0,0,0.22)`): pliegue inferior de la celda split-flap, junto al semitonos superior (`rgba(255,255,255,0.14)`) y la bisagra de 1 px (`rgba(0,0,0,0.3)`). Exclusivo del odómetro.

### Named Rules
**La Regla del Borde como Profundidad.** Nada se eleva; todo se delimita. Para separar o destacar: 1 px de #28332d o un escalón a #1c231f. La única sombra permitida es el pliegue del flap.

## Shapes

Lenguaje de chapa troquelada: placas, filas, ticker y CTA son de esquina viva (radio 0) con borde de 1 px; el radio existe solo donde hay interacción de control (selector, inputs, botones fantasma: 4 px; cajas daisyUI genéricas: 6 px) y en la celda split-flap (0.09 em, proporcional al dígito). Iconografía de línea en SVG de 24×24, trazo 2, extremos y uniones redondeados, `aria-hidden`, dentro de esmaltes cuadrados de 2.25 rem (2 rem en filas) con borde sutil `rgba(255,255,255,0.14)`. Las barras de progreso (año laboral: 1 rem de alto; filas: 3 px) son rectángulos sin radio dentro de un marco de 1 px.

### Named Rules
**La Regla de la Placa Cuadrada.** Lo que parece señal troquelada (placas, filas, CTA, ticker) va a esquina viva; el radio de 4 px se reserva para controles que se tocan.

## Components

### Marquesina (header)
- Chapa a sangre (`#1c231f`, borde inferior 1 px, `padding 0.75rem 1.25rem`), marca en Big Shoulders 800 1.75 rem uppercase crema con hover ámbar; tagline mono 0.6875 rem tracking 0.08 em al 72 % (solo `md`); navlink "Método" como chip mono uppercase con borde y fondo carbón base que se invierte a ámbar/gravilla en hover.

### Placa de operación
- Panel `.board-plate` (#1c231f, borde 1 px) con etiqueta mono "OPERANDO CON", nombre del país en Big Shoulders 1.875–2.25 rem uppercase, y sellos `.board-stamp` (mono 0.625 rem tracking 0.14 em uppercase, borde `currentColor`, `padding 0.2rem 0.45rem`): "detectado" en fósforo, "tu elección" en ámbar, "cotizando con tus datos" en rojo alerta, "ref. España" en azul. Selector de país (daisyUI select, mono, 2.75 rem de alto) y enlace de ficha.

### Odómetro split-flap (firma del sistema)
- Cada dígito es una celda crema (#f2ead8) de `0.72em × 1.18em`, radio `0.09em`, con costura horizontal (mitad superior 14 % blanca), bisagra de 1 px y pliegue inferior. Dentro, una tira vertical 0–9 en Big Shoulders 700 carbón que desliza a `translateY` del dígito destino: transición única de 0.85 s `cubic-bezier(0.22, 0.9, 0.28, 1)` con retraso de 70 ms por columna, rodada de 0 al valor una sola vez al montar (fases `ssr → primed → revealed`; sin JS el HTML estático ya muestra el valor). Separadores (`,`, `.`) van en celdas crema transparentes sin placa. El conjunto es `role="img"` con `aria-label` de la frase completa ("402 jornadas de 8 h"). Se reemplea en las tres superficies: portada, marcador de producto y hora de referencia de la ficha de país (escalas en Typography).

### Ticker + chip En vivo
- Franja a sangre sobre carbón base con bordes de 1 px. Chip fijo a la izquierda en mono 0.625 rem verde fósforo con punto de 8 px pulsando (1.6 s ease-in-out); ventana con pista duplicada (copia 2 `aria-hidden`) que recorre 42 s lineales infinitos y **se pausa al hover**. Ítems mono 0.8125 rem crema; valores en ámbar 600; separadores `·` en rojo.

### Retícula del marcador (celdas de magnitud)
- Celdas `.board-cell` (carbón base, hairline 1 px, `padding 0.875rem 1rem`, esquina viva) en grilla 2→3 columnas con `gap-1.5`. Etiqueta mono 0.625 rem uppercase tracking 0.14 em al 80 %; dígito mono 1.5–1.875 rem `tabular-nums` line-height tight. Tres estados: **celda base** (crema sobre carbón), **celda que manda** `.board-cell--fill` (relleno ámbar completo, dígitos en tinta glifo #14191d — jornadas en el marcador, jornada semanal en la ficha de país) y **celda de tasa** `.board-cell--rate` (carbón base con dígito ámbar — "% del año laboral real"). Una sola celda ámbar por retícula: manda la jornada.

### Bandas de señal (anclas)
- Filas `.board-anchor` (carbón base, hairline 1 px, `grid auto 1fr auto`, `gap 0.75rem`, `padding 0.5rem 0.875rem`, estáticas — no son enlaces): esmalte pequeño de 2 rem con glifo de línea (café ámbar, iPhone azul, alquiler fósforo), frase en cuerpo Chivo 500 con el recuento partido y viajando en mono ámbar `tabular-nums`, y flecha decorativa `.board-row-arrow`. Recuentos honestos: entero si ≥ 10, 1 decimal si < 10, y "menos de un X" cuando el recuento cae por debajo de 1.

### Filas de pizarra
- Enlace `.board-row` en grilla de 4 columnas (`auto 1fr auto auto`, `gap 0.75rem`, `padding 0.6rem 0.875rem`): esmalte de categoría con icono de línea, nombre Chivo 500 truncado + precio mono 0.75 rem + minibarra de 3 px en esmalte de categoría, cifra mono `tabular-nums` 1.5–1.875 rem ámbar con unidad mono 0.75 rem uppercase, y flecha → que al hover se desplaza 3 px y se vuelve ámbar. Hover de fila: escalón tonal a #1c231f (120 ms ease-out) y el icono se inclina `rotate(-6deg) scale(1.06)` (160 ms).
- **Reempleo en la pizarra del país** (`/{país}`): mismas filas cotizadas en build time con la mediana local, con unidades honestas según magnitud ("1 minuto", "1 hora", "jornadas" — singular incluido) y barras de gauge (relleno de `yearsFullPay × 100` con tope en 100 %) en esmalte de categoría. Sin precio local: sello `.board-stamp` azul info "sin precio local" + badge "ref. España" cuando el precio es fallback ES, y en la columna de cotización el CTA mono "pon el precio en tu moneda →".

### CTA rojo
- `.board-cta`: Big Shoulders 700 1.375 rem uppercase, fondo rojo señal, texto crema sobre rojo, borde propio, `padding 0.75rem 1.5rem`, esquina viva. Hover: rojo hover #f25c42 + `translateY(-1px)` (120 ms). En las fichas reemplaza al botón submit del precio libre (PriceInput en modo navegación): "Calcular en mi tiempo" dentro de la placa gemela "Esta cosa cuesta"; en modo inline (marcador) no hay botón — el recálculo es en vivo.

### Formulario (Tu tipo de cambio)
- Placa `.board-plate` `p-6 md:p-8` con título Big Shoulders y sello de datos propios; grilla de 4 inputs daisyUI (`sm:grid-cols-2`), fondo carbón base, radio 4 px, altura mínima 2.75 rem, placeholders con los valores del país. Resumen vivo "Tu hora vale X" en Chivo 500 1.125 rem, sin botón Calcular: cada tecla recalcula. En la ficha de país ocupa una de las placas gemelas y sincroniza su propia URL; en el marcador vive dentro del pliegue "Mis datos" y emite al padre.

### Pliegue de datos (details con caret propio)
- Placa plegable `.board-details` (`details.board-plate p-5`): summary mono 0.625 rem uppercase tracking 0.14 em con marcador nativo suprimido (`list-style: none` + `::-webkit-details-marker`) y caret SVG propio `.board-caret` (chevron de 14 px, trazo 2) que rota 90° al abrir (`[open]`, 160 ms ease-out; apagado con reduced-motion). Dentro, `mt-4` con el formulario de datos. Es el único elemento plegable del sistema.

### Botón compartir + feedback
- Botón envuelto en `.board-share` (daisyUI outline re-vestido): mono 0.8125 rem uppercase, fondo carbón base, borde carbón línea, radio 4 px; hover a placa (#1c231f) con borde a crema. En el marcador comparte fila con el selector de otro país (`grid items-end sm:grid-cols-2`). La confirmación usa toast/alert daisyUI genérico (`alert-success`/`alert-warning`, `role="alert"`, 2.5 s) — vocabulario de tema, pendiente de traducción fina al tablero.

### Iconos de categoría
- Esmaltes fijos: Transporte #e8482e, Tecnología #4aa3ff, Vivienda #3ec97e, Vida #f26db6, Día a día #ffb020. Glifo de línea en tinta #14191d (trazo 2, 22 px / 16 px en filas), `aria-hidden`. En hover de fila el esmalte se inclina levemente.

### Marcador de producto (ficha de producto; firma de superficie)
- Composición de `/{país}/{producto}` y `/{país}/precio`, de arriba abajo: placa de identidad (nombre signage 1.875–3 rem uppercase + línea de precio mono con `·` rojos y sellos "precio de referencia de España" azul / "puede estar desfasado" rojo alerta) → marcador gigante (odómetro + unidad ámbar; cola "— X de sueldo entero" en cuerpo y equivalencia "= X" en mono; pila de avisos mono text-xs) → retícula de magnitudes (jornadas manda en celda ámbar; % año con dígito ámbar) + barra del año laboral → bandas de anclas → placas gemelas (modo B: cifra resultado en mono 1.875 rem tabular ámbar | comparador de nóminas: filas `border-base-300 bg-base-100` con cifras mono crema, enlace "pon tu sueldo" en ámbar) → placa de acciones (precio inline, pliegue "Mis datos", otro país + compartir). Recálculo en vivo sin botón: cada tecla persiste en `cet:v1` y sincroniza la URL.
- Frontera honesta: la barra del año laboral reutilizada conserva vestimenta genérica (`rounded-box`, `border-base-content/20`, título en cuerpo bold) y el skeleton previo a hidratación es el `skeleton` de daisyUI (`h-[32rem]`) — pendientes de convertir al vocabulario del tablero.

### Ficha de país (firma de superficie)
- Composición de `/{país}`: placa de identidad (mono micro-etiqueta "OPERANDO CON", nombre signage 2.25–3.75 rem uppercase, línea de datos mono con `·` rojos y badge de caducidad) → hora de referencia a flaps con unidad ámbar "€ / hora" → retícula del país (jornada semanal manda en celda ámbar; jornada diaria y horas reales al año en carbón; nota mono cuando la jornada ≠ 40 h) → placas gemelas ("Tu tipo de cambio" con UserForm | "Esta cosa cuesta" con PriceInput y CTA rojo) → "La pizarra de {país}" (catálogo cotizado en build time agrupado por categoría con esmaltes de 2.25 rem y filas `.board-row` reempleadas) → navlink "Método". País sin mediana: placa de alerta `role="alert"` en vocabulario de placa.

## Do's and Don'ts

### Do:
- **Do** cotizar toda cifra en Chivo Mono (ámbar si es el valor de una fila, del héroe o de una banda) y usar `tabular-nums` en columnas.
- **Do** delimitar cada pieza nueva con hairline de 1 px #28332d y, si necesita fondo distinto, usar el escalón #1c231f sobre #151a17.
- **Do** mantener los controles táctiles a ≥ 2.75 rem (44 px) de alto y el foco visible en ámbar (`outline 2px, offset 2px`).
- **Do** dar a todo movimiento un apagado en `@media (prefers-reduced-motion: reduce)` — el patrón ya existe para ticker, pulso, flap, caret y micro-estados.
- **Do** usar la voz signage en uppercase para todo lo que "anuncia" y dejar los números nunca en signage fuera del odómetro.
- **Do** marcar estados con sellos `.board-stamp` (detectado/elección/datos propios/ref. España/precio de referencia/desfasado) en vez de inventar badges nuevos.
- **Do** montar nuevas retículas con `.board-cell`: una sola celda ámbar por retícula (la que manda, relleno ámbar + tinta glifo), tasas con dígito ámbar, el resto crema sobre carbón.
- **Do** usar unidades honestas con singular en las cotizaciones ("1 minuto", "1 hora", "jornadas") y "menos de un X" cuando el recuento cae por debajo de 1.

### Don't:
- **Don't** usar gradientes, glow ni sombras de elevación; la única sombra legítima es el pliegue del flap.
- **Don't** introducir una cuarta voz tipográfica ni usar el mono para párrafos o el grotesco para cifras.
- **Don't** pintar datos en rojo señal: el rojo es acción (CTA) y puntuación; los datos van en ámbar, y las alertas de texto pequeño en el rojo alerta #f2664f.
- **Don't** animar en bucle nada aparte del ticker y del pulso "En vivo"; la rodada del flap es única por llegada, y los micro-estados no pasan de 160 ms.
- **Don't** radiar placas, filas, celdas o CTA (esquina viva); el radio de 4 px es solo de controles.
- **Don't** tomar `/metodo` o el 404 como referencia de estilo: aún conservan estructura daisyUI genérica sobre el tema y están pendientes de rediseño al vocabulario del tablero (igual que la barra del año laboral, el skeleton y el toast dentro de las fichas).
