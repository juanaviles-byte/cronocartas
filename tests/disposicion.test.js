import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { disposicionDeMesa } from '../js/ui/disposicion.js';

// Contra la tablet, la mesa prioriza la vista del jugador; cara a cara, la mesa dividida.
test('contra la tablet y el tutorial usan la vista del jugador', () => {
  assert.equal(disposicionDeMesa({ modo: 'ia' }), 'jugador');
  assert.equal(disposicionDeMesa({ modo: 'tutorial' }), 'jugador');
});
test('cara a cara (también en el torneo) usa la mesa dividida', () => {
  assert.equal(disposicionDeMesa({ modo: 'caraacara' }), 'dividida');
});
test('la mesa marca la vista del jugador con una clase', () => {
  assert.match(readFileSync('js/ui/mesa.js', 'utf8'), /classList\.toggle\('vista-jugador', disposicionDeMesa\(config\) === 'jugador'\)/);
});
