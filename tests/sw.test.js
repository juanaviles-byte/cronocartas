import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const raiz = new URL('..', import.meta.url).pathname;
function archivos(dir) {
  return readdirSync(join(raiz, dir)).flatMap(n => {
    const p = join(dir, n);
    return statSync(join(raiz, p)).isDirectory() ? archivos(p) : [p];
  });
}

test('sw.js guarda en caché todos los archivos de la app', () => {
  const sw = readFileSync(join(raiz, 'sw.js'), 'utf8');
  const lista = JSON.parse(sw.match(/const ARCHIVOS = (\[[\s\S]*?\]);/)[1]);
  const esperados = ['./', 'index.html', 'manifest.webmanifest', ...['js', 'css', 'data', 'icons'].flatMap(archivos)];
  for (const f of esperados) assert.ok(lista.includes(f), `falta ${f} en sw.js`);
  for (const f of lista) if (f !== './') assert.ok(statSync(join(raiz, f)).isFile(), `sobra ${f} en sw.js`);
});

test('el manifiesto permite instalar la app', () => {
  const m = JSON.parse(readFileSync(join(raiz, 'manifest.webmanifest'), 'utf8'));
  assert.equal(m.display, 'standalone');
  assert.ok(m.icons.some(i => i.sizes === '192x192') && m.icons.some(i => i.sizes === '512x512'));
  assert.equal(m.lang, 'es-CL');
});
