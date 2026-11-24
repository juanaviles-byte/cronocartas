// Repasar la mano con el dedo, como en Hearthstone: al deslizar el dedo por la mano se va marcando la carta
// que queda debajo, y si el dedo se queda quieto sobre una, se muestra en grande hasta que se levanta.
// Para jugar una carta se saca el dedo de la mano hacia la mesa (eso lo resuelve arrastre.js).
// Solo con el dedo o el lápiz: con mouse, la vista previa aparece al pasar el cursor.

export const ESPERA_PREVIA = 260;   // ms con el dedo quieto sobre una carta antes de agrandarla
const BLOQUEO_TOQUE = 450;          // ms en que se ignora el "clic" que sigue a un repaso

/**
 * @param {HTMLElement} mano   fila de cartas; cada carta tiene data-mano
 * @param {object} op
 *   mirar(carta)   muestra la carta en grande (se vuelve a llamar si el dedo pasa a otra)
 *   dejar()        quita la carta grande
 */
export function repasarMano(mano, { mirar, dejar }) {
  let dedo = null, actual = null, mirando = false, movida = false, reloj = 0, bloquearHasta = 0;

  const cartaEn = (x, y) => {
    const bajo = document.elementFromPoint(x, y);
    const c = bajo && bajo.closest ? bajo.closest('[data-mano]') : null;
    return c && mano.contains(c) ? c : null;
  };
  const marcar = c => {
    if (c === actual) return;
    if (actual) actual.classList.remove('repasada');
    actual = c;
    if (c) c.classList.add('repasada');
  };
  const arrastrando = () => document.body.classList.contains('arrastrando');
  const programar = () => {
    clearTimeout(reloj);
    reloj = setTimeout(() => {
      if (dedo != null && actual && !arrastrando()) { mirando = true; mirar(actual); }
    }, ESPERA_PREVIA);
  };

  function fin() {
    clearTimeout(reloj);
    marcar(null);
    if (mirando) dejar();
    mirando = false; movida = false; dedo = null;
    removeEventListener('pointermove', mover, true);
    removeEventListener('pointerup', soltar, true);
    removeEventListener('pointercancel', cancelar, true);
  }
  function mover(ev) {
    if (ev.pointerId !== dedo) return;
    if (arrastrando()) { fin(); return; }    // la carta salió de la mano: se está jugando
    const c = cartaEn(ev.clientX, ev.clientY);
    if (!c || c === actual) return;          // fuera de la mano se mantiene la última carta marcada
    movida = true;
    marcar(c);
    if (mirando) mirar(c); else programar();
  }
  function soltar(ev) {
    if (ev.pointerId !== dedo) return;
    // Si solo se miró (o se pasó por varias cartas), levantar el dedo no cuenta como tocar la carta.
    if (mirando || movida) bloquearHasta = performance.now() + BLOQUEO_TOQUE;
    fin();
  }
  function cancelar(ev) { if (ev.pointerId === dedo) fin(); }

  mano.addEventListener('pointerdown', ev => {
    if (ev.pointerType === 'mouse' || dedo != null) return;
    const c = cartaEn(ev.clientX, ev.clientY);
    if (!c) return;
    dedo = ev.pointerId;
    marcar(c);
    programar();
    addEventListener('pointermove', mover, true);
    addEventListener('pointerup', soltar, true);
    addEventListener('pointercancel', cancelar, true);
  });
  mano.addEventListener('click', ev => {
    if (performance.now() < bloquearHasta) { ev.stopPropagation(); ev.preventDefault(); }
  }, true);
  // Si la mesa se redibuja con el dedo puesto, la mano vieja sale del documento: se limpia todo.
  return { detener: fin };
}
