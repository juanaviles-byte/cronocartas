import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dorsoDeMazo } from '../js/ui/dorsos.js';

const D = JSON.parse(readFileSync('data/dorsos.json', 'utf8'));

test('los archivos de dorsos existen y cada carta y bando tiene temática con dorso', () => {
  for (const r of [D.general, ...D.variantes, ...Object.values(D.temas)]) assert.ok(existsSync(r), `falta ${r}`);
  for (const t of [...Object.values(D.cartas), ...Object.values(D.bandos)]) assert.ok(D.temas[t], `temática ${t} sin dorso`);
});

test('un bando de Duelo usa el dorso de su temática', () => {
  assert.equal(dorsoDeMazo(D, [], 'roma'), D.temas.roma);
});

test('un mazo usa el dorso de la temática que más se repite si es clara', () => {
  const ids = Object.entries(D.cartas).filter(([, t]) => t === 'incas').map(([id]) => id);
  const otras = Object.entries(D.cartas).filter(([, t]) => t !== 'incas').slice(0, 2).map(([id]) => id);
  assert.equal(dorsoDeMazo(D, [...ids, ...otras].map(id => ({ id })), null), D.temas.incas);
});

test('sin temática dominante, el dorso general', () => {
  const porTema = {};
  for (const [id, t] of Object.entries(D.cartas)) (porTema[t] ||= []).push(id);
  const mezcla = Object.values(porTema).flatMap(l => l.slice(0, 2)).map(id => ({ id }));
  assert.equal(dorsoDeMazo(D, mezcla, null), D.general);
  assert.equal(dorsoDeMazo(null, mezcla, null), null);
});
