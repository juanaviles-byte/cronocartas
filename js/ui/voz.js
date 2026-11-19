import { ambiente } from './ambiente.js';
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
    u.onend = u.onerror = () => ambiente.atenuar(false);
    ambiente.atenuar(true);
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
export const rutaPersonaje = carta => (carta && VOCES.personajes && VOCES.personajes[carta.id]) || null;

let audio = null;
export function reproducir(ruta, alTerminar) {
  detener();
  try {
    audio = new Audio(ruta);
    ambiente.atenuar(true);   // el fondo baja mientras habla la voz
    audio.onended = () => { audio = null; ambiente.atenuar(false); if (alTerminar) alTerminar(); };
    audio.play().catch(() => { audio = null; ambiente.atenuar(false); if (alTerminar) alTerminar(); });
    return true;
  } catch { return false; }
}

// Carta: si hay grabación del narrador se reproduce solo esa; si no, la voz del dispositivo lee nombre y dato.
export function leerCarta(carta, texto) {
  const ruta = rutaNarrador(carta);
  if (ruta) return reproducir(ruta);
  return leer(texto);
}

// Frase grabada de un Personaje al jugarse. La promesa se cumple cuando termina de hablar
// (o al tope, por si el audio se queda pegado); sin grabación se cumple de inmediato.
export function hablarPersonaje(carta, { tope = 6000 } = {}) {
  const ruta = rutaPersonaje(carta);
  if (!ruta) return Promise.resolve(false);
  return new Promise(resolve => {
    const t = setTimeout(() => resolve(true), tope);
    if (!reproducir(ruta, () => { clearTimeout(t); resolve(true); })) { clearTimeout(t); resolve(false); }
  });
}

export function detener() {
  try { speechSynthesis.cancel(); } catch { /* sin voz */ }
  if (audio) { try { audio.pause(); } catch { /* sin audio */ } audio = null; }
  ambiente.atenuar(false);
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

// Botón "Escuchar" de una carta: narrador grabado o, si falta, la voz del dispositivo (nombre y dato).
export function botonEscucharCarta(carta, textoFn, clase = 'boton-secundario') {
  const b = botonEscuchar(textoFn, clase);
  b.onclick = ev => { ev.stopPropagation(); leerCarta(carta, textoFn()); };
  b.hidden = !vozDisponible() && !rutaNarrador(carta);
  return b;
}
