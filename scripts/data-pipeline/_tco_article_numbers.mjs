#!/usr/bin/env node
// Datos concretos para el artículo del umbral de 45k.
import fs from 'node:fs';
import { bevFromJson, iceFromJson } from '../../src/lib/tco/resolver.mjs';
import { curvaTCO } from '../../src/lib/tco/calculadora.mjs';

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const pares = [
  ['bmw-ix1-xdrive30',  'bmw-x1-sdrive18i',       'BMW iX1 xDrive30 vs BMW X1 sDrive18i'],
  ['bmw-ix2-xdrive30',  'bmw-x1-sdrive18i',       'BMW iX2 xDrive30 vs BMW X1 sDrive18i'],
  ['mercedes-eqa-250+', 'volkswagen-tiguan-tsi',  'Mercedes EQA 250+ vs VW Tiguan'],
  ['tesla-model-y-rwd-long-range', 'bmw-x3-xdrive20i', 'Tesla Model Y RWD LR vs BMW X3'],
];
for (const [bevSlug, iceSlug, label] of pares) {
  const bevJson = read(`data/coches/${bevSlug}.json`);
  const iceJson = read(`data/referencias/ice-equivalentes/${iceSlug}.json`);
  const bev = bevFromJson(bevJson, { horizonte_anios: 5, aplicar_ayuda: true });
  const ice = iceFromJson(iceJson, { horizonte_anios: 5 });
  const curva = curvaTCO(bev, ice, {}, { horizonte_max: 5, granularidad_anios: 1 });
  console.log(`\n${label}`);
  console.log(`  PVP BEV: ${bev.pvp_eur}€, ayuda: ${bev.ayuda_eur}€, efectivo: ${bev.pvp_eur - bev.ayuda_eur}€`);
  console.log(`  PVP ICE: ${ice.pvp_eur}€`);
  for (const p of curva.puntos) {
    const diff = Math.round(p.tco_bev - p.tco_ice);
    const tag = diff < 0 ? '  BEV GANA' : '  ICE gana';
    console.log(`  t=${p.anio}y: BEV=${Math.round(p.tco_bev).toLocaleString('es-ES')}€  ICE=${Math.round(p.tco_ice).toLocaleString('es-ES')}€  Δ=${diff >= 0 ? '+' : ''}${diff.toLocaleString('es-ES')}€${tag}`);
  }
  console.log(`  final: rentable_desde_inicio=${curva.rentable_desde_inicio}, rentable_al_final=${curva.rentable_al_final}, breakeven=${curva.breakeven_anio}, perdida=${curva.perdida_rentabilidad_anio}`);
}
