import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mazosDePartida, MAZOS_LIBRES, tablerosDisponibles } from '../js/eleccion.js';
import { COLECCIONES } from '../js/colecciones.js';

// Modo libre: cada jugador usa el mazo de un curso distinto; contra la tablet, su mazo puede ser al azar.
const azar = valor => () => valor;

test('con el mazo del curso, los dos juegan con el mismo curso', () => {
  const r = mazosDePartida({ mazo: 'curso', cursoA: 5, cursoB: 8, reforzar: true }, azar(0));
  assert.deepEqual(r, { cursoA: 5, cursoB: 5, reforzar: true });
});

test('en modo libre, 5° puede enfrentarse a 8°', () => {
  const r = mazosDePartida({ mazo: 'libre', cursoA: 5, cursoB: 8, reforzar: false }, azar(0));
  assert.deepEqual(r, { cursoA: 5, cursoB: 8, reforzar: false, coleccionA: null, coleccionB: null });
});

test('en modo libre, una expansión es un mazo más: 7° contra Leyendas del Fin del Mundo', () => {
  const r = mazosDePartida({ mazo: 'libre', cursoA: 7, cursoB: 'fin-del-mundo' }, azar(0));
  // El lado de la expansión toma el curso del rival: así el tablero y las unidades salen de ese curso.
  assert.deepEqual(r, { cursoA: 7, cursoB: 7, reforzar: false, coleccionA: null, coleccionB: 'fin-del-mundo' });
});

test('en modo libre, dos expansiones también pueden enfrentarse', () => {
  const r = mazosDePartida({ mazo: 'libre', cursoA: 'fin-del-mundo', cursoB: 'fin-del-mundo' }, azar(0));
  assert.equal(r.coleccionA, 'fin-del-mundo');
  assert.equal(r.coleccionB, 'fin-del-mundo');
  assert.ok(MAZOS_LIBRES.includes(r.cursoA));
});

test('la lista de mazos del modo libre trae los cuatro cursos y cada expansión', () => {
  assert.deepEqual(MAZOS_LIBRES, [5, 6, 7, 8, ...COLECCIONES.map(c => c.id)]);
});

test('en modo libre no se refuerza una unidad: los cursos no comparten unidades', () => {
  assert.equal(mazosDePartida({ mazo: 'libre', cursoA: 6, cursoB: 7, reforzar: true }, azar(0)).reforzar, false);
});

test('el mazo al azar de la tablet sale de cualquiera de los cursos o expansiones', () => {
  const n = MAZOS_LIBRES.length;
  const salidas = MAZOS_LIBRES.map((_, i) => {
    const r = mazosDePartida({ mazo: 'libre', cursoA: 5, cursoB: 'azar' }, azar((i + 0.5) / n));
    return r.coleccionB || r.cursoB;
  });
  assert.deepEqual(salidas, MAZOS_LIBRES);
});

test('la pantalla de nueva partida ofrece el modo libre y el mazo al azar de la tablet', () => {
  const app = readFileSync('js/ui/app.js', 'utf8');
  assert.match(app, /\['libre', 'Modo libre'/);
  assert.match(app, /'azar'/);
  assert.match(app, /mazosDePartida\(eleccion/);
  assert.match(app, /MAZOS_LIBRES/);
});

test('la mesa carga cada mazo del modo libre por separado (curso o expansión)', () => {
  const mesa = readFileSync('js/ui/mesa.js', 'utf8');
  assert.match(mesa, /config\.coleccionA/);
  assert.match(mesa, /config\.coleccionB/);
});

test('el panel docente ya no esconde los mazos cruzados', () => {
  assert.doesNotMatch(readFileSync('js/ui/docente.js', 'utf8'), /Mazos cruzados/);
});

test('en modo libre se ofrecen los tableros de todos los cursos; con el mazo del curso, solo los de ese curso', () => {
  const T = [{ id: 'T-5-1', curso: 5 }, { id: 'T-7-2', curso: 7 }, { id: 'T-8-3', curso: 8 }];
  assert.deepEqual(tablerosDisponibles(T, { libre: true, curso: 7 }).map(t => t.id), ['T-5-1', 'T-7-2', 'T-8-3']);
  assert.deepEqual(tablerosDisponibles(T, { libre: true, curso: null }).map(t => t.id), ['T-5-1', 'T-7-2', 'T-8-3']);
  assert.deepEqual(tablerosDisponibles(T, { libre: false, curso: 7 }).map(t => t.id), ['T-7-2']);
});

test('la mesa y la pantalla de nueva partida usan la misma lista de tableros', () => {
  assert.match(readFileSync('js/ui/mesa.js', 'utf8'), /tablerosDisponibles\(tableros, \{ libre: config\.libre/);
  assert.match(readFileSync('js/ui/app.js', 'utf8'), /tablerosDisponibles\(tableros, \{ libre: cruzados/);
});
