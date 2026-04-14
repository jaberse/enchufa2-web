// src/lib/tco/params.mjs
// Perfil enchufa2 estándar (v1) — decisiones D10, D11, D12, D13.
// Fuente: docs/plan-calculadora-tco.md + pilotos 1/2/3.

/**
 * @typedef {Object} TcoParams
 * @property {number} km_anual          Kilometraje anual (km/año). Default 15.000 (ANFAC 2024 media España).
 * @property {number} horizonte_anios   Horizonte en años (3/5/7/10). Default 5 (D12).
 * @property {number} precio_kwh_eur    Precio medio €/kWh. Default 0,17 (mix 70% casa PVPC valle + 30% pública).
 * @property {number} precio_litro_eur  Precio gasolina 95 €/L. Default 1,55 (MITECO abril 2026).
 * @property {number} ivtm_bev_eur      IVTM BEV €/año. Default 40 (bonificación 50-75% mayoría municipios).
 * @property {number} ivtm_ice_eur      IVTM ICE €/año. Default 90 (sin bonificación).
 */

/** @type {TcoParams} */
export const PARAMS_ENCHUFA2_ESTANDAR = Object.freeze({
  km_anual: 15000,
  horizonte_anios: 5,
  precio_kwh_eur: 0.17,
  precio_litro_eur: 1.55,
  ivtm_bev_eur: 40,
  ivtm_ice_eur: 90,
});

/**
 * Rangos de incertidumbre aplicados según confianza del dato (D13).
 * baja = ±15%, media = ±8%, alta = 0%.
 * @param {'alta'|'media'|'baja'} conf
 * @returns {number}
 */
export function margenConfianza(conf) {
  if (conf === 'baja') return 0.15;
  if (conf === 'media') return 0.08;
  return 0;
}
