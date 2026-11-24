import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

// Los audios cortos van juntos en pocos paquetes y cada uno es un tramo { ruta, desde, hasta }:
// menos archivos que descargar y guardar sin internet (y la vista previa no pasa su tope de 512).
const sfx = JSON.parse(readFileSync('data/sfx.json', 'utf8'));
const voces = JSON.parse(readFileSync('data/voces.json', 'utf8'));
const tramoValido = (nombre, t, ruta) => {
  assert.equal(typeof t, 'object', `${nombre}: debe ser un tramo`);
  assert.match(t.ruta, ruta, `${nombre}: ${t.ruta}`);
  assert.ok(existsSync(t.ruta), `falta ${t.ruta}`);
  assert.ok(t.desde >= 0 && t.hasta > t.desde, `${nombre}: ${t.desde}–${t.hasta}`);
};

test('los efectos de sonido son tramos de dos paquetes', () => {
  for (const [n, t] of Object.entries(sfx)) tramoValido(n, t, /^audio\/sfx\/(efectos|motivos)\.ogg$/);
  assert.deepEqual(readdirSync('audio/sfx').sort(), ['efectos.ogg', 'motivos.ogg']);
});

test('La Cronista y los Personajes hablan desde un paquete cada uno', () => {
  for (const [n, t] of Object.entries(voces.cronista)) tramoValido(n, t, /^audio\/cronista\/cronista\.ogg$/);
  for (const [n, t] of Object.entries(voces.personajes)) tramoValido(n, t, /^audio\/personajes\/personajes\.ogg$/);
});

test('el motor de sonido toca un efecto desde su tramo del paquete', () => {
  const s = readFileSync('js/ui/sonido.js', 'utf8');
  assert.match(s, /typeof ruta === 'object'/, 'precargarSonidos acepta tramos');
  assert.match(s, /src\.start\([^)]*, *t\.desde/, 'tocar empieza en el tramo');
});
