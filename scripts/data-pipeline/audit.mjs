#!/usr/bin/env node
/**
 * audit.mjs — reporta cobertura de campos en data/coches/.
 *
 * Uso:
 *   node scripts/data-pipeline/audit.mjs              # resumen por campo
 *   node scripts/data-pipeline/audit.mjs --campo X    # detalle un campo
 *   node scripts/data-pipeline/audit.mjs --coche slug # estado de un coche
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIELD_REGISTRY, GROUPS, fieldsByGroup } from './fields.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const COCHES_DIR = path.join(REPO_ROOT, 'data/coches');

function loadAll() {
  const files = fs.readdirSync(COCHES_DIR).filter(f => f.endsWith('.json')).sort();
  return files.map(f => ({
    slug: f.replace(/\.json$/, ''),
    data: JSON.parse(fs.readFileSync(path.join(COCHES_DIR, f), 'utf8')),
  }));
}

function summary() {
  const coches = loadAll();
  const total = coches.length;
  const grupos = fieldsByGroup();

  console.log(`\n=== Cobertura enchufa2 · ${total} coches ===\n`);

  for (const [gKey, gInfo] of Object.entries(grupos)) {
    console.log(`— ${gInfo.label.toUpperCase()} —`);
    for (const f of gInfo.fields) {
      let conValor = 0, verificados = 0;
      for (const c of coches) {
        const spec = c.data.specs?.[f.key];
        if (!spec) continue;
        if (spec.valor !== null && spec.valor !== undefined) conValor++;
        if (spec.verificado === true) verificados++;
      }
      const vPct = Math.round(100 * verificados / total);
      const cPct = Math.round(100 * conValor / total);
      const bar = '█'.repeat(Math.floor(vPct / 5)).padEnd(20, '·');
      console.log(
        `  ${bar}  ${String(verificados).padStart(2)}v/${String(conValor).padStart(2)}c ` +
        `(${String(vPct).padStart(3)}%v · ${String(cPct).padStart(3)}%c)  ${f.key}`
      );
    }
    console.log('');
  }

  // Totales
  let totalSpecs = 0, totalConValor = 0, totalVerif = 0;
  for (const c of coches) {
    for (const key of Object.keys(FIELD_REGISTRY)) {
      const spec = c.data.specs?.[key];
      if (!spec) continue;
      totalSpecs++;
      if (spec.valor !== null && spec.valor !== undefined) totalConValor++;
      if (spec.verificado === true) totalVerif++;
    }
  }
  console.log(`TOTAL: ${totalVerif} verificados / ${totalConValor} con valor / ${totalSpecs} slots`);
  console.log(`       ${Math.round(100*totalVerif/totalSpecs)}% verificado · ${Math.round(100*totalConValor/totalSpecs)}% con valor\n`);
}

function detalleCampo(fieldKey) {
  if (!FIELD_REGISTRY[fieldKey]) {
    console.error(`✗ Campo desconocido: ${fieldKey}`);
    process.exit(1);
  }
  const coches = loadAll();
  console.log(`\n=== Detalle campo "${fieldKey}" ===\n`);
  for (const c of coches) {
    const spec = c.data.specs?.[fieldKey];
    if (!spec) { console.log(`  ∅  ${c.slug}`); continue; }
    const v = spec.verificado ? '✓' : (spec.valor !== null ? '·' : ' ');
    const val = spec.valor === null ? '—' : JSON.stringify(spec.valor);
    const src = spec.fuente_tipo === 'pendiente' ? '' : `  [${spec.fuente_tipo}]`;
    console.log(`  ${v}  ${c.slug.padEnd(50)} ${val}${src}`);
  }
  console.log('');
}

function detalleCoche(slug) {
  const file = path.join(COCHES_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) {
    console.error(`✗ No existe: ${slug}.json`);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(`\n=== ${data.marca} ${data.modelo} ${data.variante || ''} ===\n`);
  const grupos = fieldsByGroup();
  for (const [gKey, gInfo] of Object.entries(grupos)) {
    let lines = [];
    for (const f of gInfo.fields) {
      const spec = data.specs?.[f.key];
      if (!spec) continue;
      const v = spec.verificado ? '✓' : (spec.valor !== null && spec.valor !== undefined ? '·' : ' ');
      const val = spec.valor === null || spec.valor === undefined ? '—' : spec.valor;
      lines.push(`    ${v}  ${String(f.key).padEnd(34)} ${val}${spec.unidad ? ' ' + spec.unidad : ''}`);
    }
    if (lines.some(l => !l.includes(' —'))) {
      console.log(`  ${gInfo.label}`);
      lines.forEach(l => console.log(l));
      console.log('');
    }
  }
}

// Main
const args = process.argv.slice(2);
const idx = args.indexOf('--campo');
const idxC = args.indexOf('--coche');
if (idx >= 0 && args[idx+1]) detalleCampo(args[idx+1]);
else if (idxC >= 0 && args[idxC+1]) detalleCoche(args[idxC+1]);
else summary();
