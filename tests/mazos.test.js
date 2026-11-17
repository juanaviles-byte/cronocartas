import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validarCarta, validarMazo, armarMazo, COMPOSICION } from '../js/mazos.js';
import { crearRng } from '../js/rng.js';
import { crearPartida, aplicarJugada } from '../js/motor.js';
import { elegirJugada } from '../js/ia.js';

const leer = f => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const AULA = leer('aula.json').cartas;
const CURSOS = [5, 6, 7, 8].map(c => ({ curso: c, ...leer(`mazo-${c}.json`) }));

test('los 4 mazos reales y aula.json pasan validarMazo sin errores', () => {
  for (const m of CURSOS) assert.deepEqual(validarMazo(m.cartas), [], `mazo ${m.curso}`);
  assert.deepEqual(validarMazo(AULA), []);
  assert.equal(AULA.length, 7);
});

test('cada mazo tiene 4 unidades con cartas y todas las dimensiones', () => {
  for (const m of CURSOS) {
    assert.equal(m.unidades.length, 4);
    for (const u of [1, 2, 3, 4]) assert.ok(m.cartas.some(c => c.unidad === u), `${m.curso} U${u}`);
    const dims = new Set(m.cartas.filter(c => c.dimension).map(c => c.dimension));
    assert.equal(dims.size, 5, `dimensiones ${m.curso}`);
  }
});

test('validarMazo detecta evolucionaDe inexistente', () => {
  const m = structuredClone(CURSOS[0].cartas);
  m.find(c => c.evolucionaDe).evolucionaDe = 'NO-EXISTE';
  assert.ok(validarMazo(m).some(e => e.includes('NO-EXISTE')));
});

test('validarMazo detecta ids repetidos', () => {
  const m = structuredClone(CURSOS[0].cartas);
  m[1].id = m[0].id;
  assert.ok(validarMazo(m).length > 0);
});

test('validarCarta detecta dimensión mal escrita', () => {
  const c = structuredClone(CURSOS[0].cartas.find(c => c.tipo === 'protagonista'));
  c.dimension = 'Política';
  assert.ok(validarCarta(c).length > 0);
});

test('armarMazo devuelve 20 con la proporción 12/4/2/2', () => {
  assert.deepEqual(COMPOSICION, { protagonista: 12, acontecimiento: 4, lugar: 2, aula: 2 });
  for (const m of CURSOS) for (let s = 1; s <= 20; s++) {
    const mazo = armarMazo(m.cartas, AULA, crearRng(s));
    assert.equal(mazo.length, 20);
    const n = t => mazo.filter(c => c.tipo === t).length;
    assert.deepEqual([n('protagonista'), n('acontecimiento'), n('lugar'), n('aula')], [12, 4, 2, 2]);
  }
});

test('toda Etapa 2 en el mazo armado tiene su base', () => {
  for (const m of CURSOS) for (let s = 1; s <= 50; s++) {
    const mazo = armarMazo(m.cartas, AULA, crearRng(s));
    for (const c of mazo.filter(c => c.evolucionaDe)) assert.ok(mazo.some(b => b.id === c.evolucionaDe), `${m.curso} s${s} ${c.id}`);
  }
});

test('armarMazo mezcla las 4 unidades', () => {
  for (const m of CURSOS) {
    const mazo = armarMazo(m.cartas, AULA, crearRng(3));
    assert.equal(new Set(mazo.filter(c => c.unidad).map(c => c.unidad)).size, 4);
  }
});

test('armarMazo funciona con pocas cartas repitiendo', () => {
  const pocos = CURSOS[0].cartas.filter(c => c.tipo === 'protagonista' && !c.evolucionaDe).slice(0, 3)
    .concat(CURSOS[0].cartas.filter(c => c.tipo === 'acontecimiento').slice(0, 1));
  const mazo = armarMazo(pocos, AULA, crearRng(1));
  assert.equal(mazo.length, 20);
});

test('200 partidas IA vs IA por curso con mazos reales terminan', () => {
  for (const m of CURSOS) {
    const g = { A: 0, B: 0 };
    for (let s = 1; s <= 200; s++) {
      const r = crearRng(s * 31);
      let e = crearPartida({ mazoA: armarMazo(m.cartas, AULA, r), mazoB: armarMazo(m.cartas, AULA, r), semilla: s });
      let n = 0;
      while (e.fase !== 'fin' && n < 400) { e = aplicarJugada(e, elegirJugada(e, e.turno)).estado; n++; }
      assert.equal(e.fase, 'fin', `curso ${m.curso} semilla ${s}`);
      g[e.ganador]++;
    }
    assert.ok(g.A >= 60 && g.B >= 60, `equilibrio curso ${m.curso}: ${JSON.stringify(g)}`);
  }
});
