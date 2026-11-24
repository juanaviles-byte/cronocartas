import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const cartas = readdirSync('data').filter(f => /^mazo-\d\.json$/.test(f))
  .flatMap(f => { const d = JSON.parse(readFileSync('data/' + f, 'utf8')); return d.cartas || d; });
const porId = new Map(cartas.map(c => [c.id, c]));

test('voces.json tiene la sección de Personajes y cada voz es de un Personaje con frase en el guion', () => {
  const voces = JSON.parse(readFileSync('data/voces.json', 'utf8'));
  assert.ok(voces.personajes && typeof voces.personajes === 'object', 'falta la sección "personajes"');
  const guion = JSON.parse(readFileSync('docs/voces-personajes.json', 'utf8'));
  for (const [id, ruta] of Object.entries(voces.personajes)) {
    assert.equal(porId.get(id)?.tipo, 'personaje', `${id} no es un Personaje`);
    assert.ok(guion.frases[id], `${id} no tiene frase en el guion`);
    assert.ok(existsSync(ruta.ruta), `falta ${ruta.ruta}`);
  }
});

test('el guion de voces cubre a todos los Personajes del juego', () => {
  const guion = JSON.parse(readFileSync('docs/voces-personajes.json', 'utf8'));
  const personajes = cartas.filter(c => c.tipo === 'personaje').map(c => c.id).sort();
  assert.deepEqual(Object.values(guion.bloques).sort(), personajes);
});

test('al invocar un Personaje se oye su frase y la escena espera a que termine', () => {
  const voz = readFileSync('js/ui/voz.js', 'utf8');
  assert.match(voz, /export const rutaPersonaje/);
  assert.match(voz, /export function hablarPersonaje/);
  const mesa = readFileSync('js/ui/mesa.js', 'utf8');
  assert.match(mesa, /hablarPersonaje\(plan\.carta\)/);
  assert.match(mesa, /escenaInvocacion\(\{.*, espera \}\)/);
  const director = readFileSync('js/ui/director.js', 'utf8');
  assert.match(director, /Promise\.all\(\[esperar\([^)]*\), espera\]\)/);
});
