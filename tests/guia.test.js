import { test } from 'node:test';
import assert from 'node:assert/strict';
import { situacion, situacionDeEvento, pista, EXPRESIONES } from '../js/ui/guia.js';
import { crearPartida, aplicarJugada, jugadasValidas } from '../js/motor.js';
import { prot, acont, mazoSimple, mesa } from './ayudas.js';

const sinMano = e => { e.jugadores.A.mano = []; return e; };

test('las expresiones son las 4 del retrato', () => {
  assert.deepEqual(EXPRESIONES, ['explica', 'pista', 'celebra', 'atenta']);
});

test('en la preparación, sin activo, explica cómo poner el activo', () => {
  const e = crearPartida({ mazoA: mazoSimple(), mazoB: mazoSimple(), semilla: 1 });
  const s = situacion(e, e.turno);
  assert.equal(s.clave, 'prep-activo');
  assert.match(s.texto, /activo/);
});

test('con Saber por repartir, la situación es "saber"', () => {
  const e = sinMano(mesa({ activoA: prot('Politica'), activoB: prot('Cultura') }));
  e.jugadores.A.saberPendiente = 1;
  assert.equal(situacion(e, 'A').clave, 'saber');
});

test('avisa cuando el activo rival tiene ventaja sobre el propio', () => {
  // Territorio vence a Política: el activo de A (Política) está en desventaja.
  const e = sinMano(mesa({ activoA: prot('Politica'), activoB: prot('Territorio') }));
  e.jugadores.A.saberPendiente = 0;
  const s = situacion(e, 'A');
  assert.equal(s.clave, 'desventaja');
  assert.equal(s.expresion, 'atenta');
});

test('celebra la primera Conexión y el Hito propio', () => {
  assert.equal(situacionDeEvento({ tipo: 'conexion', jugador: 'A', texto: 'x' }, 'A').expresion, 'celebra');
  assert.equal(situacionDeEvento({ tipo: 'hito', jugador: 'A' }, 'A').clave, 'hito');
  assert.equal(situacionDeEvento({ tipo: 'hito', jugador: 'B' }, 'A'), null);
});

test('la pista sugiere una jugada válida y explica por qué', () => {
  const e = sinMano(mesa({ activoA: prot('Politica', 60, [{ nombre: 'Decreto', costo: 1, danio: 30 }]), activoB: prot('Economia', 100) }));
  e.jugadores.A.saberPendiente = 0; e.jugadores.A.activo.saber = 1;
  const p = pista(e, 'A');
  assert.deepEqual(p.jugada, { tipo: 'accion', indice: 0 });
  assert.ok(jugadasValidas(e).some(v => JSON.stringify(v) === JSON.stringify(p.jugada)));
  assert.match(p.texto, /Decreto/);
  assert.match(p.texto, /60/);          // daño efectivo con ventaja
  assert.match(p.texto, /ventaja/i);
});

test('la pista de Saber dice qué acción se podrá usar', () => {
  const e = sinMano(mesa({ activoA: prot('Politica', 60, [{ nombre: 'Decreto', costo: 1, danio: 20 }, { nombre: 'Gran reforma', costo: 2, danio: 50 }]), activoB: prot('Cultura', 100) }));
  e.jugadores.A.saberPendiente = 1; e.jugadores.A.activo.saber = 1;
  const p = pista(e, 'A');
  assert.equal(p.jugada.tipo, 'asignarSaber');
  assert.match(p.texto, /Gran reforma/);
});

test('en la línea de tiempo la pista no revela la respuesta', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [acont({ tipo: 'robar', n: 1 }, { nombre: 'Hecho nuevo', fecha: { anio: 1817, texto: '1817' } })] });
  e.lineaTiempo = true; e.jugadores.A.saberPendiente = 0;
  e.jugadores.A.linea = [{ id: 't1', nombre: 'Cabildo', anio: 1810, texto: '1810' }];
  const r = aplicarJugada(e, { tipo: 'jugar', uid: 'Am0' }).estado;
  const p = pista(r, 'A');
  assert.equal(p.jugada, null);
  assert.ok(!p.texto.includes('1817'), p.texto);
  assert.match(p.texto, /Cabildo/);
});
