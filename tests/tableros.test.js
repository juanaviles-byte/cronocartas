import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { validarTablero, armarMazo, COMPOSICION } from '../js/mazos.js';
import { crearRng } from '../js/rng.js';

const leer = f => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const TABLEROS = leer('tableros.json').tableros;
const AULA = leer('aula.json').cartas;
const TODAS = [5, 6, 7, 8].flatMap(c => leer(`mazo-${c}.json`).cartas);

test('hay un tablero válido por cada unidad de cada curso, con su imagen', () => {
  assert.equal(TABLEROS.length, 16);
  for (const c of [5, 6, 7, 8]) for (const u of [1, 2, 3, 4]) assert.ok(TABLEROS.some(t => t.curso === c && t.unidad === u), `${c}-${u}`);
  for (const t of TABLEROS) {
    assert.deepEqual(validarTablero(t), [], t.id);
    assert.ok(existsSync(new URL(`../${t.imagen}`, import.meta.url)), t.imagen);
  }
});

test('los Lugares asociados a tableros existen y son Lugares', () => {
  for (const t of TABLEROS) for (const id of t.lugares) {
    const c = TODAS.find(x => x.id === id);
    assert.ok(c && c.tipo === 'lugar', `${t.id} → ${id}`);
  }
});

test('validarTablero detecta reglas desconocidas', () => {
  assert.ok(validarTablero({ id: 'T-9', nombre: 'x', regla: { tipo: 'volar' }, imagen: 'a.jpg', lugares: [] }).length > 0);
  assert.ok(validarTablero({ id: 'T-9', nombre: 'x', regla: { tipo: 'bonusDimension', dimension: 'Magia', n: 10 }, imagen: 'a.jpg', lugares: [] }).length > 0);
});

test('reforzar una unidad pone en el mazo todas sus cartas (hasta el cupo de cada tipo)', () => {
  const m7 = leer('mazo-7.json').cartas;
  for (const u of [1, 2, 3, 4]) for (let s = 1; s <= 10; s++) {
    const mazo = armarMazo(m7, AULA, crearRng(s), { unidad: u });
    assert.equal(mazo.length, 20);
    for (const tipo of ['protagonista', 'personaje', 'acontecimiento', 'lugar']) {
      const deUnidad = m7.filter(c => c.unidad === u && c.tipo === tipo);
      const enMazo = mazo.filter(c => c.unidad === u && c.tipo === tipo).length;
      assert.ok(enMazo >= Math.min(deUnidad.length, COMPOSICION[tipo]), `U${u} ${tipo}: ${enMazo}/${deUnidad.length}`);
    }
    for (const c of mazo.filter(c => c.evolucionaDe)) assert.ok(mazo.some(b => b.id === c.evolucionaDe));
  }
});
