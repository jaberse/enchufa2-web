#!/usr/bin/env node
// scripts/data-pipeline/_audit_confianza_top20.mjs
//
// Auditoría del estado de confianza del Top 20 TCO:
//  - Qué modelos tienen depreciación basada en muestras reales vs Ganvam
//  - Número de cotizaciones de seguro por modelo
//  - Fuente y fecha del PVP, consumo, seguro, mantenimiento, depreciación
//  - Patrón de narrativa del break-even con curvaTCO
//
// Uso: node scripts/data-pipeline/_audit_confianza_top20.mjs

import fs from 'node:fs';
import path from 'node:path';
import { bevFromJson, iceFromJson } from '../../src/lib/tco/resolver.mjs';
import { curvaTCO } from '../../src/lib/tco/calculadora.mjs';

const ROOT = process.cwd();
const COCHES = path.join(ROOT, 'data/coches');
const ICES = path.join(ROOT, 'data/referencias/ice-equivalentes');

// Los 20 pares del calculadora-tco.astro (orden narrativo)
const PARES = [
  ['tesla-model-3-rwd-highland',      'bmw-320i-sedan'],
  ['tesla-model-y-rwd-long-range',    'bmw-x3-xdrive20i'],
  ['hyundai-kona-electric-65-kwh',    'volkswagen-tiguan-tsi'],
  ['skoda-elroq-60',                  'volkswagen-tiguan-tsi'],
  ['kia-ev3-long-range',              'volkswagen-tiguan-tsi'],
  ['bmw-ix1-xdrive30',                'bmw-x1-sdrive18i'],
  ['bmw-ix2-xdrive30',                'bmw-x1-sdrive18i'],
  ['mercedes-eqa-250+',               'volkswagen-tiguan-tsi'],
  ['toyota-bz4x-fwd',                 'volkswagen-tiguan-tsi'],
  ['byd-atto-3-comfort',              'volkswagen-tiguan-tsi'],
  ['byd-atto-2-comfort',              'peugeot-2008-puretech'],
  ['byd-seal-awd-excellence',         'bmw-320i-sedan'],
  ['byd-dolphin-60kwh',               'dacia-sandero-tce'],
  ['jeep-avenger-electric',           'peugeot-2008-puretech'],
  ['peugeot-e-2008-allure',           'peugeot-2008-puretech'],
  ['renault-5-e-tech-comfort-range',  'dacia-sandero-tce'],
  ['citroen-e-c3-you',                'citroen-c3-puretech-100'],
  ['dacia-spring-essential',          'hyundai-i10-mpi'],
  ['byd-dolphin-surf-comfort',        'hyundai-i10-mpi'],
  ['hyundai-inster-long-range',       'hyundai-i10-mpi'],
];

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const get = (obj, ...path) => path.reduce((o, k) => (o == null ? o : o[k]), obj);

function describeFuente(campo) {
  if (!campo) return '—';
  const tipo = campo.fuente_tipo ?? '?';
  const fecha = campo.fuente_fecha ?? '?';
  const det = campo.fuente_detalle ?? '';
  return `${tipo} (${fecha})${det ? ' — ' + det.slice(0, 60) : ''}`;
}

function describePatron(curva) {
  if (curva.rentable_desde_inicio && curva.rentable_al_final && curva.perdida_rentabilidad_anio == null) {
    return 'SIEMPRE RENTABLE';
  }
  if (curva.rentable_desde_inicio && curva.perdida_rentabilidad_anio != null) {
    return `RENTABLE HASTA ${curva.perdida_rentabilidad_anio.toFixed(1)}y`;
  }
  if (!curva.rentable_desde_inicio && curva.breakeven_anio != null && curva.breakeven_anio > 0 && curva.rentable_al_final) {
    return `BREAK-EVEN ${curva.breakeven_anio.toFixed(1)}y`;
  }
  return 'NUNCA RENTABLE';
}

console.log('\n══════════════════════════════════════════════════════════════════════════════');
console.log(' AUDITORÍA DE CONFIANZA — TOP 20 CALCULADORA TCO');
console.log('══════════════════════════════════════════════════════════════════════════════\n');

const filas = [];
let n_dep_muestras = 0;
let n_seg_3cot = 0;
let patronConteo = { 'SIEMPRE RENTABLE': 0, 'RENTABLE HASTA': 0, 'BREAK-EVEN': 0, 'NUNCA RENTABLE': 0 };

for (const [bevSlug, iceSlug] of PARES) {
  const bevJson = read(path.join(COCHES, `${bevSlug}.json`));
  const iceJson = read(path.join(ICES, `${iceSlug}.json`));

  const confGen = get(bevJson, 'meta', 'tco_confianza_general') ?? '—';
  const fuenteDep = get(bevJson, 'specs_tco', 'depreciacion_y5_pct');
  const fuenteSeg = get(bevJson, 'specs_tco', 'seguro_anual_eur');
  const ayudaEl = get(bevJson, 'specs', 'ayuda_plan_auto_eur', 'valor') ?? 0;

  const tipoFuenteDep = get(fuenteDep, 'fuente_tipo') ?? '?';
  const detalleSeg = get(fuenteSeg, 'fuente_detalle') ?? '';
  const tipoFuenteSeg = get(fuenteSeg, 'fuente_tipo') ?? '?';

  // Detectar si la depreciación viene de muestras reales o es Ganvam/estimación
  const esMuestras = /muestras|coches\.net|cochesnet|market/i.test(tipoFuenteDep) ||
    /muestras|coches\.net|sondeo/i.test(String(detalleSeg));
  if (esMuestras) n_dep_muestras++;

  // Detectar si hay 3 cotizaciones de seguro
  const n3cot = /3 cotizaciones|tres cotizaciones|mapfre|rastreator|mutua/i.test(String(detalleSeg));
  if (n3cot) n_seg_3cot++;

  // Calcular patrón con ayuda y sin ayuda a 5 años
  const bev = bevFromJson(bevJson, { horizonte_anios: 5, aplicar_ayuda: true });
  const ice = iceFromJson(iceJson, { horizonte_anios: 5 });
  const curva = curvaTCO(bev, ice, {}, { horizonte_max: 5, granularidad_anios: 0.25 });
  const patron = describePatron(curva);
  // Contabilizar grupo
  if (patron.startsWith('SIEMPRE')) patronConteo['SIEMPRE RENTABLE']++;
  else if (patron.startsWith('RENTABLE HASTA')) patronConteo['RENTABLE HASTA']++;
  else if (patron.startsWith('BREAK-EVEN')) patronConteo['BREAK-EVEN']++;
  else patronConteo['NUNCA RENTABLE']++;

  filas.push({
    modelo: `${bevJson.marca} ${bevJson.modelo}${bevJson.variante ? ' ' + bevJson.variante : ''}`,
    slug: bevSlug,
    conf: confGen,
    ayuda: ayudaEl ?? 0,
    dep: tipoFuenteDep,
    seg: tipoFuenteSeg,
    patron,
  });
}

// Imprimir tabla
const col = (s, n) => String(s).padEnd(n).slice(0, n);
console.log(col('MODELO', 36), col('CONF', 7), col('AYUDA', 7), col('DEPREC FUENTE', 20), col('SEG FUENTE', 18), 'PATRÓN');
console.log('─'.repeat(115));
for (const f of filas) {
  console.log(
    col(f.modelo, 36),
    col(f.conf, 7),
    col(f.ayuda ? f.ayuda + ' €' : '—', 7),
    col(f.dep, 20),
    col(f.seg, 18),
    f.patron,
  );
}

console.log('\n──────────────────────────────────────────────────────────────────────────────');
console.log(` Depreciación con muestras reales (coches.net/market): ${n_dep_muestras}/20`);
console.log(` Seguro con 3 cotizaciones reales (Mapfre/Rastreator/Mutua): ${n_seg_3cot}/20`);
console.log('──────────────────────────────────────────────────────────────────────────────');
console.log('\n Distribución de narrativa a 5 años con Plan Auto+ activado:');
for (const [k, v] of Object.entries(patronConteo)) {
  console.log(`   ${col(k, 24)} ${v} modelo(s)`);
}
console.log('');
