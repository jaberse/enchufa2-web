# Metodología TCO enchufa2 — v1

**Estado:** canónico
**Fecha:** 2026-04-15
**Autor:** Javi + Cowork
**Reemplaza:** Ninguno. Consolida `plan-calculadora-tco.md` §4 y §10, `perfil-estandar-seguro.md`, `regla-baseline-intra-plataforma.md` en un único referente operativo.

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
  "unidad": "fracción",            // o "€/año", "multiplicador", etc.
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
3. **Tablas Ganvam por segmento + motorización** → valor base de la tabla Ganvam pública para el segmento y la antigüedad, ajustado por factor plataforma/química batería (§5). `fuente_tipo: "ganvam_segmento"`, `confianza: media`.
4. **Curva BEV categoría** → para modelos donde Ganvam aún no publica cifras específicas BEV (Inster, Dolphin Surf, etc.), se usa la curva media BEV por segmento observada en `data/referencias/curva-depreciacion-bev.json`. `fuente_tipo: "curva_bev_categoria"`, `confianza: baja`.

**Lo que no vale como fuente:** un número redondo sin derivación documentada, una cita "Autocasion dice que…" sin el enlace y la fecha, una cifra editorial elegida "porque encaja con el artículo".

**Y10 específicamente:** siempre `confianza: baja`. No hay mercado observable de BEV de 10 años en España. El valor es una extrapolación de la curva y3 + y5 con factor de degradación batería (§5.3). Se etiqueta explícitamente en UI como "proyección experimental".

### 2.2 `seguro_anual_eur`

**Unidad:** €/año.

**Orden canónico de derivación:**

1. **Tres cotizaciones reales** con el perfil estándar (ver `docs/perfil-estandar-seguro.md`) → mediana de las 3 primas. `fuente_tipo: "tres_cotizaciones_reales"`, `confianza: alta`, `verificado: true`.
2. **Cotización del ICE equivalente × factor BEV categoría** → cuando aún no hay cotizaciones específicas del BEV, se parte del seguro del ICE hermano (con misma plataforma/carrocería) y se aplica el factor §5.2. `fuente_tipo: "estimacion_bev_sobre_ice"`, `confianza: media`.
3. **Media UNESPA por segmento BEV** → último recurso, cuando ni siquiera hay ICE equivalente. `fuente_tipo: "media_segmento_unespa"`, `confianza: baja`.

**Sanity check:** toda cifra de seguro debe caer en el rango 450–1.400 €/año para el perfil estándar. Valores fuera de rango disparan alerta en `npm run data:audit`.

### 2.3 `mantenimiento_anual_eur`

**Unidad:** €/año.

**Orden canónico de derivación:**

1. **Plan oficial del fabricante** (BMW Service Inclusive, Hyundai iCare, Citroën Essential Service, etc.) → precio total del plan / años de cobertura. `fuente_tipo: "fabricante"`, `confianza: alta`, `verificado: true`, con campo adicional `mantenimiento_cobertura` que lista lo que cubre.
2. **Plan de un coche hermano** (mismo fabricante, plataforma equivalente) cuando el BEV concreto no tiene plan publicado → `fuente_tipo: "plan_hermano_fabricante"`, `confianza: media`.
3. **Media BEV categoría** → 230 €/año ±50 como media observada en datos de plan oficial de los modelos ya cubiertos. `fuente_tipo: "media_bev_categoria"`, `confianza: baja`.

**Qué no cuenta como mantenimiento en este campo:** neumáticos, pastillas de freno, ITV desde año 4, batería de arranque. Esos se documentan en el doc de UX pero no entran en el valor de este campo (para no doble contar vs categorías del calculador).

### 2.4 `consumo_real_factor`

**Unidad:** multiplicador sobre el consumo WLTP declarado.

**Orden canónico de derivación:**

1. **Media observada en EV Database** (`ev-database.org`) para el modelo concreto → `fuente_tipo: "ev_database"`, `confianza: alta` si el modelo tiene ≥20 reportes de usuarios.
2. **Factor categoría** → para modelos nuevos sin datos, factor por carrocería: urbano 1,12 · C-hatchback 1,18 · C-SUV 1,22 · D-SUV 1,25 · D-berlina 1,20. `fuente_tipo: "factor_categoria"`, `confianza: media`.

Este factor es el único campo de `specs_tco` que **no** tiene banda de incertidumbre — varía legítimamente por carrocería y aerodinámica y la banda se absorbe en el slider de precio de electricidad (§2.5).

### 2.5 `precio_electricidad_eur_kwh`

**Siempre `null`** en los JSONs. Este campo no se almacena, se toma del slider del calculador. Default 0,17 €/kWh (70% casa PVPC valle + 30% pública), extremos 0,08 €/kWh (autoconsumo FV) y 0,55 €/kWh (100% rápida pública).

### 2.6 `equivalente_ice`

**Siempre documentado** con `{ tipo, modelo_id, razon, fuente_tipo: "decision_editorial", confianza: alta }`. La razón editorial debe citar plataforma, fábrica y posicionamiento compartido cuando existe.

---

## 3. Valores canónicos de `fuente_tipo`

Tabla cerrada. Cualquier `fuente_tipo` fuera de esta lista debe ser migrado o revisado.

**Cómo leer la columna "Confianza por defecto":** es el **máximo alcanzable** para ese tipo cuando el dato es íntegro (fuente primaria directa, sin ajustes ni extrapolaciones). Un JSON puede declarar una confianza **inferior** al canon cuando el valor incorpora estimaciones parciales, combinaciones con otras fuentes, o ajustes editoriales — en ese caso el motivo se documenta en `fuente_detalle` o `notas`. Un JSON **no puede** declarar confianza superior al canon. Las bandas de §4 se aplican siempre sobre la confianza declarada, no sobre el canon.

| `fuente_tipo` | Campos donde aplica | Confianza por defecto |
|---|---|---|
| `baseline_compartido_intra_plataforma` | depreciación, seguro, manto | baja |
| `analogo_predecesor` | depreciación | media |
| `ganvam_segmento` | depreciación | media |
| `curva_bev_categoria` | depreciación | baja |
| `tres_cotizaciones_reales` | seguro | alta |
| `estimacion_bev_sobre_ice` | seguro | media |
| `media_segmento_unespa` | seguro | baja |
| `fabricante` | mantenimiento | alta |
| `plan_hermano_fabricante` | mantenimiento | media |
| `media_bev_categoria` | mantenimiento | baja |
| `ev_database` | consumo_real_factor | alta |
| `factor_categoria` | consumo_real_factor | media |
| `parametros_calculador` | precio_electricidad_eur_kwh | — |
| `decision_editorial` | equivalente_ice | alta |

**Migración de nombres legacy** (pasada pendiente como parte de D2):

| Legacy | Canónico |
|---|---|
| `curva_depreciacion_sectorial` | `ganvam_segmento` |
| `curva_depreciacion_ajustada` | `ganvam_segmento` con ajuste en `fuente_detalle`, o `analogo_predecesor` según el caso |
| `mercado_agregado`, `mercado_agregado_ajustado` | `analogo_predecesor` si era un predecesor real; `ganvam_segmento` si era tabla sectorial |
| `estimacion_sectorial` (seguro) | `media_segmento_unespa` o `estimacion_bev_sobre_ice` |
| `estimacion_proyectada` | `curva_bev_categoria` |
| `comparador_agregado` (seguro) | `tres_cotizaciones_reales` si de verdad eran 3 con perfil estándar; `estimacion_bev_sobre_ice` si no |
| `investigacion_web` | `ev_database` o `factor_categoria` |
| `dato_real_usuario` | `fabricante` si era plan oficial, `plan_hermano_fabricante` si era derivado |

---

## 4. Bandas de incertidumbre (D13 del plan)

Cada campo central produce una banda min/max según su nivel de confianza:

| Confianza | Banda sobre el valor central |
|---|---|
| `alta` | 0% (valor fijo) |
| `media` | ±8% |
| `baja` | ±15% |

Las bandas **se propagan** en la calculadora: el TCO total se calcula tres veces (mejor / central / peor) combinando los extremos coherentes de cada partida. La banda total suele ser más estrecha que la suma simple de bandas individuales porque los extremos optimistas/pesimistas tienden a compensarse.

**Excepción:** `consumo_real_factor` no tiene banda propia; se absorbe en el slider del precio de electricidad, que el usuario mueve explícitamente.

**Excepción y10:** siempre se fuerza a `confianza: baja` → banda ±15%, independientemente de cómo se haya derivado el valor central. No hay mercado observable de BEV de 10 años en España.

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

### 5.3 Degradación batería y10

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

El script se ejecuta antes de cada push a `data/coches/**` y antes de publicar cualquier artículo que cite resultados del calculador.

---

## 7. Recalibración trimestral (D5 del nuevo Fase D)

Cada trimestre (Q1/Q2/Q3/Q4) se ejecuta una pasada de **sanity check** de muestras reales:

1. Scraping Autoscout24.es de los 20 modelos top con ≥2 años de mercado (pipeline ya probado, Chrome MCP + JS extraction).
2. Se calcula la depreciación implícita observada vs la que tenemos en el JSON.
3. Si el gap es <10%, se deja tal cual y se anota la fecha de validación.
4. Si el gap es ≥10%, se recalibra el factor del §5.1 correspondiente y se revisan los modelos afectados.
5. Las cotizaciones de seguro del perfil estándar se rotan al mismo ritmo — 3 modelos por trimestre pasan de `estimacion_bev_sobre_ice` a `tres_cotizaciones_reales`.

**La recogida de muestras nunca reemplaza al método.** Es un control de calidad. El método sigue siendo el que se describe en §2.

---

## 8. Uso en artículos

Toda pieza editorial que cite cifras del calculador debe cumplir:

1. **Mostrar rango o escenarios, no un punto.** Presentar "a 5 años te ahorras 4.050 €" sin banda viola la regla y es causa automática de retirada del artículo.
2. **Citar la versión de la metodología.** Al pie del artículo: *"Cálculo basado en metodología TCO enchufa2 v1 (abril 2026). Ver docs/metodologia-tco.md."*
3. **Usar cifras de la calculadora, no propias.** Si un artículo necesita un número que no está en la calculadora, primero se añade el número a la calculadora con su trazabilidad y luego se cita. Nunca al revés.
4. **No extrapolar más allá del horizonte.** La calculadora cubre 3/5/7/10 años. Un artículo no puede afirmar nada a 15 años.

---

## 9. Historia de versiones y decisiones retrospectivas

**v1 — 2026-04-15**

- Creación del documento.
- Consolidación de D1–D14 del `plan-calculadora-tco.md`.
- Incorporación de `regla-baseline-intra-plataforma.md` como §6.
- Incorporación de `perfil-estandar-seguro.md` como referencia desde §2.2.
- Tabla cerrada de `fuente_tipo` canónicos (§3) con mapa de migración desde nombres legacy.
- Bandas de incertidumbre (§4) formalizadas como ±0 / ±8% / ±15% según confianza.
- Recalibración trimestral (§7) redefinida como sanity check, no como reemplazo del método.

**Retirado — artículo 008 "El umbral de los 45k"** (commit `f269306`, 2026-04-15). Motivos de retirada: (a) iX1/iX2 con baselines divergentes sin fuente, violando §6 (aún no escrita en el momento); (b) cifra puntual de 16.170 € publicada sin banda de incertidumbre, violando §8.1. No se republica hasta que §2, §4 y §6 estén aplicados a los 20 modelos del artículo.

---

*Este documento es el referente operativo único para `data/coches/*.json → specs_tco`. Cualquier discrepancia entre este documento y un JSON existente se resuelve a favor del documento, y el JSON se corrige en la siguiente pasada D2.*
