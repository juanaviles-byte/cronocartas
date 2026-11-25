// Datos de «El Ocaso de los Dioses».
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { validarMazo, mazoDeBando } from '../js/mazos.js';
import { DANIO_POR_SABER } from '../js/balance.js';
import { EMBLEMAS, TEMAS } from '../js/ui/arte.js';
import { coleccion, COLECCIONES_VISIBLES } from '../js/colecciones.js';
import { VENTAJA, crearPartida } from '../js/motor.js';
import { crearRng } from '../js/rng.js';

const X = JSON.parse(readFileSync('data/exp-ocaso-de-los-dioses.json', 'utf8'));
const FUERZAS = ['Olimpo', 'Asgard', 'Nilo', 'QuintoSol', 'Yokai', 'Jade'];
const prot = X.cartas.filter(c => c.tipo === 'protagonista');

test('49 cartas OC-001..OC-049 válidas', () => {
  assert.equal(X.coleccion, 'ocaso-de-los-dioses');
  assert.deepEqual(X.cartas.map(c => c.id), Array.from({ length: 49 }, (_, i) => `OC-${String(i + 1).padStart(3, '0')}`));
  assert.deepEqual(validarMazo(X.cartas), []);
  const n = t => X.cartas.filter(c => c.tipo === t).length;
  assert.deepEqual([n('protagonista'), n('personaje'), n('acontecimiento'), n('lugar')], [30, 4, 9, 6]);
});

test('cada panteón: 5 Protagonistas (3 de luz y 2 de sombra), 410 de resistencia y su Lugar', () => {
  for (const f of FUERZAS) {
    const ps = prot.filter(c => c.dimension === f);
    assert.equal(ps.length, 5, f);
    assert.equal(ps.filter(c => c.aspecto === 'luz').length, 3, f);
    assert.equal(ps.filter(c => c.aspecto === 'sombra').length, 2, f);
    assert.equal(ps.reduce((s, c) => s + c.resistencia, 0), 410, f);
    assert.equal(X.cartas.filter(c => c.tipo === 'lugar' && c.efecto.dimension === f).length, 1, f);
    assert.ok(TEMAS[f], `${f}: sin tema de color`);
  }
  for (const c of prot) for (const a of c.acciones) {
    assert.ok(a.nombre.length <= 22, `${c.id}: nombre de acción largo`);
    assert.ok(a.danio <= a.costo * DANIO_POR_SABER, `${c.id}: ${a.nombre}`);
  }
});

test('las tradiciones vivas no atacan ni tienen fuerza ni aspecto', () => {
  for (const c of X.cartas.filter(c => c.tipo !== 'protagonista')) {
    for (const k of ['acciones', 'dimension', 'aspecto', 'resistencia']) assert.equal(c[k], undefined, `${c.id}.${k}`);
  }
});

test('textos: frase, de dónde viene y emblema en todas', () => {
  for (const c of X.cartas) {
    assert.ok(c.dato.length >= 40 && c.dato.length <= 220, `${c.id}: dato de ${c.dato.length}`);
    assert.ok(c.frase && c.frase.length <= 70, `${c.id}: frase`);
    assert.ok(c.zona && c.zona.length <= 40, `${c.id}: zona`);
    assert.ok(EMBLEMAS.includes(c.emblema), `${c.id}: emblema ${c.emblema}`);
  }
});

test('la ronda de ventajas cierra y los rivales de cada Duelo quedan opuestos (sin doble daño entre ellos)', () => {
  const col = coleccion('ocaso-de-los-dioses');
  assert.ok(col && col.ciclo);
  assert.deepEqual(Object.values(col.ventaja).sort(), [...FUERZAS].sort());
  let f = 'Olimpo', vistos = new Set();
  for (let i = 0; i < 6; i++) { vistos.add(f); f = col.ventaja[f]; }
  assert.equal(f, 'Olimpo'); assert.equal(vistos.size, 6);
  for (const d of X.duelos) {
    const fz = d.bandos.map(b => prot.find(c => b.nucleo.includes(c.nombre)).dimension);
    assert.notEqual(VENTAJA[fz[0]], fz[1], d.id); assert.notEqual(VENTAJA[fz[1]], fz[0], d.id);
  }
});

test('los núcleos de los Duelos nombran cartas reales y arman mazos de 20 con ciclo', () => {
  const nombres = new Set(X.cartas.map(c => c.nombre));
  for (const d of X.duelos) {
    assert.equal(d.bandos.length, 2);
    for (const b of d.bandos) {
      assert.equal(b.nucleo.length, 10, b.id);
      for (const n of b.nucleo) assert.ok(nombres.has(n), `${b.id}: ${n}`);
    }
    const r = crearRng(1);
    const m = d.bandos.map(b => mazoDeBando(X.cartas, [], r, d, b.id));
    for (const x of m) assert.equal(x.length, 20);
    assert.equal(crearPartida({ mazoA: m[0], mazoB: m[1], semilla: 1 }).ciclo, 'dia');
  }
});

test('mientras falte su arte en el juego, la expansión no aparece en los menús', () => {
  assert.ok(!COLECCIONES_VISIBLES.some(c => c.id === 'ocaso-de-los-dioses'));
  assert.ok(COLECCIONES_VISIBLES.some(c => c.id === 'fin-del-mundo'));
});

test('cada carta del Ocaso entra con el motivo de su panteón (o de las tradiciones), con animación y sonido', async () => {
  const { motivoDeCarta, MOTIVOS_OCASO } = await import('../js/motivos.js');
  const { DEF_MOTIVOS } = await import('../js/ui/invocacion-motivo.js');
  const sfx = JSON.parse(readFileSync('data/sfx.json', 'utf8'));
  for (const c of X.cartas) {
    const m = motivoDeCarta(c);
    if (c.tipo === 'personaje') { assert.equal(m, null, c.id); continue; }
    assert.ok(MOTIVOS_OCASO.includes(m), `${c.id}: ${m}`);
  }
  assert.equal(motivoDeCarta(X.cartas.find(c => c.id === 'OC-001')), 'olimpo');
  assert.equal(motivoDeCarta(X.cartas.find(c => c.id === 'OC-042')), 'tradicion');
  assert.equal(motivoDeCarta(X.cartas.find(c => c.id === 'OC-049')), 'jade');
  for (const m of MOTIVOS_OCASO) {
    assert.ok(DEF_MOTIVOS[m], `falta la animación de ${m}`);
    assert.ok(sfx[`motivo_${m}`] && existsSync(sfx[`motivo_${m}`].ruta), `falta el sonido de ${m}`);
  }
  for (const k of ['ciclo_dia', 'ciclo_noche']) assert.ok(sfx[k] && existsSync(sfx[k].ruta), k);
  assert.equal(motivoDeCarta({ tipo: 'protagonista', id: 'FM-001', coleccion: 'fin-del-mundo', dimension: 'Mar' }), null);
});

test('la mesa avisa y hace sonar el cambio de ciclo', () => {
  const mesa = readFileSync('js/ui/mesa.js', 'utf8');
  assert.match(mesa, /ev\.tipo === 'ciclo'/);
  assert.match(readFileSync('js/ui/sonido.js', 'utf8'), /ciclo_noche/);
});

test('cada efecto del Ocaso se explica en la carta', async () => {
  const { textoEfecto, textoEfectoAccion } = await import('../js/ui/carta.js');
  for (const c of X.cartas) {
    if (c.efecto) assert.ok(textoEfecto(c.efecto).length > 10, c.id);
    for (const a of c.acciones || []) if (a.efecto) assert.ok(textoEfectoAccion(a.efecto).length > 5, c.id);
  }
  assert.match(textoEfecto(X.cartas.find(c => c.id === 'OC-036').efecto), /^Cae la noche/);
  assert.match(textoEfecto(X.cartas.find(c => c.id === 'OC-042').efecto), /^Llega el día/);
});

test('cada carta tiene su arquetipo, y cada arquetipo su tipografía incluida en el juego', () => {
  const ARQ = ['olimpo', 'asgard', 'nilo', 'quinto-sol', 'yokai', 'jade', 'cristiana', 'india'];
  const css = readFileSync('css/estilos.css', 'utf8');
  for (const c of X.cartas) assert.ok(ARQ.includes(c.arquetipo), `${c.id}: arquetipo «${c.arquetipo}»`);
  for (const c of prot) assert.equal(c.arquetipo, { QuintoSol: 'quinto-sol' }[c.dimension] || c.dimension.toLowerCase(), c.id);
  for (const a of ARQ) {
    assert.ok(existsSync(`css/fuentes/oc-${a}.woff`), `falta css/fuentes/oc-${a}.woff`);
    assert.ok(css.includes(`url("fuentes/oc-${a}.woff")`), `falta el @font-face de ${a}`);
    assert.ok(css.includes(`.arq-${a} { --letra-arq:`), `falta la letra de ${a}`);
  }
});

test('solo las cartas de la expansión cambian de tipografía', () => {
  for (const n of [5, 6, 7, 8]) for (const c of JSON.parse(readFileSync(`data/mazo-${n}.json`, 'utf8')).cartas) assert.equal(c.arquetipo, undefined, c.id);
  for (const c of JSON.parse(readFileSync('data/exp-fin-del-mundo.json', 'utf8')).cartas) assert.equal(c.arquetipo, undefined, c.id);
});
