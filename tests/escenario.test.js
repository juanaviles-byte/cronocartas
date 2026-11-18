import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { imagenCarta, registrarImagenes } from '../js/ui/carta.js';

test('imagenCarta da la ilustración registrada de una carta, o null si no tiene', () => {
  registrarImagenes({ 'CC-7-U4-010': 'img/cartas/CC-7-U4-010.webp' });
  assert.equal(imagenCarta({ id: 'CC-7-U4-010' }), 'img/cartas/CC-7-U4-010.webp');
  assert.equal(imagenCarta({ id: 'no-existe' }), null);
  assert.equal(imagenCarta({ id: 'x', imagen: 'data:image/jpeg;base64,AAA' }), 'data:image/jpeg;base64,AAA');
});

test('la mesa usa la ilustración del Lugar como escenario y anuncia el cambio', () => {
  const mesa = readFileSync('js/ui/mesa.js', 'utf8');
  assert.match(mesa, /escena-lugar/);
  assert.match(mesa, /cartel-escenario/);
  const css = readFileSync('css/estilos.css', 'utf8');
  assert.match(css, /\.escena-lugar/);
  assert.match(css, /prefers-reduced-motion[\s\S]*escena-lugar/);
});
