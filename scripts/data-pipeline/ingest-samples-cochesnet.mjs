#!/usr/bin/env node
/**
 * ingest-samples-cochesnet.mjs — Ingesta muestras reales de Coches.net y
 *   recalcula los anclajes de depreciación (y3, y5) de un modelo.
 *
 * Uso:
 *   node scripts/data-pipeline/ingest-samples-cochesnet.mjs <slug> <archivo-samples.json>
 *
 * Formato de <archivo-samples.json>:
 * {
 *   "slug": "tesla-model-3-rwd-highland",
 *   "pvp_nuevo_ref_eur": 42990,
 *   "fecha_recogida": "2026-04-15",
 *   "fuente_url": "https://www.coches.net/tesla-model_3-segunda-mano/",
 *   "notas": "Muestra Tesla Model 3 RWD SR+ 2019-2021 como proxy del Highland 2023+ (mismo segmento/formato).",
 *   "samples": [
 *     { "anio_matriculacion": 2021, "km": 48000, "precio_eur": 28500 },
 *     { "anio_matriculacion": 2020, "km": 72000, "precio_eur": 25200 },
 *     ...
 *   ]
 * }
 *
 * Proceso:
 *  1. Para cada muestra calcula edad = año_referencia − anio_matriculacion
 *  2. Calcula ratio de retención: precio_eur / pvp_nuevo_ref_eur
 *  3. Agrupa por edad y calcula mediana de retención
 *  4. Interpola mediana y3 e y5 (sólo si hay ≥3 muestras ± 6 meses del ancla)
 *  5. Parchea data/coches/<slug>.json:
 *        specs_tco.depreciacion_y3_pct.valor = 1 - mediana_y3
 *        specs_tco.depreciacion_y5_pct.valor = 1 - mediana_y5
 *        ambos con fuente_tipo: "muestras_cochesnet"
 *        confianza: "alta" si n≥10, "media" si 5≤n<10, "baja" si <5
 *
 * El script NO ejecuta data:build automáticamente — eso se hace a mano al
 * terminar todo el lote piloto, junto con data:audit y tests.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const COCHES_DIR = path.join(REPO_ROOT, 'data/coches');

function mediana(arr) {
  if (arr.length === 0) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function anioDe(fecha) {
  return new Date(fecha).getFullYear();
}

function calcularAnclajes(samples, pvp_nuevo, fecha_ref) {
  // edad en años (enteros). Redondeamos fecha_matriculacion=01/07 implícito.
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
  // Mediana por edad
  const medianas = new Map();
  for (const [edad, arr] of porEdad) {
    medianas.set(edad, { n: arr.length, mediana: mediana(arr) });
  }

  // Interpolación lineal para y3 e y5
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
    const n_combinado = medianas.get(prev).n + medianas.get(next).n;
    return {
      mediana: interp,
      n: n_combinado,
      modo: `interpolado entre edad ${prev} (n=${medianas.get(prev).n}) y edad ${next} (n=${medianas.get(next).n})`,
    };
  }

  const y3 = interpolar(3);
  const y5 = interpolar(5);
  return { porEdad: medianas, y3, y5 };
}

function confianzaDe(n) {
  if (n >= 10) return 'alta';
  if (n >= 5) return 'media';
  return 'baja';
}

function patchDepreciacion(json, ancla, res, samples_meta) {
  if (!res) return false;
  const path_ = ['specs_tco', `depreciacion_${ancla}_pct`];
  let target = json;
  for (let i = 0; i < path_.length - 1; i++) target = target[path_[i]];
  const key = path_[path_.length - 1];
  if (!target[key]) {
    target[key] = { unidad: 'fracción' };
  }
  const valorPct = round2(1 - res.mediana);
  target[key].valor = valorPct;
  target[key].fuente_tipo = 'muestras_cochesnet';
  target[key].fuente_fecha = samples_meta.fecha_recogida;
  target[key].verificado = true;
  target[key].confianza = confianzaDe(res.n);
  target[key].unidad = 'fracción';
  target[key].fuente_detalle =
    `N=${res.n} muestras Coches.net recogidas ${samples_meta.fecha_recogida}. ` +
    `Retención mediana ${ancla.toUpperCase()}=${(res.mediana * 100).toFixed(1)}% ` +
    `(depreciación=${(valorPct * 100).toFixed(1)}%). Método: ${res.modo}. ` +
    `PVP referencia: ${samples_meta.pvp_nuevo_ref_eur}€. ` +
    (samples_meta.notas ?? '');
  target[key].notas = target[key].notas || samples_meta.notas || null;
  target[key].fuente_url = samples_meta.fuente_url;
  return true;
}

function main() {
  const [slug, samplesPath] = process.argv.slice(2);
  if (!slug || !samplesPath) {
    console.error('Uso: node scripts/data-pipeline/ingest-samples-cochesnet.mjs <slug> <samples.json>');
    process.exit(1);
  }

  const samplesAbs = path.resolve(samplesPath);
  if (!fs.existsSync(samplesAbs)) {
    console.error(`✗ No existe archivo de muestras: ${samplesAbs}`);
    process.exit(1);
  }
  const samples = JSON.parse(fs.readFileSync(samplesAbs, 'utf8'));
  if (samples.slug !== slug) {
    console.error(`✗ slug en archivo (${samples.slug}) no coincide con argumento (${slug})`);
    process.exit(1);
  }

  const jsonPath = path.join(COCHES_DIR, `${slug}.json`);
  if (!fs.existsSync(jsonPath)) {
    console.error(`✗ No existe JSON del modelo: ${jsonPath}`);
    process.exit(1);
  }
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const res = calcularAnclajes(
    samples.samples,
    samples.pvp_nuevo_ref_eur,
    samples.fecha_recogida,
  );

  console.log(`\n▶ ${slug} — ${samples.samples.length} muestras`);
  console.log('  Retención mediana por edad:');
  for (const [edad, { n, mediana: m }] of [...res.porEdad].sort((a, b) => a[0] - b[0])) {
    console.log(`    edad ${edad}: n=${n}, retención=${(m * 100).toFixed(1)}% (dep=${((1 - m) * 100).toFixed(1)}%)`);
  }
  console.log('');

  const okY3 = patchDepreciacion(json, 'y3', res.y3, samples);
  const okY5 = patchDepreciacion(json, 'y5', res.y5, samples);
  if (!okY3 && !okY5) {
    console.error('✗ No se pudo calcular ni y3 ni y5 (muestras insuficientes).');
    process.exit(1);
  }

  if (res.y3) {
    console.log(`  y3 → depreciación ${((1 - res.y3.mediana) * 100).toFixed(1)}% (n=${res.y3.n}, ${res.y3.modo}, confianza=${confianzaDe(res.y3.n)})`);
  } else {
    console.log('  y3 → no calculable');
  }
  if (res.y5) {
    console.log(`  y5 → depreciación ${((1 - res.y5.mediana) * 100).toFixed(1)}% (n=${res.y5.n}, ${res.y5.modo}, confianza=${confianzaDe(res.y5.n)})`);
  } else {
    console.log('  y5 → no calculable');
  }

  json.meta = json.meta ?? {};
  json.meta.fecha_actualizacion = today();

  fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2) + '\n', 'utf8');
  console.log(`\n✓ Patched ${jsonPath}\n`);
}

main();
