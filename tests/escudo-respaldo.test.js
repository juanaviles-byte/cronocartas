import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jugadasValidas, danioDeAccion } from '../js/motor.js';
import { validarCarta } from '../js/mazos.js';
import { elegirJugada } from '../js/ia.js';
import { textoEfecto } from '../js/ui/carta.js';
import { prot, aula, lugar, mesa, jugar } from './ayudas.js';

// Rework de equilibrio: «proteger» con n es un escudo (el próximo ataque hace n menos), y un efecto puede traer
// un respaldo que se aplica cuando el efecto principal no se puede (así ninguna carta queda muerta en la mano).

const atacante = () => prot('Cultura', 60, [{ nombre: 'X', costo: 1, danio: 50 }]);
function atacarTrasJugar(efecto) {
  let e = mesa({ activoA: prot('Politica', 100), activoB: atacante(), manoA: [aula(efecto)] });
  e = jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado;
  e = jugar(e, { tipo: 'pasar' }).estado;
  e.jugadores.B.activo.saber = 1;
  return { antes: e, despues: jugar(e, { tipo: 'accion', indice: 0 }).estado };
}

test('proteger con n: el próximo ataque hace n menos de daño y el escudo se consume', () => {
  const { antes, despues } = atacarTrasJugar({ tipo: 'proteger', n: 30 });
  assert.equal(danioDeAccion(antes, 'B', 0), 20, 'la tablet calcula el daño con el escudo');
  assert.equal(despues.jugadores.A.activo.danio, 20);
  assert.equal(despues.jugadores.A.activo.protegido, false);
});

test('proteger con n no deja daño negativo', () => {
  const { despues } = atacarTrasJugar({ tipo: 'proteger', n: 80 });
  assert.equal(despues.jugadores.A.activo.danio, 0);
});

test('proteger sin n sigue anulando el ataque entero', () => {
  const { despues } = atacarTrasJugar({ tipo: 'proteger' });
  assert.equal(despues.jugadores.A.activo.danio, 0);
});

const QUITA_O_ROBA = { tipo: 'anularLugar', respaldo: { tipo: 'robar', n: 1 } };

test('con Lugar en juego se aplica el efecto principal (y no el respaldo)', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [aula(QUITA_O_ROBA)], lugarEnJuego: lugar({ tipo: 'bonusDimension', dimension: 'Cultura', n: 10 }) });
  const mano = e.jugadores.A.mano.length;
  const r = jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado;
  assert.equal(r.lugar, null);
  assert.equal(r.jugadores.A.mano.length, mano - 1);
});

test('sin Lugar en juego la carta igual se puede jugar y se aplica el respaldo', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [aula(QUITA_O_ROBA)] });
  assert.ok(jugadasValidas(e).some(j => j.tipo === 'jugar' && j.uid === 'Am0'));
  const mano = e.jugadores.A.mano.length;
  const r = jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado;
  assert.equal(r.jugadores.A.mano.length, mano - 1 + 1, 'roba 1');
});

test('un respaldo dentro de una lista: «quita el Lugar o roba 1, y luego roba 1»', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [aula([QUITA_O_ROBA, { tipo: 'robar', n: 1 }])] });
  const mano = e.jugadores.A.mano.length;
  assert.equal(jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado.jugadores.A.mano.length, mano - 1 + 2);
});

test('mover Saber sin Saber en la reserva usa el respaldo', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), reservaA: [prot('Sociedad')], manoA: [aula({ tipo: 'moverSaberTodo', respaldo: { tipo: 'saberExtra', n: 1 } })] });
  const r = jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado;
  assert.equal(r.jugadores.A.activo.saber, 1);
});

test('las cartas con escudo y respaldo pasan la validación; los respaldos raros no', () => {
  assert.deepEqual(validarCarta(aula({ tipo: 'proteger', n: 30 })), []);
  assert.deepEqual(validarCarta(aula(QUITA_O_ROBA)), []);
  assert.notDeepEqual(validarCarta(aula({ tipo: 'anularLugar', respaldo: { tipo: 'inventado' } })), []);
  assert.notDeepEqual(validarCarta(aula({ tipo: 'anularLugar', respaldo: { tipo: 'robar', n: 1, respaldo: { tipo: 'robar', n: 1 } } })), [], 'sin respaldos anidados');
  assert.notDeepEqual(validarCarta(aula({ tipo: 'anularLugar', respaldo: { tipo: 'retiroGratis' } })), [], 'el respaldo no puede pedir elegir');
});

test('los textos explican el escudo y el respaldo', () => {
  assert.equal(textoEfecto({ tipo: 'proteger', n: 30 }), 'El próximo ataque contra tu activo hace 30 menos de daño (hasta tu próximo turno).');
  assert.equal(textoEfecto(QUITA_O_ROBA), 'Quita el Lugar en juego. Si no hay, roba 1 carta.');
  assert.equal(textoEfecto({ tipo: 'moverSaberTodo', respaldo: { tipo: 'saberExtra', n: 1 } }),
    'Pasa todo el Saber de un Protagonista de tu reserva a tu activo. Si no tienes Saber en la reserva, tu activo recibe 1 de Saber extra.');
});

test('la tablet juega una carta de respaldo cuando el efecto principal no se puede', () => {
  let e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [aula(QUITA_O_ROBA)] });
  e.jugadores.A.saberPendiente = 0;
  let jugo = false;
  for (let k = 0; k < 6 && e.turno === 'A'; k++) {
    const j = elegirJugada(e, 'A');
    if (j.tipo === 'jugar' && j.uid === 'Am0') { jugo = true; break; }
    if (j.tipo === 'pasar' || j.tipo === 'accion') break;
    e = jugar(e, j).estado;
  }
  assert.ok(jugo);
});

// Datos del rework: ninguna carta anula un ataque entero, y las mecánicas de Lugar y Saber siguen en el juego.
import { readFileSync } from 'node:fs';
const TODAS = ['mazo-5', 'mazo-6', 'mazo-7', 'mazo-8', 'exp-fin-del-mundo', 'aula'].flatMap(f => JSON.parse(readFileSync(`data/${f}.json`, 'utf8')).cartas);
const efectosDe = c => [].concat(c.efecto || []).flatMap(x => [x, ...(x.respaldo ? [x.respaldo] : [])]);

test('ninguna carta anula un ataque entero: proteger siempre es un escudo con número', () => {
  for (const c of TODAS) for (const x of efectosDe(c)) if (x.tipo === 'proteger') assert.ok(x.n >= 20 && x.n <= 40, c.nombre);
});

test('quitar el Lugar y mover Saber siguen en el juego, y nunca dejan la carta muerta', () => {
  for (const t of ['anularLugar', 'moverSaber', 'moverSaberTodo']) {
    const con = TODAS.filter(c => [].concat(c.efecto || []).some(x => x.tipo === t));
    assert.ok(con.length > 0, `${t} desapareció`);
    for (const c of con) assert.ok([].concat(c.efecto).some(x => x.tipo === t && x.respaldo), `${c.nombre}: ${t} sin respaldo`);
  }
});
