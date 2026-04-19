// src/lib/comparador/filterEngine.mjs
// Motor puro (sin DOM) de filtros y orden para el catálogo del comparador.
//
// Consume los objetos expuestos por cargarCatalogoSpecs() en loader.mjs:
//   { slug, marca, modelo, variante, segmento, pvp_eur, pvp_con_plan_auto_eur,
//     ayuda_plan_auto_eur, autonomia_wltp_km, consumo_wltp_kwh100km,
//     bateria_neta_kwh, quimica, potencia_cv, carga_dc_max_kw, t_10_80_min,
//     plazas, maletero_l, largo_mm, carroceria, traccion,
//     fiabilidad_estrellas, pais_ensamblaje, bateria_ensamblaje_ue,
//     voltaje, bomba_calor, garantia_bateria_anos, garantia_vehiculo_anos,
//     carga_ac_max_kw, peso_kg, aceleracion_0_100_s, plan_auto_elegible }
//
// Exporta:
//   - EMPTY_STATE                 → plantilla de estado de filtros
//   - CATEGORIAS                  → descriptor de filtros categóricos (para la UI)
//   - RANGOS                      → descriptor de filtros numéricos
//   - SORT_OPTIONS                → array {value,label} para el <select>
//   - applyFilters(catalog, state)
//   - applySort(list, sortKey)
//   - applyQuery(list, query)
//   - appliedFilterChips(state)   → resumen de filtros activos
//   - hasAnyFilter(state)

// ──────────────────────────────────────────────────────────────────────
// DESCRIPTORES DE FILTROS
// ──────────────────────────────────────────────────────────────────────

/**
 * Filtros categóricos (multi-select). Cada filtro se materializa como un
 * array de valores seleccionados (vacío = sin filtrar).
 */
export const CATEGORIAS = Object.freeze([
  {
    id: 'segmento',
    label: 'Segmento',
    campo: 'segmento',
    // Orden canónico para presentar en la UI (lo que no aparezca se omite).
    ordenSugerido: ['Utilitario', 'Compacto', 'Berlina', 'SUV', 'Monovolumen'],
  },
  {
    id: 'traccion',
    label: 'Tracción',
    campo: 'traccion',
    ordenSugerido: ['FWD', 'RWD', 'AWD'],
  },
  {
    id: 'quimica',
    label: 'Química',
    campo: 'quimica',
    ordenSugerido: ['LFP', 'NMC'],
  },
  {
    id: 'voltaje',
    label: 'Voltaje',
    campo: 'voltaje',
    sufijo: ' V',
    // Se descubre dinámicamente desde los datos.
  },
  {
    id: 'bomba_calor',
    label: 'B. calor',
    campo: 'bomba_calor',
    ordenSugerido: ['Sí', 'No'],
  },
  {
    id: 'plan_auto',
    label: 'Plan Auto+',
    campo: 'plan_auto_elegible',
    ordenSugerido: ['Sí', 'Parcial', 'No elegible'],
  },
  {
    id: 'bateria_ue',
    label: 'Batería UE',
    campo: 'bateria_ensamblaje_ue',
    // Valores booleanos: se traducen a etiquetas legibles.
    traducir: (v) => (v === true ? 'Sí' : v === false ? 'No' : null),
    ordenSugerido: ['Sí', 'No'],
  },
]);

/**
 * Filtros numéricos (rango min/max). El estado guarda `{min, max}` con null
 * donde no hay tope.
 */
export const RANGOS = Object.freeze([
  { id: 'pvp',              campo: 'pvp_eur',                  tipo: 'max', label: 'PVP',           unidad: '€' },
  { id: 'pvp_efectivo',     campo: 'pvp_con_plan_auto_eur',    tipo: 'max', label: 'PVP con Auto+', unidad: '€' },
  { id: 'ayuda_auto',       campo: 'ayuda_plan_auto_eur',      tipo: 'min', label: 'Ayuda Auto+',   unidad: '€' },
  { id: 'autonomia',        campo: 'autonomia_wltp_km',        tipo: 'min', label: 'Autonomía',     unidad: 'km' },
  { id: 'consumo',          campo: 'consumo_wltp_kwh100km',    tipo: 'max', label: 'Consumo',       unidad: 'kWh/100' },
  { id: 'bateria',          campo: 'bateria_neta_kwh',         tipo: 'min', label: 'Batería',       unidad: 'kWh' },
  { id: 'carga_dc',         campo: 'carga_dc_max_kw',          tipo: 'min', label: 'Carga DC',      unidad: 'kW' },
  { id: 't_10_80',          campo: 't_10_80_min',              tipo: 'max', label: 'Carga 10→80%',  unidad: 'min' },
  { id: 'potencia',         campo: 'potencia_cv',              tipo: 'min', label: 'Potencia',      unidad: 'CV' },
  { id: 'aceleracion',      campo: 'aceleracion_0_100_s',      tipo: 'max', label: '0-100',         unidad: 's' },
  { id: 'peso',             campo: 'peso_kg',                  tipo: 'max', label: 'Peso',          unidad: 'kg' },
  { id: 'maletero',         campo: 'maletero_l',               tipo: 'min', label: 'Maletero',      unidad: 'L' },
  { id: 'garantia_bateria', campo: 'garantia_bateria_anos',    tipo: 'min', label: 'Gar. batería',  unidad: 'años' },
  { id: 'garantia_vehiculo', campo: 'garantia_vehiculo_anos',  tipo: 'min', label: 'Gar. vehículo', unidad: 'años' },
]);

/**
 * Opciones de orden (11 heredadas del comparador antiguo). El valor '' es el
 * sort por defecto: autonomía descendente.
 */
export const SORT_OPTIONS = Object.freeze([
  { value: '',                    label: 'Autonomía ↓',  campo: 'autonomia_wltp_km',      dir: 'desc' },
  { value: 'pvp-asc',             label: 'Precio ↑',     campo: 'pvp_eur',                dir: 'asc'  },
  { value: 'pvp-desc',            label: 'Precio ↓',     campo: 'pvp_eur',                dir: 'desc' },
  { value: 'pvp_efectivo-asc',    label: 'PVP con Auto+ ↑', campo: 'pvp_con_plan_auto_eur', dir: 'asc' },
  { value: 'ayuda_auto-desc',     label: 'Ayuda Auto+ ↓', campo: 'ayuda_plan_auto_eur',   dir: 'desc' },
  { value: 'potencia_cv-desc',    label: 'Potencia ↓',   campo: 'potencia_cv',            dir: 'desc' },
  { value: 'carga_dc-desc',       label: 'Carga DC ↓',   campo: 'carga_dc_max_kw',        dir: 'desc' },
  { value: 'aceleracion-asc',     label: '0-100 ↑',      campo: 'aceleracion_0_100_s',    dir: 'asc'  },
  { value: 'consumo-asc',         label: 'Consumo ↑',    campo: 'consumo_wltp_kwh100km',  dir: 'asc'  },
  { value: 'peso-asc',            label: 'Peso ↑',       campo: 'peso_kg',                dir: 'asc'  },
  { value: 'maletero-desc',       label: 'Maletero ↓',   campo: 'maletero_l',             dir: 'desc' },
]);

// ──────────────────────────────────────────────────────────────────────
// ESTADO VACÍO
// ──────────────────────────────────────────────────────────────────────

/** Clona el estado inicial. Usado en init y en "Limpiar todo". */
export function emptyState() {
  const cat = {};
  for (const c of CATEGORIAS) cat[c.id] = [];
  const rng = {};
  for (const r of RANGOS) rng[r.id] = { min: null, max: null };
  return {
    query: '',
    sort: '',          // clave SORT_OPTIONS.value
    categorias: cat,   // { [id]: string[] }
    rangos: rng,       // { [id]: { min, max } }
    soloConTCO: false, // modo TCO — filtrar a slugs con par disponible
  };
}

export const EMPTY_STATE = Object.freeze(emptyState());

// ──────────────────────────────────────────────────────────────────────
// FILTROS
// ──────────────────────────────────────────────────────────────────────

function norm(s) {
  return String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** True si el modelo pasa el filtro de texto libre. */
function matchesQuery(m, q) {
  if (!q) return true;
  const hay = norm(q);
  const hs = norm(`${m.marca ?? ''} ${m.modelo ?? ''} ${m.variante ?? ''}`);
  return hs.includes(hay);
}

/** True si el modelo pasa todas las categorías activas. */
function matchesCategorias(m, catState) {
  for (const c of CATEGORIAS) {
    const sel = catState?.[c.id];
    if (!sel || sel.length === 0) continue;
    let valor = m[c.campo];
    if (typeof c.traducir === 'function') valor = c.traducir(valor);
    if (valor == null) return false;
    const valorStr = String(valor);
    if (!sel.includes(valorStr)) return false;
  }
  return true;
}

/** True si el modelo pasa todos los rangos activos. */
function matchesRangos(m, rngState) {
  for (const r of RANGOS) {
    const s = rngState?.[r.id];
    if (!s) continue;
    const { min, max } = s;
    if (min == null && max == null) continue;
    const v = m[r.campo];
    if (v == null || isNaN(v)) return false;
    if (min != null && v < min) return false;
    if (max != null && v > max) return false;
  }
  return true;
}

/** True si el modelo pasa el filtro "solo con TCO disponible". */
function matchesTCO(m, soloConTCO, slugsConTCO) {
  if (!soloConTCO) return true;
  return slugsConTCO instanceof Set
    ? slugsConTCO.has(m.slug)
    : (slugsConTCO ?? []).includes(m.slug);
}

/**
 * Aplica todos los filtros (query, categorías, rangos, TCO) a un catálogo.
 *
 * @param {Array} catalog      catalogoSpecs tal cual lo expone el loader.
 * @param {Object} state       ver emptyState().
 * @param {Object} [opts]
 * @param {Set<string>|string[]} [opts.slugsConTCO]  Set de slugs con par TCO.
 */
export function applyFilters(catalog, state, opts = {}) {
  if (!Array.isArray(catalog)) return [];
  const st = state || EMPTY_STATE;
  return catalog.filter(
    (m) =>
      matchesQuery(m, st.query) &&
      matchesCategorias(m, st.categorias) &&
      matchesRangos(m, st.rangos) &&
      matchesTCO(m, st.soloConTCO, opts.slugsConTCO),
  );
}

/** Alias: solo texto libre (útil en tests y en preview rápido). */
export function applyQuery(list, query) {
  if (!query) return list;
  return list.filter((m) => matchesQuery(m, query));
}

// ──────────────────────────────────────────────────────────────────────
// ORDENACIÓN
// ──────────────────────────────────────────────────────────────────────

/**
 * Ordena una lista por la clave SORT_OPTIONS.value indicada. Los valores
 * nulos se envían al final (sea cual sea la dirección) para que los coches
 * incompletos no contaminen la cabecera de la tabla.
 */
export function applySort(list, sortKey) {
  const opt = SORT_OPTIONS.find((o) => o.value === sortKey) ?? SORT_OPTIONS[0];
  const campo = opt.campo;
  const mul = opt.dir === 'asc' ? 1 : -1;
  const copy = list.slice();
  copy.sort((a, b) => {
    const va = a[campo];
    const vb = b[campo];
    const na = va == null || isNaN(va);
    const nb = vb == null || isNaN(vb);
    if (na && nb) return 0;
    if (na) return 1;
    if (nb) return -1;
    return (va - vb) * mul;
  });
  return copy;
}

// ──────────────────────────────────────────────────────────────────────
// RESUMEN DE FILTROS (para la strip "Filtros activos")
// ──────────────────────────────────────────────────────────────────────

/** Array de {id, label, onClear} para pintar chips de filtros aplicados. */
export function appliedFilterChips(state) {
  const st = state || EMPTY_STATE;
  const chips = [];
  if (st.query) {
    chips.push({ id: 'query', label: `"${st.query}"`, tipo: 'query' });
  }
  for (const c of CATEGORIAS) {
    const sel = st.categorias?.[c.id] ?? [];
    for (const v of sel) {
      chips.push({
        id: `cat:${c.id}:${v}`,
        label: `${c.label}: ${v}${c.sufijo ?? ''}`,
        tipo: 'categoria',
        categoria: c.id,
        valor: v,
      });
    }
  }
  for (const r of RANGOS) {
    const s = st.rangos?.[r.id];
    if (!s) continue;
    const { min, max } = s;
    if (min == null && max == null) continue;
    let texto;
    if (min != null && max != null) texto = `${min}–${max} ${r.unidad}`;
    else if (min != null) texto = `≥ ${min} ${r.unidad}`;
    else texto = `≤ ${max} ${r.unidad}`;
    chips.push({
      id: `rng:${r.id}`,
      label: `${r.label}: ${texto}`,
      tipo: 'rango',
      rango: r.id,
    });
  }
  if (st.soloConTCO) {
    chips.push({ id: 'tco', label: 'Solo con TCO', tipo: 'tco' });
  }
  return chips;
}

/** True si hay al menos un filtro activo (incluido query). */
export function hasAnyFilter(state) {
  return appliedFilterChips(state).length > 0;
}

// ──────────────────────────────────────────────────────────────────────
// DESCUBRIMIENTO DE VALORES (para poblar las pills desde los datos reales)
// ──────────────────────────────────────────────────────────────────────

/**
 * Extrae los valores únicos para cada categoría a partir del catálogo. Útil
 * para generar las pills sin hardcodear — si mañana añadimos un segmento
 * nuevo, aparece solo.
 *
 * @returns {Record<string, string[]>}
 */
export function descubrirValoresCategoria(catalog) {
  const out = {};
  for (const c of CATEGORIAS) {
    const vs = new Set();
    for (const m of catalog) {
      let v = m[c.campo];
      if (typeof c.traducir === 'function') v = c.traducir(v);
      if (v == null || v === '') continue;
      vs.add(String(v));
    }
    const arr = Array.from(vs);
    // Aplica orden sugerido si existe; el resto va al final en orden natural.
    if (Array.isArray(c.ordenSugerido)) {
      const prio = new Map(c.ordenSugerido.map((v, i) => [v, i]));
      arr.sort((a, b) => {
        const ia = prio.has(a) ? prio.get(a) : 1000;
        const ib = prio.has(b) ? prio.get(b) : 1000;
        if (ia !== ib) return ia - ib;
        return String(a).localeCompare(String(b), 'es');
      });
    } else {
      arr.sort((a, b) => {
        // Numérico si parece número (ej. voltaje 400/800).
        const na = Number(a);
        const nb = Number(b);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return String(a).localeCompare(String(b), 'es');
      });
    }
    out[c.id] = arr;
  }
  return out;
}
