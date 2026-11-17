// Lectura en voz alta con la voz de la tablet (speechSynthesis). Sin voces en español, el botón no aparece.
let vozEs = null;

function elegirVoz() {
  try {
    const voces = speechSynthesis.getVoices();
    vozEs = voces.find(v => /^es[-_]CL/i.test(v.lang)) || voces.find(v => /^es[-_](419|MX|US|AR)/i.test(v.lang)) || voces.find(v => /^es/i.test(v.lang)) || null;
  } catch { vozEs = null; }
}
try { if (globalThis.speechSynthesis) { elegirVoz(); speechSynthesis.onvoiceschanged = elegirVoz; } } catch { /* sin voz */ }

export const vozDisponible = () => !!globalThis.speechSynthesis && typeof SpeechSynthesisUtterance === 'function';

export function leer(texto) {
  if (!vozDisponible() || !texto) return false;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = (vozEs && vozEs.lang) || 'es-CL';
    if (vozEs) u.voice = vozEs;
    u.rate = 0.95;
    speechSynthesis.speak(u);
    return true;
  } catch { return false; }
}

export function detener() { try { speechSynthesis.cancel(); } catch { /* sin voz */ } }

const ICONO = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>';

// Botón "Escuchar"; textoFn se evalúa al tocar.
export function botonEscuchar(textoFn, clase = 'boton-secundario') {
  const b = document.createElement('button');
  b.className = `${clase} boton-escuchar`;
  b.innerHTML = `${ICONO}<span>Escuchar</span>`;
  b.onclick = ev => { ev.stopPropagation(); leer(textoFn()); };
  if (!vozDisponible()) b.hidden = true;
  return b;
}
