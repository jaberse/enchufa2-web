#!/usr/bin/env node
/**
 * set-field.mjs — rellena un campo en varios archivos de coche a la vez.
 *
 * Uso:
 *   node scripts/data-pipeline/set-field.mjs <campo> <archivo-mapa.json>
 *
 * El archivo-mapa.json tiene esta forma:
 * {
 *   "fuente_tipo": "fabricante",   // opcional, default "fabricante"
 *   "fuente_fecha": "2026-04-05",  // opcional, default hoy
 *   "verificado": true,            // opcional, default true
 *   "valores": {
 *     "tesla-model-y-rwd-long-range": {
 *       "valor": 79,
 *       "fuente_url": "https://www.tesla.com/es_ES/modely/design"
 *     },
 *     "mg4-51-kwh-standard": {
 *       "valor": 50.8,
 *       "fuente_url": "https://..."
 *     }
 *   }
 * }
 *
 * Cualquier slug que no aparezca en "valores" se deja intacto.
 * Cualquier campo cuya entrada tenga `skip: true` se deja intacto.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIELD_REGISTRY } from './fields.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const COCHES_DIR = path.join(REPO_ROOT, 'data/coches');

function today() {
  return new Date().toISOString().slice(0, 10);
}

function main() {
  const [fieldKey, mapPath] = process.argv.slice(2);
  if (!fieldKey || !mapPath) {
    console.error('Uso: node scripts/data-pipeline/set-field.mjs <campo> <archivo-mapa.json>');
    process.exit(1);
  }
  const cfg = FIELD_REGISTRY[fieldKey];
  if (!cfg) {
    console.error(`✗ Campo desconocido: ${fieldKey}`);
    console.error(`  Campos válidos: ver scripts/data-pipeline/fields.mjs`);
    process.exit(1);
  }

  const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  const defaults = {
    fuente_tipo: map.fuente_tipo || 'fabricante',
    fuente_fecha: map.fuente_fecha || today(),
    verificado: map.verificado !== false,
  };
  const valores = map.valores || {};

  let updated = 0, skipped = 0, notFound = 0;
  for (const [slug, entry] of Object.entries(valores)) {
    if (entry.skip === true) { skipped++; continue; }

    const file = path.join(COCHES_DIR, `${slug}.json`);
    if (!fs.existsSync(file)) {
      console.warn(`⚠  No existe: ${slug}.json`);
      notFound++;
      continue;
    }

    const rich = JSON.parse(fs.readFileSync(file, 'utf8'));
    const spec = {
      valor: entry.valor,
      fuente_tipo: entry.fuente_tipo || defaults.fuente_tipo,
      fuente_fecha: entry.fuente_fecha || defaults.fuente_fecha,
      verificado: entry.verificado !== undefined ? entry.verificado : defaults.verificado,
    };
    if (cfg.unit) spec.unidad = cfg.unit;
    if (entry.fuente_url)    spec.fuente_url = entry.fuente_url;
    if (entry.fuente_nombre) spec.fuente_nombre = entry.fuente_nombre;
    if (entry.disclaimer)    spec.disclaimer = entry.disclaimer;
    if (entry.nota)          spec.nota = entry.nota;

    rich.specs[fieldKey] = spec;
    rich.meta = rich.meta || {};
    rich.meta.fecha_actualizacion = today();

    fs.writeFileSync(file, JSON.stringify(rich, null, 2) + '\n', 'utf8');
    updated++;
  }

  console.log(`✓ Campo "${fieldKey}" actualizado`);
  console.log(`  ${updated} coches actualizados`);
  if (skipped  > 0) console.log(`  ${skipped} saltados (skip:true)`);
  if (notFound > 0) console.log(`  ${notFound} slugs no encontrados`);
}

main();
