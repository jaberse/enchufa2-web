# Migración fuente_tipo v1 — Warnings de confianza · Resuelto

**Fecha creación:** 2026-04-15
**Fecha resolución:** 2026-04-15
**Origen:** pasada de `scripts/data-pipeline/_migrate_fuente_tipo_v1.mjs --apply` tras publicar `docs/metodologia-tco.md` v1.
**Estado:** ✅ 22 warnings revisados caso por caso. 4 demotes aplicados, 15 conservados con justificación, 3 heredados del iX1 conservados. Metodología §3 refinada para aceptar divergencia legítima a la baja.

---

## Resumen de decisiones

| Grupo | Casos | Decisión | Resultado |
|---|---|---|---|
| A — manto · fabricante media | 15 | Conservar | `fabricante` + `media` es legítimo: valor combina plan oficial + estimación de consumibles |
| B — consumo · factor_categoria alta | 2 | **Demote a media** | ICCT por categoría, no medición del modelo |
| C — ëC3 manto · media_bev_categoria media | 1 | **Demote a baja** | Tarifa Citroën Essential Service no publicada, es estimación sectorial |
| D — Tesla M3 manto · plan_hermano_fabricante alta | 1 | **Demote a media** | Datos de bloggers (Agirregabiria, hibridosyelectricos), no oficial |
| E — iX1 baseline_compartido | 3 | Conservar | Marcados baja en la unificación con iX2 del 2026-04-15 |

Total: **4 demotes aplicados**, 18 conservados con justificación.

---

## Grupo A — Conservado con refinamiento metodológico

15 modelos con `fuente_tipo: fabricante` y `confianza: media`:

- byd-atto-2-comfort · byd-atto-3-comfort · byd-dolphin-60kwh · byd-dolphin-surf-comfort · byd-seal-awd-excellence
- dacia-spring-essential · hyundai-inster-long-range · hyundai-kona-electric-65-kwh
- jeep-avenger-electric · kia-ev3-long-range · mercedes-eqa-250+
- peugeot-e-2008-allure · renault-5-e-tech-comfort-range · skoda-elroq-60
- tesla-model-y-rwd-long-range · toyota-bz4x-fwd

**Análisis:** al revisar el `fuente_detalle` de los 15, todos cumplen el patrón *"Plan [marca] Xy/Yk km ≈ Z€ → N€/año + consumibles"*. Es decir, parten del plan oficial del fabricante (que es información primaria verificable) pero suman una estimación de consumibles (neumáticos, pastillas, ITV prorrateada) que no viene del plan oficial. Ejemplo real del Kia EV3 LR:

> Plan Kia 3y/45k km ≈ 540€ → ~180€/año + consumibles.

El tipo `fabricante` es correcto — la fuente primaria **es** el fabricante. Pero el valor final incorpora una estimación adicional, lo que justifica declarar `media` en vez de `alta`.

**Refinamiento aplicado a la metodología (§3):** se añade nota explícita de que la confianza canónica es el máximo alcanzable para ese tipo cuando el dato es íntegro, y que un JSON puede declarar confianza inferior cuando incorpora estimaciones parciales, documentándolo en `fuente_detalle` o `notas`. No se permite declarar confianza superior al canon.

Con este refinamiento, los 15 casos dejan de ser warnings: `fabricante` + `media` + `fuente_detalle` que explicita el ajuste es una combinación válida.

---

## Grupo B — Demote aplicado (2 casos)

### byd-atto-2-comfort · consumo_real_factor
- Antes: `factor_categoria · alta · verificado: true`
- Después: `factor_categoria · media · verificado: false`
- Razón: `fuente_detalle` cita *"ICCT Real-World Energy Consumption 2024 — BEV SUV generalista ~15-22% sobre WLTP"*. Es un rango de categoría, no una medición del Atto 2. El canon de `factor_categoria` es media.
- Nota añadida: *"Factor derivado de rango ICCT 15-22% para BEV SUV generalista, no medición específica Atto 2. Confianza media por ser factor de categoría."*

### citroen-e-c3-you · consumo_real_factor
- Antes: `factor_categoria · alta · verificado: true`
- Después: `factor_categoria · media · verificado: false`
- Razón: `fuente_detalle` dice literalmente *"factor estándar EV Europa"*. No hay medición del ëC3 concreto.
- Nota añadida: *"Factor estándar ICCT por carrocería, no medición específica ëC3. Confianza media por ser factor de categoría (§2.4 metodología-tco.md)."*

---

## Grupo C — Demote aplicado (1 caso)

### citroen-e-c3-you · mantenimiento_anual_eur
- Antes: `media_bev_categoria · media`
- Después: `media_bev_categoria · baja`
- Razón: `notas` del JSON dice *"Tarifa Citroën Essential Service no publicada; estimación sectorial EV"*. Si no hay dato oficial publicado, el canon de `media_bev_categoria` es baja.

---

## Grupo D — Demote aplicado (1 caso)

### tesla-model-3-rwd-highland · mantenimiento_anual_eur
- Antes: `plan_hermano_fabricante · alta · verificado: true`
- Después: `plan_hermano_fabricante · media · verificado: false`
- Razón: Tesla no publica plan oficial de mantenimiento para España. El `fuente_detalle` cita *"Media de casos reales documentados: 163€ en 4 años (Agirregabiria) y 330€ en 5 años (hibridosyelectricos.com)"*. Son datos de divulgadores, no oficiales. No es medición primaria.
- Gap pendiente: el tipo `plan_hermano_fabricante` no encaja exactamente (no se tomó de otra marca, son datos de usuarios Tesla). Podría requerir un nuevo tipo `casos_documentados_usuarios` en la v2 de la metodología — queda como nota para la revisión.

---

## Grupo E — Conservado (3 casos)

- bmw-ix1-xdrive30 · depreciacion_y3_pct
- bmw-ix1-xdrive30 · depreciacion_y5_pct
- bmw-ix1-xdrive30 · seguro_anual_eur

No se tocan. Son el resultado de la unificación baseline con iX2 del 2026-04-15 (commit `65891d2`). Se bajaron a `baja` intencionalmente para marcar que son datos heredados del hermano, no verificados para el iX1 individualmente. La divergencia con el canon es consciente y está documentada en `docs/regla-baseline-intra-plataforma.md`.

---

## Auditoría posterior

Tras aplicar los 4 demotes:

```bash
node scripts/data-pipeline/_migrate_fuente_tipo_v1.mjs   # dry-run
node scripts/data-pipeline/_audit_intra_plataforma.mjs
npm run data:build
```

Todos deben pasar sin errores. Los únicos warnings residuales deberían ser:
- 15 casos de grupo A (aceptados por refinamiento §3)
- 3 casos de grupo E (aceptados por regla intra-plataforma)

---

*Gap pendiente para v2 de la metodología:* crear un tipo `casos_documentados_usuarios` para cuando el coste de mantenimiento se deriva de reportes reales de propietarios (divulgadores EV, foros). Caso de uso: Tesla (sin plan oficial). Confianza por defecto: media.*
