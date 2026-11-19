import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

// La narración va en un archivo por bloque (N01…N21, FN01…FN07) y cada carta es un tramo de ese archivo:
// así la app no carga 165 archivos sueltos y la vista previa cabe en su límite de archivos.
const voces = JSON.parse(readFileSync('data/voces.json', 'utf8'));

test('cada carta narrada apunta a un tramo válido de un archivo de bloque', () => {
  const entradas = Object.entries(voces.narrador);
  assert.ok(entradas.length >= 165, `solo ${entradas.length} cartas narradas`);
  for (const [id, t] of entradas) {
    assert.equal(typeof t, 'object', `${id}: debe ser un tramo { ruta, desde, hasta }`);
    assert.match(t.ruta, /^audio\/narrador\/F?N\d\d\.ogg$/, `${id}: ${t.ruta}`);
    assert.ok(existsSync(t.ruta), `falta ${t.ruta}`);
    assert.ok(t.desde >= 0 && t.hasta > t.desde + 1, `${id}: tramo ${t.desde}–${t.hasta}`);
  }
});

test('los tramos de un mismo bloque no se pisan', () => {
  const porRuta = {};
  for (const t of Object.values(voces.narrador)) (porRuta[t.ruta] ||= []).push(t);
  for (const [ruta, ts] of Object.entries(porRuta)) {
    ts.sort((a, b) => a.desde - b.desde);
    for (let i = 1; i < ts.length; i++) assert.ok(ts[i].desde >= ts[i - 1].hasta, `${ruta}: tramos superpuestos`);
  }
});

test('no quedan cortes sueltos del narrador', () => {
  const sueltos = readdirSync('audio/narrador').filter(f => !/^F?N\d\d\.ogg$/.test(f));
  assert.deepEqual(sueltos, []);
});

test('la voz reproduce tramos con WebAudio y los detiene', () => {
  const voz = readFileSync('js/ui/voz.js', 'utf8');
  assert.match(voz, /decodeAudioData/);
  assert.match(voz, /\.start\(0, *t\.desde/);
});
