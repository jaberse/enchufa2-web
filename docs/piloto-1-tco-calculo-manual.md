# Piloto 1 — Cálculo TCO manual: Citroën ë-C3 You vs C3 PureTech 100 You

**Fecha:** 13 abril 2026
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

---

## Citroën C3 PureTech 100 You (gasolina)

| Concepto | Cálculo | Total 5 años |
|---|---|---|
| Adquisición | PVP | **17.426 €** |
| Consumo real | 5,6 L/100 × 1,10 = 6,16 L/100km | — |
| Energía | 75.000 × 6,16/100 × 1,55 | **7.161 €** |
| Mantenimiento | 350 €/año × 5 | **1.750 €** |
| Seguro | 494 €/año × 5 | **2.470 €** |
| Impuesto circulación | 80 €/año × 5 | **400 €** |
| **Subtotal costes** | | **29.207 €** |
| Depreciación 5 años | 45% × 17.426 = 7.842 € pérdida | — |
| Valor residual | 17.426 − 7.842 | **9.584 €** |
| **TCO neto (coste total propiedad)** | Subtotal − Valor residual | **19.623 €** |
| **TCO por km** | 19.623 / 75.000 | **0,262 €/km** |

---

## Citroën ë-C3 You (eléctrico)

| Concepto | Cálculo | Total 5 años |
|---|---|---|
| Adquisición (PVP lista, sin Plan Auto+) | PVP | **23.800 €** |
| Consumo real | 15,9 kWh/100 × 1,18 = 18,76 kWh/100km | — |
| Energía | 75.000 × 18,76/100 × 0,17 | **2.392 €** |
| Mantenimiento | 150 €/año × 5 | **750 €** |
| Seguro | 313 €/año × 5 | **1.565 €** |
| Impuesto circulación | 80 €/año × 5 | **400 €** |
| **Subtotal costes** | | **28.907 €** |
| Depreciación 5 años | 62,5% × 23.800 = 14.875 € pérdida | — |
| Valor residual | 23.800 − 14.875 | **8.925 €** |
| **TCO neto (coste total propiedad)** | Subtotal − Valor residual | **19.982 €** |
| **TCO por km** | 19.982 / 75.000 | **0,266 €/km** |

### Variante: ë-C3 con Plan Auto+ (4.500€)

| Concepto | | |
|---|---|---|
| Adquisición | PVP 23.800 − 4.500 ayuda | **19.300 €** |
| Resto costes + depreciación proporcional | 5.107 + (62,5% × 19.300) = 5.107 + 12.063 | — |
| Valor residual ajustado | 19.300 − 12.063 | **7.237 €** |
| **TCO neto con Plan Auto+** | (19.300 + 5.107) − 7.237 | **17.170 €** |
| **TCO por km** | 17.170 / 75.000 | **0,229 €/km** |

---

## Comparación

| Modelo | PVP | TCO 5 años | TCO €/km |
|---|---|---|---|
| C3 PureTech 100 | 17.426 € | **19.623 €** | 0,262 |
| ë-C3 (sin ayuda) | 23.800 € | **19.982 €** | 0,266 |
| ë-C3 (con Plan Auto+) | 19.300 € | **17.170 €** | 0,229 |

**Diferencia a favor del ë-C3 con Plan Auto+:** −2.453 € en 5 años (−12,5%).
**Sin ayuda, prácticamente empate** (+359 € para el ë-C3, +1,8%).

---

## Análisis de sensibilidad rápido

**¿Qué variable mueve más el resultado?**

1. **Depreciación EV a 5 años (62,5% asumido).** Si es en realidad 55% → ë-C3 gana por 600€ adicionales. Si es 70% → C3 gana por 600€. **La incertidumbre de depreciación EV domina el resultado.**
2. **Precio electricidad.** Si usas 100% casa PVPC valle (0,12 €/kWh) → ë-C3 ahorra 700 € adicionales en energía. Si usas 100% pública rápida (0,45 €/kWh) → C3 gana por 1.500 €.
3. **Seguro.** Las cifras Rastreator agregado cambian rápido. 3 cotizaciones reales podrían mover ±200€ al año = ±1.000€ a 5 años.

---

## Validación de la metodología

✓ Fórmula canónica ICCT aplicada
✓ Energía calculada con consumo real (factor ICCT 1,18 EV / 1,10 ICE)
✓ Depreciación como pérdida absoluta (no interés compuesto del valor)
✓ Impuesto circulación incluido
✓ Plan Auto+ modelado como reducción del precio de adquisición (no como cash flow)

⚠ **Puntos débiles identificados:**
- Depreciación ë-C3 a 5 años es proyección, no dato histórico. El modelo llegó a mercado 4Q 2024.
- Depreciación C3 a 5 años se ajustó a curva sectorial por muestra insuficiente en Coches.net.
- Seguro es agregado de mercado, no cotización específica.
- Mantenimiento ë-C3 es estimación sectorial (sin tarifa oficial publicada).

---

## Decisiones pendientes antes de producción

1. **Precio de electricidad:** ¿usamos mix enchufa2 (0,17 €/kWh) como default? ¿Lo exponemos como slider al usuario?
2. **Precio gasolina:** ¿cifra fija o vinculada al Geoportal del MITECO en real-time?
3. **Horizonte:** ¿5 años como default y 10 años como opción secundaria?
4. **Visualización de incertidumbre:** ¿mostramos rango (mejor/esperado/peor caso) o solo punto central con disclaimer?
5. **Depreciación EV:** ¿aceptamos proyecciones hasta tener histórico real, o bloqueamos modelos con <3 años de mercado?

---

*Fin del cálculo manual. Estos resultados son pre-validación: no se pueden publicar hasta resolver los puntos débiles.*
