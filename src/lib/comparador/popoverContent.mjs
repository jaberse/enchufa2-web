// src/lib/comparador/popoverContent.mjs
// Renderers de contenido para los 3 popovers del comparador:
//   - confianza TCO (por BEV seleccionado)
//   - metodología TCO (genérica, fórmula + parámetros)
//   - fiabilidad (genérica, fuentes + escala)
//
// Todas las cadenas son autocontenidas y serializables. Reciben los datos
// mínimos y devuelven el HTML del popover completo (head + body + foot).
// El layout/estilo lo pone global.css vía la clase .pop__*.

const fmtEur0 = (n) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  })
    .format(Math.round(n))
    .replace('-', '\u2212');

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

function confDot(nivel) {
  const n = nivel || 'media';
  const cls =
    n === 'alta' ? 'pop__dot--alta'
    : n === 'baja' ? 'pop__dot--baja'
    : 'pop__dot--media';
  return `<span class="pop__dot ${cls}" aria-hidden="true"></span>`;
}

function nivelLabel(n) {
  if (n === 'alta') return 'Alta';
  if (n === 'baja') return 'Baja';
  return 'Media';
}

const NIVEL_MARGEN = { alta: '±0%', media: '±8%', baja: '±15%' };

function wrap(titulo, body, footer = '') {
  return `
    <div class="pop__head">
      <p class="pop__title" id="pop-title">${escapeHtml(titulo)}</p>
      <button type="button" class="pop__close" data-pop-close aria-label="Cerrar">×</button>
    </div>
    <div class="pop__body">${body}</div>
    ${footer ? `<div class="pop__foot">${footer}</div>` : ''}
  `;
}

/**
 * Popover de confianza para una tarjeta TCO concreta.
 *
 * @param {Object} params
 * @param {string} params.nombreBev      — marca + modelo del BEV
 * @param {Object} params.input          — InputCoche BEV (con confianzas por partida)
 * @param {Object} params.breakdown      — BreakdownTCO devuelto por calcularTCO()
 * @param {number} [params.anios]        — años del escenario (para copy)
 */
export function popoverConfianza({ nombreBev, input, breakdown, anios }) {
  const niveles = [
    { label: 'Depreciación',  key: 'confianza_depreciacion'  },
    { label: 'Consumo real',  key: 'confianza_consumo'       },
    { label: 'Mantenimiento', key: 'confianza_mantenimiento' },
    { label: 'Seguro',        key: 'confianza_seguro'        },
  ];

  const filas = niveles
    .map((n) => {
      const v = input[n.key] || 'media';
      return `
        <li class="pop__partida">
          <span class="pop__partida-lbl">${escapeHtml(n.label)}</span>
          <span class="pop__partida-val">
            ${confDot(v)}
            ${escapeHtml(nivelLabel(v))}
          </span>
        </li>
      `;
    })
    .join('');

  const margen = breakdown.margen_pct || 0;
  const margenTxt =
    margen === 0 ? '±0%' : margen <= 0.08 ? '±8%' : '±15%';
  const nivelGlobal =
    margen === 0 ? 'alta' : margen <= 0.08 ? 'media' : 'baja';

  const centro = breakdown.tco_total_eur;
  const minE = breakdown.tco_total_min_eur;
  const maxE = breakdown.tco_total_max_eur;

  const aniosTxt = anios ? `${anios} años` : 'horizonte elegido';
  const body = `
    <p class="pop__lead">
      ${escapeHtml(nombreBev)} — escenario a ${escapeHtml(String(aniosTxt))}.
    </p>
    <p>
      La confianza global es <strong>${escapeHtml(nivelLabel(nivelGlobal))}</strong>:
      el peor nivel entre las cuatro partidas. Eso produce una banda
      de incertidumbre de <strong>${margenTxt}</strong> sobre el total.
    </p>
    <div class="pop__range">
      <span class="pop__range-lbl">Rango estimado</span>
      <span class="pop__range-val">
        <span>${fmtEur0(minE)}</span>
        <span class="pop__range-sep" aria-hidden="true">—</span>
        <span>${fmtEur0(maxE)}</span>
      </span>
      <span class="pop__range-center">centro ${fmtEur0(centro)}</span>
    </div>
    <p class="pop__partidas-hdr">Confianza por partida</p>
    <ul class="pop__partidas">${filas}</ul>
    <p class="pop__small">
      Bandas: ±0% confianza alta · ±8% media · ±15% baja. El margen
      agregado es el peor de los cuatro (no la suma).
    </p>
  `;

  const foot = `
    <a class="pop__link" href="/metodologia" target="_blank" rel="noopener">
      Ver metodología completa →
    </a>
  `;

  return wrap('Confianza y banda de incertidumbre', body, foot);
}

/**
 * Popover de metodología TCO general (no depende de coche).
 *
 * @param {Object} params
 * @param {Object} params.perfil  — PERFIL_ESTANDAR del loader
 * @param {number} params.anios   — años del escenario actual
 */
export function popoverMetodologia({ perfil, anios }) {
  const body = `
    <p>
      El <strong>TCO</strong> es el coste total de tener un coche durante
      ${escapeHtml(String(anios))} años. Sigue la fórmula canónica ICCT:
    </p>
    <p class="pop__formula">
      TCO = Depreciación + Energía + Mantenimiento + Seguro + Impuestos − Ayudas
    </p>
    <ul class="pop__list">
      <li><strong>Depreciación</strong> — curva Ganvam por segmento + ajustes por plataforma y química de batería.</li>
      <li><strong>Energía</strong> — consumo WLTP × factor real (ICCT + EV Database) × precio €/kWh (BEV) o €/L (ICE).</li>
      <li><strong>Mantenimiento</strong> — plan oficial del fabricante a intervalos reales.</li>
      <li><strong>Seguro</strong> — mediana de 3 cotizaciones con el perfil estándar enchufa2 (Madrid, 40 años, 5 años carné).</li>
      <li><strong>Impuestos</strong> — IVTM tipo medio España.</li>
      <li><strong>Ayudas</strong> — Plan Auto+ 2026 según país de ensamblaje y umbral 45.000 €.</li>
    </ul>
    <p class="pop__small">
      Perfil estándar: ${escapeHtml(String(perfil.km_anual))} km/año,
      ${escapeHtml(String(perfil.precio_kwh_eur))} €/kWh,
      ${escapeHtml(String(perfil.precio_litro_eur))} €/L. Editable
      desde la barra de escenario.
    </p>
  `;
  const foot = `
    <a class="pop__link" href="/metodologia" target="_blank" rel="noopener">
      Ver página de metodología →
    </a>
  `;
  return wrap('Cómo calculamos el coste total', body, foot);
}

/**
 * Popover de fiabilidad (metodología general, no depende de coche).
 */
export function popoverFiabilidad() {
  const body = `
    <p>
      La estrella de fiabilidad responde a <em>"¿qué dicen los informes
      técnicos independientes sobre averías reales de este modelo?"</em>
    </p>
    <p class="pop__partidas-hdr">Fuentes canónicas</p>
    <ul class="pop__list">
      <li>
        <strong>TÜV Report</strong> — defectos detectados en la ITV
        alemana. Base de cientos de miles de vehículos, por modelo y
        clase de edad.
      </li>
      <li>
        <strong>ADAC Pannenstatistik</strong> — averías en carretera que
        requieren asistencia, por cada 1.000 vehículos matriculados.
      </li>
    </ul>
    <p>
      La nota va de <strong>0 a 5 estrellas</strong> combinando ambas
      fuentes a nivel de modelo (no de marca). Si no hay datos públicos
      del modelo, aparece <em>sin datos</em> — nunca se rellena.
    </p>
    <p class="pop__small">
      Solo usamos fuentes gratuitas y verificables. No usamos encuestas
      de foros, YouTube ni datos de pago. Cada estrella es trazable.
    </p>
  `;
  const foot = `
    <a class="pop__link" href="/metodologia" target="_blank" rel="noopener">
      Ver metodología completa →
    </a>
  `;
  return wrap('Cómo puntuamos la fiabilidad', body, foot);
}
