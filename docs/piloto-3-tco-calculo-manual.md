# Piloto 3 · TCO manual — Tesla Model 3 RWD Highland vs BMW 320i Sedan (benchmark segmento D)

> **Fecha:** 2026-04-14 · recalculado 2026-04-22 (metodología v2.1, WLTP puro) · **Autor:** enchufa2 editorial
> **Propósito:** validar manualmente el caso `benchmark_segmento` — cuando el BEV no tiene ICE intra-marca y se compara contra el default del segmento.
> **Estado:** borrador — confianza general media. Ver debilidades al final.

---

## 1. Por qué este piloto

Los Pilotos 1 y 2 probaron la rama **intra-marca** (ë-C3 vs C3, iX1 vs X1) — ambos BEV tenían hermano ICE directo. Tesla no fabrica coches de combustión, así que el comparador debe resolver a un **benchmark de segmento**: el default editorial para berlina media premium (D) es el **BMW 320i Sedan**, elegido por dimensiones, posicionamiento y prestaciones comparables.

Esta rama la usará ~70 % del Top 20 del comparador (todos los BEV sin ICE intra-marca: Tesla, Polestar, BYD, Dacia Spring, etc.), así que es crítica que quede validada.

**Cadena de resolución verificada por `tco-audit.mjs`:**

```
tesla-model-3-rwd-highland
  └─ equivalente_termico.tipo = ICE (benchmark de segmento D)
      └─ referente_id = "bmw-320i-sedan"
          └─ data/referencias/termicos-equivalentes/bmw-320i-sedan.json ✓
```

---

## 2. Parámetros enchufa2 estándar

| Parámetro | Valor | Fuente |
|---|---|---|
| Kilometraje anual | 15.000 km | ANFAC 2024 (media turismos España) |
| Horizonte | 5 años | D12 — default configurable (3/5/7/10) |
| Precio electricidad | 0,17 €/kWh | D10 — slider, default mix casa + pública (OMIE + Iberdrola 2026) |
| Precio gasolina 95 | 1,55 €/L | D11 — real-time MITECO abril 2026 |
| IVTM BEV medio | 40 €/año | Bonificación 50-75 % mayoría grandes municipios |
| IVTM ICE medio | 90 €/año | Sin bonificación (DGT distintivo ECO) |
| Perfil seguro | 40 años, 15 carnet, zona media, todo riesgo 500 € | — |

**Nota v2.1:** no se aplica factor corrector WLTP→real. Consumos se usan en valor WLTP homologado.

---

## 3. Datos del par (Piloto 3)

### Tesla Model 3 RWD Highland (BEV)

| Dato | Valor | Confianza | Fuente |
|---|---|---|---|
| PVP | 36.990 € | alta | Tesla España abril 2026 |
| Plan Auto+ 2024-2026 | **3.375 €** (base, sin EEE) | alta | RD Plan Auto+. Ensamblaje China → sin bonus EEE ni batería UE |
| PVP tras ayuda | 33.615 € | calculado | 36.990 − 3.375 |
| Consumo WLTP | 13,2 kWh/100km | media | Tesla España (pendiente verificar homologación ES) |
| Depreciación y5 | 45 % | media | Motorpasión 2025 + Coches.net muestras 2021 ~75k km |
| Mantenimiento | 90 €/año | alta | Agirregabiria 163 €/4 años + hibridosyelectricos.com 330 €/5 años |
| Seguro | 700 €/año | media | Mediana 3 cotizaciones perfil enchufa2 |
| Impuestos | 40 €/año | media | IVTM bonificado medio |

### BMW 320i Sedan (ICE gasolina — benchmark segmento D)

| Dato | Valor | Confianza | Fuente |
|---|---|---|---|
| PVP | 49.814 € | alta | Carwow + quecochemecompro abril 2026 |
| Consumo WLTP | 6,5 L/100km | alta | BMW España ficha técnica |
| Depreciación y5 | 44 % | media | Proyección sectorial ICE premium D (X1 + 2 pp por motor 2.0) |
| Mantenimiento | 500 €/año | media | BMW Service Inclusive Next 4y/60k + consumibles ICE |
| Seguro | 650 €/año | media | Perfil BMW Serie 3 premium D (Rastreator + Kelisto agregado) |
| Impuestos | 90 €/año | media | IVTM ICE sin bonificación |

---

## 4. Fórmula canónica (ICCT)

```
TCO(horizonte) = Depreciación + Energía + Mantenimiento + Seguro + Impuestos − Ayudas
```

---

## 5. Cálculo Tesla Model 3 RWD a 5 años

| Concepto | Cálculo | Importe |
|---|---|---|
| Depreciación | 36.990 × 0,45 | **16.646 €** |
| Energía | 15.000 × 5 × 13,2 × 0,17 / 100 | **1.683 €** |
| Mantenimiento | 90 × 5 | **450 €** |
| Seguro | 700 × 5 | **3.500 €** |
| Impuestos | 40 × 5 | **200 €** |
| Ayudas | Plan Auto+ base (sin EEE) | **−3.375 €** |
| **TCO 5 años** | | **19.104 €** |
| **€/km** | 19.104 / 75.000 | **0,255 €/km** |

**TCO sin Plan Auto+** (para comparación justa del producto sin subvención): 22.479 € · 0,300 €/km

---

## 6. Cálculo BMW 320i Sedan a 5 años

| Concepto | Cálculo | Importe |
|---|---|---|
| Depreciación | 49.814 × 0,44 | **21.918 €** |
| Energía | 15.000 × 5 × 6,5 × 1,55 / 100 | **7.556 €** |
| Mantenimiento | 500 × 5 | **2.500 €** |
| Seguro | 650 × 5 | **3.250 €** |
| Impuestos | 90 × 5 | **450 €** |
| **TCO 5 años** | | **35.674 €** |
| **€/km** | 35.674 / 75.000 | **0,476 €/km** |

---

## 7. Comparación y conclusión

| Métrica | Tesla Model 3 RWD | BMW 320i Sedan | Diferencia |
|---|---|---|---|
| PVP inicial | 36.990 € | 49.814 € | −12.824 € (Tesla más barato de entrada) |
| **TCO 5 años (con Plan Auto+)** | **19.104 €** | **35.674 €** | **−16.570 € (Tesla ahorra 46,5 %)** |
| TCO 5 años (sin ayuda) | 22.479 € | 35.674 € | −13.195 € (Tesla ahorra 37,0 %) |
| €/km (con ayuda) | 0,255 | 0,476 | −0,221 €/km |
| Energía 5 años | 1.683 € | 7.556 € | −5.873 € (BEV ahorra 77,7 %) |
| Mantenimiento 5 años | 450 € | 2.500 € | −2.050 € (BEV ahorra 82,0 %) |
| Depreciación 5 años | 16.646 € | 21.918 € | −5.272 € (BEV pierde 24,0 % menos) |

### Lectura editorial

El caso Tesla Model 3 vs BMW 320i es el **escenario más favorable al BEV** de los tres pilotos:

1. **PVP de entrada ya 12.800 € más bajo** — algo que no ocurría ni en ë-C3 vs C3 ni en iX1 vs X1. El Tesla parte con una ventaja estructural que el segmento premium ICE no puede igualar a este precio.
2. **Energía pulveriza al ICE** — 13,2 kWh × 0,17 €/kWh = 2,24 €/100km vs 6,5 L × 1,55 €/L = 10,08 €/100km. A 75.000 km, la gasolina cuesta **4,5 × más** que la electricidad.
3. **Mantenimiento casi inexistente en Tesla** — 90 €/año es consistente con múltiples casos reales documentados (Agirregabiria 163 € en 4 años; hibridosyelectricos 330 € en 5). Sin aceite, bujías, embrague ni ITV hasta año 4, el Tesla pasa por taller básicamente para neumáticos y frenos.
4. **Plan Auto+ amplifica la brecha** — el Tesla se ensambla en China, así que solo accede a la base (2.750 €) más el 25 % por coche usado. No suma EEE ni batería UE. Aun así, los 3.375 € empujan el ahorro del 37 % al 46 %.

**Lectura clave para el artículo del comparador:** cuando el BEV compite contra un segmento medio/premium sin hermano ICE directo (Tesla, Polestar, BYD), el ahorro TCO es **estructural**, no depende de la subvención. El Plan Auto+ es un bonus, no el motor del ahorro.

---

## 8. Test del validador (comportamiento esperado)

Salida real de `npm run data:tco-audit -- --coche tesla-model-3-rwd-highland` (2026-04-22, v2.1):

```
=== Tesla Model 3 RWD Highland — TCO ===
  Estado: READY ✓ · No activable ⚠
  ✓ depreciacion_y3_pct              0.32 fracción   conf=media
  · depreciacion_y5_pct              0.45 fracción   conf=media
  ✓ mantenimiento_anual_eur            90 €/año      conf=alta
  ✓ seguro_anual_eur                  700 €/año      conf=media
  ✓ consumo_wltp_kwh100km            13.2 kWh/100km  conf=alta   (v2.1 — WLTP puro)
  ✓ equivalente_termico: tipo=ICE referente=bmw-320i-sedan (benchmark segmento D)
```

El validador resuelve correctamente la cadena `segmento D → bmw-320i-sedan` y valida en cascada el ICE. No activable por `tco_activo_en_calculadora: false` (queda a juicio editorial publicar tras revisar debilidades).

---

## 9. Debilidades del cálculo y puntos a cerrar antes de publicar

| # | Debilidad | Impacto | Acción |
|---|---|---|---|
| 1 | Consumo WLTP Tesla Model 3 con fuente "pendiente" y `verificado: false` | Medio — ±1 kWh/100km = ±127 € en 5 años | Verificar con Tesla España homologación ES oficial |
| 2 | Depreciación y5 Tesla 45 % es proyección con muestras 2021 (n pequeño) | Alto — ±5 pp = ±1.850 € | Ampliar muestra Coches.net Model 3 Highland 2023-2024 con ≥30k km |
| 3 | Seguro Tesla 700 €/año con solo 3 cotizaciones proxy | Medio — ±150 €/año = ±750 € | Obtener 3 cotizaciones Highland 2024-25 perfil enchufa2 |
| 4 | BMW 320i depreciación y5 44 % sin muestra Coches.net propia | Medio — ±4 pp = ±2.000 € | Muestra ≥5 anuncios 320i 2023 con 45-50k km |
| 5 | BMW 320i mild hybrid 48V con distintivo ECO — podría perder ECO en Euro 7 (2027) | Alto en horizontes >5 años | Revisar escenarios ZBE post-2027 |
| 6 | No se incluye degradación batería en valor residual Tesla | Bajo — ya implícito en y5=45 % del mercado | Aceptable en v1 |
| 7 | Benchmark default "bmw-320i-sedan" es decisión editorial única | Bajo | UI permitirá usuario cambiar a Mercedes C 200 / Audi A4 35 TFSI |

---

## 10. Decisiones cerradas aplicadas (referencia)

- **D7** — Depreciación: Ganvam + Coches.net priorizados.
- **D8** — Mantenimiento: Casos reales documentados (Tesla) y Plan oficial fabricante (BMW).
- **D9** — Seguro: Mediana de 3 cotizaciones con perfil enchufa2 estándar.
- **D10-D11** — Electricidad 0,17 €/kWh · Gasolina 1,55 €/L.
- **D12** — Horizonte 5 años default.
- **D13** — Rangos ±8 %/±15 % según confianza.
- **D14** — Proyección permitida con badge "Datos proyectados".
- **D-new (Piloto 3)** — benchmark segmento se resuelve a través de `equivalente_termico.referente_id` (v2.1: ficha unificada con `tipo`).
- **v2.1 (2026-04-22)** — consumo energético en WLTP puro, sin factor corrector.

---

## 11. Próximos pasos

1. ✅ Piloto 1 (ë-C3 vs C3) — validado
2. ✅ Piloto 2 (iX1 vs X1) — validado
3. ✅ Piloto 3 (Tesla Model 3 vs BMW 320i benchmark D) — validado
4. ⏳ Escalar specs_tco a los 16 modelos restantes del Top 20 (14 sin scaffold + 2 con errores)
5. ⏳ Crear benchmarks default para segmentos B-SUV (falta peugeot-2008-puretech), C-SUV, E, E-SUV
6. ✅ Implementado `src/lib/tco/calculadora.mjs` con los tres pilotos como tests unitarios
7. ✅ Build UI `/comparador` con URL-as-state
