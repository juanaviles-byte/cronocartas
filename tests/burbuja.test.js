import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { colocarBurbuja } from '../js/ui/burbuja.js';

// La Cronista habla en burbujas que apuntan a lo que explican y nunca tapan el juego.
const pantalla = { w: 844, h: 390 }, tamano = { w: 260, h: 70 };
const cruza = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const caja = r => ({ x: r.x, y: r.y, w: tamano.w, h: tamano.h });
const dentro = r => r.x >= 8 && r.x + tamano.w <= pantalla.w - 8 && r.y >= 8 && r.y + tamano.h <= pantalla.h - 8;

test('elige el lado con más espacio', () => {
  const r = colocarBurbuja({ objetivo: { x: 400, y: 20, w: 80, h: 60 }, tamano, pantalla, prohibidas: [] });
  assert.equal(r.lado, 'abajo');
  assert.ok(dentro(r));
});

test('nunca pisa una zona prohibida', () => {
  const prohibida = { x: 0, y: 80, w: 844, h: 120 };
  const r = colocarBurbuja({ objetivo: { x: 400, y: 20, w: 80, h: 60 }, tamano, pantalla, prohibidas: [prohibida] });
  assert.ok(!cruza(caja(r), prohibida));
  assert.ok(['izq', 'der'].includes(r.lado), r.lado);
});

test('objetivo arriba con el eje central prohibido', () => {
  const prohibidas = [{ x: 300, y: 80, w: 244, h: 60 }, { x: 370, y: 150, w: 100, h: 130 }];
  const r = colocarBurbuja({ objetivo: { x: 380, y: 10, w: 70, h: 60 }, tamano, pantalla, prohibidas });
  for (const p of prohibidas) assert.ok(!cruza(caja(r), p));
  assert.ok(dentro(r));
});

test('queda dentro de la pantalla aunque el objetivo esté en una esquina', () => {
  const r = colocarBurbuja({ objetivo: { x: 800, y: 330, w: 40, h: 50 }, tamano, pantalla, prohibidas: [] });
  assert.ok(dentro(r));
  assert.ok(!cruza(caja(r), { x: 800, y: 330, w: 40, h: 50 }), 'no tapa su propio objetivo');
});

test('si no cabe en ningún lado, va sobre el respaldo (la mano)', () => {
  const objetivo = { x: 400, y: 150, w: 60, h: 60 };
  const prohibidas = [{ x: 0, y: 0, w: 844, h: 145 }, { x: 0, y: 145, w: 395, h: 70 }, { x: 465, y: 145, w: 379, h: 70 }, { x: 0, y: 215, w: 844, h: 80 }];
  const respaldo = { x: 200, y: 300, w: 400, h: 90 };
  const r = colocarBurbuja({ objetivo, tamano, pantalla, prohibidas, respaldo });
  assert.equal(r.lado, 'respaldo');
  assert.ok(r.y + tamano.h <= respaldo.y);
  assert.equal(r.x, respaldo.x + (respaldo.w - tamano.w) / 2);
});

test('sin objetivo, va sobre el respaldo', () => {
  const r = colocarBurbuja({ objetivo: null, tamano, pantalla, prohibidas: [], respaldo: { x: 200, y: 300, w: 400, h: 90 } });
  assert.equal(r.lado, 'respaldo');
});

test('la colita apunta al objetivo', () => {
  const r = colocarBurbuja({ objetivo: { x: 400, y: 20, w: 80, h: 60 }, tamano, pantalla, prohibidas: [] });
  assert.equal(r.colita.y, r.y);
  assert.ok(r.colita.x >= r.x + 16 && r.colita.x <= r.x + 244);
  assert.equal(r.colita.x, Math.min(Math.max(440, r.x + 16), r.x + 244));
});
