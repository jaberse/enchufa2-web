# Mapeo BEV → `equivalente_termico`

**Estado:** borrador v1 — pendiente de validación editorial por Javi.
**Autor:** enchufa2 (Cowork)
**Fecha:** 2026-04-20
**Depende de:** [`rfc-tco-ampliacion-bevs-sin-par.md`](./rfc-tco-ampliacion-bevs-sin-par.md) §3.3 · [`metodologia-tco.md`](./metodologia-tco.md) v2 §2.6–§2.8
**Salida esperada:** lista congelada de referentes a reutilizar + nuevos a crear en F3.

---

## 0. Cómo se ha construido este mapeo

Se recorren los **42 BEV sin par canónico** uno a uno y se asigna el análogo térmico más defendible editorialmente, siguiendo esta cascada de prioridad:

1. **Hermano plataforma** — mismo fabricante, misma plataforma o misma gama (ICE/HEV/PHEV del mismo modelo o hermano directo).
2. **Mismo fabricante, segmento análogo** — ICE/HEV/PHEV del fabricante en el segmento más cercano.
3. **Benchmark sectorial** — líder ANFAC del segmento + rango de precio (`data/referencias/benchmarks_ice.json`).
4. **`null`** — si ningún análogo es honesto (ej. monovolumen EV puro sin hermano térmico), se deja vacío con razón editorial.

**Criterios de decisión aplicados:**

- **Precio**: el referente debe estar en ±20 % del PVP del BEV base. Si el fabricante tiene ICE/HEV/PHEV en ese rango, prima sobre el benchmark sectorial.
- **Mild hybrid 48V → ICE puro**. Se refleja en el campo `tipo` del referente; ninguna ficha nueva `HEV` se crea para mild hybrid.
- **Tesla / BYD / Xpeng / Zeekr / Polestar 4**: sin gama ICE propia → bajan siempre a nivel 3 (benchmark) o al conglomerado (Polestar → Volvo).
- **Reutilización agresiva de referentes**: cuando dos BEV muy similares (mismo fabricante, mismo segmento, precio cercano) pueden compartir el referente, se reutiliza. Volvo EX30 y EX40, Mini Cooper SE y Aceman, Smart #1 y #3.
- **Prioridad PHEV cuando el precio del BEV lo exige**: i4 ≠ 320i; i5 ≠ 520i; un BMW i4 a 60k€ se compara con un BMW 330e PHEV antes que con un 320i de 49k€.

---

## 1. Tabla de mapeo (42 BEV)

Leyenda columnas:
- **Referente** → slug propuesto de la ficha térmica
- **Tipo** → `ICE` | `HEV` | `PHEV`
- **Nivel** → 1=hermano plataforma · 2=mismo fabricante · 3=benchmark sectorial · 4=null
- **Ficha existe** → sí/no (sí = en `data/referencias/ice-equivalentes/` actual; los HEV/PHEV son todos nuevos)

### 1.1 Berlina (6)

| # | BEV | Seg | PVP | Plataforma | Referente propuesto | Tipo | Nivel | Ficha existe | Razón |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `bmw-i4-edrive40` | D | 59 900 € | CLAR | `bmw-330e-sedan` | PHEV | 1 | ❌ | Hermano gama BMW Serie 3; 330e PHEV ≈57k€ es el análogo electrificado directo del i4; 320i queda 10k€ por debajo |
| 2 | `bmw-i5-edrive40` | E | 70 200 € | CLAR | `bmw-530e-sedan` | PHEV | 1 | ❌ | Hermano gama BMW Serie 5; 530e PHEV ≈73k€ es match exacto por precio y trim electrificado |
| 3 | `hyundai-ioniq-6-long-range-rwd` | D | 54 000 € | E-GMP | `audi-a4-tfsi` | ICE | 3 | ❌ (benchmark listado) | Hyundai no tiene berlina D en España (Sonata discontinuada). Benchmark D generalista-premium = A4 35 TFSI 150 CV |
| 4 | `polestar-2-long-range-single-motor` | D | 48 200 € | CMA (Geely) | `volvo-s60-t8-phev` | PHEV | 2 | ❌ | Conglomerado Geely → Volvo S60 T8 Recharge PHEV ≈51k€ es el hermano natural del mismo grupo |
| 5 | `tesla-model-3-long-range-awd-highland` | D | 48 990 € | Tesla | `bmw-320i-sedan` | ICE | 3 | ✅ | Tesla sin ICE. Benchmark D = 320i ya asignado al M3 RWD; mismo referente para trim LR |
| 6 | `volkswagen-id7-pro-s` | D | 59 330 € | MEB | `volkswagen-passat-gte-phev` | PHEV | 2 | ❌ | VW Passat GTE PHEV ≈56k€ es el hermano de gama D del ID.7 (ambos posicionados como berlina/familiar flagship) |

### 1.2 Compacto (5)

| # | BEV | Seg | PVP | Plataforma | Referente propuesto | Tipo | Nivel | Ficha existe | Razón |
|---|---|---|---|---|---|---|---|---|---|
| 7 | `cupra-born-58-kwh` | C | 36 820 € | MEB | `cupra-leon-vz-tsi` | ICE | 1 | ❌ | Hermano gama Cupra Leon VZ 2.0 TSI ≈37k€ es match directo de posicionamiento deportivo y precio |
| 8 | `mg-4-standard-range` | C | 30 990 € | MSP (SAIC) | `volkswagen-golf-tsi` | ICE | 3 | ✅ | MG no vende compacto C ICE en España. Benchmark C = Golf 1.5 TSI 116 CV |
| 9 | `mini-aceman-se` | C | 35 055 € | Spotlight (BMW) | `mini-cooper-s-ice` | ICE | 2 | ❌ | Mini Cooper S ICE ≈31k€ — mismo fabricante, segmento análogo, precio cercano. Se reutiliza en fila #40 |
| 10 | `renault-megane-e-tech-ev60` | C | 42 650 € | CMF-EV | `toyota-corolla-hev` | HEV | 3 | ❌ | Renault ya no vende Megane ICE en España. Benchmark HEV del segmento C = Corolla 1.8 HEV ≈29k€ (ajuste de precio por trim) |
| 11 | `volkswagen-id3-pro-s` | C | 40 415 € | MEB | `volkswagen-golf-tsi` | ICE | 1 | ✅ | Hermano gama VW Golf 1.5 TSI ≈30k€ ya poblado; es el análogo canónico del ID.3 |

### 1.3 Monovolumen (1)

| # | BEV | Seg | PVP | Plataforma | Referente propuesto | Tipo | Nivel | Ficha existe | Razón |
|---|---|---|---|---|---|---|---|---|---|
| 12 | `volkswagen-id-buzz-pro` | Monovolumen | 58 000 € | MEB | `volkswagen-multivan-ehybrid-phev` | PHEV | 1 | ❌ | Hermano gama VW Multivan eHybrid PHEV ≈57k€ — monovolumen MQB electrificado, único análogo honesto del ID.Buzz |

### 1.4 SUV (26)

| # | BEV | Seg | PVP | Plataforma | Referente propuesto | Tipo | Nivel | Ficha existe | Razón |
|---|---|---|---|---|---|---|---|---|---|
| 13 | `audi-q4-e-tron-45` | C-SUV | 52 350 € | MEB | `audi-q3-45-tfsie-phev` | PHEV | 2 | ❌ | Audi Q3 45 TFSIe PHEV ≈47k€ — mismo fabricante, SUV-C electrificado, precio cercano |
| 14 | `audi-q6-e-tron-performance` | D-SUV | 65 800 € | PPE | `audi-q5-tfsi` | ICE | 3 | ✅ | Audi Q5 40 TFSI ≈58k€ ya en catálogo como benchmark D-SUV; apropiado para Q6 por tamaño/premium |
| 15 | `byd-seal-u-87-design` | C-SUV | 43 790 € | e-Platform 3.0 | `toyota-rav4-hev` | HEV | 3 | ❌ | BYD sin gama ICE. Benchmark HEV SUV-C = RAV4 2.5 HEV ≈44k€, match casi exacto de precio |
| 16 | `cupra-tavascan-vz` | D-SUV | 66 050 € | MEB | `cupra-formentor-ehybrid-phev` | PHEV | 1 | ❌ | Hermano gama Cupra Formentor VZ eHybrid PHEV ≈52k€ — mismo fabricante, trim deportivo PHEV (ajuste por trim superior del Tavascan VZ) |
| 17 | `ford-explorer-ev-standard-range-rwd` | C-SUV | 44 900 € | MEB | `ford-kuga-hev` | HEV | 2 | ❌ | Ford Kuga 2.5 FHEV ≈37k€ — mismo fabricante, SUV-C hibridado, mejor análogo que benchmark |
| 18 | `ford-puma-gen-e` | B-SUV | 34 884 € | B-car Ford | `ford-puma-ecoboost` | ICE | 1 | ❌ | Hermano directo: mismo modelo Puma 1.0 EcoBoost ≈26k€ (mild-hybrid 48V tratado como ICE puro según §2.7) |
| 19 | `hyundai-ioniq-5-long-range-awd` | C-SUV | 53 400 € | E-GMP | `hyundai-tucson-phev` | PHEV | 2 | ❌ | Hyundai Tucson 1.6 T-GDi PHEV 4WD ≈46k€ — mismo fabricante, SUV-C electrificado AWD |
| 20 | `hyundai-ioniq-5-long-range-rwd` | C-SUV | 48 400 € | E-GMP | `hyundai-tucson-hev` | HEV | 2 | ❌ | Hyundai Tucson 1.6 T-GDi HEV ≈38k€ — mismo fabricante, trim HEV es el análogo natural al RWD no premium |
| 21 | `kia-ev6-gt` | D-SUV | 72 900 € | E-GMP | `bmw-x3-xdrive20i` | ICE | 3 | ✅ | EV6 GT (586 CV) no tiene hermano Kia comparable. Benchmark D-SUV premium = X3 ya poblado; trim alto X3 M40i ≈90k sería más preciso, aceptamos X3 base como floor |
| 22 | `kia-ev6-long-range-rwd` | D-SUV | 51 200 € | E-GMP | `kia-sportage-phev` | PHEV | 2 | ❌ | Kia Sportage 1.6 T-GDi PHEV ≈43k€ — mismo fabricante, SUV-C electrificado |
| 23 | `mercedes-eqb-250-plus` | C-SUV | 53 514 € | MFA2 | `mercedes-glb-200-ice` | ICE | 1 | ❌ | Hermano plataforma MFA2: Mercedes GLB 200 1.3T ≈45k€ — mismo modelo en versión combustión |
| 24 | `mg-s5-64kwh` | C-SUV | 31 490 € | MSP (SAIC) | `mg-hs-phev` | PHEV | 2 | ❌ | Mismo fabricante: MG HS 1.5T Super Hybrid PHEV ≈32k€ — match directo de precio y posicionamiento |
| 25 | `nissan-ariya-87kwh` | C-SUV | 49 900 € | CMF-EV | `nissan-xtrail-epower-hev` | HEV | 2 | ❌ | Nissan X-Trail e-POWER ≈42k€ — mismo fabricante, SUV-C hibridado, análogo editorial directo |
| 26 | `opel-mokka-e-gs` | B-SUV | 37 700 € | e-CMP2 | `opel-mokka-ice` | ICE | 1 | ❌ | Mismo modelo Opel Mokka 1.2 Turbo ≈26k€ — hermano térmico puro sobre misma plataforma Stellantis |
| 27 | `polestar-4-long-range-single-motor` | D-SUV | 65 900 € | SEA (Geely) | `volvo-xc60-t8-phev` | PHEV | 2 | ❌ | Conglomerado Geely → Volvo XC60 T8 Recharge PHEV ≈73k€ — SUV-D premium electrificado del mismo grupo |
| 28 | `renault-scenic-e-tech-87kwh` | C-SUV | 48 900 € | CMF-EV | `renault-rafale-etech-hev` | HEV | 2 | ❌ | Renault Rafale E-Tech FHEV ≈45k€ — mismo fabricante, SUV-C hibridado nivel medio-alto |
| 29 | `skoda-elroq-85` | C-SUV | 43 530 € | MEB | `skoda-karoq-tsi` | ICE | 2 | ❌ | Skoda Karoq 1.5 TSI ≈31k€ — mismo fabricante, SUV-C gasolina; alternativa `volkswagen-tiguan-tsi` más caro |
| 30 | `skoda-enyaq-85` | D-SUV | 47 350 € | MEB | `skoda-kodiaq-iv-phev` | PHEV | 2 | ❌ | Skoda Kodiaq iV PHEV ≈48k€ — mismo fabricante, SUV-D electrificado, precio match |
| 31 | `smart-1-proplus` | C-SUV | 39 500 € | SEA (Geely) | `bmw-x1-sdrive18i` | ICE | 3 | ✅ | Smart sin gama ICE propia. Benchmark C-SUV = BMW X1 sDrive18i ya poblado |
| 32 | `smart-3-proplus` | C-SUV | 40 495 € | SEA (Geely) | `bmw-x1-sdrive18i` | ICE | 3 | ✅ | Igual que #31 — se reutiliza el X1 como benchmark C-SUV generalista-premium |
| 33 | `tesla-model-y-awd-long-range` | D-SUV | 52 990 € | Tesla | `bmw-x3-xdrive20i` | ICE | 3 | ✅ | Tesla sin ICE. Benchmark D-SUV = X3 ya asignado al Y RWD; mismo referente para trim AWD |
| 34 | `volkswagen-id4-gtx` | C-SUV | 51 005 € | MEB | `volkswagen-tiguan-ehybrid-phev` | PHEV | 1 | ❌ | Hermano gama VW Tiguan 1.5 eHybrid PHEV ≈51k€ — match exacto de precio y trim electrificado performance |
| 35 | `volkswagen-id4-pro-performance` | C-SUV | 39 550 € | MEB | `volkswagen-tiguan-tsi` | ICE | 1 | ✅ | Hermano gama VW Tiguan 1.5 eTSI ≈37k€ ya poblado; análogo canónico del ID.4 trim medio |
| 36 | `volvo-ex30-single-motor-extended-range` | B-SUV | 42 034 € | SEA (Geely) | `volvo-xc40-b4-ice` | ICE | 2 | ❌ | Volvo XC40 B4 mild-hybrid 48V tratado como ICE puro ≈45k€ — SUV compacto Volvo más cercano. Reutilizado en #37 y #38 |
| 37 | `volvo-ex30-single-motor` | B-SUV | 36 770 € | SEA (Geely) | `volvo-xc40-b4-ice` | ICE | 2 | ❌ | Igual que #36 — mismo referente, trim base ajustado |
| 38 | `volvo-ex40-recharge-single-motor` | C-SUV | 48 600 € | CMA (Geely) | `volvo-xc40-b4-ice` | ICE | 2 | ❌ | Mismo modelo XC40 — el EX40 es la versión BEV del XC40; XC40 B4 ≈45k€ es el hermano directo |

### 1.5 Utilitario (4)

| # | BEV | Seg | PVP | Plataforma | Referente propuesto | Tipo | Nivel | Ficha existe | Razón |
|---|---|---|---|---|---|---|---|---|---|
| 39 | `fiat-500e-la-prima` | A | 30 738 € | MPE Fiat | `fiat-500-hybrid-ice` | ICE | 1 | ❌ | Mismo modelo Fiat 500 1.0 Hybrid ≈18k€ — hermano directo sobre plataforma MPE (mild-hybrid tratado como ICE puro) |
| 40 | `mini-cooper-se-e` | B | 35 500 € | Spotlight (BMW) | `mini-cooper-s-ice` | ICE | 1 | ❌ | Mismo modelo Mini Cooper S 2.0 ICE ≈31k€ — hermano directo, se reutiliza la ficha creada en #9 |
| 41 | `opel-corsa-electric-54kwh` | B | 34 200 € | e-CMP (Stellantis) | `opel-corsa-ice` | ICE | 1 | ❌ | Mismo modelo Opel Corsa 1.2 Turbo Hybrid ≈20k€ — hermano directo sobre e-CMP (mild-hybrid tratado como ICE) |
| 42 | `peugeot-e-208-allure` | B | 35 800 € | e-CMP (Stellantis) | `peugeot-208-puretech-ice` | ICE | 1 | ❌ | Mismo modelo Peugeot 208 PureTech 100 ≈20k€ — hermano directo sobre e-CMP |

---

## 2. Resumen de referentes

### 2.1 Existentes reutilizados (5)

Todos en `data/referencias/ice-equivalentes/` con ficha poblada v1 y `tco_poblado: true`.

| Slug | Tipo | Usos |
|---|---|---|
| `bmw-320i-sedan` | ICE | 1 (Tesla M3 LR) |
| `bmw-x3-xdrive20i` | ICE | 2 (Kia EV6 GT, Tesla Y AWD) |
| `bmw-x1-sdrive18i` | ICE | 2 (Smart #1, Smart #3) |
| `volkswagen-tiguan-tsi` | ICE | 1 (VW ID.4 Pro Perf) |
| `volkswagen-golf-tsi` | ICE | 2 (MG 4, VW ID.3) |
| `audi-q5-tfsi` | ICE | 1 (Audi Q6 e-tron) — *falta ficha*, solo listado en `benchmarks_ice.json` |

> **Nota:** `audi-q5-tfsi` hoy solo aparece como opción en `benchmarks_ice.json` pero no tiene archivo en `ice-equivalentes/`. Hay que crear la ficha en F3 (F3 entra también en 2.2 porque el referente es "existente en UI, no poblado").

### 2.2 Nuevos referentes ICE a crear (11)

| Slug | Marca Modelo | Seg | PVP aprox. | Usos |
|---|---|---|---|---|
| `audi-a4-tfsi` | Audi A4 35 TFSI 150 CV | D | 49 500 € | 1 (Hyundai Ioniq 6) |
| `audi-q5-tfsi` | Audi Q5 40 TFSI 204 CV | D-SUV | 58 000 € | 1 (Audi Q6 e-tron) |
| `cupra-leon-vz-tsi` | Cupra Leon VZ 2.0 TSI 300 CV | C | 37 000 € | 1 (Cupra Born) |
| `ford-puma-ecoboost` | Ford Puma 1.0 EcoBoost MHEV | B-SUV | 26 000 € | 1 (Ford Puma Gen-E) |
| `mini-cooper-s-ice` | Mini Cooper S 2.0T 204 CV | B / C | 31 000 € | 2 (Mini Aceman, Mini Cooper SE) |
| `opel-mokka-ice` | Opel Mokka 1.2 Turbo 136 CV | B-SUV | 26 000 € | 1 (Opel Mokka-e) |
| `skoda-karoq-tsi` | Škoda Karoq 1.5 TSI 150 CV | C-SUV | 31 000 € | 1 (Skoda Elroq 85) |
| `volvo-xc40-b4-ice` | Volvo XC40 B4 MHEV 197 CV | B-SUV / C-SUV | 45 000 € | 3 (EX30 ER, EX30, EX40) |
| `mercedes-glb-200-ice` | Mercedes GLB 200 1.3 Turbo 163 CV | C-SUV | 45 000 € | 1 (Mercedes EQB) |
| `fiat-500-hybrid-ice` | Fiat 500 1.0 Hybrid 70 CV | A | 18 000 € | 1 (Fiat 500e) |
| `opel-corsa-ice` | Opel Corsa 1.2 Turbo Hybrid 100 CV | B | 20 000 € | 1 (Opel Corsa-e) |
| `peugeot-208-puretech-ice` | Peugeot 208 PureTech 100 CV | B | 20 000 € | 1 (Peugeot e-208) |

### 2.3 Nuevos referentes HEV a crear (6)

Todos en carpeta nueva `data/referencias/termicos-equivalentes/` con `tipo: "HEV"`.

| Slug | Marca Modelo | Seg | PVP aprox. | Usos |
|---|---|---|---|---|
| `toyota-corolla-hev` | Toyota Corolla 1.8 HEV 140 CV | C | 29 000 € | 1 (Renault Megane E-Tech) |
| `toyota-rav4-hev` | Toyota RAV4 2.5 HEV 218 CV | C-SUV | 44 000 € | 1 (BYD Seal U) |
| `ford-kuga-hev` | Ford Kuga 2.5 FHEV 183 CV | C-SUV | 37 000 € | 1 (Ford Explorer EV) |
| `hyundai-tucson-hev` | Hyundai Tucson 1.6 T-GDi HEV 230 CV | C-SUV | 38 000 € | 1 (Hyundai Ioniq 5 RWD) |
| `nissan-xtrail-epower-hev` | Nissan X-Trail e-POWER 213 CV | C-SUV | 42 000 € | 1 (Nissan Ariya) |
| `renault-rafale-etech-hev` | Renault Rafale E-Tech 200 CV FHEV | C-SUV | 45 000 € | 1 (Renault Scenic) |

### 2.4 Nuevos referentes PHEV a crear (13)

Todos en `data/referencias/termicos-equivalentes/` con `tipo: "PHEV"`. Cada uno lleva `ratio_electrico_default: 0.60` (ICCT 2024 España) salvo excepciones justificadas.

| Slug | Marca Modelo | Seg | PVP aprox. | Usos |
|---|---|---|---|---|
| `bmw-330e-sedan` | BMW 330e 292 CV PHEV | D | 57 000 € | 1 (BMW i4) |
| `bmw-530e-sedan` | BMW 530e 299 CV PHEV | E | 73 000 € | 1 (BMW i5) |
| `volvo-s60-t8-phev` | Volvo S60 T8 Recharge 455 CV PHEV | D | 51 000 € | 1 (Polestar 2) |
| `volkswagen-passat-gte-phev` | VW Passat 1.5 eHybrid GTE 272 CV PHEV | D | 56 000 € | 1 (VW ID.7) |
| `audi-q3-45-tfsie-phev` | Audi Q3 45 TFSIe 245 CV PHEV | C-SUV | 47 000 € | 1 (Audi Q4 e-tron) |
| `cupra-formentor-ehybrid-phev` | Cupra Formentor VZ eHybrid 272 CV PHEV | C-SUV | 52 000 € | 1 (Cupra Tavascan) |
| `hyundai-tucson-phev` | Hyundai Tucson 1.6 T-GDi PHEV 4WD 265 CV | C-SUV | 46 000 € | 1 (Hyundai Ioniq 5 AWD) |
| `kia-sportage-phev` | Kia Sportage 1.6 T-GDi PHEV 265 CV | C-SUV | 43 000 € | 1 (Kia EV6 LR) |
| `mg-hs-phev` | MG HS 1.5T Super Hybrid 305 CV PHEV | C-SUV | 32 000 € | 1 (MG S5) |
| `volvo-xc60-t8-phev` | Volvo XC60 T8 Recharge 455 CV PHEV | D-SUV | 73 000 € | 1 (Polestar 4) |
| `skoda-kodiaq-iv-phev` | Škoda Kodiaq iV 1.5 TSI eHybrid 204 CV PHEV | D-SUV | 48 000 € | 1 (Skoda Enyaq) |
| `volkswagen-tiguan-ehybrid-phev` | VW Tiguan 1.5 eHybrid 272 CV PHEV | C-SUV | 51 000 € | 1 (VW ID.4 GTX) |
| `volkswagen-multivan-ehybrid-phev` | VW Multivan 1.4 eHybrid 218 CV PHEV | Monovolumen | 57 000 € | 1 (VW ID.Buzz) |

### 2.5 Nulls (0)

En este pase no hay BEV con `equivalente_termico: null`. Todos los 42 encuentran al menos un nivel 3 (benchmark sectorial) defendible.

---

## 3. Resumen de trabajo para F3

| Categoría | Cantidad |
|---|---|
| Fichas existentes reutilizadas | 5 |
| Fichas nuevas ICE | 12 (incluye `audi-q5-tfsi` que falta) |
| Fichas nuevas HEV | 6 |
| Fichas nuevas PHEV | 13 |
| **Total fichas nuevas a crear en F3** | **31** |
| BEV con `equivalente_termico: null` | 0 |
| BEV cubiertos | 42/42 |

> El RFC §3.4 estimaba "15-20 fichas" como universo probable. Este mapeo llega a 31 porque se ha priorizado el nivel 1-2 (hermano plataforma / mismo fabricante) sobre el nivel 3 (benchmark compartido). Esto aumenta el trabajo de F3 pero produce comparaciones TCO **mucho más honestas**: un Ford Explorer EV vs Ford Kuga HEV es más informativo para el propietario que Ford Explorer EV vs Toyota RAV4 HEV.

**Alternativa conservadora (minimiza fichas nuevas):** si quieres apretar a ~20 fichas, los candidatos a sustituir por benchmark sectorial compartido son los 13 PHEV (→ 2-3 PHEV genéricos por segmento) y varios HEV. Impacto: 9-12 fichas menos a crear, pero las tarjetas TCO pierden especificidad editorial.

---

## 4. Próximo paso

1. **Javi revisa esta tabla** y marca:
   - BEV cuyo referente hay que cambiar (con motivo editorial).
   - BEV que deberían ir a `null` en vez de a benchmark nivel 3.
   - Confirma PVPs aproximados de referentes nuevos (son estimaciones, se refinan en F3 contra press kit / configurador).
   - Decide nivel de agresividad: ¿mantenemos 31 fichas nuevas o bajamos a ~20 reutilizando benchmarks sectoriales?

2. **Una vez validada esta tabla**, arranca F3 (crear las 31 fichas referentes nuevas, una por una, siguiendo metodología v2 §2.7 y §2.8).

3. Migrar `data/referencias/ice-equivalentes/` → `data/referencias/termicos-equivalentes/` con campo `tipo` en cada ficha (decisión complementaria RFC D6, 2026-04-20).

4. En paralelo F4: extender `loader.mjs` para leer la carpeta unificada y exponer `referentesTCO` con el tipo.

---

## 5. Historial

- **2026-04-20 — v1** — Borrador inicial tras consolidar metodología v2. Pendiente de validación por Javi.
