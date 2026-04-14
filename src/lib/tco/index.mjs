// src/lib/tco/index.mjs
// Punto de entrada público de la librería TCO.
// Importar desde Astro: `import { compararTCO, bevFromJson, iceFromJson } from '@/lib/tco/index.mjs';`

export { calcularTCO, compararTCO } from './calculadora.mjs';
export { bevFromJson, iceFromJson, pick, v } from './resolver.mjs';
export { PARAMS_ENCHUFA2_ESTANDAR, margenConfianza } from './params.mjs';
