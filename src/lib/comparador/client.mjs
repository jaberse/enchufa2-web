// src/lib/comparador/client.mjs
// Cliente del comparador unificado (vanilla JS, sin frameworks).
//
// Responsabilidades:
//   - Leer el payload JSON embebido en la página (#cmp-data)
//   - Gestionar estado: selection[4], scenario TCO, modo, filtros, sort,
//     filas visibles de SpecsTable.
//   - Togglear Specs ↔ TCO con animación del thumb amarillo.
//   - Abrir/cerrar el modal del garaje (Escape, click fuera, ×) y dentro
//     aplicar filtros (pills + drawer de rangos + búsqueda libre + sort).
//   - Swap/× en los chips del garaje.
//   - Recomputar TCO con motor canónico al cambiar escenario o selección.
//   - Re-renderizar los tres bloques del panel TCO: chips, summary, tarjetas.
//   - Re-renderizar la tabla Specs respetando filas visibles (drawer "Datos
//     y vista"). En modo TCO los coches sin par disponible aparecen
//     atenuados y con la etiqueta "Sin par TCO".

import { calcularTCO } from '../tco/calculadora.mjs';
import {
  CATEGORIAS,
  RANGOS,
  SORT_OPTIONS,
  emptyState,
  applyFilters,
  applySort,
  appliedFilterChips,
  hasAnyFilter,
  descubrirValoresCategoria,
} from './filterEngine.mjs';
import { initPopoverRuntime, openPopover } from './popover.mjs';
import {
  popoverConfianza,
  popoverMetodologia,
  popoverFiabilidad,
} from './popoverContent.mjs';

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

function stars(v) {
  if (v == null || isNaN(v)) return '';
  const clamp = Math.max(0, Math.min(5, v));
  const filled = Math.round(clamp);
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

// ══════════════════════════════════════════════════════════════════════
// ESPECIFICACIÓN DE FILAS PARA LA TABLA SPECS
// ══════════════════════════════════════════════════════════════════════
//
// 12 filas por defecto (10 base + Fiabilidad + Plan Auto+). El resto son
// opcionales y se activan desde el drawer "Datos y vista".
//
// kind:
//   'num'   — numérico con fmt() y lowerBetter opcional (destaca "mejor")
//   'text'  — texto libre (sin "mejor")
//   'stars' — 0..5 con stars() + número
//   'html'  — html personalizado (Plan Auto+)

const SPECS_ROWS = [
  // Núcleo por defecto
  { kind: 'num',   k: 'pvp',       grupo: 'precio',       label: 'Precio',         dflt: true,  lowerBetter: true,
    pick: (c) => c.pvp_eur,
    fmt:  (v) => fmtEur(v) },
  { kind: 'num',   k: 'potencia',  grupo: 'rendimiento',  label: 'Potencia',       dflt: true,
    pick: (c) => c.potencia_cv,
    fmt:  (v) => `${fmtNum(v)} CV` },
  { kind: 'num',   k: 'autonomia', grupo: 'autonomia',    label: 'Autonomía WLTP', dflt: true,
    pick: (c) => c.autonomia_wltp_km,
    fmt:  (v) => `${fmtNum(v)} km` },
  { kind: 'num',   k: 'consumo',   grupo: 'autonomia',    label: 'Consumo WLTP',   dflt: true, lowerBetter: true,
    pick: (c) => c.consumo_wltp_kwh100km,
    fmt:  (v) => `${fmtNum(v, 1)} kWh/100` },
  { kind: 'num',   k: 'bateria',   grupo: 'bateria',      label: 'Batería neta',   dflt: true,
    pick: (c) => c.bateria_neta_kwh,
    fmt:  (v) => `${fmtNum(v, 1)} kWh` },
  { kind: 'num',   k: 'dc',        grupo: 'bateria',      label: 'Carga DC pico',  dflt: true,
    pick: (c) => c.carga_dc_max_kw,
    fmt:  (v) => `${fmtNum(v)} kW` },
  { kind: 'num',   k: 't1080',     grupo: 'bateria',      label: 'Carga 10→80%',   dflt: true, lowerBetter: true,
    pick: (c) => c.t_10_80_min,
    fmt:  (v) => `${fmtNum(v)} min` },
  { kind: 'num',   k: 'maletero',  grupo: 'dimensiones',  label: 'Maletero',       dflt: true,
    pick: (c) => c.maletero_l,
    fmt:  (v) => `${fmtNum(v)} L` },
  { kind: 'num',   k: 'largo',     grupo: 'dimensiones',  label: 'Longitud',       dflt: true,
    pick: (c) => c.largo_mm,
    fmt:  (v) => `${fmtNum(v / 1000, 2)} m` },
  { kind: 'num',   k: 'plazas',    grupo: 'dimensiones',  label: 'Plazas',         dflt: true,
    pick: (c) => c.plazas,
    fmt:  (v) => fmtNum(v) },
  { kind: 'stars', k: 'fiab',      grupo: 'fiabilidad',   label: 'Fiabilidad',     dflt: true,
    pick: (c) => c.fiabilidad_estrellas },
  { kind: 'html',  k: 'plan_auto', grupo: 'ayudas',       label: 'Plan Auto+',     dflt: true,
    html: (c) => planAutoHtml(c) },

  // Opcionales (activables desde "Datos y vista")
  { kind: 'num',   k: 'pvp_ef',    grupo: 'precio',       label: 'PVP con Auto+',  dflt: false, lowerBetter: true,
    pick: (c) => c.pvp_con_plan_auto_eur,
    fmt:  (v) => fmtEur(v) },
  { kind: 'num',   k: 'ayuda',     grupo: 'ayudas',       label: 'Ayuda Auto+',    dflt: false,
    pick: (c) => c.ayuda_plan_auto_eur,
    fmt:  (v) => (v && v > 0 ? fmtEur(v) : '—') },
  { kind: 'num',   k: 'gar_bat',   grupo: 'garantia',     label: 'Gar. batería',   dflt: false,
    pick: (c) => c.garantia_bateria_anos,
    fmt:  (v) => `${fmtNum(v)} años` },
  { kind: 'num',   k: 'gar_veh',   grupo: 'garantia',     label: 'Gar. vehículo',  dflt: false,
    pick: (c) => c.garantia_vehiculo_anos,
    fmt:  (v) => `${fmtNum(v)} años` },
  { kind: 'num',   k: 'ac',        grupo: 'bateria',      label: 'Carga AC',       dflt: false,
    pick: (c) => c.carga_ac_max_kw,
    fmt:  (v) => `${fmtNum(v)} kW` },
  { kind: 'num',   k: 'voltaje',   grupo: 'bateria',      label: 'Voltaje',        dflt: false,
    pick: (c) => c.voltaje,
    fmt:  (v) => `${fmtNum(v)} V` },
  { kind: 'text',  k: 'bomba',     grupo: 'bateria',      label: 'Bomba calor',    dflt: false,
    pick: (c) => c.bomba_calor },
  { kind: 'text',  k: 'quimica',   grupo: 'bateria',      label: 'Química',        dflt: false,
    pick: (c) => c.quimica },
  { kind: 'num',   k: 'peso',      grupo: 'dimensiones',  label: 'Peso',           dflt: false, lowerBetter: true,
    pick: (c) => c.peso_kg,
    fmt:  (v) => `${fmtNum(v)} kg` },
  { kind: 'num',   k: 'acel',      grupo: 'rendimiento',  label: '0-100 km/h',     dflt: false, lowerBetter: true,
    pick: (c) => c.aceleracion_0_100_s,
    fmt:  (v) => `${fmtNum(v, 1)} s` },
  { kind: 'text',  k: 'traccion',  grupo: 'vehiculo',     label: 'Tracción',       dflt: false,
    pick: (c) => c.traccion },
  { kind: 'text',  k: 'pais',      grupo: 'vehiculo',     label: 'País fabricación', dflt: false,
    pick: (c) => c.pais_ensamblaje },
];

const SPECS_GRUPOS = [
  { id: 'precio',       label: 'Precio' },
  { id: 'ayudas',       label: 'Ayudas' },
  { id: 'autonomia',    label: 'Autonomía' },
  { id: 'bateria',      label: 'Batería y carga' },
  { id: 'rendimiento',  label: 'Rendimiento' },
  { id: 'dimensiones',  label: 'Dimensiones' },
  { id: 'fiabilidad',   label: 'Fiabilidad' },
  { id: 'garantia',     label: 'Garantía' },
  { id: 'vehiculo',     label: 'Vehículo' },
];

function planAutoHtml(c) {
  const estado = c.plan_auto_elegible;
  const ayuda = c.ayuda_plan_auto_eur;
  if (!estado) return '—';
  if (estado === 'No elegible') {
    return '<span class="stbl__planauto stbl__planauto--no">No elegible</span>';
  }
  const label = estado === 'Parcial' ? 'Parcial' : 'Sí';
  const ayudaTxt = ayuda && ayuda > 0 ? ` · ${fmtEur(ayuda)}` : '';
  return `<span class="stbl__planauto stbl__planauto--yes">${escapeHtml(label)}${escapeHtml(ayudaTxt)}</span>`;
}

// ══════════════════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════════════════

/** @type {{ catalogoSpecs: any[], paresTCO: Record<string,any>, slugsConTCO: string[], perfil: any, horizontes: number[] }} */
let DATA = null;
let SLUGS_TCO = null; // Set<string>

const state = {
  selection: [null, null, null, null],
  mode: 'tco',
  scenario: {
    km_anual: 15000,
    anios: 5,
    precio_kwh_casa: 0.17,
    precio_kwh_fuera: 0.45,
    pct_casa: 80,
  },
  modal: {
    open: false,
    editingSlot: null,
    advDrawerOpen: false,
  },
  filters: emptyState(), // { query, sort, categorias, rangos, soloConTCO }
  // Visibilidad de filas de SpecsTable — set de row.k activos.
  visibleSpecsRows: new Set(SPECS_ROWS.filter((r) => r.dflt).map((r) => r.k)),
  vistaDrawerOpen: false,
  // Override manual del rival ICE por slug BEV. null/undefined = usar par
  // canónico. Un valor válido reemplaza el ICE canónico al calcular TCO.
  iceOverride: {},
};

const dom = {};

// ══════════════════════════════════════════════════════════════════════
// HELPERS DE ESCENARIO
// ══════════════════════════════════════════════════════════════════════

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

function precioKwhEfectivo() {
  const s = state.scenario;
  const pct = s.pct_casa / 100;
  return s.precio_kwh_casa * pct + s.precio_kwh_fuera * (1 - pct);
}

function overridesTCO() {
  const s = state.scenario;
  return {
    km_anual: s.km_anual,
    horizonte_anios: s.anios,
    precio_kwh_eur: precioKwhEfectivo(),
    precio_litro_eur: 1.55,
  };
}

function inputParaSlug(slug) {
  const par = DATA.paresTCO[slug];
  if (!par) return null;
  const h = horizonteMasCercano(state.scenario.anios);
  // Rival ICE: si el usuario ha elegido uno manualmente y existe en icesTCO,
  // se usa ese; si no, se cae al ICE del par canónico.
  const overrideSlug = state.iceOverride[slug];
  const iceData = overrideSlug && DATA.icesTCO && DATA.icesTCO[overrideSlug]
    ? DATA.icesTCO[overrideSlug]
    : null;
  const ice = iceData
    ? iceData.horizontes[h]
    : par.horizontes[h].ice;
  const iceNombre = iceData
    ? iceData.nombre
    : par.nombreIce;
  const iceSlug = iceData ? iceData.iceSlug : par.iceSlug;
  return { par, h, bev: par.horizontes[h].bev, ice, iceNombre, iceSlug };
}

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
    rivalNombre: ctx.iceNombre,
    rivalSlug: ctx.iceSlug,
    rivalCanonicalSlug: ctx.par.iceSlug,
  };
}

// ══════════════════════════════════════════════════════════════════════
// CATÁLOGO FILTRADO (pipeline applyFilters → applySort)
// ══════════════════════════════════════════════════════════════════════

function catalogoFiltrado() {
  return applyFilters(DATA.catalogoSpecs, state.filters, { slugsConTCO: SLUGS_TCO });
}

function catalogoFiltradoOrdenado() {
  return applySort(catalogoFiltrado(), state.filters.sort);
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
  // Datos desde catalogoSpecs (no todos los coches tienen par TCO).
  const spec = specsCarBySlug(slug);
  const nombre = spec ? `${spec.marca} ${spec.modelo}` : slug;
  const variante = spec?.variante ?? '';
  const tren = spec?.tren ?? 'BEV';
  const pvp = spec?.pvp_eur;
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
        ${escapeHtml(TREN_LABEL[tren] ?? tren)}
      </span>
      <div class="garage-chip__meta">
        <span class="garage-chip__var serif">${escapeHtml(variante)}</span>
        ${pvp != null ? `<span class="garage-chip__price tabular">${fmtEur(pvp)}</span>` : ''}
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

function renderRivalSelector(slug, tco) {
  if (!DATA.iceSlugs || !DATA.icesTCO) return '';
  const current = tco.rivalSlug;
  const canonical = tco.rivalCanonicalSlug;
  const options = DATA.iceSlugs
    .map((is) => {
      const i = DATA.icesTCO[is];
      if (!i) return '';
      const isCanon = is === canonical;
      const label = isCanon ? `${i.nombre} · recomendado` : i.nombre;
      const sel = is === current ? ' selected' : '';
      return `<option value="${escapeHtml(is)}"${sel}>${escapeHtml(label)}</option>`;
    })
    .join('');
  return `
    <div class="tco-card__rival">
      <label class="tco-card__rivalLbl" for="rival-${escapeHtml(slug)}">Comparado con</label>
      <select
        id="rival-${escapeHtml(slug)}"
        class="tco-card__rivalSel"
        data-tco-ice-select="${escapeHtml(slug)}"
      >${options}</select>
    </div>
  `;
}

function renderTcoCard({ slug, slot, tco, isWinner }) {
  const { par, breakdown: br, rivalTotal, rivalNombre } = tco;
  const delta = br.tco_total_eur - rivalTotal;
  const badge = BADGE_TCO.BEV;

  // Las 6 filas se renderizan siempre con el mismo orden para que todas las
  // tarjetas del panel TCO queden alineadas horizontalmente. Si el BEV no
  // tiene Plan Auto+, se pinta la fila con "—" y estilo atenuado.
  const tieneAyudas = br.ayudas_eur > 0;
  const filas = [
    { key: 'depreciacion',  label: 'Depreciación',       valor: br.depreciacion_eur, empty: false },
    { key: 'energia',       label: 'Energía',            valor: br.energia_eur,      empty: false },
    { key: 'mantenimiento', label: 'Mantenimiento',      valor: br.mantenimiento_eur, empty: false },
    { key: 'seguro',        label: 'Seguro',             valor: br.seguro_eur,       empty: false },
    { key: 'impuestos',     label: 'Impuestos',          valor: br.impuestos_eur,    empty: false },
    { key: 'ayudas',        label: 'Ayudas Plan Auto+',  valor: tieneAyudas ? -br.ayudas_eur : 0, empty: !tieneAyudas },
  ];

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
          <div class="tco-card__variant">${par.variante ? escapeHtml(par.variante) : '&nbsp;'}</div>
        </div>
        <span class="badge ${badge.cls}">${badge.label}</span>
      </header>

      ${renderRivalSelector(slug, tco)}

      <div class="tco-card__total">
        <p class="eyebrow">Coste total a ${state.scenario.anios} años</p>
        <div class="tco-card__num" data-tco-key="total">${fmtEur(br.tco_total_eur)}</div>
        <p class="tco-card__edit" data-tco-key="delta">${deltaTxt}</p>
      </div>

      <div class="tco-card__sep" aria-hidden="true"></div>

      <div class="tco-rows">
        ${filas.map((f) => {
          const rowCls = f.empty ? 'tco-row tco-row--empty' : 'tco-row';
          const num = f.empty
            ? '—'
            : (f.key === 'ayudas' && f.valor < 0 ? fmtEurSigned(f.valor) : fmtEur(f.valor));
          return `
          <div class="${rowCls}" data-tco-row="${f.key}">
            <div class="tco-row__main">
              <div class="tco-row__label"><span>${f.label}</span></div>
              <div class="tco-row__val">
                <div class="tco-row__num" data-tco-key="${f.key}">${num}</div>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>

      <footer class="tco-card__foot">
        <button
          type="button"
          class="pill-conf ${confianzaCls}"
          data-pop="conf"
          data-tco-slug="${escapeHtml(slug)}"
          aria-label="Ver cómo se calcula la confianza y el rango de coste"
        >Confianza ${confianzaLabel}</button>
        <button
          type="button"
          class="tco-card__method"
          data-pop="tco-method"
        >Metodología completa →</button>
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
      <button
        type="button"
        class="tco-card tco-card--empty"
        data-tco-empty-slot="0"
        aria-label="Añadir coche al slot 1"
      >
        <div class="stbl__emptyPlus" aria-hidden="true">+</div>
        <div class="stbl__emptyTxt">Añade coches para ver su coste a ${state.scenario.anios} años</div>
      </button>
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
        <button
          type="button"
          class="tco-card tco-card--empty"
          data-tco-empty-slot="${slot}"
          aria-label="Añadir coche al slot ${slot + 1}"
        >
          <div class="stbl__emptyPlus" aria-hidden="true">+</div>
          <div class="stbl__emptyTxt">Slot vacío</div>
        </button>
      `);
      return;
    }
    const r = tcoResults.find((x) => x.slug === slug);
    if (!r) {
      const spec = specsCarBySlug(slug);
      const nombre = spec ? `${spec.marca} ${spec.modelo}` : slug;
      cards.push(`
        <button
          type="button"
          class="tco-card tco-card--empty tco-card--notco"
          data-tco-empty-slot="${slot}"
          aria-label="Cambiar ${escapeHtml(nombre)} por otro coche"
        >
          <div class="stbl__emptyPlus" aria-hidden="true">!</div>
          <div class="stbl__emptyTxt">Sin par TCO disponible<br/><small>${escapeHtml(nombre)}</small></div>
        </button>
      `);
      return;
    }
    cards.push(renderTcoCard({ slug, slot, tco: r.tco, isWinner: slug === winnerId }));
  });

  dom.tcoGrid.style.setProperty('--cols', String(state.selection.length));
  dom.tcoGrid.innerHTML = cards.join('');
}

// ══════════════════════════════════════════════════════════════════════
// RENDER — SPECS PANEL (TABLA)
// ══════════════════════════════════════════════════════════════════════

function specsCarBySlug(slug) {
  if (!DATA) return null;
  return DATA.catalogoSpecs.find((c) => c.slug === slug) || null;
}

function bestOfRow(row, valid) {
  const vs = valid
    .map((c) => row.pick(c))
    .filter((v) => v != null && !isNaN(v));
  if (vs.length < 2) return null;
  if (row.kind === 'stars') return Math.max(...vs);
  return row.lowerBetter ? Math.min(...vs) : Math.max(...vs);
}

function renderSpecsRowCells(row, cars, valid) {
  const best =
    row.kind === 'num' || row.kind === 'stars' ? bestOfRow(row, valid) : null;
  return cars
    .map((c) => {
      if (!c) return `<div class="stbl__cell stbl__cell--empty">—</div>`;
      if (row.kind === 'num') {
        const v = row.pick(c);
        const isBest = best != null && v === best && valid.length > 1;
        return `<div class="stbl__cell tabular${isBest ? ' stbl__cell--best' : ''}"><span>${v != null ? row.fmt(v) : '—'}</span></div>`;
      }
      if (row.kind === 'text') {
        const v = row.pick(c);
        return `<div class="stbl__cell"><span>${v != null ? escapeHtml(v) : '—'}</span></div>`;
      }
      if (row.kind === 'stars') {
        const v = row.pick(c);
        const isBest = best != null && v === best && valid.length > 1;
        if (v == null) return `<div class="stbl__cell tabular"><span>—</span></div>`;
        return `<div class="stbl__cell tabular${isBest ? ' stbl__cell--best' : ''}">
          <span class="stbl__stars" title="${fmtNum(v, 1)} sobre 5">
            <span class="stbl__starsFg">${stars(v)}</span>
            <span class="stbl__starsNum">${fmtNum(v, 1)}</span>
          </span>
        </div>`;
      }
      // html
      return `<div class="stbl__cell">${row.html(c)}</div>`;
    })
    .join('');
}

function renderPanelSpecs() {
  if (!dom.specsTableWrap) return;

  const cars = state.selection.map((s) => (s ? specsCarBySlug(s) : null));
  const valid = cars.filter(Boolean);
  const cols = cars.length;

  const header = `
    <div class="stbl__header">
      <div class="stbl__labelcol" aria-hidden="true"></div>
      ${cars.map((c, i) => {
        if (!c) return `
          <div class="stbl__headcell">
            <button
              type="button"
              class="stbl__empty stbl__empty--btn"
              data-specs-empty-slot="${i}"
              aria-label="Añadir coche al slot ${i + 1}"
            >
              <div class="stbl__emptyPlus" aria-hidden="true">+</div>
              <div class="stbl__emptyTxt">Añadir coche</div>
            </button>
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

  const activeRows = SPECS_ROWS.filter((r) => state.visibleSpecsRows.has(r.k));
  const rows = activeRows
    .map((row) => {
      const help =
        row.k === 'fiab'
          ? `<button type="button" class="stbl__helpbtn" data-pop="fiab" aria-label="Cómo puntuamos la fiabilidad">?</button>`
          : '';
      return `
    <div class="stbl__row">
      <div class="stbl__label">${row.label}${help}</div>
      ${renderSpecsRowCells(row, cars, valid)}
    </div>
  `;
    })
    .join('');

  dom.specsTableWrap.innerHTML = `
    <div class="stbl" style="--cols: ${cols};" data-specs-table>
      ${header}
      ${rows}
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════════════
// RENDER — DRAWER "DATOS Y VISTA" DEL PANEL SPECS
// ══════════════════════════════════════════════════════════════════════

function renderSpecsVistadrawer() {
  if (!dom.specsVistaDrawer) return;
  const filasPorGrupo = {};
  for (const row of SPECS_ROWS) {
    (filasPorGrupo[row.grupo] = filasPorGrupo[row.grupo] || []).push(row);
  }
  const grupos = SPECS_GRUPOS.filter((g) => filasPorGrupo[g.id]);

  const gridHtml = grupos
    .map((g) => {
      const items = filasPorGrupo[g.id]
        .map((row) => {
          const checked = state.visibleSpecsRows.has(row.k) ? 'checked' : '';
          return `
            <label class="vistadrawer__chk">
              <input type="checkbox" data-specs-vista-chk="${escapeHtml(row.k)}" ${checked} />
              ${escapeHtml(row.label)}
            </label>
          `;
        })
        .join('');
      return `
        <div class="vistadrawer__group">
          <div class="vistadrawer__grouplbl">${escapeHtml(g.label)}</div>
          ${items}
        </div>
      `;
    })
    .join('');

  dom.specsVistaDrawer.innerHTML = `
    <div class="vistadrawer__head">
      <p class="vistadrawer__title">Elige qué datos comparar</p>
      <div class="vistadrawer__actions">
        <button type="button" class="vistadrawer__actbtn" data-specs-vista-defaults>Predefinidos</button>
        <button type="button" class="vistadrawer__actbtn" data-specs-vista-all>Seleccionar todos</button>
      </div>
    </div>
    <div class="vistadrawer__grid">${gridHtml}</div>
  `;

  if (dom.specsVistaCount) {
    const n = state.visibleSpecsRows.size;
    dom.specsVistaCount.textContent = String(n);
  }
}

// ══════════════════════════════════════════════════════════════════════
// MODAL — FILTROS (PILLS), DRAWER DE RANGOS, APPLIED, LISTA
// ══════════════════════════════════════════════════════════════════════

function renderModalPills() {
  if (!dom.modalPills || !DATA) return;
  const valores = descubrirValoresCategoria(DATA.catalogoSpecs);
  const groups = CATEGORIAS.map((c) => {
    const vs = valores[c.id] || [];
    if (vs.length === 0) return '';
    const sel = new Set(state.filters.categorias[c.id] || []);
    const pills = vs
      .map((v) => {
        const isOn = sel.has(String(v));
        const sfx = c.sufijo ? `<small>${escapeHtml(c.sufijo)}</small>` : '';
        return `
          <button
            type="button"
            class="sel-pill${isOn ? ' is-on' : ''}"
            data-garage-pill
            data-garage-pill-cat="${escapeHtml(c.id)}"
            data-garage-pill-val="${escapeHtml(String(v))}"
            aria-pressed="${isOn}"
          >${escapeHtml(String(v))}${sfx}</button>
        `;
      })
      .join('');
    return `
      <div class="sel-pillgroup" data-garage-pill-group="${escapeHtml(c.id)}">
        <span class="sel-pillgroup__lbl">${escapeHtml(c.label)}</span>
        ${pills}
      </div>
    `;
  }).join('');
  dom.modalPills.innerHTML = groups;
}

function renderModalDrawer() {
  if (!dom.modalDrawer || !DATA) return;
  // Min/max dinámicos a partir del catálogo para guiar al usuario.
  const rngHtml = RANGOS.map((r) => {
    const vs = DATA.catalogoSpecs
      .map((m) => m[r.campo])
      .filter((v) => v != null && !isNaN(v));
    if (vs.length === 0) return '';
    const lo = Math.floor(Math.min(...vs));
    const hi = Math.ceil(Math.max(...vs));
    const step = hi - lo > 1000 ? 100 : hi - lo > 100 ? 10 : 1;
    const st = state.filters.rangos[r.id] || { min: null, max: null };
    const valInput =
      r.tipo === 'max'
        ? (st.max ?? hi)
        : (st.min ?? lo);
    const valTxt =
      r.tipo === 'max'
        ? `máx ${fmtNum(valInput)} ${r.unidad}`
        : `mín ${fmtNum(valInput)} ${r.unidad}`;
    return `
      <div class="sel-range" data-garage-range-group="${escapeHtml(r.id)}">
        <div class="sel-range__head">
          <span class="sel-range__lbl">${escapeHtml(r.label)}</span>
          <span class="sel-range__val" data-garage-range-val>${escapeHtml(valTxt)}</span>
        </div>
        <input
          type="range"
          class="sel-range__slider"
          data-garage-range-input
          data-garage-range-rid="${escapeHtml(r.id)}"
          data-garage-range-tipo="${escapeHtml(r.tipo)}"
          min="${lo}"
          max="${hi}"
          step="${step}"
          value="${valInput}"
        />
      </div>
    `;
  }).join('');
  dom.modalDrawer.innerHTML = rngHtml;
}

function renderModalApplied() {
  if (!dom.modalApplied || !dom.modalAppliedChips) return;
  const chips = appliedFilterChips(state.filters);
  if (chips.length === 0) {
    dom.modalApplied.hidden = true;
    dom.modalAppliedChips.innerHTML = '';
    return;
  }
  dom.modalApplied.hidden = false;
  dom.modalAppliedChips.innerHTML = chips
    .map(
      (c) => `
    <span class="sel-appchip" data-garage-appchip="${escapeHtml(c.id)}">
      ${escapeHtml(c.label)}
      <button
        type="button"
        class="sel-appchip__x"
        aria-label="Quitar ${escapeHtml(c.label)}"
        data-garage-appchip-clear="${escapeHtml(c.id)}"
      >×</button>
    </span>
  `,
    )
    .join('');
  // Badge del botón "Más filtros" con el nº de rangos activos.
  if (dom.modalAdvBadge) {
    const nRangos = chips.filter((c) => c.tipo === 'rango').length;
    if (nRangos > 0) {
      dom.modalAdvBadge.hidden = false;
      dom.modalAdvBadge.textContent = String(nRangos);
    } else {
      dom.modalAdvBadge.hidden = true;
      dom.modalAdvBadge.textContent = '';
    }
  }
}

function renderModalCount(filteredCount) {
  if (!dom.modalCount) return;
  const total = DATA.catalogoSpecs.length;
  const txt =
    filteredCount === total
      ? `${total} coches`
      : `${filteredCount} de ${total}`;
  dom.modalCount.textContent = txt;
}

function renderModalList() {
  if (!dom.modalList) return;
  const alreadyIn = new Set(state.selection.filter(Boolean));
  const items = catalogoFiltradoOrdenado();
  renderModalCount(items.length);

  if (items.length === 0) {
    dom.modalList.innerHTML = `
      <div class="sel-empty">
        Sin resultados con los filtros activos. Prueba a limpiar alguno.
      </div>
    `;
    return;
  }

  const editingSlot = state.modal.editingSlot;
  dom.modalList.innerHTML = items
    .map((p) => {
      const taken =
        alreadyIn.has(p.slug) && state.selection[editingSlot] !== p.slug;
      const pvp = p.pvp_eur;
      const tieneTCO = SLUGS_TCO.has(p.slug);
      const dimNoTco = state.mode === 'tco' && !tieneTCO;
      const tcoLabel = tieneTCO
        ? `<span class="sel-item__tco">TCO disponible</span>`
        : `<span class="sel-item__notco">Sin par TCO</span>`;
      const autoAyuda =
        p.ayuda_plan_auto_eur && p.ayuda_plan_auto_eur > 0
          ? `<span class="sel-item__sep">·</span><span class="sel-item__auto">Auto+ ${fmtEur(p.ayuda_plan_auto_eur)}</span>`
          : '';
      return `
        <button
          type="button"
          class="sel-item${taken ? ' is-taken' : ''}${dimNoTco ? ' is-notco' : ''}"
          role="option"
          ${taken ? 'disabled aria-disabled="true"' : ''}
          data-garage-modal-pick="${escapeHtml(p.slug)}"
        >
          <span class="sel-item__main">
            <span class="sel-item__brand">${escapeHtml(p.marca)} ${escapeHtml(p.modelo)}</span>
            <span class="sel-item__var"> · ${escapeHtml(p.variante)}</span>
          </span>
          <span class="sel-item__meta">
            ${tcoLabel}
            <span class="sel-item__sep">·</span>
            ${pvp != null ? fmtEur(pvp) : '—'}
            ${autoAyuda}
            ${taken ? `<span class="sel-item__in">· ya incluido</span>` : ''}
          </span>
        </button>
      `;
    })
    .join('');
}

function renderModal() {
  renderModalPills();
  renderModalDrawer();
  renderModalApplied();
  renderModalList();
}

// ══════════════════════════════════════════════════════════════════════
// MODAL — OPEN / CLOSE
// ══════════════════════════════════════════════════════════════════════

function openModal(slot) {
  state.modal.open = true;
  state.modal.editingSlot = slot;
  state.filters.query = '';

  if (dom.modal) dom.modal.hidden = false;
  if (dom.modalSearch) {
    dom.modalSearch.value = '';
    dom.modalSearch.focus();
  }
  if (dom.modalSort) dom.modalSort.value = state.filters.sort || '';
  if (dom.modalTitle) {
    dom.modalTitle.textContent = `Elegir coche ${slot + 1}`;
  }
  renderModal();
}

function closeModal() {
  state.modal.open = false;
  state.modal.editingSlot = null;
  if (dom.modal) dom.modal.hidden = true;
}

function setAdvDrawerOpen(open) {
  state.modal.advDrawerOpen = open;
  if (dom.modalAdvBtn)
    dom.modalAdvBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (dom.modalDrawer) dom.modalDrawer.hidden = !open;
}

function setVistaDrawerOpen(open) {
  state.vistaDrawerOpen = open;
  if (dom.specsVistaBtn)
    dom.specsVistaBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (dom.specsVistaDrawer) dom.specsVistaDrawer.hidden = !open;
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
  // Si el modal está abierto, re-renderiza la lista para actualizar los
  // "Sin par TCO" cuando cambia el modo.
  if (state.modal.open) renderModalList();
}

// ══════════════════════════════════════════════════════════════════════
// ORQUESTADOR
// ══════════════════════════════════════════════════════════════════════

function rerender() {
  renderGarage();
  renderPanelTCO();
  renderPanelSpecs();
}

// ══════════════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ══════════════════════════════════════════════════════════════════════

function onDocClick(e) {
  const t = e.target;

  // Popovers (confianza, metodología TCO, fiabilidad). Se manejan primero para
  // que el click en el trigger no dispare otros handlers.
  const popBtn = t.closest ? t.closest('[data-pop]') : null;
  if (popBtn) {
    const kind = popBtn.getAttribute('data-pop');
    if (kind === 'conf') {
      const slug = popBtn.getAttribute('data-tco-slug');
      const ctx = inputParaSlug(slug);
      const tco = tcoParaSlug(slug);
      if (ctx && tco) {
        openPopover(
          popBtn,
          popoverConfianza({
            nombreBev: `${tco.par.marca} ${tco.par.modelo}`,
            input: ctx.bev,
            breakdown: tco.breakdown,
            anios: state.scenario.anios,
          }),
        );
      }
    } else if (kind === 'tco-method') {
      openPopover(
        popBtn,
        popoverMetodologia({
          perfil: DATA?.perfil || {},
          anios: state.scenario.anios,
        }),
      );
    } else if (kind === 'fiab') {
      openPopover(popBtn, popoverFiabilidad());
    }
    return;
  }

  // Toggle Specs/TCO
  const tab = t.closest('[data-cmp-toggle] [role="tab"]');
  if (tab) {
    setMode(tab.getAttribute('data-mode'));
    return;
  }

  // Añadir coche (slot vacío en el garage)
  const addBtn = t.closest('[data-garage-add]');
  if (addBtn) {
    const chip = addBtn.closest('[data-garage-chip]');
    const slot = Number(chip.getAttribute('data-garage-slot'));
    openModal(slot);
    return;
  }

  // Añadir coche desde una tarjeta TCO vacía (o de una cabecera Specs vacía).
  // Permite añadir/reemplazar sin subir a la fila del garaje.
  const emptyTco = t.closest('[data-tco-empty-slot]');
  if (emptyTco) {
    const slot = Number(emptyTco.getAttribute('data-tco-empty-slot'));
    if (!isNaN(slot)) openModal(slot);
    return;
  }
  const emptySpecs = t.closest('[data-specs-empty-slot]');
  if (emptySpecs) {
    const slot = Number(emptySpecs.getAttribute('data-specs-empty-slot'));
    if (!isNaN(slot)) openModal(slot);
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

  // Pill de categoría
  const pill = t.closest('[data-garage-pill]');
  if (pill) {
    const catId = pill.getAttribute('data-garage-pill-cat');
    const val = pill.getAttribute('data-garage-pill-val');
    const cur = state.filters.categorias[catId] || [];
    const i = cur.indexOf(val);
    const next = i >= 0 ? cur.filter((_, j) => j !== i) : [...cur, val];
    state.filters.categorias[catId] = next;
    renderModalPills();
    renderModalApplied();
    renderModalList();
    return;
  }

  // Toggle drawer de rangos
  if (t.closest('[data-garage-modal-advbtn]')) {
    setAdvDrawerOpen(!state.modal.advDrawerOpen);
    return;
  }

  // Limpiar todos los filtros
  if (t.closest('[data-garage-modal-reset]')) {
    state.filters = emptyState();
    if (dom.modalSearch) dom.modalSearch.value = '';
    if (dom.modalSort) dom.modalSort.value = '';
    renderModal();
    return;
  }

  // Quitar un filtro aplicado (chip ×)
  const appclr = t.closest('[data-garage-appchip-clear]');
  if (appclr) {
    clearAppliedChip(appclr.getAttribute('data-garage-appchip-clear'));
    renderModal();
    if (dom.modalSearch && state.filters.query === '') {
      dom.modalSearch.value = '';
    }
    return;
  }

  // Pick car del listado
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

  // Toggle drawer "Datos y vista" del panel Specs
  if (t.closest('[data-specs-vistabtn]')) {
    setVistaDrawerOpen(!state.vistaDrawerOpen);
    if (state.vistaDrawerOpen) renderSpecsVistadrawer();
    return;
  }

  // Botones del drawer vista: predefinidos / seleccionar todos
  if (t.closest('[data-specs-vista-defaults]')) {
    state.visibleSpecsRows = new Set(
      SPECS_ROWS.filter((r) => r.dflt).map((r) => r.k),
    );
    renderSpecsVistadrawer();
    renderPanelSpecs();
    return;
  }
  if (t.closest('[data-specs-vista-all]')) {
    state.visibleSpecsRows = new Set(SPECS_ROWS.map((r) => r.k));
    renderSpecsVistadrawer();
    renderPanelSpecs();
    return;
  }
}

function clearAppliedChip(id) {
  if (id === 'query') {
    state.filters.query = '';
    return;
  }
  if (id === 'tco') {
    state.filters.soloConTCO = false;
    return;
  }
  if (id.startsWith('cat:')) {
    const [, catId, val] = id.split(':');
    state.filters.categorias[catId] = (state.filters.categorias[catId] || []).filter((x) => x !== val);
    return;
  }
  if (id.startsWith('rng:')) {
    const rid = id.slice(4);
    state.filters.rangos[rid] = { min: null, max: null };
    return;
  }
}

function onKey(e) {
  if (e.key === 'Escape' && state.modal.open) {
    closeModal();
  }
}

function onModalSearch() {
  state.filters.query = dom.modalSearch.value;
  renderModalApplied();
  renderModalList();
}

function onModalSort() {
  state.filters.sort = dom.modalSort.value;
  renderModalList();
}

function onModalRangeInput(e) {
  const input = e.target.closest('[data-garage-range-input]');
  if (!input) return;
  const rid = input.getAttribute('data-garage-range-rid');
  const tipo = input.getAttribute('data-garage-range-tipo');
  const r = RANGOS.find((x) => x.id === rid);
  if (!r) return;
  const v = Number(input.value);
  // Determina si el valor elegido "activa" el filtro: solo si difiere del
  // extremo natural del catálogo (lo/hi). Así evitamos spam de chips cuando
  // el slider está en reposo.
  const min = Number(input.min);
  const max = Number(input.max);
  if (tipo === 'max') {
    state.filters.rangos[rid] = {
      min: null,
      max: v >= max ? null : v,
    };
  } else {
    state.filters.rangos[rid] = {
      min: v <= min ? null : v,
      max: null,
    };
  }
  // Actualizar el texto junto al slider
  const group = input.closest('[data-garage-range-group]');
  const valEl = group?.querySelector('[data-garage-range-val]');
  if (valEl) {
    const tipoTxt = tipo === 'max' ? 'máx' : 'mín';
    valEl.textContent = `${tipoTxt} ${fmtNum(v)} ${r.unidad}`;
  }
  renderModalApplied();
  renderModalList();
}

function onVistaChk(e) {
  const chk = e.target.closest('[data-specs-vista-chk]');
  if (!chk) return;
  const k = chk.getAttribute('data-specs-vista-chk');
  if (chk.checked) state.visibleSpecsRows.add(k);
  else state.visibleSpecsRows.delete(k);
  if (dom.specsVistaCount)
    dom.specsVistaCount.textContent = String(state.visibleSpecsRows.size);
  renderPanelSpecs();
}

function onTcoIceChange(e) {
  const sel = e.target.closest('[data-tco-ice-select]');
  if (!sel) return;
  const bevSlug = sel.getAttribute('data-tco-ice-select');
  const iceSlug = sel.value;
  const par = DATA.paresTCO[bevSlug];
  // Si el usuario vuelve al ICE canónico, limpiamos el override para que
  // el estado quede mínimo; si elige otro, lo guardamos.
  if (par && iceSlug === par.iceSlug) {
    delete state.iceOverride[bevSlug];
  } else {
    state.iceOverride[bevSlug] = iceSlug;
  }
  renderPanelTCO();
}

function onScenarioInput(e) {
  const input = e.target.closest('[data-scen-field]');
  if (!input) return;
  const field = input.getAttribute('data-scen-field');
  const raw = Number(input.value);
  if (isNaN(raw)) return;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  switch (field) {
    case 'km_anual':        state.scenario.km_anual = clamp(raw, 1000, 60000); break;
    case 'anios':           state.scenario.anios = clamp(raw, 1, 15); break;
    case 'precio_kwh_casa': state.scenario.precio_kwh_casa = clamp(raw, 0.05, 0.80); break;
    case 'precio_kwh_fuera':state.scenario.precio_kwh_fuera = clamp(raw, 0.10, 1.20); break;
    case 'pct_casa':        state.scenario.pct_casa = clamp(raw, 0, 100); break;
  }
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
  SLUGS_TCO = new Set(DATA.slugsConTCO || []);

  // Selección inicial desde los chips SSR.
  const chips = document.querySelectorAll('[data-garage-row] [data-garage-chip]');
  chips.forEach((chip) => {
    const slot = Number(chip.getAttribute('data-garage-slot'));
    const slug = chip.getAttribute('data-garage-slug');
    if (!isNaN(slot) && slug) state.selection[slot] = slug;
  });

  if (DATA.perfil) {
    state.scenario.km_anual = DATA.perfil.km_anual ?? state.scenario.km_anual;
    state.scenario.anios = DATA.perfil.horizonte_anios ?? state.scenario.anios;
    state.scenario.precio_kwh_casa = DATA.perfil.precio_kwh_eur ?? state.scenario.precio_kwh_casa;
  }

  // Cache DOM.
  dom.garageRow       = document.querySelector('[data-garage-row]');
  dom.tcoGrid         = document.querySelector('[data-panel="tco"] .tcogrid');
  dom.summary         = document.querySelector('[data-summary]');
  dom.specsTableWrap  = document.querySelector('[data-specs-table-wrap]');
  dom.specsVistaBtn   = document.querySelector('[data-specs-vistabtn]');
  dom.specsVistaCount = document.querySelector('[data-specs-vistacount]');
  dom.specsVistaDrawer = document.querySelector('[data-specs-vistadrawer]');
  dom.toggleTabs      = document.querySelectorAll('[data-cmp-toggle] [role="tab"]');
  dom.toggleThumb     = document.querySelector('[data-cmp-toggle] .modetoggle__thumb');
  dom.panels          = document.querySelectorAll('[data-panel]');
  dom.scenSlots       = document.querySelectorAll('[data-show-when-mode]');
  dom.modal           = document.querySelector('[data-garage-modal]');
  dom.modalTitle      = document.querySelector('[data-garage-modal-title]');
  dom.modalSearch     = document.querySelector('[data-garage-modal-search]');
  dom.modalSort       = document.querySelector('[data-garage-modal-sort]');
  dom.modalCount      = document.querySelector('[data-garage-modal-count]');
  dom.modalAdvBtn     = document.querySelector('[data-garage-modal-advbtn]');
  dom.modalAdvBadge   = document.querySelector('[data-garage-modal-advbadge]');
  dom.modalPills      = document.querySelector('[data-garage-modal-pills]');
  dom.modalApplied    = document.querySelector('[data-garage-modal-applied]');
  dom.modalAppliedChips = document.querySelector('[data-garage-modal-applied-chips]');
  dom.modalDrawer     = document.querySelector('[data-garage-modal-drawer]');
  dom.modalList       = document.querySelector('[data-garage-modal-list]');
  dom.scenbar         = document.querySelector('[data-scenbar]');

  // Inicializa el contador del drawer de Vista.
  if (dom.specsVistaCount)
    dom.specsVistaCount.textContent = String(state.visibleSpecsRows.size);

  // Event wiring.
  document.addEventListener('click', onDocClick);
  document.addEventListener('keydown', onKey);
  if (dom.modalSearch) dom.modalSearch.addEventListener('input', onModalSearch);
  if (dom.modalSort) dom.modalSort.addEventListener('change', onModalSort);
  if (dom.modalDrawer) dom.modalDrawer.addEventListener('input', onModalRangeInput);
  if (dom.specsVistaDrawer) dom.specsVistaDrawer.addEventListener('change', onVistaChk);
  if (dom.tcoGrid) dom.tcoGrid.addEventListener('change', onTcoIceChange);
  if (dom.scenbar) dom.scenbar.addEventListener('input', onScenarioInput);

  // Render inicial del drawer vista (para que las categorías ya estén listas).
  renderSpecsVistadrawer();

  // Instalar runtime de popovers (host + listeners globales).
  initPopoverRuntime();

  // Modo inicial: URL ?mode=tco|specs, si no el del SSR, por defecto specs.
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

  // Render inicial.
  rerender();
}
