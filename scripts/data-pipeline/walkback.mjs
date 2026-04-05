#!/usr/bin/env node
/**
 * Walk-back: revierte verificado:true → verificado:false cuando falta fuente_url.
 *
 * Excepciones (verificado:true defendible sin URL):
 *   - carroceria: clasificación propia de enchufa2
 *   - estado_comercial: clasificación propia de enchufa2
 *
 * Motivación: en abril 2026 cambiamos la política de verificación. Toda
 * marca verificado:true ahora exige fuente_url (excepto las 2 de arriba).
 * Este script limpia el estado heredado del rellenado previo.
 *
 * Uso: node scripts/data-pipeline/walkback.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const SRC_DIR = path.join(REPO_ROOT, 'data/coches');

const EXCEPCIONES = new Set(['carroceria', 'estado_comercial']);

function walkbackFile(filePath) {
  const rich = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const specs = rich.specs || {};
  let reverted = 0;

  for (const [key, spec] of Object.entries(specs)) {
    if (spec && spec.verificado === true && !spec.fuente_url) {
      if (EXCEPCIONES.has(key)) continue;
      spec.verificado = false;
      reverted++;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(rich, null, 2) + '\n', 'utf8');
  return reverted;
}

function main() {
  const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.json')).sort();
  let total = 0;
  let touched = 0;

  for (const file of files) {
    const reverted = walkbackFile(path.join(SRC_DIR, file));
    if (reverted > 0) touched++;
    total += reverted;
  }

  console.log(`✓ Walk-back completado`);
  console.log(`  ${files.length} archivos procesados`);
  console.log(`  ${touched} archivos modificados`);
  console.log(`  ${total} datos revertidos a verificado:false`);
  console.log(`  (exc: ${Array.from(EXCEPCIONES).join(', ')})`);
}

main();
