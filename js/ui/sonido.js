// Efectos de sonido y vibración. Los efectos son archivos cortos (audio/sfx/*.ogg, sintetizados con
// gen/sfx.py) que se decodifican una vez y se tocan con Web Audio. Mientras un archivo no está listo,
// o si falla, suena una versión sintetizada al vuelo (la de siempre). Se pueden apagar desde la mesa.
import { almacen, CLAVES } from '../almacen.js';

let ctx = null, salida = null;
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
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      salida = ctx.createGain();
      salida.gain.value = 0.9;
      salida.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

// ── Banco de efectos ──
const buffers = new Map();       // nombre → AudioBuffer
let carga = null;
export function precargarSonidos() {
  if (carga || typeof fetch !== 'function') return carga;
  const a = audio();
  if (!a) return null;
  carga = fetch('data/sfx.json').then(r => (r.ok ? r.json() : {})).catch(() => ({}))
    .then(mapa => Promise.all(Object.entries(mapa).map(([nombre, ruta]) =>
      fetch(ruta).then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(ruta))))
        .then(b => new Promise((ok, mal) => a.decodeAudioData(b, ok, mal)))
        .then(buf => { buffers.set(nombre, buf); })
        .catch(() => { /* ese efecto queda con su versión sintetizada */ }))));
  return carga;
}

// Toca un efecto del banco. Varía un poco el tono y el volumen para que no suene repetido.
// Devuelve false si el efecto todavía no está (para usar el respaldo sintetizado).
function tocar(nombre, { vol = 1, tono = 1, variar = 0.04, desde = 0 } = {}) {
  const a = audio();
  if (!a) return true;               // sonido apagado: no hace falta respaldo
  const buf = buffers.get(nombre);
  if (!buf) { precargarSonidos(); return false; }
  const src = a.createBufferSource(), g = a.createGain();
  src.buffer = buf;
  src.playbackRate.value = tono * (1 + (Math.random() * 2 - 1) * variar);
  g.gain.value = vol * (1 - Math.random() * variar);
  src.connect(g).connect(salida);
  src.start(a.currentTime + desde);
  return true;
}

// ── Respaldo sintetizado (sin archivos) ──
function tonoSint(frec, dur, { tipo = 'sine', vol = 0.18, desde = 0, hasta = null } = {}) {
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
  o.connect(g).connect(salida || a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}
function ruidoSint(dur, { vol = 0.12, filtro = 1800, desde = 0 } = {}) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + desde;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  src.buffer = buf; f.type = 'bandpass'; f.frequency.value = filtro; g.gain.value = vol;
  src.connect(f).connect(g).connect(salida || a.destination);
  src.start(t0);
}
const RESPALDO = {
  carta_robar: () => ruidoSint(0.12, { filtro: 3200, vol: 0.08 }),
  carta_colocar: () => { ruidoSint(0.08, { filtro: 900, vol: 0.12 }); tonoSint(220, 0.12, { vol: 0.08 }); },
  ataque_ligero: () => { tonoSint(140, 0.25, { tipo: 'triangle', vol: 0.25, hasta: 60 }); ruidoSint(0.15, { filtro: 600, vol: 0.18 }); },
  ventaja: () => { tonoSint(523, 0.12, { tipo: 'square', vol: 0.06 }); tonoSint(784, 0.18, { tipo: 'square', vol: 0.06, desde: 0.1 }); },
  proteger: () => tonoSint(880, 0.3, { vol: 0.1, hasta: 660 }),
  caida: () => tonoSint(330, 0.5, { tipo: 'sawtooth', vol: 0.06, hasta: 110 }),
  hito: () => { tonoSint(660, 0.6, { vol: 0.14 }); tonoSint(990, 0.6, { vol: 0.08, desde: 0.05 }); },
  turno_propio: () => tonoSint(440, 0.12, { vol: 0.06 }),
  saber: () => { tonoSint(1046, 0.12, { vol: 0.07 }); tonoSint(1568, 0.2, { vol: 0.06, desde: 0.07 }); },
  conexion: () => [392, 523, 659].forEach((f, i) => tonoSint(f, 0.25, { vol: 0.1, desde: i * 0.09 })),
  victoria: () => [523, 659, 784, 1046].forEach((f, i) => tonoSint(f, 0.35, { tipo: 'triangle', vol: 0.12, desde: i * 0.12 })),
  ui_toque: () => tonoSint(1760, 0.04, { vol: 0.03 }),
};
RESPALDO.ataque_fuerte = RESPALDO.ataque_ligero;
RESPALDO.turno_rival = RESPALDO.turno_propio;
RESPALDO.curar = RESPALDO.conexion;
RESPALDO.invocar_protagonista = RESPALDO.carta_colocar;
['politica', 'economia', 'sociedad', 'cultura', 'territorio'].forEach(d => { RESPALDO[`invocar_${d}`] = RESPALDO.carta_colocar; });
RESPALDO.moneda_lanzar = RESPALDO.saber;
RESPALDO.moneda_cae = RESPALDO.saber;

function efecto(nombre, opciones) {
  if (!tocar(nombre, opciones)) (RESPALDO[nombre] || (nombre.indexOf('motivo_') === 0 ? RESPALDO.carta_colocar : null) || (() => {}))();
}

function vibrar(patron) {
  if (!vibracionActiva()) return;
  try { navigator.vibrate && navigator.vibrate(patron); } catch { /* sin vibración */ }
}

// Invocación según el tipo de carta: cada tipo tiene su propio sonido.
const INVOCAR = { protagonista: 'invocar_protagonista', personaje: 'invocar_personaje', acontecimiento: 'invocar_acontecimiento', lugar: 'invocar_lugar', aula: 'invocar_acontecimiento' };

export const sonidos = {
  // Interfaz
  toque: () => efecto('ui_toque', { variar: 0.08 }),
  abrir: () => efecto('ui_abrir'),
  cerrar: () => efecto('ui_cerrar'),
  confirmar: () => efecto('ui_confirmar'),
  error: () => efecto('ui_error'),
  // Cartas
  robar: () => efecto('carta_robar', { variar: 0.08 }),
  jugar: () => efecto('carta_colocar', { variar: 0.08 }),
  voltear: () => efecto('carta_voltear'),
  buscar: () => efecto('buscar'),
  // Con dimensión (Protagonistas y Lugares de Historia), suena la de su dimensión: monedas, sello, gente…
  // Primero lo que la carta es (tren, barco, marcha…: js/motivos.js); si no, su dimensión; si no, su tipo.
  invocar: (tipo, dim = null, motivo = null) => { efecto(motivo ? `motivo_${motivo}` : dim ? `invocar_${dim}` : INVOCAR[tipo] || 'carta_colocar'); if (tipo === 'protagonista') vibrar(25); },
  monedaLanzar: () => efecto('moneda_lanzar', { variar: 0.03 }),
  monedaCae: () => { efecto('moneda_cae', { variar: 0.03 }); vibrar(20); },
  // Combate: el golpe crece con el daño.
  ataque: (danio = 30) => { efecto(danio >= 50 ? 'ataque_fuerte' : 'ataque_ligero', { tono: danio >= 70 ? 0.92 : 1 }); vibrar(danio >= 50 ? [30, 20, 40] : 35); },
  ventaja: () => efecto('ventaja'),
  protegido: () => efecto('proteger'),
  curar: () => efecto('curar'),
  caida: () => { efecto('caida'); vibrar([40, 30, 40]); },
  // Partida
  saber: () => efecto('saber', { variar: 0.06 }),
  conexion: () => efecto('conexion'),
  hito: () => { efecto('hito'); vibrar([80, 40, 80]); },
  turno: (rival = false) => efecto(rival ? 'turno_rival' : 'turno_propio'),
  viaje: () => efecto('viaje', { variar: 0.02 }),
  victoria: () => efecto('victoria', { variar: 0 }),
  derrota: () => efecto('derrota', { variar: 0 }),
};
