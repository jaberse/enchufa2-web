# Plan de ataque — Calculadora TCO enchufa2

**Estado:** aprobado · decisiones D1–D5 cerradas el 13 abril 2026
**Fecha:** abril 2026
**Autor:** Javi + Cowork

---

## 0. Cómo leer este documento

Este es un plan estratégico, no un documento técnico cerrado. Está pensado para que Javi lo lea, marque, corrija y acuerde conmigo antes de tocar una sola línea de código. Al final hay una sección de **decisiones abiertas** donde pido input explícito. Todo lo demás es una propuesta razonada, no un hecho consumado.

---

## 1. Premisa y visión

La calculadora TCO es, junto al comparador, el producto principal de enchufa2. No es un widget accesorio de un artículo: es una herramienta autónoma, enlazable, compartible, con entidad propia.

**Visión a 18 meses:** cuando un propietario o futuro comprador de EV en España quiera saber *de verdad* cuánto le cuesta un coche eléctrico frente a su alternativa, la búsqueda "calculadora coste real coche eléctrico españa" lleva a enchufa2.com/calculadora-tco. Y cuando un medio, un foro o un concesionario cita datos de TCO, cita los nuestros.

**Promesa al usuario:** en menos de 60 segundos, con 3 inputs mínimos (modelo, km/año, código postal), devolvemos un coste total de propiedad comparable, explicable y descargable. Con metodología pública, datos trazables y resultados que sobreviven al escrutinio de un ingeniero.

No competimos con comparadores de precio. Competimos con la falta de rigor del mercado español.

---

## 2. Estado del arte — qué existe y qué falta

### 2.1 Panorama español

He auditado todas las herramientas TCO activas en España a abril 2026:

- **IDAE** — tiene una calculadora institucional, interfaz de 2015, no incluye depreciación ni carga pública, metodología opaca.
- **RACE / Fundación Renovables** — reports anuales sólidos, pero no tienen calculadora interactiva. Publican PDFs.
- **OCU** — calculadora básica, muy orientada a consumo; no modela TCO completo ni residual.
- **AEDIVE** — informes agregados de sector, sin herramienta de usuario.
- **Carwow España, FlowForge, RecargaElectrico, CargaCocheElectrico** — todas hacen alguna versión simplificada: coste energético vs gasolina. Ninguna modela depreciación, ninguna cubre los 6 costes reales (energía, mantenimiento, seguro, impuestos, depreciación, financiación), ninguna es transparente con la metodología.

**Gap principal identificado:** *nadie en España calcula depreciación/valor residual dinámicamente*. Todos asumen o un residual fijo o directamente lo ignoran. Y la depreciación es, como demostramos en el artículo de coste real, el mayor coste de propiedad de un coche — para EV y para combustión.

### 2.2 Benchmark internacional

Las referencias a superar:

- **US DOE AFDC Vehicle Cost Calculator** — gold standard institucional: 15 años de horizonte, incluye depreciación, metodología publicada, actualización periódica de precios de energía.
- **Edmunds True Cost to Own®** — el estándar comercial: 5 años, 7 categorías de coste, residual basado en datos reales de subastas.
- **Kelley Blue Book 5-Year Cost to Own** — similar a Edmunds, enfocado a consumidor final.
- **ZapMap TCO (UK)** — el más cercano a nuestra ambición en Europa: clean UI, filtros por tipo de uso, integración con red de carga.
- **ICCT White Papers** — no es herramienta pero es la metodología canónica que debemos seguir.
- **EV Database (ev-database.org)** — sin TCO pero es la referencia de datos técnicos de EV en Europa.

**Lo que queremos robar de cada uno:**
- De AFDC: rigor metodológico y transparencia.
- De Edmunds: desglose por años y por categorías.
- De ZapMap: experiencia de usuario limpia y enlazable.
- De ICCT: fórmula canónica y ajustes real-world.

---

## 3. Posicionamiento — los 5 diferenciadores

La calculadora de enchufa2 será la única en España que cumple *simultáneamente* estos 5 criterios:

1. **Depreciación dinámica basada en datos reales.** No un porcentaje plano: curvas por segmento, por motorización, por antigüedad de modelo. Fuente: Autovista + ANFAC + histórico de mercado de ocasión.
2. **Comparativas intra-marca por defecto.** Igual que en el artículo de coste real: ë-C3 vs C3, i4 vs 320i, ID.3 vs Golf. No comparamos un Tesla Model 3 con un Dacia Sandero. Esto es lo que hace creíble el resultado.
3. **Localización real.** Por CCAA (Plan Auto+, IVTM municipal, IEDMT según emisiones) y por código postal para precio de carga pública (OMIE + mapas de red).
4. **Metodología pública y auditable.** Al lado del resultado siempre está el enlace a la metodología con fórmulas, supuestos y fuentes. Enchufa2 no es una caja negra.
5. **Exportable y compartible.** URL única por configuración (`/calculadora-tco?modelo=ec3&km=15000&cp=28001`), PDF descargable con marca, embed código para foros y medios.

Ningún producto en España combina estos 5. Nadie.

---

## 4. Metodología de cálculo

### 4.1 Fórmula canónica (ICCT adaptada)

```
TCO_total = (Precio_compra - Subvención - Valor_residual)
          + Σ(Energía_anual)
          + Σ(Mantenimiento_anual)
          + Σ(Seguro_anual)
          + Σ(Impuestos_anuales + IEDMT_matriculación)
          + Σ(Costes_financiación)     [opcional]
          + Σ(Peajes + Parking)        [v2]
```

Todo actualizado con factor de inflación y descontado a valor presente (tasa 3% por defecto, editable en modo avanzado).

### 4.2 Las 5 decisiones metodológicas críticas

Donde las calculadoras fallan es en estas 5 decisiones. Nuestra postura:

1. **Consumo real-world, no WLTP.** Aplicamos factor +18% sobre WLTP por defecto (media de estudios ICCT 2019–2024). El usuario puede sobreescribir con su consumo real.
2. **Precio de electricidad mixto.** Default 80% casa (PVPC valle o Tarifa EV según perfil) + 20% rápida pública (media OMIE + margen CPO). El usuario puede mover el slider 0–100%.
3. **Determinista con escenarios, no Monte Carlo.** Para v1 calculamos un valor central + escenarios optimista/pesimista. Monte Carlo queda para v3 (cuando tengamos señal de que hay demanda).
4. **Degradación de batería modelada.** Pérdida de capacidad aplicada al consumo año a año (curva SOH estándar LFP y NMC). Impacta sobre todo en residual.
5. **Horizonte: 5 años y 10 años por defecto.** Mostramos ambos. 5 porque es el período que la mayoría de usuarios planifica. 10 porque es donde el EV despega.

### 4.3 Trampas a evitar

Documentadas en la metodología pública, para que el usuario sepa que las hemos pensado:

- No comparar un EV nuevo con un ICE nuevo *sin tener en cuenta que el parque español medio es ICE usado*.
- No ignorar la diferencia de seguro EV vs ICE (en España el EV suele ser más caro de asegurar, no más barato).
- No asumir carga 100% casa para quien vive en piso sin plaza de garaje.
- No asumir subvención cobrada sin descontar el IRPF del año siguiente.
- No confundir el IEDMT con el IVTM.

---

## 5. Arquitectura de datos

### 5.1 Fuente única: el comparador

La calculadora no duplica datos. Lee del mismo `src/data/comparador.json` que alimenta el comparador, y extiende con campos específicos TCO en `data/coches/*.json`:

```jsonc
{
  "specs_tco": {
    "depreciacion_curva": {
      "y1": 0.28, "y3": 0.45, "y5": 0.58, "y10": 0.78,
      "fuente": "autovista-2026-q1",
      "confianza": "media"
    },
    "mantenimiento_anual": {
      "valor": 380, "unidad": "€/año",
      "fuente": "red-oficial-marca-2026",
      "confianza": "alta"
    },
    "seguro_estimado": {
      "valor": 720, "unidad": "€/año",
      "fuente": "comparador-seguros-enchufa2-2026",
      "confianza": "media"
    }
  }
}
```

### 5.2 Datos externos necesarios

- **Precio de electricidad.** OMIE (horario) + PVPC + tarifas EV de comercializadoras. API o scraping semanal. Guardado como serie histórica en `data/energia/precio-electricidad.json`.
- **Precio de carburante.** Geoportal de Ministerio de Transición Ecológica. Actualización semanal.
- **Subvenciones por CCAA.** Ya tenemos Plan Auto+ nacional (61 modelos verificados). Añadir extras autonómicos donde existan (Cataluña, Madrid, País Vasco, Navarra tienen los suyos).
- **IVTM por municipio.** Tabla propia compilada de las 50 capitales + top 100 municipios por registro de EV. Resto se imputa por media de CCAA.
- **IEDMT.** Tabla fija del BOE; se actualiza manualmente si cambia normativa.
- **Depreciación.** Fuente crítica y abierta — ver decisiones abiertas §10.

### 5.3 Qué *no* hacemos

- No integramos APIs bancarias para financiación real. Usamos tabla estática de tipos medios.
- No integramos APIs de seguros. Usamos media de comparadores + corrección por segmento.
- No integramos APIs en tiempo real en v1. Actualización semanal batch está bien.

---

## 6. Arquitectura técnica

### 6.1 Stack

Coherente con el resto del sitio:

- **Frontend:** Astro 4.x + islands. La página `/calculadora-tco` es `.astro`; los componentes interactivos (sliders, selector de modelos, resultados) son islas React o Vanilla JS con Web Components.
- **Lógica de cálculo:** TypeScript puro en `src/lib/tco/`. Cero dependencias de servidor. Todo se ejecuta en el navegador.
- **Datos:** JSON estático generado en build-time desde `data/`. Cero llamadas a API desde el cliente.
- **Estilos:** variables CSS existentes + nuevo componente `.tco-result` en `src/styles/`.
- **Persistencia:** URL query string. La URL *es* el estado. `/calculadora-tco?m=ec3&km=15k&cp=28001&c=80`.

### 6.2 Estructura propuesta

```
src/pages/
  calculadora-tco.astro              ← página principal
  calculadora-tco/
    metodologia.astro                 ← doc pública
    api.json.ts                       ← endpoint estático para embeds
src/components/tco/
  TcoForm.tsx                         ← inputs
  TcoResult.tsx                       ← resultado principal
  TcoBreakdown.tsx                    ← desglose por categoría
  TcoChart.tsx                        ← gráfico acumulado
  TcoExport.tsx                       ← botón PDF / compartir
src/lib/tco/
  calculator.ts                       ← fórmula canónica
  depreciation.ts                     ← curvas
  electricity.ts                      ← precios + perfil carga
  maintenance.ts                      ← lookup por modelo
  insurance.ts                        ← estimador
  taxes.ts                            ← IEDMT, IVTM, subvenciones
  scenarios.ts                        ← optimista/central/pesimista
  types.ts                            ← interfaces compartidas
data/
  coches/*.json                       ← extender con specs_tco
  energia/precio-electricidad.json
  energia/precio-carburante.json
  impuestos/ivtm-municipios.json
  impuestos/subvenciones-ccaa.json
```

### 6.3 Tests

Obligatorio para la calculadora — es donde más daño hace un bug:

- Unit tests de `calculator.ts` contra un dataset de 20 casos validados a mano (script `scripts/tco-validate.ts`).
- Regression tests: si una curva de depreciación cambia, el snapshot de resultados cambia y revisamos.
- Sanity checks en build: `npm run tco:audit` valida que para cada modelo del comparador existe su bloque `specs_tco`.

---

## 7. UX flow

### 7.1 Principio rector

**70% defaults / 30% override.** El usuario medio llega, elige modelo, ve resultado. El usuario técnico puede abrir "modo avanzado" y tocar 40 parámetros. Ambos ven la misma metodología.

### 7.2 Flujo base (mobile-first)

1. **Entrada.** Un selector: "¿Qué coche estás mirando?" Muestra los 61 del comparador con foto.
2. **Opcional:** "¿Lo quieres comparar con otro?" Default sugerido: su equivalente intra-marca (i4 → 320i automáticamente). Botón "cambiar comparación".
3. **Dos inputs más:** km/año (slider 5k–40k, default 15k) + código postal.
4. **Resultado inmediato.** Tarjeta grande: "El [modelo EV] cuesta X €/mes frente a Y €/mes del [ICE]. Ahorro/sobrecoste a 5 años: Z €. Punto de equilibrio: mes M."
5. **Gráfico TCO acumulado** (mismo estilo que los del artículo — reutilizamos el componente).
6. **Desglose colapsable** por los 6 costes. Cada línea con fuente y tooltip de metodología.
7. **CTA:** descargar PDF · compartir URL · modo avanzado.

### 7.3 Modo avanzado

Desplegable, no modal. Sliders para: consumo real, % carga casa, tarifa eléctrica (selector PVPC/EV/fija), precio de carburante, subvención aplicable, financiación, tasa de descuento, horizonte (5/10/15 años), kilometraje de reventa, degradación batería.

Cualquier override del usuario se refleja en la URL. Compartir = enlazar un escenario exacto.

### 7.4 Integración con el comparador

Desde cualquier ficha de coche del comparador, botón "calcular TCO para este modelo" que precarga la calculadora con ese vehículo como EV principal.

---

## 8. Fases de desarrollo

### Fase 1 — MVP (v1.0) · 8 semanas desde aprobación

**Scope:**
- Los 61 modelos del comparador con `specs_tco` completo.
- Cálculo determinista + 3 escenarios (optimista/central/pesimista).
- Inputs: modelo, km/año, CP. Defaults razonados para todo lo demás.
- Resultado: coste total, €/mes equivalente, desglose por categoría, gráfico acumulado.
- Comparación intra-marca automática + override manual.
- Página de metodología pública.
- URL persistente.

**Entregables:** la calculadora funcional, indexable, con datos actualizados a la semana de lanzamiento. Un artículo-lanzamiento en enchufa2 explicando por qué la hemos hecho.

**No incluye en v1:** modo avanzado completo (solo los 5 overrides principales), PDF export (v2), embed (v2), sensibilidad visual (v2).

### Fase 2 — Diferenciadores · 4–6 semanas post-v1

- PDF export con branding.
- Modo avanzado completo (40 parámetros).
- Análisis de sensibilidad visual: "¿qué pasa si el diésel sube un 20%?" slider en tiempo real.
- Embed iframe para medios y foros.
- Integración bidireccional con comparador.
- Extensión a 100+ modelos.

### Fase 3 — Visionarios · Q4 2026 / Q1 2027

- Monte Carlo con distribuciones por parámetro (si hay señal de demanda técnica).
- Integración OMIE en tiempo real (precio horario de electricidad).
- Módulo "¿cuál es el mejor EV para mí?" (input inverso: usuario da presupuesto y uso, salida = ranking TCO).
- API pública para medios.
- Versión profesional para flotas (si AEDIVE o gestores de flotas lo piden).

---

## 9. Criterios de éxito

**Mes 3 post-lanzamiento:**
- Top 5 en búsquedas "calculadora coste coche eléctrico" y "tco coche eléctrico españa".
- Al menos 3 medios generalistas (Xataka, El Mundo Motor, Motorpasión) enlazando a nuestros resultados.
- Tiempo medio de uso >90 segundos (indica que el usuario está explorando, no rebotando).

**Mes 12:**
- Referencia técnica citada por al menos un informe sectorial (RACE, AEDIVE, IDAE).
- 10.000+ cálculos únicos/mes.
- Comunidad que reporta errores y pide modelos nuevos (= adopción real).

---

## 10. Decisiones cerradas (13 abril 2026)

**D1 — Fuente de depreciación.** ✅ ANFAC + compilación manual de Autocasión/Coches.net como baseline. Evaluamos licencia Autovista en Q3 2026 si la herramienta gana tracción.

**D2 — Scope de modelos en v1.** ✅ 20 modelos top buscados en España para lanzamiento. Los otros 41 se incorporan en las primeras 4 semanas post-lanzamiento.

**D3 — Inclusión de financiación.** ✅ Default al contado. Toggle "incluir financiación" disponible en modo avanzado con tipo medio de mercado español.

**D4 — Embed y monetización.** ✅ Embed gratis con atribución obligatoria a enchufa2 desde v2. Sin monetización los primeros 12 meses — prioridad es autoridad.

**D5 — Nombre público.** ✅ URL técnica `/calculadora-tco`. Título público "Calculadora de coste real". Subtítulo "TCO a 5 y 10 años para coches eléctricos en España".

**D6 — Marcas sin ICE homólogo (Tesla, BYD).** ✅ Opción C híbrida: benchmark por segmento definido en `data/referencias/benchmarks_ice.json` como default, con dropdown que permite al usuario sustituirlo por cualquier otro modelo del catálogo. Tesla Model 3 → BMW 320i default. BYD Atto 2 → Peugeot 2008 PureTech default.

**D7 — Fuente de depreciación (13 abril 2026).** ✅ **Ganvam como canónica** (tablas oficiales públicas de asociación de concesionarios) + **Coches.net como validación cruzada** (precios reales del mercado de segunda mano). Si el gap entre ambas supera 5 puntos porcentuales, se registra en `depreciacion_validacion_gap_pct` para auditoría.

**D8 — Fuente de mantenimiento (13 abril 2026).** ✅ **Plan oficial de la marca** donde exista (Citroën Essential Service, BMW Service Inclusive, etc.), con nota explícita en `mantenimiento_cobertura` de qué cubre: revisiones, consumibles (filtros, pastillas), neumáticos, batería de arranque. Fallback: promedio de servicio oficial por km según tarifa publicada.

**D9 — Fuente de seguro (13 abril 2026).** ✅ **Mediana de 3 cotizaciones** en Rastreator, Acierto y Línea Directa con el perfil estándar enchufa2:
- Titular 40 años, 15 años de carnet
- Zona de riesgo media (referencia: provincia con siniestralidad cercana a la mediana nacional)
- Todo riesgo con franquicia 500€
- Uso particular, 15.000 km/año, garaje privado, sin siniestros últimos 5 años

Se registra la mediana en `seguro_anual_eur` y las 3 cotizaciones individuales en `seguro_cotizaciones` como array de `{ comparador, prima_eur, fecha }`.

---

## 11. Siguientes pasos

Una vez tú y yo acordemos este plan:

1. Cierro decisiones abiertas D1–D5 con tus respuestas.
2. Creo el skill `enchufa2-tco-calculator` en `.claude/skills/` documentando metodología y decisiones (igual que hicimos con `enchufa2-article`).
3. Extiendo el pipeline de `data/coches/*.json` con bloque `specs_tco` — empezando por los 20 modelos top (D2).
4. Implemento `src/lib/tco/calculator.ts` con tests contra casos validados a mano.
5. Construyo la UI incremental: primero resultado estático, luego interactividad, luego polish.

Tiempo total estimado a v1 funcional: **8 semanas de trabajo concentrado**. Si arrancamos segunda semana de mayo 2026, lanzamos primera semana de julio.

---

*Fin del plan. Espero tus comentarios.*
