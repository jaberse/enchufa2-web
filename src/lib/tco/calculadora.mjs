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
 * a `granularidad_anios` (default 0.25 años = trimestral). Detecta los cruces
 * de las dos curvas para que la UI pueda contar la historia real: cuándo el
 * BEV empieza a ganar, cuándo deja de ganar, si se mantiene ventaja al final.
 *
 * Semántica de campos:
 *  - `rentable_desde_inicio`: BEV(0) < ICE(0) estricto (efecto ayuda).
 *  - `breakeven_anio`: primer t>0 donde el BEV pasa de perder/empatar a
 *     ganar. Incluye t=0 si `rentable_desde_inicio=true`.
 *  - `perdida_rentabilidad_anio`: primer t>0 donde el BEV, siendo más
 *     barato, pasa a ser más caro que el ICE.
 *  - `rentable_al_final`: BEV(horizonte_max) ≤ ICE(horizonte_max).
 *
 * @param {InputCoche} bev
 * @param {InputCoche} ice
 * @param {Partial<import('./params.mjs').TcoParams>} [overrides]
 * @param {{ horizonte_max?: number, granularidad_anios?: number }} [opts]
 * Cada punto incluye además las bandas de incertidumbre `tco_bev_min/max`
 * y `tco_ice_min/max` según la metodología TCO §4 (D13): el margen agregado
 * es el máximo de las confianzas individuales (depreciación, mantenimiento,
 * seguro, consumo) y se aplica simétricamente en euros alrededor del central.
 *
 * @returns {{
 *   puntos: Array<{
 *     anio: number,
 *     tco_bev: number, tco_bev_min: number, tco_bev_max: number,
 *     tco_ice: number, tco_ice_min: number, tco_ice_max: number
 *   }>,
 *   breakeven_anio: number | null,
 *   perdida_rentabilidad_anio: number | null,
 *   rentable_desde_inicio: boolean,
 *   rentable_al_final: boolean,
 *   horizonte_max: number,
 *   margen_bev: number,
 *   margen_ice: number,
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

  // Margen agregado por tren — máximo de las 4 confianzas (§4 metodología).
  const margen_bev = Math.max(
    margenConfianza(bev.confianza_depreciacion ?? 'alta'),
    margenConfianza(bev.confianza_mantenimiento ?? 'alta'),
    margenConfianza(bev.confianza_seguro ?? 'alta'),
    margenConfianza(bev.confianza_consumo ?? 'alta'),
  );
  const margen_ice = Math.max(
    margenConfianza(ice.confianza_depreciacion ?? 'alta'),
    margenConfianza(ice.confianza_mantenimiento ?? 'alta'),
    margenConfianza(ice.confianza_seguro ?? 'alta'),
    margenConfianza(ice.confianza_consumo ?? 'alta'),
  );

  /** @type {Array<{anio:number, tco_bev:number, tco_bev_min:number, tco_bev_max:number, tco_ice:number, tco_ice_min:number, tco_ice_max:number}>} */
  const puntos = [];
  let breakeven_anio = null;
  let perdida_rentabilidad_anio = null;
  let rentable_desde_inicio = false;
  let prev = null;

  const n = Math.round(horizonte_max / paso);
  for (let i = 0; i <= n; i++) {
    const t = i * paso;
    const tco_bev = tcoAcumulado(bev, p, t);
    const tco_ice = tcoAcumulado(ice, p, t);
    // Banda simétrica en euros: central ± |central|·margen.
    // Para tco_bev negativo en t=0 (efecto ayuda), esto ensancha la banda
    // hacia ambos lados de forma visualmente simétrica.
    const db = Math.abs(tco_bev) * margen_bev;
    const di = Math.abs(tco_ice) * margen_ice;
    puntos.push({
      anio: t,
      tco_bev,
      tco_bev_min: tco_bev - db,
      tco_bev_max: tco_bev + db,
      tco_ice,
      tco_ice_min: tco_ice - di,
      tco_ice_max: tco_ice + di,
    });

    // t=0: solo es "rentable desde el inicio" si el BEV arranca
    // ESTRICTAMENTE por debajo del ICE (efecto ayuda Plan Auto+). Un
    // empate en 0 € no cuenta como ventaja.
    if (i === 0) {
      if (tco_bev < tco_ice) {
        rentable_desde_inicio = true;
        breakeven_anio = 0;
      }
      prev = { anio: t, tco_bev, tco_ice };
      continue;
    }

    // Detectar cruces dentro del intervalo [prev.anio, t].
    const d_prev = prev.tco_bev - prev.tco_ice;
    const d_cur = tco_bev - tco_ice;
    // Interpolación lineal del punto donde diff cambia de signo.
    const interpolar = () => {
      const denom = d_prev - d_cur;
      const frac = denom === 0 ? 0 : d_prev / denom;
      return prev.anio + frac * (t - prev.anio);
    };

    // BEV pasa a ganar (de ≥0 a <0): primer break-even favorable.
    if (breakeven_anio === null && d_prev >= 0 && d_cur < 0) {
      breakeven_anio = interpolar();
    }
    // BEV pierde la ventaja (de <0 a ≥0): primer "anti-break-even".
    if (perdida_rentabilidad_anio === null && d_prev < 0 && d_cur >= 0) {
      perdida_rentabilidad_anio = interpolar();
    }

    prev = { anio: t, tco_bev, tco_ice };
  }

  const ultimo = puntos[puntos.length - 1];
  const rentable_al_final = ultimo.tco_bev <= ultimo.tco_ice;

  return {
    puntos,
    breakeven_anio,
    perdida_rentabilidad_anio,
    rentable_desde_inicio,
    rentable_al_final,
    horizonte_max,
    margen_bev,
    margen_ice,
    params: p,
  };
}

/**
 * Curva TCO acumulado para UN SOLO coche (BEV o ICE). Versión desacoplada de
 * `curvaTCO` para soportar comparaciones N×M donde el usuario elige varios
 * candidatos por tren y el frontend necesita una curva independiente por
 * modelo. No detecta cruces — esa lógica se aplica, si procede, a nivel
 * agregado (envolventes inferiores por tren) en la UI.
 *
 * Cada punto incluye banda simétrica en euros según §4 de la metodología:
 * margen agregado = max de las 4 confianzas (depreciación, mantenimiento,
 * seguro, consumo).
 *
 * @param {import('./calculadora.mjs').InputCoche} coche
 * @param {Partial<import('./params.mjs').TcoParams>} [overrides]
 * @param {{ horizonte_max?: number, granularidad_anios?: number }} [opts]
 * @returns {{
 *   tren: 'BEV' | 'ICE',
 *   puntos: Array<{ anio: number, tco: number, tco_min: number, tco_max: number }>,
 *   horizonte_max: number,
 *   margen: number,
 *   params: import('./params.mjs').TcoParams
 * }}
 */
export function curvaUnTren(coche, overrides = {}, opts = {}) {
  if (coche.tren !== 'BEV' && coche.tren !== 'ICE') {
    throw new Error(
      `curvaUnTren: coche.tren debe ser 'BEV' o 'ICE' (recibido: ${coche.tren})`,
    );
  }
  const p = { ...PARAMS_ENCHUFA2_ESTANDAR, ...overrides };
  const horizonte_max = opts.horizonte_max ?? p.horizonte_anios ?? 5;
  const paso = opts.granularidad_anios ?? 0.25;

  const margen = Math.max(
    margenConfianza(coche.confianza_depreciacion ?? 'alta'),
    margenConfianza(coche.confianza_mantenimiento ?? 'alta'),
    margenConfianza(coche.confianza_seguro ?? 'alta'),
    margenConfianza(coche.confianza_consumo ?? 'alta'),
  );

  /** @type {Array<{anio:number, tco:number, tco_min:number, tco_max:number}>} */
  const puntos = [];
  const n = Math.round(horizonte_max / paso);
  for (let i = 0; i <= n; i++) {
    const t = i * paso;
    const tco = tcoAcumulado(coche, p, t);
    const d = Math.abs(tco) * margen;
    puntos.push({
      anio: t,
      tco,
      tco_min: tco - d,
      tco_max: tco + d,
    });
  }

  return {
    tren: coche.tren,
    puntos,
    horizonte_max,
    margen,
    params: p,
  };
}
