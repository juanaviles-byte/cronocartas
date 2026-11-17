// Sonidos sintetizados (sin archivos de audio) y vibración.
// Se pueden apagar; el estado se guarda en los ajustes de la tablet.
import { almacen, CLAVES } from '../almacen.js';

let ctx = null;
const ajustes = () => almacen.leer(CLAVES.ajustes, {}) || {};
export const sonidoActivo = () => ajustes().sonido !== false;
export const vibracionActiva = () => ajustes().vibracion !== false;

export function alternarSonido() {
  const a = ajustes();
  almacen.guardar(CLAVES.ajustes, { ...a, sonido: a.sonido === false, vibracion: a.sonido === false });
  return sonidoActivo();
}

function audio() {
  if (!sonidoActivo()) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

function tono(frec, dur, { tipo = 'sine', vol = 0.18, desde = 0, hasta = null } = {}) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + desde;
  const o = a.createOscillator(), g = a.createGain();
  o.type = tipo;
  o.frequency.setValueAtTime(frec, t0);
  if (hasta) o.frequency.exponentialRampToValueAtTime(hasta, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function ruido(dur, { vol = 0.12, filtro = 1800, desde = 0 } = {}) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + desde;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  src.buffer = buf; f.type = 'bandpass'; f.frequency.value = filtro; g.gain.value = vol;
  src.connect(f).connect(g).connect(a.destination);
  src.start(t0);
}

function vibrar(patron) {
  if (!vibracionActiva()) return;
  try { navigator.vibrate && navigator.vibrate(patron); } catch { /* sin vibración */ }
}

export const sonidos = {
  robar: () => ruido(0.12, { filtro: 3200, vol: 0.08 }),                       // papel
  jugar: () => { ruido(0.08, { filtro: 900, vol: 0.12 }); tono(220, 0.12, { vol: 0.08 }); },
  ataque: () => { tono(140, 0.25, { tipo: 'triangle', vol: 0.25, hasta: 60 }); ruido(0.15, { filtro: 600, vol: 0.18 }); vibrar(35); },
  ventaja: () => { tono(523, 0.12, { tipo: 'square', vol: 0.06 }); tono(784, 0.18, { tipo: 'square', vol: 0.06, desde: 0.1 }); },
  protegido: () => tono(880, 0.3, { tipo: 'sine', vol: 0.1, hasta: 660 }),
  caida: () => { tono(330, 0.5, { tipo: 'sawtooth', vol: 0.06, hasta: 110 }); vibrar([40, 30, 40]); },
  hito: () => { tono(660, 0.6, { vol: 0.14 }); tono(990, 0.6, { vol: 0.08, desde: 0.05 }); vibrar([80, 40, 80]); },   // campana
  turno: () => tono(440, 0.12, { vol: 0.06 }),
  victoria: () => [523, 659, 784, 1046].forEach((f, i) => tono(f, 0.35, { tipo: 'triangle', vol: 0.12, desde: i * 0.12 })),
};
