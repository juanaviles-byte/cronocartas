import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { textoAnio, direccionViaje, anioEnViaje, epocaDe } from '../js/ui/tiempo.js';

test('textoAnio escribe años antes de Cristo, aproximados y el presente', () => {
  assert.equal(textoAnio({ anio: -3000, aprox: true }), 'c. 3000 a. C.');
  assert.equal(textoAnio({ anio: 1817 }), '1817');
  assert.equal(textoAnio({ anio: 1500, aprox: true }), 'c. 1500');
  assert.equal(textoAnio({ anio: 2026, hoy: true }), 'Hoy');
  assert.equal(textoAnio(null), '');
});

test('direccionViaje dice si el salto es al pasado, al futuro o no hay salto', () => {
  assert.equal(direccionViaje({ anio: 1817 }, { anio: 1500 }), 'pasado');
  assert.equal(direccionViaje({ anio: -500 }, { anio: 1325 }), 'futuro');
  assert.equal(direccionViaje({ anio: 1500 }, { anio: 1500 }), null);
  assert.equal(direccionViaje(null, { anio: 1500 }), null);
});

test('anioEnViaje recorre del año de partida al de llegada y salta el año 0', () => {
  assert.equal(anioEnViaje(1817, 1500, 0), 1817);
  assert.equal(anioEnViaje(1817, 1500, 1), 1500);
  const medio = anioEnViaje(-100, 100, 0.5);
  assert.notEqual(medio, 0);
  for (let t = 0; t <= 1; t += 0.05) { const a = anioEnViaje(1817, 1500, t); assert.ok(a <= 1817 && a >= 1500); }
});

test('cada tablero y cada Lugar tiene época', () => {
  const ep = JSON.parse(readFileSync('data/epocas.json', 'utf8'));
  const tableros = JSON.parse(readFileSync('data/tableros.json', 'utf8')).tableros;
  const lugares = [5, 6, 7, 8].flatMap(c => JSON.parse(readFileSync(`data/mazo-${c}.json`, 'utf8')).cartas).filter(x => x.tipo === 'lugar');
  for (const x of [...tableros, ...lugares]) {
    assert.ok(ep[x.id] && Number.isInteger(ep[x.id].anio), `${x.id} sin época`);
    assert.equal(epocaDe(ep, x.id), ep[x.id]);
  }
  assert.equal(epocaDe(ep, 'no-existe'), null);
});
