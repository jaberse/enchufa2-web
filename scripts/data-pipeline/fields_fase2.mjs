/**
 * Campos fase 2 — ARCHIVO (no se carga en el build).
 *
 * Estos campos formaban parte del registro expandido de 94 campos.
 * En abril 2026 decidimos reducir el scope a 31 campos núcleo (ver fields.mjs)
 * para garantizar rigor sostenible: cada dato del núcleo va con URL verificable.
 *
 * Razones para archivar:
 *   - Campo no-decisivo para comprador típico (no afecta elección)
 *   - Coste de verificación >> valor informativo
 *   - Dato poco estable (varía por lote/fábrica/año sin traza pública)
 *   - Redundante con campo núcleo
 *
 * Si en el futuro queremos recuperar un campo, mover su entrada a fields.mjs
 * y correr `npm run data:upgrade`. Los valores existentes en data/coches/*.json
 * se preservan como "huérfanos" mientras el campo esté archivado.
 *
 * NO IMPORTAR desde build.mjs ni desde componentes Astro.
 */

export const FIELDS_FASE2 = {
  // Identidad extendida
  model_year:               { group: 'identidad', unit: null, kind: 'number' },
  pais_fabricacion:         { group: 'identidad', unit: null, kind: 'text' },
  plataforma:               { group: 'identidad', unit: null, kind: 'text' },

  // Batería detallada
  bateria_bruta_kwh:        { group: 'bateria', unit: 'kWh', kind: 'number' },
  fabricante_celda:         { group: 'bateria', unit: null, kind: 'text' },
  formato_celda:            { group: 'bateria', unit: null, kind: 'text' },
  voltaje:                  { group: 'bateria', unit: 'V', kind: 'number' },
  refrigeracion_bateria:    { group: 'bateria', unit: null, kind: 'text' },

  // Carga extendida
  t_para_300km_min:         { group: 'carga', unit: 'min', kind: 'number' },
  t_carga_completa_ac_h:    { group: 'carga', unit: 'h', kind: 'number' },
  conector_dc:              { group: 'carga', unit: null, kind: 'text' },
  preconditioning_bateria:  { group: 'carga', unit: null, kind: 'text' },
  plug_and_charge:          { group: 'carga', unit: null, kind: 'bool' },
  v2l_w:                    { group: 'carga', unit: 'W', kind: 'number' },
  v2h:                      { group: 'carga', unit: null, kind: 'bool' },
  v2g:                      { group: 'carga', unit: null, kind: 'bool' },
  bomba_calor:              { group: 'carga', unit: null, kind: 'text' },

  // Autonomía extendida
  autonomia_wltp_urbana_km: { group: 'autonomia', unit: 'km', kind: 'number' },
  consumo_wltp_ciudad_kwh100km: { group: 'autonomia', unit: 'kWh/100km', kind: 'number' },
  consumo_real_estimado_kwh100km: { group: 'autonomia', unit: 'kWh/100km', kind: 'number' },

  // Prestaciones extendidas
  potencia_kw:              { group: 'prestaciones', unit: 'kW', kind: 'number' },
  par_nm:                   { group: 'prestaciones', unit: 'Nm', kind: 'number' },
  n_motores:                { group: 'prestaciones', unit: null, kind: 'number' },
  aceleracion_80_120_s:     { group: 'prestaciones', unit: 's', kind: 'number' },
  velocidad_max_kmh:        { group: 'prestaciones', unit: 'km/h', kind: 'number' },

  // Dimensiones extendidas
  voladizo_delantero_mm:    { group: 'dimensiones', unit: 'mm', kind: 'number' },
  voladizo_trasero_mm:      { group: 'dimensiones', unit: 'mm', kind: 'number' },
  via_delantera_mm:         { group: 'dimensiones', unit: 'mm', kind: 'number' },
  via_trasera_mm:           { group: 'dimensiones', unit: 'mm', kind: 'number' },
  diametro_giro_m:          { group: 'dimensiones', unit: 'm', kind: 'number' },
  cx:                       { group: 'dimensiones', unit: null, kind: 'number' },
  mma_kg:                   { group: 'dimensiones', unit: 'kg', kind: 'number' },

  // Habitabilidad extendida
  maletero_abatido_l:       { group: 'habitabilidad', unit: 'L', kind: 'number' },
  frunk_l:                  { group: 'habitabilidad', unit: 'L', kind: 'number' },
  carga_util_kg:            { group: 'habitabilidad', unit: 'kg', kind: 'number' },
  capacidad_remolque_kg:    { group: 'habitabilidad', unit: 'kg', kind: 'number' },
  enganche_remolque_opcional: { group: 'habitabilidad', unit: null, kind: 'bool' },

  // Seguridad y ADAS
  euroncap_estrellas:           { group: 'seguridad', unit: null, kind: 'number' },
  euroncap_ano_test:            { group: 'seguridad', unit: null, kind: 'number' },
  euroncap_adult_occupant_pct:  { group: 'seguridad', unit: '%', kind: 'number' },
  euroncap_child_occupant_pct:  { group: 'seguridad', unit: '%', kind: 'number' },
  euroncap_vulnerable_users_pct:{ group: 'seguridad', unit: '%', kind: 'number' },
  euroncap_safety_assist_pct:   { group: 'seguridad', unit: '%', kind: 'number' },
  adas_nivel:                   { group: 'seguridad', unit: null, kind: 'text' },
  adas_sistemas:                { group: 'seguridad', unit: null, kind: 'text' },

  // Fiabilidad
  indice_fiabilidad_enchufa2: { group: 'fiabilidad', unit: null, kind: 'number' },
  fiabilidad_fuentes:         { group: 'fiabilidad', unit: null, kind: 'text' },
  fiabilidad_anos_datos:      { group: 'fiabilidad', unit: null, kind: 'text' },
  fiabilidad_nota_marca:      { group: 'fiabilidad', unit: null, kind: 'number' },

  // Economía extendida
  pvp_fecha:                  { group: 'economia', unit: null, kind: 'text' },
  pvp_con_plan_auto_eur:      { group: 'economia', unit: '€', kind: 'number' },
  plan_auto_elegible:         { group: 'economia', unit: null, kind: 'text' },
  garantia_vehiculo_anos:     { group: 'economia', unit: 'años', kind: 'number' },
  garantia_vehiculo_km:       { group: 'economia', unit: 'km', kind: 'number' },
  garantia_bateria:           { group: 'economia', unit: null, kind: 'text' },
  mantenimiento_intervalo_anos: { group: 'economia', unit: 'años', kind: 'number' },
  mantenimiento_intervalo_km:   { group: 'economia', unit: 'km', kind: 'number' },

  // Tecnología y confort
  pantalla_central_pulgadas: { group: 'tecnologia', unit: '"', kind: 'number' },
  ota_updates:               { group: 'tecnologia', unit: null, kind: 'bool' },
  carplay:                   { group: 'tecnologia', unit: null, kind: 'bool' },
  android_auto:              { group: 'tecnologia', unit: null, kind: 'bool' },
  camara_360:                { group: 'tecnologia', unit: null, kind: 'bool' },
  head_up_display:           { group: 'tecnologia', unit: null, kind: 'bool' },
  climatizador:              { group: 'tecnologia', unit: null, kind: 'text' },
  asientos_calefactados:     { group: 'tecnologia', unit: null, kind: 'bool' },
  asientos_ventilados:       { group: 'tecnologia', unit: null, kind: 'bool' },
  techo_panoramico:          { group: 'tecnologia', unit: null, kind: 'bool' },
};
