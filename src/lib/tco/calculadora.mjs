// src/lib/tco/calculadora.mjs
// Calculadora TCO canónica (ICCT). Función pura, sin dependencias externas.
// Validada contra los 3 pilotos manuales (ver docs/piloto-{1,2,3}-tco-calculo-manual.md).
//
// Fórmula:
//   TCO(h) = Depreciación(h) + Energía(h) + Mantenimiento(h) + Seguro(h) + Impuestos(h) − Ayudas
//
// Ayudas se restan del TCO final (no reducen la base de depreciación).
// Esta convención coincide con los Pilotos 2/3 y con el caso "sin ayuda" del Piloto 1.

import { PARAMS_ENCHUFA2_ESTANDAR, margenConfianza } from './params.mjs';

/**
 * @typedef {Object} InputCoche
 * @property {'BEV'|'ICE'} tren               Tipo de tren motriz.
 * @property {number} pvp_eur                 PVP oficial en €.
 * @property {number} [ayuda_eur]             Ayuda Plan Auto+ / MOVES III en € (0 si no aplica o ICE).
 * @property {number} consumo_wltp            Consumo WLTP: kWh/100km (BEV) o L/100km (ICE).
 * @property {number} consumo_real_factor     Factor corrector WLTP → real (ej. 1,12 / 1,20).
 * @property {number} depreciacion_pct        Fracción de depreciación al horizonte elegido (0,45 = 45%).
 * @property {number} mantenimiento_anual_eur Mantenimiento €/año (promedio del horizonte).
 * @property {number} seguro_anual_eur        Seguro €/año (mediana 3 cotizaciones perfil enchufa2).
 * @property {'alta'|'media'|'baja'} [confianza_depreciacion]
 * @property {'alta'|'media'|'baja'} [confianza_mantenimiento]
 * @property {'alta'|'media'|'baja'} [confianza_seguro]
 * @property {'alta'|'media'|'baja'} [confianza_consumo]
 */

/**
 * @typedef {Object} BreakdownTCO
 * @property {number} depreciacion_eur
 * @property {number} energia_eur
 * @property {number} mantenimiento_eur
 * @property {number} seguro_eur
 * @property {number} impuestos_eur
 * @property {number} ayudas_eur           Positivo: se restará del total.
 * @property {number} tco_total_eur        Neto tras restar ayudas.
 * @property {number} tco_por_km_eur
 * @property {number} consumo_real         kWh/100km (BEV) o L/100km (ICE).
 * @property {number} km_totales
 * @property {number} margen_pct           Margen de incertidumbre agregado (0,0 a 0,15).
 * @property {number} tco_total_min_eur    tco_total_eur × (1 − margen_pct).
 * @property {number} tco_total_max_eur    tco_total_eur × (1 + margen_pct).
 */

/**
 * Calcula el TCO de un coche dado su input y los parámetros del perfil.
 *
 * @param {InputCoche} coche
 * @param {Partial<import('./params.mjs').TcoParams>} [overrides]
 * @returns {BreakdownTCO}
 */
export function calcularTCO(coche, overrides = {}) {
  const p = { ...PARAMS_ENCHUFA2_ESTANDAR, ...overrides };
  const h = p.horizonte_anios;
  const km_totales = p.km_anual * h;

  const consumo_real = coche.consumo_wltp * coche.consumo_real_factor;

  const depreciacion_eur = coche.pvp_eur * coche.depreciacion_pct;

  // Energía = km × (consumo_real / 100) × precio_unidad
  const precio_unidad =
    coche.tren === 'BEV' ? p.precio_kwh_eur : p.precio_litro_eur;
  const energia_eur = km_totales * (consumo_real / 100) * precio_unidad;

  const mantenimiento_eur = coche.mantenimiento_anual_eur * h;
  const seguro_eur = coche.seguro_anual_eur * h;

  const ivtm_anual =
    coche.tren === 'BEV' ? p.ivtm_bev_eur : p.ivtm_ice_eur;
  const impuestos_eur = ivtm_anual * h;

  const ayudas_eur = coche.tren === 'BEV' ? (coche.ayuda_eur ?? 0) : 0;

  const tco_total_eur =
    depreciacion_eur +
    energia_eur +
    mantenimiento_eur +
    seguro_eur +
    impuestos_eur -
    ayudas_eur;

  const tco_por_km_eur = tco_total_eur / km_totales;

  // Margen agregado: máximo de los márgenes individuales (conservador).
  // La alternativa (cuadratura) subestima cuando una confianza es claramente baja.
  const margen_pct = Math.max(
    margenConfianza(coche.confianza_depreciacion ?? 'alta'),
    margenConfianza(coche.confianza_mantenimiento ?? 'alta'),
    margenConfianza(coche.confianza_seguro ?? 'alta'),
    margenConfianza(coche.confianza_consumo ?? 'alta'),
  );

  return {
    depreciacion_eur,
    energia_eur,
    mantenimiento_eur,
    seguro_eur,
    impuestos_eur,
    ayudas_eur,
    tco_total_eur,
    tco_por_km_eur,
    consumo_real,
    km_totales,
    margen_pct,
    tco_total_min_eur: tco_total_eur * (1 - margen_pct),
    tco_total_max_eur: tco_total_eur * (1 + margen_pct),
  };
}

/**
 * Calcula la comparación BEV vs ICE y el ahorro del BEV.
 *
 * @param {InputCoche} bev
 * @param {InputCoche} ice
 * @param {Partial<import('./params.mjs').TcoParams>} [overrides]
 * @returns {{
 *   bev: BreakdownTCO,
 *   ice: BreakdownTCO,
 *   ahorro_bev_eur: number,
 *   ahorro_bev_pct: number,
 *   params: import('./params.mjs').TcoParams
 * }}
 */
export function compararTCO(bev, ice, overrides = {}) {
  if (bev.tren !== 'BEV') {
    throw new Error('compararTCO: primer argumento debe ser BEV');
  }
  if (ice.tren !== 'ICE') {
    throw new Error('compararTCO: segundo argumento debe ser ICE');
  }
  const p = { ...PARAMS_ENCHUFA2_ESTANDAR, ...overrides };
  const breakdown_bev = calcularTCO(bev, p);
  const breakdown_ice = calcularTCO(ice, p);
  const ahorro_bev_eur = breakdown_ice.tco_total_eur - breakdown_bev.tco_total_eur;
  const ahorro_bev_pct = ahorro_bev_eur / breakdown_ice.tco_total_eur;
  return {
    bev: breakdown_bev,
    ice: breakdown_ice,
    ahorro_bev_eur,
    ahorro_bev_pct,
    params: p,
  };
}
