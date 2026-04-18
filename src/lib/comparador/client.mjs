// src/lib/comparador/client.mjs
// Cliente del comparador unificado (vanilla JS, sin frameworks).
//
// Responsabilidades:
//   - Leer el payload JSON embebido en la página (#cmp-data)
//   - Gestionar estado: selection[4], scenario {km, anios, €/kWh casa/fuera, %casa}, mode
//   - Togglear Specs ↔ TCO con animación del thumb amarillo
//   - Abrir/cerrar el modal del garaje (Escape, click fuera, ×)
//   - Filtrar y buscar en el modal; seleccionar coche → actualizar slot
//   - Swap/× en los chips del garaje
//   - Recomputar TCO con motor canónico al cambiar escenario o selección
//   - Re-renderizar los tres bloques del panel TCO: chips, summary, tarjetas
//   - Re-renderizar el panel Specs (tabla con resaltado del mejor por fila)
//
// Para simplificar, el renderizado es "overwrite via innerHTML": cada vez
// que cambia el estado relevante, regeneramos el markup del bloque. El coste
// es bajo porque el DOM es pequeño (4 tarjetas, 10 filas specs).

import { calcularTCO } from '../tco/calculadora.mjs';

// ══════════════════════════════════════════════════════════════════════
// FORMATTERS
// ══════════════════════════════════════════════════════════════════════

const fmtEur = (n) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  })
    .format(Math.round(n))
    .replace('-', '\u2212');

const fmtEurSigned = (n) => (n >= 0 ? '+' : '\u2212') + fmtEur(Math.abs(n));

const fmtNum = (v, d = 0) =>
  v == null || isNaN(v)
    ? '—'
    : new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      }).format(v);

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

const TREN_LABEL = {
  BEV: 'Eléctrico',
  PHEV: 'PHEV',
  HEV: 'Híbrido',
  MHEV: 'Mild-hybrid',
  ICE: 'Combustión',
};

const BADGE_TCO = {
  BEV:  { label: 'ELÉCTRICO',           cls: 'badge--yellow' },
  ICE:  { label: 'GASOLINA',            cls: 'badge--black'  },
  PHEV: { label: 'HÍBRIDO ENCHUFABLE',  cls: 'badge--green'  },
  HEV:  { label: 'HÍBRIDO',             cls: 'badge--outlineGreen' },
  MHEV: { label: 'MILD-HYBRID',         cls: 'badge--outline' },
};

// ══════════════════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════════════════

/** @type {{ catalogoSpecs: any[], paresTCO: Record<string,any>, slugsConTCO: string[], perfil: any, horizontes: number[] }} */
let DATA = null;

const state = {
  selection: [null, null, null, null],   // 4 slugs (null = hueco vacío)
  mode: 'tco',                            // 'tco' | 'specs'
  scenario: {
    km_anual: 15000,
    anios: 5,
    precio_kwh_casa: 0.17,
    precio_kwh_fuera: 0.45,
    pct_casa: 80,
  },
  // Estado del modal: cuando está abierto, editingSlot es 0..3.
  modal: {
    open: false,
    editingSlot: null,
    query: '',
    filter: 'all',
  },
};

// Cache de nodos del DOM referenciados repetidamente.
const dom = {};

// ══════════════════════════════════════════════════════════════════════
// HELPERS DE ESCENARIO
// ══════════════════════════════════════════════════════════════════════

/** Devuelve el horizonte disponible más cercano al valor elegido. */
function horizonteMasCercano(anios) {
  const disponibles = DATA.horizontes;
  let best = disponibles[0];
  let d = Math.abs(anios - best);
  for (const h of disponibles) {
    const dd = Math.abs(anios - h);
    if (dd < d) { d = dd; best = h; }
  }
  return best;
}

/** Precio €/kWh efectivo mezclando casa y fuera según %casa. */
function precioKwhEfectivo() {
  const s = state.scenario;
  const pct = s.pct_casa / 100;
  return s.precio_kwh_casa * pct + s.precio_kwh_fuera * (1 - pct);
}

/** Devuelve los overrides para calcularTCO según el escenario. */
function overridesTCO() {
  const s = state.scenario;
  return {
    km_anual: s.km_anual,
    horizonte_anios: s.anios,
    precio_kwh_eur: precioKwhEfectivo(),
    precio_litro_eur: 1.55,
  };
}

/** InputCoche para BEV/ICE en el horizonte redondeado. */
function inputParaSlug(slug) {
  const par = DATA.paresTCO[slug];
  if (!par) return null;
  const h = horizonteMasCercano(state.scenario.anios);
  return { par, h, bev: par.horizontes[h].bev, ice: par.horizontes[h].ice };
}

/** Cálculo TCO BEV + ICE para un slug, devuelto como estructura cómoda. */
function tcoParaSlug(slug) {
  const ctx = inputParaSlug(slug);
  if (!ctx) return null;
  const ov = overridesTCO();
  const br = calcularTCO(ctx.bev, ov);
  const brIce = calcularTCO(ctx.ice, ov);
  return {
    par: ctx.par,
    input: ctx.bev,
    breakdown: br,
    total: br.tco_total_eur,
    rivalTotal: brIce.tco_total_eur,
    rivalNombre: ctx.par.nombreIce,
  };
}

// ══════════════════════════════════════════════════════════════════════
// RENDER — GARAGE CHIPS
// ══════════════════════════════════════════════════════════════════════

function renderGarageChip(slot, slug) {
  if (!slug) {
    return `
      <button
        type="button"
        class="garage-chip garage-chip--empty"
        data-garage-chip
        data-garage-slot="${slot}"
        data-garage-add
      >
        <span class="garage-chip__plus">+</span>
        <span>Añadir coche</span>
      </button>
    `;
  }
  const par = DATA.paresTCO[slug];
  if (!par) return '';
  const nombre = `${par.marca} ${par.modelo}`;
  const variante = par.variante;
  const tren = 'BEV';
  const pvp = par.horizontes[5].bev.pvp_eur;
  return `
    <div
      class="garage-chip"
      data-garage-chip
      data-garage-slot="${slot}"
      data-garage-slug="${escapeHtml(slug)}"
    >
      <div class="garage-chip__name">${escapeHtml(nombre)}</div>
      <span class="garage-chip__train-inline">
        <span class="garage-chip__train-dot" data-train="${tren}"></span>
        ${escapeHtml(TREN_LABEL[tren])}
      </span>
      <div class="garage-chip__meta">
        <span class="garage-chip__var serif">${escapeHtml(variante)}</span>
        <span class="garage-chip__price tabular">${fmtEur(pvp)}</span>
      </div>
      <div class="garage-chip__controls">
        <button type="button" class="garage-chip__swap" data-garage-swap title="Cambiar" aria-label="Cambiar ${escapeHtml(nombre)}">↻</button>
        <button type="button" class="garage-chip__x" data-garage-remove aria-label="Quitar ${escapeHtml(nombre)}">×</button>
      </div>
    </div>
  `;
}

function renderGarage() {
  if (!dom.garageRow) return;
  dom.garageRow.innerHTML = state.selection
    .map((slug, i) => renderGarageChip(i, slug))
    .join('');
}

// ══════════════════════════════════════════════════════════════════════
// RENDER — TCO PANEL (SUMMARY + CARDS)
// ══════════════════════════════════════════════════════════════════════

function renderTcoCard({ slug, slot, tco, isWinner }) {
  const { par, input, breakdown: br, rivalTotal, rivalNombre } = tco;
  const delta = br.tco_total_eur - rivalTotal;
  const badge = BADGE_TCO.BEV;

  const filas = [
    { key: 'depreciacion',  label: 'Depreciación',              valor: br.depreciacion_eur },
    { key: 'energia',       label: 'Energía',                    valor: br.energia_eur },
    { key: 'mantenimiento', label: 'Mantenimiento',              valor: br.mantenimiento_eur },
    { key: 'seguro',        label: 'Seguro',                     valor: br.seguro_eur },
    { key: 'impuestos',     label: 'Impuestos',                  valor: br.impuestos_eur },
  ];
  if (br.ayudas_eur > 0) {
    filas.push({ key: 'ayudas', label: 'Ayudas Plan Auto+', valor: -br.ayudas_eur });
  }

  const confianzaLabel =
    br.margen_pct === 0 ? 'Alta' : br.margen_pct <= 0.08 ? 'Media' : 'Baja';
  const confianzaCls =
    br.margen_pct === 0 ? 'pill-conf--alta'
    : br.margen_pct <= 0.08 ? 'pill-conf--media'
    : 'pill-conf--baja';

  const deltaTxt =
    delta < 0
      ? `Ahorras <strong>${fmtEur(Math.abs(delta))}</strong> frente al ${escapeHtml(rivalNombre)}.`
      : delta > 0
      ? `Paga <strong>${fmtEur(delta)}</strong> más que el ${escapeHtml(rivalNombre)}.`
      : `Empate con el ${escapeHtml(rivalNombre)}.`;

  return `
    <article
      class="tco-card${isWinner ? ' tco-card--win' : ''}"
      data-tco-card
      data-tco-slug="${escapeHtml(slug)}"
      data-tco-tren="BEV"
      style="--stagger: ${slot * 80}ms;"
    >
      <header class="tco-card__head">
        <div class="tco-card__title">
          <div class="tco-card__brand">${escapeHtml(par.marca)} ${escapeHtml(par.modelo)}</div>
          ${par.variante ? `<div class="tco-card__variant serif">${escapeHtml(par.variante)}</div>` : ''}
        </div>
        <span class="badge ${badge.cls}">${badge.label}</span>
      </header>

      <div class="tco-card__total">
        <p class="eyebrow">Coste total a ${state.scenario.anios} años</p>
        <div class="tco-card__num" data-tco-key="total">${fmtEur(br.tco_total_eur)}</div>
        <p class="tco-card__edit" data-tco-key="delta">${deltaTxt}</p>
      </div>

      <div class="tco-card__sep" aria-hidden="true"></div>

      <div class="tco-rows">
        ${filas.map((f) => `
          <div class="tco-row" data-tco-row="${f.key}">
            <div class="tco-row__main">
              <div class="tco-row__label"><span>${f.label}</span></div>
              <div class="tco-row__val">
                <div class="tco-row__num" data-tco-key="${f.key}">
                  ${f.key === 'ayudas' && f.valor < 0 ? fmtEurSigned(f.valor) : fmtEur(f.valor)}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <footer class="tco-card__foot">
        <span><span class="pill-conf ${confianzaCls}">Confianza ${confianzaLabel}</span></span>
        <a href="/calculadora-tco" class="tco-card__method">Metodología completa →</a>
      </footer>
    </article>
  `;
}

function renderSummaryStrip(totals, winnerId) {
  const maxTotal = Math.max(...totals.map((t) => t.total));
  const minTotal = Math.min(...totals.map((t) => t.total));
  const diff = maxTotal - minTotal;
  const winner = totals.find((t) => t.id === winnerId) || totals[0];

  const rows = totals.map((t) => {
    const isWin = t.id === winnerId;
    const pct = diff > 0 ? (t.total - minTotal) / diff : 0;
    const width = Math.round(12 + pct * 88);
    return `
      <div class="summA__row${isWin ? ' summA__row--win' : ''}" data-summary-row="${escapeHtml(t.id)}">
        <span class="summA__name">${escapeHtml(t.nombre)}</span>
        <span class="summA__bar" aria-hidden="true">
          <span class="summA__barfill" style="width: ${width}%; background: ${isWin ? 'var(--yellow)' : 'var(--border-strong)'};"></span>
        </span>
        <span class="summA__num tabular">${fmtEur(t.total)}</span>
      </div>
    `;
  }).join('');

  const escenarioMeta = `${state.scenario.anios} años · ${state.scenario.km_anual.toLocaleString('es-ES')} km/año · Madrid`;

  return `
    <div class="summA__L">
      <p class="eyebrow">Ganador del escenario</p>
      <div class="summA__winner">${escapeHtml(winner.nombre)}</div>
      <p class="serif summA__delta">ahorra hasta ${fmtEur(diff)} frente al peor de los ${totals.length} en ${state.scenario.anios} años</p>
      <p class="summA__meta">${escapeHtml(escenarioMeta)}</p>
    </div>
    <div class="summA__R">${rows}</div>
  `;
}

function renderPanelTCO() {
  if (!dom.tcoGrid || !dom.summary) return;
  const active = state.selection
    .map((slug, slot) => ({ slug, slot }))
    .filter((x) => x.slug);

  if (active.length === 0) {
    dom.summary.hidden = true;
    dom.summary.innerHTML = '';
    dom.tcoGrid.innerHTML = `
      <div class="tco-card tco-card--empty" data-tco-card>
        <div class="stbl__emptyPlus" aria-hidden="true">+</div>
        <div class="stbl__emptyTxt">Añade coches para ver su coste a ${state.scenario.anios} años</div>
      </div>
    `;
    dom.tcoGrid.style.setProperty('--cols', '1');
    return;
  }

  const tcoResults = active.map(({ slug, slot }) => ({
    slug,
    slot,
    tco: tcoParaSlug(slug),
  })).filter((r) => r.tco);

  const totals = tcoResults.map((r) => ({
    id: r.slug,
    nombre: `${r.tco.par.marca} ${r.tco.par.modelo}`,
    total: r.tco.total,
  }));

  const minTotal = Math.min(...totals.map((t) => t.total));
  const winnerId = totals.find((t) => t.total === minTotal)?.id ?? null;

  if (tcoResults.length >= 2) {
    dom.summary.hidden = false;
    dom.summary.innerHTML = renderSummaryStrip(totals, winnerId);
  } else {
    dom.summary.hidden = true;
    dom.summary.innerHTML = '';
  }

  const cards = [];
  state.selection.forEach((slug, slot) => {
    if (!slug) {
      cards.push(`
        <div class="tco-card tco-card--empty" data-tco-empty-slot="${slot}">
          <div class="stbl__emptyPlus" aria-hidden="true">+</div>
          <div class="stbl__emptyTxt">Slot vacío</div>
        </div>
      `);
      return;
    }
    const r = tcoResults.find((x) => x.slug === slug);
    if (!r) {
      cards.push(`
        <div class="tco-card tco-card--empty" data-tco-empty-slot="${slot}">
          <div class="stbl__emptyPlus" aria-hidden="true">!</div>
          <div class="stbl__emptyTxt">TCO no disponible para este coche</div>
        </div>
      `);
      return;
    }
    cards.push(renderTcoCard({ slug, slot, tco: r.tco, isWinner: slug === winnerId }));
  });

  dom.tcoGrid.style.setProperty('--cols', String(state.selection.length));
  dom.tcoGrid.innerHTML = cards.join('');
}

// ══════════════════════════════════════════════════════════════════════
// RENDER — SPECS PANEL
// ══════════════════════════════════════════════════════════════════════

const SPECS_ROWS = [
  { k: 'pvp',       label: 'Precio',          pick: (c) => c.pvp_eur,              fmt: (v) => fmtEur(v),                 lowerBetter: true },
  { k: 'potencia',  label: 'Potencia',        pick: (c) => c.potencia_cv,          fmt: (v) => `${fmtNum(v)} CV` },
  { k: 'autonomia', label: 'Autonomía WLTP',  pick: (c) => c.autonomia_wltp_km,    fmt: (v) => `${fmtNum(v)} km` },
  { k: 'consumo',   label: 'Consumo WLTP',    pick: (c) => c.consumo_wltp_kwh100km, fmt: (v) => `${fmtNum(v, 1)} kWh/100`, lowerBetter: true },
  { k: 'bateria',   label: 'Batería neta',    pick: (c) => c.bateria_neta_kwh,     fmt: (v) => `${fmtNum(v, 1)} kWh` },
  { k: 'dc',        label: 'Carga DC pico',   pick: (c) => c.carga_dc_max_kw,      fmt: (v) => `${fmtNum(v)} kW` },
  { k: 't1080',     label: 'Carga 10→80%',    pick: (c) => c.t_10_80_min,          fmt: (v) => `${fmtNum(v)} min`,        lowerBetter: true },
  { k: 'maletero',  label: 'Maletero',        pick: (c) => c.maletero_l,           fmt: (v) => `${fmtNum(v)} L` },
  { k: 'largo',     label: 'Longitud',        pick: (c) => c.largo_mm,             fmt: (v) => `${fmtNum(v / 1000, 2)} m` },
  { k: 'plazas',    label: 'Plazas',          pick: (c) => c.plazas,               fmt: (v) => fmtNum(v) },
];

function bestOfRow(row, valid) {
  const vs = valid
    .map((c) => row.pick(c))
    .filter((v) => v != null && !isNaN(v));
  if (vs.length < 2) return null;
  return row.lowerBetter ? Math.min(...vs) : Math.max(...vs);
}

function specsCarBySlug(slug) {
  return DATA.catalogoSpecs.find((c) => c.slug === slug) || null;
}

function renderPanelSpecs() {
  if (!dom.specsPanel) return;

  const cars = state.selection.map((s) => (s ? specsCarBySlug(s) : null));
  const valid = cars.filter(Boolean);
  const cols = cars.length;

  const header = `
    <div class="stbl__header">
      <div class="stbl__labelcol" aria-hidden="true"></div>
      ${cars.map((c) => {
        if (!c) return `
          <div class="stbl__headcell">
            <div class="stbl__empty">
              <div class="stbl__emptyPlus" aria-hidden="true">+</div>
              <div class="stbl__emptyTxt">Añadir coche</div>
            </div>
          </div>
        `;
        return `
          <div class="stbl__headcell">
            <div class="stbl__thumb">
              <img src="${escapeHtml(c.foto)}" alt="${escapeHtml(c.marca)} ${escapeHtml(c.modelo)}" loading="lazy" />
            </div>
            <div class="stbl__headtxt">
              <span class="badge badge--bev">ELÉCTRICO</span>
              <div class="stbl__brand">${escapeHtml(c.marca)} <span class="stbl__model">${escapeHtml(c.modelo)}</span></div>
              <div class="stbl__variant serif">${escapeHtml(c.variante)}</div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  const rows = SPECS_ROWS.map((row) => {
    const best = bestOfRow(row, valid);
    const cells = cars.map((c) => {
      if (!c) return `<div class="stbl__cell stbl__cell--empty">—</div>`;
      const v = row.pick(c);
      const isBest = best != null && v === best && valid.length > 1;
      return `<div class="stbl__cell tabular${isBest ? ' stbl__cell--best' : ''}"><span>${v != null ? row.fmt(v) : '—'}</span></div>`;
    }).join('');
    return `
      <div class="stbl__row">
        <div class="stbl__label">${row.label}</div>
        ${cells}
      </div>
    `;
  }).join('');

  dom.specsPanel.innerHTML = `
    <div class="stbl" style="--cols: ${cols};" data-specs-table>
      ${header}
      ${rows}
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════════════
// MODAL — OPEN, CLOSE, FILTER, PICK
// ══════════════════════════════════════════════════════════════════════

function openModal(slot) {
  state.modal.open = true;
  state.modal.editingSlot = slot;
  state.modal.query = '';
  state.modal.filter = 'all';

  if (dom.modal) dom.modal.hidden = false;
  if (dom.modalSearch) {
    dom.modalSearch.value = '';
    dom.modalSearch.focus();
  }
  if (dom.modalTitle) {
    dom.modalTitle.textContent = `Elegir coche ${slot + 1}`;
  }
  // Reset filter tabs
  dom.modalFilters?.forEach((btn) => {
    btn.classList.toggle('is-on', btn.getAttribute('data-garage-modal-filter') === 'all');
  });
  renderModalList();
}

function closeModal() {
  state.modal.open = false;
  state.modal.editingSlot = null;
  if (dom.modal) dom.modal.hidden = true;
}

function renderModalList() {
  if (!dom.modalList) return;
  const q = state.modal.query.trim().toLowerCase();
  const filter = state.modal.filter;
  const alreadyIn = new Set(state.selection.filter(Boolean));

  const pares = Object.values(DATA.paresTCO);
  const items = pares
    .filter((p) => filter === 'all' || filter === 'BEV') // por ahora solo BEV con TCO
    .filter((p) => {
      if (!q) return true;
      return (p.marca + ' ' + p.modelo + ' ' + p.variante).toLowerCase().includes(q);
    })
    .sort((a, b) => (a.marca + a.modelo).localeCompare(b.marca + b.modelo));

  if (items.length === 0) {
    dom.modalList.innerHTML = `
      <div class="sel-empty">
        Sin resultados${q ? ` para <strong>"${escapeHtml(q)}"</strong>` : ''}.
      </div>
    `;
    return;
  }

  dom.modalList.innerHTML = items.map((p) => {
    const taken = alreadyIn.has(p.slug) && state.selection[state.modal.editingSlot] !== p.slug;
    const pvp = p.horizontes[5].bev.pvp_eur;
    return `
      <button
        type="button"
        class="sel-item${taken ? ' is-taken' : ''}"
        role="option"
        ${taken ? 'disabled aria-disabled="true"' : ''}
        data-garage-modal-pick="${escapeHtml(p.slug)}"
      >
        <span class="sel-item__main">
          <span class="sel-item__brand">${escapeHtml(p.marca)} ${escapeHtml(p.modelo)}</span>
          <span class="sel-item__var"> · ${escapeHtml(p.variante)}</span>
        </span>
        <span class="sel-item__meta">
          <span class="sel-item__tco">TCO disponible</span>
          <span class="sel-item__sep">·</span>
          ${fmtEur(pvp)}
          ${taken ? `<span class="sel-item__in">· ya incluido</span>` : ''}
        </span>
      </button>
    `;
  }).join('');
}

// ══════════════════════════════════════════════════════════════════════
// TOGGLE MODE (SPECS / TCO)
// ══════════════════════════════════════════════════════════════════════

function setMode(mode) {
  state.mode = mode;
  dom.toggleTabs?.forEach((btn) => {
    const on = btn.getAttribute('data-mode') === mode;
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
    btn.classList.toggle('is-on', on);
  });
  if (dom.toggleThumb) {
    dom.toggleThumb.style.transform = mode === 'tco' ? 'translateX(100%)' : 'translateX(0)';
  }
  dom.panels?.forEach((p) => {
    const show = p.getAttribute('data-panel') === mode;
    if (show) p.removeAttribute('hidden');
    else p.setAttribute('hidden', '');
  });
  dom.scenSlots?.forEach((s) => {
    const show = s.getAttribute('data-show-when-mode') === mode;
    s.style.display = show ? '' : 'none';
  });
}

// ══════════════════════════════════════════════════════════════════════
// ORQUESTADOR: después de cualquier cambio en state.selection o scenario,
// llamamos rerender() que actualiza los 3 bloques.
// ══════════════════════════════════════════════════════════════════════

function rerender() {
  renderGarage();
  renderPanelTCO();
  renderPanelSpecs();
}

// ══════════════════════════════════════════════════════════════════════
// EVENT DELEGATION
// ══════════════════════════════════════════════════════════════════════

function onDocClick(e) {
  const t = e.target;

  // Toggle Specs/TCO
  const tab = t.closest('[data-cmp-toggle] [role="tab"]');
  if (tab) {
    setMode(tab.getAttribute('data-mode'));
    return;
  }

  // Añadir coche (slot vacío)
  const addBtn = t.closest('[data-garage-add]');
  if (addBtn) {
    const chip = addBtn.closest('[data-garage-chip]');
    const slot = Number(chip.getAttribute('data-garage-slot'));
    openModal(slot);
    return;
  }

  // ↻ Swap
  const swap = t.closest('[data-garage-swap]');
  if (swap) {
    const chip = swap.closest('[data-garage-chip]');
    const slot = Number(chip.getAttribute('data-garage-slot'));
    openModal(slot);
    return;
  }

  // × Remove
  const rm = t.closest('[data-garage-remove]');
  if (rm) {
    const chip = rm.closest('[data-garage-chip]');
    const slot = Number(chip.getAttribute('data-garage-slot'));
    state.selection[slot] = null;
    rerender();
    return;
  }

  // Modal close (× o overlay)
  if (t.closest('[data-garage-modal-close]') || t === dom.modal) {
    closeModal();
    return;
  }

  // Modal filter tabs
  const filter = t.closest('[data-garage-modal-filter]');
  if (filter) {
    state.modal.filter = filter.getAttribute('data-garage-modal-filter');
    dom.modalFilters.forEach((b) => b.classList.toggle('is-on', b === filter));
    renderModalList();
    return;
  }

  // Modal pick car
  const pick = t.closest('[data-garage-modal-pick]');
  if (pick && !pick.disabled) {
    const slug = pick.getAttribute('data-garage-modal-pick');
    const slot = state.modal.editingSlot;
    if (slot != null) {
      state.selection[slot] = slug;
      closeModal();
      rerender();
    }
    return;
  }
}

function onKey(e) {
  if (e.key === 'Escape' && state.modal.open) {
    closeModal();
  }
}

function onModalSearch() {
  state.modal.query = dom.modalSearch.value;
  renderModalList();
}

function onScenarioInput(e) {
  const input = e.target.closest('[data-scen-field]');
  if (!input) return;
  const field = input.getAttribute('data-scen-field');
  const raw = Number(input.value);
  if (isNaN(raw)) return;
  // Validación suave por campo.
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  switch (field) {
    case 'km_anual':        state.scenario.km_anual = clamp(raw, 1000, 60000); break;
    case 'anios':           state.scenario.anios = clamp(raw, 1, 15); break;
    case 'precio_kwh_casa': state.scenario.precio_kwh_casa = clamp(raw, 0.05, 0.80); break;
    case 'precio_kwh_fuera':state.scenario.precio_kwh_fuera = clamp(raw, 0.10, 1.20); break;
    case 'pct_casa':        state.scenario.pct_casa = clamp(raw, 0, 100); break;
  }
  // Solo el panel TCO depende del escenario.
  renderPanelTCO();
}

// ══════════════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════════════

export function initComparador() {
  const dataScript = document.getElementById('cmp-data');
  if (!dataScript) {
    console.warn('[comparador] No se encontró #cmp-data');
    return;
  }
  try {
    DATA = JSON.parse(dataScript.textContent || '{}');
  } catch (err) {
    console.error('[comparador] Error parseando #cmp-data:', err);
    return;
  }

  // Seleccion inicial desde los chips SSR.
  const chips = document.querySelectorAll('[data-garage-row] [data-garage-chip]');
  chips.forEach((chip) => {
    const slot = Number(chip.getAttribute('data-garage-slot'));
    const slug = chip.getAttribute('data-garage-slug');
    if (!isNaN(slot) && slug) state.selection[slot] = slug;
  });

  // Perfil inicial (SSR usa los mismos valores).
  if (DATA.perfil) {
    state.scenario.km_anual = DATA.perfil.km_anual ?? state.scenario.km_anual;
    state.scenario.anios = DATA.perfil.horizonte_anios ?? state.scenario.anios;
    state.scenario.precio_kwh_casa = DATA.perfil.precio_kwh_eur ?? state.scenario.precio_kwh_casa;
  }

  // Cache de nodos.
  dom.garageRow   = document.querySelector('[data-garage-row]');
  dom.tcoGrid     = document.querySelector('[data-panel="tco"] .tcogrid');
  dom.summary     = document.querySelector('[data-summary]');
  dom.specsPanel  = document.querySelector('[data-panel="specs"]');
  dom.toggleTabs  = document.querySelectorAll('[data-cmp-toggle] [role="tab"]');
  dom.toggleThumb = document.querySelector('[data-cmp-toggle] .modetoggle__thumb');
  dom.panels      = document.querySelectorAll('[data-panel]');
  dom.scenSlots   = document.querySelectorAll('[data-show-when-mode]');
  dom.modal       = document.querySelector('[data-garage-modal]');
  dom.modalTitle  = document.querySelector('[data-garage-modal-title]');
  dom.modalSearch = document.querySelector('[data-garage-modal-search]');
  dom.modalList   = document.querySelector('[data-garage-modal-list]');
  dom.modalFilters = document.querySelectorAll('[data-garage-modal-filter]');
  dom.scenbar     = document.querySelector('[data-scenbar]');

  // Event wiring.
  document.addEventListener('click', onDocClick);
  document.addEventListener('keydown', onKey);
  if (dom.modalSearch) {
    dom.modalSearch.addEventListener('input', onModalSearch);
  }
  if (dom.scenbar) {
    dom.scenbar.addEventListener('input', onScenarioInput);
  }

  // Modo inicial: si la URL trae ?mode=tco|specs lo respetamos; si no,
  // cae en el atributo aria-selected del SSR.
  let initialMode = 'specs';
  try {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('mode');
    if (m === 'tco' || m === 'specs') {
      initialMode = m;
    } else {
      initialMode = document.querySelector('[role="tab"][aria-selected="true"]')
        ?.getAttribute('data-mode') || 'specs';
    }
  } catch (_) {
    initialMode = document.querySelector('[role="tab"][aria-selected="true"]')
      ?.getAttribute('data-mode') || 'specs';
  }
  setMode(initialMode);

  // Render inicial completo (sobreescribe el SSR con markup JS coherente).
  rerender();
}
