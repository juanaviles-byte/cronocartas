import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// La carta activa "respira" (cartas vivas), pero esa animación no puede tapar las señales que guían la jugada:
// el brillo de la pista de La Cronista (.sugerida) y el aviso de dar Saber (.pide-saber).
const css = readFileSync('css/estilos.css', 'utf8');

test('la respiración del activo no pisa la pista ni el aviso de Saber', () => {
  const regla = css.split('\n').find(l => l.includes('animation: respira'));
  assert.ok(regla, 'falta la regla de respiración');
  assert.match(regla, /:not\(\.sugerida\)/, 'la respiración pisa el brillo de la pista');
  assert.match(regla, /:not\(\.pide-saber\)/, 'la respiración pisa el aviso de dar Saber');
});

test('el brillo de la pista en la mano no queda recortado por el contenedor', () => {
  assert.match(css, /\.mano \.carta-mini\.sugerida \{[^}]*translateY/, 'la carta sugerida de la mano debe asomar sobre la fila');
});
