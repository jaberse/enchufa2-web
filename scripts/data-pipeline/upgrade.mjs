#!/usr/bin/env node
/**
 * Upgrade: añade campos nuevos del registro a archivos existentes en data/coches/.
 *
 * Lee el FIELD_REGISTRY y, para cada archivo en data/coches/, verifica que
 * todos los campos del registro existan. Si falta alguno, lo añade como
 * spec vacío (valor=null, fuente_tipo="pendiente").
 *
 * No modifica campos existentes. No elimina campos que ya no están en el
 * registro (los deja pero avisa).
 *
 * También reordena las specs según el orden canónico del registro, para
 * que los diffs de git sean legibles.
 *
 * Uso: node scripts/data-pipeline/upgrade.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIELD_REGISTRY, FIELD_ORDER, emptySpec } from './fields.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const SRC_DIR = path.join(REPO_ROOT, 'data/coches');

function upgradeFile(filePath) {
  const rich = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const existing = rich.specs || {};
  const newSpecs = {};
  let added = 0;

  // Recorrer el registro en orden canónico
  for (const key of FIELD_ORDER) {
    if (key in existing) {
      newSpecs[key] = existing[key];
    } else {
      newSpecs[key] = emptySpec(key, null);
      added++;
    }
  }

  // Preservar campos "huérfanos" (no en registro pero en archivo)
  const orphans = [];
  for (const key of Object.keys(existing)) {
    if (!(key in FIELD_REGISTRY)) {
      newSpecs[key] = existing[key];
      orphans.push(key);
    }
  }

  rich.specs = newSpecs;
  fs.writeFileSync(filePath, JSON.stringify(rich, null, 2) + '\n', 'utf8');
  return { added, orphans };
}

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error('✗ No existe data/coches/. Ejecuta antes: npm run data:migrate');
    process.exit(1);
  }

  const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.json')).sort();
  if (files.length === 0) {
    console.error('✗ data/coches/ está vacío.');
    process.exit(1);
  }

  let totalAdded = 0;
  const orphanSet = new Set();
  let touched = 0;

  for (const file of files) {
    const fullPath = path.join(SRC_DIR, file);
    const { added, orphans } = upgradeFile(fullPath);
    if (added > 0) touched++;
    totalAdded += added;
    orphans.forEach(o => orphanSet.add(o));
  }

  console.log(`✓ Upgrade completado`);
  console.log(`  ${files.length} archivos procesados`);
  console.log(`  ${touched} archivos modificados`);
  console.log(`  ${totalAdded} campos nuevos añadidos en total`);
  console.log(`  ${Object.keys(FIELD_REGISTRY).length} campos en el registro`);
  if (orphanSet.size > 0) {
    console.log(`\n⚠  Campos en archivos pero no en registro (preservados):`);
    for (const o of orphanSet) console.log(`    - ${o}`);
  }
}

main();
