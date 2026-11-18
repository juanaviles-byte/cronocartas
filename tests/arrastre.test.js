import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Con ilustraciones <img>, el mouse inicia el arrastre nativo de imagen y cancela el arrastre del juego.
test('el arrastre de cartas bloquea el arrastre nativo de imágenes', () => {
  const js = readFileSync('js/ui/arrastre.js', 'utf8');
  assert.match(js, /addEventListener\('dragstart',\s*ev\s*=>\s*ev\.preventDefault\(\)\)/);
  const css = readFileSync('css/estilos.css', 'utf8');
  assert.match(css, /\.carta img\s*\{[^}]*-webkit-user-drag:\s*none/);
});
