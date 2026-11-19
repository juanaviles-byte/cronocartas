import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { validarMazo, armarMazo, COMPOSICION } from '../js/mazos.js';
import { DANIO_POR_SABER } from '../js/balance.js';
import { EMBLEMAS } from '../js/ui/arte.js';
import { coleccion } from '../js/colecciones.js';
import { crearRng } from '../js/rng.js';

const X = JSON.parse(readFileSync('data/exp-fin-del-mundo.json', 'utf8'));
const FUERZAS = ['Mar', 'TierraFuego', 'CieloViento', 'BosqueNoche'];

test('40 cartas FM-001..FM-040 válidas, con la composición acordada', () => {
  assert.equal(X.coleccion, 'fin-del-mundo');
  assert.equal(X.cartas.length, 40);
  assert.deepEqual(X.cartas.map(c => c.id), Array.from({ length: 40 }, (_, i) => `FM-${String(i + 1).padStart(3, '0')}`));
  assert.deepEqual(validarMazo(X.cartas), []);
  const n = t => X.cartas.filter(c => c.tipo === t).length;
  assert.deepEqual([n('protagonista'), n('personaje'), n('acontecimiento'), n('lugar')], [24, 6, 6, 4]);
  for (const f of FUERZAS) {
    assert.equal(X.cartas.filter(c => c.tipo === 'protagonista' && c.dimension === f).length, 6, f);
    assert.equal(X.cartas.filter(c => c.tipo === 'lugar' && c.efecto.dimension === f && c.efecto.n === 10).length, 1, f);
  }
});

test('sin fechas ni OA; cada carta dice de dónde viene, con emblema y frase', () => {
  const nombres = new Set();
  for (const c of X.cartas) {
    for (const k of ['fecha', 'oa', 'curso', 'unidad']) assert.equal(c[k], undefined, `${c.id}.${k}`);
    assert.equal(c.coleccion, 'fin-del-mundo', c.id);
    assert.ok(c.zona && c.zona.length <= 40, `${c.id}: zona`);
    assert.ok(c.dato.length >= 40 && c.dato.length <= 220, `${c.id}: dato de ${c.dato.length}`);
    assert.ok(c.frase && c.frase.length <= 70, `${c.id}: frase`);
    assert.ok(EMBLEMAS.includes(c.emblema), `${c.id}: emblema ${c.emblema}`);
    assert.ok(!nombres.has(c.nombre), `nombre repetido ${c.nombre}`); nombres.add(c.nombre);
  }
});

test('las presencias sagradas son Personajes con efecto de apoyo y dato con respeto', () => {
  const sagrados = ['Ngenechen', 'Pillán', 'Make Make', 'Pachamama', 'Achachilas', 'Temáukel'];
  assert.deepEqual(X.cartas.filter(c => c.tipo === 'personaje').map(c => c.nombre).sort(), [...sagrados].sort());
  for (const c of X.cartas.filter(c => c.tipo === 'personaje')) {
    assert.ok(['curar', 'curarTodos', 'proteger', 'bonusDanio', 'robar', 'saberExtra', 'moverSaber'].includes(c.efecto.tipo), c.nombre);
    assert.match(c.dato, /^Para (el pueblo|los pueblos)/, `${c.nombre}: el dato parte con «Para el pueblo…»`);
  }
});

test('el balance de la expansión está dentro de los rangos de los cursos', () => {
  for (const c of X.cartas.filter(c => c.tipo === 'protagonista')) {
    assert.ok(c.resistencia >= 60 && c.resistencia <= 110, `${c.id}: resistencia`);
    assert.ok([1, 2].includes(c.retirada), `${c.id}: retirada`);
    for (const a of c.acciones) {
      assert.ok(a.nombre.length <= 22, `${c.id}: nombre de acción largo`);
      assert.ok(a.danio <= a.costo * DANIO_POR_SABER, `${c.id}: ${a.nombre} hace demasiado daño para su costo`);
    }
  }
  // Ninguna fuerza es mucho más fuerte que otra: resistencia total y daño máximo total parecidos.
  const suma = (f, g) => X.cartas.filter(c => c.tipo === 'protagonista' && c.dimension === f).reduce((s, c) => s + g(c), 0);
  for (const g of [c => c.resistencia, c => Math.max(...c.acciones.map(a => a.danio))]) {
    const v = FUERZAS.map(f => suma(f, g));
    assert.ok(Math.max(...v) - Math.min(...v) <= Math.max(...v) * 0.12, `fuerzas desparejas: ${v}`);
  }
});

test('con el mazo completo de la expansión se arma un mazo de 20 sin cartas de aula', () => {
  for (let s = 1; s <= 20; s++) {
    const m = armarMazo(X.cartas, [], crearRng(s));
    assert.equal(m.length, 20);
    assert.equal(m.filter(c => c.tipo === 'protagonista').length >= COMPOSICION.protagonista, true);
    assert.ok(m.every(c => c.coleccion === 'fin-del-mundo'));
  }
});

test('la carga de la expansión existe y usa el archivo de la colección', () => {
  const mazos = readFileSync('js/mazos.js', 'utf8');
  assert.match(mazos, /export async function cargarExpansion\(/);
  const datos = readFileSync('js/ui/datos.js', 'utf8');
  assert.match(datos, /export async function cargarColeccionCompleta\(/);
  assert.equal(coleccion('fin-del-mundo').archivo, 'data/exp-fin-del-mundo.json');
});

test('cada carta de la expansión tiene su ilustración registrada', () => {
  const arte = JSON.parse(readFileSync('data/arte.json', 'utf8'));
  for (const c of X.cartas) {
    assert.equal(arte[c.id], `img/cartas/${c.id}.webp`, c.id);
    assert.ok(existsSync(arte[c.id]), `falta ${arte[c.id]}`);
  }
});
