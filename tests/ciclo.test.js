// Ciclo de día y noche (expansión «El Ocaso de los Dioses»): luz pega +10 de día, sombra +10 de noche.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearPartida, desgloseDanio, aplicarJugada, jugadasValidas } from '../js/motor.js';
import { validarCarta } from '../js/mazos.js';
import { elegirJugada } from '../js/ia.js';
import { prot, acont, mazoSimple, prepararRapido } from './ayudas.js';

const clon = x => JSON.parse(JSON.stringify(x));
const golpe = [{ nombre: 'Golpe', costo: 1, danio: 20 }];
function mazoAspecto() {
  const m = mazoSimple('Politica');
  m[0] = prot('Politica', 60, golpe, { aspecto: 'luz' });
  return m;
}
function mesa(atk, def, ciclo) {
  const e = clon(crearPartida({ mazoA: mazoAspecto(), mazoB: mazoAspecto(), semilla: 3 }));
  e.fase = 'turno'; e.turno = 'A'; e.numeroTurno = 3; e.ciclo = ciclo; e.lugar = null; e.tablero = null;
  e.jugadores.A.activo = { uid: 'a', carta: atk, danio: 0, saber: 9, protegido: false, bonus: 0, turnoEntrada: 0 };
  e.jugadores.B.activo = { uid: 'b', carta: def, danio: 0, saber: 0, protegido: false, bonus: 0, turnoEntrada: 0 };
  return e;
}

test('una partida con cartas de luz o sombra empieza de día; sin ellas no hay ciclo', () => {
  assert.equal(crearPartida({ mazoA: mazoAspecto(), mazoB: mazoSimple(), semilla: 1 }).ciclo, 'dia');
  assert.equal(crearPartida({ mazoA: mazoSimple(), mazoB: mazoSimple(), semilla: 1 }).ciclo, null);
});

test('de día la luz suma 10 y la sombra no; de noche, al revés', () => {
  const luz = prot('Politica', 60, golpe, { aspecto: 'luz' }), sombra = prot('Politica', 60, golpe, { aspecto: 'sombra' });
  const neutro = prot('Politica', 60, golpe);
  const d = (a, ciclo) => desgloseDanio(mesa(a, prot('Politica', 90), ciclo), 'A', 0);
  assert.equal(d(luz, 'dia').total, 30);
  assert.deepEqual(d(luz, 'dia').pasos, [{ fuente: 'ciclo', valor: 10 }]);
  assert.equal(d(sombra, 'dia').total, 20);
  assert.equal(d(sombra, 'noche').total, 30);
  assert.equal(d(luz, 'noche').total, 20);
  assert.equal(d(neutro, 'dia').total, 20);
  assert.equal(d(luz, null).total, 20, 'sin ciclo no hay bonus');
});

test('el ciclo cambia cuando el turno vuelve a quien partió (cada ronda)', () => {
  let e = prepararRapido(crearPartida({ mazoA: mazoAspecto(), mazoB: mazoAspecto(), semilla: 5, primero: 'B' }));
  assert.equal(e.turno, 'B'); assert.equal(e.ciclo, 'dia');
  const pasar = () => { e = aplicarJugada(e, { tipo: 'pasar' }).estado; };
  pasar(); assert.equal(e.turno, 'A'); assert.equal(e.ciclo, 'dia');
  pasar(); assert.equal(e.turno, 'B'); assert.equal(e.ciclo, 'noche');
  pasar(); assert.equal(e.ciclo, 'noche');
  pasar(); assert.equal(e.ciclo, 'dia');
});

test('el cambio de ciclo se avisa con un evento', () => {
  let e = prepararRapido(crearPartida({ mazoA: mazoAspecto(), mazoB: mazoAspecto(), semilla: 5 }));
  e = aplicarJugada(e, { tipo: 'pasar' }).estado;
  const r = aplicarJugada(e, { tipo: 'pasar' });
  assert.ok(r.eventos.some(x => x.tipo === 'ciclo' && x.a === 'noche'));
});

test('un relato puede hacer caer la noche o traer el día, junto a otros efectos', () => {
  const noche = acont([{ tipo: 'ciclo', a: 'noche' }, { tipo: 'saberExtra', n: 1 }]);
  assert.deepEqual(validarCarta(noche), []);
  const m = mazoAspecto(); m[19] = noche;
  let e = prepararRapido(crearPartida({ mazoA: m, mazoB: mazoAspecto(), semilla: 2 }));
  e = clon(e); e.jugadores.A.mano.push({ uid: 'X', carta: noche });
  const saber = e.jugadores.A.activo.saber;
  const r = aplicarJugada(e, { tipo: 'jugar', uid: 'X' });
  assert.equal(r.estado.ciclo, 'noche');
  assert.equal(r.estado.jugadores.A.activo.saber, saber + 1);
  assert.ok(r.eventos.some(x => x.tipo === 'ciclo' && x.a === 'noche'));
});

test('el aspecto solo puede ser luz o sombra, y solo en Protagonistas', () => {
  assert.deepEqual(validarCarta(prot('Politica', 60, golpe, { aspecto: 'luz' })), []);
  assert.ok(validarCarta(prot('Politica', 60, golpe, { aspecto: 'gris' })).length);
  assert.ok(validarCarta(acont({ tipo: 'robar', n: 1 }, { aspecto: 'luz' })).length);
  assert.ok(validarCarta(acont({ tipo: 'ciclo', a: 'tarde' })).length);
});

test('la tablet juega un relato de noche cuando su activo es de sombra y no cuando es de luz', () => {
  const noche = acont({ tipo: 'ciclo', a: 'noche' });
  for (const [aspecto, espera] of [['sombra', true], ['luz', false]]) {
    const e = mesa(prot('Politica', 60, golpe, { aspecto }), prot('Politica', 90), 'dia');
    e.jugadores.A.saberPendiente = 0; e.numeroTurno = 2;
    e.jugadores.A.mano = [{ uid: 'X', carta: noche }];
    const j = elegirJugada(e, 'A');
    assert.equal(j.tipo === 'jugar' && j.uid === 'X', espera, aspecto);
  }
});

test('una partida guardada a medias recuerda la fase', () => {
  const e = clon(prepararRapido(crearPartida({ mazoA: mazoAspecto(), mazoB: mazoAspecto(), semilla: 4 })));
  e.ciclo = 'noche';
  const vuelta = JSON.parse(JSON.stringify(e));
  assert.equal(vuelta.ciclo, 'noche');
  assert.ok(jugadasValidas(vuelta).length > 0);
});
