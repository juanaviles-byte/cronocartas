import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { escenarioCarta, registrarEscenarios } from '../js/ui/carta.js';

const lugares = [5, 6, 7, 8].flatMap(c => JSON.parse(readFileSync(`data/mazo-${c}.json`, 'utf8')).cartas).filter(x => x.tipo === 'lugar');

test('cada carta Lugar tiene su escenario y el archivo existe', () => {
  const esc = JSON.parse(readFileSync('data/escenarios.json', 'utf8'));
  for (const l of lugares) {
    assert.ok(esc[l.id], `${l.nombre} (${l.id}) no tiene escenario`);
    assert.match(esc[l.id], /^img\/escenarios\/[\w-]+\.webp$/);
    assert.ok(existsSync(esc[l.id]), `falta ${esc[l.id]}`);
  }
});

test('escenarioCarta da el escenario registrado o null', () => {
  registrarEscenarios({ 'CC-7-U4-010': 'img/escenarios/CC-7-U4-010.webp' });
  assert.equal(escenarioCarta({ id: 'CC-7-U4-010' }), 'img/escenarios/CC-7-U4-010.webp');
  assert.equal(escenarioCarta({ id: 'otra' }), null);
});

test('la mesa prefiere el escenario a la ilustración, y el service worker lo guarda', () => {
  assert.match(readFileSync('js/ui/mesa.js', 'utf8'), /escenarioCarta\(lugar\)/);
  assert.match(readFileSync('js/ui/datos.js', 'utf8'), /data\/escenarios\.json/);
  const sw = readFileSync('sw.js', 'utf8');
  for (const r of Object.values(JSON.parse(readFileSync('data/escenarios.json', 'utf8')))) assert.ok(sw.includes(r), `sw.js no incluye ${r}`);
});
