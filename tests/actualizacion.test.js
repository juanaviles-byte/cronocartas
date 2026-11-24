import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { versionDeSw, hayVersionNueva, URL_SW_PUBLICADO, URL_APK } from '../js/actualizacion.js';

// En el APK los archivos vienen dentro de la app: al abrirla se compara su versión con la publicada
// en GitHub Pages y, si hay una más nueva, se ofrece descargar el APK en Chrome.
test('lee la versión del service worker', () => {
  assert.equal(versionDeSw("// x\nconst VERSION = 'cc-v80';\nconst ARCHIVOS = [];"), 80);
  assert.equal(versionDeSw('sin versión'), null);
});

test('hay versión nueva solo si la publicada es mayor', () => {
  assert.equal(hayVersionNueva(80, 81), true);
  assert.equal(hayVersionNueva(80, 80), false);
  assert.equal(hayVersionNueva(81, 80), false);
  assert.equal(hayVersionNueva(null, 81), false, 'sin versión propia no se avisa');
  assert.equal(hayVersionNueva(80, null), false, 'sin internet no se avisa');
});

test('apunta a la página publicada y al último APK', () => {
  assert.equal(URL_SW_PUBLICADO, 'https://juanaviles-byte.github.io/cronocartas/sw.js');
  assert.equal(URL_APK, 'https://github.com/juanaviles-byte/cronocartas/releases/latest/download/cronocartas.apk');
  assert.equal(versionDeSw(readFileSync('sw.js', 'utf8')) > 0, true);
});

test('la app revisa actualizaciones solo dentro del APK', () => {
  const app = readFileSync('js/ui/app.js', 'utf8');
  assert.match(app, /if \(window\.Capacitor\) revisarActualizacionApk\(\)/);
});

test('el flujo del APK también corre cuando cambia sw.js (la versión que se compara)', () => {
  assert.match(readFileSync('.github/workflows/apk.yml', 'utf8'), /- 'sw\.js'/);
});
