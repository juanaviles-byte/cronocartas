// Arrastrar y soltar con eventos de puntero: funciona con mouse, dedo, lápiz y touchpad.
// Un toque corto sigue siendo un "clic" (abre el detalle de la carta).

const UMBRAL = 10;   // píxeles antes de considerar que es un arrastre

// Dónde se soltó la última carta: la animación de entrada parte desde ahí.
export const ultimaSoltada = { x: 0, y: 0, t: 0 };

/**
 * @param {HTMLElement} el        carta que se puede arrastrar
 * @param {object} op
 *   objetivos(): [{ el, accion }]  lugares válidos donde soltar (se piden al empezar)
 *   alSoltar(accion)               se llama al soltar sobre un objetivo
 *   girado                         true si la carta está en la mitad girada (cara a cara)
 */
export function hacerArrastrable(el, { objetivos, alSoltar, girado = false }) {
  let inicio = null, fantasma = null, lista = [], encima = null, arrastrando = false;

  // Las ilustraciones son <img>: sin esto, el mouse inicia el arrastre nativo de imagen y cancela el nuestro.
  el.addEventListener('dragstart', ev => ev.preventDefault());
  el.classList.add('arrastrable');
  el.addEventListener('pointerdown', ev => {
    if (ev.button !== 0) return;
    inicio = { x: ev.clientX, y: ev.clientY, id: ev.pointerId };
    arrastrando = false;
    // Capturar desde el inicio: aunque el dedo salga rápido de la carta, sigue llegando el movimiento.
    try { el.setPointerCapture(ev.pointerId); } catch { /* sin captura */ }
  });

  el.addEventListener('pointermove', ev => {
    if (!inicio || ev.pointerId !== inicio.id) return;
    const dx = ev.clientX - inicio.x, dy = ev.clientY - inicio.y;
    if (!arrastrando) {
      if (Math.hypot(dx, dy) < UMBRAL) return;
      // En la mano, un gesto muy horizontal desplaza la fila, pero solo si las cartas no caben y la fila se puede desplazar.
      const fila = el.closest('.mano');
      const desplazable = fila && fila.scrollWidth > fila.clientWidth + 2;
      if (ev.pointerType === 'touch' && desplazable && Math.abs(dx) > Math.abs(dy) * 1.8) { inicio = null; return; }
      empezar(ev);
    }
    mover(ev);
  });

  const terminar = ev => {
    if (!inicio || (ev && ev.pointerId !== inicio.id)) return;
    if (arrastrando) {
      const accion = encima && encima.accion;
      if (accion && ev) Object.assign(ultimaSoltada, { x: ev.clientX, y: ev.clientY, t: performance.now() });
      limpiar(!accion);
      if (accion) alSoltar(accion);
      // Evita que el soltar se interprete como un toque en la carta.
      el.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); }, { capture: true, once: true });
    }
    inicio = null;
  };
  el.addEventListener('pointerup', terminar);
  el.addEventListener('pointercancel', () => { if (arrastrando) limpiar(true); inicio = null; });

  function empezar(ev) {
    arrastrando = true;
    lista = objetivos() || [];
    lista.forEach(o => o.el.classList.add('destino-posible'));
    const r = el.getBoundingClientRect();
    fantasma = el.cloneNode(true);
    fantasma.classList.add('fantasma-arrastre');
    if (girado) fantasma.classList.add('girado');
    fantasma.style.width = `${r.width}px`;
    fantasma.style.height = `${r.height}px`;
    fantasma.style.setProperty('--ch', getComputedStyle(el).getPropertyValue('--ch'));
    document.body.appendChild(fantasma);
    document.body.classList.add('arrastrando');
    el.classList.add('origen-arrastre');
  }

  function mover(ev) {
    if (!fantasma) return;
    fantasma.style.left = `${ev.clientX}px`;
    fantasma.style.top = `${ev.clientY}px`;
    const bajo = document.elementFromPoint(ev.clientX, ev.clientY);
    // El objetivo más específico (el más interno) gana: una carta antes que toda la mesa.
    const nuevo = lista.filter(o => bajo && o.el.contains(bajo)).sort((a, b) => (a.el.contains(b.el) ? 1 : -1))[0] || null;
    if (nuevo !== encima) {
      if (encima) encima.el.classList.remove('destino-encima');
      encima = nuevo;
      if (encima) encima.el.classList.add('destino-encima');
    }
  }

  function limpiar(volver) {
    lista.forEach(o => o.el.classList.remove('destino-posible', 'destino-encima'));
    el.classList.remove('origen-arrastre');
    document.body.classList.remove('arrastrando');
    const f = fantasma;
    fantasma = null; encima = null; lista = []; arrastrando = false;
    if (!f) return;
    if (volver) {
      const r = el.getBoundingClientRect();
      f.classList.add('volviendo');
      f.style.left = `${r.left + r.width / 2}px`;
      f.style.top = `${r.top + r.height / 2}px`;
      setTimeout(() => f.remove(), 220);
    } else f.remove();
  }
}
