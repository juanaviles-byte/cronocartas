import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { MOTIVO_DE_CARTA, MOTIVOS, motivoDeCarta } from '../js/motivos.js';
import { DEF_MOTIVOS } from '../js/ui/invocacion-motivo.js';

// Cada carta entra según lo que es: el ferrocarril con un tren, un puerto con un barco…
const leer = f => JSON.parse(readFileSync(`data/${f}`, 'utf8'));
const CARTAS = [5, 6, 7, 8].flatMap(c => leer(`mazo-${c}.json`).cartas);

test('todo Protagonista, Lugar y Acontecimiento de los cursos tiene su motivo', () => {
  const sin = CARTAS.filter(c => ['protagonista', 'lugar', 'acontecimiento'].includes(c.tipo) && !motivoDeCarta(c)).map(c => `${c.id} ${c.nombre}`);
  assert.deepEqual(sin, []);
});

test('los Personajes no tienen motivo (entran diciendo su frase); las cartas Aula entran como «escuela»', () => {
  assert.ok(CARTAS.filter(c => c.tipo === 'personaje').every(c => motivoDeCarta(c) === null));
  assert.equal(motivoDeCarta({ tipo: 'aula', id: 'CC-A-E3' }), 'escuela');
  assert.equal(motivoDeCarta({ tipo: 'protagonista', id: 'X-1', coleccion: 'fin-del-mundo' }), null);
  assert.equal(motivoDeCarta(CARTAS.find(c => c.nombre === 'Llegada del ferrocarril')), 'tren');
});

test('el mapa solo nombra cartas que existen', () => {
  const ids = new Set(CARTAS.map(c => c.id));
  assert.deepEqual(Object.keys(MOTIVO_DE_CARTA).filter(id => !ids.has(id)), []);
});

test('cada motivo tiene su animación y su sonido', () => {
  const sfx = leer('sfx.json');
  for (const m of [...MOTIVOS, 'escuela']) {
    assert.ok(DEF_MOTIVOS[m], `falta la animación de ${m}`);
    assert.ok(sfx[`motivo_${m}`] && existsSync(sfx[`motivo_${m}`].ruta), `falta el sonido de ${m}`);
  }
});

test('la invocación usa el motivo antes que la dimensión, en la imagen y en el sonido', () => {
  assert.match(readFileSync('js/ui/director.js', 'utf8'), /const escena = motivo \? escenaMotivo\(motivo\) : null;/);
  assert.match(readFileSync('js/ui/mesa.js', 'utf8'), /sonidos\.invocar\(plan\.carta\.tipo, dimensionDeInvocacion\(plan\.carta\), motivoDeCarta\(plan\.carta\)\)/);
  assert.match(readFileSync('js/ui/sonido.js', 'utf8'), /motivo \? `motivo_\$\{motivo\}`/);
});
