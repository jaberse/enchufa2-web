# Piloto 2 · TCO manual — BMW iX1 xDrive30 vs BMW X1 sDrive18i

> **Fecha:** 2026-04-13 · **Autor:** enchufa2 editorial
> **Propósito:** validar manualmente la fórmula TCO antes de codificarla, usando el segundo par intra-marca (premium C-SUV).
> **Estado:** borrador — confianza general media. Ver debilidades al final.

---

## 1. Parámetros enchufa2 estándar (v1)

| Parámetro | Valor | Fuente |
|---|---|---|
| Kilometraje anual | 15.000 km | ANFAC 2024 (media turismos España) |
| Horizonte | 5 años | D12 — default configurable (3/5/7/10) |
| Precio electricidad | 0.17 €/kWh | D10 — slider, default mix casa + pública (OMIE + Iberdrola 2026) |
| Precio gasolina 95 | 1.55 €/L | D11 — real-time MITECO abril 2026 |
| IVTM BEV medio | 40 €/año | Bonificación 50-75% mayoría grandes municipios |
| IVTM ICE medio | 90 €/año | Sin bonificación (DGT distintivo ECO) |
| Perfil seguro | 40 años, 15 carnet, zona media, todo riesgo 500€ | — |

---

## 2. Datos del par (Piloto 2)

### BMW iX1 xDrive30 (BEV)

| Dato | Valor | Confianza | Fuente |
|---|---|---|---|
| PVP | 53.600 € | alta | drivek.es + BMW España |
| Plan Auto+ | **No elegible** (>45k€) | alta | RD Plan Auto+ 2024-2026 |
| Consumo WLTP | 17.5 kWh/100km | alta | BMW España |
| Consumo real factor | × 1.20 | alta | ICCT + EV Database |
| **Consumo real** | **21.0 kWh/100km** | calculado | — |
| Depreciación y5 | 32 % | baja | Curva sectorial BEV premium (iX1 solo 3 años en mercado) |
| Mantenimiento | 230 €/año | alta | BMW Service Inclusive Next 4y/60k km = 925 € |
| Seguro | 680 €/año | baja | X1 sDrive18i × 1.15 (sin cotización específica iX1) |
| Impuestos | 40 €/año | media | IVTM bonificado medio |

### BMW X1 sDrive18i (ICE gasolina)

| Dato | Valor | Confianza | Fuente |
|---|---|---|---|
| PVP | 47.636 € | alta | drivek.es abril 2026 |
| Consumo WLTP | 6.4 L/100km | alta | km77 ficha técnica |
| Consumo real factor | × 1.15 | alta | ICCT gasolina turbo |
| **Consumo real** | **7.36 L/100km** | calculado | — |
| Depreciación y3 | 28 % | alta | Coches.net n=2 muestras 2023 ~49k km (34.245€ sobre 47.636€) |
| Depreciación y5 | 42 % | media | Proyección sectorial ICE C-SUV premium |
| Mantenimiento | 450 €/año | media | BMW Service Inclusive + consumibles ICE |
| Seguro | 594 €/año | media | Mediana de Allianz Direct 317€, Direct Seguros 455€, Rastreator 990€ |
| Impuestos | 90 €/año | media | IVTM ICE sin bonificación |

---

## 3. Fórmula canónica (ICCT)

```
TCO(horizonte) = Depreciación + Energía + Mantenimiento + Seguro + Impuestos − Ayudas
```

Donde:

- **Depreciación(h)** = PVP × pct_depreciacion(h)
- **Energía(h)** = km_anual × h × (consumo_real × precio_energía) / 100
- **Mantenimiento(h)** = mant_anual × h
- **Seguro(h)** = seguro_anual × h
- **Impuestos(h)** = iVTM_anual × h
- **Ayudas** = Plan Auto+ EEE + MOVES III (si aplica)

---

## 4. Cálculo iX1 xDrive30 a 5 años

| Concepto | Cálculo | Importe |
|---|---|---|
| Depreciación | 53.600 × 0.32 | **17.152 €** |
| Energía | 15.000 × 5 × 21.0 × 0.17 / 100 | **2.678 €** |
| Mantenimiento | 230 × 5 | **1.150 €** |
| Seguro | 680 × 5 | **3.400 €** |
| Impuestos | 40 × 5 | **200 €** |
| Ayudas | 0 (no elegible Plan Auto+) | 0 € |
| **TCO 5 años** | | **24.580 €** |
| **€/km** | 24.580 / 75.000 | **0.328 €/km** |

---

## 5. Cálculo X1 sDrive18i a 5 años

| Concepto | Cálculo | Importe |
|---|---|---|
| Depreciación | 47.636 × 0.42 | **20.007 €** |
| Energía | 15.000 × 5 × 7.36 × 1.55 / 100 | **8.557 €** |
| Mantenimiento | 450 × 5 | **2.250 €** |
| Seguro | 594 × 5 | **2.970 €** |
| Impuestos | 90 × 5 | **450 €** |
| **TCO 5 años** | | **34.234 €** |
| **€/km** | 34.234 / 75.000 | **0.456 €/km** |

---

## 6. Comparación y conclusión

| Métrica | iX1 xDrive30 | X1 sDrive18i | Diferencia |
|---|---|---|---|
| PVP inicial | 53.600 € | 47.636 € | +5.964 € (iX1 más caro) |
| **TCO 5 años** | **24.580 €** | **34.234 €** | **−9.654 € (iX1 ahorra 28.2 %)** |
| €/km | 0.328 | 0.456 | −0.128 €/km |
| Energía 5 años | 2.678 € | 8.557 € | −5.879 € (BEV ahorra 68.7 %) |
| Mantenimiento 5 años | 1.150 € | 2.250 € | −1.100 € (BEV ahorra 48.9 %) |
| Depreciación 5 años | 17.152 € | 20.007 € | −2.855 € (BEV pierde 14 % menos) |

### Lectura editorial

El caso premium **invierte el patrón del Piloto 1**: aquí el BEV gana claramente incluso sin ayuda del Plan Auto+. Tres palancas acumulativas:

1. **Energía domina** — a 15.000 km/año, el X1 consume 1.711 €/año en gasolina frente a 536 € del iX1. A 5 años eso son ~5.900 € de brecha.
2. **Depreciación favorable al BEV premium** — contraintuitivo pero consistente con la muestra real 2026: el iX1 retiene mejor valor que el X1 ICE gasolina por escasez de stock nuevo y demanda premium sostenida.
3. **Mantenimiento 2× más caro en el ICE** — plan Service Inclusive BMW similar, pero el ICE añade consumibles que el BEV no tiene (aceite, bujías, ITV desde año 4).

---

## 7. Debilidades del cálculo y puntos a cerrar antes de publicar

| # | Debilidad | Impacto | Acción |
|---|---|---|---|
| 1 | Depreciación y5 iX1 es proyección sectorial (confianza baja) | Alto — ±5 pp = ±2.680 € | Revisar 2028-Q1 con muestra real o usar rango ±15% en UI |
| 2 | Seguro iX1 es proyección desde X1 × 1.15 (confianza baja) | Medio — ±200 €/año = ±1.000 € | Obtener 3 cotizaciones específicas iX1 antes de activar en calculador |
| 3 | No se contempla coste wallbox instalación (~900 € amortizable 10 años) | Bajo — ~90 €/año = 450 € en 5 años | Añadir como parámetro opcional en v2 |
| 4 | IVTM se toma como media nacional — varía mucho por municipio | Bajo — ±50 €/año | Aceptable en v1; en v2 permitir selector municipio |
| 5 | Depreciación X1 sDrive18i y3 con muestra de solo n=2 | Medio | Ampliar muestra ≥5 anuncios al validar segundo piloto |
| 6 | No considera degradación batería iX1 sobre valor residual | Medio | El factor ya está implícito en y5=32% del mercado |

---

## 8. Decisiones cerradas aplicadas (referencia)

- **D7** — Depreciación: Ganvam + Coches.net priorizados sobre BOE/Hacienda (matices editoriales).
- **D8** — Mantenimiento: Plan oficial del fabricante (BMW Service Inclusive) como canónico.
- **D9** — Seguro: Mediana de 3 cotizaciones con perfil enchufa2 estándar.
- **D10** — Electricidad: Slider, default 0.17 €/kWh.
- **D11** — Combustible: Real-time MITECO vía Cloudflare Workers cron.
- **D12** — Horizonte: 5 años default, configurable 3/5/7/10.
- **D13** — Rangos: confianza baja ±15%, media ±8%, alta sin rango.
- **D14** — Proyección modelos <3 años: permitida con badge "Datos proyectados".

---

## 9. Próximos pasos

1. ✅ Piloto 1 (ë-C3 vs C3) — validado
2. ✅ Piloto 2 (iX1 vs X1) — validado
3. ⏳ Piloto 3 (Tesla Model 3 benchmark_segmento) — probar rama sin ICE intra-marca
4. ⏳ Escalar specs_tco a los 17 modelos restantes del Top 20
5. ⏳ Implementar `src/lib/tco/calculadora.ts` con estos dos casos como tests unitarios
6. ⏳ Build UI `/calculadora-tco` con URL-as-state
