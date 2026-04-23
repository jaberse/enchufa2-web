// scripts/data-pipeline/strip-factor-v21.mjs
// One-shot: retira consumo_real_factor, factor_real_electrico, factor_real_combustion
// de todas las fichas de data/coches y data/referencias/termicos-equivalentes.
// Ejecutado una vez en el pivote v2.1 (2026-04-22). Se conserva como referencia.
//
// Uso:
//   node scripts/data-pipeline/strip-factor-v21.mjs --dry   # muestra qué tocaría
//   node scripts/data-pipeline/strip-factor-v21.mjs         # aplica in-place

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIRS = [
  'data/coches',
  'data/referencias/termicos-equivalentes',
];

const CAMPOS = [
  'consumo_real_factor',
  'factor_real_electrico',
  'factor_real_combustion',
];

const dry = process.argv.includes('--dry');
let touched = 0;
let skipped = 0;

for (const dir of DIRS) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  for (const f of files) {
    const path = join(dir, f);
    const raw = readFileSync(path, 'utf8');
    const json = JSON.parse(raw);
    if (!json.specs_tco) { skipped++; continue; }
    let changed = false;
    for (const k of CAMPOS) {
      if (k in json.specs_tco) {
        delete json.specs_tco[k];
        changed = true;
      }
    }
    if (changed) {
      touched++;
      if (!dry) {
        // Mantener indentación 2 espacios coherente con el resto del repo.
        writeFileSync(path, JSON.stringify(json, null, 2) + '\n');
      }
      console.log(`${dry ? '[dry]' : '✓'} ${path}`);
    }
  }
}

console.log('');
console.log(`Resumen: ${touched} archivos ${dry ? 'a tocar' : 'actualizados'} · ${skipped} sin specs_tco`);
