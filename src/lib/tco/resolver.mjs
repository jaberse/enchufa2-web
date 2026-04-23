// src/lib/tco/resolver.mjs
// Helpers para mapear el schema de data/coches/*.json y
// data/referencias/termicos-equivalentes/*.json al InputCoche de la calculadora.
//
// El schema de cada campo es { valor, unidad, fuente_*, verificado, confianza, ... }.
// Estas utilidades extraen `valor` + `confianza` de forma segura.

/**
 * Fracción de depreciación en un horizonte arbitrario 2..10 años,
 * interpolando linealmente entre los anclajes y3/y5/y10. Espejo mínimo
 * de `depreciacionFraccion` de calculadora.mjs — duplicado aquí a propósito
 * para no crear dependencia circular entre resolver y calculadora.
 *
 * @param {{y3: number, y5: number, y10: number}} anchors
 * @param {number} t  Años (enteros 2..10 en la práctica).
 * @returns {number}
 */
function interpolarDepreciacion(anchors, t) {
  if (t <= 0) return 0;
  if (t <= 3) return anchors.y3 * (t / 3);
  if (t <= 5) return anchors.y3 + (anchors.y5 - anchors.y3) * ((t - 3) / 2);
  if (t <= 10) return anchors.y5 + (anchors.y10 - anchors.y5) * ((t - 5) / 5);
  return anchors.y10;
}

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

  // v2.1 — consumo WLTP puro, sin factor corrector. La confianza se hereda
  // del propio envelope de consumo.
  const consumo = v(json, 'specs', 'consumo_wltp_kwh100km');
  const y3 = v(json, 'specs_tco', 'depreciacion_y3_pct');
  const y5 = v(json, 'specs_tco', 'depreciacion_y5_pct');
  const y10 = v(json, 'specs_tco', 'depreciacion_y10_pct');
  // Horizonte arbitrario 2..10: si existe el anclaje exacto lo usamos;
  // si no, interpolamos entre y3/y5/y10 y heredamos la peor confianza.
  const deprecExacto = v(json, 'specs_tco', `depreciacion_y${horizonte}_pct`);
  const deprec = deprecExacto.valor != null
    ? deprecExacto
    : {
        valor: interpolarDepreciacion(
          { y3: Number(y3.valor), y5: Number(y5.valor), y10: Number(y10.valor) },
          horizonte,
        ),
        confianza: horizonte > 5 ? 'baja' : y5.confianza ?? 'media',
      };
  const mant = v(json, 'specs_tco', 'mantenimiento_anual_eur');
  const seguro = v(json, 'specs_tco', 'seguro_anual_eur');

  return {
    tren: 'BEV',
    pvp_eur: Number(pvp),
    ayuda_eur: Number(ayuda) || 0,
    consumo_wltp: Number(consumo.valor),
    depreciacion_pct: Number(deprec.valor),
    depreciacion_anchors: {
      y3: Number(y3.valor),
      y5: Number(y5.valor),
      y10: Number(y10.valor),
    },
    mantenimiento_anual_eur: Number(mant.valor),
    seguro_anual_eur: Number(seguro.valor),
    confianza_depreciacion: deprec.confianza,
    confianza_mantenimiento: mant.confianza,
    confianza_seguro: seguro.confianza,
    confianza_consumo: consumo.confianza,
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
  // v2.1 — consumo WLTP puro, sin factor corrector.
  const consumo = v(json, 'specs', 'consumo_wltp_l100km');
  const y3 = v(json, 'specs_tco', 'depreciacion_y3_pct');
  const y5 = v(json, 'specs_tco', 'depreciacion_y5_pct');
  const y10 = v(json, 'specs_tco', 'depreciacion_y10_pct');
  const deprecExacto = v(json, 'specs_tco', `depreciacion_y${horizonte}_pct`);
  const deprec = deprecExacto.valor != null
    ? deprecExacto
    : {
        valor: interpolarDepreciacion(
          { y3: Number(y3.valor), y5: Number(y5.valor), y10: Number(y10.valor) },
          horizonte,
        ),
        confianza: horizonte > 5 ? 'baja' : y5.confianza ?? 'media',
      };
  const mant = v(json, 'specs_tco', 'mantenimiento_anual_eur');
  const seguro = v(json, 'specs_tco', 'seguro_anual_eur');

  return {
    tren: 'ICE',
    pvp_eur: Number(pvp.valor),
    consumo_wltp: Number(consumo.valor),
    depreciacion_pct: Number(deprec.valor),
    depreciacion_anchors: {
      y3: Number(y3.valor),
      y5: Number(y5.valor),
      y10: Number(y10.valor),
    },
    mantenimiento_anual_eur: Number(mant.valor),
    seguro_anual_eur: Number(seguro.valor),
    confianza_depreciacion: deprec.confianza,
    confianza_mantenimiento: mant.confianza,
    confianza_seguro: seguro.confianza,
    confianza_consumo: consumo.confianza,
  };
}
