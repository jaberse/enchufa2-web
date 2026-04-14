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
 * @typedef {Object} DeprecAnchors
 * @property {number} y3      Fracción de depreciación a 3 años (0,36 = 36%).
 * @property {number} y5      Fracción de depreciación a 5 años.
 * @property {number} y10     Fracción de depreciación a 10 años.
 */

/**
 * @typedef {Object} InputCoche
 * @property {'BEV'|'ICE'} tren               Tipo de tren motriz.
 * @property {number} pvp_eur                 PVP oficial en €.
 * @property {number} [ayuda_eur]             Ayuda Plan Auto+ / MOVES III en € (0 si no aplica o ICE).
 * @property {number} consumo_wltp            Consumo WLTP: kWh/100km (BEV) o L/100km (ICE).
 * @property {number} consumo_real_factor     Factor corrector WLTP → real (ej. 1,12 / 1,20).
 * @property {number} depreciacion_pct        Fracción de depreciación al horizonte elegido (0,45 = 45%).
 * @property {DeprecAnchors} [depreciacion_anchors]  Anchors y3/y5/y10 para curvaTCO.
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

/**
 * Fracción de depreciación acumulada en el año t, interpolando linealmente
 * entre los anchors (0,0), (3,y3), (5,y5), (10,y10). Monotónica creciente,
 * acotada en [0, y10] para t > 10.
 *
 * Si el coche no tiene `depreciacion_anchors`, cae a una curva lineal
 * construida a partir del único punto `depreciacion_pct` asumiendo horizonte
 * de 5 años (aproximación pobre pero no rompe la función).
 *
 * @param {InputCoche} coche
 * @param {number} t  Años (≥ 0).
 * @returns {number}  Fracción [0..1].
 */
export function depreciacionFraccion(coche, t) {
  if (t <= 0) return 0;
  const a = coche.depreciacion_anchors;
  if (!a) {
    // Fallback lineal al horizonte estándar 5 años (no recomendado).
    return Math.min(coche.depreciacion_pct * (t / 5), 1);
  }
  if (t <= 3) return a.y3 * (t / 3);
  if (t <= 5) return a.y3 + (a.y5 - a.y3) * ((t - 3) / 2);
  if (t <= 10) return a.y5 + (a.y10 - a.y5) * ((t - 5) / 5);
  return a.y10;
}

/**
 * Calcula el TCO acumulado de un coche en el instante t (años), coherente con
 * calcularTCO(h=t) pero usando la curva de depreciación interpolada.
 *
 * @param {InputCoche} coche
 * @param {import('./params.mjs').TcoParams} p
 * @param {number} t
 * @returns {number}
 */
function tcoAcumulado(coche, p, t) {
  if (t <= 0) {
    // En t=0 solo se aplica la ayuda del BEV (crédito fiscal recibido en compra).
    return coche.tren === 'BEV' ? -(coche.ayuda_eur ?? 0) : 0;
  }
  const consumo_real = coche.consumo_wltp * coche.consumo_real_factor;
  const km_totales = p.km_anual * t;

  const depreciacion = coche.pvp_eur * depreciacionFraccion(coche, t);
  const precio_unidad =
    coche.tren === 'BEV' ? p.precio_kwh_eur : p.precio_litro_eur;
  const energia = km_totales * (consumo_real / 100) * precio_unidad;
  const mantenimiento = coche.mantenimiento_anual_eur * t;
  const seguro = coche.seguro_anual_eur * t;
  const ivtm_anual =
    coche.tren === 'BEV' ? p.ivtm_bev_eur : p.ivtm_ice_eur;
  const impuestos = ivtm_anual * t;
  const ayudas = coche.tren === 'BEV' ? (coche.ayuda_eur ?? 0) : 0;

  return depreciacion + energia + mantenimiento + seguro + impuestos - ayudas;
}

/**
 * Calcula la curva TCO acumulado (BEV vs ICE) en función del tiempo, muestreada
 * a `granularidad_anios` (default 0.25 años = trimestral). Devuelve también el
 * instante de break-even si el BEV cruza al ICE en el rango.
 *
 * Break-even: primer t ≥ 0 en el que tco_bev(t) ≤ tco_ice(t). Si el BEV ya
 * empieza por debajo en t=0 (por efecto de la ayuda), breakeven = 0 y se
 * devuelve `rentable_desde_inicio: true`.
 *
 * @param {InputCoche} bev
 * @param {InputCoche} ice
 * @param {Partial<import('./params.mjs').TcoParams>} [overrides]
 * @param {{ horizonte_max?: number, granularidad_anios?: number }} [opts]
 * @returns {{
 *   puntos: Array<{ anio: number, tco_bev: number, tco_ice: number }>,
 *   breakeven_anio: number | null,
 *   rentable_desde_inicio: boolean,
 *   horizonte_max: number,
 *   params: import('./params.mjs').TcoParams
 * }}
 */
export function curvaTCO(bev, ice, overrides = {}, opts = {}) {
  if (bev.tren !== 'BEV') {
    throw new Error('curvaTCO: primer argumento debe ser BEV');
  }
  if (ice.tren !== 'ICE') {
    throw new Error('curvaTCO: segundo argumento debe ser ICE');
  }
  const p = { ...PARAMS_ENCHUFA2_ESTANDAR, ...overrides };
  const horizonte_max = opts.horizonte_max ?? p.horizonte_anios ?? 5;
  const paso = opts.granularidad_anios ?? 0.25;

  /** @type {Array<{anio:number, tco_bev:number, tco_ice:number}>} */
  const puntos = [];
  let breakeven_anio = null;
  let rentable_desde_inicio = false;
  let prev = null;

  const n = Math.round(horizonte_max / paso);
  for (let i = 0; i <= n; i++) {
    const t = i * paso;
    const tco_bev = tcoAcumulado(bev, p, t);
    const tco_ice = tcoAcumulado(ice, p, t);
    puntos.push({ anio: t, tco_bev, tco_ice });

    // Detectar cruce BEV ↓ ICE: primer t donde tco_bev < tco_ice.
    // En t=0 solo cuenta "rentable desde el inicio" si el BEV empieza
    // ESTRICTAMENTE por debajo del ICE (efecto ayuda Plan Auto+). Si
    // ambos arrancan en 0 € (sin ayuda) es empate, no ventaja.
    if (breakeven_anio === null) {
      if (t === 0 && tco_bev < tco_ice) {
        breakeven_anio = 0;
        rentable_desde_inicio = true;
      } else if (prev && prev.tco_bev >= prev.tco_ice && tco_bev < tco_ice) {
        // Cruce dentro del intervalo (arriba/igual → abajo).
        // Interpolación lineal para ubicar el cruce exacto.
        const diff_prev = prev.tco_bev - prev.tco_ice;
        const diff_cur = tco_bev - tco_ice;
        const denom = diff_prev - diff_cur;
        const frac = denom === 0 ? 0 : diff_prev / denom;
        breakeven_anio = prev.anio + frac * (t - prev.anio);
      }
    }
    prev = { anio: t, tco_bev, tco_ice };
  }

  return {
    puntos,
    breakeven_anio,
    rentable_desde_inicio,
    horizonte_max,
    params: p,
  };
}
