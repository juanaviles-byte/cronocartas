import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { noLeidas, marcarLeidas, esLeida, marcarLeida } from '../js/novedades.js';

// Novedades: un globo con una carta en el inicio abre las actualizaciones y noticias (data/novedades.json).
const N = JSON.parse(readFileSync('data/novedades.json', 'utf8'));

test('cada novedad tiene id único, fecha, tipo, título y contenido', () => {
  assert.ok(N.novedades.length >= 1);
  assert.equal(new Set(N.novedades.map(n => n.id)).size, N.novedades.length);
  for (const n of N.novedades) {
    assert.match(n.fecha, /^\d{4}-\d{2}-\d{2}$/, n.id);
    assert.ok(['actualizacion', 'noticia'].includes(n.tipo), n.id);
    assert.ok(n.titulo && n.resumen, n.id);
    for (const s of n.secciones || []) { assert.ok(s.titulo); assert.ok(s.puntos.length > 0 && s.puntos.every(p => typeof p === 'string' && p.length <= 220)); }
  }
});

test('la primera novedad es la bitácora con los principales cambios', () => {
  const b = N.novedades.find(n => n.id === 'bitacora-2026-11');
  assert.ok(b && b.tipo === 'actualizacion' && b.secciones.length >= 4);
});

test('no leídas: las que no están en la lista guardada; marcar las deja en cero', () => {
  const guardado = new Map();
  const almacen = { leer: (k, d) => (guardado.has(k) ? guardado.get(k) : d), guardar: (k, v) => guardado.set(k, v) };
  assert.equal(noLeidas(N.novedades, almacen), N.novedades.length);
  marcarLeidas(N.novedades, almacen);
  assert.equal(noLeidas(N.novedades, almacen), 0);
  assert.equal(noLeidas([...N.novedades, { id: 'otra' }], almacen), 1, 'una novedad nueva vuelve a encender el globo');
});

test('cada novedad se marca leída por separado, al abrirla desde la lista', () => {
  const guardado = new Map();
  const almacen = { leer: (k, d) => (guardado.has(k) ? guardado.get(k) : d), guardar: (k, v) => guardado.set(k, v) };
  const [a, b] = N.novedades;
  assert.equal(esLeida(a, almacen), false);
  marcarLeida(a, almacen);
  assert.equal(esLeida(a, almacen), true);
  assert.equal(esLeida(b, almacen), false);
  assert.equal(noLeidas(N.novedades, almacen), N.novedades.length - 1);
  marcarLeida(a, almacen);
  assert.equal(noLeidas(N.novedades, almacen), N.novedades.length - 1, 'marcar dos veces no cuenta doble');
});

test('la bitácora del 25 de noviembre va primera y no anuncia como jugable la expansión oculta', () => {
  const [b] = N.novedades;
  assert.equal(b.id, 'bitacora-2026-11-25');
  assert.ok(b.secciones.length >= 3);
  const texto = JSON.stringify(b);
  assert.match(texto, /mapa/i);
  assert.doesNotMatch(texto, /Zeus|Thor|tipograf/i);
});

test('el panel muestra la lista de novedades y abre cada una al tocarla', () => {
  const ui = readFileSync('js/ui/novedades.js', 'utf8');
  assert.match(ui, /lista-novedades/);
  assert.match(ui, /marcarLeida\(/);
  assert.match(ui, /Volver/);
});

test('el inicio trae el globo de novedades y funciona sin internet', () => {
  const app = readFileSync('js/ui/app.js', 'utf8');
  assert.match(app, /globoNovedades\(/);
  assert.match(readFileSync('sw.js', 'utf8'), /"data\/novedades\.json"/);
  assert.match(readFileSync('js/ui/novedades.js', 'utf8'), /aria-label/);
});

// Inicio con temas: cada vez que se abre el juego, un tema al azar (fondo y cartas de la misma época).
import { TEMAS_INICIO, elegirTema, cartasDelTema } from '../js/temas-inicio.js';
import { existsSync } from 'node:fs';

test('los temas del inicio tienen fondos que existen y al menos 3 cartas con ilustración', () => {
  const arte = JSON.parse(readFileSync('data/arte.json', 'utf8'));
  const mazos = {};
  for (const m of ['mazo-5', 'mazo-6', 'mazo-7', 'mazo-8', 'exp-fin-del-mundo']) mazos[m] = JSON.parse(readFileSync(`data/${m}.json`, 'utf8')).cartas;
  assert.ok(TEMAS_INICIO.length >= 6);
  for (const t of TEMAS_INICIO) {
    for (const f of t.fondos) assert.ok(existsSync(f), `${t.id}: falta ${f}`);
    assert.ok(cartasDelTema(t, mazos, arte).length >= 3, `${t.id}: pocas cartas`);
  }
});

test('elegirTema reparte entre todos los temas', () => {
  const vistos = new Set();
  for (let i = 0; i < 60; i++) vistos.add(elegirTema(() => (i + 0.5) / 60).tema.id);
  assert.equal(vistos.size, TEMAS_INICIO.length);
});

test('el inicio usa el tema elegido una vez por apertura', () => {
  const app = readFileSync('js/ui/app.js', 'utf8');
  assert.match(app, /const TEMA = elegirTema\(\)/);
  assert.match(app, /cartasDelTema\(TEMA\.tema/);
});
