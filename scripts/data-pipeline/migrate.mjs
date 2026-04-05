#!/usr/bin/env node
/**
 * Migración: src/data/comparador.json (plano) → data/coches/*.json (rico)
 *
 * Por cada modelo del comparador.json, crea un archivo individual con la
 * estructura completa del schema (todos los campos de FIELD_REGISTRY).
 * Campos no presentes en el origen se inicializan con valor=null.
 *
 * Uso: node scripts/data-pipeline/migrate.mjs
 *
 * IMPORTANTE: NO sobrescribe archivos que ya existen en data/coches/.
 * Para añadir campos nuevos a archivos existentes, usa upgrade.mjs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIELD_REGISTRY, emptySpec } from './fields.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const SRC_FLAT = path.join(REPO_ROOT, 'src/data/comparador.json');
const OUT_DIR = path.join(REPO_ROOT, 'data/coches');

function mapToRich(modelo) {
  const rich = {
    id: modelo.slug,
    slug: modelo.slug,
    marca: modelo.marca,
    modelo: modelo.modelo,
    variante: modelo.variante,
    nombre_completo: modelo.nombre_completo,
    segmento: modelo.tipo || null,
    imagen: modelo.foto === true ? `/comparador/${modelo.slug}.webp` : null,
    specs: {},
    meta: {
      fecha_actualizacion: null,
      estado: 'pendiente',
      notas_my: null,
    },
  };

  // Emitir todos los campos del registro, con valor del origen si existe
  for (const fieldKey of Object.keys(FIELD_REGISTRY)) {
    const valor = fieldKey in modelo ? modelo[fieldKey] : null;
    rich.specs[fieldKey] = emptySpec(fieldKey, valor);
  }

  return rich;
}

function main() {
  const flat = JSON.parse(fs.readFileSync(SRC_FLAT, 'utf8'));
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  let written = 0, skipped = 0;
  for (const modelo of flat.modelos) {
    const slug = modelo.slug;
    if (!slug) {
      console.warn(`⚠  Modelo sin slug: ${modelo.marca} ${modelo.modelo} — saltado`);
      continue;
    }
    const outFile = path.join(OUT_DIR, `${slug}.json`);
    if (fs.existsSync(outFile)) {
      skipped++;
      continue;
    }
    const rich = mapToRich(modelo);
    fs.writeFileSync(outFile, JSON.stringify(rich, null, 2) + '\n', 'utf8');
    written++;
  }

  console.log(`✓ Migración completada`);
  console.log(`  ${written} archivos escritos en data/coches/`);
  console.log(`  ${skipped} archivos ya existían y se respetaron`);
  console.log(`  Total en origen: ${flat.modelos.length} modelos`);
}

main();
