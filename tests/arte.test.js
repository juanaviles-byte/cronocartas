import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const arte = JSON.parse(readFileSync('data/arte.json', 'utf8'));
const ids = new Set([5, 6, 7, 8].flatMap(c => JSON.parse(readFileSync(`data/mazo-${c}.json`, 'utf8')).cartas.map(x => x.id))
  .concat(JSON.parse(readFileSync('data/aula.json', 'utf8')).cartas.map(x => x.id))
  .concat(JSON.parse(readFileSync('data/exp-fin-del-mundo.json', 'utf8')).cartas.map(x => x.id)));

test('cada ilustración de data/arte.json es de una carta que existe y su archivo está', () => {
  for (const [id, ruta] of Object.entries(arte)) {
    assert.ok(ids.has(id), `${id} no es una carta`);
    assert.match(ruta, /^img\/cartas\/[\w-]+\.webp$/);
    assert.ok(existsSync(ruta), `falta ${ruta}`);
  }
});

test('la app registra las ilustraciones del juego al cargar un curso', () => {
  const datos = readFileSync('js/ui/datos.js', 'utf8');
  assert.match(datos, /data\/arte\.json/);
});

test('el service worker guarda las ilustraciones para jugar sin internet', () => {
  const sw = readFileSync('sw.js', 'utf8');
  for (const ruta of Object.values(arte)) assert.ok(sw.includes(ruta), `sw.js no incluye ${ruta}`);
});

test('si la lista de ilustraciones falla, se vuelve a pedir en la próxima carga', () => {
  const datos = readFileSync('js/ui/datos.js', 'utf8');
  assert.doesNotMatch(datos, /arteDelJuego \|\|= fetch/, 'no debe guardar para siempre un intento fallido');
  assert.match(datos, /arteDelJuego = null/);
});

test('el service worker solo devuelve la página de inicio cuando se pide una página, nunca en lugar de un dato o una imagen', () => {
  const sw = readFileSync('sw.js', 'utf8');
  assert.match(sw, /mode === 'navigate'/);
});
