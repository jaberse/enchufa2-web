#!/usr/bin/env node
// scripts/data-pipeline/_migrate_fuente_tipo_v1.mjs
//
// Migración de fuente_tipo legacy a los nombres canónicos definidos en
// docs/metodologia-tco.md §3.
//
// Uso:
//   node scripts/data-pipeline/_migrate_fuente_tipo_v1.mjs           # dry-run
//   node scripts/data-pipeline/_migrate_fuente_tipo_v1.mjs --apply   # aplica
//
// Mapeo:
//
//  - Deterministas (se aplican sin revisión):
//      curva_depreciacion_sectorial        → ganvam_segmento
//      estimacion_proyectada (depreciación) → curva_bev_categoria
//      comparador_agregado (seguro)        → estimacion_bev_sobre_ice
//      parametros_calculador               → sin cambio
//      decision_editorial                  → sin cambio
//      baseline_compartido_intra_plataforma → sin cambio
//      fabricante                          → sin cambio
//      tres_cotizaciones_reales            → sin cambio
//
//  - Contextuales (se aplican con lógica sobre fuente_detalle):
//      curva_depreciacion_ajustada:
//        · si fuente_detalle menciona "Ganvam" o "segmento" → ganvam_segmento
//        · si menciona "predecesor" o cita un slug análogo → analogo_predecesor
//        · en otro caso → ganvam_segmento (conservador, con nota)
//
//      mercado_agregado / mercado_agregado_ajustado:
//        · si fuente_detalle menciona "Coches.net" o "muestra" → ganvam_segmento
//          (era sectorial con ajuste manual; queda como Ganvam + nota)
//        · si cita un modelo predecesor específico → analogo_predecesor
//
//      estimacion_sectorial (seguro):
//        · si fuente_detalle menciona "UNESPA" → media_segmento_unespa
//        · si menciona factor × ICE → estimacion_bev_sobre_ice
//        · en otro caso → estimacion_bev_sobre_ice (caso más común)
//
//      estimacion_sectorial (mantenimiento):
//        · → media_bev_categoria
//
//      investigacion_web (consumo_real_factor):
//        · si fuente_detalle menciona "EV Database" → ev_database
//        · en otro caso → factor_categoria
//
//      dato_real_usuario (mantenimiento):
//        · si fuente_detalle menciona "plan" o marca oficial → fabricante
//        · en otro caso → plan_hermano_fabricante
//
// El script no modifica el `valor`, ni `confianza`, ni `verificado`. Solo
// reescribe `fuente_tipo` y, si detecta que `confianza` no coincide con la
// tabla canónica para el nuevo tipo, emite un warning (no lo corrige).

import fs from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');
const ROOT = process.cwd();
const COCHES = path.join(ROOT, 'data/coches');

const CANON_CONFIANZA = {
  baseline_compartido_intra_plataforma: 'baja',
  analogo_predecesor: 'media',
  ganvam_segmento: 'media',
  curva_bev_categoria: 'baja',
  tres_cotizaciones_reales: 'alta',
  estimacion_bev_sobre_ice: 'media',
  media_segmento_unespa: 'baja',
  fabricante: 'alta',
  plan_hermano_fabricante: 'media',
  media_bev_categoria: 'baja',
  ev_database: 'alta',
  factor_categoria: 'media',
  parametros_calculador: null,
  decision_editorial: 'alta',
};

function mapFuenteTipo(campo, tipo, detalle) {
  const d = String(detalle || '').toLowerCase();
  // Ya canónico
  if (tipo in CANON_CONFIANZA) return { nuevo: tipo, nota: null };

  // Deterministas
  if (tipo === 'curva_depreciacion_sectorial') return { nuevo: 'ganvam_segmento', nota: null };
  if (tipo === 'estimacion_proyectada') return { nuevo: 'curva_bev_categoria', nota: null };
  if (tipo === 'comparador_agregado' && /seguro/i.test(campo)) return { nuevo: 'estimacion_bev_sobre_ice', nota: null };

  // Contextuales
  if (tipo === 'curva_depreciacion_ajustada') {
    if (/predecesor|hermano|analogo|análogo/.test(d)) return { nuevo: 'analogo_predecesor', nota: null };
    return { nuevo: 'ganvam_segmento', nota: 'ajuste manual sobre Ganvam, verificar fuente_detalle' };
  }
  if (tipo === 'mercado_agregado' || tipo === 'mercado_agregado_ajustado') {
    if (/predecesor|análogo|analogo/.test(d)) return { nuevo: 'analogo_predecesor', nota: null };
    if (/coches\.net|muestra|n=/.test(d)) return { nuevo: 'ganvam_segmento', nota: 'muestra manual, tratar como Ganvam + ajuste' };
    return { nuevo: 'ganvam_segmento', nota: 'revisar — mapeo conservador' };
  }
  if (tipo === 'estimacion_sectorial') {
    if (campo === 'seguro_anual_eur') {
      if (/unespa/.test(d)) return { nuevo: 'media_segmento_unespa', nota: null };
      return { nuevo: 'estimacion_bev_sobre_ice', nota: null };
    }
    if (campo === 'mantenimiento_anual_eur') {
      return { nuevo: 'media_bev_categoria', nota: null };
    }
  }
  if (tipo === 'investigacion_web') {
    if (/ev database|ev-database|evdatabase/.test(d)) return { nuevo: 'ev_database', nota: null };
    return { nuevo: 'factor_categoria', nota: null };
  }
  if (tipo === 'dato_real_usuario') {
    if (/plan|service inclusive|icare|essential service/.test(d)) return { nuevo: 'fabricante', nota: null };
    return { nuevo: 'plan_hermano_fabricante', nota: null };
  }

  return { nuevo: tipo, nota: 'SIN MAPEO — revisar manualmente' };
}

const files = fs.readdirSync(COCHES).filter(f => f.endsWith('.json'));
const cambios = [];
const warnings = [];

for (const file of files) {
  const p = path.join(COCHES, file);
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  const tco = j.specs_tco;
  if (!tco) continue;

  let fileChanged = false;
  for (const [campo, val] of Object.entries(tco)) {
    if (!val || typeof val !== 'object' || !val.fuente_tipo) continue;
    const { nuevo, nota } = mapFuenteTipo(campo, val.fuente_tipo, val.fuente_detalle);
    if (nuevo !== val.fuente_tipo) {
      cambios.push({
        file,
        campo,
        de: val.fuente_tipo,
        a: nuevo,
        confianza: val.confianza,
        canon_conf: CANON_CONFIANZA[nuevo] ?? '—',
        nota,
      });
      if (APPLY) {
        val.fuente_tipo = nuevo;
        fileChanged = true;
      }
    }
    // Warning si confianza EXCEDE la canónica (declarar más confianza que la
    // que el tipo permite). Divergencia a la baja es legítima per §3 de
    // docs/metodologia-tco.md: la confianza del canon es el máximo alcanzable,
    // se puede declarar inferior si el valor incorpora estimaciones parciales.
    // Excepción §4: y10 siempre se fuerza a baja independientemente del tipo.
    const esY10 = campo === 'depreciacion_y10_pct';
    const canon = CANON_CONFIANZA[nuevo];
    const ORDEN = { baja: 0, media: 1, alta: 2 };
    if (!esY10 && canon && val.confianza && ORDEN[val.confianza] > ORDEN[canon]) {
      warnings.push({
        file,
        campo,
        tipo: nuevo,
        confianza_actual: val.confianza,
        canon,
      });
    }
  }

  if (APPLY && fileChanged) {
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n', 'utf8');
  }
}

// Reporte
console.log('\n═════════ MIGRACIÓN fuente_tipo v1 — ' + (APPLY ? 'APLICADA' : 'DRY-RUN') + ' ═════════\n');
console.log(`Cambios: ${cambios.length}`);
console.log(`Warnings de confianza: ${warnings.length}\n`);

if (cambios.length) {
  console.log('── CAMBIOS ──');
  const col = (s, n) => String(s).padEnd(n).slice(0, n);
  console.log(col('FILE', 36), col('CAMPO', 26), col('DE', 32), col('A', 32), 'NOTA');
  console.log('─'.repeat(140));
  for (const c of cambios) {
    console.log(
      col(c.file, 36),
      col(c.campo, 26),
      col(c.de, 32),
      col(c.a, 32),
      c.nota || '',
    );
  }
}

if (warnings.length) {
  console.log('\n── WARNINGS confianza ──');
  for (const w of warnings) {
    console.log(`  ${w.file} · ${w.campo} · ${w.tipo}: actual=${w.confianza_actual} canon=${w.canon}`);
  }
}

if (!APPLY) {
  console.log('\n(DRY-RUN — para aplicar pasa --apply)');
} else {
  console.log('\n✅ Migración aplicada. Recuerda ejecutar `npm run data:build` y revisar el diff antes de commit.');
}
