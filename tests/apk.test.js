import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

// El APK de Android se arma en GitHub Actions con Capacitor: la app web va completa dentro del archivo.
const config = JSON.parse(readFileSync('capacitor.config.json', 'utf8'));
const flujo = existsSync('.github/workflows/apk.yml') ? readFileSync('.github/workflows/apk.yml', 'utf8') : '';

test('capacitor.config.json identifica la app y usa la carpeta www', () => {
  assert.equal(config.appId, 'cl.gabrielamistral.cronocartas');
  assert.equal(config.appName, 'Cronocartas');
  assert.equal(config.webDir, 'www');
  assert.equal(config.plugins.SystemBars.hidden, true, 'el juego ocupa toda la pantalla');
});

test('el APK lleva todos los archivos de la app', () => {
  for (const x of ['index.html', 'manifest.webmanifest', 'css', 'js', 'data', 'icons', 'img', 'audio']) {
    assert.match(flujo, new RegExp(`cp -r [^\\n]*\\b${x.replace('.', '\\.')}\\b[^\\n]* www/`), `falta copiar ${x} a www/`);
  }
});

test('el flujo usa Node 22, JDK 21 y Capacitor 8, y publica el APK con nombre fijo', () => {
  assert.match(flujo, /node-version: ['"]?22/);
  assert.match(flujo, /java-version: ['"]?21/);
  assert.match(flujo, /@capacitor\/android@8/);
  assert.match(flujo, /cronocartas\.apk/);
  assert.match(flujo, /gh release create/);
});

test('cada APK se firma con la misma llave, para poder actualizar sin desinstalar', () => {
  assert.ok(existsSync('apk/debug.keystore'));
  assert.match(flujo, /apk\/debug\.keystore ~\/\.android\/debug\.keystore/);
});

test('los íconos y la pantalla de carga de Android están listos para cada densidad', () => {
  for (const d of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
    for (const n of ['ic_launcher', 'ic_launcher_round', 'ic_launcher_foreground']) assert.ok(existsSync(`apk/res/mipmap-${d}/${n}.png`), `falta ${d}/${n}`);
    for (const o of ['port', 'land']) assert.ok(existsSync(`apk/res/drawable-${o}-${d}/splash.png`), `falta splash ${o}-${d}`);
  }
  assert.ok(existsSync('apk/res/drawable/splash.png'));
  assert.match(readFileSync('apk/res/mipmap-anydpi-v26/ic_launcher.xml', 'utf8'), /@color\/cronocartas_fondo_icono/);
  assert.match(flujo, /cp -r apk\/res\/\. android\/app\/src\/main\/res\//);
});

test('dentro del APK no se registra el service worker: los archivos ya vienen en la app', () => {
  assert.match(readFileSync('js/ui/app.js', 'utf8'), /'serviceWorker' in navigator && window\.isSecureContext && !window\.Capacitor/);
});
