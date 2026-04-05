/**
 * Registro centralizado de campos de la biblia enchufa2.
 *
 * Este archivo es el "contrato" de qué datos rastreamos por cada variante
 * de coche eléctrico. Cualquier cambio en la estructura de datos empieza aquí.
 *
 * Organización: 11 grupos temáticos alineados con taxonomías de la industria
 * (EV-Database, P3 Charging Index, WLTP, Euro NCAP, homologación UE).
 *
 * Cada campo tiene:
 *   group: clave del grupo temático
 *   unit: unidad (null para texto/boolean/numérico sin unidad)
 *   kind: "number" | "text" | "bool"
 *   difficulty: "facil" | "media" | "dificil" — cuánto cuesta conseguir el dato
 *   source: fuente canónica recomendada
 */

export const GROUPS = {
  identidad:     { label: 'Identidad',              order: 1 },
  bateria:       { label: 'Batería',                order: 2 },
  carga:         { label: 'Carga',                  order: 3 },
  autonomia:     { label: 'Autonomía y consumo',    order: 4 },
  prestaciones:  { label: 'Prestaciones',           order: 5 },
  dimensiones:   { label: 'Dimensiones',            order: 6 },
  habitabilidad: { label: 'Habitabilidad y carga',  order: 7 },
  seguridad:     { label: 'Seguridad y ADAS',       order: 8 },
  fiabilidad:    { label: 'Fiabilidad',             order: 9 },
  economia:      { label: 'Economía y garantía',    order: 10 },
  tecnologia:    { label: 'Tecnología y confort',   order: 11 },
};

// Campos top-level (no son specs, son identidad del coche)
export const TOP_LEVEL_FIELDS = [
  'id', 'slug', 'marca', 'modelo', 'variante', 'nombre_completo',
  'segmento', 'imagen',
];

export const FIELD_REGISTRY = {
  // ─── Identidad (en specs, además de top-level) ─────────────────────────
  model_year:               { group: 'identidad', unit: null, kind: 'number', difficulty: 'facil',  source: 'fabricante' },
  carroceria:               { group: 'identidad', unit: null, kind: 'text',   difficulty: 'facil',  source: 'fabricante' },
  estado_comercial:         { group: 'identidad', unit: null, kind: 'text',   difficulty: 'facil',  source: 'fabricante' },
  pais_fabricacion:         { group: 'identidad', unit: null, kind: 'text',   difficulty: 'media',  source: 'fabricante' },
  plataforma:               { group: 'identidad', unit: null, kind: 'text',   difficulty: 'media',  source: 'fabricante' },
  fecha_lanzamiento_es:     { group: 'identidad', unit: null, kind: 'text',   difficulty: 'media',  source: 'prensa/fabricante' },

  // ─── Batería ───────────────────────────────────────────────────────────
  bateria_neta_kwh:         { group: 'bateria', unit: 'kWh', kind: 'number', difficulty: 'facil',  source: 'fabricante' },
  bateria_bruta_kwh:        { group: 'bateria', unit: 'kWh', kind: 'number', difficulty: 'media',  source: 'fabricante/homologacion' },
  quimica:                  { group: 'bateria', unit: null,  kind: 'text',   difficulty: 'media',  source: 'fabricante/proveedor' },
  fabricante_celda:         { group: 'bateria', unit: null,  kind: 'text',   difficulty: 'dificil', source: 'prensa especializada' },
  formato_celda:            { group: 'bateria', unit: null,  kind: 'text',   difficulty: 'dificil', source: 'prensa/teardown' },
  voltaje:                  { group: 'bateria', unit: 'V',   kind: 'number', difficulty: 'media',  source: 'fabricante' },
  refrigeracion_bateria:    { group: 'bateria', unit: null,  kind: 'text',   difficulty: 'media',  source: 'fabricante' },

  // ─── Carga ─────────────────────────────────────────────────────────────
  carga_dc_max_kw:          { group: 'carga', unit: 'kW',  kind: 'number', difficulty: 'facil',  source: 'fabricante' },
  carga_dc_media_10_80_kw:  { group: 'carga', unit: 'kW',  kind: 'number', difficulty: 'media',  source: 'P3/Fastned' },
  t_10_80_min:              { group: 'carga', unit: 'min', kind: 'number', difficulty: 'facil',  source: 'fabricante' },
  t_para_300km_min:         { group: 'carga', unit: 'min', kind: 'number', difficulty: 'media',  source: 'P3 Charging Index' },
  carga_ac_max_kw:          { group: 'carga', unit: 'kW',  kind: 'number', difficulty: 'facil',  source: 'fabricante' },
  t_carga_completa_ac_h:    { group: 'carga', unit: 'h',   kind: 'number', difficulty: 'facil',  source: 'fabricante' },
  conector_dc:              { group: 'carga', unit: null,  kind: 'text',   difficulty: 'facil',  source: 'fabricante' },
  preconditioning_bateria:  { group: 'carga', unit: null,  kind: 'text',   difficulty: 'media',  source: 'fabricante' },
  plug_and_charge:          { group: 'carga', unit: null,  kind: 'bool',   difficulty: 'media',  source: 'fabricante' },
  v2l_w:                    { group: 'carga', unit: 'W',   kind: 'number', difficulty: 'facil',  source: 'fabricante' },
  v2h:                      { group: 'carga', unit: null,  kind: 'bool',   difficulty: 'facil',  source: 'fabricante' },
  v2g:                      { group: 'carga', unit: null,  kind: 'bool',   difficulty: 'facil',  source: 'fabricante' },
  bomba_calor:              { group: 'carga', unit: null,  kind: 'text',   difficulty: 'media',  source: 'fabricante' },

  // ─── Autonomía y consumo ───────────────────────────────────────────────
  autonomia_wltp_km:          { group: 'autonomia', unit: 'km',         kind: 'number', difficulty: 'facil', source: 'homologacion WLTP' },
  autonomia_wltp_urbana_km:   { group: 'autonomia', unit: 'km',         kind: 'number', difficulty: 'media', source: 'homologacion WLTP' },
  consumo_wltp_kwh100km:      { group: 'autonomia', unit: 'kWh/100km',  kind: 'number', difficulty: 'facil', source: 'homologacion WLTP' },
  consumo_wltp_ciudad_kwh100km: { group: 'autonomia', unit: 'kWh/100km', kind: 'number', difficulty: 'media', source: 'homologacion WLTP' },
  autonomia_real_estimada_km:   { group: 'autonomia', unit: 'km',       kind: 'number', difficulty: 'media', source: 'calculo_propio' },
  consumo_real_estimado_kwh100km: { group: 'autonomia', unit: 'kWh/100km', kind: 'number', difficulty: 'media', source: 'calculo_propio' },

  // ─── Prestaciones ──────────────────────────────────────────────────────
  potencia_kw:              { group: 'prestaciones', unit: 'kW',   kind: 'number', difficulty: 'facil', source: 'fabricante' },
  potencia_cv:              { group: 'prestaciones', unit: 'CV',   kind: 'number', difficulty: 'facil', source: 'fabricante' },
  par_nm:                   { group: 'prestaciones', unit: 'Nm',   kind: 'number', difficulty: 'facil', source: 'fabricante' },
  traccion:                 { group: 'prestaciones', unit: null,   kind: 'text',   difficulty: 'facil', source: 'fabricante' },
  n_motores:                { group: 'prestaciones', unit: null,   kind: 'number', difficulty: 'facil', source: 'fabricante' },
  aceleracion_0_100_s:      { group: 'prestaciones', unit: 's',    kind: 'number', difficulty: 'facil', source: 'fabricante' },
  aceleracion_80_120_s:     { group: 'prestaciones', unit: 's',    kind: 'number', difficulty: 'dificil', source: 'test_independiente' },
  velocidad_max_kmh:        { group: 'prestaciones', unit: 'km/h', kind: 'number', difficulty: 'facil', source: 'fabricante' },

  // ─── Dimensiones ───────────────────────────────────────────────────────
  largo_mm:                 { group: 'dimensiones', unit: 'mm', kind: 'number', difficulty: 'facil', source: 'fabricante' },
  ancho_mm:                 { group: 'dimensiones', unit: 'mm', kind: 'number', difficulty: 'facil', source: 'fabricante' },
  alto_mm:                  { group: 'dimensiones', unit: 'mm', kind: 'number', difficulty: 'facil', source: 'fabricante' },
  batalla_mm:               { group: 'dimensiones', unit: 'mm', kind: 'number', difficulty: 'facil', source: 'fabricante' },
  voladizo_delantero_mm:    { group: 'dimensiones', unit: 'mm', kind: 'number', difficulty: 'dificil', source: 'ficha_tecnica' },
  voladizo_trasero_mm:      { group: 'dimensiones', unit: 'mm', kind: 'number', difficulty: 'dificil', source: 'ficha_tecnica' },
  via_delantera_mm:         { group: 'dimensiones', unit: 'mm', kind: 'number', difficulty: 'media', source: 'ficha_tecnica' },
  via_trasera_mm:           { group: 'dimensiones', unit: 'mm', kind: 'number', difficulty: 'media', source: 'ficha_tecnica' },
  diametro_giro_m:          { group: 'dimensiones', unit: 'm',  kind: 'number', difficulty: 'media', source: 'fabricante' },
  cx:                       { group: 'dimensiones', unit: null, kind: 'number', difficulty: 'media', source: 'fabricante' },
  peso_kg:                  { group: 'dimensiones', unit: 'kg', kind: 'number', difficulty: 'facil', source: 'homologacion' },
  mma_kg:                   { group: 'dimensiones', unit: 'kg', kind: 'number', difficulty: 'media', source: 'homologacion' },

  // ─── Habitabilidad y carga ─────────────────────────────────────────────
  plazas:                   { group: 'habitabilidad', unit: null, kind: 'number', difficulty: 'facil', source: 'fabricante' },
  maletero_l:               { group: 'habitabilidad', unit: 'L',  kind: 'number', difficulty: 'facil', source: 'fabricante' },
  maletero_abatido_l:       { group: 'habitabilidad', unit: 'L',  kind: 'number', difficulty: 'media', source: 'fabricante' },
  frunk_l:                  { group: 'habitabilidad', unit: 'L',  kind: 'number', difficulty: 'facil', source: 'fabricante' },
  carga_util_kg:            { group: 'habitabilidad', unit: 'kg', kind: 'number', difficulty: 'media', source: 'homologacion' },
  capacidad_remolque_kg:    { group: 'habitabilidad', unit: 'kg', kind: 'number', difficulty: 'facil', source: 'fabricante' },
  enganche_remolque_opcional: { group: 'habitabilidad', unit: null, kind: 'bool', difficulty: 'media', source: 'fabricante' },

  // ─── Seguridad y ADAS ──────────────────────────────────────────────────
  euroncap_estrellas:           { group: 'seguridad', unit: null, kind: 'number', difficulty: 'facil', source: 'Euro NCAP' },
  euroncap_ano_test:            { group: 'seguridad', unit: null, kind: 'number', difficulty: 'facil', source: 'Euro NCAP' },
  euroncap_adult_occupant_pct:  { group: 'seguridad', unit: '%',  kind: 'number', difficulty: 'facil', source: 'Euro NCAP' },
  euroncap_child_occupant_pct:  { group: 'seguridad', unit: '%',  kind: 'number', difficulty: 'facil', source: 'Euro NCAP' },
  euroncap_vulnerable_users_pct:{ group: 'seguridad', unit: '%',  kind: 'number', difficulty: 'facil', source: 'Euro NCAP' },
  euroncap_safety_assist_pct:   { group: 'seguridad', unit: '%',  kind: 'number', difficulty: 'facil', source: 'Euro NCAP' },
  adas_nivel:                   { group: 'seguridad', unit: null, kind: 'text',   difficulty: 'media', source: 'fabricante' },
  adas_sistemas:                { group: 'seguridad', unit: null, kind: 'text',   difficulty: 'media', source: 'fabricante' },

  // ─── Fiabilidad ────────────────────────────────────────────────────────
  indice_fiabilidad_enchufa2: { group: 'fiabilidad', unit: null, kind: 'number', difficulty: 'dificil', source: 'calculo_propio' },
  fiabilidad_fuentes:         { group: 'fiabilidad', unit: null, kind: 'text',   difficulty: 'dificil', source: 'JD Power/ADAC/What Car' },
  fiabilidad_anos_datos:      { group: 'fiabilidad', unit: null, kind: 'text',   difficulty: 'dificil', source: 'calculo_propio' },
  fiabilidad_nota_marca:      { group: 'fiabilidad', unit: null, kind: 'number', difficulty: 'media',   source: 'JD Power/ADAC' },

  // ─── Economía y garantía ───────────────────────────────────────────────
  pvp:                        { group: 'economia', unit: '€',  kind: 'number', difficulty: 'facil', source: 'fabricante' },
  pvp_fecha:                  { group: 'economia', unit: null, kind: 'text',   difficulty: 'facil', source: 'fabricante' },
  pvp_con_plan_auto_eur:      { group: 'economia', unit: '€',  kind: 'number', difficulty: 'media', source: 'fabricante/gobierno' },
  plan_auto_elegible:         { group: 'economia', unit: null, kind: 'text',   difficulty: 'media', source: 'MITMA' },
  moves_aplicable:            { group: 'economia', unit: null, kind: 'bool',   difficulty: 'media', source: 'MITECO' },
  garantia_vehiculo_anos:     { group: 'economia', unit: 'años', kind: 'number', difficulty: 'facil', source: 'fabricante' },
  garantia_vehiculo_km:       { group: 'economia', unit: 'km', kind: 'number', difficulty: 'facil', source: 'fabricante' },
  garantia_bateria_anos:      { group: 'economia', unit: 'años', kind: 'number', difficulty: 'facil', source: 'fabricante' },
  garantia_bateria_km:        { group: 'economia', unit: 'km', kind: 'number', difficulty: 'facil', source: 'fabricante' },
  garantia_bateria:           { group: 'economia', unit: null, kind: 'text',   difficulty: 'facil', source: 'fabricante' }, // legacy texto
  soh_minimo_garantizado_pct: { group: 'economia', unit: '%',  kind: 'number', difficulty: 'media', source: 'fabricante' },
  mantenimiento_intervalo_anos: { group: 'economia', unit: 'años', kind: 'number', difficulty: 'media', source: 'fabricante' },
  mantenimiento_intervalo_km:   { group: 'economia', unit: 'km', kind: 'number', difficulty: 'media', source: 'fabricante' },

  // ─── Tecnología y confort ──────────────────────────────────────────────
  pantalla_central_pulgadas: { group: 'tecnologia', unit: '"', kind: 'number', difficulty: 'facil', source: 'fabricante' },
  ota_updates:               { group: 'tecnologia', unit: null, kind: 'bool',  difficulty: 'facil', source: 'fabricante' },
  carplay:                   { group: 'tecnologia', unit: null, kind: 'bool',  difficulty: 'facil', source: 'fabricante' },
  android_auto:              { group: 'tecnologia', unit: null, kind: 'bool',  difficulty: 'facil', source: 'fabricante' },
  camara_360:                { group: 'tecnologia', unit: null, kind: 'bool',  difficulty: 'facil', source: 'fabricante' },
  head_up_display:           { group: 'tecnologia', unit: null, kind: 'bool',  difficulty: 'facil', source: 'fabricante' },
  climatizador:              { group: 'tecnologia', unit: null, kind: 'text',  difficulty: 'facil', source: 'fabricante' },
  asientos_calefactados:     { group: 'tecnologia', unit: null, kind: 'bool',  difficulty: 'facil', source: 'fabricante' },
  asientos_ventilados:       { group: 'tecnologia', unit: null, kind: 'bool',  difficulty: 'facil', source: 'fabricante' },
  techo_panoramico:          { group: 'tecnologia', unit: null, kind: 'bool',  difficulty: 'facil', source: 'fabricante' },
};

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
