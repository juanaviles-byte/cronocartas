import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { armarMazo, validarCarta, mazoDeBando, COMPOSICION } from '../js/mazos.js';
import { crearRng } from '../js/rng.js';

const leer = f => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const AULA = leer('aula.json').cartas;
const CURSOS = Object.fromEntries([5, 6, 7, 8].map(c => [c, leer(`mazo-${c}.json`)]));
const DUELOS = leer('duelos.json').duelos;
const TABLEROS = leer('tableros.json');
const revisar = mazo => {
  for (const c of mazo) assert.deepEqual(validarCarta(c), [], c.id);
  for (const [t, n] of Object.entries(COMPOSICION)) assert.equal(mazo.filter(c => c.tipo === t).length, n, t);
};
const EMBLEMAS = ['escudo', 'sol', 'estrella', 'corona', 'columna', 'montana', 'libro'];

test('cada duelo tiene 2 bandos con núcleo existente, sin cartas compartidas, y un tablero válido', () => {
  assert.ok(DUELOS.length >= 5);
  const ids = (Array.isArray(TABLEROS) ? TABLEROS : TABLEROS.tableros).map(t => t.id);
  for (const d of DUELOS) {
    assert.ok(ids.includes(d.tablero), d.id);
    assert.equal(d.bandos.length, 2, d.id);
    const nombres = CURSOS[d.curso].cartas.map(c => c.nombre);
    const [a, b] = d.bandos;
    for (const bando of d.bandos) {
      assert.ok(EMBLEMAS.includes(bando.emblema), bando.id);
      assert.match(bando.color, /^#[0-9A-Fa-f]{6}$/);
      for (const n of bando.nucleo) assert.ok(nombres.includes(n), `${d.id}/${bando.id}: ${n}`);
      assert.ok(bando.nucleo.some(n => CURSOS[d.curso].cartas.find(c => c.nombre === n).tipo === 'protagonista'), `${bando.id} sin Protagonista`);
    }
    assert.ok(!a.nucleo.some(n => b.nucleo.includes(n)), `${d.id} comparte cartas`);
  }
});

test('el mazo de un bando trae todo su núcleo, nada del núcleo rival y respeta la composición', () => {
  for (const d of DUELOS) for (const [k, bando] of d.bandos.entries()) for (const s of [1, 2, 3]) {
    const rival = d.bandos[1 - k];
    const mazo = mazoDeBando(CURSOS[d.curso].cartas, AULA, crearRng(s), d, bando.id);
    assert.equal(mazo.length, 20);
    revisar(mazo);
    const nombres = mazo.map(c => c.nombre);
    for (const n of bando.nucleo) {
      const c = CURSOS[d.curso].cartas.find(x => x.nombre === n);
      // Todo el núcleo entra, salvo que su tipo supere el cupo del mazo.
      const delTipo = bando.nucleo.filter(m => CURSOS[d.curso].cartas.find(x => x.nombre === m).tipo === c.tipo).length;
      if (delTipo <= COMPOSICION[c.tipo]) assert.ok(nombres.includes(n), `${bando.id} sin ${n}`);
    }
    for (const n of rival.nucleo) assert.ok(!nombres.includes(n), `${bando.id} tiene ${n} del rival`);
    for (const c of mazo.filter(x => x.evolucionaDe)) assert.ok(mazo.some(x => x.id === c.evolucionaDe), `${c.nombre} sin su base`);
  }
});

test('armarMazo sin núcleo funciona igual que antes', () => {
  const mazo = armarMazo(CURSOS[7].cartas, AULA, crearRng(4));
  assert.equal(mazo.length, 20);
  revisar(mazo);
});
