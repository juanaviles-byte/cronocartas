import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { aplicarEdiciones, limpiarEdicion, crearPaquete, sanearPaquete } from '../js/ediciones.js';

const leer = f => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const M7 = leer('mazo-7.json').cartas;
const AULA = leer('aula.json').cartas;
const IMG = 'data:image/jpeg;base64,AAAA';

test('aplicarEdiciones cambia los campos editados sin mutar el original', () => {
  const id = M7[0].id, original = JSON.stringify(M7);
  const r = aplicarEdiciones(M7, { [id]: { nombre: 'Nuevo nombre', dato: 'Un dato corregido por el profesor para la carta.' } }, {});
  assert.equal(r[0].nombre, 'Nuevo nombre');
  assert.equal(r[0].dato, 'Un dato corregido por el profesor para la carta.');
  assert.equal(JSON.stringify(M7), original);
});

test('aplicarEdiciones agrega la imagen guardada', () => {
  const r = aplicarEdiciones(AULA, {}, { [AULA[0].id]: IMG });
  assert.equal(r[0].imagen, IMG);
  assert.equal(r[1].imagen, undefined);
});

test('una edición que deja la carta inválida se ignora', () => {
  const p = M7.find(c => c.tipo === 'protagonista');
  const r = aplicarEdiciones(M7, { [p.id]: { resistencia: 500 } }, {});
  assert.equal(r.find(c => c.id === p.id).resistencia, p.resistencia);
});

test('limpiarEdicion deja solo campos conocidos y tipos válidos', () => {
  const e = limpiarEdicion({ nombre: 'X'.repeat(50), tipo: 'aula', efecto: { tipo: 'robar', n: 99 }, emblema: 'nada', resistencia: '80',
    acciones: [{ nombre: 'A', costo: 1, danio: 20, efecto: { tipo: 'curar', n: 999 } }, {}, {}] });
  assert.equal(e.nombre.length, 30);
  assert.equal(e.tipo, undefined);
  assert.equal(e.efecto, undefined);
  assert.equal(e.emblema, undefined);
  assert.equal(e.resistencia, 80);
  assert.equal(e.acciones.length, 2);
  assert.equal(e.acciones[0].efecto, undefined);
});

test('paquete de ediciones ida y vuelta', () => {
  const id = M7[0].id;
  const p = JSON.parse(JSON.stringify(crearPaquete({ [id]: { nombre: 'Otro' } }, { [id]: IMG })));
  const r = sanearPaquete(p);
  assert.deepEqual(r.errores, []);
  assert.equal(r.ediciones[id].nombre, 'Otro');
  assert.equal(r.imagenes[id], IMG);
});

test('sanearPaquete rechaza archivos ajenos o dañados sin lanzar', () => {
  for (const x of [null, 'basura', '{"a":1}', { app: 'otra' }, { app: 'cronocartas', tipo: 'ediciones', v: 1, ediciones: 'x' }]) {
    const r = sanearPaquete(x);
    assert.ok(r.errores.length > 0);
    assert.deepEqual(r.ediciones, {});
  }
});

test('sanearPaquete descarta ids desconocidos e imágenes que no son data URL de imagen', () => {
  const r = sanearPaquete({ app: 'cronocartas', tipo: 'ediciones', v: 1,
    ediciones: { '<script>': { nombre: 'x' }, 'CC-7-U1-001': { nombre: 'Bien' } },
    imagenes: { 'CC-7-U1-001': 'javascript:alert(1)', 'CC-A-E9': 'data:image/png;base64,QUJD' } });
  assert.deepEqual(Object.keys(r.ediciones), ['CC-7-U1-001']);
  assert.deepEqual(Object.keys(r.imagenes), ['CC-A-E9']);
});
