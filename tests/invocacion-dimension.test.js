import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dimensionDeInvocacion, DIMENSION_INVOCACION } from '../js/ui/invocacion-dimension.js';

// Cada dimensión se invoca con su propia animación y su propio sonido (en vez del destello dorado).
test('Protagonistas y Lugares de Historia se invocan según su dimensión', () => {
  assert.equal(dimensionDeInvocacion({ tipo: 'protagonista', dimension: 'Economia' }), 'economia');
  assert.equal(dimensionDeInvocacion({ tipo: 'lugar', efecto: { tipo: 'bonusDimension', dimension: 'Territorio' } }), 'territorio');
  assert.equal(dimensionDeInvocacion({ tipo: 'personaje', dimension: 'Politica' }), 'politica');
  assert.equal(dimensionDeInvocacion({ tipo: 'acontecimiento' }), null);
  assert.equal(dimensionDeInvocacion({ tipo: 'protagonista', dimension: 'Mar', coleccion: 'fin-del-mundo' }), null, 'las expansiones conservan su estilo');
});

test('cada dimensión tiene su sonido de invocación en el banco', () => {
  const mapa = JSON.parse(readFileSync('data/sfx.json', 'utf8'));
  for (const d of Object.values(DIMENSION_INVOCACION)) {
    assert.ok(mapa[`invocar_${d}`], `falta invocar_${d}`);
    assert.ok(existsSync(mapa[`invocar_${d}`]));
  }
  assert.ok(mapa.moneda_lanzar && mapa.moneda_cae);
});

test('la escena de invocación usa el emblema de la dimensión y el sonido suena según la dimensión', () => {
  assert.match(readFileSync('js/ui/director.js', 'utf8'), /emblemaDimension\(dim\)/);
  assert.match(readFileSync("js/ui/mesa.js", "utf8"), /sonidos\.invocar\(plan\.carta\.tipo, dimensionDeInvocacion\(plan\.carta\), motivoDeCarta\(plan\.carta\)\)/);
  const css = readFileSync('css/estilos.css', 'utf8');
  for (const d of Object.values(DIMENSION_INVOCACION)) assert.match(css, new RegExp(`\\.emblema-${d}`));
});
