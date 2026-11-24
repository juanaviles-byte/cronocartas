// Arrastrar y soltar con eventos de puntero: funciona con mouse, dedo, lápiz y touchpad.
// Un toque corto sigue siendo un "clic" (abre el detalle de la carta).

const UMBRAL = 10;   // píxeles antes de considerar que es un arrastre
const SALIDA = 18;   // con el dedo, cuánto hay que salir de la mano hacia la mesa para arrastrar la carta

// Cada carta arrastrable con sus opciones: al repasar la mano con el dedo, se arrastra la carta marcada
// (puede no ser la que se tocó primero).
const REGISTRO = new WeakMap();

// Dónde se soltó la última carta: la animación de entrada parte desde ahí.
export const ultimaSoltada = { x: 0, y: 0, t: 0 };

/**
 * @param {HTMLElement} el        carta que se puede arrastrar
 * @param {object} op
 *   objetivos(): [{ el, accion }]  lugares válidos donde soltar (se piden al empezar)
 *   alSoltar(accion)               se llama al soltar sobre un objetivo
 *   girado                         true si la carta está en la mitad girada (cara a cara)
 */
export function hacerArrastrable(el, op) {
  const { girado = false } = op;
  REGISTRO.set(el, op);
  let inicio = null, fantasma = null, lista = [], encima = null, arrastrando = false;
  let origen = el, opActual = op;   // la carta que de verdad se arrastra

  // Las ilustraciones son <img>: sin esto, el mouse inicia el arrastre nativo de imagen y cancela el nuestro.
  el.addEventListener('dragstart', ev => ev.preventDefault());
  el.classList.add('arrastrable');
  el.addEventListener('pointerdown', ev => {
    if (ev.button !== 0) return;
    // Un segundo dedo (o la palma) sobre la misma carta no reemplaza al que ya la tiene: si lo hiciera,
    // el soltar del primero se ignoraría y la carta quedaría pegada en la pantalla.
    if (inicio) return;
    inicio = { x: ev.clientX, y: ev.clientY, id: ev.pointerId };
    arrastrando = false; origen = el; opActual = op;
    // Capturar desde el inicio: aunque el dedo salga rápido de la carta, sigue llegando el movimiento.
    try { el.setPointerCapture(ev.pointerId); } catch { /* sin captura */ }
  });

  el.addEventListener('pointermove', ev => {
    if (!inicio || ev.pointerId !== inicio.id) return;
    const dx = ev.clientX - inicio.x, dy = ev.clientY - inicio.y;
    if (!arrastrando) {
      if (Math.hypot(dx, dy) < UMBRAL) return;
      const fila = el.closest('.mano');
      if (fila && ev.pointerType !== 'mouse') {
        // Con el dedo, mientras siga sobre la mano solo se repasan las cartas (repaso.js); la carta se arrastra
        // al sacar el dedo hacia la mesa, y es la que quedó marcada.
        const r = fila.getBoundingClientRect();
        if (!(girado ? ev.clientY > r.bottom + SALIDA : ev.clientY < r.top - SALIDA)) return;
        const marcada = fila.querySelector('.repasada');
        if (marcada && marcada !== el) {
          if (!REGISTRO.has(marcada)) return;   // esa carta no se puede jugar ahora
          origen = marcada; opActual = REGISTRO.get(marcada);
        }
      }
      empezar(ev);
    }
    mover(ev);
  });

  const terminar = ev => {
    if (!inicio || (ev && ev.pointerId !== inicio.id)) return;
    if (arrastrando) {
      // Si la mesa se redibujó durante el arrastre, la carta y los destinos ya no están: se cancela sin jugar.
      const accion = origen.isConnected && encima && encima.el.isConnected ? encima.accion : null;
      if (accion && ev) Object.assign(ultimaSoltada, { x: ev.clientX, y: ev.clientY, t: performance.now() });
      const soltar = opActual.alSoltar;
      limpiar(!accion);
      if (accion) soltar(accion);
      // Evita que el soltar se interprete como un toque en la carta.
      el.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); }, { capture: true, once: true });
    }
    inicio = null;
  };
  const cancelar = ev => {
    if (!inicio || (ev && ev.pointerId !== inicio.id)) return;
    if (arrastrando) limpiar(true);
    inicio = null;
  };
  el.addEventListener('pointerup', terminar);
  el.addEventListener('pointercancel', cancelar);
  // Mientras se arrastra, el soltar se escucha en toda la página: si la mesa se redibuja, la carta original
  // sale del documento, pierde la captura del puntero y su propio "pointerup" nunca llega.
  const enVentana = { up: ev => terminar(ev), cancel: ev => cancelar(ev) };

  function empezar(ev) {
    arrastrando = true;
    lista = opActual.objetivos() || [];
    lista.forEach(o => o.el.classList.add('destino-posible'));
    const r = origen.getBoundingClientRect();
    fantasma = origen.cloneNode(true);
    fantasma.classList.remove('repasada');
    fantasma.classList.add('fantasma-arrastre');
    if (girado) fantasma.classList.add('girado');
    fantasma.style.width = `${r.width}px`;
    fantasma.style.height = `${r.height}px`;
    fantasma.style.setProperty('--ch', getComputedStyle(origen).getPropertyValue('--ch'));
    document.body.appendChild(fantasma);
    document.body.classList.add('arrastrando');
    addEventListener('pointerup', enVentana.up, true);
    addEventListener('pointercancel', enVentana.cancel, true);
    origen.classList.add('origen-arrastre');
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
    removeEventListener('pointerup', enVentana.up, true);
    removeEventListener('pointercancel', enVentana.cancel, true);
    lista.forEach(o => o.el.classList.remove('destino-posible', 'destino-encima'));
    origen.classList.remove('origen-arrastre');
    document.body.classList.remove('arrastrando');
    const f = fantasma;
    fantasma = null; encima = null; lista = []; arrastrando = false;
    if (!f) return;
    if (volver && origen.isConnected) {
      const r = origen.getBoundingClientRect();
      f.classList.add('volviendo');
      f.style.left = `${r.left + r.width / 2}px`;
      f.style.top = `${r.top + r.height / 2}px`;
      setTimeout(() => f.remove(), 220);
    } else f.remove();
  }
}
