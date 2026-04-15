# Regla: baselines compartidos intra-plataforma

**Fecha:** 2026-04-15
**Origen:** incidente del artículo 008 (umbral 45k) retirado el mismo día.

## El problema

Cuando dos variantes de un mismo modelo comparten plataforma, factoría, química de batería y motorización, sus supuestos de TCO (depreciación y3/y5, seguro anual, mantenimiento anual) deben partir del mismo baseline. Si los supuestos divergen sin evidencia explícita, el calculador produce rankings artificiales.

El caso que disparó esta regla: BMW iX1 vs iX2. Ambos comparten plataforma UKL2/FAAR, factoría Ratisbona, química NMC 64,7 kWh, y motores 313 CV / 494 Nm. Los JSON tenían:

| Campo | iX1 | iX2 | Δ |
|---|---|---|---|
| `depreciacion_y3_pct` | 20% | 34% | **14 pp** |
| `depreciacion_y5_pct` | 32% | 48% | **16 pp** |
| `seguro_anual_eur` | 680 | 880 | **200 €/año** |
| `mantenimiento_anual_eur` | 230 | 380 | **150 €/año** |

Ninguna de esas divergencias estaba respaldada por datos. El resultado: el calculador producía una diferencia de 16.170 € a 5 años entre dos coches mecánicamente idénticos, que se atribuyó incorrectamente al efecto del umbral del Plan Auto+ (cuyo efecto real es 4.050 €). El artículo 008 se apoyó en esa cifra y tuvo que ser retirado.

## La regla

1. **Antes de poblar los TCO de una variante nueva**, comprobar si existe otra variante en el mismo modelo/plataforma con TCO ya poblado. Si existe, el baseline por defecto son los valores de esa hermana.
2. **Divergencias solo con evidencia citada**: si se quiere divergir de una hermana, documentar en `fuente_detalle` la fuente concreta (muestra de mercado, cotización de seguro, tarifa oficial, estudio) y bajar la confianza a `baja` mientras no haya al menos una fuente primaria.
3. **`fuente_tipo: "baseline_compartido_intra_plataforma"`** cuando un campo hereda literalmente de otra variante. Incluir en `fuente_detalle` una referencia al slug fuente (ej. "Valor compartido con bmw-ix1-xdrive30").
4. **Nunca usar `confianza: media` o `alta`** para valores heredados por defecto — al no ser dato específico del modelo, debe ser `baja` con `verificado: false` hasta que haya datos propios.

## Enforcement

`scripts/data-pipeline/_audit_intra_plataforma.mjs` escanea todos los JSONs, agrupa por plataforma + segmento, y marca divergencias superiores a los thresholds:

- y3 / y5 > 5 puntos porcentuales
- seguro > 100 €/año
- mantenimiento > 100 €/año

Exit code 1 si hay flags. Debe ejecutarse antes de cada push que toque `data/coches/**` o antes de publicar cualquier artículo que cite resultados del calculador TCO.

## Agrupación: plataforma + segmento

El script agrupa por `specs.plataforma.valor` + `segmento`. Dos coches de la misma plataforma pero distinto segmento (ej. BYD Dolphin Surf A-segment vs BYD Seal D-sedan, ambos en `e-Platform 3.0`) no son comparables para TCO y se tratan como grupos separados. Sin esta doble agrupación, el script disparaba falsos positivos.

## Ámbito de la regla

Aplica a campos de `specs_tco`: `depreciacion_y3_pct`, `depreciacion_y5_pct`, `depreciacion_y10_pct`, `seguro_anual_eur`, `mantenimiento_anual_eur`. No aplica a `consumo_real_factor` (que varía legítimamente por carrocería/aerodinámica) ni a supuestos de parámetros globales del calculador.

## Relación con Fase D

Fase D (recalibración 2026-Q2) sustituirá los baselines heredados por datos propios a medida que se recojan muestras Coches.net y cotizaciones de seguro. Hasta entonces, la regla evita que las asunciones editoriales contaminen los outputs.
