#!/usr/bin/env node
/**
 * _audit_intra_plataforma.mjs
 *
 * Detecta divergencias en supuestos TCO (depreciación y3/y5, seguro, mantenimiento)
 * entre modelos que comparten la misma plataforma. Cuando dos variantes comparten
 * plataforma/factoría/química, sus baselines de TCO deben ser iguales salvo
 * evidencia explícita citada en `fuente_detalle`.
 *
 * Regla derivada del incidente del artículo 008 (abril 2026): la divergencia
 * iX1 vs iX2 (16pp en y5, 200€/año en seguro, 150€/año en manto) era un
 * artefacto editorial, no un hecho, y produjo 12.120€ de diferencia ficticia
 * en el output del calculador.
 *
 * Thresholds (configurables):
 *   y3/y5  : > 5pp  → flag
 *   seguro : > 100 €/año → flag
 *   manto  : > 100 €/año → flag
 *
 * Uso:
 *   node scripts/data-pipeline/_audit_intra_plataforma.mjs
 *
 * Exit code 0 si no hay flags, 1 si los hay (apto para CI).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const COCHES_DIR = path.join(REPO_ROOT, 'data/coches');

const TH = {
  y: 0.05, // 5 percentage points
  seguro: 100, // €/año
  manto: 100, // €/año
};

function main() {
  const files = fs.readdirSync(COCHES_DIR).filter((f) => f.endsWith('.json'));
  const rows = [];
  for (const f of files) {
    const j = JSON.parse(fs.readFileSync(path.join(COCHES_DIR, f), 'utf8'));
    const s = j.specs || {};
    const t = j.specs_tco || {};
    rows.push({
      slug: j.slug || f.replace('.json', ''),
      plataforma: s.plataforma?.valor || null,
      segmento: j.segmento || null,
      y3: t.depreciacion_y3_pct?.valor ?? null,
      y5: t.depreciacion_y5_pct?.valor ?? null,
      seguro: t.seguro_anual_eur?.valor ?? null,
      manto: t.mantenimiento_anual_eur?.valor ?? null,
    });
  }

  // Agrupación: plataforma + segmento. Dos modelos de la misma plataforma
  // pero distintos segmentos (ej. Dolphin Surf A vs Seal D) no son
  // comparables para TCO.
  const byKey = new Map();
  for (const r of rows) {
    if (!r.plataforma) continue;
    const key = `${r.plataforma} · ${r.segmento || '?'}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(r);
  }

  let flags = 0;
  console.log('\n▶ Auditoría intra-plataforma\n');

  for (const [plat, arr] of [...byKey].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (arr.length < 2) continue;
    const conDatos = arr.filter((r) => r.y3 != null || r.y5 != null || r.seguro != null || r.manto != null);
    if (conDatos.length < 2) continue;

    const issues = [];
    function cmp(field, threshold, fmt) {
      const vals = conDatos.map((r) => r[field]).filter((v) => v != null);
      if (vals.length < 2) return;
      const max = Math.max(...vals);
      const min = Math.min(...vals);
      if (max - min > threshold) {
        const detalle = conDatos
          .filter((r) => r[field] != null)
          .map((r) => `${r.slug}=${fmt(r[field])}`)
          .join(', ');
        issues.push(`  ⚠ ${field}: Δ=${fmt(max - min)} > ${fmt(threshold)} — ${detalle}`);
      }
    }
    cmp('y3', TH.y, (v) => `${(v * 100).toFixed(0)}%`);
    cmp('y5', TH.y, (v) => `${(v * 100).toFixed(0)}%`);
    cmp('seguro', TH.seguro, (v) => `${Math.round(v)}€`);
    cmp('manto', TH.manto, (v) => `${Math.round(v)}€`);

    if (issues.length > 0) {
      console.log(`[${plat}] n=${conDatos.length} con datos TCO`);
      for (const line of issues) {
        console.log(line);
        flags++;
      }
      console.log('');
    }
  }

  if (flags === 0) {
    console.log('✓ Sin divergencias intra-plataforma por encima de los thresholds.');
    console.log(`  thresholds: y=${TH.y * 100}pp, seguro=${TH.seguro}€, manto=${TH.manto}€\n`);
    process.exit(0);
  } else {
    console.log(`✗ ${flags} divergencia(s) intra-plataforma detectada(s).`);
    console.log('  Si las divergencias están justificadas, dejarlo documentado en fuente_detalle.');
    console.log('  Si no, unificar baselines o bajar confianza a `baja` + verificado:false.\n');
    process.exit(1);
  }
}

main();
