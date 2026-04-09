/**
 * Registro centralizado de campos NÚCLEO de la biblia enchufa2 (v2 — 31 campos).
 *
 * Este archivo es el "contrato" de qué datos comparamos por cada variante
 * de coche eléctrico. Representa el scope MÍNIMO pero RIGUROSO:
 * campos que afectan a decisiones reales de compra, con fuente y URL en cada uno.
 *
 * Scope archivado (fase 2): ver fields_fase2.mjs — no se carga en el build.
 *
 * Cada campo tiene:
 *   group:      clave del grupo temático
 *   unit:       unidad (null para texto/bool/numérico sin unidad)
 *   kind:       "number" | "text" | "bool"
 *   difficulty: "facil" | "media" | "dificil" — coste de verificación
 *   source:     fuente canónica recomendada
 *   hero:       true si requiere cross-check de ≥2 fuentes
 */

export const GROUPS = {
  identidad:     { label: 'Identidad',              order: 1 },
  bateria:       { label: 'Batería',                order: 2 },
  autonomia:     { label: 'Autonomía y consumo',    order: 3 },
  carga:         { label: 'Carga',                  order: 4 },
  prestaciones:  { label: 'Prestaciones',           order: 5 },
  dimensiones:   { label: 'Dimensiones y habitabilidad', order: 6 },
  economia:      { label: 'Economía (España)',      order: 7 },
  meta:          { label: 'Meta',                   order: 8 },
};

// Campos top-level (identidad del coche, no son specs)
export const TOP_LEVEL_FIELDS = [
  'id', 'slug', 'marca', 'modelo', 'variante', 'nombre_completo',
  'segmento', 'imagen',
];

export const FIELD_REGISTRY = {
  // ─── Identidad (2 en specs; marca/modelo/variante son top-level) ───────
  carroceria:               { group: 'identidad', unit: null, kind: 'text', difficulty: 'facil', source: 'enchufa2 (clasificación propia)' },
  traccion:                 { group: 'identidad', unit: null, kind: 'text', difficulty: 'facil', source: 'fabricante' },

  // ─── Batería (5) ───────────────────────────────────────────────────────
  bateria_neta_kwh:             { group: 'bateria', unit: 'kWh',  kind: 'number', difficulty: 'facil', source: 'fabricante', hero: false },
  quimica:                      { group: 'bateria', unit: null,   kind: 'text',   difficulty: 'media', source: 'fabricante/prensa' },
  garantia_bateria_anos:        { group: 'bateria', unit: 'años', kind: 'number', difficulty: 'facil', source: 'fabricante' },
  garantia_bateria_km:          { group: 'bateria', unit: 'km',   kind: 'number', difficulty: 'facil', source: 'fabricante' },
  soh_minimo_garantizado_pct:   { group: 'bateria', unit: '%',    kind: 'number', difficulty: 'media', source: 'fabricante', hero: true },

  // ─── Autonomía y consumo (3) ───────────────────────────────────────────
  autonomia_wltp_km:            { group: 'autonomia', unit: 'km',        kind: 'number', difficulty: 'facil', source: 'homologacion WLTP' },
  autonomia_real_estimada_km:   { group: 'autonomia', unit: 'km',        kind: 'number', difficulty: 'media', source: 'test_independiente (120 km/h)', hero: true },
  consumo_wltp_kwh100km:        { group: 'autonomia', unit: 'kWh/100km', kind: 'number', difficulty: 'facil', source: 'homologacion WLTP', hero: true },

  // ─── Carga (4) ─────────────────────────────────────────────────────────
  carga_ac_max_kw:              { group: 'carga', unit: 'kW',  kind: 'number', difficulty: 'facil', source: 'fabricante' },
  carga_dc_max_kw:              { group: 'carga', unit: 'kW',  kind: 'number', difficulty: 'facil', source: 'fabricante', hero: true },
  carga_dc_media_10_80_kw:      { group: 'carga', unit: 'kW',  kind: 'number', difficulty: 'media', source: 'P3/Fastned/calculo_propio' },
  t_10_80_min:                  { group: 'carga', unit: 'min', kind: 'number', difficulty: 'facil', source: 'fabricante', hero: true },

  // ─── Prestaciones (2) ──────────────────────────────────────────────────
  potencia_cv:                  { group: 'prestaciones', unit: 'CV', kind: 'number', difficulty: 'facil', source: 'fabricante' },
  aceleracion_0_100_s:          { group: 'prestaciones', unit: 's',  kind: 'number', difficulty: 'facil', source: 'fabricante' },

  // ─── Dimensiones y habitabilidad (7) ───────────────────────────────────
  largo_mm:                     { group: 'dimensiones', unit: 'mm', kind: 'number', difficulty: 'facil', source: 'fabricante' },
  ancho_mm:                     { group: 'dimensiones', unit: 'mm', kind: 'number', difficulty: 'facil', source: 'fabricante' },
  alto_mm:                      { group: 'dimensiones', unit: 'mm', kind: 'number', difficulty: 'facil', source: 'fabricante' },
  batalla_mm:                   { group: 'dimensiones', unit: 'mm', kind: 'number', difficulty: 'facil', source: 'fabricante' },
  plazas:                       { group: 'dimensiones', unit: null, kind: 'number', difficulty: 'facil', source: 'fabricante' },
  maletero_l:                   { group: 'dimensiones', unit: 'L',  kind: 'number', difficulty: 'facil', source: 'fabricante' },
  peso_kg:                      { group: 'dimensiones', unit: 'kg', kind: 'number', difficulty: 'facil', source: 'homologacion' },

  // ─── Economía España (7) ───────────────────────────────────────────────
  pvp:                          { group: 'economia', unit: '€',  kind: 'number', difficulty: 'facil', source: 'fabricante' },
  pais_ensamblaje:              { group: 'economia', unit: null,  kind: 'text',   difficulty: 'media', source: 'investigacion_web (VIN/fabricante)' },
  bateria_ensamblaje_ue:        { group: 'economia', unit: null,  kind: 'bool',   difficulty: 'media', source: 'investigacion_web (fabricante/prensa)' },
  plan_auto_elegible:           { group: 'economia', unit: null,  kind: 'text',   difficulty: 'facil', source: 'calculado (fórmula EEE Plan Auto+ 2026)' },
  ayuda_plan_auto_eur:          { group: 'economia', unit: '€',  kind: 'number', difficulty: 'facil', source: 'calculado (fórmula EEE Plan Auto+ 2026)' },
  pvp_con_plan_auto_eur:        { group: 'economia', unit: '€',  kind: 'number', difficulty: 'facil', source: 'calculado (pvp − ayuda)' },
  moves_aplicable:              { group: 'economia', unit: null,  kind: 'bool',   difficulty: 'media', source: 'MITECO (programa cerrado)' },

  // ─── Meta (2) ──────────────────────────────────────────────────────────
  fecha_lanzamiento_es:         { group: 'meta', unit: null, kind: 'text', difficulty: 'media', source: 'prensa/fabricante' },
  estado_comercial:             { group: 'meta', unit: null, kind: 'text', difficulty: 'facil', source: 'enchufa2 (clasificación propia)' },
};

// Campos héroe (los que requieren cross-check ≥2 fuentes independientes)
export const HERO_FIELDS = Object.entries(FIELD_REGISTRY)
  .filter(([, cfg]) => cfg.hero === true)
  .map(([k]) => k);

// Orden plano de campos (para build.mjs y exportaciones CSV)
export const FIELD_ORDER = Object.keys(FIELD_REGISTRY);

// Helper: crea un spec vacío para un campo
export function emptySpec(fieldKey, valor = null) {
  const cfg = FIELD_REGISTRY[fieldKey];
  if (!cfg) throw new Error(`Campo desconocido: ${fieldKey}`);
  const spec = {
    valor,
    fuente_tipo: 'pendiente',
    verificado: false,
  };
  if (cfg.unit) spec.unidad = cfg.unit;
  return spec;
}

// Helper: devuelve campos agrupados (para UI y documentación)
export function fieldsByGroup() {
  const result = {};
  for (const [key, meta] of Object.entries(GROUPS)) {
    result[key] = { ...meta, fields: [] };
  }
  for (const [fieldKey, cfg] of Object.entries(FIELD_REGISTRY)) {
    if (result[cfg.group]) {
      result[cfg.group].fields.push({ key: fieldKey, ...cfg });
    }
  }
  return result;
}
