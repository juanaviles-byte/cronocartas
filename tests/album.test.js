import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearAlmacen } from '../js/almacen.js';
import { crearAlbum, cartasVisibles } from '../js/album.js';
import { prot, acont, lugar, mesa } from './ayudas.js';

const cartasCurso = [
  { id: 'C-1', curso: 7, unidad: 1, nombre: 'Uno' }, { id: 'C-2', curso: 7, unidad: 1, nombre: 'Dos' },
  { id: 'C-3', curso: 7, unidad: 2, nombre: 'Tres' },
];
const UNIDADES = { 7: ['Primeras sociedades', 'Antigüedad clásica'] };

test('cartasVisibles toma la mesa, los descartes, el Lugar y solo la mano de los humanos', () => {
  const e = mesa({ activoA: prot('Politica', 60, undefined, { id: 'PA' }), activoB: prot('Cultura', 60, undefined, { id: 'PB' }),
    manoA: [acont({ tipo: 'robar', n: 1 }, { id: 'MA' })], manoB: [acont({ tipo: 'robar', n: 1 }, { id: 'MB' })],
    lugarEnJuego: lugar({ tipo: 'bonusDimension', dimension: 'Cultura', n: 10 }) });
  e.jugadores.B.descarte.push({ uid: 'd', carta: { id: 'DB' } });
  const v = cartasVisibles(e, ['A']);
  for (const id of ['PA', 'PB', 'MA', 'DB', e.lugar.carta.id]) assert.ok(v.has(id), id);
  assert.ok(!v.has('MB'), 'la mano de la tablet no se ve');
});

test('descubrir guarda las cartas nuevas y entrega la insignia al completar una unidad', () => {
  const album = crearAlbum(crearAlmacen(null));
  let r = album.descubrir(['C-1'], cartasCurso, UNIDADES);
  assert.deepEqual(r.nuevas, ['C-1']);
  assert.deepEqual(r.insignias, []);
  r = album.descubrir(['C-1', 'C-2', 'X-99'], cartasCurso, UNIDADES);
  assert.deepEqual(r.nuevas, ['C-2']);
  assert.deepEqual(r.insignias, [{ clave: '7-1', curso: 7, unidad: 1, nombre: 'Primeras sociedades' }]);
  assert.deepEqual(album.descubrir(['C-2'], cartasCurso, UNIDADES).insignias, [], 'la insignia se entrega una vez');
});

test('progreso cuenta descubiertas por unidad y reiniciar borra todo', () => {
  const album = crearAlbum(crearAlmacen(null));
  album.descubrir(['C-1', 'C-3'], cartasCurso, UNIDADES);
  assert.deepEqual(album.progreso(cartasCurso), [{ unidad: 1, total: 2, descubiertas: 1 }, { unidad: 2, total: 1, descubiertas: 1 }]);
  assert.ok(album.tiene('C-3'));
  album.reiniciar();
  assert.ok(!album.tiene('C-3'));
  assert.deepEqual(album.insignias(), []);
});

test('las cartas de la comunidad no cuentan para el álbum', () => {
  const album = crearAlbum(crearAlmacen(null));
  const conComunidad = [...cartasCurso, { id: 'CC-COM-1', curso: 7, unidad: 1, comunidad: true }];
  album.descubrir(['C-1', 'C-2'], conComunidad, UNIDADES);
  assert.equal(album.insignias().length, 1);
  assert.deepEqual(album.progreso(conComunidad)[0], { unidad: 1, total: 2, descubiertas: 2 });
});
