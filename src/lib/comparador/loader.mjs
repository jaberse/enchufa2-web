// src/lib/comparador/loader.mjs
// Loader del comparador unificado (Specs + TCO).
//
// Produce dos estructuras consumidas por src/pages/comparador.astro:
//   - catalogoSpecs : 63 BEV con los campos necesarios para la tabla de specs.
//   - paresTCO      : 20 pares BEV↔ICE con InputCoche precomputado por horizonte,
//                     listos para recalcular TCO en cliente con calcularTCO().
//
// Se mantiene cerca de los patrones ya validados en calculadora-tco.astro:
// mismo uso de bevFromJson / iceFromJson y de los 8 horizontes 2..10 años.

import fs from 'node:fs';
import path from 'node:path';
import { bevFromJson, iceFromJson } from '../tco/resolver.mjs';

const ROOT = process.cwd();

/** Lee un JSON relativo a la raíz del repo. */
function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

/** Lista de ficheros BEV válidos en data/coches. */
function listBevFiles() {
  const dir = path.join(ROOT, 'data/coches');
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort();
}

/** Extrae el valor de un campo enchufa2-schema (soporta primitivos). */
function pickValor(field) {
  if (field == null) return null;
  if (typeof field !== 'object' || Array.isArray(field)) return field;
  return field.valor ?? null;
}

/** Horizontes disponibles para el slider del escenario TCO. */
export const HORIZONTES_DISPONIBLES = [2, 3, 4, 5, 6, 7, 8, 10];

/** Perfil estándar (para mostrar en UI). */
export const PERFIL_ESTANDAR = Object.freeze({
  km_anual: 15000,
  horizonte_anios: 5,
  precio_kwh_eur: 0.17,
  precio_litro_eur: 1.55,
});

// ──────────────────────────────────────────────────────────────────────
// 1) CATÁLOGO SPECS — todos los BEV del repo (~63 modelos).
// ──────────────────────────────────────────────────────────────────────

export function cargarCatalogoSpecs() {
  const files = listBevFiles();
  return files.map((f) => {
    const json = readJson(`data/coches/${f}`);
    const s = json.specs ?? {};
    const slug = json.slug ?? f.replace(/\.json$/, '');
    const foto = `/comparador/${slug}.webp`;
    return {
      id: json.id ?? slug,
      slug,
      marca: json.marca,
      modelo: json.modelo,
      variante: json.variante ?? '',
      nombre: `${json.marca} ${json.modelo}${json.variante ? ' ' + json.variante : ''}`,
      segmento: json.segmento ?? null,
      foto,
      // Specs clave para la vista tabular:
      pvp_eur: pickValor(s.pvp),
      pvp_con_plan_auto_eur: pickValor(s.pvp_con_plan_auto_eur),
      ayuda_plan_auto_eur: pickValor(s.ayuda_plan_auto_eur) ?? 0,
      autonomia_wltp_km: pickValor(s.autonomia_wltp_km),
      consumo_wltp_kwh100km: pickValor(s.consumo_wltp_kwh100km),
      bateria_neta_kwh: pickValor(s.bateria_neta_kwh),
      quimica: pickValor(s.quimica),
      potencia_cv: pickValor(s.potencia_cv),
      carga_dc_max_kw: pickValor(s.carga_dc_max_kw),
      t_10_80_min: pickValor(s.t_10_80_min),
      plazas: pickValor(s.plazas),
      maletero_l: pickValor(s.maletero_l),
      largo_mm: pickValor(s.largo_mm),
      carroceria: pickValor(s.carroceria),
      traccion: pickValor(s.traccion),
      fiabilidad_estrellas: pickValor(s.fiabilidad_estrellas),
      // Campos adicionales para filtros / vista avanzada:
      pais_ensamblaje: pickValor(s.pais_ensamblaje),
      bateria_ensamblaje_ue: pickValor(s.bateria_ensamblaje_ue),
      voltaje: pickValor(s.voltaje),
      bomba_calor: pickValor(s.bomba_calor),
      garantia_bateria_anos: pickValor(s.garantia_bateria_anos),
      garantia_vehiculo_anos: pickValor(s.garantia_vehiculo_anos),
      carga_ac_max_kw: pickValor(s.carga_ac_max_kw),
      peso_kg: pickValor(s.peso_kg),
      aceleracion_0_100_s: pickValor(s.aceleracion_0_100_s),
      plan_auto_elegible: pickValor(s.plan_auto_elegible),
      tren: 'BEV',
    };
  });
}

// ──────────────────────────────────────────────────────────────────────
// 2) PARES TCO — 20 BEV↔ICE con InputCoche por horizonte.
//
// Se replica la tabla de pares de src/pages/calculadora-tco.astro. Si el
// usuario selecciona un BEV que no está en esta lista dentro de la vista
// TCO, el front marca la tarjeta como "TCO no disponible" y sugiere el
// rival equivalente por segmento.
// ──────────────────────────────────────────────────────────────────────

const PARES_CANONICOS = [
  { bev: 'tesla-model-3-rwd-highland',    ice: 'bmw-320i-sedan' },
  { bev: 'tesla-model-y-rwd-long-range',  ice: 'bmw-x3-xdrive20i' },
  { bev: 'hyundai-kona-electric-65-kwh',  ice: 'volkswagen-tiguan-tsi' },
  { bev: 'skoda-elroq-60',                ice: 'volkswagen-tiguan-tsi' },
  { bev: 'kia-ev3-long-range',            ice: 'volkswagen-tiguan-tsi' },
  { bev: 'bmw-ix1-xdrive30',              ice: 'bmw-x1-sdrive18i' },
  { bev: 'bmw-ix2-xdrive30',              ice: 'bmw-x1-sdrive18i' },
  { bev: 'mercedes-eqa-250+',             ice: 'volkswagen-tiguan-tsi' },
  { bev: 'toyota-bz4x-fwd',               ice: 'volkswagen-tiguan-tsi' },
  { bev: 'byd-atto-3-comfort',            ice: 'volkswagen-tiguan-tsi' },
  { bev: 'byd-atto-2-comfort',            ice: 'peugeot-2008-puretech' },
  { bev: 'byd-seal-awd-excellence',       ice: 'bmw-320i-sedan' },
  { bev: 'byd-dolphin-60kwh',             ice: 'dacia-sandero-tce' },
  { bev: 'jeep-avenger-electric',         ice: 'peugeot-2008-puretech' },
  { bev: 'peugeot-e-2008-allure',         ice: 'peugeot-2008-puretech' },
  { bev: 'renault-5-e-tech-comfort-range', ice: 'dacia-sandero-tce' },
  { bev: 'citroen-e-c3-you',              ice: 'citroen-c3-puretech-100' },
  { bev: 'dacia-spring-essential',        ice: 'hyundai-i10-mpi' },
  { bev: 'byd-dolphin-surf-comfort',      ice: 'hyundai-i10-mpi' },
  { bev: 'hyundai-inster-long-range',     ice: 'hyundai-i10-mpi' },
];

export function cargarParesTCO() {
  return PARES_CANONICOS.map((p) => {
    const bevJson = readJson(`data/coches/${p.bev}.json`);
    const iceJson = readJson(`data/referencias/termicos-equivalentes/${p.ice}.json`);
    const horizontes = {};
    for (const h of HORIZONTES_DISPONIBLES) {
      horizontes[h] = {
        bev: bevFromJson(bevJson, { horizonte_anios: h, aplicar_ayuda: true }),
        ice: iceFromJson(iceJson, { horizonte_anios: h }),
      };
    }
    const h5 = horizontes[5];
    return {
      slug: p.bev,
      iceSlug: p.ice,
      marca: bevJson.marca,
      modelo: bevJson.modelo,
      variante: bevJson.variante ?? '',
      nombreBev: `${bevJson.marca} ${bevJson.modelo}${bevJson.variante ? ' ' + bevJson.variante : ''}`,
      nombreIce: `${iceJson.marca} ${iceJson.modelo}${iceJson.variante ? ' ' + iceJson.variante : ''}`.trim(),
      segmento: bevJson.segmento ?? null,
      foto: `/comparador/${p.bev}.webp`,
      horizontes,
      ayuda_eur: h5.bev.ayuda_eur ?? 0,
    };
  });
}

// ──────────────────────────────────────────────────────────────────────
// 3) CATÁLOGO COMPLETO DE TÉRMICOS — archivos de termicos-equivalentes/ con
//    InputCoche precomputado por horizonte. Sirve para que el usuario
//    pueda elegir el rival a mano en la tarjeta TCO.
//    Incluye ICE, HEV y PHEV (metodología v2, 2026-04-20).
// ──────────────────────────────────────────────────────────────────────

function listIceFiles() {
  const dir = path.join(ROOT, 'data/referencias/termicos-equivalentes');
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort();
}

export function cargarTodosIces() {
  const files = listIceFiles();
  return files.map((f) => {
    const json = readJson(`data/referencias/termicos-equivalentes/${f}`);
    const iceSlug = json.slug ?? f.replace(/\.json$/, '');
    const horizontes = {};
    for (const h of HORIZONTES_DISPONIBLES) {
      horizontes[h] = iceFromJson(json, { horizonte_anios: h });
    }
    return {
      iceSlug,
      marca: json.marca,
      modelo: json.modelo,
      variante: json.variante ?? '',
      nombre: `${json.marca} ${json.modelo}${json.variante ? ' ' + json.variante : ''}`.trim(),
      segmento: json.segmento ?? null,
      horizontes,
    };
  });
}

// ──────────────────────────────────────────────────────────────────────
// 4) SLUGS con TCO disponible (para marcar el catálogo Specs).
// ──────────────────────────────────────────────────────────────────────

export function slugsConTCO() {
  return new Set(PARES_CANONICOS.map((p) => p.bev));
}

// ──────────────────────────────────────────────────────────────────────
// 5) DATOS PARA CLIENTE — payload JSON serializable embebido en la página.
//
// Estructura:
//   {
//     catalogoSpecs: SpecsCar[],             // 63 BEV con specs para la tabla
//     paresTCO:      { slug → ParCliente },  // 20 pares indexados por slug BEV
//     icesTCO:       { iceSlug → IceCliente },// 9 ICE con input por horizonte
//     iceSlugs:      string[],               // orden canónico para el <select>
//     slugsConTCO:   string[],               // mismo set de BEV, serializable
//     perfil:        PERFIL_ESTANDAR,
//     horizontes:    HORIZONTES_DISPONIBLES,
//   }
//
// Pensado para inyectarse como <script type="application/json"> en la página
// y ser consumido por src/lib/comparador/client.mjs.
// ──────────────────────────────────────────────────────────────────────

export function cargarDatosCliente() {
  const catalogoSpecs = cargarCatalogoSpecs();
  const pares = cargarParesTCO();
  const paresTCO = {};
  for (const p of pares) {
    paresTCO[p.slug] = {
      slug: p.slug,
      iceSlug: p.iceSlug,
      marca: p.marca,
      modelo: p.modelo,
      variante: p.variante,
      nombreBev: p.nombreBev,
      nombreIce: p.nombreIce,
      segmento: p.segmento,
      foto: p.foto,
      horizontes: p.horizontes,
      ayuda_eur: p.ayuda_eur,
    };
  }
  const ices = cargarTodosIces();
  const icesTCO = {};
  for (const i of ices) {
    icesTCO[i.iceSlug] = {
      iceSlug: i.iceSlug,
      marca: i.marca,
      modelo: i.modelo,
      variante: i.variante,
      nombre: i.nombre,
      segmento: i.segmento,
      horizontes: i.horizontes,
    };
  }
  return {
    catalogoSpecs,
    paresTCO,
    icesTCO,
    iceSlugs: ices.map((i) => i.iceSlug),
    slugsConTCO: pares.map((p) => p.slug),
    perfil: PERFIL_ESTANDAR,
    horizontes: HORIZONTES_DISPONIBLES,
  };
}
