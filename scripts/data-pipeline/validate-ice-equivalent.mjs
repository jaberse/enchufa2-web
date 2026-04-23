// scripts/data-pipeline/validate-ice-equivalent.mjs
// Validador de data/referencias/termicos-equivalentes/*.json.
// Desde metodología v2 (2026-04-20) acepta fichas ICE | HEV | PHEV.
//
// Uso:
//   node scripts/data-pipeline/validate-ice-equivalent.mjs <slug>      # un archivo
//   node scripts/data-pipeline/validate-ice-equivalent.mjs --all       # todos

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = 'data/referencias/termicos-equivalentes';

const SEGMENTOS_VALIDOS = new Set([
  'A', 'B', 'B-SUV', 'C', 'C-SUV', 'D', 'D-SUV', 'E', 'E-SUV', 'F',
]);

const TIPOS_VEHICULO_VALIDOS = new Set(['ICE', 'HEV', 'PHEV']);

// Canónicos § 3 de docs/metodologia-tco.md
const FUENTE_TIPO_CANONICA = new Set([
  // Generales de specs (ficha técnica)
  'fabricante',
  'DGT',
  'distribuidor',
  'calculado',
  'decision_editorial',
  'parametros_calculador',
  // specs_tco — depreciación
  'baseline_compartido_intra_plataforma',
  'analogo_predecesor',
  'ganvam_segmento',
  'curva_bev_categoria',
  // specs_tco — seguro
  'tres_cotizaciones_reales',
  'estimacion_bev_sobre_ice',
  'media_segmento_unespa',
  // specs_tco — mantenimiento
  'plan_hermano_fabricante',
  'media_bev_categoria',
  // v2 (HEV + PHEV, metodología 2026-04-20)
  'factor_hev_sobre_ice',
  'factor_phev_sobre_hev',
  'media_hev_segmento',
  'media_phev_segmento',
  'estudio_sectorial_utility_factor',
]);

// Legacy permitidos — marcados como warning para migrar (§3 tabla de migración)
const FUENTE_TIPO_LEGACY = new Map([
  ['curva_depreciacion_sectorial', 'ganvam_segmento'],
  ['curva_depreciacion_ajustada', 'ganvam_segmento / analogo_predecesor'],
  ['mercado_agregado', 'analogo_predecesor / ganvam_segmento'],
  ['mercado_agregado_ajustado', 'analogo_predecesor / ganvam_segmento'],
  ['estimacion_sectorial', 'media_segmento_unespa / estimacion_bev_sobre_ice'],
  ['estimacion_proyectada', 'curva_bev_categoria'],
  ['comparador_agregado', 'tres_cotizaciones_reales / estimacion_bev_sobre_ice'],
  // v2.1 — retirados, ya no hay factor corrector (usábamos WLTP puro)
  ['ev_database', 'retirado — consumo WLTP sin corrección (v2.1)'],
  ['factor_categoria', 'retirado — consumo WLTP sin corrección (v2.1)'],
  ['investigacion_web', 'retirado'],
  ['dato_real_usuario', 'fabricante / plan_hermano_fabricante'],
]);

const SPECS_OBLIGATORIOS = [
  'carroceria', 'traccion', 'motor_tipo', 'cilindrada_cc', 'n_cilindros',
  'potencia_kw', 'potencia_cv', 'par_nm', 'transmision',
  'consumo_wltp_l100km', 'emisiones_co2_wltp_g_km', 'normativa_emisiones', 'distintivo_dgt',
  'aceleracion_0_100_s', 'velocidad_max_kmh',
  'largo_mm', 'ancho_mm', 'alto_mm', 'batalla_mm', 'peso_kg',
  'plazas', 'maletero_l', 'deposito_combustible_l', 'autonomia_wltp_km_derivada',
  'pvp', 'pvp_fecha', 'pais_fabricacion', 'plataforma',
  'garantia_vehiculo_anos', 'fecha_lanzamiento_es', 'model_year', 'estado_comercial',
];

// Comunes a ICE | HEV | PHEV
const SPECS_TCO_OBLIGATORIOS_COMUNES = [
  'depreciacion_y3_pct', 'depreciacion_y5_pct', 'depreciacion_y10_pct',
  'mantenimiento_anual_eur', 'seguro_anual_eur',
  'precio_combustible_eur_l',
];

// v2.1 — ICE y HEV no tienen campos adicionales de consumo en specs_tco.
// El consumo se lee directamente de specs.consumo_wltp_l100km (WLTP puro).
const SPECS_TCO_OBLIGATORIOS_UNIFACTOR = [];

// PHEV tiene consumos separados (§2.8) — v2.1 sin factores correctores
const SPECS_TCO_OBLIGATORIOS_PHEV = [
  'consumo_electrico_wltp_kwh100km',
  'consumo_combustion_wltp_l100km',
  'autonomia_electrica_wltp_km',
  'ratio_electrico_default',
];

/**
 * Devuelve {errors, warnings} para un archivo.
 */
function validarArchivo(slug) {
  const errors = [];
  const warnings = [];
  const path = join(DATA_DIR, `${slug}.json`);

  let json;
  try {
    json = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    errors.push(`No se puede leer/parsear: ${e.message}`);
    return { slug, errors, warnings };
  }

  // Top-level obligatorio
  for (const k of ['id', 'slug', 'marca', 'modelo', 'variante', 'segmento',
                    'tipo_vehiculo', 'combustible', 'uso', 'specs', 'specs_tco', 'meta']) {
    if (json[k] == null) errors.push(`Falta top-level: ${k}`);
  }

  if (json.slug !== slug) errors.push(`slug del fichero (${slug}) no coincide con json.slug (${json.slug})`);
  if (json.id !== json.slug) errors.push(`id ≠ slug (${json.id} vs ${json.slug})`);
  if (!TIPOS_VEHICULO_VALIDOS.has(json.tipo_vehiculo)) {
    errors.push(`tipo_vehiculo inválido: "${json.tipo_vehiculo}" (debe ser ${[...TIPOS_VEHICULO_VALIDOS].join(' | ')})`);
  }
  if (!SEGMENTOS_VALIDOS.has(json.segmento)) {
    errors.push(`segmento inválido: "${json.segmento}" (debe ser ${[...SEGMENTOS_VALIDOS].join(' | ')})`);
  }

  // Specs obligatorios
  const specs = json.specs ?? {};
  for (const k of SPECS_OBLIGATORIOS) {
    if (specs[k] == null) errors.push(`Falta specs.${k}`);
  }

  // Envelope check
  const checkEnvelope = (base, fieldName, required = ['valor', 'fuente_tipo']) => {
    const f = base[fieldName];
    if (f == null || typeof f !== 'object') return;
    for (const r of required) {
      if (f[r] === undefined) warnings.push(`${fieldName}: falta "${r}"`);
    }
    if (f.fuente_tipo) {
      if (FUENTE_TIPO_CANONICA.has(f.fuente_tipo)) {
        // OK
      } else if (FUENTE_TIPO_LEGACY.has(f.fuente_tipo)) {
        warnings.push(`${fieldName}.fuente_tipo legacy: "${f.fuente_tipo}" → migrar a "${FUENTE_TIPO_LEGACY.get(f.fuente_tipo)}"`);
      } else {
        errors.push(`${fieldName}.fuente_tipo desconocido: "${f.fuente_tipo}"`);
      }
    }
  };
  for (const k of SPECS_OBLIGATORIOS) checkEnvelope(specs, k);

  // specs_tco obligatorios — varían según tipo_vehiculo (§2.6-2.8 v2)
  const st = json.specs_tco ?? {};
  const obligatorios_tco = [...SPECS_TCO_OBLIGATORIOS_COMUNES];
  if (json.tipo_vehiculo === 'PHEV') {
    obligatorios_tco.push(...SPECS_TCO_OBLIGATORIOS_PHEV);
  } else {
    // ICE y HEV
    obligatorios_tco.push(...SPECS_TCO_OBLIGATORIOS_UNIFACTOR);
  }
  for (const k of obligatorios_tco) {
    if (st[k] == null) errors.push(`Falta specs_tco.${k}`);
    else checkEnvelope(st, k, ['valor', 'fuente_tipo']);
  }

  // Coherencia numérica
  const kw = specs.potencia_kw?.valor;
  const cv = specs.potencia_cv?.valor;
  if (kw != null && cv != null && kw > 0) {
    const ratio = cv / kw;
    if (ratio < 1.30 || ratio > 1.42) {
      errors.push(`potencia_cv/kW = ${ratio.toFixed(2)} fuera de rango (1.30-1.42). Verifica conversión.`);
    }
  }

  const deposito = specs.deposito_combustible_l?.valor;
  const consumo = specs.consumo_wltp_l100km?.valor;
  const autoCalc = specs.autonomia_wltp_km_derivada?.valor;
  if (deposito && consumo && autoCalc) {
    const esperada = Math.round((deposito / consumo) * 100);
    if (Math.abs(autoCalc - esperada) > 15) {
      errors.push(`autonomia_wltp_km_derivada = ${autoCalc} ≠ calculada ${esperada} (${deposito} L × 100 / ${consumo} L/100km)`);
    }
  }
  if (consumo != null && (consumo < 2 || consumo > 15)) {
    warnings.push(`consumo_wltp_l100km = ${consumo} — rango atípico (2-15).`);
  }

  // Anclajes depreciación monotónicos
  const y3 = st.depreciacion_y3_pct?.valor;
  const y5 = st.depreciacion_y5_pct?.valor;
  const y10 = st.depreciacion_y10_pct?.valor;
  if (y3 != null && y5 != null && y5 < y3) {
    errors.push(`Depreciación no monotónica: y5 (${y5}) < y3 (${y3})`);
  }
  if (y5 != null && y10 != null && y10 < y5) {
    errors.push(`Depreciación no monotónica: y10 (${y10}) < y5 (${y5})`);
  }
  for (const [k, v] of [['y3', y3], ['y5', y5], ['y10', y10]]) {
    if (v != null && (v <= 0 || v >= 1)) {
      errors.push(`depreciacion_${k}_pct = ${v} fuera de (0, 1). Debe ser fracción.`);
    }
  }

  // v2.1 — factor corrector retirado. Si aparece en datos legacy, avisar.
  if (st.consumo_real_factor != null) {
    warnings.push(`consumo_real_factor presente — campo retirado en v2.1 (WLTP puro). Elimínalo.`);
  }
  if (st.factor_real_electrico != null) {
    warnings.push(`factor_real_electrico presente — campo retirado en v2.1 (WLTP puro). Elimínalo.`);
  }
  if (st.factor_real_combustion != null) {
    warnings.push(`factor_real_combustion presente — campo retirado en v2.1 (WLTP puro). Elimínalo.`);
  }

  // meta
  const meta = json.meta ?? {};
  for (const k of ['fecha_actualizacion', 'estado', 'proposito', 'tco_estado']) {
    if (meta[k] == null) errors.push(`Falta meta.${k}`);
  }

  return { slug, errors, warnings };
}

// ── CLI ──
const arg = process.argv[2];
if (!arg) {
  console.error('Uso: node validate-ice-equivalent.mjs <slug> | --all');
  process.exit(2);
}

const slugs = arg === '--all'
  ? readdirSync(DATA_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''))
  : [arg.replace('.json', '')];

let totalErr = 0;
let totalWarn = 0;
for (const slug of slugs) {
  const { errors, warnings } = validarArchivo(slug);
  totalErr += errors.length;
  totalWarn += warnings.length;
  if (errors.length === 0 && warnings.length === 0) {
    console.log(`✔ ${slug}`);
  } else {
    console.log(`${errors.length ? '✘' : '⚠'} ${slug}`);
    for (const e of errors) console.log(`   error: ${e}`);
    for (const w of warnings) console.log(`   warn:  ${w}`);
  }
}

console.log('');
console.log(`Resumen: ${slugs.length} archivos · ${totalErr} errores · ${totalWarn} avisos`);
process.exit(totalErr > 0 ? 1 : 0);
