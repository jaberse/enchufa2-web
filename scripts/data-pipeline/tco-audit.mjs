#!/usr/bin/env node
/**
 * tco-audit.mjs — auditor del bloque specs_tco y sus equivalentes ICE.
 *
 * Valida que cada modelo del catálogo TCO tenga:
 *   - specs_tco con los campos obligatorios
 *   - cada campo con valor, fuente_tipo, fuente_fecha, verificado y confianza
 *   - equivalente_ice definido y resuelto (intra_marca o benchmark_segmento)
 *   - valores dentro de rangos razonables
 *
 * Uso:
 *   node scripts/data-pipeline/tco-audit.mjs                  # resumen
 *   node scripts/data-pipeline/tco-audit.mjs --coche slug     # detalle un coche
 *   node scripts/data-pipeline/tco-audit.mjs --solo-top20     # solo los 20 top
 *   node scripts/data-pipeline/tco-audit.mjs --ready          # solo modelos listos
 *   node scripts/data-pipeline/tco-audit.mjs --activables     # candidatos a activar en calculador
 *
 * Exit codes:
 *   0 — no errores bloqueantes
 *   1 — hay errores bloqueantes (campos faltantes, equivalente_ice no resuelve, valores fuera de rango)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const COCHES_DIR = path.join(REPO_ROOT, 'data/coches');
const ICE_DIR = path.join(REPO_ROOT, 'data/referencias/termicos-equivalentes');
const BENCHMARKS_FILE = path.join(REPO_ROOT, 'data/referencias/benchmarks_ice.json');

// ─── Configuración de validación ─────────────────────────────

// Los 20 modelos top v1 (del SKILL.md)
const TOP_20 = [
  'tesla-model-3-rwd-highland',
  'tesla-model-y-rwd-long-range',
  'kia-ev3-long-range',
  'byd-dolphin-surf-comfort',
  'renault-5-e-tech-comfort-range',
  'citroen-e-c3-you',
  'byd-atto-2-comfort',
  'toyota-bz4x-fwd',
  'byd-atto-3-comfort',
  'byd-seal-awd-excellence',
  'hyundai-inster-long-range',
  'dacia-spring-essential',
  'bmw-ix1-xdrive30',
  'mercedes-eqa-250+',
  'jeep-avenger-electric',
  'skoda-elroq-60',
  'hyundai-kona-electric-65-kwh',
  'byd-dolphin-60kwh',
  'peugeot-e-2008-allure',
  'bmw-ix2-xdrive30',
];

// Campos obligatorios en specs_tco para que un EV sea activable.
// v2.1 (2026-04-22): consumo_real_factor retirado — WLTP puro tal cual
// (ver docs/metodologia-tco.md §2.4).
const CAMPOS_OBLIGATORIOS_EV = [
  'depreciacion_y3_pct',
  'depreciacion_y5_pct',
  'mantenimiento_anual_eur',
  'seguro_anual_eur',
  'equivalente_ice',
];

// Campos obligatorios en specs_tco para un ICE equivalente
const CAMPOS_OBLIGATORIOS_ICE = [
  'depreciacion_y3_pct',
  'depreciacion_y5_pct',
  'mantenimiento_anual_eur',
  'seguro_anual_eur',
];

// Metadata que deben tener los campos numéricos con valor
const META_OBLIGATORIA = ['fuente_tipo', 'verificado', 'confianza'];

// Rangos razonables (min, max) para detectar valores sospechosos
const RANGOS_RAZONABLES = {
  depreciacion_y3_pct: [0.10, 0.65],        // 10-65% pérdida a 3 años
  depreciacion_y5_pct: [0.20, 0.80],        // 20-80% pérdida a 5 años
  depreciacion_y10_pct: [0.45, 0.92],       // 45-92% pérdida a 10 años
  mantenimiento_anual_eur: [50, 2500],      // 50€ ë-C3 ... 2500€ Tesla Plaid
  seguro_anual_eur: [200, 2500],            // perfil estándar
};

const CONFIANZAS_VALIDAS = ['alta', 'media', 'baja'];

// ─── Carga de datos ──────────────────────────────────────────

function loadCoches() {
  if (!fs.existsSync(COCHES_DIR)) return [];
  return fs.readdirSync(COCHES_DIR)
    .filter(f => f.endsWith('.json'))
    .sort()
    .map(f => ({
      slug: f.replace(/\.json$/, ''),
      archivo: path.join(COCHES_DIR, f),
      data: JSON.parse(fs.readFileSync(path.join(COCHES_DIR, f), 'utf8')),
    }));
}

function loadIceEquivalentes() {
  if (!fs.existsSync(ICE_DIR)) return [];
  return fs.readdirSync(ICE_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => ({
      slug: f.replace(/\.json$/, ''),
      archivo: path.join(ICE_DIR, f),
      data: JSON.parse(fs.readFileSync(path.join(ICE_DIR, f), 'utf8')),
    }));
}

function loadBenchmarks() {
  if (!fs.existsSync(BENCHMARKS_FILE)) return null;
  const raw = JSON.parse(fs.readFileSync(BENCHMARKS_FILE, 'utf8'));
  // El archivo envuelve segmentos bajo la clave `segmentos`
  return raw.segmentos || raw;
}

// ─── Validación de un campo individual ───────────────────────

function validarCampo(campoKey, spec) {
  const errores = [];
  const avisos = [];

  if (!spec) {
    errores.push(`campo "${campoKey}" ausente`);
    return { errores, avisos };
  }

  // equivalente_ice tiene estructura distinta
  if (campoKey === 'equivalente_ice') {
    if (!spec.tipo) errores.push(`equivalente_ice: falta tipo (intra_marca|benchmark_segmento)`);
    else if (!['intra_marca', 'benchmark_segmento'].includes(spec.tipo)) {
      errores.push(`equivalente_ice.tipo inválido: "${spec.tipo}"`);
    }
    if (spec.tipo === 'intra_marca' && !spec.modelo_id) {
      errores.push(`equivalente_ice intra_marca sin modelo_id`);
    }
    if (spec.tipo === 'benchmark_segmento' && !spec.segmento && !spec.modelo_id) {
      errores.push(`equivalente_ice benchmark_segmento sin segmento ni modelo_id`);
    }
    return { errores, avisos };
  }

  // Campos numéricos estándar
  if (spec.valor === null || spec.valor === undefined) {
    errores.push(`${campoKey}: sin valor`);
    return { errores, avisos };
  }

  // Metadata obligatoria
  for (const meta of META_OBLIGATORIA) {
    if (spec[meta] === undefined || spec[meta] === null) {
      errores.push(`${campoKey}: falta "${meta}"`);
    }
  }

  // Confianza válida
  if (spec.confianza && !CONFIANZAS_VALIDAS.includes(spec.confianza)) {
    errores.push(`${campoKey}: confianza inválida "${spec.confianza}"`);
  }

  // Rango razonable
  const rango = RANGOS_RAZONABLES[campoKey];
  if (rango && typeof spec.valor === 'number') {
    const [min, max] = rango;
    if (spec.valor < min || spec.valor > max) {
      errores.push(`${campoKey}: valor ${spec.valor} fuera de rango razonable [${min}-${max}]`);
    }
  }

  // Aviso: confianza baja
  if (spec.confianza === 'baja') {
    avisos.push(`${campoKey}: confianza baja`);
  }

  return { errores, avisos };
}

// ─── Validación coherencia depreciación ──────────────────────

function validarCoherenciaDepreciacion(tco) {
  const errores = [];
  const y3 = tco.depreciacion_y3_pct?.valor;
  const y5 = tco.depreciacion_y5_pct?.valor;
  const y10 = tco.depreciacion_y10_pct?.valor;

  if (typeof y3 === 'number' && typeof y5 === 'number' && y5 < y3) {
    errores.push(`depreciacion_y5 (${(y5 * 100).toFixed(0)}%) < y3 (${(y3 * 100).toFixed(0)}%) — un coche no deja de depreciarse`);
  }
  if (typeof y5 === 'number' && typeof y10 === 'number' && y10 < y5) {
    errores.push(`depreciacion_y10 (${(y10 * 100).toFixed(0)}%) < y5 (${(y5 * 100).toFixed(0)}%)`);
  }
  return errores;
}

// ─── Resolución de equivalente_ice ───────────────────────────

function resolverEquivalenteICE(eq, iceIndex, benchmarks) {
  if (!eq) return { ok: false, msg: 'sin equivalente_ice' };

  if (eq.tipo === 'intra_marca') {
    if (!eq.modelo_id) return { ok: false, msg: 'intra_marca sin modelo_id' };
    const target = iceIndex.find(i => i.slug === eq.modelo_id);
    if (!target) return { ok: false, msg: `ICE "${eq.modelo_id}" no existe en data/referencias/termicos-equivalentes/` };
    return { ok: true, target };
  }

  if (eq.tipo === 'benchmark_segmento') {
    if (!benchmarks) return { ok: false, msg: 'data/referencias/benchmarks_ice.json no existe' };
    const seg = eq.segmento;
    if (!seg && !eq.modelo_id) return { ok: false, msg: 'benchmark_segmento sin segmento ni modelo_id' };
    if (seg && !benchmarks[seg]) return { ok: false, msg: `segmento "${seg}" no existe en benchmarks_ice.json` };

    // Resolver a ICE real: si eq.modelo_id, usar ese; si no, el default del segmento
    const benchmark = benchmarks[seg];
    const opciones = benchmark?.opciones || [];
    let iceSlug = eq.modelo_id;
    if (!iceSlug) {
      const def = opciones.find(o => o.default) || opciones[0];
      if (!def) return { ok: false, msg: `segmento "${seg}" sin opciones de benchmark` };
      iceSlug = def.id;
    }
    const target = iceIndex.find(i => i.slug === iceSlug);
    if (!target) {
      return {
        ok: false,
        msg: `benchmark "${iceSlug}" del segmento "${seg}" no existe en data/referencias/termicos-equivalentes/`,
      };
    }
    return { ok: true, target, benchmark, via: `segmento ${seg} → ${iceSlug}` };
  }

  return { ok: false, msg: `tipo desconocido "${eq.tipo}"` };
}

// ─── Validación de un modelo completo ────────────────────────

function validarModelo(coche, iceIndex, benchmarks, tipo = 'EV') {
  const errores = [];
  const avisos = [];
  const tco = coche.data.specs_tco;

  if (!tco) {
    errores.push('no tiene bloque specs_tco');
    return { errores, avisos, ready: false, activable: false };
  }

  const obligatorios = tipo === 'EV' ? CAMPOS_OBLIGATORIOS_EV : CAMPOS_OBLIGATORIOS_ICE;

  // Validar cada campo obligatorio
  for (const key of obligatorios) {
    const r = validarCampo(key, tco[key]);
    errores.push(...r.errores);
    avisos.push(...r.avisos);
  }

  // Coherencia temporal de depreciación
  errores.push(...validarCoherenciaDepreciacion(tco));

  // Resolución del equivalente_ice (solo EV)
  if (tipo === 'EV' && tco.equivalente_ice) {
    const r = resolverEquivalenteICE(tco.equivalente_ice, iceIndex, benchmarks);
    if (!r.ok) errores.push(`equivalente_ice no resuelve: ${r.msg}`);
    else if (r.target) {
      // Validar también el ICE destino
      const iceVal = validarModelo(r.target, iceIndex, benchmarks, 'ICE');
      if (iceVal.errores.length > 0) {
        errores.push(`ICE "${r.target.slug}" tiene ${iceVal.errores.length} errores propios`);
      }
    }
  }

  const ready = errores.length === 0;
  const sinConfianzaBaja = !avisos.some(a => a.includes('confianza baja'));
  const activable = ready && sinConfianzaBaja && coche.data.meta?.tco_activo_en_calculadora !== false;

  return { errores, avisos, ready, activable };
}

// ─── Salida ──────────────────────────────────────────────────

function icon(ok, warn = false) {
  if (!ok) return '✗';
  if (warn) return '⚠';
  return '✓';
}

function resumen({ soloTop20 = false, soloReady = false, soloActivables = false } = {}) {
  const coches = loadCoches();
  const iceIndex = loadIceEquivalentes();
  const benchmarks = loadBenchmarks();

  console.log(`\n=== Auditoría TCO enchufa2 · ${new Date().toISOString().slice(0, 10)} ===\n`);
  console.log(`  Catálogo EV:      ${coches.length} modelos en data/coches/`);
  console.log(`  ICEs 1:1:         ${iceIndex.length} en data/referencias/termicos-equivalentes/`);
  console.log(`  Benchmarks seg.:  ${benchmarks ? Object.keys(benchmarks).length : 0} segmentos`);
  console.log('');

  let stats = {
    total: 0,
    scaffolded: 0,
    poblados: 0,
    ready: 0,
    activables: 0,
    errores_totales: 0,
    avisos_totales: 0,
  };

  const filas = [];

  for (const c of coches) {
    const enTop20 = TOP_20.includes(c.slug);
    if (soloTop20 && !enTop20) continue;

    const tieneScaffold = c.data.meta?.tco_scaffolded === true;
    const tienePoblado = c.data.meta?.tco_poblado === true;

    if (!tieneScaffold && !tienePoblado) {
      if (!soloReady && !soloActivables) {
        filas.push({ icono: '·', slug: c.slug, top: enTop20, msg: 'sin scaffold TCO' });
      }
      stats.total++;
      continue;
    }

    const val = validarModelo(c, iceIndex, benchmarks, 'EV');
    stats.total++;
    if (tieneScaffold) stats.scaffolded++;
    if (tienePoblado) stats.poblados++;
    if (val.ready) stats.ready++;
    if (val.activable) stats.activables++;
    stats.errores_totales += val.errores.length;
    stats.avisos_totales += val.avisos.length;

    if (soloReady && !val.ready) continue;
    if (soloActivables && !val.activable) continue;

    const hasWarn = val.avisos.length > 0;
    filas.push({
      icono: icon(val.ready, hasWarn),
      slug: c.slug,
      top: enTop20,
      errores: val.errores,
      avisos: val.avisos,
      ready: val.ready,
      activable: val.activable,
    });
  }

  // Mostrar filas
  for (const f of filas) {
    const topBadge = f.top ? ' ⭐' : '   ';
    console.log(`  ${f.icono}${topBadge} ${f.slug}`);
    if (f.msg) console.log(`         ${f.msg}`);
    if (f.errores?.length) {
      f.errores.forEach(e => console.log(`         ✗ ${e}`));
    }
    if (f.avisos?.length) {
      f.avisos.forEach(a => console.log(`         ⚠ ${a}`));
    }
  }

  // Resumen
  console.log('\n─── Resumen ───\n');
  console.log(`  Total modelos:    ${stats.total}`);
  console.log(`  Con scaffold:     ${stats.scaffolded}`);
  console.log(`  Poblados:         ${stats.poblados}`);
  console.log(`  Ready (0 err):    ${stats.ready}`);
  console.log(`  Activables*:      ${stats.activables}`);
  console.log(`  Errores totales:  ${stats.errores_totales}`);
  console.log(`  Avisos totales:   ${stats.avisos_totales}`);
  console.log('');
  console.log('  * Activable = ready + sin confianza baja + tco_activo_en_calculadora ≠ false');
  console.log('');

  // Top 20 progress bar
  if (!soloTop20) {
    const top20Ready = coches
      .filter(c => TOP_20.includes(c.slug))
      .filter(c => validarModelo(c, iceIndex, benchmarks, 'EV').ready).length;
    const barLen = 20;
    const filled = Math.round((top20Ready / 20) * barLen);
    const bar = '█'.repeat(filled) + '·'.repeat(barLen - filled);
    console.log(`  Top 20 v1:        [${bar}] ${top20Ready}/20`);
    console.log('');
  }

  // Exit code
  return stats.errores_totales === 0 ? 0 : 1;
}

function detalleCoche(slug) {
  const coches = loadCoches();
  const iceIndex = loadIceEquivalentes();
  const benchmarks = loadBenchmarks();

  const coche = coches.find(c => c.slug === slug);
  if (!coche) {
    console.error(`✗ No existe: ${slug}`);
    process.exit(1);
  }

  const val = validarModelo(coche, iceIndex, benchmarks, 'EV');
  const tco = coche.data.specs_tco || {};

  console.log(`\n=== ${coche.data.marca} ${coche.data.modelo} ${coche.data.variante || ''} — TCO ===\n`);
  console.log(`  Estado: ${val.ready ? 'READY ✓' : 'INCOMPLETO ✗'} · ${val.activable ? 'Activable ✓' : 'No activable ⚠'}\n`);

  for (const key of CAMPOS_OBLIGATORIOS_EV) {
    const spec = tco[key];
    if (!spec) {
      console.log(`  ✗ ${key}: AUSENTE`);
      continue;
    }

    if (key === 'equivalente_ice') {
      const r = resolverEquivalenteICE(spec, iceIndex, benchmarks);
      const ref = spec.modelo_id || spec.segmento || '';
      const via = r.ok && r.via ? `(${r.via})` : '';
      console.log(`  ${r.ok ? '✓' : '✗'} ${key}: tipo=${spec.tipo} ${ref} ${via} ${r.ok ? '' : '→ ' + r.msg}`);
      continue;
    }

    const v = spec.valor === null || spec.valor === undefined ? '—' : spec.valor;
    const unidad = spec.unidad || '';
    const conf = spec.confianza || '?';
    const verif = spec.verificado ? '✓' : '·';
    console.log(`  ${verif} ${key.padEnd(28)} ${String(v).padStart(8)} ${unidad.padEnd(10)} conf=${conf}`);
  }

  if (val.errores.length) {
    console.log('\n  Errores:');
    val.errores.forEach(e => console.log(`    ✗ ${e}`));
  }
  if (val.avisos.length) {
    console.log('\n  Avisos:');
    val.avisos.forEach(a => console.log(`    ⚠ ${a}`));
  }
  console.log('');
}

// ─── Main ────────────────────────────────────────────────────

const args = process.argv.slice(2);
const idxCoche = args.indexOf('--coche');
if (idxCoche >= 0 && args[idxCoche + 1]) {
  detalleCoche(args[idxCoche + 1]);
  process.exit(0);
}

const opts = {
  soloTop20: args.includes('--solo-top20'),
  soloReady: args.includes('--ready'),
  soloActivables: args.includes('--activables'),
};

const exitCode = resumen(opts);
process.exit(exitCode);
