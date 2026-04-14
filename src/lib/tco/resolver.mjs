// src/lib/tco/resolver.mjs
// Helpers para mapear el schema de data/coches/*.json y
// data/referencias/ice-equivalentes/*.json al InputCoche de la calculadora.
//
// El schema de cada campo es { valor, unidad, fuente_*, verificado, confianza, ... }.
// Estas utilidades extraen `valor` + `confianza` de forma segura.

/**
 * Obtiene {valor, confianza} de un campo con schema enchufa2.
 * Acepta valor primitivo como atajo ("campo": 3.14).
 *
 * @param {unknown} field
 * @returns {{ valor: any, confianza: 'alta'|'media'|'baja' }}
 */
export function pick(field) {
  if (field == null) return { valor: undefined, confianza: 'alta' };
  if (typeof field !== 'object' || Array.isArray(field)) {
    return { valor: field, confianza: 'alta' };
  }
  const obj = /** @type {Record<string, any>} */ (field);
  return {
    valor: obj.valor,
    confianza: obj.confianza ?? 'alta',
  };
}

/**
 * Accesor seguro en cadena: v(obj, 'specs_tco', 'mantenimiento_anual_eur').valor
 * @param {Record<string, any>} obj
 * @param {...string} path
 */
export function v(obj, ...path) {
  let cur = obj;
  for (const k of path) {
    if (cur == null) return pick(undefined);
    cur = cur[k];
  }
  return pick(cur);
}

/**
 * Convierte el JSON de un BEV (data/coches/*.json) en InputCoche para la calculadora.
 * Requiere que el BEV tenga specs_tco poblado.
 *
 * @param {Record<string, any>} json  Parsed JSON del BEV.
 * @param {{ horizonte_anios?: 3|5|7|10, aplicar_ayuda?: boolean }} [opts]
 * @returns {import('./calculadora.mjs').InputCoche}
 */
export function bevFromJson(json, opts = {}) {
  const horizonte = opts.horizonte_anios ?? 5;
  const aplicar_ayuda = opts.aplicar_ayuda ?? true;

  const pvp = v(json, 'specs', 'pvp').valor;
  const ayuda = aplicar_ayuda
    ? v(json, 'specs', 'ayuda_plan_auto_eur').valor ?? 0
    : 0;

  const consumo = v(json, 'specs', 'consumo_wltp_kwh100km');
  const factor = v(json, 'specs_tco', 'consumo_real_factor');
  const deprec = v(json, 'specs_tco', `depreciacion_y${horizonte}_pct`);
  const mant = v(json, 'specs_tco', 'mantenimiento_anual_eur');
  const seguro = v(json, 'specs_tco', 'seguro_anual_eur');

  return {
    tren: 'BEV',
    pvp_eur: Number(pvp),
    ayuda_eur: Number(ayuda) || 0,
    consumo_wltp: Number(consumo.valor),
    consumo_real_factor: Number(factor.valor),
    depreciacion_pct: Number(deprec.valor),
    mantenimiento_anual_eur: Number(mant.valor),
    seguro_anual_eur: Number(seguro.valor),
    confianza_depreciacion: deprec.confianza,
    confianza_mantenimiento: mant.confianza,
    confianza_seguro: seguro.confianza,
    confianza_consumo: factor.confianza,
  };
}

/**
 * Convierte el JSON de un ICE de referencia en InputCoche.
 * Campo de consumo: specs.consumo_wltp_l100km (L/100km).
 *
 * @param {Record<string, any>} json
 * @param {{ horizonte_anios?: 3|5|7|10 }} [opts]
 * @returns {import('./calculadora.mjs').InputCoche}
 */
export function iceFromJson(json, opts = {}) {
  const horizonte = opts.horizonte_anios ?? 5;

  const pvp = v(json, 'specs', 'pvp');
  const consumo = v(json, 'specs', 'consumo_wltp_l100km');
  const factor = v(json, 'specs_tco', 'consumo_real_factor');
  const deprec = v(json, 'specs_tco', `depreciacion_y${horizonte}_pct`);
  const mant = v(json, 'specs_tco', 'mantenimiento_anual_eur');
  const seguro = v(json, 'specs_tco', 'seguro_anual_eur');

  return {
    tren: 'ICE',
    pvp_eur: Number(pvp.valor),
    consumo_wltp: Number(consumo.valor),
    consumo_real_factor: Number(factor.valor),
    depreciacion_pct: Number(deprec.valor),
    mantenimiento_anual_eur: Number(mant.valor),
    seguro_anual_eur: Number(seguro.valor),
    confianza_depreciacion: deprec.confianza,
    confianza_mantenimiento: mant.confianza,
    confianza_seguro: seguro.confianza,
    confianza_consumo: factor.confianza,
  };
}
