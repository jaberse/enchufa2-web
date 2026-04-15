# Fase E — Calculadora como herramienta de decisión (RFC v0)

**Estado:** borrador, sin aprobar
**Fecha:** 2026-04-15
**Autor:** Javi + Cowork
**Contexto previo:** Fase D cerrada (metodología v1, bandas en UI, artículo 008 reescrito, script trimestral). Ver `docs/metodologia-tco.md` y `project_metodologia_tco_v1.md`.

---

## 0. Por qué existe este documento

Hoy un comprador dubitativo — presupuesto acotado, 2-3 candidatos EV y 2-3 candidatos ICE en mente, perfil de carga propio — **no puede tomar su decisión con nuestras herramientas**. Puede leer nuestros pares de ejemplo, aprender y inferir, pero no puede meter sus coches, su mix de carga y su horizonte y obtener una respuesta accionable. El comparador solo tiene BEVs y la calculadora opera sobre 20 pares fijos con un mix de carga hardcoded. Diagnóstico completo de la conversación del 2026-04-15.

Fase E convierte la calculadora en lo que debería ser: una herramienta de decisión, no un escaparate de cálculos ilustrativos. Mantenemos intacta la disciplina metodológica de la Fase D — trazabilidad por campo, bandas de incertidumbre, regla editorial §8.

---

## 1. Principios rectores

1. **El usuario elige sus candidatos.** Abandonamos la lista cerrada de 20 pares. El pipeline TCO ya acepta cualquier BEV × cualquier ICE; lo que hay que soltar es el frontend.
2. **El % de carga en casa es un input de primer nivel**, no un parámetro escondido en `params.mjs`.
3. **El output es direccional, no puntual.** La calculadora responde "¿a partir de cuántos km gana el EV?", no solo "el EV ahorra X €".
4. **Nada de achatarramiento en el filtro de presupuesto.** El Plan Auto+ 2026 no lo contempla. La elegibilidad por ayuda se decide con PVP sin IVA, umbral 45.000 € y las 4 dimensiones EEE.
5. **Nunca publicar un punto sin banda.** §8 metodología sigue vigente: la UI muestra rango, el artículo cita rango.

---

## 2. Los nueve gaps priorizados

Orden por ROI estimado (impacto decisional / esfuerzo).

### E1. Slider "% carga en casa" con presets  [esfuerzo: S, ~1 día]

**Qué:** primer control visible del bloque "Tu uso". Tres presets rápidos (*casa 90 %*, *mixto 60 %*, *sin garaje 20 %*) y un slider fino 0-100. Dentro del bloque pública, separar AC lenta y DC rápida con precios distintos.

**Por qué E1 primero:** es la palanca #1 del resultado y hoy está hardcoded. Cambio minúsculo en código, impacto enorme en utilidad percibida.

**Toca:** `src/lib/tco/params.mjs` (abrir `mix_casa_publica` como parámetro del escenario, no constante), `src/pages/calculadora-tco.astro` (UI + estado + serialización en URL), `src/lib/tco/calculadora.mjs` (recibir el mix y derivar precio_kwh_efectivo).

**Regla §8:** el precio €/kWh efectivo resultante tiene que seguir trayendo su banda. Si la fuente del PVPC valle es `alta` pero la del DC público es `media`, el agregado hereda el peor.

### E2. Selección libre de candidatos  [esfuerzo: M, ~1 semana]

**Qué:** el usuario elige 2-3 BEVs y 2-3 ICEs de la lista completa (63 BEVs + catálogo ICE ampliado, ver E4) y la calculadora los pinta a todos en el mismo gráfico de TCO acumulado, con la misma lógica de bandas por tren.

**Por qué:** es el cambio estructural que convierte la herramienta en tuya. Hoy es nuestra.

**Toca:** frontend sobre todo — `src/pages/calculadora-tco.astro` (reemplazar selector de par por dos listas multi-select con búsqueda, gestionar N×M comparaciones), `src/lib/tco/calculadora.mjs` (iterar múltiples trenes en la misma llamada, devolver array homogéneo), renderChart (soportar N curvas + bandas).

**Watch-out:** con 6 coches × banda superior × banda inferior el chart se satura. Propuesta: línea central + bandas solo al hover del coche activo, resto en opacidad 40 %.

### E3. Catálogo ICE ampliado a ~40 modelos  [esfuerzo: M-L, ~3 semanas, paralelizable]

**Qué:** hoy tenemos 10 `data/referencias/ice-equivalentes/*.json`. Pasamos a ~40 cubriendo los Top ventas España 2025-2026: añadimos los que faltan en A (i10, Picanto, Sandero, 108/C1…), B (Ibiza, 208, Clio, Corsa, 2008…), C (Corolla, Golf, León, 308, Civic, Astra…), C-SUV (Qashqai, C-HR, CX-5, Kuga, Sportage…), D (Mazda 3, A4, Clase 3…). Mismo esquema `specs_tco` que BEVs con `confianza: media` inicial y trazabilidad por campo.

**Por qué:** sin esto E2 es un cascarón; el usuario llegará queriendo meter su Mazda 3 y no estará. Paralelizable entre Javi y Jose.

**Toca:** `data/referencias/ice-equivalentes/*.json` nuevos, `scripts/data-pipeline/audit.mjs` ampliando la cobertura ICE, posible `data/referencias/ice-catalogo.md` como índice vivo.

### E4. Presupuesto como filtro automático  [esfuerzo: S, ~2 días, requiere E2]

**Qué:** campo "tu presupuesto (€)" en los controles. La calculadora calcula por cada candidato el precio neto tras ayuda Plan Auto+ (`pvp_total_eur − ayuda_plan_auto_eur`) y marca en gris los que se salen. Si el usuario sobrescribe "ignorar ayuda" puede ver el escenario sin subvención. Sin componente de achatarramiento.

**Por qué:** hoy el usuario hace esa cuenta en el BOE. El escalón de 45.000 € del artículo 008 se visibiliza aquí.

**Toca:** `src/pages/calculadora-tco.astro` (un campo número + checkbox "incluir Plan Auto+"), `src/lib/tco/calculadora.mjs` (ya tiene `ayuda_eur`, basta pasarlo al renderizado de filtro), copy junto al filtro explicando que la ayuda se pierde entera al cruzar 45.000 € sin IVA — *link al artículo 008*.

### E5. Punto de indiferencia (break-even)  [esfuerzo: M, ~1 semana, requiere E1+E2]

**Qué:** segundo gráfico bajo el TCO acumulado. Eje X = km anuales (o % casa, o horizonte). Eje Y = ahorro EV − ICE. La línea cruza el cero en el *punto de indiferencia*. Copy tipo: *"Frente al VW Tiguan, el Kona 65 gana mientras hagas más de 11.800 km/año con ≥40 % carga en casa. Por debajo, el Tiguan queda más barato a 5 años."*

**Por qué:** convierte el número en decisión. Es lo que diferencia a la calculadora de un Excel con una resta.

**Toca:** `src/lib/tco/calculadora.mjs` nueva función `puntoIndiferencia(bev, ice, { variable, rango })`, UI un segundo `<svg>` más pequeño, tres tabs de variable (km / % casa / horizonte).

**Watch-out:** con dos trenes mecánicamente idénticos (iX1 vs iX2) la curva puede no cruzar cero en el rango → el copy debe decirlo explícitamente, no interpolar a lo loco.

### E6. Horizonte libre 2-10 años + km por tramo  [esfuerzo: S, ~2 días]

**Qué:** slider horizonte 2-10 (hoy es dropdown 3/5). Y desglose km anuales en urbano/carretera (dos sliders que suman el total), porque el consumo BEV mejora en ciudad y el ICE empeora, y al revés en autopista.

**Por qué:** alguien que compra para tener el coche 8 años tiene un caso radicalmente mejor para EV (depreciación amortizada, batería aún útil). Hoy no lo podemos representar.

**Toca:** `src/lib/tco/calculadora.mjs` (curvaTCO ya itera por año; solo cambia el tope), `data/coches/*.json` (añadir `consumo_real_factor_urbano` y `consumo_real_factor_carretera` donde tengamos dato, derivar del consumo combinado con pesos ICCT cuando no). Acompañar de una nota §4 bandas: el split urbano/carretera con `confianza: baja` amplía el margen a ±15 %.

### E7. Sensibilidad del usuario junto al resultado  [esfuerzo: S, ~2 días, requiere E1]

**Qué:** dos cursores pequeños al lado del TCO total: *"¿y si ±20 % en km? ¿y si ±0,05 € en kWh? ¿y si ±10 % en % casa?"*. El número central se mueve, el rango se abre/cierra en vivo. Distinto de las bandas metodológicas de la Fase D (esas son nuestras, estas son tuyas).

**Por qué:** el usuario deja de preguntarse "¿y si me equivoco en los inputs?". Lo ve.

**Toca:** `src/pages/calculadora-tco.astro` (pequeños range inputs + re-recalc), nada en backend — es una segunda llamada con params perturbados.

### E8. Puente comparador → calculadora  [esfuerzo: S, ~2 días, requiere E2]

**Qué:** en `/comparador` añadir checkbox por modelo. Con 2-3 marcados aparece un botón *"Compara su TCO"* que abre la calculadora con esos candidatos pre-cargados en el lado BEV.

**Por qué:** hoy son dos islas. El flujo natural "ojeo catálogo → me interesan estos → ¿cuánto me cuestan de verdad?" no existe.

**Toca:** `src/pages/comparador.astro` (estado de selección, botón, serialización a query params), la calculadora ya debe saber leer `?bev=slug1,slug2,slug3` (parte de E2).

### E9. Financiación y caja  [esfuerzo: M, ~1 semana]

**Qué:** bloque opcional "Pago". Dos modos: contado (hoy) o financiado (entrada + TIN + plazo). El segundo introduce el interés en el TCO — los euros que pagas al banco cuentan — y añade un KPI nuevo: **cuota mensual durante la financiación**. Ese KPI suele ser el que decide en la vida real.

**Por qué:** el TCO contable ignora que la depreciación del EV (mayor en euros absolutos los primeros años) pesa más en la cuota financiada. Hay compradores para los que la decisión se toma aquí, no en el total a 5 años.

**Toca:** `src/lib/tco/calculadora.mjs` (añadir `params.financiacion = { modo, entrada_eur, tin_pct, plazo_anios }` opcional, recalcular TCO con interés), UI un collapsible bajo el bloque de escenario, explicar claramente que esto no cambia el TCO total si pagas al contado.

---

## 3. Roadmap sugerido

**Sprint 1 (semana 1):** E1 + E6 + E7. Son todas S y las tres tocan la misma área de UI; se hacen juntas sin pisarse. Resultado: la calculadora responde ya a "mi uso real" aunque siga operando con 20 pares fijos.

**Sprint 2 (semanas 2-4):** E3 en paralelo (Jose sobre ICE) + E2 (Javi sobre frontend + librería). Al cerrarse los dos, el usuario ya elige sus candidatos de un catálogo decente. Es el hito que justifica anunciar la beta v1.0 pública.

**Sprint 3 (semanas 5-6):** E4 + E8. Son ambos cortos y montan el puente catálogo → decisión. Buen momento para un artículo "Cómo usar la calculadora para decidir tu próximo coche" — que por cierto es donde E5 brilla.

**Sprint 4 (semanas 7-8):** E5 + E9. Son los dos más ambiciosos pero también los menos críticos para usabilidad básica. E5 es lo que convierte la herramienta en memorable; E9 abre la puerta al lector "decido por cuota".

**Total estimado:** 8 semanas calendarias para el rediseño completo, asumiendo dedicación parcial. La mitad del valor está en el Sprint 1 — 5 días de trabajo que ya mueven la aguja.

---

## 4. Qué *no* entra en Fase E

- No se reintroduce la Coches.net scraping masiva. El flujo de ingest-samples sigue siendo puntual sobre el piloto de 5 modelos.
- No se cambia la metodología TCO. Fase E es UI, datos y librería — no tabla de `fuente_tipo` ni bandas nuevas.
- No se reabre el artículo 008. Vive como `escalon-plan-auto-45k` y está cerrado.
- No se añade componente de achatarramiento a ningún cálculo del Plan Auto+ — el plan 2026 no lo contempla. Si el BOE lo reintroduce más adelante se abre como Fase F, no antes.
- No se prioriza traducción ni i18n. La audiencia sigue siendo España, en español.

---

## 5. Qué necesita decidir Javi antes de arrancar

1. ¿Sprint 1 suelto como v0.3 o espera al Sprint 2 para un único anuncio v1.0?
2. ¿Catálogo ICE ampliado lo cubrimos nosotros a mano, o arrancamos un mini-skill tipo `enchufa2-ice-ingest` equivalente al de BEVs?
3. En E5 (punto de indiferencia), ¿variable default "km anuales" o "% casa"? Mi voto: *km anuales*, es el eje que la gente entiende primero.
4. En E9, ¿el TIN lo preguntamos al usuario o cogemos un default razonable (p. ej. media BdE para préstamo automóvil)?

Cualquiera de las cuatro se puede decidir en una nota posterior; ninguna bloquea el Sprint 1.
