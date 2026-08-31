# SPEC DE IMPLEMENTACIÓN — Precio en tiempo
## Documento para agente de programación (OpenCode / DeepSeek)

**Idioma del producto:** español  
**Fecha del spec:** 2026-08-30  
**Estado del repo:** el proyecto base YA EXISTE. No reinstalar Astro ni las integraciones. Trabajar sobre lo que hay.

---

## 0. Qué tienes que hacer tú (agente)

Construir el producto descrito aquí sobre el proyecto Astro ya creado.

No reinventar el stack. No añadir backend. No añadir SQLite. No añadir autenticación. No añadir CMS. No añadir analytics pesado. No generar páginas SSR salvo que el adaptador de Cloudflare ya esté y alguna ruta lo exija: **el sitio debe poder desplegarse en Cloudflare Pages como sitio estático (prerender de todas las páginas)**. Toda la lógica de cálculo corre en el cliente.

Si algo del documento original de producto choca con esta spec, **gana esta spec**.

---

## 1. Veredicto sobre el documento original

El documento de producto es **correcto conceptualmente** y se puede construir. Hay que corregir o clavar esto:

| Punto | Problema | Decisión cerrada |
| --- | --- | --- |
| Horas/mes | Oscilaba entre 160 y `Hs × 4,33` | Cálculo interno: `Hs × 52 / 12` (≈ 4,333…). Texto de ayuda: si `Hs = 40`, “unas 173 h/mes”. No usar 160 en la fórmula. |
| Hero number | Ambiguo | Regla automática (sección 8). |
| Precio Tesla / salarios | Cifras de ejemplo, no sagradas | Van en JSON con `fecha` y `fuente`. Editables en UI. |
| Comparar países con el mismo € | Trampa si no hay precio local | Bandera `precioOrigen: "local" \| "convertido" \| "usuario"`. |
| Persistencia | “Sesión” | `localStorage` + query params. Sin cuenta. |
| BD | El original lo deja abierto | **No SQLite.** Datos en `/src/data/*.json`. |
| Preact | “si hace falta” | Sí hace falta: calculadora, campos, comparador, barra. Islas Preact. Páginas y layout en `.astro`. |
| Edad | Faltaba | Campo opcional. Línea sutil de “años de vida trabajando” + % de vida laboral restante. Nunca morbididad. |

El resto del original (tono, modos A/B, catálogo pequeño, método público, no sermonear) se mantiene.

---

## 2. Stack (obligatorio, no negociar)

Ya instalado. Usar esto y nada más salvo que falte un paquete mínimo:

- Astro **última ya presente en el repo** (rama 7.x a fecha de este spec)
- Tailwind CSS
- daisyUI
- Preact (`@astrojs/preact`) solo en islas `client:load` / `client:visible`
- Adaptador `@astrojs/cloudflare` ya añadido
- TypeScript
- Sin React, Vue, Svelte, auth, ORM, API routes, cookies de tracking

### Regla Cloudflare Pages

```js
// astro.config — objetivo
output: 'static'   // preferido
```

Si el adaptador está en modo `server`, forzar prerender en **todas** las páginas:

```ts
export const prerender = true;
```

No usar server functions, KV, D1 ni Durable Objects en el MVP. El adaptador existe solo para el deploy a Pages.

### Cuándo sí usar Preact

- Selector de país
- Formulario “mis datos” (neto, horas, ahorro, edad)
- Campo de precio libre
- Resultado reactivo (hero, desglose, modos A/B, barra, frase de edad)
- Comparador de 2 países
- Botón compartir (copiar URL / Web Share API)

### Cuándo NO usar Preact

- Home estática de marketing (puede hidratar solo el selector)
- Página `/metodo`
- Layout, footer, 404
- Listado de catálogo renderizado en Astro; el click abre resultado o hidrata la isla

---

## 3. Nombre provisional del producto

Usar en UI y `<title>` hasta que el humano elija otro:

**Nombre:** Coste en tiempo  
**Dominio conceptual:** costeentiempo  
**Promesa:** El precio de las cosas, medido en tu tiempo.  
**Subtítulo:** Elige un país o pon tu sueldo. Elige una cosa. Te decimos cuántas horas de trabajo representa.

No bloquear el código por el nombre. Extraer strings a `src/i18n/es.ts`.

---

## 4. Principios que el código debe respetar

1. Una idea, una pantalla principal.
2. Primero la frase humana, después el desglose numérico.
3. País = atajo. Datos del usuario = verdad.
4. Modo A (100 % del sueldo) siempre con disclaimer visible.
5. Modo B (ahorro mensual) visible desde el primer resultado, no escondido en un tab lejano.
6. Edad: opcional, sutil, nunca hero, nunca “te quedan X años de vida”.
7. Cálculo 100 % en cliente. No se envía el sueldo a ningún servidor.
8. Números redondeados con criterio (sección 8). No 7 decimales.
9. Tono seco, claro, un poco ingenioso. Cero moralina.
10. Accesible: contraste daisyUI, labels reales, hero en texto no solo color.

Frases fijas:

- Bajo cada resultado grande: `Cálculo de esfuerzo laboral, no de si deberías comprarlo.`
- En modo A: `Nadie destina el 100 % del sueldo a una sola cosa.`
- Pie legal: ver sección 16.

---

## 5. Funcionalidad MVP (construir esto, no más)

### Incluido

- Home
- Ficha de país + catálogo
- Precio libre (nombre opcional + importe)
- Resultado con hero, desglose, modo A y modo B, barra de año, anclas
- Mis datos: neto mensual, horas/semana, ahorro mensual, **edad**
- Persistencia local + URL compartible
- Página `/metodo`
- 404 / país sin salario (“pon tu sueldo y el precio”)
- 1 país perfecto (España) + el resto de países del JSON aunque los precios sean incompletos
- Comparador simple 2 países + “tú” (puede ser v1.1 si el tiempo aprieta; si cabe sin ensuciar, incluirlo)

### Explicitamente fuera del MVP

- Cuentas de usuario
- SQLite / D1
- Impuestos exactos por CCAA
- Intereses, TCO, depreciación
- Histórico 2016 vs ahora
- PPP
- i18n real (solo estructura preparada en `es.ts`)
- App nativa
- Generación de imagen OG en servidor (la URL basta; opcional canvas en cliente si es barato)

---

## 6. Feature nueva: edad y “años de vida trabajando”

### Intención de producto

Si el usuario pone su edad, debajo del triplete clásico (jornadas / sueldo entero / ahorro) aparece **una sola línea sutil**, no un panel nuevo:

> A tus 32 años, un Tesla Model 3 son **1,5 años de vida trabajando** — cerca del **4 %** de los 35 años laborales que te quedan.

Eso es lo que el usuario pidió con el ejemplo “un Tesla cuesta 3 años de vida trabajando”. No es esperanza de vida. No es un reloj de la muerte. Es **tiempo de vida laboral**.

### Campos

- `edad`: number opcional, entero 16–80. Vacío = no se muestra el bloque.
- `edadJubilacion` del país (dato JSON). Default mundial si falta: `67`.
- El usuario NO edita la edad de jubilación en el MVP (evita ruido). Queda en método: “usamos la edad legal ordinaria de referencia del país”.

### Fórmulas de esta feature

Sea:

- `aniosSueldoEntero = P / (N * 12)`  → ya existía (modo A)
- `aniosRestantesTrabajo = max(0, edadJubilacion - edad)`
- `pctVidaLaboralRestante = aniosRestantesTrabajo > 0 ? (aniosSueldoEntero / aniosRestantesTrabajo) * 100 : null`

La cifra “años de vida trabajando” **es** `aniosSueldoEntero` (modo A), redactada como vida laboral. No inventar otra unidad.

Modo B no se usa para esta frase. Mezclar ahorro con “años de vida” confunde. Si se quiere una segunda línea más adelante: “ahorrando A €/mes, X años de calendario”, ya existe en modo B.

### Copy según casos

```
si no hay edad → no pintar el bloque
si edad < 16 o > 80 → ignorar
si aniosRestantesTrabajo <= 0 →
  "A tus {edad} años usamos solo el esfuerzo en horas y sueldo; la edad de jubilación de referencia de este país ya quedó atrás."
si aniosSueldoEntero < 0.05 → no pintar (compra minúscula)
si pct < 1 →
  "A tus {edad} años, esto es menos de un 1 % de los {aniosRestantes} años laborales de referencia que quedan."
default →
  "A tus {edad} años, esto son {fraseAnios} de vida trabajando — cerca del {pct}% de los {aniosRestantes} años laborales que te quedan."
```

`fraseAnios` usa el redondeo humano de la sección 8 (año y medio, tres años, cuatro meses…).

### Tono prohibido

- “Te quedan 40 años de vida”
- Esperanza de vida, mortalidad, “porcentaje de tu existencia”
- Semáforos rojo/verde que juzguen la compra
- Comparar “tú vs un joven de 20”

Visual: texto `text-sm opacity-80`, sin número hero. Puede ir bajo el disclaimer del modo A.

---

## 7. Modelo de datos (JSON, sin BD)

Archivos:

```
src/data/countries.json
src/data/products.json
src/data/anchors.json   // anclas de comparación por país (cafe, menu, iphone, alquiler)
```

### País

```ts
export type Country = {
  code: string;                 // "ES"
  name: string;                 // "España"
  slug: string;                 // "espana"
  currency: string;             // "EUR"
  currencySymbol: string;       // "€"
  legalWeeklyHours: number;     // 40
  legalDailyHours: number;      // 8
  realAnnualHours: number | null;
  medianNetMonthly: number | null;
  meanNetMonthly: number | null;
  minWageMonthly: number | null;
  retirementAge: number;        // ES: 67 (referencia de producto, no el calendario fino 66y10m)
  salariesUpdatedAt: string;    // "2026-05"
  salariesSource: string;
  hoursUpdatedAt: string;
  hoursSource: string;
  informalityNote: string | null;
};
```

### Producto

```ts
export type ProductPrice = {
  value: number;
  date: string;
  note: string;
  source: string;
  origin: "local" | "converted";
};

export type Product = {
  id: string;                   // "tesla-model-3"
  name: string;
  shortName: string;
  category: "vivienda" | "transporte" | "tecnologia" | "dia-a-dia" | "vida";
  prices: Record<string, ProductPrice>; // key = country code
  visible: boolean;
};
```

Si un país no tiene precio para un producto, la UI deja escribirlo o reutiliza el precio ES etiquetado `origin: "converted"` + aviso.

### Estado de usuario (no se persiste en servidor)

```ts
export type UserState = {
  countryCode: string;
  netMonthly: number | null;      // null = usar mediano del país
  weeklyHours: number | null;     // null = jornada legal del país
  monthlySavings: number | null;
  age: number | null;
  priceOverride: number | null;
  productId: string | null;
  customLabel: string | null;
  compareCountryCode: string | null;
};
```

Guardar en `localStorage` clave `cet:v1`.  
Sincronizar lo relevante a la URL:

```
/es/espana/tesla-model-3?neto=2400&horas=40&ahorro=300&edad=32&precio=33365
```

Al cargar una URL con params, esos valores pisan localStorage para esa visita (así el share funciona).

---

## 8. Motor de cálculo (`src/lib/calc.ts`)

Módulo puro, sin Preact. Cubrir con tests si el repo ya tiene Vitest; si no, no instalar test runner solo por esto. Funciones documentadas.

### Constantes

```ts
export const WEEKS_PER_YEAR = 52;
export const MONTHS_PER_YEAR = 12;
export const WEEKS_PER_MONTH = WEEKS_PER_YEAR / MONTHS_PER_YEAR; // 4.333...
export const STANDARD_DAY_HOURS = 8;
```

### Entradas

```ts
export type CalcInput = {
  price: number;
  netMonthly: number;
  weeklyHours: number;
  realAnnualHours: number | null;
  monthlySavings: number | null;
  age: number | null;
  retirementAge: number;
};
```

### Fórmulas (única fuente de verdad)

```
hourlyWage     = netMonthly / (weeklyHours * WEEKS_PER_MONTH)
hours          = price / hourlyWage
workdays8h     = hours / 8
weeks          = hours / weeklyHours
monthsFullPay  = price / netMonthly
yearsFullPay   = price / (netMonthly * 12)
monthsSaving   = monthlySavings > 0 ? price / monthlySavings : null
pctRealYear    = realAnnualHours ? (hours / realAnnualHours) * 100 : null
yearsLeft      = age != null ? Math.max(0, retirementAge - age) : null
pctCareerLeft  = yearsLeft && yearsLeft > 0 ? (yearsFullPay / yearsLeft) * 100 : null
```

Validar `price > 0`, `netMonthly > 0`, `weeklyHours` entre 1 y 80.

### Redondeo de cara al usuario

| Magnitud | Regla |
| --- | --- |
| €/hora | 2 decimales si < 20; 1 decimal si ≥ 20 |
| Horas | entero |
| Jornadas | 1 decimal si < 10; entero si ≥ 10 |
| Semanas | 1 decimal si < 10; entero si ≥ 10 |
| Meses | 1 decimal |
| Años | 1 decimal |
| % | entero si ≥ 2; 1 decimal si < 2 |
| Minutos (compras minúsculas) | entero |

### Frase humana (`formatHumanDuration`)

Prioridad:

1. Si horas < 1 → minutos (`unos 8 minutos`)
2. Si workdays8h < 1.5 → `unas X horas`
3. Si workdays8h < 15 → `X jornadas` / `un día y pico`
4. Si monthsFullPay < 2 → semanas o `casi dos meses`
5. Si yearsFullPay < 1.8 → meses (`año y medio` cuando ≈ 1.4–1.7)
6. Si no → `X años`

Tabla de atajos de copy (usar, no improvisar marketing):

- 1.4–1.7 años → “año y medio”
- 0.9–1.15 años → “un año”
- 2.4–2.7 años → “dos años y medio”
- 11–13 meses → “un año”

### Unidad hero (automática)

```
si workdays8h < 15        → hero = jornadas (o horas/minutos)
si monthsFullPay < 24     → hero = meses de sueldo entero
si no                     → hero = años de sueldo entero
```

Subhero siempre: la siguiente unidad y la frase de modo B si hay ahorro.

---

## 9. Datos de semilla (España primero)

Poner cifras **declaradas como referencia de producto**, con fecha. El usuario las puede cambiar.

### España (`ES`) — semilla

Usar estos valores iniciales (ajustables sin tocar fórmulas):

```json
{
  "code": "ES",
  "name": "España",
  "slug": "espana",
  "currency": "EUR",
  "currencySymbol": "€",
  "legalWeeklyHours": 40,
  "legalDailyHours": 8,
  "realAnnualHours": 1633,
  "medianNetMonthly": 1800,
  "meanNetMonthly": null,
  "minWageMonthly": null,
  "retirementAge": 67,
  "salariesUpdatedAt": "2026-08",
  "salariesSource": "Referencia de producto (mediano neto orientativo). Sustituible por el usuario.",
  "hoursUpdatedAt": "2024",
  "hoursSource": "Orden de magnitud OCDE horas anuales reales.",
  "informalityNote": null
}
```

`medianNetMonthly: 1800` es la cifra del documento original de producto. **No presentarla como dato INE oficial.** En la ficha: “sueldo de referencia de esta web, no tu nómina”.

Edad de jubilación de producto = **67** (destino legal ordinario; no modelar 66 años y 10 meses).

### Tesla Model 3 — semilla ES

```json
{
  "id": "tesla-model-3",
  "name": "Tesla Model 3 (acceso)",
  "shortName": "Tesla Model 3",
  "category": "transporte",
  "prices": {
    "ES": {
      "value": 33365,
      "date": "2026-08",
      "note": "Precio de referencia de acceso en oferta reciente. Edítalo.",
      "source": "Referencia de producto",
      "origin": "local"
    }
  },
  "visible": true
}
```

### Comprobación del motor con estos datos

Con neto 1800, 40 h, precio 33365, sin override:

- €/hora = 1800 / (40 × 52/12) ≈ **10,38 €**
- horas ≈ **3213**
- jornadas 8 h ≈ **402**
- meses sueldo entero ≈ **18,5**
- años sueldo entero ≈ **1,5**
- si ahorro 300 € → meses ≈ **111** ≈ **9,3 años**
- si edad 32 y jubilación 67 → 35 años restantes → **~4 %** de la vida laboral restante

Nota: el documento original calculaba con 160 h/mes (11,25 €/h → 371 jornadas). Esa convención **se abandona**. El copy de ejemplo de la UI debe regenerarse con el motor, no hardcodear “371”.

Otros ítems mínimos para España (inventario curado, precios orientativos con nota “editable”):

**Día a día:** café 1.50, menú 14, cesta semanal 80, Netflix anual 130, gimnasio anual 360  
**Tecnología:** iPhone 1000, portátil 900, televisor 500, auriculares 250  
**Transporte:** abono mensual 55, bici urbana 400, Dacia Sandero 14000, compacto 22000, Tesla Model 3 33365  
**Vivienda:** habitación 450, alquiler 1-2 hab ciudad 900, entrada 20 % piso tipo 40000  
**Vida:** viaje 7 días 1200, boda sencilla 8000, máster 8000, reformar cocina 12000  

Completar `prices.ES` para todos. Otros países: al menos salario + jornada + retirementAge; precios pueden faltar.

### Países MVP en el JSON

ES, PT, FR, DE, IT, GB, US, MX, AR, CO, CL, CH.

Si un salario no es fiable, `medianNetMonthly: null` y la ficha pide el sueldo del usuario. El país no se oculta.

---

## 10. Arquitectura de rutas (Astro)

```
src/pages/index.astro
src/pages/metodo.astro
src/pages/404.astro
src/pages/[country]/index.astro          // /espana
src/pages/[country]/[product].astro      // /espana/tesla-model-3
src/pages/[country]/precio.astro         // /espana/precio  (libre)
```

Rutas con `getStaticPaths` desde los JSON. Slug de país en español sin tilde (`espana`, `mexico`, `estados-unidos`).

Query params los lee la isla Preact en el cliente; las páginas .astro no necesitan SSR para eso.

### Home

Estructura visual (móvil primero, sin scroll infinito):

1. Nombre + promesa + subtítulo
2. Isla `CountryPicker`
3. Link texto: “Prefiero poner mi sueldo”
4. Ejemplo ya calculado con datos ES + Tesla (usar `calc.ts` en build time para el string, no hardcodear 371)
5. Pie: método, aviso legal corto

### País `/[country]`

- Ficha: nombre, €/hora de referencia, jornada, horas reales si hay, fecha de datos
- Toggle “dato del país / mis datos” (abre o muestra el formulario)
- Campo “esta cosa cuesta” + nombre opcional → navega a `/[country]/precio?precio=&nombre=`
- Catálogo por categorías (cards daisyUI)
- Link método

### Resultado `/[country]/[product]` y `/[country]/precio`

Isla `ResultView` a `client:load`:

1. Hero (unidad automática)
2. Frase humana
3. Disclaimer fijo
4. Desglose: horas, jornadas, semanas, meses, años, % año real si hay dato
5. Modo B: input ahorro si no está, resultado en meses/años calendario
6. Línea de edad si `edad` existe
7. Barra de año laboral (componente SVG o divs, no librería de charts)
8. Anclas: café / iPhone / alquiler del país
9. Acciones: cambiar precio, mis datos, otro país, compartir

### Mis datos

Puede ser panel en la misma página (preferido, drawer daisyUI o collapse) para no multiplicar pantallas. Campos:

1. Neto al mes
2. Horas a la semana
3. Ahorro al mes (opcional)
4. Edad (opcional, label: “Tu edad (opcional, para el contexto de vida laboral)”)

Resumen en vivo: “Tu hora vale Y €”.

Sin botón Calcular en desktop; en móvil también en vivo.

---

## 11. UI / daisyUI

Tema claro por defecto, opción `data-theme` si daisyUI ya trae dark; no perder el tiempo en un theme custom enorme.

Componentes daisy a usar:

- `navbar`, `footer`, `card`, `btn`, `input`, `select`, `label`, `badge`, `collapse` o `drawer`, `alert`, `join`
- Tipografía grande en el hero (`text-5xl md:text-6xl font-bold tabular-nums`)

Barra de año:

- Un rectángulo = 1 año laboral de referencia (12 meses de sueldo o `realAnnualHours` etiquetado)
- Relleno = `min(1, yearsFullPay)`
- Si `yearsFullPay > 1`, mostrar N barras o una + texto “desborda a {n} años”
- No calendario fotorealista

No instalar Recharts, D3 ni Chart.js.

---

## 12. Compartir

Botón “Compartir” que:

1. Construye la URL canónica con params actuales
2. Si existe `navigator.share`, lo usa
3. Si no, copia al portapapeles y toast daisyUI

Texto compartido ejemplo:

```
Tesla Model 3 · España
402 jornadas de 8 h
Año y medio de sueldo entero
A los 32 años: 1,5 años de vida trabajando
costeentiempo.example
```

No pedir email. No generar imagen en el MVP salvo que Web Share + canvas sea trivial.

---

## 13. Página `/metodo` (contenido obligatorio)

Escribir en español, tono del producto. Cubrir:

- Qué medimos (horas de trabajo para un precio)
- Neto vs bruto, mediano vs medio
- Convención `Hs × 52 / 12`
- Jornada de 8 h vs horas reales anuales
- Modo A vs modo B
- Qué hace la edad (vida laboral restante hasta edad de jubilación de referencia; no esperanza de vida)
- Qué no medimos (intereses, TCO, impuestos finos, felicidad)
- Caducidad: si un dato tiene > 18 meses, badge “puede estar desfasado”
- Fuentes genéricas: INE / oficinas nacionales, OCDE horas, legislación de jornada, configuradores de precio, el usuario
- Privacidad: cálculo en el dispositivo

---

## 14. Estructura de carpetas objetivo

```
src/
  components/
    astro/          # Header, Footer, CountryCard...
    preact/
      CountryPicker.tsx
      UserForm.tsx
      PriceInput.tsx
      ResultView.tsx
      YearBar.tsx
      ShareButton.tsx
      CompareStrip.tsx
  data/
    countries.json
    products.json
    anchors.json
  i18n/
    es.ts
  layouts/
    BaseLayout.astro
  lib/
    calc.ts
    format.ts
    urls.ts
    storage.ts
    selectors.ts      # getCountry, getProductPrice, hourlyWage...
  pages/
    ...
```

Nombres en inglés en código. Copy de UI en `es.ts`.

---

## 15. Copy de UI mínimo (`src/i18n/es.ts`)

Incluir al menos:

- promesa, subtítulo
- “Prefiero poner mi sueldo”
- “Sueldo de referencia de este país”
- “Tu hora vale {n}”
- “Sueldo entero (techo teórico)”
- “Si apartas {n} al mes”
- “Nadie destina el 100 % del sueldo a una sola cosa.”
- “Cálculo de esfuerzo laboral, no de si deberías comprarlo.”
- “Cambia el precio si el tuyo es otro.”
- “Esto asume que no comes ni pagas piso.”
- labels de edad
- 404 país sin salario
- pie legal

---

## 16. Texto legal del pie

```
Esta web ofrece una estimación educativa de esfuerzo laboral.
No es un consejo de compra, ahorro ni inversión.
Los salarios y precios son aproximados y pueden estar desactualizados.
Tú puedes y debes sustituirlos por tus cifras reales.
El cálculo se hace en tu dispositivo. No guardamos tu sueldo ni tu edad.
```

---

## 17. Criterios de aceptación (el agente debe poder tacharlos)

1. `npm run build` termina y genera sitio estático desplegable en Cloudflare Pages.
2. Home carga, se elige España, se entra al Tesla, hay un número hero en < 1 s de hidratación.
3. Cambiar neto de 1800 a 2400 recalcula en vivo.
4. Cambiar precio recalcula en vivo.
5. Con ahorro 300 se ve el modo B en años/meses calendario.
6. Sin edad, no aparece la línea de vida laboral.
7. Con edad 32 aparece la línea sutil con ~1,5 años y un % sobre 35 años.
8. URL con query params reproduce el estado.
9. Precio libre funciona sin producto del catálogo.
10. `/metodo` explica edad, modos y fórmula de horas/mes.
11. No hay llamadas de red al calcular.
12. No hay SQLite, no hay API, no hay login.
13. Lighthouse razonable en móvil: texto grande, botones tappables, contraste.
14. El ejemplo de la home se genera con `calc.ts`, no con “371” hardcodeado.

---

## 18. Orden de implementación (seguir este orden)

1. `src/lib/calc.ts` + `format.ts` + tipos.
2. JSON de países y productos (ES completo; resto esquelético).
3. Layout + home + picker.
4. Página de país + catálogo + precio libre.
5. Isla ResultView (hero, desglose, A/B).
6. UserForm (neto, horas, ahorro) + localStorage + URL.
7. **Edad + línea sutil + copy de casos.**
8. YearBar + anclas.
9. `/metodo` + footer legal + 404.
10. Share.
11. Comparador 2 países si queda limpio.
12. Pulir daisyUI / vacío de datos / avisos `origin: converted`.

No empezar por diseño visual fresa. Primero el motor y el flujo España → Tesla → mis datos → edad.

---

## 19. Lo que NO debes hacer

- No instalar dependencias “por si acaso”.
- No crear un dashboard de economista.
- No rankear países en portada.
- No usar esperanza de vida.
- No moralizar compras.
- No fingir precisión oficial con el 1800 €.
- No poner botón Calcular que oculte el recálculo en vivo.
- No SSR del sueldo del usuario.
- No reescribir el documento de producto en la UI.

---

## 20. Nota para DeepSeek / OpenCode

Este archivo es la especificación. Implementa contra ella.

Si un detalle visual no está definido (spacing, iconos), usa daisyUI por defecto y tipografía del sistema / stack del repo.

Si falta un precio de un país, no bloquees: muestra el producto con CTA “pon el precio en tu moneda / en euros”.

Cuando termines el MVP de las secciones 17.1–17.10, para. No implementes la lista de “después del MVP” del documento original (PPP, histórico, comunidad, profesión).
