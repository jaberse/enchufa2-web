# Migración fuente_tipo v1 — Warnings de confianza pendientes

**Fecha:** 2026-04-15
**Origen:** pasada de `scripts/data-pipeline/_migrate_fuente_tipo_v1.mjs --apply` tras publicar `docs/metodologia-tco.md` v1.
**Estado:** 99 campos migrados a nombres canónicos. 22 warnings de confianza pendientes de revisión manual.

## Resumen

La migración de `fuente_tipo` legacy a los nombres canónicos de §3 de la metodología se ha aplicado a los 20 JSONs con `specs_tco`. Los cambios de nombre son seguros. Lo que queda pendiente es revisar **divergencias de confianza**: casos en los que el valor actual de `confianza` del JSON no coincide con el valor por defecto que la metodología asigna al nuevo `fuente_tipo` canónico.

Ninguna divergencia se ha auto-corregido — cada una requiere decisión editorial explícita porque el valor de `confianza` impacta directamente sobre la banda de incertidumbre de la calculadora (§4 de la metodología).

## Excepción ya aplicada en el script

- **y10 siempre confianza `baja`** (§4 excepción). El script no marca warning cuando `depreciacion_y10_pct` tiene confianza baja aunque el canon del tipo sea media. Son 20 casos que son correctos por definición.

## Warnings por categoría

### A. Promote candidato: mantenimiento + fabricante → debería ser `alta`

15 modelos con `fuente_tipo: fabricante` y `confianza: media`. La metodología dice que `fabricante` es `alta` por defecto, pero media puede estar justificada si el plan del fabricante no cubre todo (p.ej. solo años 1–3, o solo revisiones sin consumibles).

Revisar caso por caso:
- byd-atto-2-comfort
- byd-atto-3-comfort
- byd-dolphin-60kwh
- byd-dolphin-surf-comfort
- byd-seal-awd-excellence
- dacia-spring-essential
- hyundai-inster-long-range
- hyundai-kona-electric-65-kwh
- jeep-avenger-electric
- kia-ev3-long-range
- mercedes-eqa-250+
- peugeot-e-2008-allure
- renault-5-e-tech-comfort-range
- skoda-elroq-60
- tesla-model-y-rwd-long-range
- toyota-bz4x-fwd

**Criterio de decisión:** si el `fuente_detalle` cita un plan oficial con precio publicado y años de cobertura explícitos, promote a `alta`. Si solo cita "típico de la marca" o "promedio", dejar en `media` y considerar si el tipo correcto es `plan_hermano_fabricante`.

### B. Demote candidato: consumo + factor_categoria → debería ser `media`

2 modelos con `fuente_tipo: factor_categoria` y `confianza: alta`. La metodología dice que `factor_categoria` es `media` por defecto porque es una media por carrocería sin datos del modelo concreto.

- byd-atto-2-comfort
- citroen-e-c3-you

**Criterio de decisión:** verificar si el `fuente_detalle` realmente cita datos del modelo concreto. Si los cita, el tipo correcto es `ev_database` (que sí es alta). Si son datos agregados de carrocería, bajar a `media`.

### C. Demote candidato: citroen-e-c3 mantenimiento + media_bev_categoria → debería ser `baja`

1 caso:
- citroen-e-c3-you · mantenimiento_anual_eur · media_bev_categoria: actual=media canon=baja

**Criterio:** si se migró desde `estimacion_sectorial` a `media_bev_categoria`, la confianza correcta es baja. Bajar a baja.

### D. Demote candidato: tesla M3 mantenimiento + plan_hermano_fabricante → debería ser `media`

1 caso:
- tesla-model-3-rwd-highland · mantenimiento_anual_eur · plan_hermano_fabricante: actual=alta canon=media

**Criterio:** Tesla no tiene plan oficial de mantenimiento publicado para España. Si se derivó de datos reales de usuarios o plan US, el tipo correcto puede ser `fabricante` con verificado:true o `plan_hermano_fabricante` con confianza media. Bajar a media por defecto.

### E. Conservados: iX1 con confianza `baja` sobre `ganvam_segmento`

3 casos:
- bmw-ix1-xdrive30 · depreciacion_y3_pct
- bmw-ix1-xdrive30 · depreciacion_y5_pct
- bmw-ix1-xdrive30 · seguro_anual_eur

**No tocar.** Estos valores son el resultado de la unificación baseline con iX2 el 2026-04-15. Se bajó a `baja` explícitamente para marcar que son datos heredados, no verificados individualmente para el iX1. La divergencia con el canon (media) es intencional y está documentada en `docs/regla-baseline-intra-plataforma.md`.

## Siguiente paso

Revisión caso por caso de A-D en una pasada manual. E se deja como está.

Cuando la revisión esté hecha, ejecutar:

```bash
node scripts/data-pipeline/_audit_intra_plataforma.mjs
npm run data:build
npm run data:audit
```

Todo debe pasar sin errores antes de commit.
