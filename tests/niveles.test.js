import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { crearPartida, jugadasValidas, aplicarJugada, danioDeAccion } from '../js/motor.js';
import { elegirJugada, NIVELES } from '../js/ia.js';
import { armarMazo } from '../js/mazos.js';
import { crearRng } from '../js/rng.js';
import { prot, acont, mesa } from './ayudas.js';

const leer = f => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const AULA = leer('aula.json').cartas;
const CURSOS = [5, 6, 7, 8].map(c => leer(`mazo-${c}.json`));

test('hay tres niveles: aprendiz, historiador y erudito', () => {
  assert.deepEqual(NIVELES.map(n => n.id), ['aprendiz', 'historiador', 'erudito']);
});

test('danioDeAccion calcula el daño igual que el motor (ventaja ×2)', () => {
  const e = mesa({ activoA: prot('Politica', 60, [{ nombre: 'G', costo: 1, danio: 30 }]), activoB: prot('Economia', 100) });
  e.jugadores.A.activo.saber = 1;
  assert.equal(danioDeAccion(e, 'A', 0), 60);
  const r = aplicarJugada(e, { tipo: 'accion', indice: 0 }).estado;
  assert.equal(r.jugadores.B.activo.danio, 60);
});

test('todos los niveles devuelven siempre jugadas válidas y terminan la partida', () => {
  for (const nivel of ['aprendiz', 'historiador', 'erudito']) {
    const m = CURSOS[2];
    const rng = crearRng(3);
    let e = crearPartida({ mazoA: armarMazo(m.cartas, AULA, rng), mazoB: armarMazo(m.cartas, AULA, rng), semilla: 3, lineaTiempo: true });
    let n = 0;
    while (e.fase !== 'fin' && n < 500) {
      const j = elegirJugada(e, e.turno, { nivel });
      assert.ok(jugadasValidas(e).some(v => JSON.stringify(v) === JSON.stringify(j)), `${nivel}: ${JSON.stringify(j)}`);
      e = aplicarJugada(e, j).estado; n++;
    }
    assert.equal(e.fase, 'fin', nivel);
  }
});

test('historiador y erudito ubican bien la línea de tiempo', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [acont({ tipo: 'robar', n: 1 }, { fecha: { anio: 1817, texto: '1817' } })] });
  e.lineaTiempo = true; e.jugadores.A.saberPendiente = 0;
  e.jugadores.A.linea = [1810, 1833].map(anio => ({ id: `T${anio}`, nombre: 'x', anio, texto: String(anio) }));
  const r = aplicarJugada(e, { tipo: 'jugar', uid: 'Am0' }).estado;
  for (const nivel of ['historiador', 'erudito']) assert.deepEqual(elegirJugada(r, 'A', { nivel }), { tipo: 'ubicar', posicion: 1 }, nivel);
});

test('el erudito da Saber antes de atacar', () => {
  const e = mesa({ activoA: prot('Politica', 60, [{ nombre: 'G', costo: 1, danio: 20 }, { nombre: 'F', costo: 2, danio: 60 }]), activoB: prot('Cultura', 100) });
  e.jugadores.A.activo.saber = 1; e.jugadores.A.mano = [];
  assert.equal(elegirJugada(e, 'A', { nivel: 'erudito' }).tipo, 'asignarSaber');
});

test('el erudito remata si puede ganar un Hito', () => {
  const e = mesa({ activoA: prot('Politica', 60, [{ nombre: 'G', costo: 1, danio: 30 }]), activoB: prot('Cultura', 60), reservaB: [prot('Sociedad')] });
  e.jugadores.A.saberPendiente = 0; e.jugadores.A.activo.saber = 1; e.jugadores.B.activo.danio = 40; e.jugadores.A.mano = [];
  assert.deepEqual(elegirJugada(e, 'A', { nivel: 'erudito' }), { tipo: 'accion', indice: 0 });
});

// Duelos entre niveles con mazos reales, mitad de las partidas con cada lado partiendo.
function duelo(nivelA, nivelB, partidas) {
  let ganaA = 0;
  for (let s = 1; s <= partidas; s++) {
    const m = CURSOS[s % 4];
    const rng = crearRng(1000 + s);
    const mazo1 = armarMazo(m.cartas, AULA, rng), mazo2 = armarMazo(m.cartas, AULA, rng);
    const invertido = s % 2 === 0;
    const niveles = invertido ? { A: nivelB, B: nivelA } : { A: nivelA, B: nivelB };
    let e = crearPartida({ mazoA: mazo1, mazoB: mazo2, semilla: s, lineaTiempo: true });
    let n = 0;
    while (e.fase !== 'fin' && n < 600) { e = aplicarJugada(e, elegirJugada(e, e.turno, { nivel: niveles[e.turno] })).estado; n++; }
    if ((e.ganador === 'A') !== invertido && e.ganador) ganaA++;
  }
  return ganaA / partidas;
}

test('erudito le gana a historiador y historiador a aprendiz en la mayoría de las partidas', () => {
  const c = duelo('erudito', 'historiador', 120);
  const h = duelo('historiador', 'aprendiz', 120);
  console.log(`# erudito vs historiador: ${(c * 100).toFixed(0)}% | historiador vs aprendiz: ${(h * 100).toFixed(0)}%`);
  assert.ok(c >= 0.58, `erudito ${c}`);
  assert.ok(h >= 0.6, `historiador ${h}`);
});
