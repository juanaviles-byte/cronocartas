// Torneo de eliminación directa para el día de juegos. Funciones puras: reciben un torneo y devuelven otro.
import { barajar } from './rng.js';

const clonar = x => JSON.parse(JSON.stringify(x));

export function crearTorneo({ participantes, curso, rng, modo = 'normal', duelo = null, hitos = 3 }) {
  const nombres = participantes.map(n => String(n).trim()).filter(Boolean);
  if (nombres.length < 2) throw new Error('Se necesitan al menos 2 participantes');
  if (nombres.length > 32) throw new Error('Máximo 32 participantes');
  if (new Set(nombres.map(n => n.toLowerCase())).size !== nombres.length) throw new Error('Hay nombres repetidos');
  let tam = 2;
  while (tam < nombres.length) tam *= 2;
  const orden = barajar(nombres, rng);
  const directos = tam - nombres.length;
  const primera = [];
  let k = 0;
  for (let i = 0; i < tam / 2; i++) {
    if (i < directos) { primera.push({ a: orden[k], b: null, directo: true, ganador: orden[k] }); k += 1; }
    else { primera.push({ a: orden[k], b: orden[k + 1], directo: false, ganador: null }); k += 2; }
  }
  const rondas = [primera];
  for (let n = tam / 4; n >= 1; n /= 2) rondas.push(Array.from({ length: n }, () => ({ a: null, b: null, directo: false, ganador: null })));
  rondas.forEach((r, ri) => r.forEach((p, pi) => { p.id = `r${ri}p${pi}`; p.ronda = ri; }));
  return propagar({ version: 1, curso, modo, duelo, hitos, participantes: nombres, rondas });
}

function propagar(t) {
  for (let r = 1; r < t.rondas.length; r++) {
    t.rondas[r].forEach((p, i) => {
      p.a = t.rondas[r - 1][2 * i].ganador;
      p.b = t.rondas[r - 1][2 * i + 1].ganador;
    });
  }
  return t;
}

export const partidasPendientes = t => t.rondas.flat().filter(p => p.a && p.b && !p.ganador);

export function anotarGanador(torneo, id, nombre) {
  const t = clonar(torneo);
  const p = t.rondas.flat().find(x => x.id === id);
  if (!p || !p.a || !p.b || p.ganador) throw new Error('Esa partida no está pendiente');
  if (nombre !== p.a && nombre !== p.b) throw new Error('Ese nombre no juega esta partida');
  p.ganador = nombre;
  return propagar(t);
}

export const campeon = t => t.rondas[t.rondas.length - 1][0].ganador;

export function nombreRonda(t, r) {
  const faltan = t.rondas.length - r;
  return faltan === 1 ? 'Final' : faltan === 2 ? 'Semifinal' : faltan === 3 ? 'Cuartos de final' : `Ronda ${r + 1}`;
}
