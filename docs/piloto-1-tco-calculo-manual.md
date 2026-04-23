# Piloto 1 — Cálculo TCO manual: Citroën ë-C3 You vs C3 PureTech 100 You

**Fecha:** 2026-04-13 · recalculado 2026-04-22 (metodología v2.1, WLTP puro).
**Propósito:** validar a mano la fórmula y los supuestos del Calculador TCO antes de escalar a 20 modelos.
**Estado de los datos:** borrador. Depreciación a 5 años es la principal fuente de incertidumbre en ambos modelos.

---

## Parámetros comunes

| Parámetro | Valor | Fuente |
|---|---|---|
| Horizonte | 5 años | D6 — decisión editorial |
| Uso anual | 15.000 km | Perfil estándar enchufa2 |
| Km totales | 75.000 km | — |
| Precio gasolina 95 | 1,55 €/L | Geoportal gasolineras MITECO abril 2026 |
| Precio electricidad doméstica PVPC valle | 0,12 €/kWh | Ref. 2026 España |
| Mix carga enchufa2 (70% casa / 30% pública) | 0,17 €/kWh | 0,7×0,12 + 0,3×0,30 |
| Impuesto circulación | 80 €/año | Estimación zona media |

**Nota v2.1:** todos los consumos se usan en valor WLTP homologado. No se aplica factor corrector WLTP→real (razón en `docs/metodologia-tco.md` §2.4).

---

## Citroën C3 PureTech 100 You (gasolina)

| Concepto | Cálculo | Total 5 años |
|---|---|---|
| Adquisición | PVP | **17.426 €** |
| Consumo WLTP | 5,6 L/100km | — |
| Energía | 75.000 × 5,6/100 × 1,55 | **6.510 €** |
| Mantenimiento | 350 €/año × 5 | **1.750 €** |
| Seguro | 494 €/año × 5 | **2.470 €** |
| Impuesto circulación | 80 €/año × 5 | **400 €** |
| **Subtotal costes** | | **28.556 €** |
| Depreciación 5 años | 45% × 17.426 = 7.842 € pérdida | — |
| Valor residual | 17.426 − 7.842 | **9.584 €** |
| **TCO neto (coste total propiedad)** | Subtotal − Valor residual | **18.972 €** |
| **TCO por km** | 18.972 / 75.000 | **0,253 €/km** |

---

## Citroën ë-C3 You (eléctrico)

| Concepto | Cálculo | Total 5 años |
|---|---|---|
| Adquisición (PVP lista, sin Plan Auto+) | PVP | **23.800 €** |
| Consumo WLTP | 15,9 kWh/100km | — |
| Energía | 75.000 × 15,9/100 × 0,17 | **2.027 €** |
| Mantenimiento | 150 €/año × 5 | **750 €** |
| Seguro | 313 €/año × 5 | **1.565 €** |
| Impuesto circulación | 80 €/año × 5 | **400 €** |
| **Subtotal costes** | | **28.542 €** |
| Depreciación 5 años | 62,5% × 23.800 = 14.875 € pérdida | — |
| Valor residual | 23.800 − 14.875 | **8.925 €** |
| **TCO neto (coste total propiedad)** | Subtotal − Valor residual | **19.617 €** |
| **TCO por km** | 19.617 / 75.000 | **0,262 €/km** |

### Variante: ë-C3 con Plan Auto+ (4.500€)

La ayuda se modela como reducción del TCO final (convención Piloto 2/3). Bajo esa convención el PVP y la depreciación se mantienen; la ayuda entra como crédito:

| Concepto | | |
|---|---|---|
| TCO sin ayuda | — | **19.617 €** |
| Plan Auto+ EEE | 4.500 € | **−4.500 €** |
| **TCO neto con Plan Auto+** | | **15.117 €** |
| **TCO por km** | 15.117 / 75.000 | **0,202 €/km** |

---

## Comparación

| Modelo | PVP | TCO 5 años | TCO €/km |
|---|---|---|---|
| C3 PureTech 100 | 17.426 € | **18.972 €** | 0,253 |
| ë-C3 (sin ayuda) | 23.800 € | **19.617 €** | 0,262 |
| ë-C3 (con Plan Auto+) | 23.800 € | **15.117 €** | 0,202 |

**Diferencia con Plan Auto+:** ë-C3 ahorra 3.855 € frente al C3 (−20,3%).
**Sin ayuda, empate estructural ligeramente favorable al ICE:** +645 € para el ë-C3 (+3,4%).

**Lectura editorial v2.1:** el empate del escenario sin ayuda refleja que, a WLTP homologado, la ventaja energética del ë-C3 (4.483 € menos en 5 años) no compensa por sí sola el gap de depreciación entre un urbano eléctrico nuevo y un compacto gasolina que ya depreció lo peor en el mercado usado. El Plan Auto+ desplaza la balanza sin ambigüedad.

---

## Análisis de sensibilidad rápido

**¿Qué variable mueve más el resultado?**

1. **Depreciación EV a 5 años (62,5% asumido).** Si es en realidad 55% → ë-C3 mejora ~600€. Si es 70% → C3 gana por ~600€. **La incertidumbre de depreciación EV domina el resultado.**
2. **Precio electricidad.** Si usas 100% casa PVPC valle (0,12 €/kWh) → ë-C3 ahorra ~600 € adicionales en energía. Si usas 100% pública rápida (0,45 €/kWh) → C3 gana por ~3.300 €.
3. **Seguro.** Las cifras de mercado cambian rápido. 3 cotizaciones reales podrían mover ±200€ al año = ±1.000€ a 5 años.

---

## Validación de la metodología

✓ Fórmula canónica ICCT aplicada
✓ Energía calculada con consumo **WLTP** homologado (v2.1 — no se aplica factor corrector)
✓ Depreciación como pérdida absoluta (no interés compuesto del valor)
✓ Impuesto circulación incluido
✓ Plan Auto+ modelado como reducción del TCO neto

⚠ **Puntos débiles identificados:**
- Depreciación ë-C3 a 5 años es proyección, no dato histórico. El modelo llegó a mercado 4Q 2024.
- Depreciación C3 a 5 años se ajustó a curva sectorial por muestra insuficiente en Coches.net.
- Seguro es agregado de mercado, no cotización específica.
- Mantenimiento ë-C3 es estimación sectorial (sin tarifa oficial publicada).

---

## Decisiones cerradas (v1) que siguen vigentes

Resueltas el 13 abril 2026 (ver plan-calculadora-tco.md §10 D10–D14):

1. **Precio electricidad** → ✅ **Slider configurable**. Default mix enchufa2 0,17 €/kWh. Rango 0,08 (autoconsumo FV) a 0,55 €/kWh (100% rápida pública).
2. **Precio gasolina** → ✅ **Real-time Geoportal MITECO** vía cron diario. Fallback al último valor cacheado.
3. **Horizonte** → ✅ **5 años default, configurable**. Selector 3/5/7/10 años. 5 destacado.
4. **Visualización incertidumbre** → ✅ **Rango mejor/esperado/peor**. Confianza baja ±15%, media ±8%, alta sin rango.
5. **Modelos <3 años** → ✅ **Proyección + disclaimer explícito**. Badge "Datos proyectados" + fuente de análogo documentada. Revisión trimestral.

**Decisión v2.1 aplicada aquí:** se retira el factor WLTP→real de la energía. Cualquier corrector por perfil de conducción (ciudad/mixto/autovía + Cx + peso) queda diferido al roadmap §10 de la metodología, pendiente de dataset real y calibración física.

---

*Fin del cálculo manual. Estos resultados son los valores canónicos contra los que validan los tests unitarios en `src/lib/tco/calculadora.test.mjs`.*
