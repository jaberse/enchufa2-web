# Sprint 2 Fase E — Kickoff

**Estado:** en curso
**Fecha de arranque:** 2026-04-15
**Objetivo:** cerrar E2 (selección libre de candidatos) y avanzar E3 (catálogo ICE ampliado) en paralelo.
**Referencia:** `docs/fase-e-calculadora-rfc.md`

---

## 1. Alcance

- **E2** — Selección libre de candidatos. El usuario elige 2-4 BEVs y 2-4 ICEs de la lista completa y la calculadora los pinta a todos en el mismo gráfico de TCO acumulado. Trabajo de frontend + librería.
- **E3** — Catálogo ICE ampliado. Pasamos de 10 a ~40 referencias en `data/referencias/ice-equivalentes/`. Trabajo de datos puro; paralelizable con Jose.

Al cerrar los dos (o el primero con el catálogo actual como cascarón aceptable) el hito justifica anunciar la beta pública v1.0.

---

## 2. Plan de ataque E2 en dos pasos

### Paso 1 — Plomería del payload (invisible)

Refactor del frontmatter de `calculadora-tco.astro` para exponer al cliente dos listas independientes:

- `ALL_BEVS` — array con todos los BEVs distintos (hoy 20), cada uno con sus fixtures por horizonte y metadatos (nombre, segmento, foto, ayuda).
- `ALL_ICES` — idem con los ICE (hoy 10).

El concepto antiguo `PARES` se mantiene *por ahora* como conjunto de presets iniciales para quick start, pero ya no es el origen de verdad del payload. La UI actual sigue operando sobre `payload` (pares fijos) — cero regresiones — mientras que `ALL_BEVS`/`ALL_ICES` quedan disponibles para el paso 2.

**Criterio de cierre paso 1:** tests TCO 21/21, build limpio, calculadora se ve exactamente igual, pero `window` tiene la nueva estructura lista. Se verifica abriendo DevTools.

### Paso 2 — Cirugía UI (visible)

1. Reemplazar el radio de par único por dos bloques multi-select con búsqueda: "Tus candidatos eléctricos" y "Tus candidatos combustión".
2. El gráfico soporta N+M curvas. Curva activa = resaltada + banda visible; el resto en opacidad ~40 %.
3. El lede editorial pasa de "el BEV ahorra X €" a "el BEV más eficiente ahorra X € frente al peor ICE" o similar — depende de cuántos coches haya.
4. Serialización en URL: `?bev=slug1,slug2,slug3&ice=slug4,slug5`.
5. Breakdown cards: queda pendiente de decisión (ver §4).

---

## 3. Plan E3 (paralelo)

Sin dependencia de E2 mientras el catálogo inicial (10 ICE) cubra los presets. E3 se ataca con:

- Un mini-skill `enchufa2-ice-ingest` análogo al de BEVs, con campos `{ valor, unidad, fuente_tipo, fuente_fecha, fuente_detalle, verificado, confianza }` (sin cambios en la canónica §3 de `metodologia-tco.md`).
- Lista inicial de ~30 ICE prioritarios por volumen ANFAC 2025: i10, Picanto, Sandero, Ibiza, 208, Clio, Corsa, 2008, Corolla, Golf, León, 308, Civic, Astra, Qashqai, C-HR, CX-5, Kuga, Sportage, Mazda 3, A4, Clase 3…
- Confianza inicial `media` por defecto, con auditoría posterior.

No se arranca en este commit — se abre issue/branch aparte cuando Javi o Jose lo retome.

---

## 4. Decisiones pendientes (bloquean paso 2)

1. **Max BEVs y ICEs simultáneos.** Propuesta: 4 y 4. Con más de 4 el gráfico se vuelve ilegible incluso con transparencia.
2. **Patrón de multi-select.** Tres opciones:
   - (a) Lista con checkboxes + campo de búsqueda (fácil, accesible, ocupa espacio).
   - (b) Dropdown con búsqueda estilo "combobox" (compacto, más JS).
   - (c) Chips añadibles desde un buscador (estilo Gmail "para"). Mi voto: *(a)* para v1.0, iteramos a *(c)* si ocupa demasiado.
3. **Breakdown cards.** Con N+M coches, las dos cards fijas de abajo dejan de tener sentido. Opciones:
   - (a) Convertir la card en "coche enfocado" — el usuario pincha uno de la lista de curvas y se expande el breakdown.
   - (b) Tabla compacta con una fila por coche (coste/km, depreciación, energía, etc.) — más denso pero todos visibles.
   - (c) Eliminar cards; quedarse con gráfico + resumen textual.
4. **Lede editorial con N coches.** ¿Qué narrativa? Propuesta: resumir "el eléctrico más barato en 5 años es **X** con **Y €**, el combustión más barato es **Z** con **W €**", y dejar el detalle N×M al usuario vía el gráfico/breakdown.

---

## 5. Lo que NO entra en Sprint 2

- E4 (presupuesto como filtro) — Sprint 3.
- E8 (puente comparador→calculadora) — Sprint 3, depende de E2 cerrado.
- E5 (punto de indiferencia) y E9 (financiación) — Sprint 4.
- Rediseño visual de la página o cambios en metodología.
