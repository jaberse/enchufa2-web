# RFC — Ampliación TCO a los 42 BEV sin par canónico

**Estado:** aprobado — D1-D5 cerrados por Javi el 2026-04-20
**Autor:** enchufa2 (Javi + Cowork)
**Fecha:** 2026-04-20
**Dependencias:** `docs/metodologia-tco.md` v1 (2026-04-15) · `docs/perfil-estandar-seguro.md` · `data/referencias/benchmarks_ice.json`

---

## 0. Decisiones congeladas (Javi, 2026-04-20)

- **D1 — Tecnologías referente:** ICE + HEV + **PHEV**. El PHEV se modela con un slider de "ratio eléctrico vs combustión" editable por el usuario en la tarjeta TCO.
- **D2 — Mapeo BEV→referente:** cada BEV lleva su referente natural (ICE o híbrido) 1:1. No se restringe por segmento/rango de precio; se asigna el análogo más honesto en cada caso. Etiquetado unificado bajo la clave `equivalente_termico` con un campo `tipo` interno.
- **D3 — Número de referentes:** tantos como sean necesarios — no hay mínimo ni máximo. Un BEV sin análogo real no lleva referente forzado.
- **D4 — Metodología:** v2 consolidada directamente en `docs/metodologia-tco.md` (no anexo separado).
- **D5 — Orden de poblado:** indiferente — se hará por bloques operativos (empezando por los que compartan referente ya creado).

### Decisiones complementarias de metodología v2 (2026-04-20)

- **Ratio PHEV default:** 0.60 ponderado.
- **Mild hybrid 48V:** ICE puro con consumos WLTP de fabricante; sin factor HEV.
- **Factor HEV sobre ICE:** único, sin distinguir marca (+3pp y3 / +2pp y5 / +1pp y10). Prima el dato Ganvam primario si existe.
- **Sanity ranges HEV/PHEV:** parten con los del borrador y se afinan tras 5 HEV + 3 PHEV poblados.
- **Fichas referente:** carpeta única `data/referencias/termicos-equivalentes/` con campo `tipo: "ICE"|"HEV"|"PHEV"`. Se migra `ice-equivalentes/` → `termicos-equivalentes/`.
- **`fuente_tipo`:** solo 5 entradas nuevas (`factor_hev_sobre_ice`, `factor_phev_sobre_hev`, `media_hev_segmento`, `media_phev_segmento`, `estudio_sectorial_utility_factor`). `baseline_compartido_intra_plataforma` no se desdobla.

---

## 1. Contexto y problema

El comparador TCO en `/comparador/` solo calcula coste total para 20 BEV (los que están en `PARES_CANONICOS` del `loader.mjs`). Los otros 42 BEV del catálogo muestran una tarjeta TCO vacía con el texto "TCO no disponible". Esto ocurre por tres razones acumulativas:

1. Los 42 BEV no tienen bloque `specs_tco` poblado en `data/coches/*.json` (no hay depreciación, mantenimiento ni seguro).
2. No existe un "rival ICE canónico" asignado — la función `inputParaSlug(slug)` devuelve `null` cuando `DATA.paresTCO[slug]` falta.
3. El catálogo de referentes (`data/referencias/ice-equivalentes/`) solo tiene 10 fichas ICE completas, pensadas para los 20 pares actuales. No hay fichas HEV.

**Decisión de Javi (2026-04-20):** no ampliar con atajos. Poblar los 42 BEV con los 3 campos `specs_tco` siguiendo la metodología canónica v1, y crear el mínimo número de referentes ICE + HEV necesarios para cubrir todos los segmentos × rangos de precio. Los referentes pueden repetirse (no hacen falta 62).

**Restricciones rígidas** (memoria del proyecto):

- **Rigor de datos:** nunca inventar fórmulas; todo valor publicado lleva `fuente_tipo`, `fuente_fecha`, `verificado`, `confianza` y `fuente_detalle`.
- **Eliminar lo no verificado:** los JSON sin TCO poblado se dejan fuera del comparador TCO hasta tener dato real. Borrador → review → publish.
- **Metodología canónica:** no inventar una nueva; ampliar `metodologia-tco.md` a v2 con sección específica para HEV antes de poblar JSONs.
- **Plan Auto+ 2026:** sigue sin bono por achatarramiento — no aparece en ningún copy derivado.

---

## 2. Estado actual del catálogo (inventario)

### 2.1 BEV sin par canónico por segmento y rango de precio

Tras auditar los 62 BEV con pipeline, los 42 sin par se distribuyen así (precios PVP sin Plan Auto+):

| Segmento BEV | < 25k€ | 25–35k€ | 35–45k€ | 45–55k€ | 55–70k€ | > 70k€ | **Total** |
|---|---|---|---|---|---|---|---|
| **Utilitario** | 0 | 0 | 4 | 0 | 0 | 0 | 4 |
| **Compacto** | 0 | 1 | 4 | 0 | 0 | 0 | 5 |
| **SUV** | 0 | 1 | 13 | 9 | 3 | 0 | 26 |
| **Berlina** | 0 | 0 | 0 | 4 | 2 | 0 | 6 |
| **Monovolumen** | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| **Total** | 0 | 2 | 21 | 13 | 6 | 0 | **42** |

Los 20 BEV con par canónico ya cubren (en parte) los rangos bajos Utilitario/Compacto/SUV. El peso del trabajo pendiente cae en SUV 35-55k€ (22 de los 42 modelos).

### 2.2 Fichas ICE actuales en `data/referencias/ice-equivalentes/`

10 fichas pobladas:

1. `hyundai-i10-mpi` — A — 15.900€ · benchmark para Dacia Spring, Inster, Dolphin Surf
2. `dacia-sandero-tce` — B — 14.900€ · benchmark para Dolphin 60kWh, Renault 5
3. `citroen-c3-puretech-100` — B — 17.500€ · benchmark para ë-C3
4. `peugeot-2008-puretech` — B-SUV — 25.850€ · benchmark para Atto 2, Jeep Avenger, e-2008
5. `volkswagen-golf-tsi` — C — 29.900€ · sin par asignado aún
6. `volkswagen-tiguan-tsi` — C-SUV — 36.700€ · benchmark para Kona, Elroq, EV3, EQA, bZ4X, Atto 3
7. `bmw-x1-sdrive18i` — C-SUV — 42.400€ · benchmark para iX1, iX2
8. `bmw-x3-xdrive20i` — D-SUV — 60.900€ · benchmark para Model Y RWD
9. `bmw-320i-sedan` — D — 49.814€ · benchmark para Model 3 RWD, Model 3 LR, Polestar 2, BYD Seal
10. *(falta ficha i4/equivalente berlina premium premium o ya cubierto por 320i)*

### 2.3 Opciones HEV ya listadas pero sin ficha poblada

`benchmarks_ice.json` incluye estas tres opciones HEV **sin** JSON propio — son opciones de UI pero el loader no puede consumirlas porque `iceFromJson()` necesita el archivo físico:

- `toyota-yaris-cross-hev` — B-SUV — 116 CV
- `toyota-rav4-hev` — C-SUV — 218 CV
- `hyundai-tucson-hev` — C-SUV — 230 CV

Son las candidatas naturales para arrancar el catálogo HEV.

---

## 3. Diseño congelado

### 3.1 Clave única `equivalente_termico`

Cada BEV tiene **exactamente 1 referente natural** asignado, guardado bajo la clave `equivalente_termico` en `specs_tco`. El referente puede ser ICE, HEV o PHEV; el tipo se indica en el campo `tipo` interno. No hay selector dual obligatorio; si el usuario quiere comparar con una segunda tecnología, se listan en `alternativas` y la UI ofrece cambiar.

```json
"equivalente_termico": {
  "tipo": "HEV",
  "referente_id": "toyota-corolla-cross-hev",
  "razon": "HEV más representativo del segmento y rango de precio del BEV",
  "alternativas": [
    { "tipo": "ICE", "referente_id": "volkswagen-tiguan-tsi" },
    { "tipo": "PHEV", "referente_id": "kia-sportage-phev" }
  ]
}
```

### 3.2 PHEV con slider de ratio eléctrico/combustión

El PHEV es un caso especial: su consumo real depende del patrón de uso del conductor. Se modela con dos inputs en la ficha + un parámetro de UI:

**En la ficha PHEV (`data/referencias/phev-equivalentes/<slug>.json`):**

```json
"specs_tco": {
  "consumo_electrico_wltp_kwh100km": { "valor": 17.5, ... },
  "consumo_combustion_wltp_l100km":  { "valor": 6.8,  ... },
  "autonomia_electrica_wltp_km":     { "valor": 75,   ... },
  "ratio_electrico_default":         { "valor": 0.70,
                                       "fuente_tipo": "estudio_sectorial",
                                       "fuente_detalle": "ICCT 2024 — PHEV real-world utility factor España",
                                       "notas": "Usuarios que cargan a diario en casa llegan a ~0.70. Usuarios sin recarga accesible bajan a ~0.25." },
  ...
}
```

**En la UI:**

- Slider "Ratio eléctrico" con rango 0% → 100%, default según `ratio_electrico_default` del modelo.
- Fórmula consumo combinado = `ratio × kWh/100 × precio_kwh + (1-ratio) × L/100 × precio_L`.
- Se respeta el cap de autonomía eléctrica (si ratio implica > autonomía/km_anuales, avisar).
- Badge en la tarjeta: "Asumiendo XX% de uso eléctrico. Cambia con el slider".

### 3.3 Mapeo BEV→referente: natural, 1:1, sin matriz cerrada

El asignador recorre los 42 BEV uno a uno y asigna el análogo más defendible editorialmente. No se fuerza la pertenencia a una tupla predefinida: dos BEV del mismo segmento pueden tener referentes distintos si es lo correcto (p. ej. Tesla Model Y → Toyota RAV4 HEV vs Audi Q4 e-tron → BMW X1 ICE, aunque ambos sean "SUV 45-55k€").

El criterio de asignación, por orden de preferencia:

1. **Hermano térmico intra-plataforma** — si el fabricante tiene un ICE/HEV/PHEV sobre la misma plataforma (p. ej. Ford Explorer EV → Ford Kuga HEV; VW ID.4 → VW Tiguan; Kia EV3 → Kia Sportage HEV).
2. **Mismo fabricante, segmento análogo** — si no hay hermano plataforma pero sí gama (Mercedes EQA → Mercedes GLA 200).
3. **Benchmark sectorial por segmento + rango precio** — líder de ventas del segmento en España (ANFAC 2025), preferentemente HEV si es el más vendido (p. ej. SUV compacto → Toyota RAV4 HEV o Hyundai Tucson HEV).
4. **Sin equivalente directo** — si ningún análogo es honesto (p. ej. VW ID Buzz — monovolumen eléctrico puro sin análogo térmico real), se deja `equivalente_termico: null` y la tarjeta TCO muestra "sin equivalente térmico directo" con razón editorial.

### 3.4 Universo probable de referentes

No es una "matriz mínima" cerrada, pero para estimar trabajo: basándose en los 42 BEV, el catálogo de referentes probable rondará **15-20 fichas** (mezcla ICE + HEV + PHEV). Se crea cada ficha cuando un BEV la requiera; no hay pre-creación especulativa. Referentes ya existentes (10 ICE en `data/referencias/ice-equivalentes/`) se reutilizan donde encajan.

### 3.5 Metodología v2 consolidada

Se actualiza `docs/metodologia-tco.md` directamente a **v2 (2026-04-DD)** con cambios:

- Nueva **§2.7 — equivalente_hev_***: depreciación/mantenimiento/seguro para HEV auto-recargable (Full Hybrid). Cadenas de derivación y tabla `fuente_tipo` ampliada.
- Nueva **§2.8 — equivalente_phev_***: íd. para PHEV, añade campos `consumo_electrico_wltp_kwh100km`, `consumo_combustion_wltp_l100km`, `autonomia_electrica_wltp_km`, `ratio_electrico_default`.
- Nueva **§5.3 — Factores correctivos HEV sobre ICE-segmento:** mantenimiento ×0.85 (menor desgaste frenos, motor ayudado), seguro ×1.05 (batería HV), depreciación Toyota/Hyundai HEV ~75% retención a 3 años (Ganvam).
- Nueva **§5.4 — Factores correctivos PHEV sobre HEV-segmento:** mantenimiento ×1.10 (doble sistema), seguro ×1.12 (mayor valor de reposición batería), depreciación ~70% retención a 3 años (peor que HEV por percepción de complejidad).
- **§3 ampliada:** añadir `fuente_tipo` nuevos: `media_hev_segmento`, `media_phev_segmento`, `hermano_plataforma_hev`, `hermano_plataforma_phev`, `factor_hev_sobre_ice`, `factor_phev_sobre_hev`, `estudio_sectorial_utility_factor`.
- **§4 intacta:** bandas ±0/±8/±15 siguen aplicando por confianza alta/media/baja.
- **§6 ampliada:** la regla intra-plataforma se extiende: si un BEV y su hermano PHEV comparten plataforma y fábrica, no puede haber más de ±8pp de diferencia en depreciación a 3 años sin justificación.

Cambio de versión: `metodologia-tco.md` bump a v2.0. Backup del archivo v1 antes de tocar (commit del estado anterior con tag `methodology-v1-frozen-2026-04-20`).

---

## 4. Esquema de los 3 campos a poblar en los 42 BEV

Mismo schema que Tesla M3 RWD, copiado aquí para referencia:

```json
"specs_tco": {
  "depreciacion_y3_pct": {
    "valor": 0.32,
    "unidad": "fracción",
    "fuente_tipo": "ganvam_segmento",
    "fuente_fecha": "2026-04-XX",
    "verificado": true,
    "confianza": "media",
    "fuente_detalle": "Ganvam Boletín MY-2022 SUV compacto + ajuste +3pp por estar fuera de Plan Auto+",
    "notas": "Revisar Q3 2026"
  },
  "depreciacion_y5_pct": { ... },
  "depreciacion_y10_pct": { ... },
  "mantenimiento_anual_eur": {
    "valor": 95,
    "unidad": "€/año",
    "fuente_tipo": "fabricante",
    "fuente_fecha": "2026-04-XX",
    "verificado": true,
    "confianza": "media",
    "fuente_detalle": "Marca España plan mantenimiento 4y/60.000km, 380€ total ÷ 4",
    "notas": "...",
    "mantenimiento_cobertura": "Revisión oficial anual, sin neumáticos, pastillas, ITV, batería 12V"
  },
  "seguro_anual_eur": {
    "valor": 720,
    "unidad": "€/año",
    "fuente_tipo": "tres_cotizaciones_reales",
    "fuente_fecha": "2026-04-XX",
    "verificado": true,
    "confianza": "alta",
    "fuente_detalle": "Media de 3 cotizaciones todo riesgo 500€ franquicia — perfil enchufa2 estándar",
    "seguro_cotizaciones": [
      { "aseguradora": "Mutua Madrileña", "prima_eur": 680, "modalidad": "TR 500€F", "fecha": "2026-04-12" },
      { "aseguradora": "Línea Directa", "prima_eur": 745, "modalidad": "TR 500€F", "fecha": "2026-04-12" },
      { "aseguradora": "Allianz", "prima_eur": 735, "modalidad": "TR 500€F", "fecha": "2026-04-13" }
    ]
  },
  "precio_electricidad_eur_kwh": null,
  "consumo_real_factor": {
    "valor": 1.18,
    "unidad": "multiplicador",
    "fuente_tipo": "investigacion_web",
    "fuente_fecha": "2026-04-XX",
    "confianza": "alta",
    "fuente_detalle": "EV-Database real-world consumption + InsideEVs tests"
  },
  "equivalente_termico": {
    "tipo": "HEV",
    "referente_id": "toyota-corolla-cross-hev",
    "fuente_tipo": "benchmark_segmento",
    "razon": "HEV más representativo del segmento SUV compacto en España 2025 — líder de ventas ANFAC",
    "alternativas": [
      { "tipo": "ICE",  "referente_id": "volkswagen-tiguan-tsi" },
      { "tipo": "PHEV", "referente_id": "kia-sportage-phev" }
    ]
  }
}
```

**Cambio clave vs schema v1:** se sustituye `equivalente_ice` por `equivalente_termico`, que unifica ICE/HEV/PHEV bajo una misma estructura y permite al usuario saltar entre tecnologías con las `alternativas`.

---

## 5. Plan por fases

### F1 — Metodología v2 consolidada (semana 1, ~3 días)

1. Backup del v1 actual: tag `methodology-v1-frozen-2026-04-20` + commit de seguridad.
2. Redactar borrador §2.7 (HEV), §2.8 (PHEV), §5.3 (factor HEV/ICE), §5.4 (factor PHEV/HEV) y ampliación §3 (nuevos `fuente_tipo`) en un archivo de trabajo `docs/_draft-metodologia-v2.md`.
3. Javi revisa borrador con datos concretos (ratios, factores, bandas).
4. Consolidar en `metodologia-tco.md` v2 tras revisión.
5. Salida: metodología v2 publicada, lista para poblar JSONs.

### F2 — Mapeo BEV→referente por análisis uno a uno (semana 1-2, ~0.5 día)

1. Listar los 42 BEV y asignar referente natural siguiendo orden §3.3 (hermano plataforma > mismo fabricante > benchmark segmento > null).
2. Producir tabla `docs/mapeo-equivalente-termico.md` con las 42 filas: BEV → referente_id propuesto → razón → ficha referente existe sí/no.
3. Javi valida la tabla; ajustes se aplican antes de crear fichas.
4. Salida: lista congelada de referentes a crear + reutilizar.

### F3 — Crear fichas de referentes faltantes (semana 2-3, ~0.5 día/ficha)

1. Por cada referente_id nuevo en F2 que no exista, crear ficha JSON en:
   - `data/referencias/ice-equivalentes/<slug>.json`
   - `data/referencias/hev-equivalentes/<slug>.json` (carpeta nueva)
   - `data/referencias/phev-equivalentes/<slug>.json` (carpeta nueva)
2. Schema completo: `specs` + `specs_tco` + `meta`. Para PHEV, añadir los campos §3.2.
3. Validar con `node scripts/data-pipeline/validate-ice-equivalent.mjs` (extender a HEV/PHEV si hace falta).
4. Salida: ~15-20 fichas referente, todas con `tco_poblado: true`.

### F4 — Ampliar pipeline y loader (semana 3, ~1 día)

1. `loader.mjs` lee también `hev-equivalentes/` y `phev-equivalentes/`; expone `referentesTCO` (dict unificado keyed por slug) con campo `tipo` ("ICE"|"HEV"|"PHEV").
2. `cargarParesTCO()` acepta `{bev, termico}` — `termico` apunta a cualquier tipo.
3. `cargarDatosCliente()` expone `referentesTCO` en vez de (o además de) `icesTCO`. Mantener `icesTCO` como alias durante transición para no romper UI.
4. `benchmarks_ice.json` se renombra a `benchmarks_termicos.json` con entradas tipadas.
5. Salida: pipeline sin romper nada; los 20 pares actuales siguen funcionando.

### F5 — Poblar los 42 BEV (semanas 3-7, ~1 día/BEV — bulk ~4 semanas en paralelo con F6)

Workflow por BEV:
1. Leer ficha del modelo, verificar qué falta en `specs_tco`.
2. Depreciación: Ganvam segmento + EV-Database value retention + muestra autocasion.com (3 años, 45k km).
3. Mantenimiento: plan oficial fabricante (Marca España u OEM EU); si no publica, hermano plataforma o factor sobre media segmento.
4. Seguro: 3 cotizaciones reales perfil enchufa2 estándar (ver `docs/perfil-estandar-seguro.md`); si no viables, factor BEV sobre seguro ICE de segmento (§5.2 metodología).
5. `equivalente_termico` según §3.3 + tabla F2.
6. `npm run data:audit` + `npm run data:build` antes de commit.
7. Commit por BEV: `data(tco): poblar TCO de <marca-modelo>`.

### F6 — UI comparador TCO v2 (semana 4-5)

1. Tarjeta TCO: etiqueta del rival usa `equivalente_termico.tipo` ("vs ICE / vs HEV / vs PHEV").
2. Dropdown "Cambiar rival" muestra `alternativas` + todo el catálogo de referentes del tipo elegido.
3. **Slider PHEV** aparece solo cuando `equivalente_termico.tipo === 'PHEV'`: ratio 0-100% default al `ratio_electrico_default` del referente. Recalcula consumo en vivo.
4. BEV con `equivalente_termico: null` muestran tarjeta con "sin equivalente térmico directo" + razón editorial (no vacía).
5. QA con los 20 BEV ya poblados + primer bloque de 10 nuevos.

### F7 — QA y publicación progresiva (semana 7+)

1. `tco-audit.mjs` extendido valida cobertura X/62 con TCO completo + tipo de rival.
2. Verificación manual en producción cada vez que se hace deploy (abrir browser, seleccionar coche, comprobar fuente en popovers).
3. Deploy a main por bloques de ~10 BEV para trazabilidad.
4. Cuando todos los 62 estén poblados: artículo editorial "Cómo calculamos el TCO en enchufa2 v2 — ahora con híbridos" (~750 palabras, backlink metodología).

---

## 6. Criterios de aceptación

- [x] D1-D5 aprobados por Javi (2026-04-20).
- [ ] `metodologia-tco.md` v2 publicada con §2.7 (HEV), §2.8 (PHEV), §5.3, §5.4.
- [ ] Tabla `docs/mapeo-equivalente-termico.md` con 42 filas validada.
- [ ] Fichas referentes (ICE/HEV/PHEV) necesarias creadas y validadas.
- [ ] 42 BEV con bloque `specs_tco` completo + `equivalente_termico` (o `null` justificado).
- [ ] 0 tarjetas TCO vacías no justificadas en `/comparador/` al seleccionar cualquiera de los 62 BEV (un "sin equivalente térmico directo" con razón editorial NO cuenta como vacía).
- [ ] Slider PHEV funcional cuando el rival es PHEV.
- [ ] Pipeline sin fallos (`npm run data:build`, `npm run data:audit`).
- [ ] Verificación manual post-deploy de al menos 5 BEV aleatorios + 1 PHEV (comprobar slider).
- [ ] No hay valores sin `fuente_tipo`/`confianza` en ningún JSON.
- [ ] `tco-sanity-check.mjs` pasa para toda la flota: depreciación y3 entre 20-45%, y5 entre 35-55%, y10 entre 55-75%; seguro entre 450-1400 €/año; mantenimiento entre 60-350 €/año.

---

## 7. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| 42 × 3 cotizaciones seguro = 126 peticiones | Alto tiempo | Agrupar por perfil-coche casi idéntico; 1 cotización × modelo + 2 cotizaciones benchmark sectoriales por tupla (segmento, precio). Confianza "media" aceptable para un tercio del catálogo. |
| Ganvam segmentos no siempre publicados a 10 años | Confianza "baja" en y10 | Aceptable si se etiqueta claramente; notas de revisión 2027 |
| HEV con datos de mantenimiento opacos (Toyota no publica plan) | Bloqueo puntual | Consulta a concesionario oficial + Consumer Reports + foros Toyota Club España |
| Empuje temporal fuerza soltar verificación | Datos inventados publicados | **Regla dura:** ningún BEV se publica hasta que sus 3 campos tienen `fuente_tipo` canónico. Si algo está "pendiente 3ª cotización", queda en branch hasta cerrar. |
| Cambios en Plan Auto+ (revisiones BOE) rompen PVPs usados para seguro | Medio | Seguro no depende del PVP post-ayuda; usar PVP base. Reauditar trimestralmente. |

---

## 8. Siguientes pasos inmediatos

1. Commit de este RFC en main con mensaje `docs(tco): RFC ampliación TCO a 42 BEV sin par — decisiones D1-D5 congeladas`.
2. Tag de seguridad: `methodology-v1-frozen-2026-04-20` sobre `docs/metodologia-tco.md` antes de tocarla.
3. Redactar borrador `docs/_draft-metodologia-v2.md` con §2.7, §2.8, §5.3, §5.4, §3 ampliada.
4. Javi revisa números concretos (ratios por defecto PHEV, factores HEV/ICE, bandas de sanity extendidas).
5. Consolidar v2 en `metodologia-tco.md`.
6. Arrancar F2 (tabla de mapeo) en paralelo.

Tiempo total estimado: **~7 semanas** de trabajo de datos serio. Los 20 BEV con par actual no tocan; la mejora es estrictamente aditiva y se despliega por bloques.
