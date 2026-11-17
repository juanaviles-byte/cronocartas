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

test('armarMazo devuelve 20 con la proporción 11/3/3/1/2', () => {
  assert.deepEqual(COMPOSICION, { protagonista: 11, personaje: 3, acontecimiento: 3, lugar: 1, aula: 2 });
  for (const m of CURSOS) for (let s = 1; s <= 20; s++) {
    const mazo = armarMazo(m.cartas, AULA, crearRng(s));
    assert.equal(mazo.length, 20);
    const n = t => mazo.filter(c => c.tipo === t).length;
    assert.deepEqual([n('protagonista'), n('personaje'), n('acontecimiento'), n('lugar'), n('aula')], [11, 3, 3, 1, 2]);
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

test('cada curso tiene al menos 3 Personajes con efecto válido y al menos 12 Protagonistas', () => {
  for (const m of CURSOS) {
    const pj = m.cartas.filter(c => c.tipo === 'personaje');
    assert.ok(pj.length >= 3, `personajes ${m.curso}`);
    assert.ok(m.cartas.filter(c => c.tipo === 'protagonista').length >= 12, `protagonistas ${m.curso}`);
    for (const c of pj) assert.deepEqual(validarCarta(c), [], c.id);
  }
});

test('las personas históricas ya no son Protagonistas', () => {
  const personas = ['Cristóbal Colón', 'Hernando de Magallanes', 'Pedro de Valdivia', 'Inés de Suárez', 'Lautaro', "Bernardo O'Higgins",
    'José Miguel Carrera', 'Javiera Carrera', 'Andrés Bello', 'Gabriela Mistral', 'Leonardo da Vinci', 'Martín Lutero', 'Bartolomé de las Casas', 'Montesquieu'];
  const todas = CURSOS.flatMap(m => m.cartas);
  for (const nombre of personas) {
    const c = todas.find(x => x.nombre === nombre);
    assert.ok(c, nombre);
    assert.equal(c.tipo, 'personaje', nombre);
  }
});

test('cada curso tiene al menos 5 conexiones históricas y 4 habilidades válidas', () => {
  for (const m of CURSOS) {
    const cx = m.cartas.flatMap(c => (c.conexiones || []).map(x => ({ ...x, de: c.id })));
    assert.ok(cx.length >= 5, `conexiones ${m.curso}: ${cx.length}`);
    for (const x of cx) {
      assert.ok(m.cartas.some(c => c.id === x.causa), `${x.de} → causa ${x.causa}`);
      assert.ok(x.texto.length >= 15 && x.texto.length <= 140, `${x.de} texto`);
    }
    assert.ok(m.cartas.filter(c => c.habilidad).length >= 4, `habilidades ${m.curso}`);
  }
});

test('validarCarta detecta habilidades desconocidas y conexiones mal formadas', () => {
  const c = structuredClone(CURSOS[2].cartas.find(c => c.tipo === 'protagonista'));
  assert.ok(validarCarta({ ...c, habilidad: { nombre: 'X', tipo: 'volar' } }).length > 0);
  assert.ok(validarCarta({ ...c, conexiones: [{ causa: 5 }] }).length > 0);
  assert.ok(validarMazo([...CURSOS[2].cartas.filter(x => x.id !== c.id), { ...c, conexiones: [{ causa: 'NO-EXISTE', texto: 'una explicación larga' }] }]).some(e => e.includes('NO-EXISTE')));
});

test('toda carta tiene una frase corta (≤ 80 letras) para mostrar sobre la ilustración', () => {
  for (const c of [...CURSOS.flatMap(m => m.cartas), ...AULA]) {
    assert.equal(typeof c.frase, 'string', c.id);
    assert.ok(c.frase.length >= 10 && c.frase.length <= 80, `${c.id}: ${c.frase.length}`);
  }
});

test('validarCarta revisa la fecha: año entero y texto corto', () => {
  const c = CURSOS[0].cartas.find(x => x.fecha);
  assert.ok(c, 'hay cartas con fecha');
  assert.deepEqual(validarCarta(c), []);
  assert.ok(validarCarta({ ...c, fecha: { anio: 'x', texto: '1492' } }).length);
  assert.ok(validarCarta({ ...c, fecha: { anio: 1492, texto: 'x'.repeat(31) } }).length);
});
