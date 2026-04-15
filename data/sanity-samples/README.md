# Sanity samples trimestrales (D5 Fase D)

Esta carpeta guarda las muestras reales de mercado que usamos cada trimestre
para **auditar** — no sustituir — los anclajes de depreciación de
`data/coches/*.json` según `docs/metodologia-tco.md` §7.

## Estructura

```
data/sanity-samples/
├── README.md                 ← este archivo
└── 2026-Q2/
    ├── tesla-model-3-rwd-highland.json
    ├── bmw-ix1-xdrive30.json
    └── ...
```

Una subcarpeta por trimestre (`YYYY-Qn`). Dentro, un archivo por modelo,
llamado exactamente igual que el `slug` del JSON en `data/coches/`.

## Formato del archivo de muestras

```jsonc
{
  "slug": "tesla-model-3-rwd-highland",
  "pvp_nuevo_ref_eur": 42990,
  "fecha_recogida": "2026-04-15",
  "fuente_url": "https://www.autoscout24.es/lst/tesla/model-3",
  "fuente_tipo": "autoscout24",
  "notas": "Scraping manual. Filtros: año ≥2021, km ≥30.000, España.",
  "samples": [
    { "anio_matriculacion": 2021, "km":  48000, "precio_eur": 28500 },
    { "anio_matriculacion": 2021, "km":  62000, "precio_eur": 27200 },
    { "anio_matriculacion": 2020, "km":  72000, "precio_eur": 25200 }
  ]
}
```

Formato idéntico al que usa `scripts/data-pipeline/ingest-samples-cochesnet.mjs`,
para poder reutilizar una misma recogida en ambos flujos.

## Workflow trimestral

1. Recoger muestras (Autoscout24 / Coches.net) → guardarlas en
   `data/sanity-samples/YYYY-Qn/<slug>.json`.
2. Ejecutar `npm run data:tco-sanity` (o `--quarter YYYY-Qn` si quieres mirar
   otro trimestre). El script lee todos los archivos de la carpeta y compara
   con los anclajes actuales.
3. Leer el reporte:
   - **OK** (gap <10 %): anclaje validado, anotar fecha.
   - **WATCH** (10–20 %): revisar en la próxima pasada, no bloquea.
   - **FLAG** (≥20 %): recalibrar el factor §5.1 afectado y abrir bug en
     `docs/metodologia-tco.md`.
4. Si hay algún FLAG el script sale con código 1 — útil si se cablea a CI.

## Principio rector

> La recogida de muestras **nunca** reemplaza al método. Es un control de
> calidad trimestral. El método sigue siendo el de §2.
>
> — `docs/metodologia-tco.md` §7

El script `tco-sanity-check.mjs` **no modifica ningún JSON**. Si quieres
patchear anclajes con muestras reales, usa
`scripts/data-pipeline/ingest-samples-cochesnet.mjs`, que es el flujo
explícito de recalibración del piloto de 5 modelos.
