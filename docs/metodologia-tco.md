# Metodología TCO enchufa2 — v2.1

**Estado:** canónico
**Fecha:** 2026-04-22
**Autor:** Javi + Cowork
**Reemplaza:** v2 (2026-04-20). El v2 queda congelado en el tag `methodology-v2-frozen-2026-04-22`. El v1 sigue congelado en `methodology-v1-frozen-2026-04-20`.

---

## 0. Por qué existe este documento

La calculadora TCO de enchufa2 es, por definición, una **proyección hacia el futuro**. Estamos diciendo a un comprador potencial cuánto le va a costar un coche *nuevo* a 3, 5 y 10 años. Ningún coche nuevo tiene datos reales de 5 años por el simple hecho de que acaba de salir. Por tanto, todo valor de `specs_tco` es una estimación construida con la mejor información disponible hoy — no una medición.

Lo que no puede pasar, y lo que disparó la retirada del artículo 008 el 2026-04-15, es que:

1. Dos coches mecánicamente idénticos tengan baselines distintos sin justificación.
2. Una cifra puntual se publique como tesis editorial sin banda de incertidumbre.
3. Los `fuente_tipo` sean nombres ad-hoc que nadie puede auditar.

Esta metodología existe para que cualquier lector — Javi, Jose, un futuro colaborador, un periodista que cite la calculadora — pueda abrir un JSON de `data/coches/*.json`, leer `fuente_tipo` y `fuente_detalle`, y reconstruir mentalmente de dónde sale cada número. **Si no se puede reconstruir, no se publica.**

---

## 1. Principio rector: proyección con incertidumbre explícita

La calculadora produce, para cada modelo, un **valor central** y un **rango min/max** derivados de la confianza de cada input. Nunca presentamos un número aislado como verdad. En UI:

- Valor central → línea marcada en la barra de TCO.
- Rango → área gris alrededor, con mejor/esperado/peor.
- Tooltip por partida explica qué empuja el rango hacia arriba o hacia abajo.

En artículos, toda cifra citada de la calculadora debe ir acompañada de al menos uno de:

- El rango (por ejemplo: *"entre 34.200 € y 41.800 €, centro 38.000 €"*).
- Una nota del tipo: *"cifra central de la calculadora a 5 años — puede variar un ±15% según tarifa eléctrica y curva de depreciación real"*.

Presentar un solo número sin contexto es una violación editorial que fuerza la retirada del contenido.

---

## 2. Campos de `specs_tco` y su derivación

Todos los campos siguen el mismo esquema de trazabilidad:

```jsonc
{
  "valor": 0.32,
  "unidad": "fracción",            // o "€/año", "kWh/100km", etc.
  "fuente_tipo": "…",              // uno de los valores canónicos de §3
  "fuente_fecha": "2026-04-15",    // cuándo se capturó/derivó
  "verificado": true|false,        // true solo si hay fuente primaria ligada
  "confianza": "alta|media|baja",  // determina la banda (§4)
  "fuente_detalle": "…",           // texto humano explicando la derivación
  "notas": "…"                     // opcional — caveats, revisión prevista
}
```

### 2.1 `depreciacion_y3_pct`, `depreciacion_y5_pct`, `depreciacion_y10_pct`

**Unidad:** fracción (0.32 = 32% de valor perdido desde nuevo).

**Orden canónico de derivación** (se usa la primera regla que aplique):

1. **Hermana intra-plataforma con TCO ya poblado** → hereda el valor, `fuente_tipo: "baseline_compartido_intra_plataforma"`, `confianza: baja`. Ver `docs/regla-baseline-intra-plataforma.md`.
2. **Predecesor directo con ≥3 años de mercado** (ej. Kona SX1 → Kona SX2, Model 3 pre-Highland → Highland) → usa la curva real del predecesor, `fuente_tipo: "analogo_predecesor"`, `confianza: media`. En `fuente_detalle` cita el slug del predecesor y los años del que se toma la curva.
3. **Tablas Ganvam por segmento + motorización** → valor base de la tabla Ganvam pública para el segmento y la antigüedad, ajustado por factor plataforma/química batería (§5.1). `fuente_tipo: "ganvam_segmento"`, `confianza: media`.
4. **Curva BEV categoría** → para modelos donde Ganvam aún no publica cifras específicas BEV (Inster, Dolphin Surf, etc.), se usa la curva media BEV por segmento observada en `data/referencias/curva-depreciacion-bev.json`. `fuente_tipo: "curva_bev_categoria"`, `confianza: baja`.

**Lo que no vale como fuente:** un número redondo sin derivación documentada, una cita "Autocasion dice que…" sin el enlace y la fecha, una cifra editorial elegida "porque encaja con el artículo".

**Y10 específicamente:** siempre `confianza: baja`. No hay mercado observable de BEV de 10 años en España. El valor es una extrapolación de la curva y3 + y5 con factor de degradación batería (§5.5). Se etiqueta explícitamente en UI como "proyección experimental".

### 2.2 `seguro_anual_eur`

**Unidad:** €/año.

**Orden canónico de derivación:**

1. **Tres cotizaciones reales** con el perfil estándar (ver `docs/perfil-estandar-seguro.md`) → mediana de las 3 primas. `fuente_tipo: "tres_cotizaciones_reales"`, `confianza: alta`, `verificado: true`.
2. **Cotización del ICE equivalente × factor BEV categoría** → cuando aún no hay cotizaciones específicas del BEV, se parte del seguro del ICE hermano (con misma plataforma/carrocería) y se aplica el factor §5.2. `fuente_tipo: "estimacion_bev_sobre_ice"`, `confianza: media`.
3. **Media UNESPA por segmento BEV** → último recurso, cuando ni siquiera hay ICE equivalente. `fuente_tipo: "media_segmento_unespa"`, `confianza: baja`.

**Sanity check:** toda cifra de seguro BEV debe caer en el rango 450–1.400 €/año para el perfil estándar. Valores fuera de rango disparan alerta en `npm run data:audit`.

### 2.3 `mantenimiento_anual_eur`

**Unidad:** €/año.

**Orden canónico de derivación:**

1. **Plan oficial del fabricante** (BMW Service Inclusive, Hyundai iCare, Citroën Essential Service, etc.) → precio total del plan / años de cobertura. `fuente_tipo: "fabricante"`, `confianza: alta`, `verificado: true`, con campo adicional `mantenimiento_cobertura` que lista lo que cubre.
2. **Plan de un coche hermano** (mismo fabricante, plataforma equivalente) cuando el BEV concreto no tiene plan publicado → `fuente_tipo: "plan_hermano_fabricante"`, `confianza: media`.
3. **Media BEV categoría** → 230 €/año ±50 como media observada en datos de plan oficial de los modelos ya cubiertos. `fuente_tipo: "media_bev_categoria"`, `confianza: baja`.

**Qué no cuenta como mantenimiento en este campo:** neumáticos, pastillas de freno, ITV desde año 4, batería de arranque. Esos se documentan en el doc de UX pero no entran en el valor de este campo (para no doble contar vs categorías del calculador).

### 2.4 Consumo — WLTP puro, sin factor corrector

**Cambio v2.1 (2026-04-22):** se retira el campo `consumo_real_factor` de todo el esquema (BEV, HEV, PHEV). La calculadora usa el **consumo WLTP homologado tal cual**.

**Razón:**

1. WLTP es el único ensayo estandarizado, rodado en banco bajo protocolo regulado europeo. Su ciclo (WLTC Class 3: Low, Medium, High, Extra-High, media 46,5 km/h, pico 131 km/h) es la mejor vara de medir **comparable entre vehículos** disponible hoy.
2. La diferencia WLTP→real depende primordialmente del **uso** del conductor (perfil urbano/mixto/autovía, velocidad media, estilo de conducción, carga, clima) — variables **extrínsecas** al vehículo, no intrínsecas.
3. Introducir un factor corrector por vehículo (ej. ×1,18 para un C-hatchback, ×1,25 para un D-SUV) añade una capa subjetiva sobre un dato homologado. Cualquier desviación entre fuentes de terceros (EV Database, InsideEVs, Consumer Reports) se traslada como sesgo al resultado de la calculadora y contamina la comparabilidad.
4. La aerodinámica (Cx × A) **ya está incorporada en el WLTP**: el coche más eficiente obtiene mejor WLTP, y mantiene ventaja al aplicar el mismo protocolo a todos. Un corrector añadido encima solo dobla esa ventaja sin evidencia robusta.

**Cómo se calcula la energía:**

- **BEV:** `coste_anual = km_anuales × consumo_wltp_kwh_100km / 100 × precio_kWh`.
- **ICE / HEV:** `coste_anual = km_anuales × consumo_wltp_l_100km / 100 × precio_L`.
- **PHEV:** fórmula ponderada por ratio eléctrico (§2.8.5).

La confianza de la partida de energía se hereda directamente del envelope del campo `consumo_wltp_*` en `specs` (habitualmente `alta` porque proviene de homologación de fabricante).

**Nota operativa:** el slider de precio de electricidad del calculador (§2.5) sigue siendo la vía por la cual el usuario modela su propio uso (autoconsumo FV, mix casa/pública, 100% rápida). La calibración por perfil de conducción con sliders de ciudad/mixto/autovía queda en el roadmap (§10).

### 2.5 `precio_electricidad_eur_kwh`

**Siempre `null`** en los JSONs. Este campo no se almacena, se toma del slider del calculador. Default 0,17 €/kWh (70% casa PVPC valle + 30% pública), extremos 0,08 €/kWh (autoconsumo FV) y 0,55 €/kWh (100% rápida pública).

### 2.6 `equivalente_termico`

La clave (renombrada desde `equivalente_ice` en v1) admite tres tipos de referente: `ICE`, `HEV`, `PHEV`. Cada BEV tiene un referente canónico (default) y hasta 3 alternativas listadas explícitamente.

```jsonc
"equivalente_termico": {
  "tipo": "HEV",                         // "ICE" | "HEV" | "PHEV"
  "referente_id": "toyota-corolla-cross-hev",
  "fuente_tipo": "decision_editorial",
  "confianza": "alta",
  "razon": "…",                          // plataforma + fábrica + posicionamiento
  "alternativas": [
    { "tipo": "ICE",  "referente_id": "volkswagen-tiguan-tsi" },
    { "tipo": "PHEV", "referente_id": "kia-sportage-phev" }
  ]
}
```

**Mapeo BEV→referente** — orden de preferencia editorial (no es una matriz cerrada por segmento/precio):

1. Hermano térmico intra-plataforma con mismo fabricante (ej. Ford Explorer EV → Ford Kuga HEV, Kia EV3 → Kia Sportage HEV, Mercedes EQA → Mercedes GLA 200).
2. Mismo fabricante, segmento análogo (Mercedes EQB → Mercedes GLB; VW ID.7 → VW Passat HEV).
3. Benchmark sectorial por segmento + rango de precio, preferentemente HEV si es el más vendido del segmento en España según datos ANFAC del año en curso.
4. Sin equivalente directo: `equivalente_termico: null` con nota editorial en `meta.equivalente_termico_ausente_razon`. Caso típico: VW ID Buzz (monovolumen eléctrico puro sin equivalente térmico real en la misma categoría).

Migración v1 → v2: las entradas `equivalente_ice` existentes se renombran a `equivalente_termico` con `tipo: "ICE"` (script de migración `_migrate_equivalente_termico_v2.mjs`).

### 2.7 Campos HEV (auto-recargable, "Full Hybrid")

> Aplica a **HEV auto-recargable** estilo Toyota Hybrid Synergy Drive, Honda e:HEV, Hyundai/Kia HEV, Renault E-Tech hybrid. **NO aplica a mild hybrid 48V** (BMW mild, Mercedes EQ Boost, Stellantis e-Hybrid mild): un mild hybrid se trata como ICE estándar a efectos de TCO — se usan los consumos WLTP de fabricante tal cual. No es un eléctrico en ninguna capa del cálculo.

Los 3 campos principales (`depreciacion_y*_pct`, `mantenimiento_anual_eur`, `seguro_anual_eur`) siguen el esquema de trazabilidad §2, con novedades en el orden de derivación.

#### 2.7.1 `depreciacion_y{3,5,10}_pct` — HEV

1. **Hermano térmico intra-plataforma con TCO poblado** → hereda valor. `fuente_tipo: "baseline_compartido_intra_plataforma"`, `confianza: baja`.
2. **Predecesor directo con ≥3 años mercado** → curva real predecesor. `fuente_tipo: "analogo_predecesor"`, `confianza: media`.
3. **Tabla Ganvam HEV segmento** → cuando Ganvam publica segmentación HEV diferenciada (disponible desde 2024 para Toyota y Hyundai). `fuente_tipo: "ganvam_segmento"`, `confianza: media`. **Prima sobre el factor §5.3 cuando existe dato primario.**
4. **Factor HEV sobre ICE-segmento** → partir de la cifra ICE base del segmento y aplicar el delta único de §5.3. `fuente_tipo: "factor_hev_sobre_ice"`, `confianza: media`.
5. **Media HEV categoría** → fallback para categorías con <3 HEV poblados. `fuente_tipo: "media_hev_segmento"`, `confianza: baja`.

**Y10 HEV:** siempre `confianza: baja`, banda ±15%. La ventaja HEV en retención se concentra en y3-y5; en y10 converge a ICE.

#### 2.7.2 `mantenimiento_anual_eur` — HEV

1. **Plan oficial fabricante** (Toyota Relax, Hyundai iCare HEV, etc.) → `fuente_tipo: "fabricante"`, `confianza: alta`.
2. **Plan hermano fabricante** si el HEV concreto no tiene plan publicado pero sí un HEV hermano del mismo fabricante → `fuente_tipo: "plan_hermano_fabricante"`, `confianza: media`.
3. **Factor HEV sobre ICE-segmento** → partir del mantenimiento ICE-segmento y aplicar ×0.85 (§5.3). `fuente_tipo: "factor_hev_sobre_ice"`, `confianza: media`.
4. **Media HEV categoría** → `fuente_tipo: "media_hev_segmento"`, `confianza: baja`.

**Sanity range HEV:** 150–400 €/año. Ligeramente superior al BEV (por tener motor térmico con revisiones de aceite) y netamente inferior al ICE equivalente.

#### 2.7.3 `seguro_anual_eur` — HEV

1. **Tres cotizaciones reales** perfil estándar → `fuente_tipo: "tres_cotizaciones_reales"`, `confianza: alta`.
2. **Seguro del ICE hermano × factor HEV §5.3** → `fuente_tipo: "factor_hev_sobre_ice"`, `confianza: media`.
3. **Media HEV segmento UNESPA** → `fuente_tipo: "media_hev_segmento"`, `confianza: baja`.

**Sanity range HEV:** 480–1.300 €/año.

#### 2.7.4 Consumo HEV — WLTP puro

El HEV usa el campo `consumo_wltp_l100km` de `specs` tal cual, sin factor corrector (§2.4). Ver razón metodológica en §2.4. La confianza de la partida energía se hereda del envelope del campo WLTP (habitualmente `alta`).

### 2.8 Campos PHEV (híbrido enchufable)

El PHEV tiene TCO dependiente del comportamiento del usuario. Por tanto su ficha guarda **dos consumos separados** (eléctrico y combustión) y un **ratio eléctrico por defecto** basado en estudio sectorial, pero la UI expone un slider para que el usuario ajuste el ratio a su caso real.

#### 2.8.1 Campos adicionales específicos PHEV

```jsonc
"specs_tco": {
  // … campos comunes (depreciación, mantenimiento, seguro) …

  "consumo_electrico_wltp_kwh100km": {
    "valor": 17.5,
    "unidad": "kWh/100km",
    "fuente_tipo": "fabricante",
    "confianza": "alta",
    "notas": "Modo EV puro WLTP, batería cargada"
  },
  "consumo_combustion_wltp_l100km": {
    "valor": 6.8,
    "unidad": "L/100km",
    "fuente_tipo": "fabricante",
    "confianza": "alta",
    "notas": "Modo combustión WLTP, batería agotada — consumo realista con peso batería"
  },
  "autonomia_electrica_wltp_km": {
    "valor": 75,
    "unidad": "km",
    "fuente_tipo": "fabricante",
    "confianza": "alta"
  },
  "ratio_electrico_default": {
    "valor": 0.60,
    "unidad": "fracción",
    "fuente_tipo": "estudio_sectorial_utility_factor",
    "fuente_detalle": "ICCT 2024 — PHEV real-world utility factor España. Perfil ponderado: 60% usuarios con cargador casa (ratio medio 0.72), 40% sin cargador accesible (ratio medio 0.24).",
    "confianza": "media",
    "notas": "Slider editable por el usuario en la UI; el default es el punto central enchufa2."
  }
}
```

#### 2.8.2 `depreciacion_y{3,5,10}_pct` — PHEV

1. **Hermano térmico intra-plataforma con TCO poblado** → `baseline_compartido_intra_plataforma`, `confianza: baja`.
2. **Predecesor directo** → `analogo_predecesor`, `confianza: media`.
3. **Tabla Ganvam PHEV segmento** (disponible solo para segmentos populares: C, C-SUV, D, D-SUV) → `ganvam_segmento`, `confianza: media`.
4. **Factor PHEV sobre HEV-segmento** → §5.4. `fuente_tipo: "factor_phev_sobre_hev"`, `confianza: media`.
5. **Media PHEV categoría** → `media_phev_segmento`, `confianza: baja`.

**Nota sectorial:** la curva PHEV en España se ha visto presionada por el fin del Plan MOVES III y la incertidumbre regulatoria sobre la etiqueta CERO/ECO; en Q2 2026 la retención de un PHEV es ~5 pp peor que la de un HEV equivalente.

#### 2.8.3 `mantenimiento_anual_eur` — PHEV

1. **Plan oficial fabricante** → `fabricante`, `confianza: alta`.
2. **Plan hermano fabricante PHEV** → `plan_hermano_fabricante`, `confianza: media`.
3. **Factor PHEV sobre HEV-segmento** → partir del HEV y aplicar ×1.30 (§5.4). `factor_phev_sobre_hev`, `confianza: media`.
4. **Media PHEV categoría** → `media_phev_segmento`, `confianza: baja`.

**Sanity range PHEV:** 220–500 €/año.

#### 2.8.4 `seguro_anual_eur` — PHEV

1. **Tres cotizaciones reales** → `tres_cotizaciones_reales`, `confianza: alta`.
2. **Seguro del HEV hermano × factor PHEV §5.4** → `factor_phev_sobre_hev`, `confianza: media`.
3. **Media PHEV segmento UNESPA** → `media_phev_segmento`, `confianza: baja`.

**Sanity range PHEV:** 550–1.500 €/año.

#### 2.8.5 Cálculo de energía PHEV — WLTP puro ponderado por ratio

Desde v2.1 el PHEV **no** usa factores correctores WLTP→real (se retiran los campos `factor_real_electrico` y `factor_real_combustion`). La calculadora usa los consumos WLTP ponderados por el ratio eléctrico:

```
coste_anual_energia =
    ratio × (consumo_electrico_wltp_kwh100km / 100) × km_anuales × precio_kWh
  + (1 − ratio) × (consumo_combustion_wltp_l100km / 100) × km_anuales × precio_L
```

Donde `ratio` ∈ [0, 1] viene del slider de UI con default `ratio_electrico_default`.

**Validación de `ratio` vs autonomía eléctrica:** si `ratio × km_anuales > autonomía_electrica_wltp_km × 300` (asume ≤ 300 días efectivos carga al año), la UI muestra advertencia: "Para alcanzar este ratio el coche debería cargarse >300 días al año — poco realista".

---

## 3. Valores canónicos de `fuente_tipo`

Tabla cerrada. Cualquier `fuente_tipo` fuera de esta lista debe ser migrado o revisado.

**Cómo leer la columna "Confianza por defecto":** es el **máximo alcanzable** para ese tipo cuando el dato es íntegro (fuente primaria directa, sin ajustes ni extrapolaciones). Un JSON puede declarar una confianza **inferior** al canon cuando el valor incorpora estimaciones parciales, combinaciones con otras fuentes, o ajustes editoriales — en ese caso el motivo se documenta en `fuente_detalle` o `notas`. Un JSON **no puede** declarar confianza superior al canon. Las bandas de §4 se aplican siempre sobre la confianza declarada, no sobre el canon.

El tipo de tren (ICE/HEV/PHEV) del referente **no** se expresa en `fuente_tipo` sino en el campo `tipo` de la propia ficha referente — `baseline_compartido_intra_plataforma` aplica igual a cualquier tecnología.

| `fuente_tipo` | Campos donde aplica | Confianza por defecto |
|---|---|---|
| `baseline_compartido_intra_plataforma` | depreciación, seguro, manto | baja |
| `analogo_predecesor` | depreciación | media |
| `ganvam_segmento` | depreciación | media |
| `curva_bev_categoria` | depreciación | baja |
| `tres_cotizaciones_reales` | seguro | alta |
| `estimacion_bev_sobre_ice` | seguro | media |
| `media_segmento_unespa` | seguro | baja |
| `fabricante` | mantenimiento, consumo_wltp | alta |
| `plan_hermano_fabricante` | mantenimiento | media |
| `media_bev_categoria` | mantenimiento | baja |
| `parametros_calculador` | precio_electricidad_eur_kwh | — |
| `decision_editorial` | equivalente_termico (cualquier tipo) | alta |
| `factor_hev_sobre_ice` | depreciación, manto, seguro HEV | media |
| `factor_phev_sobre_hev` | depreciación, manto, seguro PHEV | media |
| `media_hev_segmento` | depreciación, manto, seguro HEV | baja |
| `media_phev_segmento` | depreciación, manto, seguro PHEV | baja |
| `estudio_sectorial_utility_factor` | ratio_electrico_default PHEV | media |

**Retirados en v2.1:** `ev_database` y `factor_categoria` dejan de ser `fuente_tipo` válidos — solo daban soporte a `consumo_real_factor`, que ya no existe. Si el futuro corrector (§10) los vuelve a necesitar, se reintroducirán con semántica explícita.

**Migración de nombres legacy** (sigue vigente desde v1, ampliada en v2):

| Legacy | Canónico |
|---|---|
| `curva_depreciacion_sectorial` | `ganvam_segmento` |
| `curva_depreciacion_ajustada` | `ganvam_segmento` con ajuste en `fuente_detalle`, o `analogo_predecesor` según el caso |
| `mercado_agregado`, `mercado_agregado_ajustado` | `analogo_predecesor` si era un predecesor real; `ganvam_segmento` si era tabla sectorial |
| `estimacion_sectorial` (seguro) | `media_segmento_unespa` o `estimacion_bev_sobre_ice` |
| `estimacion_proyectada` | `curva_bev_categoria` |
| `comparador_agregado` (seguro) | `tres_cotizaciones_reales` si de verdad eran 3 con perfil estándar; `estimacion_bev_sobre_ice` si no |
| `investigacion_web` | `factor_hev_sobre_ice` / `factor_phev_sobre_hev` según aplique, o eliminar si era `consumo_real_factor` |
| `dato_real_usuario` | `fabricante` si era plan oficial, `plan_hermano_fabricante` si era derivado |
| `equivalente_ice` (clave, no fuente_tipo) | Renombrar a `equivalente_termico` con `tipo: "ICE"` |
| `ev_database`, `factor_categoria` | Retirados en v2.1 — el campo `consumo_real_factor` ya no existe |

---

## 4. Bandas de incertidumbre

Cada campo central produce una banda min/max según su nivel de confianza:

| Confianza | Banda sobre el valor central |
|---|---|
| `alta` | 0% (valor fijo) |
| `media` | ±8% |
| `baja` | ±15% |

Las bandas **se propagan** en la calculadora: el TCO total se calcula tres veces (mejor / central / peor) combinando los extremos coherentes de cada partida. La banda total suele ser más estrecha que la suma simple de bandas individuales porque los extremos optimistas/pesimistas tienden a compensarse.

**Excepción y10:** siempre se fuerza a `confianza: baja` → banda ±15%, independientemente de cómo se haya derivado el valor central. No hay mercado observable de BEV de 10 años en España.

**Consumo WLTP:** su confianza se hereda del envelope de `specs.consumo_wltp_*` (habitualmente `alta` por provenir de homologación oficial). El margen por uso del conductor se expone al usuario por la vía del slider de precio de electricidad / combustible, no como banda de incertidumbre estructural en el valor central.

---

## 5. Ajustes y factores

### 5.1 Ajuste plataforma/química batería sobre Ganvam

Ganvam publica tablas por segmento y antigüedad sin distinguir plataforma ni química. Para modelos BEV aplicamos un delta sobre la cifra Ganvam base:

- **NMC premium (BMW, Mercedes, Audi) con baja oferta usada:** −5 pp sobre Ganvam. Razón: escasez en usado sostiene el precio.
- **LFP china (BYD, MG, Dongfeng):** +3 pp sobre Ganvam. Razón: percepción de marca aún en construcción, descuentos agresivos del canal nuevo presionan al usado.
- **LFP/NMC europea generalista (VW, Stellantis, Renault):** sin ajuste.
- **Tesla:** 0 pp pero `confianza: media` por volatilidad histórica de recortes de precio de lista (cada recorte desplaza la curva entera del usado).

Todo delta se documenta en `fuente_detalle` de forma explícita: *"Ganvam C-SUV y5=38% + delta −5 pp (premium NMC baja oferta) = 33%"*.

### 5.2 Factor BEV sobre seguro ICE

Cuando derivamos seguro BEV desde el ICE hermano:

- **BEV premium (>55k € nuevo):** × 1,15
- **BEV generalista (25–55k €):** × 1,08
- **BEV urbano (<25k €):** × 1,05

Razón: mayor valor asegurado y mayor coste de reparación eléctrica frente a mecánica. Dato viene de media observada en las primeras `tres_cotizaciones_reales` que hemos capturado (perfil estándar enchufa2). Se recalibra trimestralmente en las pasadas de §7.

### 5.3 Factor HEV sobre ICE de segmento

Cuando no hay dato primario disponible para un HEV, se deriva desde el ICE del mismo segmento aplicando los siguientes factores. Todos documentados en `fuente_detalle` con la forma canónica: *"ICE-{segmento} {campo} = X → × factor_hev_{valor} = Y"*.

#### 5.3.1 Depreciación HEV vs ICE

**Factor único** para todos los HEV auto-recargables, sin distinguir marca:

| Horizonte | Delta retención sobre ICE equivalente |
|---|---|
| y3 | **+3 pp** |
| y5 | +2 pp |
| y10 | +1 pp |

Mild hybrid 48V: **0 pp** (se trata como ICE puro).

**Excepción:** si un modelo concreto tiene dato Ganvam primario HEV-segmento que discrepe del factor (p. ej. Toyota RAV4 con retención documentada superior), se usa el dato Ganvam con `fuente_tipo: "ganvam_segmento"` y confianza `media`, y se documenta la divergencia en `fuente_detalle`. El factor §5.3.1 solo aplica cuando no hay dato primario — por eso su `fuente_tipo` es `factor_hev_sobre_ice` con confianza `media` (banda ±8%).

**Fuentes:** Ganvam Boletín HEV Q1 2026 + Eurotax retención 2024-Q4 + muestras Autocasion.com 2026-Q1 (n=40 por segmento top). El factor +3 pp es la media ponderada de retención HEV sobre ICE equivalente observada en España Q1 2026, agregada sin distinguir marca — la varianza intra-marca (±2 pp entre Toyota, Hyundai y Renault) se absorbe en la banda ±8% de la confianza media.

#### 5.3.2 Mantenimiento HEV vs ICE

**Factor único ×0.85** sobre el mantenimiento ICE equivalente del segmento.

**Razón documentada:**
- Frenos duran ~30-40% más por regeneración (Toyota Service data + Consumer Reports 2024).
- El motor térmico trabaja menos horas (asistencia del eléctrico en arranque + ralentí off).
- Compensación parcial: mayor complejidad electrónica, servicio batería HV cada 100k km.

Marcas sin dato propio: aplicar ×0.85 universal. Toyota publica planes Relax públicos que se prefieren siempre (→ `fabricante`, confianza alta).

#### 5.3.3 Seguro HEV vs ICE

| Rango PVP del HEV | Factor seguro sobre ICE segmento |
|---|---|
| <30k € | × 1.03 |
| 30-55k € | × 1.05 |
| >55k € | × 1.08 |

**Razón documentada:** mayor valor asegurado (batería HV 1-2 kWh añade 1.000-2.000 € al coste de reposición), electrónica de potencia más cara, pero sin el impacto BEV (batería de tracción 40-80 kWh). Dato de media observada en primeras cotizaciones perfil enchufa2 Q1 2026.

### 5.4 Factor PHEV sobre HEV de segmento

Cuando no hay dato primario disponible para un PHEV, se deriva desde el HEV del mismo segmento aplicando los siguientes factores.

#### 5.4.1 Depreciación PHEV vs HEV

**Delta único −5 pp retención a 3y, −4 pp a 5y, −2 pp a 10y** respecto al HEV equivalente.

**Razón documentada:** mayor complejidad percibida + incertidumbre regulatoria sobre etiqueta CERO/ECO + peso batería 10-15 kWh que añade coste mantenimiento percibido. Datos: Ganvam Boletín PHEV Q1 2026 + rastreo Coches.net PHEV 2023-MY con 45k km.

#### 5.4.2 Mantenimiento PHEV vs HEV

**Factor único ×1.30** sobre el mantenimiento HEV equivalente del segmento.

**Razón documentada:** sistema dual más complejo (refrigeración batería + cargador AC + gestión térmica), servicio batería HV cada 80k km, aceite motor + aceite caja potencialmente diferenciado.

#### 5.4.3 Seguro PHEV vs HEV

**Factor único ×1.10** sobre el seguro HEV equivalente del segmento.

**Razón documentada:** mayor valor asegurado (batería 10-15 kWh añade 5.000-9.000 € al coste de reposición), cargador AC integrado.

### 5.5 Degradación batería y10

Para proyectar y10 desde y5 cuando no existe análogo a 10 años:

```
y10 = y5 + (y5 − y3) × 2,0 + degradacion_soh_percibida
```

Donde `degradacion_soh_percibida` es:

- 8 puntos porcentuales para química NMC.
- 4 puntos porcentuales para química LFP.

Razón: la percepción de pérdida de autonomía a los 10 años penaliza más el residual que la degradación real. LFP sufre menos porque las curvas reales (Tesla M3 LFP, BYD Blade) muestran <10% pérdida SOH a 200.000 km.

Toda cifra y10 derivada así lleva `fuente_tipo: "curva_bev_categoria"` y `notas` explicando el cálculo.

---

## 6. Regla de consistencia intra-plataforma

Ver `docs/regla-baseline-intra-plataforma.md` para el detalle completo. Resumen operativo:

> Si dos variantes comparten plataforma, fábrica, química de batería y motorización, sus campos `specs_tco` de depreciación, seguro y mantenimiento **parten del mismo baseline**. Divergencias requieren fuente primaria citada y se capturan en el script `_audit_intra_plataforma.mjs`.

La regla aplica igual a BEV, HEV y PHEV entre variantes del mismo tren (BEV↔BEV, HEV↔HEV, PHEV↔PHEV).

**Caveat BEV vs PHEV sobre misma plataforma:** si un BEV y su hermano PHEV comparten plataforma + fábrica (p. ej. un BEV y un PHEV construidos sobre la misma base chasis), la regla intra-plataforma **no** aplica — son trenes motrices distintos con economía de escala diferente. Se pueden comparar para coherencia editorial en un artículo, pero no para baselines compartidos de `specs_tco`.

El script se ejecuta antes de cada push a `data/coches/**` y antes de publicar cualquier artículo que cite resultados del calculador.

---

## 7. Recalibración trimestral

Cada trimestre (Q1/Q2/Q3/Q4) se ejecuta una pasada de **sanity check** de muestras reales:

1. Scraping Autoscout24.es de los 20 modelos top con ≥2 años de mercado (pipeline ya probado, Chrome MCP + JS extraction). Las muestras se guardan en `data/sanity-samples/YYYY-Qn/<slug>.json` con el formato documentado en `data/sanity-samples/README.md`.
2. Se ejecuta `npm run data:tco-sanity` (script `scripts/data-pipeline/tco-sanity-check.mjs`). El script calcula la retención mediana por edad, interpola y3 e y5, y compara con los anclajes actuales de `data/coches/<slug>.json` — **sin modificar ningún JSON**.
3. Clasificación del gap observado vs actual:
   - **OK** (gap <10 %) → anclaje validado, se anota la fecha de validación.
   - **WATCH** (10–20 %) → revisar en la próxima pasada, no bloquea publicación pero se deja anotado.
   - **FLAG** (gap ≥20 %) → recalibrar el factor §5.1 afectado y revisar los modelos hermanos intra-plataforma (§6).
4. Si hay al menos un FLAG el script sale con código 1, de modo que puede cablearse a CI para prevenir regresiones de calidad en los JSON.
5. Las cotizaciones de seguro del perfil estándar se rotan al mismo ritmo — 3 modelos por trimestre pasan de `estimacion_bev_sobre_ice` a `tres_cotizaciones_reales`.
6. A partir de v2 se amplía la rotación: 2 HEV + 1 PHEV trimestrales pasan de `factor_hev_sobre_ice` / `factor_phev_sobre_hev` a `tres_cotizaciones_reales`, para afinar los factores §5.3 y §5.4 con dato primario.

**La recogida de muestras nunca reemplaza al método.** Es un control de calidad. Para patchear anclajes con muestras reales (flujo explícito de recalibración del piloto) se usa `scripts/data-pipeline/ingest-samples-cochesnet.mjs`, nunca `tco-sanity-check.mjs`. El método sigue siendo el que se describe en §2.

---

## 8. Uso en artículos

Toda pieza editorial que cite cifras del calculador debe cumplir:

1. **Mostrar rango o escenarios, no un punto.** Presentar "a 5 años te ahorras 4.050 €" sin banda viola la regla y es causa automática de retirada del artículo.
2. **Citar la versión de la metodología.** Al pie del artículo: *"Cálculo basado en metodología TCO enchufa2 v2.1 (abril 2026). Ver docs/metodologia-tco.md."*
3. **Usar cifras de la calculadora, no propias.** Si un artículo necesita un número que no está en la calculadora, primero se añade el número a la calculadora con su trazabilidad y luego se cita. Nunca al revés.
4. **No extrapolar más allá del horizonte.** La calculadora cubre 3/5/7/10 años. Un artículo no puede afirmar nada a 15 años.
5. **Rivales PHEV citados con ratio explícito.** Toda cifra TCO que compare un BEV con un PHEV debe citar el ratio eléctrico asumido ("asumiendo 60% uso eléctrico, consistente con el perfil enchufa2 estándar"). No se publica una comparativa BEV-vs-PHEV con ratio oculto — es causa automática de retirada.
6. **Consumo reportado = WLTP.** Las cifras de consumo que aparezcan en texto o gráficos de un artículo son las homologadas WLTP. Si un artículo quiere contar sobre la diferencia WLTP→real para un caso concreto, lo hace como análisis explícito y citando muestras reales documentadas — nunca inyectando un factor oculto en el TCO.

---

## 9. Historia de versiones y decisiones retrospectivas

**v2.1 — 2026-04-22**

- Retirada del campo `consumo_real_factor` del esquema BEV/HEV/PHEV. La calculadora pasa a usar consumo WLTP puro. Razón: ver §2.4.
- Retirada de los campos PHEV `factor_real_electrico` y `factor_real_combustion`. La fórmula §2.8.5 pasa a usar WLTP puro ponderado por ratio.
- Retirados `ev_database` y `factor_categoria` de la tabla canónica `fuente_tipo` de §3 (solo daban soporte a los factores eliminados).
- §2.4 reescrita como política "WLTP puro". §2.7.4 reducida a nota breve. §2.8.5 simplificada a fórmula sin factores.
- §4 pierde la excepción específica sobre `consumo_real_factor`; gana nota sobre cómo se hereda la confianza del envelope WLTP.
- §8 gana punto 6 sobre consistencia WLTP en artículos.
- Nueva §10 — roadmap del corrector de perfil de conducción con slider (ciudad/mixto/autovía + peso + Cx), condicionado a (a) dataset real, (b) modelo físico validado, (c) ratificación editorial.
- Código acompañante: `src/lib/tco/calculadora.mjs` y `resolver.mjs` pierden la multiplicación por `consumo_real_factor`; `validate-ice-equivalent.mjs` quita los 3 campos de sus listas obligatorias; tests `calculadora.test.mjs` regenerados con valores WLTP puro; Pilotos 1/2/3 reescritos.

**v2 — 2026-04-20** (congelado en tag `methodology-v2-frozen-2026-04-22`)

- Renombrado `equivalente_ice` a `equivalente_termico` con tipos `ICE` / `HEV` / `PHEV`.
- Añadidas §2.7 (HEV auto-recargable) y §2.8 (PHEV con slider de ratio eléctrico).
- Ampliada tabla `fuente_tipo` con 5 entradas nuevas: `factor_hev_sobre_ice`, `factor_phev_sobre_hev`, `media_hev_segmento`, `media_phev_segmento`, `estudio_sectorial_utility_factor`. `decision_editorial` se amplía a `equivalente_termico` (cualquier tipo).
- Añadidas §5.3 (factor HEV/ICE) y §5.4 (factor PHEV/HEV). La §5.3 v1 "Degradación batería y10" se renumera como §5.5.
- Ampliada regla §6 intra-plataforma con caveat BEV vs PHEV sobre misma plataforma.
- Ampliada §8 con exigencia de ratio explícito en artículos BEV-vs-PHEV.
- Ampliada §7 con rotación trimestral de 2 HEV + 1 PHEV a `tres_cotizaciones_reales`.
- **Mild hybrid 48V:** no se considera HEV a efectos de TCO — se usa ICE puro con consumos WLTP de fabricante.
- **Factor HEV único**, sin distinguir marca (+3pp y3 / +2pp y5 / +1pp y10). Ganvam primario prima sobre el factor cuando existe.
- **Estructura de fichas referente:** una sola carpeta `data/referencias/termicos-equivalentes/` con campo `tipo` en la ficha. Migración de `data/referencias/ice-equivalentes/` documentada en F4 del RFC `docs/rfc-tco-ampliacion-bevs-sin-par.md`.

**v1 — 2026-04-15** (congelado en tag `methodology-v1-frozen-2026-04-20`)

- Creación del documento.
- Consolidación de D1–D14 del `plan-calculadora-tco.md`.
- Incorporación de `regla-baseline-intra-plataforma.md` como §6.
- Incorporación de `perfil-estandar-seguro.md` como referencia desde §2.2.
- Tabla cerrada de `fuente_tipo` canónicos (§3) con mapa de migración desde nombres legacy.
- Bandas de incertidumbre (§4) formalizadas como ±0 / ±8% / ±15% según confianza.
- Recalibración trimestral (§7) redefinida como sanity check, no como reemplazo del método.

**Retirado — artículo 008 "El umbral de los 45k"** (commit `f269306`, 2026-04-15). Motivos de retirada: (a) iX1/iX2 con baselines divergentes sin fuente, violando §6 (aún no escrita en el momento); (b) cifra puntual de 16.170 € publicada sin banda de incertidumbre, violando §8.1. No se republica hasta que §2, §4 y §6 estén aplicados a los 20 modelos del artículo.

---

## 10. Roadmap — corrector de perfil de conducción (diferido)

**Estado:** no implementado. Abierto como línea de trabajo futura, sin fecha.

**Objetivo:** permitir al usuario modelar la desviación WLTP→real **según su propio uso**, no según un factor editorial impuesto.

**Variables previstas (inputs de UI):**

- Slider de perfil: **% ciudad / % mixto / % autovía** (suma = 100%).
- Condiciones: velocidad media autovía (default 110 km/h; rango 90–130).
- Inputs físicos del vehículo ya presentes en la ficha: `peso_kg`, `Cx` (aerodinámica), `A` (área frontal), `consumo_wltp_*`.

**Modelo previsto:** función física calibrada — energía por km a velocidad `v` proporcional a `Cx × A × v² + C_rr × masa`, con la componente electromotriz/combustión escalada por eficiencia homologada WLTP. El modelo tiene que reproducir, a velocidad WLTP equivalente (46,5 km/h mezcla ciclo), el consumo WLTP homologado — y a velocidades mayores, divergir de forma consistente con lo observado en datos reales.

**Prerrequisitos para activar:**

1. **Dataset real amplio.** ≥100 vehículos distintos con consumos reales validados (EV Database, InsideEVs, muestras propias enchufa2) y condiciones de uso documentadas.
2. **Calibración del modelo físico.** Ajustar coeficientes del modelo de forma que reproduzca el dataset con error <10% sobre la mediana, sin cherry-picking por marca o segmento.
3. **Ratificación editorial.** Javi aprueba el modelo y su ventana de error antes de exponerlo en UI como cifra pública.

**Mientras tanto:** el calculador usa WLTP puro y el slider de precio de electricidad/combustible sigue siendo la palanca por la que el usuario ajusta su escenario económico. El lector técnico entiende que WLTP es la vara de medir homologada y común para todos los vehículos.

---

*Este documento es el referente operativo único para `data/coches/*.json → specs_tco`. Cualquier discrepancia entre este documento y un JSON existente se resuelve a favor del documento, y el JSON se corrige en la siguiente pasada D2.*
