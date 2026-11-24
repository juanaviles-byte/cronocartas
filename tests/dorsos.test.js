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

test('en cada Duelo (cursos y expansiones) los dos bandos tienen su propio dorso, y son distintos', () => {
  const duelos = [...JSON.parse(readFileSync('data/duelos.json', 'utf8')).duelos, ...(JSON.parse(readFileSync('data/exp-fin-del-mundo.json', 'utf8')).duelos || [])];
  for (const d of duelos) {
    const [a, b] = d.bandos.map(x => dorsoDeMazo(D, [], x.id, 'general'));
    for (const [x, r] of [[d.bandos[0], a], [d.bandos[1], b]]) assert.notEqual(r, 'general', `${d.id}/${x.id} sin dorso de bando`);
    assert.notEqual(a, b, `${d.id}: los dos bandos tienen el mismo dorso`);
  }
});

// Modo libre (y cualquier mazo de curso sin temática clara): en vez del reloj de arena general,
// un dorso al azar entre los arquetipos de las cartas del mazo. La semilla de la partida lo fija,
// así al retomar una partida guardada el dorso es el mismo.
const mezclaDe = curso => {
  const porTema = {};
  for (const [id, t] of Object.entries(D.cartas)) if (id.startsWith(`CC-${curso}-`)) (porTema[t] ||= []).push(id);
  return Object.values(porTema).flatMap(l => l.slice(0, 2)).map(id => ({ id }));
};

test('sin temática dominante y con semilla: un dorso de un arquetipo del curso, nunca el general', () => {
  for (const curso of [5, 6, 7, 8]) {
    const mazo = mezclaDe(curso);
    const permitidos = new Set(mazo.map(c => D.temas[D.cartas[c.id]]));
    for (let s = 0; s < 40; s++) {
      const r = dorsoDeMazo(D, mazo, null, undefined, { semilla: s });
      assert.ok(permitidos.has(r), `${curso}° semilla ${s}: ${r}`);
    }
  }
});

test('el dorso al azar depende de la semilla: la misma da el mismo, varias dan varios', () => {
  const mazo = mezclaDe(7);
  assert.equal(dorsoDeMazo(D, mazo, null, undefined, { semilla: 123 }), dorsoDeMazo(D, mazo, null, undefined, { semilla: 123 }));
  const distintos = new Set(Array.from({ length: 60 }, (_, s) => dorsoDeMazo(D, mazo, null, undefined, { semilla: s })));
  assert.ok(distintos.size >= 4, `solo ${distintos.size} dorsos distintos`);
});

test('el dorso al azar evita repetir el del rival cuando hay otro', () => {
  const mazo = mezclaDe(8);
  for (let s = 0; s < 40; s++) {
    const a = dorsoDeMazo(D, mazo, null, undefined, { semilla: s });
    assert.notEqual(dorsoDeMazo(D, mazo, null, undefined, { semilla: s, evitar: a }), a);
  }
});

test('un lado de expansión conserva su dorso aunque haya semilla', () => {
  assert.equal(dorsoDeMazo(D, mezclaDe(7), null, 'img/dorsos/FM-general.webp', { semilla: 5 }), 'img/dorsos/FM-general.webp');
});

test('la mesa pide el dorso al azar con la semilla de la partida', () => {
  const mesa = readFileSync('js/ui/mesa.js', 'utf8');
  assert.match(mesa, /const azar = \{ semilla: config\.semilla/);
  assert.match(mesa, /dorsoDeMazo\([^)]*, azar\)/);
});

test('el dorso al azar no usa el del Aula: las cartas de Aula son de todos los cursos, no un arquetipo', () => {
  const aula = Object.entries(D.cartas).filter(([, t]) => t === 'aula').map(([id]) => ({ id }));
  const mazo = [...mezclaDe(6), ...aula];
  for (let s = 0; s < 60; s++) assert.notEqual(dorsoDeMazo(D, mazo, null, undefined, { semilla: s }), D.temas.aula);
});
