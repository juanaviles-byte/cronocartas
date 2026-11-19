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
  const esperados = ['./', 'index.html', 'manifest.webmanifest', ...['js', 'css', 'data', 'icons', 'img'].flatMap(archivos)];
  for (const f of esperados) assert.ok(lista.includes(f), `falta ${f} en sw.js`);
  for (const f of lista) if (f !== './') assert.ok(statSync(join(raiz, f)).isFile(), `sobra ${f} en sw.js`);
});

test('el manifiesto permite instalar la app', () => {
  const m = JSON.parse(readFileSync(join(raiz, 'manifest.webmanifest'), 'utf8'));
  assert.equal(m.display, 'standalone');
  assert.ok(m.icons.some(i => i.sizes === '192x192') && m.icons.some(i => i.sizes === '512x512'));
  assert.equal(m.lang, 'es-CL');
});

test('la app busca versión nueva al volver a ella y avisa mientras la descarga', () => {
  const app = readFileSync('js/ui/app.js', 'utf8');
  assert.match(app, /visibilitychange[\s\S]*\.update\(\)/, 'debe llamar a registration.update() al volver a la app');
  assert.match(app, /updatefound/, 'debe escuchar updatefound para avisar la descarga');
  assert.match(app, /aviso-actualizacion/, 'debe mostrar un aviso de actualización');
});

// Actualizaciones livianas: cada archivo lleva una huella de su contenido y, al instalar
// una versión nueva, los archivos con la misma huella se copian de la versión anterior.
test('cada archivo de la app tiene su huella y coincide con su contenido', async () => {
  const { createHash } = await import('node:crypto');
  const sw = readFileSync(join(raiz, 'sw.js'), 'utf8');
  const lista = JSON.parse(sw.match(/const ARCHIVOS = (\[[\s\S]*?\]);/)[1]);
  const huellas = JSON.parse(sw.match(/const HUELLAS = (\{[\s\S]*?\});/)[1]);
  for (const f of lista) {
    const real = f === './' ? 'index.html' : f;
    const esperada = createHash('sha256').update(readFileSync(join(raiz, real))).digest('hex').slice(0, 12);
    assert.equal(huellas[f], esperada, `huella vieja o faltante para ${f}`);
  }
});

test('al instalar, solo se descargan los archivos cuya huella cambió', () => {
  const sw = readFileSync(join(raiz, 'sw.js'), 'utf8');
  const instalar = sw.slice(sw.indexOf("addEventListener('install'"), sw.indexOf("addEventListener('activate'"));
  assert.match(instalar, /huellasPrevias\[u\] === HUELLAS\[u\]/, 'debe comparar la huella anterior con la nueva');
  assert.match(instalar, /addAll\(pendientes/, 'debe descargar solo los pendientes');
  assert.match(instalar, /put\(HUELLAS_URL/, 'debe guardar las huellas de la versión instalada');
});
