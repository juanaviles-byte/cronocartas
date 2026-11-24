import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { jugadasValidas } from '../js/motor.js';
import { prot, mesa, jugar } from './ayudas.js';

// Equilibrio (noviembre 2026): una carta con 3 de Saber podía repetir su golpe fuerte cada turno,
// y la carta que entraba a reemplazar llegaba con 0 de Saber, sin poder defenderse.
const conSaber = (e, j, n) => { e.jugadores[j].activo.saber = n; return e; };
const FUERTE = [{ nombre: 'Débil', costo: 1, danio: 10 }, { nombre: 'Fuerte', costo: 3, danio: 30 }];
const acciones = e => jugadasValidas(e).filter(j => j.tipo === 'accion').map(j => j.indice);
// Pasa el turno del rival para volver al turno de A.
const vuelveA = e => jugar(e, { tipo: 'pasar' }).estado;

test('la carta que entra a reemplazar a una caída llega con +1 de Saber (refuerzo)', () => {
  let e = conSaber(mesa({ activoA: prot('Politica', 60, [{ nombre: 'X', costo: 1, danio: 50 }]), activoB: prot('Cultura', 50), reservaB: [prot('Sociedad')] }), 'A', 1);
  const r = jugar(e, { tipo: 'accion', indice: 0 }).estado;
  const uid = r.jugadores.B.reserva[0].uid;
  const { estado, eventos } = jugar(r, { tipo: 'promover', uid });
  assert.equal(estado.jugadores.B.activo.saber, 1);
  assert.ok(eventos.some(ev => ev.tipo === 'refuerzo' && ev.jugador === 'B'));
});

test('tras un ataque de costo 3, esa carta no puede repetir un ataque de costo 3 en su turno siguiente', () => {
  let e = conSaber(mesa({ activoA: prot('Politica', 200, FUERTE), activoB: prot('Cultura', 200, FUERTE) }), 'A', 3);
  assert.deepEqual(acciones(e), [0, 1]);
  e = jugar(e, { tipo: 'accion', indice: 1 }).estado;   // A usa el golpe fuerte
  e = vuelveA(e);                                        // turno de B: pasa
  assert.equal(e.turno, 'A');
  assert.deepEqual(acciones(e), [0], 'descansa: solo el ataque barato');
  assert.equal(e.jugadores.A.activo.descansa, true);
  e = jugar(e, { tipo: 'accion', indice: 0 }).estado;   // usa el débil
  e = vuelveA(e);
  assert.deepEqual(acciones(e), [0, 1], 'después del descanso vuelve el golpe fuerte');
});

test('el descanso no se salta pasando el turno: dura exactamente un turno propio', () => {
  let e = conSaber(mesa({ activoA: prot('Politica', 200, FUERTE), activoB: prot('Cultura', 200, FUERTE) }), 'A', 3);
  e = jugar(e, { tipo: 'accion', indice: 1 }).estado;
  e = vuelveA(e);
  e = jugar(e, { tipo: 'pasar' }).estado;   // A descansa sin atacar
  e = vuelveA(e);
  assert.deepEqual(acciones(e), [0, 1]);
});

test('los ataques de costo 1 y 2 se pueden repetir como siempre', () => {
  const MEDIO = [{ nombre: 'Medio', costo: 2, danio: 20 }];
  let e = conSaber(mesa({ activoA: prot('Politica', 200, MEDIO), activoB: prot('Cultura', 200, MEDIO) }), 'A', 2);
  e = jugar(e, { tipo: 'accion', indice: 0 }).estado;
  e = vuelveA(e);
  assert.deepEqual(acciones(e), [0]);
});

test('la mesa avisa en el botón que la carta descansa', () => {
  const mesaJs = readFileSync('js/ui/mesa.js', 'utf8');
  assert.match(mesaJs, /Descansa este turno/);
  assert.match(mesaJs, /refuerzo/);
});
