import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../css/estilos.css', import.meta.url), 'utf8');
// El último bloque para teléfonos en horizontal es el que manda.
const bloques = css.split('@media (max-height: 520px) and (orientation: landscape) {');
const ultimo = bloques[bloques.length - 1].split('\n}\n')[0];

test('teléfono horizontal: «Pasar turno» va a la derecha de la franja central', () => {
  assert.match(ultimo, /\.boton-pasar-centro \{ display: block; grid-column: 3;[^}]*justify-self: end;[^}]*min-height: 44px/);
  assert.match(ultimo, /\.lado-A \.controles \.boton-pasar \{ display: none; \}/);
});

test('teléfono horizontal: Sonido, La Cronista y Menú van a la izquierda', () => {
  for (const b of ['boton-sonido', 'boton-guia', 'boton-menu']) {
    assert.match(ultimo, new RegExp(`\\.centro > \\.${b} \\{ grid-column: 1;[^}]*justify-self: start;`), b);
  }
});
