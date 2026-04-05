#!/usr/bin/env node
/**
 * Build: data/coches/*.json (rico) → src/data/comparador.json (plano)
 *
 * Lee todos los archivos individuales de data/coches/, los valida
 * mínimamente y genera el comparador.json plano que consume la web.
 *
 * Uso: node scripts/data-pipeline/build.mjs
 *
 * El archivo generado lleva un campo "version" con la fecha de build
 * y un contador de cuántos modelos tienen fuentes verificadas.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIELD_ORDER } from './fields.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const SRC_DIR = path.join(REPO_ROOT, 'data/coches');
const OUT_FLAT = path.join(REPO_ROOT, 'src/data/comparador.json');

// Mapeo slug → id numérico (para preservar el id original).
// Se regenera si no existe; se respeta si ya existe.
function loadIdMap() {
  if (!fs.existsSync(OUT_FLAT)) return new Map();
  const existing = JSON.parse(fs.readFileSync(OUT_FLAT, 'utf8'));
  const map = new Map();
  for (const m of existing.modelos || []) {
    if (m.slug && typeof m.id === 'number') map.set(m.slug, m.id);
  }
  return map;
}

function flattenRich(rich, idMap, nextIdRef) {
  // Reconstruye el objeto plano que consume la web.
  const slug = rich.slug;
  let id = idMap.get(slug);
  if (id == null) {
    id = nextIdRef.value++;
  }

  const flat = {
    id,
    slug,
    marca: rich.marca,
    modelo: rich.modelo,
    variante: rich.variante,
    nombre_completo: rich.nombre_completo,
    tipo: rich.segmento,
  };

  // Extraer cada spec como valor plano
  for (const [key, spec] of Object.entries(rich.specs || {})) {
    flat[key] = spec?.valor ?? null;
  }

  // Campo foto: derivar de imagen
  flat.foto = rich.imagen != null;

  return flat;
}

function orderFlat(flat) {
  // Identidad primero, luego foto, luego todos los campos del registro en orden
  const identityOrder = [
    'id', 'slug', 'marca', 'modelo', 'variante', 'nombre_completo', 'tipo', 'foto',
  ];
  const ordered = {};
  for (const k of identityOrder) if (k in flat) ordered[k] = flat[k];
  for (const k of FIELD_ORDER) if (k in flat) ordered[k] = flat[k];
  // Cualquier campo no previsto va al final
  for (const k of Object.keys(flat)) if (!(k in ordered)) ordered[k] = flat[k];
  return ordered;
}

function validate(rich, file) {
  const errors = [];
  if (!rich.slug) errors.push('falta slug');
  if (!rich.marca || !rich.modelo) errors.push('falta marca/modelo');
  if (!rich.specs || typeof rich.specs !== 'object') errors.push('falta specs');
  if (errors.length) {
    throw new Error(`${path.basename(file)}: ${errors.join(', ')}`);
  }
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

  const idMap = loadIdMap();
  const nextIdRef = { value: Math.max(0, ...idMap.values()) + 1 };

  const modelos = [];
  let verificados = 0, pendientes = 0;
  for (const file of files) {
    const fullPath = path.join(SRC_DIR, file);
    const rich = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    validate(rich, fullPath);
    const flat = orderFlat(flattenRich(rich, idMap, nextIdRef));
    modelos.push(flat);

    if (rich.meta?.estado === 'verificado') verificados++;
    else pendientes++;
  }

  // Ordenar por id ascendente
  modelos.sort((a, b) => a.id - b.id);

  const today = new Date().toISOString().slice(0, 10);
  const output = {
    version: `${today}-built`,
    total_modelos: modelos.length,
    stats: {
      verificados,
      pendientes,
    },
    modelos,
  };

  fs.writeFileSync(OUT_FLAT, JSON.stringify(output, null, 2) + '\n', 'utf8');

  console.log(`✓ Build completado`);
  console.log(`  ${modelos.length} modelos → src/data/comparador.json`);
  console.log(`  ${verificados} verificados · ${pendientes} pendientes`);
}

main();
