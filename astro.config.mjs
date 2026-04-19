import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://enchufa2.com',
  // Redirects legacy: /calculadora-tco se fusionó con /comparador (modo TCO)
  // en abril 2026. Mantenemos la URL viva porque varios artículos publicados
  // la enlazan (escalon-plan-auto-45k, etc.).
  redirects: {
    '/calculadora-tco': '/comparador?mode=tco',
  },
});
