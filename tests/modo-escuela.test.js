import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { modoEscuelaActivo } from '../js/rendimiento.js';

// «Modo escuela»: perfil liviano para las tablets del colegio (Galaxy Tab A 8.0 2019: Snapdragon 429, 2 GB).
const TAB_A = 'Mozilla/5.0 (Linux; Android 11; SM-T290) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0 Safari/537.36';
const PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

test('se activa solo en la Galaxy Tab A 8.0 (SM-T290 y SM-T295)', () => {
  assert.equal(modoEscuelaActivo({}, TAB_A, 8), true);
  assert.equal(modoEscuelaActivo({}, TAB_A.replace('SM-T290', 'SM-T295'), undefined), true);
  assert.equal(modoEscuelaActivo({}, PC, 8), false);
});

test('se activa solo en equipos con 2 GB de memoria o menos', () => {
  assert.equal(modoEscuelaActivo({}, PC, 2), true);
  assert.equal(modoEscuelaActivo({}, PC, 4), false);
  assert.equal(modoEscuelaActivo({}, PC, undefined), false);
});

test('lo que elige el docente manda sobre lo automático', () => {
  assert.equal(modoEscuelaActivo({ modoEscuela: false }, TAB_A, 2), false);
  assert.equal(modoEscuelaActivo({ modoEscuela: true }, PC, 8), true);
});

const css = readFileSync('css/estilos.css', 'utf8');
const bloque = css.slice(css.indexOf('/* Modo escuela */'));

test('el CSS del modo escuela apaga lo que más le cuesta a una GPU modesta', () => {
  assert.ok(css.includes('/* Modo escuela */'), 'falta el bloque del modo escuela');
  assert.match(bloque, /\.modo-escuela [^{]*respira|\.modo-escuela [^{]*\.carta-mini[^{]*\{[^}]*animation: none/, 'la respiración (filtro animado) debe apagarse');
  assert.match(bloque, /\.modo-escuela [^{]*escena-lugar::before[^{]*\{[^}]*filter: none/, 'el desenfoque del escenario debe apagarse');
  assert.match(bloque, /\.modo-escuela [^{]*\{[^}]*backdrop-filter: none/, 'los backdrop-filter deben apagarse');
  assert.match(bloque, /\.modo-escuela [^{]*inicio-fondo[^{]*\{[^}]*animation: none/, 'el paneo del fondo del inicio debe apagarse');
});

test('el modo escuela quita la arena y la disolución en canvas, y guarda menos audio', () => {
  assert.match(readFileSync('js/ui/efectos.js', 'utf8'), /if \(liviano\(\)\) return/);
  assert.match(readFileSync('js/ui/mesa.js', 'utf8'), /sinMovimiento\(\) \|\| liviano\(\)/);
  const voz = readFileSync('js/ui/voz.js', 'utf8');
  assert.match(voz, /liviano\(\) \? 1 : 3/, 'en modo escuela se guarda un solo bloque de narración');
  assert.match(voz, /sampleRate: 22050/, 'en modo escuela la narración se decodifica a 22 kHz');
});

test('la app aplica el modo al arrancar y el panel docente lo deja elegir', () => {
  assert.match(readFileSync('js/ui/app.js', 'utf8'), /classList\.toggle\('modo-escuela', modoEscuelaActivo\(/);
  const docente = readFileSync('js/ui/docente.js', 'utf8');
  assert.match(docente, /Modo escuela/);
  assert.match(docente, /guardar\(\{ modoEscuela:/);
});
