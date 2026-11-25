// Minijuego de geografía: las cartas de expansión se sitúan en el mapa (o con alternativas).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { jugadasValidas, jugadaReversible } from '../js/motor.js';
import { elegirJugada } from '../js/ia.js';
import { MAPAS } from '../js/geografia.js';
import { prot, acont, lugar, mesa, jugar } from './ayudas.js';

const OC = JSON.parse(readFileSync('data/exp-ocaso-de-los-dioses.json', 'utf8')).cartas;
const FM = JSON.parse(readFileSync('data/exp-fin-del-mundo.json', 'utf8')).cartas;
const deMapa = (zonas, extra = {}) => acont({ tipo: 'robar', n: 1 }, { coleccion: 'ocaso-de-los-dioses', origen: { mapa: 'mundo', zonas }, ...extra });
const deSeleccion = (extra = {}) => acont({ tipo: 'robar', n: 1 }, { coleccion: 'ocaso-de-los-dioses',
  origen: { pregunta: '¿Dónde?', respuesta: 'Italia', otras: ['Alemania', 'Turquía'] }, ...extra });
const conMapa = (opciones, linea = true) => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), ...opciones });
  e.lineaTiempo = linea;
  e.jugadores.A.saberPendiente = 0;
  return e;
};
const indice = (p, id) => p.opciones.indexOf(id);

test('al jugar una carta de expansión con origen, solo se puede situar: una jugada por zona del mapa', () => {
  const r = jugar(conMapa({ manoA: [deMapa(['grecia']), prot('Sociedad')] }), { tipo: 'jugar', uid: 'Am0' }).estado;
  const p = r.jugadores.A.porSituar;
  assert.equal(p.mapa, 'mundo');
  assert.deepEqual(p.opciones, MAPAS.mundo.zonas.map(z => z.id));
  assert.deepEqual(jugadasValidas(r), p.opciones.map((_, opcion) => ({ tipo: 'situar', opcion })));
});

test('situar bien da +1 Saber al activo, suma un acierto y queda en el mapa del jugador', () => {
  const e = jugar(conMapa({ manoA: [deMapa(['grecia'])] }), { tipo: 'jugar', uid: 'Am0' }).estado;
  const r = jugar(e, { tipo: 'situar', opcion: indice(e.jugadores.A.porSituar, 'grecia') });
  const A = r.estado.jugadores.A;
  assert.equal(A.activo.saber, 1);
  assert.equal(A.aciertos, 1);
  assert.equal(A.porSituar, null);
  assert.equal(A.mapa.length, 1);
  assert.equal(A.mapa[0].correcto, true);
  const ev = r.eventos.find(x => x.tipo === 'situar');
  assert.equal(ev.correcto, true);
  assert.deepEqual(ev.correctas, ['grecia']);
});

test('situar mal no premia y el evento dice cuál era la respuesta', () => {
  const e = jugar(conMapa({ manoA: [deMapa(['grecia'])] }), { tipo: 'jugar', uid: 'Am0' }).estado;
  const r = jugar(e, { tipo: 'situar', opcion: indice(e.jugadores.A.porSituar, 'japon') });
  assert.equal(r.estado.jugadores.A.activo.saber, 0);
  const ev = r.eventos.find(x => x.tipo === 'situar');
  assert.equal(ev.correcto, false);
  assert.equal(ev.elegida, 'japon');
  assert.deepEqual(ev.correctas, ['grecia']);
});

test('una carta de varias zonas acepta cualquiera de ellas', () => {
  const e = jugar(conMapa({ manoA: [deMapa(['grecia', 'egipto'])] }), { tipo: 'jugar', uid: 'Am0' }).estado;
  const r = jugar(e, { tipo: 'situar', opcion: indice(e.jugadores.A.porSituar, 'egipto') });
  assert.equal(r.estado.jugadores.A.activo.saber, 1);
});

test('las preguntas de selección traen 3 alternativas barajadas con la semilla de la partida', () => {
  const e = conMapa({ manoA: [deSeleccion()] });
  const a = jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado.jugadores.A.porSituar;
  const b = jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado.jugadores.A.porSituar;
  assert.equal(a.mapa, null);
  assert.deepEqual([...a.opciones].sort(), ['Alemania', 'Italia', 'Turquía']);
  assert.deepEqual(a.opciones, b.opciones);
  assert.deepEqual(a.correctas, ['Italia']);
});

test('los Lugares de expansión también se sitúan', () => {
  const l = lugar({ tipo: 'bonusDimension', dimension: 'Politica', n: 10 }, { coleccion: 'ocaso-de-los-dioses', origen: { mapa: 'mundo', zonas: ['japon'] } });
  const r = jugar(conMapa({ manoA: [l] }), { tipo: 'jugar', uid: 'Am0' }).estado;
  assert.ok(r.jugadores.A.porSituar);
});

test('sin la opción de línea de tiempo no hay preguntas de geografía', () => {
  const r = jugar(conMapa({ manoA: [deMapa(['grecia'])] }, false), { tipo: 'jugar', uid: 'Am0' }).estado;
  assert.equal(r.jugadores.A.porSituar || null, null);
});

test('la tablet sitúa bien como Historiadora y Erudita (igual que en la línea), y situar no se puede deshacer', () => {
  const e = jugar(conMapa({ manoA: [deMapa(['china'])] }), { tipo: 'jugar', uid: 'Am0' }).estado;
  for (const nivel of ['historiador', 'erudito']) {
    const j = elegirJugada(e, 'A', { nivel });
    assert.equal(j.tipo, 'situar', nivel);
    assert.equal(e.jugadores.A.porSituar.opciones[j.opcion], 'china', nivel);
  }
  assert.equal(jugadaReversible(e, e, { tipo: 'situar', opcion: 0 }), false);
});

test('cada Personaje, Acontecimiento y Lugar de las expansiones tiene un origen válido (salvo «Todo Chile»)', () => {
  for (const [cartas, mapa] of [[OC, 'mundo'], [FM, 'chile']]) {
    const zonas = MAPAS[mapa].zonas.map(z => z.id);
    for (const c of cartas.filter(x => ['personaje', 'acontecimiento', 'lugar'].includes(x.tipo))) {
      if (c.zona === 'Todo Chile') { assert.equal(c.origen, undefined, c.id); continue; }
      assert.ok(c.origen, `${c.id} sin origen`);
      if (c.origen.mapa) {
        assert.equal(c.origen.mapa, mapa, c.id);
        assert.ok(c.origen.zonas.length && c.origen.zonas.every(z => zonas.includes(z)), c.id);
      } else {
        assert.ok(c.origen.respuesta && c.origen.otras.length === 2 && !c.origen.otras.includes(c.origen.respuesta), c.id);
      }
    }
    for (const c of cartas.filter(x => x.tipo === 'protagonista')) assert.equal(c.origen, undefined, c.id);
  }
});

test('los mapas existen y sus zonas caben dentro de la imagen', () => {
  for (const m of Object.values(MAPAS)) {
    assert.ok(existsSync(m.imagen), m.imagen);
    for (const z of m.zonas) assert.ok(z.x > 0 && z.x < 100 && z.y > 0 && z.y < 100, z.id);
  }
});
