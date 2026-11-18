import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aplicarJugada, jugadaReversible } from '../js/motor.js';
import { prot, acont, mesa } from './ayudas.js';

const base = () => {
  const e = mesa({ activoA: prot('Politica', 60, [{ nombre: 'G', costo: 1, danio: 20 }]), activoB: prot('Cultura', 100),
    manoA: [prot('Sociedad'), acont({ tipo: 'robar', n: 1 }), acont({ tipo: 'proteger' })] });
  e.jugadores.A.saberPendiente = 1;
  return e;
};
const probar = (e, j) => jugadaReversible(e, aplicarJugada(e, j).estado, j);

test('dar Saber, bajar un Protagonista o jugar una carta sin robar se pueden deshacer', () => {
  const e = base();
  assert.equal(probar(e, { tipo: 'asignarSaber', destino: e.jugadores.A.activo.uid }), true);
  assert.equal(probar(e, { tipo: 'bajar', uid: 'Am0' }), true);
  assert.equal(probar(e, { tipo: 'jugar', uid: 'Am2' }), true);
});

test('atacar, pasar, ubicar o robar cartas del mazo no se pueden deshacer', () => {
  const e = base();
  e.jugadores.A.saberPendiente = 0; e.jugadores.A.activo.saber = 1;
  assert.equal(probar(e, { tipo: 'accion', indice: 0 }), false);
  assert.equal(probar(e, { tipo: 'pasar' }), false);
  assert.equal(probar(e, { tipo: 'jugar', uid: 'Am1' }), false, 'robar revela cartas');
  assert.equal(jugadaReversible(e, e, { tipo: 'ubicar', posicion: 0 }), false);
});
