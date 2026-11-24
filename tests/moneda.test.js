import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { quienElige, lanzarMoneda, quienParte, LADOS } from '../js/moneda.js';
import { crearPartida, jugadasValidas } from '../js/motor.js';
import { mazoSimple, prepararRapido } from './ayudas.js';

// Sorteo con la moneda SIU: un jugador al azar elige un lado; si acierta, parte él; si no, el otro.
const fijo = v => () => v;

test('quién elige y qué lado sale dependen solo del azar, mitad y mitad', () => {
  assert.equal(quienElige(fijo(0.2)), 'A');
  assert.equal(quienElige(fijo(0.7)), 'B');
  assert.equal(lanzarMoneda(fijo(0.2)), 'anverso');
  assert.equal(lanzarMoneda(fijo(0.7)), 'reverso');
  assert.deepEqual(LADOS, ['anverso', 'reverso']);
});

test('si acierta, parte quien eligió; si no, parte el otro', () => {
  assert.equal(quienParte('A', 'anverso', 'anverso'), 'A');
  assert.equal(quienParte('A', 'anverso', 'reverso'), 'B');
  assert.equal(quienParte('B', 'reverso', 'reverso'), 'B');
  assert.equal(quienParte('B', 'reverso', 'anverso'), 'A');
});

test('con elecciones cualesquiera, cada jugador parte la mitad de las veces', () => {
  let a = 0; const N = 20000;
  for (let i = 0; i < N; i++) {
    const elige = quienElige(); const eleccion = i % 3 ? 'anverso' : 'reverso';   // aunque alguien elija siempre lo mismo
    if (quienParte(elige, eleccion, lanzarMoneda()) === 'A') a++;
  }
  assert.ok(Math.abs(a / N - 0.5) < 0.02, `A partió ${(100 * a / N).toFixed(1)} %`);
});

test('el motor deja partir a quien ganó el sorteo', () => {
  const e = prepararRapido(crearPartida({ mazoA: mazoSimple(), mazoB: mazoSimple(), semilla: 3, primero: 'B' }));
  assert.equal(e.fase, 'turno');
  assert.equal(e.turno, 'B');
  assert.equal(e.numeroTurno, 1);
  assert.ok(!jugadasValidas(e).some(j => j.tipo === 'accion'), 'quien parte no ataca en su primer turno');
  const e2 = prepararRapido(crearPartida({ mazoA: mazoSimple(), mazoB: mazoSimple(), semilla: 3 }));
  assert.equal(e2.turno, 'A', 'sin sorteo parte A, como antes');
});

test('la mesa hace el sorteo con las dos caras de la moneda, salvo en el tutorial', () => {
  assert.ok(existsSync('img/moneda/anverso.webp') && existsSync('img/moneda/reverso.webp'));
  const mesa = readFileSync('js/ui/mesa.js', 'utf8');
  assert.match(mesa, /sorteoInicial\(/);
  assert.match(mesa, /config\.modo === 'tutorial'/);
  assert.match(mesa, /primero: config\.primero/);
});
