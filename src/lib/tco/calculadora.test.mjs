// src/lib/tco/calculadora.test.mjs
// Tests unitarios de la calculadora TCO.
// Ejecutar: npm run test:tco
//
// Validan los tres pilotos manuales documentados en /docs/piloto-{1,2,3}-tco-calculo-manual.md.
// Tolerancia ±1 € (redondeo decimal en los documentos).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { calcularTCO, compararTCO, curvaTCO, depreciacionFraccion } from './calculadora.mjs';
import { bevFromJson, iceFromJson } from './resolver.mjs';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..', '..', '..');
const EUR = 1; // tolerancia ±1 €

/** @param {number} a @param {number} b @param {number} [tol] */
function eur(a, b, tol = EUR) {
  assert.ok(
    Math.abs(a - b) <= tol,
    `esperado ${b} €, obtenido ${a.toFixed(2)} € (Δ=${(a - b).toFixed(2)})`,
  );
}

// ────────────────────────────────────────────────────────────────
// Piloto 1 — Citroën ë-C3 vs C3 PureTech 100 (mass-market, sin ayuda)
// docs/piloto-1-tco-calculo-manual.md
// Nota: IVTM uniforme 80 €/año (decisión editorial del piloto 1).
// ────────────────────────────────────────────────────────────────

test('Piloto 1 — ë-C3 sin Plan Auto+ (TCO 5 años = 19.982 €)', () => {
  const tco = calcularTCO(
    {
      tren: 'BEV',
      pvp_eur: 23_800,
      ayuda_eur: 0,
      consumo_wltp: 15.9,
      consumo_real_factor: 1.18,
      depreciacion_pct: 0.625,
      mantenimiento_anual_eur: 150,
      seguro_anual_eur: 313,
    },
    { ivtm_bev_eur: 80 },
  );
  eur(tco.depreciacion_eur, 14_875);
  eur(tco.energia_eur, 2_392, 2); // redondeo consumo_real 18,76
  eur(tco.mantenimiento_eur, 750);
  eur(tco.seguro_eur, 1_565);
  eur(tco.impuestos_eur, 400);
  eur(tco.tco_total_eur, 19_982, 3);
  eur(tco.tco_por_km_eur, 0.266, 0.001);
});

test('Piloto 1 — C3 PureTech 100 (TCO 5 años = 19.624 €)', () => {
  const tco = calcularTCO(
    {
      tren: 'ICE',
      pvp_eur: 17_426,
      consumo_wltp: 5.6,
      consumo_real_factor: 1.10,
      depreciacion_pct: 0.45,
      mantenimiento_anual_eur: 350,
      seguro_anual_eur: 494,
    },
    { ivtm_ice_eur: 80 },
  );
  eur(tco.depreciacion_eur, 7_842, 2);
  eur(tco.energia_eur, 7_161, 2);
  eur(tco.mantenimiento_eur, 1_750);
  eur(tco.seguro_eur, 2_470);
  eur(tco.impuestos_eur, 400);
  eur(tco.tco_total_eur, 19_623, 3);
  eur(tco.tco_por_km_eur, 0.262, 0.001);
});

// ────────────────────────────────────────────────────────────────
// Piloto 2 — BMW iX1 xDrive30 vs X1 sDrive18i (premium intra-marca)
// docs/piloto-2-tco-calculo-manual.md
// Usa IVTM 40/90 del perfil enchufa2 estándar.
// ────────────────────────────────────────────────────────────────

test('Piloto 2 — iX1 xDrive30 (TCO 5 años = 24.580 €, iX1 no elegible >45k€)', () => {
  const tco = calcularTCO({
    tren: 'BEV',
    pvp_eur: 53_600,
    ayuda_eur: 0,
    consumo_wltp: 17.5,
    consumo_real_factor: 1.20,
    depreciacion_pct: 0.32,
    mantenimiento_anual_eur: 230,
    seguro_anual_eur: 680,
  });
  eur(tco.depreciacion_eur, 17_152);
  eur(tco.energia_eur, 2_678, 2);
  eur(tco.tco_total_eur, 24_580, 3);
  eur(tco.tco_por_km_eur, 0.328, 0.001);
});

test('Piloto 2 — X1 sDrive18i (TCO 5 años = 34.234 €)', () => {
  const tco = calcularTCO({
    tren: 'ICE',
    pvp_eur: 47_636,
    consumo_wltp: 6.4,
    consumo_real_factor: 1.15,
    depreciacion_pct: 0.42,
    mantenimiento_anual_eur: 450,
    seguro_anual_eur: 594,
  });
  eur(tco.depreciacion_eur, 20_007, 2);
  eur(tco.energia_eur, 8_557, 2);
  eur(tco.tco_total_eur, 34_234, 3);
});

test('Piloto 2 — compararTCO: iX1 ahorra 9.654 € (28,2 %)', () => {
  const cmp = compararTCO(
    {
      tren: 'BEV',
      pvp_eur: 53_600,
      consumo_wltp: 17.5,
      consumo_real_factor: 1.20,
      depreciacion_pct: 0.32,
      mantenimiento_anual_eur: 230,
      seguro_anual_eur: 680,
    },
    {
      tren: 'ICE',
      pvp_eur: 47_636,
      consumo_wltp: 6.4,
      consumo_real_factor: 1.15,
      depreciacion_pct: 0.42,
      mantenimiento_anual_eur: 450,
      seguro_anual_eur: 594,
    },
  );
  eur(cmp.ahorro_bev_eur, 9_654, 3);
  assert.ok(
    Math.abs(cmp.ahorro_bev_pct - 0.282) < 0.002,
    `ahorro_pct esperado ≈0,282, obtenido ${cmp.ahorro_bev_pct.toFixed(3)}`,
  );
});

// ────────────────────────────────────────────────────────────────
// Piloto 3 — Tesla Model 3 RWD Highland vs BMW 320i (benchmark segmento D)
// docs/piloto-3-tco-calculo-manual.md
// ────────────────────────────────────────────────────────────────

test('Piloto 3 — Tesla Model 3 RWD con Plan Auto+ 3.375 € (TCO 5 años = 19.305 €)', () => {
  const tco = calcularTCO({
    tren: 'BEV',
    pvp_eur: 36_990,
    ayuda_eur: 3_375,
    consumo_wltp: 13.2,
    consumo_real_factor: 1.12,
    depreciacion_pct: 0.45,
    mantenimiento_anual_eur: 90,
    seguro_anual_eur: 700,
  });
  eur(tco.depreciacion_eur, 16_645, 2);
  eur(tco.energia_eur, 1_884, 2);
  eur(tco.ayudas_eur, 3_375);
  eur(tco.tco_total_eur, 19_304, 3);
});

test('Piloto 3 — Tesla Model 3 RWD sin ayuda (TCO 5 años = 22.680 €)', () => {
  const tco = calcularTCO({
    tren: 'BEV',
    pvp_eur: 36_990,
    ayuda_eur: 0,
    consumo_wltp: 13.2,
    consumo_real_factor: 1.12,
    depreciacion_pct: 0.45,
    mantenimiento_anual_eur: 90,
    seguro_anual_eur: 700,
  });
  eur(tco.tco_total_eur, 22_679, 3);
});

test('Piloto 3 — BMW 320i Sedan (TCO 5 años = 36.808 €)', () => {
  const tco = calcularTCO({
    tren: 'ICE',
    pvp_eur: 49_814,
    consumo_wltp: 6.5,
    consumo_real_factor: 1.15,
    depreciacion_pct: 0.44,
    mantenimiento_anual_eur: 500,
    seguro_anual_eur: 650,
  });
  eur(tco.depreciacion_eur, 21_918, 2);
  eur(tco.energia_eur, 8_690, 2);
  eur(tco.tco_total_eur, 36_808, 3);
});

test('Piloto 3 — compararTCO con ayuda: Tesla ahorra 47,6 %', () => {
  const cmp = compararTCO(
    {
      tren: 'BEV',
      pvp_eur: 36_990,
      ayuda_eur: 3_375,
      consumo_wltp: 13.2,
      consumo_real_factor: 1.12,
      depreciacion_pct: 0.45,
      mantenimiento_anual_eur: 90,
      seguro_anual_eur: 700,
    },
    {
      tren: 'ICE',
      pvp_eur: 49_814,
      consumo_wltp: 6.5,
      consumo_real_factor: 1.15,
      depreciacion_pct: 0.44,
      mantenimiento_anual_eur: 500,
      seguro_anual_eur: 650,
    },
  );
  eur(cmp.ahorro_bev_eur, 17_503, 3);
  assert.ok(
    Math.abs(cmp.ahorro_bev_pct - 0.476) < 0.002,
    `ahorro_pct esperado ≈0,476, obtenido ${cmp.ahorro_bev_pct.toFixed(3)}`,
  );
});

// ────────────────────────────────────────────────────────────────
// Resolver end-to-end: carga JSON reales y reproduce Piloto 3.
// ────────────────────────────────────────────────────────────────

test('Resolver — Tesla Model 3 JSON real + BMW 320i JSON → cifras del Piloto 3', () => {
  const tesla = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, 'data', 'coches', 'tesla-model-3-rwd-highland.json'),
      'utf8',
    ),
  );
  const bmw = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, 'data', 'referencias', 'ice-equivalentes', 'bmw-320i-sedan.json'),
      'utf8',
    ),
  );

  const cmp = compararTCO(bevFromJson(tesla), iceFromJson(bmw));

  // Coherencia con el Piloto 3 (con ayuda Plan Auto+ aplicada por defecto).
  eur(cmp.bev.tco_total_eur, 19_304, 5);
  eur(cmp.ice.tco_total_eur, 36_808, 5);
  eur(cmp.ahorro_bev_eur, 17_503, 10);
});

// ────────────────────────────────────────────────────────────────
// Propiedades estructurales
// ────────────────────────────────────────────────────────────────

test('Propiedad — margen_pct es el máximo de los márgenes individuales', () => {
  const tco = calcularTCO({
    tren: 'BEV',
    pvp_eur: 30_000,
    consumo_wltp: 15,
    consumo_real_factor: 1.15,
    depreciacion_pct: 0.4,
    mantenimiento_anual_eur: 150,
    seguro_anual_eur: 500,
    confianza_depreciacion: 'baja',
    confianza_mantenimiento: 'alta',
    confianza_seguro: 'media',
    confianza_consumo: 'alta',
  });
  assert.equal(tco.margen_pct, 0.15);
  eur(tco.tco_total_min_eur, tco.tco_total_eur * 0.85, 0.01);
  eur(tco.tco_total_max_eur, tco.tco_total_eur * 1.15, 0.01);
});

test('Propiedad — horizonte 3 años da km totales 45.000', () => {
  const tco = calcularTCO(
    {
      tren: 'BEV',
      pvp_eur: 30_000,
      consumo_wltp: 15,
      consumo_real_factor: 1.15,
      depreciacion_pct: 0.25,
      mantenimiento_anual_eur: 100,
      seguro_anual_eur: 500,
    },
    { horizonte_anios: 3 },
  );
  assert.equal(tco.km_totales, 45_000);
});

test('Propiedad — ICE ignora el campo ayuda_eur (aunque se pase)', () => {
  const tco = calcularTCO({
    tren: 'ICE',
    pvp_eur: 30_000,
    // @ts-expect-error — ICE no debería aceptar ayuda, pero lo ignora silenciosamente
    ayuda_eur: 5_000,
    consumo_wltp: 6,
    consumo_real_factor: 1.1,
    depreciacion_pct: 0.4,
    mantenimiento_anual_eur: 300,
    seguro_anual_eur: 400,
  });
  assert.equal(tco.ayudas_eur, 0);
});

// ────────────────────────────────────────────────────────────────
// Curva TCO acumulada y break-even (Gráfico §7.2)
// ────────────────────────────────────────────────────────────────

test('depreciacionFraccion — anchors exactos en t=0, 3, 5, 10', () => {
  const coche = {
    tren: 'BEV', pvp_eur: 30_000, consumo_wltp: 15, consumo_real_factor: 1.15,
    depreciacion_pct: 0.5, mantenimiento_anual_eur: 150, seguro_anual_eur: 500,
    depreciacion_anchors: { y3: 0.36, y5: 0.50, y10: 0.70 },
  };
  eur(depreciacionFraccion(coche, 0) * 1000, 0, 0.01);
  eur(depreciacionFraccion(coche, 3) * 1000, 360, 0.01);
  eur(depreciacionFraccion(coche, 5) * 1000, 500, 0.01);
  eur(depreciacionFraccion(coche, 10) * 1000, 700, 0.01);
  eur(depreciacionFraccion(coche, 15) * 1000, 700, 0.01);
});

test('depreciacionFraccion — interpolación lineal en tramos intermedios', () => {
  const coche = {
    tren: 'BEV', pvp_eur: 30_000, consumo_wltp: 15, consumo_real_factor: 1.15,
    depreciacion_pct: 0.5, mantenimiento_anual_eur: 150, seguro_anual_eur: 500,
    depreciacion_anchors: { y3: 0.30, y5: 0.50, y10: 0.70 },
  };
  eur(depreciacionFraccion(coche, 1) * 1000, 100, 0.01);
  eur(depreciacionFraccion(coche, 4) * 1000, 400, 0.01);
  eur(depreciacionFraccion(coche, 7.5) * 1000, 600, 0.01);
});

test('curvaTCO — coherente con calcularTCO al horizonte del perfil', () => {
  const bev = bevFromJson(
    JSON.parse(fs.readFileSync(path.join(ROOT, 'data/coches/tesla-model-3-rwd-highland.json'), 'utf8')),
    { horizonte_anios: 5, aplicar_ayuda: true },
  );
  const ice = iceFromJson(
    JSON.parse(fs.readFileSync(path.join(ROOT, 'data/referencias/ice-equivalentes/bmw-320i-sedan.json'), 'utf8')),
    { horizonte_anios: 5 },
  );
  const bk_bev = calcularTCO(bev, { horizonte_anios: 5 });
  const bk_ice = calcularTCO(ice, { horizonte_anios: 5 });
  const curva = curvaTCO(bev, ice, {}, { horizonte_max: 5, granularidad_anios: 0.25 });
  const ultimo = curva.puntos[curva.puntos.length - 1];
  eur(ultimo.anio, 5, 0.001);
  eur(ultimo.tco_bev, bk_bev.tco_total_eur, 1);
  eur(ultimo.tco_ice, bk_ice.tco_total_eur, 1);
});

test('curvaTCO — t=0: BEV arranca en −ayuda (Plan Auto+), ICE arranca en 0', () => {
  const bev = {
    tren: 'BEV', pvp_eur: 40_000, ayuda_eur: 4_500, consumo_wltp: 15,
    consumo_real_factor: 1.15, depreciacion_pct: 0.5,
    mantenimiento_anual_eur: 150, seguro_anual_eur: 500,
    depreciacion_anchors: { y3: 0.36, y5: 0.50, y10: 0.70 },
  };
  const ice = {
    tren: 'ICE', pvp_eur: 30_000, consumo_wltp: 6, consumo_real_factor: 1.1,
    depreciacion_pct: 0.5, mantenimiento_anual_eur: 300, seguro_anual_eur: 500,
    depreciacion_anchors: { y3: 0.40, y5: 0.55, y10: 0.75 },
  };
  const c = curvaTCO(bev, ice);
  const t0 = c.puntos[0];
  eur(t0.anio, 0, 0.001);
  eur(t0.tco_bev, -4_500, 0.01);
  eur(t0.tco_ice, 0, 0.01);
});

test('curvaTCO — monotonicidad: TCO acumulado nunca decrece tras t=0', () => {
  const bev = {
    tren: 'BEV', pvp_eur: 40_000, ayuda_eur: 4_500, consumo_wltp: 15,
    consumo_real_factor: 1.15, depreciacion_pct: 0.5,
    mantenimiento_anual_eur: 150, seguro_anual_eur: 500,
    depreciacion_anchors: { y3: 0.36, y5: 0.50, y10: 0.70 },
  };
  const ice = {
    tren: 'ICE', pvp_eur: 30_000, consumo_wltp: 6, consumo_real_factor: 1.1,
    depreciacion_pct: 0.5, mantenimiento_anual_eur: 300, seguro_anual_eur: 500,
    depreciacion_anchors: { y3: 0.40, y5: 0.55, y10: 0.75 },
  };
  const c = curvaTCO(bev, ice, {}, { horizonte_max: 5, granularidad_anios: 0.1 });
  for (let i = 2; i < c.puntos.length; i++) {
    assert.ok(
      c.puntos[i].tco_bev >= c.puntos[i - 1].tco_bev - 0.01,
      `BEV decrece en t=${c.puntos[i].anio}`,
    );
    assert.ok(
      c.puntos[i].tco_ice >= c.puntos[i - 1].tco_ice - 0.01,
      `ICE decrece en t=${c.puntos[i].anio}`,
    );
  }
});

test('curvaTCO — break-even del Tesla Model 3 con Plan Auto+ es desde t=0', () => {
  const bev = bevFromJson(
    JSON.parse(fs.readFileSync(path.join(ROOT, 'data/coches/tesla-model-3-rwd-highland.json'), 'utf8')),
    { horizonte_anios: 5, aplicar_ayuda: true },
  );
  const ice = iceFromJson(
    JSON.parse(fs.readFileSync(path.join(ROOT, 'data/referencias/ice-equivalentes/bmw-320i-sedan.json'), 'utf8')),
    { horizonte_anios: 5 },
  );
  const c = curvaTCO(bev, ice, {}, { horizonte_max: 5 });
  assert.equal(c.rentable_desde_inicio, true);
  assert.equal(c.breakeven_anio, 0);
});

test('curvaTCO — empate en t=0 sin ayuda y BEV siempre más caro → sin break-even', () => {
  // Caso real del usuario: BYD Dolphin Surf vs Hyundai i10 con Plan
  // Auto+ desactivado manualmente (toggle OFF). Sin ayuda, ambos
  // arrancan en 0 € y el BEV acumula coste más rápido por
  // depreciación + seguro. No debe reportar break-even ni
  // "rentable_desde_inicio" (el bug previo hacía que el empate en
  // t=0 disparase rentable_desde_inicio=true).
  const bev = bevFromJson(
    JSON.parse(fs.readFileSync(path.join(ROOT, 'data/coches/byd-dolphin-surf-comfort.json'), 'utf8')),
    { horizonte_anios: 3, aplicar_ayuda: false },
  );
  const ice = iceFromJson(
    JSON.parse(fs.readFileSync(path.join(ROOT, 'data/referencias/ice-equivalentes/hyundai-i10-mpi.json'), 'utf8')),
    { horizonte_anios: 3 },
  );
  assert.equal(bev.ayuda_eur ?? 0, 0);

  const c = curvaTCO(bev, ice, {}, { horizonte_max: 3, granularidad_anios: 0.25 });
  const last = c.puntos[c.puntos.length - 1];
  assert.ok(last.tco_bev > last.tco_ice, 'BEV debe ser más caro al final del horizonte');
  assert.equal(c.rentable_desde_inicio, false);
  assert.equal(c.breakeven_anio, null);
});
