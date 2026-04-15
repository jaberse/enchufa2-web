#!/usr/bin/env node
/**
 * tco-sanity-check.mjs — Sanity check trimestral TCO (D5 Fase D)
 *
 * Lee muestras reales del mercado español (Autoscout24 / Coches.net) y las
 * compara con los anclajes `depreciacion_y3_pct` / `depreciacion_y5_pct` que
 * tenemos hoy en `data/coches/<slug>.json`. **NO modifica ningún JSON.** Es
 * un control de calidad trimestral: confirma que nuestras estimaciones siguen
 * siendo defendibles frente a precios reales de usados, o flagea las que se
 * han ido de rango.
 *
 * Diseño según docs/metodologia-tco.md §7:
 *   1. gap < 10 %           → OK        (anclaje validado, se anota fecha)
 *   2. 10 % ≤ gap < 20 %    → WATCH     (revisar en próxima pasada)
 *   3. gap ≥ 20 %           → FLAG      (recalibrar factor §5.1 afectado)
 *
 * Importante: este script **no sustituye al método**. El artículo 008 se
 * retiró porque tomamos una proyección como medición; D5 hace lo contrario,
 * toma mediciones para auditar la proyección sin reemplazarla.
 *
 * Uso:
 *   node scripts/data-pipeline/tco-sanity-check.mjs [--dir <path>] [--quarter YYYY-Qn]
 *
 *   --dir <path>       Carpeta con archivos <slug>.json de muestras.
 *                      Default: data/sanity-samples/<current-quarter>
 *   --quarter YYYY-Qn  Atajo equivalente a --dir data/sanity-samples/YYYY-Qn
 *
 * Formato de cada <slug>.json (idéntico al de ingest-samples-cochesnet.mjs
 * para poder reutilizar una recogida de muestras):
 *
 *   {
 *     "slug": "tesla-model-3-rwd-highland",
 *     "pvp_nuevo_ref_eur": 42990,
 *     "fecha_recogida": "2026-04-15",
 *     "fuente_url": "https://www.autoscout24.es/...",
 *     "samples": [
 *       { "anio_matriculacion": 2021, "km": 48000, "precio_eur": 28500 },
 *       ...
 *     ]
 *   }
 *
 * Salida:
 *   - Tabla por modelo con current/observed/gap/status para y3 e y5.
 *   - Resumen trimestral con contadores OK / WATCH / FLAG.
 *   - Exit code 1 si al menos un modelo está en FLAG (para CI).
 *   - Exit code 0 si todo OK o solo WATCH (los WATCH se anotan, no bloquean).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const COCHES_DIR = path.join(REPO_ROOT, 'data/coches');
const SAMPLES_ROOT = path.join(REPO_ROOT, 'data/sanity-samples');

const THRESH_WATCH = 0.10; // ≥10 % → WATCH
const THRESH_FLAG = 0.20;  // ≥20 % → FLAG

// ---------------------------------------------------------------------------
// Helpers comunes (alineados con ingest-samples-cochesnet.mjs)
// ---------------------------------------------------------------------------

function mediana(arr) {
  if (arr.length === 0) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function anioDe(fecha) {
  return new Date(fecha).getFullYear();
}

function currentQuarter() {
  const d = new Date();
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()}-Q${q}`;
}

function calcularAnclajes(samples, pvp_nuevo, fecha_ref) {
  const anioRef = anioDe(fecha_ref);
  const porEdad = new Map();
  for (const s of samples) {
    const edad = anioRef - s.anio_matriculacion;
    if (edad < 0 || edad > 12) continue;
    if (!s.precio_eur || !s.km) continue;
    const retencion = s.precio_eur / pvp_nuevo;
    if (!porEdad.has(edad)) porEdad.set(edad, []);
    porEdad.get(edad).push(retencion);
  }
  const medianas = new Map();
  for (const [edad, arr] of porEdad) {
    medianas.set(edad, { n: arr.length, mediana: mediana(arr) });
  }

  function interpolar(edad_objetivo) {
    if (medianas.has(edad_objetivo)) {
      const { n, mediana: m } = medianas.get(edad_objetivo);
      return { mediana: m, n, modo: 'directo' };
    }
    const edades = [...medianas.keys()].sort((a, b) => a - b);
    const prev = edades.filter((e) => e < edad_objetivo).pop();
    const next = edades.find((e) => e > edad_objetivo);
    if (prev == null || next == null) return null;
    const mp = medianas.get(prev).mediana;
    const mn = medianas.get(next).mediana;
    const frac = (edad_objetivo - prev) / (next - prev);
    const interp = mp + frac * (mn - mp);
    return {
      mediana: interp,
      n: medianas.get(prev).n + medianas.get(next).n,
      modo: `interp ${prev}→${next}`,
    };
  }

  return { porEdad: medianas, y3: interpolar(3), y5: interpolar(5) };
}

function statusDe(gap) {
  if (gap == null) return '—';
  if (gap >= THRESH_FLAG) return 'FLAG';
  if (gap >= THRESH_WATCH) return 'WATCH';
  return 'OK';
}

function fmtPct(n) {
  if (n == null) return '   —  ';
  return `${(n * 100).toFixed(1).padStart(5)}%`;
}

function fmtGap(n) {
  if (n == null) return '   —  ';
  const sign = n >= 0 ? '+' : '−';
  return `${sign}${(Math.abs(n) * 100).toFixed(1).padStart(4)}%`;
}

function parseArgs(argv) {
  const args = { dir: null, quarter: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dir') args.dir = argv[++i];
    else if (argv[i] === '--quarter') args.quarter = argv[++i];
  }
  return args;
}

// ---------------------------------------------------------------------------
// Check por modelo
// ---------------------------------------------------------------------------

function checkModelo(samplesPath) {
  const samples = JSON.parse(fs.readFileSync(samplesPath, 'utf8'));
  const slug = samples.slug;
  if (!slug) throw new Error(`${samplesPath}: falta "slug"`);

  const jsonPath = path.join(COCHES_DIR, `${slug}.json`);
  if (!fs.existsSync(jsonPath)) {
    return { slug, error: `No existe data/coches/${slug}.json` };
  }
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const st = json.specs_tco ?? {};

  const res = calcularAnclajes(
    samples.samples,
    samples.pvp_nuevo_ref_eur,
    samples.fecha_recogida,
  );

  function evalAncla(ancla, anclaRes) {
    const current = st?.[`depreciacion_${ancla}_pct`]?.valor ?? null;
    if (anclaRes == null || current == null) {
      return { current, observed: null, gap: null, n: anclaRes?.n ?? 0 };
    }
    const observed = 1 - anclaRes.mediana;
    const gap = (observed - current) / current;
    return { current, observed, gap, n: anclaRes.n, modo: anclaRes.modo };
  }

  return {
    slug,
    n_muestras: samples.samples.length,
    fecha_recogida: samples.fecha_recogida,
    y3: evalAncla('y3', res.y3),
    y5: evalAncla('y5', res.y5),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv.slice(2));
  let dir = args.dir;
  if (!dir) {
    const q = args.quarter ?? currentQuarter();
    dir = path.join(SAMPLES_ROOT, q);
  }
  dir = path.resolve(dir);

  if (!fs.existsSync(dir)) {
    console.error(`✗ No existe la carpeta de muestras: ${dir}`);
    console.error(`  Crea data/sanity-samples/<YYYY-Qn>/ con un <slug>.json por modelo.`);
    console.error(`  Ver data/sanity-samples/README.md para el formato.`);
    process.exit(2);
  }

  const files = fs.readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(dir, f));

  if (files.length === 0) {
    console.error(`✗ Sin muestras en ${dir}`);
    process.exit(2);
  }

  console.log(`\nTCO sanity check — ${path.relative(REPO_ROOT, dir)}\n`);
  console.log(
    'slug'.padEnd(34) +
    ' n   cur_y3  obs_y3  gap_y3    cur_y5  obs_y5  gap_y5    status',
  );
  console.log('─'.repeat(110));

  const contador = { OK: 0, WATCH: 0, FLAG: 0, ERR: 0 };
  const flagged = [];

  for (const file of files) {
    let r;
    try {
      r = checkModelo(file);
    } catch (e) {
      contador.ERR++;
      console.log(`${path.basename(file, '.json').padEnd(34)}  ERROR: ${e.message}`);
      continue;
    }
    if (r.error) {
      contador.ERR++;
      console.log(`${r.slug.padEnd(34)}  ERROR: ${r.error}`);
      continue;
    }
    const s3 = statusDe(r.y3.gap);
    const s5 = statusDe(r.y5.gap);
    const worst = [s3, s5].includes('FLAG')
      ? 'FLAG'
      : [s3, s5].includes('WATCH') ? 'WATCH' : 'OK';
    contador[worst]++;
    if (worst === 'FLAG') flagged.push({ slug: r.slug, s3, s5, y3: r.y3, y5: r.y5 });

    console.log(
      r.slug.padEnd(34) +
      ` ${String(r.n_muestras).padStart(2)}   ` +
      `${fmtPct(r.y3.current)}  ${fmtPct(r.y3.observed)}  ${fmtGap(r.y3.gap)}    ` +
      `${fmtPct(r.y5.current)}  ${fmtPct(r.y5.observed)}  ${fmtGap(r.y5.gap)}    ` +
      worst,
    );
  }

  console.log('');
  console.log(
    `Resumen: ${contador.OK} OK · ${contador.WATCH} WATCH · ` +
    `${contador.FLAG} FLAG · ${contador.ERR} ERR`,
  );
  console.log('');
  console.log('Umbrales: OK <10 %, WATCH 10–20 %, FLAG ≥20 % (ver §7 metodología).');
  console.log('Este script NO modifica los JSON. Es un control de calidad, no un reemplazo del método.');

  if (contador.FLAG > 0) {
    console.log('');
    console.log('Modelos en FLAG (recalibrar §5.1 correspondiente):');
    for (const f of flagged) {
      console.log(`  · ${f.slug} — y3 ${f.s3} (gap ${fmtGap(f.y3.gap).trim()}), y5 ${f.s5} (gap ${fmtGap(f.y5.gap).trim()})`);
    }
    process.exit(1);
  }
  process.exit(0);
}

main();
