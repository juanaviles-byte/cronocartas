// Utilidades solo para pruebas.
import { crearPartida, jugadasValidas, aplicarJugada } from '../js/motor.js';

let n = 0;
export function prot(dimension, resistencia = 60, acciones = [{ nombre: 'Golpe', costo: 1, danio: 20 }], extra = {}) {
  n++;
  return { id: extra.id || `P${n}`, nombre: `Prot ${n}`, tipo: 'protagonista', curso: 7, unidad: 1,
    dimension, resistencia, retirada: 1, acciones, dato: 'Dato de prueba suficientemente largo.', oa: 'OA 1', emblema: 'templo', ...extra };
}
export function acont(efecto, extra = {}) {
  n++;
  return { id: extra.id || `E${n}`, nombre: `Acont ${n}`, tipo: 'acontecimiento', curso: 7, unidad: 1, efecto, dato: 'Dato.', oa: 'OA 1', emblema: 'pergamino', ...extra };
}
export function lugar(efecto, extra = {}) {
  n++;
  return { id: `L${n}`, nombre: `Lugar ${n}`, tipo: 'lugar', curso: 7, unidad: 1, efecto, dato: 'Dato.', oa: 'OA 1', emblema: 'montana', ...extra };
}
export function aula(efecto, extra = {}) {
  n++;
  return { id: `A${n}`, nombre: `Aula ${n}`, tipo: 'aula', efecto, dato: 'Dato.', mbe: { dominio: 'C', estandar: 9 }, emblema: 'libro', ...extra };
}
export function mazoSimple(dim = 'Politica') {
  const m = [];
  for (let i = 0; i < 12; i++) m.push(prot(dim, 60 + (i % 3) * 10, [{ nombre: 'Golpe', costo: 1, danio: 20 }, { nombre: 'Fuerte', costo: 2, danio: 40 }]));
  for (let i = 0; i < 8; i++) m.push(acont({ tipo: 'robar', n: 1 }));
  return m;
}

// Juega la preparación eligiendo el primer protagonista disponible.
export function prepararRapido(estado) {
  let e = estado;
  while (e.fase === 'preparacion') {
    const js = jugadasValidas(e);
    const j = js.find(x => x.tipo === 'colocar' && !e.jugadores[e.turno].activo) || js.find(x => x.tipo === 'listo');
    e = aplicarJugada(e, j).estado;
  }
  return e;
}

// Crea una partida en fase 'turno' y permite reemplazar la mesa.
export function mesa({ activoA, activoB, reservaA = [], reservaB = [], manoA = [], manoB = [], numeroTurno = 3, turno = 'A', lugarEnJuego = null, hitosParaGanar = 3 } = {}) {
  let e = prepararRapido(crearPartida({ mazoA: mazoSimple(), mazoB: mazoSimple(), semilla: 7, hitosParaGanar }));
  const inst = (carta, i, j) => ({ uid: `${j}x${i}${carta.id}`, carta, danio: 0, saber: 0, protegido: false, bonus: 0, turnoEntrada: 0 });
  const A = e.jugadores.A, B = e.jugadores.B;
  if (activoA) A.activo = inst(activoA, 0, 'A');
  if (activoB) B.activo = inst(activoB, 0, 'B');
  A.reserva = reservaA.map((c, i) => inst(c, i + 1, 'A'));
  B.reserva = reservaB.map((c, i) => inst(c, i + 1, 'B'));
  if (manoA.length) A.mano = manoA.map((c, i) => ({ uid: `Am${i}`, carta: c }));
  if (manoB.length) B.mano = manoB.map((c, i) => ({ uid: `Bm${i}`, carta: c }));
  e.numeroTurno = numeroTurno; e.turno = turno; e.lugar = lugarEnJuego ? { uid: 'Lx', carta: lugarEnJuego } : null; e.fase = 'turno';
  e.jugadores[turno].saberPendiente = 1;
  return e;
}
export const jugar = (e, j) => aplicarJugada(e, j);
