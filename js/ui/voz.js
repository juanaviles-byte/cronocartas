import { ambiente } from './ambiente.js';
import { liviano } from '../rendimiento.js';
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
let tramoSonando = null;   // fuente de WebAudio del tramo que suena
let turno = 0;             // cada reproducción nueva invalida a las anteriores que aún se están cargando

// La narración viene en un archivo por bloque y cada carta es un tramo { ruta, desde, hasta } de ese
// archivo. Se decodifica con WebAudio (preciso al centésimo y sin depender de que el servidor permita
// saltar dentro del archivo, cosa que sin internet no siempre ocurre). Se guardan los últimos bloques.
let ctxVoz = null;
const bloques = new Map();
function contextoVoz() {
  if (!ctxVoz) {
    const C = globalThis.AudioContext || globalThis.webkitAudioContext; if (!C) return null;
    // En modo escuela se decodifica a 22 kHz: la mitad de memoria por bloque, y la voz se oye igual.
    try { ctxVoz = liviano() ? new C({ sampleRate: 22050 }) : new C(); } catch (e) { ctxVoz = new C(); }
  }
  if (ctxVoz.state === 'suspended') ctxVoz.resume().catch(() => {});
  return ctxVoz;
}
function bloque(ctx, ruta) {
  if (!bloques.has(ruta)) {
    bloques.set(ruta, fetch(ruta).then(r => { if (!r.ok) throw new Error(ruta); return r.arrayBuffer(); })
      .then(b => new Promise((ok, mal) => ctx.decodeAudioData(b, ok, mal))));
    if (bloques.size > (liviano() ? 1 : 3)) bloques.delete(bloques.keys().next().value);   // modo escuela: un bloque
  }
  return bloques.get(ruta);
}
function reproducirTramo(t, alTerminar, mio) {
  const ctx = contextoVoz();
  const fin = () => { if (mio !== turno) return; tramoSonando = null; ambiente.atenuar(false); if (alTerminar) alTerminar(); };
  if (!ctx) {   // sin WebAudio: la etiqueta de audio salta al tramo y se corta al terminar
    audio = new Audio(t.ruta);
    audio.onloadedmetadata = () => { try { audio.currentTime = t.desde; } catch { /* sin salto */ } };
    audio.ontimeupdate = () => { if (audio && audio.currentTime >= t.hasta) { audio.pause(); audio = null; fin(); } };
    audio.onended = () => { audio = null; fin(); };
    audio.play().catch(() => { audio = null; fin(); });
    return;
  }
  bloque(ctx, t.ruta).then(buf => {
    if (mio !== turno) return;
    const fuente = ctx.createBufferSource();
    fuente.buffer = buf; fuente.connect(ctx.destination);
    fuente.onended = fin;
    tramoSonando = fuente;
    fuente.start(0, t.desde, Math.max(0, t.hasta - t.desde));
  }).catch(() => { bloques.delete(t.ruta); fin(); });
}

export function reproducir(ruta, alTerminar) {
  detener();
  const mio = ++turno;
  try {
    ambiente.atenuar(true);   // el fondo baja mientras habla la voz
    if (ruta && typeof ruta === 'object') { reproducirTramo(ruta, alTerminar, mio); return true; }
    audio = new Audio(ruta);
    audio.onended = () => { audio = null; ambiente.atenuar(false); if (alTerminar) alTerminar(); };
    audio.play().catch(() => { audio = null; ambiente.atenuar(false); if (alTerminar) alTerminar(); });
    return true;
  } catch { ambiente.atenuar(false); return false; }
}

// Carta: si hay grabación del narrador se reproduce solo esa; si no, la voz del dispositivo lee nombre y dato.
export function leerCarta(carta, texto) {
  const ruta = rutaNarrador(carta);
  if (ruta) return reproducir(ruta);
  return leer(texto);
}

// Frase grabada de un Personaje al jugarse. La promesa se cumple cuando termina de hablar
// (o al tope, por si el audio se queda pegado); sin grabación se cumple de inmediato.
export function hablarPersonaje(carta, { tope = 12000 } = {}) {
  const ruta = rutaPersonaje(carta);
  if (!ruta) return Promise.resolve(false);
  return new Promise(resolve => {
    const t = setTimeout(() => resolve(true), tope);
    if (!reproducir(ruta, () => { clearTimeout(t); resolve(true); })) { clearTimeout(t); resolve(false); }
  });
}

export function detener() {
  try { speechSynthesis.cancel(); } catch { /* sin voz */ }
  turno++;
  if (audio) { try { audio.pause(); } catch { /* sin audio */ } audio = null; }
  if (tramoSonando) { try { tramoSonando.onended = null; tramoSonando.stop(); } catch { /* ya terminó */ } tramoSonando = null; }
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
