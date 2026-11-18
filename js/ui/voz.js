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

// ---------- Voces grabadas (narrador y La Cronista) ----------
// data/voces.json dice qué cartas y frases tienen audio. Si falta, se usa la voz del dispositivo.
let VOCES = { narrador: {}, cronista: {} };
export const vocesListas = fetch('data/voces.json').then(r => (r.ok ? r.json() : null)).then(v => { if (v) VOCES = v; }).catch(() => {});
export const rutaNarrador = carta => (carta && VOCES.narrador[carta.id]) || null;
export const rutaCronista = clave => (clave && VOCES.cronista[clave]) || null;

let audio = null;
export function reproducir(ruta, alTerminar) {
  detener();
  try {
    audio = new Audio(ruta);
    audio.onended = () => { audio = null; if (alTerminar) alTerminar(); };
    audio.play().catch(() => { audio = null; });
    return true;
  } catch { return false; }
}

// Carta: el narrador grabado lee nombre y dato; luego la voz del dispositivo lee las reglas.
export function leerCarta(carta, textoCompleto, textoReglas) {
  const ruta = rutaNarrador(carta);
  if (ruta) return reproducir(ruta, () => leer(textoReglas));
  return leer(textoCompleto);
}

export function detener() {
  try { speechSynthesis.cancel(); } catch { /* sin voz */ }
  if (audio) { try { audio.pause(); } catch { /* sin audio */ } audio = null; }
}

const ICONO = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>';

// Botón "Escuchar"; textoFn se evalúa al tocar. Con audioFn, si hay una grabación se reproduce esa.
export function botonEscuchar(textoFn, clase = 'boton-secundario', audioFn = null) {
  const b = document.createElement('button');
  b.className = `${clase} boton-escuchar`;
  b.innerHTML = `${ICONO}<span>Escuchar</span>`;
  b.onclick = ev => {
    ev.stopPropagation();
    const ruta = audioFn && audioFn();
    if (ruta) reproducir(ruta); else leer(textoFn());
  };
  if (!vozDisponible() && !audioFn) b.hidden = true;
  return b;
}

// Botón "Escuchar" de una carta: narrador grabado + reglas con la voz del dispositivo.
export function botonEscucharCarta(carta, textoCompletoFn, textoReglasFn, clase = 'boton-secundario') {
  const b = botonEscuchar(textoCompletoFn, clase);
  b.onclick = ev => { ev.stopPropagation(); leerCarta(carta, textoCompletoFn(), textoReglasFn()); };
  b.hidden = !vozDisponible() && !rutaNarrador(carta);
  return b;
}
