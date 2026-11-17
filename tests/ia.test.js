import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearPartida, jugadasValidas, aplicarJugada } from '../js/motor.js';
import { elegirJugada } from '../js/ia.js';
import { mazoSimple } from './ayudas.js';

export function simular(mazoA, mazoB, semilla, limite = 400) {
  let e = crearPartida({ mazoA, mazoB, semilla });
  let n = 0;
  while (e.fase !== 'fin' && n < limite) {
    const j = elegirJugada(e, e.turno);
    e = aplicarJugada(e, j).estado;
    n++;
  }
  return { estado: e, jugadas: n };
}

test('ia siempre devuelve una jugada válida', () => {
  let e = crearPartida({ mazoA: mazoSimple('Politica'), mazoB: mazoSimple('Cultura'), semilla: 1 });
  for (let i = 0; i < 100 && e.fase !== 'fin'; i++) {
    const j = elegirJugada(e, e.turno);
    assert.ok(jugadasValidas(e).some(v => JSON.stringify(v) === JSON.stringify(j)), JSON.stringify(j));
    e = aplicarJugada(e, j).estado;
  }
});

test('ia es determinista dado el estado', () => {
  const e = crearPartida({ mazoA: mazoSimple(), mazoB: mazoSimple(), semilla: 2 });
  assert.deepEqual(elegirJugada(e, 'A'), elegirJugada(e, 'A'));
});

test('200 partidas IA vs IA terminan con ganador en menos de 400 jugadas', () => {
  for (let s = 1; s <= 200; s++) {
    const { estado, jugadas } = simular(mazoSimple('Politica'), mazoSimple('Sociedad'), s);
    assert.equal(estado.fase, 'fin', `semilla ${s} no terminó (${jugadas})`);
    assert.ok(estado.ganador === 'A' || estado.ganador === 'B');
  }
});

test('la IA elige en una búsqueda el Protagonista de mayor valor', async () => {
  const { mesa, prot, aula } = await import('./ayudas.js');
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [aula({ tipo: 'buscarProtagonista', n: 3 })], reservaA: [prot('Sociedad'), prot('Sociedad')] });
  e.jugadores.A.mazo = [{ uid: 'q0', carta: prot('Sociedad', 50) }, { uid: 'q1', carta: prot('Cultura', 110) }, { uid: 'q2', carta: prot('Cultura', 60) }];
  e.jugadores.A.saberPendiente = 0;
  const j = elegirJugada(e, 'A');
  assert.equal(j.tipo, 'jugar');
  assert.equal(j.eleccion, 'q1');
});
