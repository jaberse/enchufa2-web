// src/lib/comparador/popover.mjs
// Popover vanilla JS, sin dependencias. Abre un panel flotante junto al
// elemento disparador, con cierre por Escape, click fuera y botón ×.
// Gestiona focus-trap ligero (devuelve el focus al trigger al cerrar) y
// posicionamiento anti-desborde (se adapta si no cabe por debajo).
//
// API:
//   initPopoverRuntime()        — instala el <div> host y los listeners globales
//   openPopover(trigger, html, opts?) — pinta y muestra el popover
//   closePopover()              — cierra el popover abierto, si lo hay
//
// El contenido html debe incluir un encabezado .pop__head con un botón
// [data-pop-close] y un cuerpo .pop__body. Construye el html con los
// helpers de popoverContent.mjs para no repetir marcado.

let host = null;        // <div> raíz del popover (oculto por defecto).
let lastTrigger = null; // para devolver focus al cerrar.
let installed = false;

function createHost() {
  if (document.getElementById('cmp-popover')) return document.getElementById('cmp-popover');
  const el = document.createElement('div');
  el.id = 'cmp-popover';
  el.className = 'pop';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'false');
  el.setAttribute('aria-labelledby', 'pop-title');
  el.hidden = true;
  document.body.appendChild(el);
  return el;
}

function onDocClick(e) {
  if (!host || host.hidden) return;
  const t = e.target;
  // Botón × dentro del popover: cierra. Paramos la propagación para que no
  // vuelva a abrir otros popovers si el click cae cerca de otro trigger.
  if (t && typeof t.closest === 'function') {
    const closeBtn = t.closest('[data-pop-close]');
    if (closeBtn && host.contains(closeBtn)) {
      e.preventDefault();
      e.stopPropagation();
      closePopover();
      return;
    }
  }
  // Clicks dentro del popover (enlaces, contenido): no cierran.
  if (host.contains(t)) return;
  // Clicks sobre el trigger: el toggle lo gestiona openPopover, no cerramos aquí.
  if (lastTrigger && lastTrigger.contains(t)) return;
  closePopover();
}

function onKey(e) {
  if (!host || host.hidden) return;
  if (e.key === 'Escape') {
    e.stopPropagation();
    closePopover();
  }
}

function onResize() {
  if (!host || host.hidden || !lastTrigger) return;
  positionPopover(lastTrigger);
}

/**
 * Instala el host y los listeners una sola vez. Idempotente.
 */
export function initPopoverRuntime() {
  if (installed) return;
  host = createHost();
  document.addEventListener('click', onDocClick, true);
  document.addEventListener('keydown', onKey, true);
  window.addEventListener('resize', onResize);
  window.addEventListener('scroll', onResize, true);
  installed = true;
}

/**
 * Posiciona el popover respecto al trigger. Intenta debajo; si no cabe,
 * lo coloca encima. Limita el alto al viewport y ajusta horizontalmente
 * para no desbordar los márgenes (gutter 12px).
 */
function positionPopover(trigger) {
  if (!host || !trigger) return;
  const gutter = 12;
  const gap = 8;
  const rect = trigger.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Medimos el popover con su ancho natural (máx 360px definido en CSS).
  host.style.top = '0px';
  host.style.left = '0px';
  host.style.maxHeight = `${vh - gutter * 2}px`;
  const pw = Math.min(host.offsetWidth || 340, vw - gutter * 2);
  const ph = host.offsetHeight;

  // Horizontal: centrar respecto al trigger, con clamp al viewport.
  let left = rect.left + rect.width / 2 - pw / 2;
  left = Math.max(gutter, Math.min(vw - pw - gutter, left));

  // Vertical: por defecto debajo; si no cabe, encima.
  const spaceBelow = vh - rect.bottom - gutter;
  const spaceAbove = rect.top - gutter;
  const placeBelow = spaceBelow >= ph || spaceBelow >= spaceAbove;
  const top = placeBelow
    ? rect.bottom + gap
    : Math.max(gutter, rect.top - ph - gap);

  host.style.left = `${left}px`;
  host.style.top = `${top}px`;
  host.setAttribute('data-placement', placeBelow ? 'bottom' : 'top');
}

/**
 * Abre el popover con el html dado. Si ya estaba abierto por el mismo
 * trigger, lo cierra (toggle). Mueve focus al primer elemento focusable
 * dentro del popover (típicamente el botón de cerrar).
 *
 * @param {HTMLElement} trigger
 * @param {string} html
 * @param {{ label?: string }} [opts]
 */
export function openPopover(trigger, html, opts = {}) {
  if (!installed) initPopoverRuntime();
  // Toggle si se clica el mismo trigger que lo abrió.
  if (lastTrigger === trigger && !host.hidden) {
    closePopover();
    return;
  }
  lastTrigger = trigger;
  host.innerHTML = html;
  host.hidden = false;
  if (opts.label) host.setAttribute('aria-label', opts.label);

  // Calcular posición tras haber inyectado el contenido.
  requestAnimationFrame(() => {
    positionPopover(trigger);
    const closeBtn = host.querySelector('[data-pop-close]');
    if (closeBtn) closeBtn.focus();
    else host.focus();
  });
}

/**
 * Cierra el popover si está abierto y devuelve el focus al trigger.
 */
export function closePopover() {
  if (!host || host.hidden) return;
  host.hidden = true;
  host.innerHTML = '';
  host.removeAttribute('data-placement');
  const t = lastTrigger;
  lastTrigger = null;
  if (t && typeof t.focus === 'function') t.focus();
}
