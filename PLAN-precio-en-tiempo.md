# PLAN — Coste en tiempo (precio-en-tiempo)

Plan derivado de `SPEC-precio-en-tiempo.md` (en la raíz del repo). El SPEC es la autoridad vinculante; este plan lo descompone en tareas ejecutables por subagentes. Si un detalle no está aquí, está en el SPEC.

## Contexto global

- Repo: proyecto Astro 7 + Tailwind 4 (`@tailwindcss/vite`) + daisyUI 5 + adaptador `@astrojs/cloudflare`. **Preact NO está instalado aún** (Task 0 lo instala).
- Producto: "Coste en tiempo" — el precio de las cosas medido en horas de trabajo. 100 % estático, cálculo en cliente, sin backend/BD/auth.
- Idioma UI: español. Copy centralizado en `src/i18n/es.ts`.
- Rama de trabajo: `precio-en-tiempo`. Los implementadores commitean en esta rama.
- Verificación sin Vitest (no instalar test runner): `npx tsc --noEmit`, `npm run build`, y scripts node ad-hoc con `node --experimental-strip-types` para el motor.
- Dev server (solo si hace falta verificar UI): `astro dev --background` (ver AGENTS.md).
- Nombres de código en inglés; copy UI en español. Sin comentarios de código salvo que se pidan.
- Prohibido: SQLite/D1/auth/API routes/Recharts-D3-Chart.js/librerías extra no listadas. No `export const prerender = true` disperso: se usa `output: 'static'`.

## Task 0 — Setup del stack

Instalar y configurar el mínimo del SPEC sección 2:

1. `pnpm add @astrojs/preact preact` (con pnpm, el repo usa pnpm-workspace).
2. `astro.config.mjs`: añadir integración `preact()` y fijar `output: 'static'` (SPEC §2 Regla Cloudflare Pages). Mantener el plugin tailwind vite y el adaptador cloudflare. Si el build falla por `wrangler.jsonc` (apunta `main` a un entrypoint server que con output static no existe), ajustar wrangler.jsonc para deploy estático de Pages (assets.directory `./dist` sin `main`), documentando el cambio en el report.
3. `src/styles/global.css`: `@import "tailwindcss"; @plugin "daisyui";` (daisyUI 5 es plugin de Tailwind 4). Tema claro por defecto.
4. Crear `src/layouts/BaseLayout.astro` completo y definitivo: `lang="es"`, props `title`, `description`, meta OG básicos (og:title, og:description, og:type website), favicon, navbar daisyUI con nombre "Coste en tiempo" (link `/`) y link `/metodo`, `<slot />`, footer daisyUI con el texto legal EXACTO del SPEC §16 (las 5 líneas) y link a `/metodo`. Navbar/footer se reutilizan en todas las páginas; el copy viaja desde `src/i18n/es.ts` si ya existe, si no, strings literales que Task 1 migrará (aceptable dejar literales aquí).
5. Reemplazar `src/pages/index.astro` por un placeholder mínimo que use BaseLayout (Task 3 lo construye de verdad).
6. Verificar: `npx tsc --noEmit` (sin errores de tipos) y `npm run build` termina y produce `dist/` estático (index.html dentro). Reportar qué salió.

Fuera de alcance: todo lo demás.

## Task 1 — Motor de cálculo, tipos, utils e i18n

Implementar SPEC §8 (fórmulas EXACTAS), §7 (tipos) y §15 (copy). Sin Preact, módulos puros.

Archivos (SPEC §14):
- `src/lib/calc.ts`: constantes `WEEKS_PER_YEAR=52, MONTHS_PER_YEAR=12, WEEKS_PER_MONTH=52/12, STANDARD_DAY_HOURS=8`; tipo `CalcInput`; función `calc(input: CalcInput)` devolviendo: `hourlyWage, hours, workdays8h, weeks, monthsFullPay, yearsFullPay, monthsSaving, pctRealYear, yearsLeft, pctCareerLeft` según las fórmulas EXACTAS del SPEC §8 (única fuente de verdad). Validación: `price>0`, `netMonthly>0`, `weeklyHours` entre 1 y 80 (lanzar o devolver null — decisión documentada; se recomienda lanzar `CalcError` y que la UI capture).
- `src/lib/format.ts`: redondeos EXACTOS del SPEC §8 (tabla): `€/hora` 2 dec si <20 / 1 dec si ≥20; horas entero; jornadas/semanas 1 dec si <10, entero si ≥10; meses/años 1 dec; % entero si ≥2, 1 dec si <2; minutos entero. Y `formatHumanDuration(hours, workdays8h, monthsFullPay, yearsFullPay)` con la prioridad EXACTA del SPEC §8 + tabla de atajos (1.4–1.7→"año y medio", 0.9–1.15→"un año", 2.4–2.7→"dos años y medio", 11–13 meses→"un año", "un día y pico", "casi dos meses"). Y `heroUnit(workdays8h, monthsFullPay)` → `{ unit: 'jornadas'|'meses'|'años' }` según SPEC §8 Unidad hero.
- `src/lib/types.ts`: tipos `Country`, `ProductPrice`, `Product`, `UserState` EXACTOS del SPEC §7.
- `src/lib/selectors.ts`: `getCountry(countries, code)`, `getCountryBySlug(countries, slug)`, `getProduct(products, id)`, `getProductPrice(product, countryCode)` (con fallback a `ES` etiquetado convertido), `effectiveNetMonthly(country, userState)`, `effectiveWeeklyHours(country, userState)`, `effectivePrice(product, country, userState)`.
- `src/lib/urls.ts`: build/parse de la URL compartible del SPEC §7: `/es/espana/tesla-model-3?neto=2400&horas=40&ahorro=300&edad=32&precio=33365` (params: `neto`, `horas`, `ahorro`, `edad`, `precio`, `nombre`; también `pais` para comparación). `parseUserStateFromQuery(searchParams)` devuelve parcial de `UserState` validado y saneado.
- `src/lib/storage.ts`: load/save en `localStorage` clave `cet:v1` (SPEC §7), tolerante a JSON corrupto (try/catch → null).
- `src/i18n/es.ts`: objeto con TODO el copy de UI: promesa "El precio de las cosas, medido en tu tiempo.", subtítulo, "Prefiero poner mi sueldo", "Sueldo de referencia de este país", "Tu hora vale {n}" (función), "Sueldo entero (techo teórico)", "Si apartas {n} al mes" (función), "Nadie destina el 100 % del sueldo a una sola cosa.", "Cálculo de esfuerzo laboral, no de si deberías comprarlo.", "Cambia el precio si el tuyo es otro.", "Esto asume que no comes ni pagas piso.", labels de edad (incluido "Tu edad (opcional, para el contexto de vida laboral)"), 404 país sin salario, pie legal completo del SPEC §16, textos de las 4 reglas de copy de edad del SPEC §6 (como funciones parametrizadas: `ageLine(edad, fraseAnios, pct, aniosRestantes)`, `ageLineSmall(pct, aniosRestantes)`, `ageLinePastRetirement(edad)`), texto compartido ejemplo (SPEC §12) como builder.

Verificación OBLIGATORIA (SPEC §9 "Comprobación del motor"): script temporal `/tmp/opencode/check-calc.mjs` (NO en el repo) que importe calc+format con `node --experimental-strip-types` y afirme con neto 1800, 40h, precio 33365: €/hora ≈ 10.38, horas ≈ 3213, jornadas ≈ 402, meses ≈ 18.5, años ≈ 1.5, ahorro 300 → 111 meses ≈ 9.3 años, edad 32/jub 67 → yearsLeft 35, pctCareerLeft ≈ 4.3. Pegar salida en el report. Borrar el archivo temporal después. `npx tsc --noEmit` limpio. Commit.

## Task 2 — Datos seed JSON

Crear SPEC §7 y §9 EXACTOS:

- `src/data/countries.json`: 12 países (ES, PT, FR, DE, IT, GB, US, MX, AR, CO, CL, CH) con el shape `Country` del SPEC §7. **ES EXACTO al JSON del SPEC §9** (medianNetMonthly 1800, realAnnualHours 1633, retirementAge 67, salariesUpdatedAt "2026-08", etc.). Resto: rellenar con valores razonables y `salariesSource`/`hoursSource` honestos tipo "Referencia de producto, orientativa". Si un salario no es fiable → `medianNetMonthly: null` (el país NO se oculta). Slugs en español sin tilde: espana, portugal, francia, alemania, italia, reino-unido, estados-unidos, mexico, argentina, colombia, chile, suiza. Moneda: EUR para ES/PT/FR/DE/IT; GBP GB; USD US; MXN MX; ARS AR; COP CO; CLP CL; CHF CH. Con currencySymbol correcto. `legalWeeklyHours`/`legalDailyHours` plausibles (40/8 la mayoría; documentar si no). `retirementAge` 67 default salario países con edad legal distinta razonable.
- `src/data/products.json`: TODOS los ítems del SPEC §9 con sus precios ES: café 1.5, menú 14, cesta semanal 80, Netflix anual 130, gimnasio anual 360 (categoría dia-a-dia); iPhone 1000, portátil 900, televisor 500, auriculares 250 (tecnologia); abono mensual 55, bici urbana 400, Dacia Sandero 14000, compacto 22000, Tesla Model 3 33365 (transporte; Tesla EXACTO al JSON del SPEC §9 con origin local); habitación 450, alquiler 1-2 hab 900, entrada 20% piso 40000 (vivienda); viaje 7 días 1200, boda 8000, máster 8000, reformar cocina 12000 (vida). Cada precio con `date: "2026-08"`, `note` orientativa ("editable"), `source: "Referencia de producto"`, `origin: "local"`. `visible: true` en todos. ids kebab-case: cafe, menu-del-dia, cesta-semanal, netflix-anual, gimnasio-anual, iphone, portatil, televisor, auriculares, abono-transporte, bici-urbana, dacia-sandero, coche-compacto, tesla-model-3, habitacion-alquiler, alquiler-piso, entrada-piso, viaje-7-dias, boda, master, reformar-cocina. names/shortNames en español natural.
- `src/data/anchors.json`: anclas por país para la ficha de resultado (SPEC §10: café / iPhone / alquiler del país). Shape: `{ "ES": { "cafe": 1.5, "iphone": 1000, "alquiler": 900 }, ... }` — al menos ES completo; resto países puede reutilizar o null si no hay.
- Validación: escribir un script node temporal (en /tmp, no en repo) que importe los 3 JSON y verifique shape mínimo (claves, tipos, que ES existe, que todos los products tienen prices.ES). Salida en el report. `npx tsc --noEmit` sigue limpio. Commit.

## Task 3 — Home

Home (SPEC §10 estructura, móvil primero, sin scroll infinito) en `src/pages/index.astro`:

1. Nombre + promesa + subtítulo (de i18n/es.ts).
2. Isla Preact `CountryPicker` (`src/components/preact/CountryPicker.tsx`, `client:load`): select daisyUI de países (datos importados estáticamente al island), navega con `location.href = \`/${slug}\``. Hidratar SOLO el selector.
3. Link texto "Prefiero poner mi sueldo" → `/espana/precio` (ruling: España por defecto; el usuario puede cambiar país después en la ficha).
4. Ejemplo ya calculado en BUILD TIME con `calc.ts` + datos ES + Tesla (importar calc y JSON en el frontmatter, renderizar el string con `formatHumanDuration` + hero unit — PROHIBIDO hardcodear "371" o cualquier número que deba venir del motor).
5. Pie: link a /metodo + aviso legal corto ("Cálculo de esfuerzo laboral, no de si deberías comprarlo.").
6. Home estática: nada de SSR del sueldo, sin islas innecesarias.

daisyUI: card, hero text grande (`text-5xl md:text-6xl font-bold tabular-nums` en números), btn. Verificación: `npm run build` OK; inspeccionar `dist/index.html` contiene el ejemplo calculado correcto (número hero "jornadas" para Tesla 402 aprox). Commit.

## Task 4 — Página de país + precio libre

- `src/pages/[country]/index.astro` (SPEC §10 "País"): `getStaticPaths` desde countries.json por slug. Ficha: nombre, €/hora de referencia del país (calculado en build con calc), jornada, horas reales si hay, fecha de datos + fuente. Toggle daisyUI "dato del país / mis datos" (collapse) que renderiza el UserForm island (`src/components/preact/UserForm.tsx` con props país, estado inicial de localStorage leído en cliente). Campo "esta cosa cuesta" + nombre opcional: isla `PriceInput` (`src/components/preact/PriceInput.tsx`, `client:visible` o `client:load`) → navega a `/${slug}/precio?precio=&nombre=`. Catálogo por categorías en cards daisyUI (agrupar por `category` con labels ES: vivienda, transporte, tecnologia, dia-a-dia, vida). Si país sin salario (medianNetMonthly null): NO ocultar la ficha; CTA pidiendo sueldo + copy 404 país sin salario de i18n. Link a /metodo. Productos sin precio para ese país: card con CTA "pon el precio en tu moneda" que va a /{slug}/precio?nombre=... (SPEC §20).
- `src/pages/[country]/precio.astro`: página shell que renderiza `ResultView` island `client:load` con props país + (producto null → precio libre). El ResultView en sí es Task 5; en Task 4 se crea `ResultView.tsx` como stub funcional mínimo (hero + frase + desglose básico + PriceInput inline para cambiar precio) para que la página /precio ya funcione de punta a punta; Task 5 lo completa. Declarar el stub en el report.
- `src/pages/[country]/[product].astro` también en Task 5 (si Task 4 quiere crear el getStaticPaths shell, puede, pero la isla completa es Task 5).
Verificación: build estático genera una página por país (12) + precio (12). `npx tsc --noEmit` limpio. Commit.

## Task 5 — ResultView completa (hero, desglose, A/B, barra, anclas) + UserForm

SPEC §10 "Resultado" y §11. La isla `ResultView.tsx` (`client:load`) es el corazón:

1. **Hero** unidad automática con `heroUnit()`: texto gigante `text-5xl md:text-6xl font-bold tabular-nums` (jornadas → meses → años según SPEC §8). Subhero SIEMPRE: siguiente unidad + frase de modo B si hay ahorro.
2. Frase humana con `formatHumanDuration`.
3. Disclaimer fijo bajo el resultado: "Cálculo de esfuerzo laboral, no de si deberías comprarlo." + modo A: "Nadie destina el 100 % del sueldo a una sola cosa." + "Esto asume que no comes ni pagas piso." cuando aplique modo A.
4. **Desglose**: horas, jornadas 8h, semanas, meses de sueldo entero, años de sueldo entero, % del año laboral real si `realAnnualHours` existe (formato según reglas).
5. **Modo B**: si no hay ahorro, input inline "¿Cuánto apartas al mes?" → meses/años calendario. Si hay, mostrar resultado directo. Label "Si apartas {n} al mes".
6. **YearBar** (`src/components/preact/YearBar.tsx`): SPEC §11 — rectángulo = 1 año laboral (relleno = min(1, yearsFullPay)); si yearsFullPay > 1, N barras o una + texto "desborda a {n} años". SVG o divs, sin librería.
7. **Anclas**: café / iPhone / alquiler del país desde anchors.json → cuántas unidades equivalen al producto (ej: "equivale a 2000 cafés") o cuántas horas representa cada ancla.
8. **Acciones**: cambiar precio (PriceInput inline), mis datos (UserForm en collapse/drawer), otro país (CountryPicker compacto), compartir (botón que Task 6 completa; stub de copiado de URL hoy).
9. **UserForm** (`src/components/preact/UserForm.tsx`): neto mensual, horas/semana, ahorro mensual (opcional), campos numericos daisyUI con labels reales; resumen en vivo "Tu hora vale Y €" (formato €/hora). Recálculo EN VIVO sin botón Calcular (SPEC §4.7, §19).
10. **Estado**: al montar, leer `localStorage cet:v1` y query params (query params PISAN a localStorage); al cambiar campos, persistir y actualizar la URL con history.replaceState usando `urls.ts`. Cambiar neto 1800→2400 recalcula en vivo (criterio de aceptación 3).
11. `/[country]/[product].astro`: getStaticPaths (país × producto con precio visible), renderiza ResultView con el producto.
12. Precio con `origin: "converted"` (fallback ES): badge + aviso "precio de referencia de España convertido" (SPEC §7).

Verificación: build OK, hidratación OK (via astro dev --background: cargar /espana/tesla-model-3, cambiar valor, comprobar recálculo; o al menos validar el flujo por inspección del HTML+JS). `npx tsc --noEmit` limpio. Commit.

## Task 6 — Edad + Compartir

- **Línea de edad** (SPEC §6 EXACTO): en ResultView, SOLO si `edad` presente (entero 16–80, si no ignorar). Aparece UNA línea sutil bajo el disclaimer del modo A: `text-sm opacity-80`, sin número hero. Copy según los 4 casos del SPEC §6 (funciones ya en i18n). `aniosSueldoEntero` (= yearsFullPay modo A) redactado como "vida trabajando" con `fraseAnios` de formatHumanDuration; `aniosRestantesTrabajo = max(0, retirementAge - edad)`; `pct = (aniosSueldoEntero / aniosRestantes) * 100`. Casos: sin edad → no pintar; edad fuera de rango → ignorar; yearsLeft ≤ 0 → frase "la edad de jubilación de referencia de este país ya quedó atrás"; yearsFullPay < 0.05 → no pintar; pct < 1 → "menos de un 1 % de los {n} años laborales de referencia"; default → frase completa. PROHIBIDO: esperanza de vida, "te quedan X años de vida", semáforos, comparaciones generacionales.
- **ShareButton** (SPEC §12): botón daisyUI que construye URL canónica con `urls.ts` (params actuales); `navigator.share` si existe; si no `navigator.clipboard.writeText` + toast daisyUI ("Enlace copiado"). Texto compartido builder de i18n (formato SPEC §12 con nombre producto · país, hero, frase años, línea edad si hay, dominio).
- Añadir campo edad al UserForm si no quedó ya (label EXACTO "Tu edad (opcional, para el contexto de vida laboral)"), persistir en storage + URL (`edad`).
- Verificación: build + flujo manual: con edad 32 → línea visible con ~1,5 años y ~4 % de 35 años; sin edad → no aparece (criterios 6-7). Commit.

## Task 7 — /metodo + 404

- `src/pages/metodo.astro` (SPEC §13): contenido completo EN ESPAÑOL con el tono del producto (seco, claro, un poco ingenioso, cero moralina), cubriendo TODOS los puntos: qué medimos, neto vs bruto / mediano vs medio, convención Hs × 52/12, jornada 8h vs horas reales, modo A vs modo B, edad (vida laboral hasta jubilación de referencia, NO esperanza de vida), qué NO medimos, caducidad (> 18 meses → badge "puede estar desfasado" — implementar también el badge en ficha de país/resultado si un dato tiene >18 meses), fuentes genéricas, privacidad (cálculo en el dispositivo). Prosa real, no bullets vacíos.
- `src/pages/404.astro`: página 404 con tono del producto, link a home y a /espana/precio. Copy i18n.
- Badge "puede estar desfasado" en ficha de país y resultado cuando `salariesUpdatedAt`/`date` del precio tenga > 18 meses respecto a hoy (fecha fija de build aceptable; documentar decisión).
- Verificación: build genera /metodo/index.html y 404.html; `npx tsc --noEmit` limpio. Commit.

## Task 8 — Comparador 2 países + pulido final

- **CompareStrip** (`src/components/preact/CompareStrip.tsx`, SPEC §5 + §14): en ResultView, seleccionar un 2º país y "tú" (datos del usuario) para comparar el MISMO precio: cuántas horas/meses/años cuesta en país A vs B vs tú. Solo si cabe sin ensuciar (SPEC permite v1.1; renderizado compacto, una fila por sujeto). Usar precios convertidos con aviso si el país B no tiene precio local.
- Pulido daisyUI (SPEC §11): temas, contraste, tipografía tabular-nums en todos los números grandes, estados vacíos, alert daisyUI para avisos origin converted, joins para inputs.
- Criterios de aceptación SPEC §17: recorrerlos TODOS (1-14) uno a uno y documentar evidencia de cada uno en el report (build exitoso, flujo en dev, inspección). Especialmente: 11 (sin llamadas de red al calcular — verificar con devtools network que solo cargan assets estáticos), 12 (sin SQLite/API/login), 14 (ejemplo home desde calc.ts).
- `npx tsc --noEmit` limpio + `npm run build` limpio. Commit.
