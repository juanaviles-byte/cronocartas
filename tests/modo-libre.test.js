import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mazosDePartida } from '../js/eleccion.js';

// Modo libre: cada jugador usa el mazo de un curso distinto; contra la tablet, su mazo puede ser al azar.
const azar = valor => () => valor;

test('con el mazo del curso, los dos juegan con el mismo curso', () => {
  const r = mazosDePartida({ mazo: 'curso', cursoA: 5, cursoB: 8, reforzar: true }, azar(0));
  assert.deepEqual(r, { cursoA: 5, cursoB: 5, reforzar: true });
});

test('en modo libre, 5° puede enfrentarse a 8°', () => {
  const r = mazosDePartida({ mazo: 'libre', cursoA: 5, cursoB: 8, reforzar: false }, azar(0));
  assert.deepEqual(r, { cursoA: 5, cursoB: 8, reforzar: false });
});

test('en modo libre no se refuerza una unidad: los cursos no comparten unidades', () => {
  assert.equal(mazosDePartida({ mazo: 'libre', cursoA: 6, cursoB: 7, reforzar: true }, azar(0)).reforzar, false);
});

test('el mazo al azar de la tablet sale de cualquiera de los cuatro cursos', () => {
  const salidas = [0, 0.3, 0.6, 0.99].map(x => mazosDePartida({ mazo: 'libre', cursoA: 5, cursoB: 'azar' }, azar(x)).cursoB);
  assert.deepEqual(salidas, [5, 6, 7, 8]);
});

test('la pantalla de nueva partida ofrece el modo libre y el mazo al azar de la tablet', () => {
  const app = readFileSync('js/ui/app.js', 'utf8');
  assert.match(app, /\['libre', 'Modo libre'/);
  assert.match(app, /'azar'/);
  assert.match(app, /mazosDePartida\(eleccion/);
});

test('el panel docente ya no esconde los mazos cruzados', () => {
  assert.doesNotMatch(readFileSync('js/ui/docente.js', 'utf8'), /Mazos cruzados/);
});
