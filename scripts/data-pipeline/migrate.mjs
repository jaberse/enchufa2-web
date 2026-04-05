#!/usr/bin/env node
/**
 * Migración: src/data/comparador.json (plano) → data/coches/*.json (rico)
 *
 * Por cada modelo del comparador.json actual, crea un archivo individual
 * con la estructura del schema (valor + metadatos de fuente). Todas las
 * fuentes se marcan como "pendiente" para rellenar manualmente después.
 *
 * Uso: node scripts/data-pipeline/migrate.mjs
 *
 * IMPORTANTE: NO sobrescribe archivos que ya existen en data/coches/.
 * Si ya editaste un archivo manualmente con fuentes reales, se respeta.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const SRC_FLAT = path.join(REPO_ROOT, 'src/data/comparador.json');
const OUT_DIR = path.join(REPO_ROOT, 'data/coches');

// Mapeo de cada campo plano a su grupo + unidad
// Esto define el "contrato" de la biblia.
const FIELD_MAP = {
  // --- Batería y carga ---
  bateria_neta_kwh:      { group: 'bateria_carga', unit: 'kWh' },
  bateria_bruta_kwh:     { group: 'bateria_carga', unit: 'kWh' },
  quimica:               { group: 'bateria_carga', unit: null, isText: true },
  voltaje:               { group: 'bateria_carga', unit: 'V' },
  carga_dc_max_kw:       { group: 'bateria_carga', unit: 'kW' },
  carga_ac_max_kw:       { group: 'bateria_carga', unit: 'kW' },
  t_10_80_min:           { group: 'bateria_carga', unit: 'min' },
  conector_dc:           { group: 'bateria_carga', unit: null, isText: true },
  bomba_calor:           { group: 'bateria_carga', unit: null, isText: true },

  // --- Prestaciones ---
  potencia_cv:           { group: 'prestaciones', unit: 'CV' },
  potencia_kw:           { group: 'prestaciones', unit: 'kW' },
  par_nm:                { group: 'prestaciones', unit: 'Nm' },
  traccion:              { group: 'prestaciones', unit: null, isText: true },
  n_motores:             { group: 'prestaciones', unit: null },
  aceleracion_0_100_s:   { group: 'prestaciones', unit: 's' },
  velocidad_max_kmh:     { group: 'prestaciones', unit: 'km/h' },
  autonomia_wltp_km:     { group: 'prestaciones', unit: 'km' },
  consumo_wltp_kwh100km: { group: 'prestaciones', unit: 'kWh/100km' },

  // --- Dimensiones ---
  largo_mm:              { group: 'dimensiones', unit: 'mm' },
  ancho_mm:              { group: 'dimensiones', unit: 'mm' },
  alto_mm:               { group: 'dimensiones', unit: 'mm' },
  batalla_mm:            { group: 'dimensiones', unit: 'mm' },
  diametro_giro_m:       { group: 'dimensiones', unit: 'm' },
  cx:                    { group: 'dimensiones', unit: null },
  maletero_l:            { group: 'dimensiones', unit: 'L' },
  frunk_l:               { group: 'dimensiones', unit: 'L' },
  capacidad_remolque_kg: { group: 'dimensiones', unit: 'kg' },
  peso_kg:               { group: 'dimensiones', unit: 'kg' },

  // --- Economía ---
  pvp:                   { group: 'economia', unit: '€' },
  pvp_fecha:             { group: 'economia', unit: null, isText: true },
  garantia_bateria:      { group: 'economia', unit: null, isText: true },
  plan_auto_elegible:    { group: 'economia', unit: null, isText: true },
};

// Campos top-level que NO son specs (identidad del coche)
const TOP_LEVEL_FIELDS = new Set([
  'id', 'slug', 'marca', 'modelo', 'variante', 'nombre_completo', 'tipo', 'foto'
]);

function mapToRich(modelo) {
  const rich = {
    id: modelo.slug, // usamos el slug como id canónico (stringy)
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

  // Mapear cada spec
  for (const [key, cfg] of Object.entries(FIELD_MAP)) {
    if (!(key in modelo)) continue;
    const valor = modelo[key];
    const spec = {
      valor,
      fuente_tipo: 'pendiente',
      verificado: false,
    };
    if (cfg.unit) spec.unidad = cfg.unit;
    rich.specs[key] = spec;
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
