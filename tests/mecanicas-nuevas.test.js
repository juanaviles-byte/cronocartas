import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jugadasValidas, desgloseDanio } from '../js/motor.js';
import { validarCarta } from '../js/mazos.js';
import { textoEfecto, textoHabilidad } from '../js/ui/carta.js';
import { prot, acont, lugar, mesa, jugar } from './ayudas.js';

// Mecánicas del plan equilibrado (noviembre 2026): efectos que tocan al rival,
// acciones con efecto, cuatro habilidades nuevas y dos tipos de Lugar.
const UNA = (danio, efecto) => [{ nombre: 'X', costo: 1, danio, ...(efecto ? { efecto } : {}) }];
const conSaber = (e, n = 1) => { e.jugadores.A.activo.saber = n; return e; };
const juegaCarta = (e, uid = 'Am0') => jugar(e, { tipo: 'jugar', uid });

test('recuperar devuelve a la mano la última carta de tu descarte', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [acont({ tipo: 'recuperar' })] });
  const vieja = prot('Sociedad', 70, undefined, { id: 'VIEJA' });
  e.jugadores.A.descarte = [{ uid: 'd1', carta: prot('Cultura') }, { uid: 'd2', carta: vieja }];
  const r = juegaCarta(e).estado.jugadores.A;
  assert.ok(r.mano.some(c => c.carta.id === 'VIEJA'));
  assert.equal(r.descarte.length, 2, 'queda la primera y la carta jugada');
});

test('recuperar no se puede jugar con el descarte vacío', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [acont({ tipo: 'recuperar' })] });
  e.jugadores.A.descarte = [];
  assert.ok(!jugadasValidas(e).some(j => j.tipo === 'jugar'));
});

test('asedio daña a cada Protagonista de la reserva rival, sin dejarlo con menos de 10', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), reservaB: [prot('Cultura', 60), prot('Sociedad', 60)], manoA: [acont({ tipo: 'asedio', n: 20 })] });
  e.jugadores.B.reserva[1].danio = 45;
  const B = juegaCarta(e).estado.jugadores.B;
  assert.equal(B.reserva[0].danio, 20);
  assert.equal(B.reserva[1].danio, 50, 'queda con 10');
  assert.equal(B.activo.danio, 0, 'el activo no se toca');
});

test('debilitar resta daño al próximo ataque del activo rival, y se gasta al atacar', () => {
  let e = mesa({ activoA: prot('Politica', 200), activoB: prot('Cultura', 200, UNA(40)), manoA: [acont({ tipo: 'debilitar', n: 20 })] });
  e = juegaCarta(e).estado;
  e = jugar(e, { tipo: 'pasar' }).estado;           // turno de B
  e.jugadores.B.activo.saber = 1;
  assert.equal(desgloseDanio(e, 'B', 0).total, 20);
  e = jugar(e, { tipo: 'accion', indice: 0 }).estado;
  assert.equal(e.jugadores.A.activo.danio, 20);
  assert.equal(e.jugadores.B.activo.debil || 0, 0);
});

test('quitarSaber le quita Saber al activo rival (no baja de 0)', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [acont({ tipo: 'quitarSaber', n: 2 })] });
  e.jugadores.B.activo.saber = 1;
  assert.equal(juegaCarta(e).estado.jugadores.B.activo.saber, 0);
});

test('quitarSaber no se juega si el rival no tiene Saber', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [acont({ tipo: 'quitarSaber', n: 1 })] });
  assert.ok(!jugadasValidas(e).some(j => j.tipo === 'jugar'));
});

test('saberReserva da Saber a cada Protagonista de tu reserva', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), reservaA: [prot('Cultura'), prot('Sociedad')], manoA: [acont({ tipo: 'saberReserva', n: 1 })] });
  const A = juegaCarta(e).estado.jugadores.A;
  assert.deepEqual(A.reserva.map(r => r.saber), [1, 1]);
  assert.equal(A.activo.saber, 0);
});

test('epidemia daña a todos los Protagonistas de ambos lados, sin dejar a nadie con menos de 10', () => {
  const e = mesa({ activoA: prot('Politica', 60), activoB: prot('Cultura', 60), reservaA: [prot('Cultura', 60)], reservaB: [prot('Sociedad', 60)], manoA: [acont({ tipo: 'epidemia', n: 10 })] });
  e.jugadores.B.activo.danio = 55;
  const r = juegaCarta(e).estado;
  assert.equal(r.jugadores.A.activo.danio, 10);
  assert.equal(r.jugadores.A.reserva[0].danio, 10);
  assert.equal(r.jugadores.B.reserva[0].danio, 10);
  assert.equal(r.jugadores.B.activo.danio, 55, 'ya estaba con 5: nadie cae por la epidemia');
  assert.ok(r.jugadores.B.activo, 'nadie cae');
});

test('una acción puede traer su propio efecto (asedio al golpear)', () => {
  const e = conSaber(mesa({ activoA: prot('Politica', 60, UNA(20, { tipo: 'asedio', n: 10 })), activoB: prot('Cultura', 200), reservaB: [prot('Sociedad')] }));
  const B = jugar(e, { tipo: 'accion', indice: 0 }).estado.jugadores.B;
  assert.equal(B.activo.danio, 20);
  assert.equal(B.reserva[0].danio, 10);
});

test('contraataque: si el defensor sobrevive, el atacante recibe daño (sin bajar de 10)', () => {
  const def = prot('Cultura', 200, undefined, { habilidad: { nombre: 'Empalizada', tipo: 'contraataque', n: 20 } });
  let e = conSaber(mesa({ activoA: prot('Politica', 60, UNA(30)), activoB: def }));
  assert.equal(jugar(e, { tipo: 'accion', indice: 0 }).estado.jugadores.A.activo.danio, 20);
  e = conSaber(mesa({ activoA: prot('Politica', 60, UNA(30)), activoB: def }));
  e.jugadores.A.activo.danio = 45;
  assert.equal(jugar(e, { tipo: 'accion', indice: 0 }).estado.jugadores.A.activo.danio, 50);
});

test('contraataque no responde si el defensor cae o si el golpe no hizo daño', () => {
  const def = () => prot('Cultura', 30, undefined, { habilidad: { nombre: 'E', tipo: 'contraataque', n: 20 } });
  let e = conSaber(mesa({ activoA: prot('Politica', 60, UNA(30)), activoB: def(), reservaB: [prot('Sociedad')] }));
  assert.equal(jugar(e, { tipo: 'accion', indice: 0 }).estado.jugadores.A.activo.danio, 0);
  e = conSaber(mesa({ activoA: prot('Politica', 60, UNA(0)), activoB: def() }));
  assert.equal(jugar(e, { tipo: 'accion', indice: 0 }).estado.jugadores.A.activo.danio, 0);
});

test('tenaz: la primera vez que caería, queda con 10; la segunda cae', () => {
  const def = prot('Cultura', 50, undefined, { habilidad: { nombre: 'Hielo', tipo: 'tenaz' } });
  let e = conSaber(mesa({ activoA: prot('Politica', 200, UNA(60)), activoB: def, reservaB: [prot('Sociedad')] }));
  let r = jugar(e, { tipo: 'accion', indice: 0 });
  assert.equal(r.estado.jugadores.B.activo.danio, 40);
  assert.ok(r.eventos.some(ev => ev.tipo === 'tenaz'));
  e = r.estado;
  e = jugar(e, { tipo: 'pasar' }).estado;    // turno de B
  e.jugadores.A.activo.saber = 1;
  r = jugar(e, { tipo: 'accion', indice: 0 });
  assert.equal(r.estado.fase, 'promover');
});

test('legado: cuando cae, tu próximo activo entra con Saber extra', () => {
  const def = prot('Cultura', 30, undefined, { habilidad: { nombre: 'Herencia', tipo: 'legado', n: 1 } });
  const e = conSaber(mesa({ activoA: prot('Politica', 200, UNA(40)), activoB: def, reservaB: [prot('Sociedad')] }));
  const r = jugar(e, { tipo: 'accion', indice: 0 }).estado;
  const p = jugar(r, { tipo: 'promover', uid: r.jugadores.B.reserva[0].uid }).estado;
  assert.equal(p.jugadores.B.activo.saber, 2, 'refuerzo +1 y legado +1');
});

test('alianza suma daño por cada Protagonista de tu reserva de la misma dimensión', () => {
  const atk = prot('Politica', 60, UNA(20), { habilidad: { nombre: 'Red', tipo: 'alianza', n: 10 } });
  const e = conSaber(mesa({ activoA: atk, activoB: prot('Cultura', 200), reservaA: [prot('Politica'), prot('Politica'), prot('Sociedad')] }));
  const d = desgloseDanio(e, 'A', 0);
  assert.equal(d.total, 40);
  assert.ok(d.pasos.some(p => p.fuente === 'alianza' && p.valor === 20));
});

test('Lugar curaDimension cura al activo de esa dimensión al inicio de su turno', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Territorio', 80), lugarEnJuego: lugar({ tipo: 'curaDimension', dimension: 'Territorio', n: 10 }) });
  e.jugadores.B.activo.danio = 30;
  assert.equal(jugar(e, { tipo: 'pasar' }).estado.jugadores.B.activo.danio, 20);
});

test('Lugar escudoDimension reduce el daño que recibe esa dimensión', () => {
  const e = conSaber(mesa({ activoA: prot('Politica', 60, UNA(30)), activoB: prot('Territorio', 200), lugarEnJuego: lugar({ tipo: 'escudoDimension', dimension: 'Territorio', n: 10 }) }));
  assert.equal(desgloseDanio(e, 'A', 0).total, 20);
});

test('la validación acepta los efectos, habilidades y lugares nuevos, y la retirada 0', () => {
  for (const t of ['recuperar', 'asedio', 'debilitar', 'quitarSaber', 'saberReserva', 'epidemia']) {
    assert.deepEqual(validarCarta(acont({ tipo: t, n: 10 })), [], t);
  }
  for (const t of ['contraataque', 'tenaz', 'legado', 'alianza']) {
    assert.deepEqual(validarCarta(prot('Politica', 80, undefined, { habilidad: { nombre: 'H', tipo: t, n: 1 } })), [], t);
  }
  for (const t of ['curaDimension', 'escudoDimension', 'bonusDimension']) {
    assert.deepEqual(validarCarta(lugar({ tipo: t, dimension: 'Territorio', n: 10 })), [], t);
  }
  assert.deepEqual(validarCarta(prot('Sociedad', 80, UNA(20, { tipo: 'debilitar', n: 10 }), { retirada: 0 })), []);
  assert.notDeepEqual(validarCarta(prot('Sociedad', 80, UNA(20, { tipo: 'inventado' }))), []);
  assert.notDeepEqual(validarCarta(prot('Sociedad', 80, UNA(20, { tipo: 'proteger' }))), [], 'atacar y protegerse cada turno sería inmunidad');
});

test('cada efecto y habilidad nueva tiene texto para la carta', () => {
  for (const t of ['recuperar', 'asedio', 'debilitar', 'quitarSaber', 'saberReserva', 'epidemia', 'curaDimension', 'escudoDimension']) {
    assert.ok(textoEfecto({ tipo: t, n: 10, dimension: 'Territorio' }).length > 10, t);
  }
  for (const t of ['contraataque', 'tenaz', 'legado', 'alianza']) assert.ok(textoHabilidad({ tipo: t, n: 10 }).length > 10, t);
});
