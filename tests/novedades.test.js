import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { noLeidas, marcarLeidas } from '../js/novedades.js';

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

test('el inicio trae el globo de novedades y funciona sin internet', () => {
  const app = readFileSync('js/ui/app.js', 'utf8');
  assert.match(app, /globoNovedades\(/);
  assert.match(readFileSync('sw.js', 'utf8'), /"data\/novedades\.json"/);
  assert.match(readFileSync('js/ui/novedades.js', 'utf8'), /aria-label/);
});
