import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Tablet en vertical, contra la tablet: la mano boca abajo del rival, su mazo y su descarte medían casi lo mismo
// que su activo y lo tapaban. En vertical van del tamaño de su reserva, con tope por el ancho de la pantalla.
const css = readFileSync('css/estilos.css', 'utf8');
const ini = css.indexOf('@media (orientation: portrait) {\n  .mesa.vista-jugador .lado-B .zona-activo');
const vertical = css.slice(ini, css.indexOf('\n}\n', ini));

test('en vertical, la mano del rival, su mazo y su descarte tienen tope por el ancho de la pantalla', () => {
  assert.ok(ini > 0, 'no se encontró el bloque vertical de la vista del jugador');
  for (const sel of ['\\.lado-B \\.mano-rival \\.carta-mini \\{ --ch: min\\(', '\\.lado-B \\.pila-mazo \\{ width: calc\\(min\\(', '\\.lado-B \\.pila-descarte \\.carta-mini \\{ --ch: min\\(', '\\.lado-B \\.pila-descarte \\.hueco \\{ height: min\\(']) {
    assert.match(vertical, new RegExp(sel + '[^}]*vw\\)'), sel);
  }
  assert.match(vertical, /\.lado-B \.mano-rival \.carta-mini \+ \.carta-mini \{ margin-left: calc\(min\(/, 'las cartas se superponen en proporción al nuevo tamaño');
});
