import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

// El tema del inicio suena en los menús y le deja el lugar al ambiente del escenario durante la partida.
const app = readFileSync('js/ui/app.js', 'utf8');

test('existe el tema del inicio y la app lo pone fuera de la mesa', () => {
  const m = app.match(/const TEMA_INICIO = '([^']+)'/);
  assert.ok(m, 'falta TEMA_INICIO en app.js');
  assert.ok(existsSync(m[1]), `falta ${m[1]}`);
  assert.match(app, /VISTAS_DE_JUEGO = new Set\(\['mesa', 'tutorial'\]\)/);
  assert.match(app, /if \(!VISTAS_DE_JUEGO\.has\(nombre\)\) ambiente\.poner\(TEMA_INICIO\)/);
});

test('si el navegador bloqueó el sonido, arranca con el primer toque', () => {
  assert.match(app, /pointerdown', \(\) => \{ precargarSonidos\(\); ambiente\.pausar\(false\); \}/);
});
