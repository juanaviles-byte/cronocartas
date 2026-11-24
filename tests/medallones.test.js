import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { iconoTipo, TEMAS } from '../js/ui/arte.js';

test('cada tipo, dimensión y fuerza tiene su medallón dibujado', () => {
  for (const clave of Object.keys(TEMAS)) {
    const html = iconoTipo(clave, 40);
    assert.match(html, new RegExp(`src="img/iconos/${clave}\\.webp"`), clave);
    assert.ok(existsSync(new URL(`../img/iconos/${clave}.webp`, import.meta.url)), `falta img/iconos/${clave}.webp`);
  }
});

test('el medallón respeta el tamaño pedido y es decorativo', () => {
  const html = iconoTipo('Politica', 14);
  assert.match(html, /width="14" height="14"/);
  assert.match(html, /alt=""/);
});
