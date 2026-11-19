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

import { mazoDeBando } from '../js/mazos.js';
import { dorsoDeMazo } from '../js/ui/dorsos.js';
const DORSOS = JSON.parse(readFileSync('data/dorsos.json', 'utf8'));

test('los duelos de la expansión: La Guerra de las Serpientes y Luces y Sombras', () => {
  assert.deepEqual(X.duelos.map(d => d.nombre), ['La Guerra de las Serpientes', 'Luces y Sombras']);
  const nombres = new Set(X.cartas.map(c => c.nombre));
  const fuerzas = [];
  for (const d of X.duelos) {
    assert.equal(d.coleccion, 'fin-del-mundo'); assert.equal(d.soloNucleo, true);
    assert.ok(existsSync(d.arte), `falta ${d.arte}`);
    assert.equal(d.bandos.length, 2);
    const [a, b] = d.bandos;
    assert.ok(a.nucleo.every(n => !b.nucleo.includes(n)), `${d.id}: núcleos compartidos`);
    for (const bando of d.bandos) {
      assert.match(bando.id, /^fm-/);
      for (const n of bando.nucleo) assert.ok(nombres.has(n), `${bando.id}: ${n} no existe`);
      const prots = X.cartas.filter(c => c.tipo === 'protagonista' && bando.nucleo.includes(c.nombre));
      assert.equal(prots.length, 6, bando.id);
      fuerzas.push(prots[0].dimension);
      assert.ok(prots.every(c => c.dimension === prots[0].dimension), `${bando.id}: mezcla fuerzas`);
      assert.ok(X.cartas.some(c => c.tipo === 'lugar' && c.efecto.dimension === prots[0].dimension && bando.nucleo.includes(c.nombre)), `${bando.id}: sin su Lugar`);
    }
  }
  assert.deepEqual(fuerzas.sort(), ['BosqueNoche', 'CieloViento', 'Mar', 'TierraFuego']);
  assert.deepEqual(X.duelos[0].bandos.map(b => b.id), ['fm-mar', 'fm-tierra-fuego']);
});

test('un mazo de bando con soloNucleo tiene 20 cartas, todas de su núcleo', () => {
  for (const d of X.duelos) for (const b of d.bandos) for (let s = 1; s <= 10; s++) {
    const m = mazoDeBando(X.cartas, [], crearRng(s), d, b.id);
    assert.equal(m.length, 20, b.id);
    assert.ok(m.every(c => b.nucleo.includes(c.nombre)), `${b.id}: ${m.filter(c => !b.nucleo.includes(c.nombre)).map(c => c.nombre)}`);
  }
});

test('dorsos de la expansión: uno por bando y uno general que reemplaza al de Historia', () => {
  const fm = coleccion('fin-del-mundo');
  assert.ok(existsSync(fm.dorso), `falta ${fm.dorso}`);
  const cartas = X.cartas.slice(0, 20);
  assert.equal(dorsoDeMazo(DORSOS, cartas, null, fm.dorso), fm.dorso);
  for (const b of ['fm-mar', 'fm-tierra-fuego', 'fm-cielo-viento', 'fm-bosque-noche']) {
    const r = dorsoDeMazo(DORSOS, cartas, b, fm.dorso);
    assert.notEqual(r, fm.dorso, b); assert.ok(existsSync(r), `falta ${r}`);
  }
  // Los cursos siguen igual: sin general propio, el de Historia.
  assert.equal(dorsoDeMazo(DORSOS, [], null), DORSOS.general);
});

test('la mesa y la carta usan los datos de la colección (sin línea de tiempo, etiqueta y sigla propias)', () => {
  const mesa = readFileSync('js/ui/mesa.js', 'utf8');
  assert.match(mesa, /if \(colec\) \{ config\.linea = false;/);
  assert.match(mesa, /dorsoDeMazo\(dorsos, todas, bandoDe \? bandoDe\[j\]\.id : null, colec \? colec\.dorso : undefined\)/);
  assert.match(mesa, /tableroActual\(\) \|\| fondoColeccion/);
  const carta = readFileSync('js/ui/carta.js', 'utf8');
  assert.match(carta, /col \? col\.etiquetaDato : 'Dato histórico'/);
  assert.match(carta, /col \? esc\(col\.sigla\)/);
  const esc = JSON.parse(readFileSync('data/escenarios.json', 'utf8'));
  for (const c of X.cartas.filter(c => c.tipo === 'lugar')) assert.ok(existsSync(esc[c.id] || ''), `${c.id} sin escenario`);
  assert.ok(existsSync(coleccion('fin-del-mundo').fondo));
});

test('guiones de la expansión: narrador en 7 bloques que cubren las 40 cartas, y ambientes ME00–ME04', () => {
  const g = JSON.parse(readFileSync('docs/fin-del-mundo/narrador.json', 'utf8'));
  assert.deepEqual(g.narrador.map(b => b.id), ['FN01', 'FN02', 'FN03', 'FN04', 'FN05', 'FN06', 'FN07']);
  assert.deepEqual(g.narrador.flatMap(b => b.lineas.map(l => l.clave)), X.cartas.map(c => c.id));
  for (const b of g.narrador) for (const l of b.lineas) assert.ok(l.texto.startsWith(X.cartas.find(c => c.id === l.clave).nombre + '.'), l.clave);
  const amb = readFileSync('docs/fin-del-mundo/ambientes.md', 'utf8');
  for (const k of ['ME00', 'ME01', 'ME02', 'ME03', 'ME04']) assert.match(amb, new RegExp(`\\| ${k} \\|`));
  assert.match(readFileSync('js/ui/mesa.js', 'utf8'), /colec && colec\.ambiente/);
});

import { crearPartida, aplicarJugada } from '../js/motor.js';
import { elegirJugada } from '../js/ia.js';

test('las partidas de la expansión terminan: mazo completo y los dos duelos, tablet contra tablet', () => {
  const casos = [];
  for (let s = 1; s <= 20; s++) casos.push({ s, A: armarMazo(X.cartas, [], crearRng(s)), B: armarMazo(X.cartas, [], crearRng(s + 100)) });
  for (const d of X.duelos) for (let s = 1; s <= 10; s++) casos.push({ s, A: mazoDeBando(X.cartas, [], crearRng(s), d, d.bandos[0].id), B: mazoDeBando(X.cartas, [], crearRng(s), d, d.bandos[1].id) });
  const ganadores = { A: 0, B: 0 };
  for (const { s, A, B } of casos) {
    let e = crearPartida({ mazoA: A, mazoB: B, semilla: s });
    let n = 0, ventajas = 0;
    while (e.fase !== 'fin' && n < 2000) {
      const r = aplicarJugada(e, elegirJugada(e, e.turno, { nivel: 'erudito' }));
      ventajas += r.eventos.filter(x => x.tipo === 'ventaja').length;
      e = r.estado; n++;
    }
    assert.equal(e.fase, 'fin', `semilla ${s}: no terminó en ${n} jugadas`);
    ganadores[e.ganador]++;
  }
  assert.ok(ganadores.A > 0 && ganadores.B > 0, `siempre gana el mismo: ${JSON.stringify(ganadores)}`);
});
