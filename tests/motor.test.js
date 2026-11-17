import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearPartida, jugadasValidas, aplicarJugada, VENTAJA } from '../js/motor.js';
import { prot, acont, lugar, aula, mazoSimple, prepararRapido, mesa, jugar } from './ayudas.js';

const conSaber = (e, j, n) => { e.jugadores[j].activo.saber = n; return e; };

test('crearPartida reparte 5 cartas con al menos un protagonista base a cada jugador', () => {
  const mazo = [...Array(19)].map(() => acont({ tipo: 'robar', n: 1 }));
  mazo.push(prot('Politica'));
  for (const s of [1, 2, 3, 4, 5]) {
    const e = crearPartida({ mazoA: mazo, mazoB: mazoSimple(), semilla: s });
    for (const j of ['A', 'B']) {
      assert.equal(e.jugadores[j].mano.length, 5);
      assert.ok(e.jugadores[j].mano.some(c => c.carta.tipo === 'protagonista' && !c.carta.evolucionaDe));
      assert.equal(e.jugadores[j].mazo.length, 15);
    }
    assert.equal(e.fase, 'preparacion');
  }
});

test('misma semilla produce la misma partida', () => {
  const a = crearPartida({ mazoA: mazoSimple(), mazoB: mazoSimple(), semilla: 42 });
  const b = crearPartida({ mazoA: mazoSimple(), mazoB: mazoSimple(), semilla: 42 });
  assert.deepEqual(a.jugadores.A.mano.map(c => c.carta.resistencia), b.jugadores.A.mano.map(c => c.carta.resistencia));
  assert.deepEqual(a.rng, b.rng);
});

test('aplicarJugada no muta el estado de entrada', () => {
  const e = crearPartida({ mazoA: mazoSimple(), mazoB: mazoSimple(), semilla: 3 });
  const copia = JSON.stringify(e);
  aplicarJugada(e, jugadasValidas(e)[0]);
  assert.equal(JSON.stringify(e), copia);
});

test('una jugada que no está en jugadasValidas lanza error', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Economia') });
  assert.throws(() => aplicarJugada(e, { tipo: 'accion', indice: 0 }), /jugada inválida/);
});

test('preparación termina en fase turno con A activo y saber pendiente', () => {
  const e = prepararRapido(crearPartida({ mazoA: mazoSimple(), mazoB: mazoSimple(), semilla: 9 }));
  assert.equal(e.fase, 'turno');
  assert.equal(e.turno, 'A');
  assert.equal(e.numeroTurno, 1);
  assert.ok(e.jugadores.A.activo && e.jugadores.B.activo);
  assert.equal(e.jugadores.A.saberPendiente, 1);
});

test('ventaja: Política contra Economía hace el doble', () => {
  assert.equal(VENTAJA.Politica, 'Economia');
  let e = conSaber(mesa({ activoA: prot('Politica', 60, [{ nombre: 'X', costo: 1, danio: 30 }]), activoB: prot('Economia', 100) }), 'A', 1);
  const { estado, eventos } = jugar(e, { tipo: 'accion', indice: 0 });
  assert.ok(eventos.some(ev => ev.tipo === 'ventaja'));
  assert.equal(eventos.find(ev => ev.tipo === 'danio').valor, 60);
  assert.equal(estado.jugadores.B.activo.danio, 60);
});

test('sin ventaja el daño es el de la acción', () => {
  let e = conSaber(mesa({ activoA: prot('Politica', 60, [{ nombre: 'X', costo: 1, danio: 30 }]), activoB: prot('Cultura', 100) }), 'A', 1);
  assert.equal(jugar(e, { tipo: 'accion', indice: 0 }).estado.jugadores.B.activo.danio, 30);
});

test('lugar bonusDimension suma n a la dimensión indicada', () => {
  let e = conSaber(mesa({ activoA: prot('Economia', 60, [{ nombre: 'X', costo: 1, danio: 20 }]), activoB: prot('Cultura', 100),
    lugarEnJuego: lugar({ tipo: 'bonusDimension', dimension: 'Economia', n: 10 }) }), 'A', 1);
  assert.equal(jugar(e, { tipo: 'accion', indice: 0 }).estado.jugadores.B.activo.danio, 30);
});

test('anularLugar deja lugar en null', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [aula({ tipo: 'anularLugar' })],
    lugarEnJuego: lugar({ tipo: 'bonusDimension', dimension: 'Economia', n: 10 }) });
  assert.equal(jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado.lugar, null);
});

test('jugar un lugar lo pone en juego', () => {
  const L = lugar({ tipo: 'bonusDimension', dimension: 'Politica', n: 10 });
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [L] });
  assert.equal(jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado.lugar.carta.id, L.id);
});

test('proteger anula el daño del siguiente ataque rival y se consume', () => {
  let e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura', 60, [{ nombre: 'X', costo: 1, danio: 30 }]), manoA: [aula({ tipo: 'proteger' })] });
  e = jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado;
  e = jugar(e, { tipo: 'pasar' }).estado;
  e.jugadores.B.activo.saber = 1;
  const r = jugar(e, { tipo: 'accion', indice: 0 });
  assert.equal(r.estado.jugadores.A.activo.danio, 0);
  assert.equal(r.estado.jugadores.A.activo.protegido, false);
});

test('curar no se puede jugar sin daño', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [aula({ tipo: 'curar', n: 30 })] });
  assert.ok(!jugadasValidas(e).some(j => j.tipo === 'jugar'));
});

test('curar resta daño sin bajar de 0', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [aula({ tipo: 'curar', n: 30 })] });
  e.jugadores.A.activo.danio = 20;
  assert.equal(jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado.jugadores.A.activo.danio, 0);
});

test('bonusDanio suma a la próxima acción y se consume', () => {
  let e = conSaber(mesa({ activoA: prot('Politica', 60, [{ nombre: 'X', costo: 1, danio: 20 }]), activoB: prot('Cultura', 200), manoA: [aula({ tipo: 'bonusDanio', n: 20 })] }), 'A', 1);
  e = jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado;
  const r = jugar(e, { tipo: 'accion', indice: 0 }).estado;
  assert.equal(r.jugadores.B.activo.danio, 40);
  assert.equal(r.jugadores.A.activo.bonus, 0);
});

test('robar n agrega n cartas a la mano', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [acont({ tipo: 'robar', n: 2 })] });
  const antes = e.jugadores.A.mano.length;
  assert.equal(jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado.jugadores.A.mano.length, antes - 1 + 2);
});

test('robarPorReserva roba una carta por cada protagonista en reserva', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), reservaA: [prot('Sociedad'), prot('Cultura')], manoA: [aula({ tipo: 'robarPorReserva' })] });
  assert.equal(jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado.jugadores.A.mano.length, 2);
});

test('moverSaber pasa 1 saber de la reserva al activo', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), reservaA: [prot('Sociedad')], manoA: [aula({ tipo: 'moverSaber' })] });
  e.jugadores.A.reserva[0].saber = 2;
  const r = jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado;
  assert.equal(r.jugadores.A.activo.saber, 1);
  assert.equal(r.jugadores.A.reserva[0].saber, 1);
});

test('buscarProtagonista toma el primer protagonista de las 3 primeras cartas del mazo', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [aula({ tipo: 'buscarProtagonista', n: 3 })] });
  const P = prot('Territorio', 70, undefined, { id: 'BUSCADO' });
  e.jugadores.A.mazo = [{ uid: 'q1', carta: acont({ tipo: 'robar', n: 1 }) }, { uid: 'q2', carta: P }, { uid: 'q3', carta: acont({ tipo: 'robar', n: 1 }) }, { uid: 'q4', carta: prot('Politica') }];
  const r = jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado;
  assert.ok(r.jugadores.A.mano.some(c => c.carta.id === 'BUSCADO'));
  assert.equal(r.jugadores.A.mazo.length, 3);
});

test('caída da 1 hito al atacante y obliga a promover si hay reserva', () => {
  let e = conSaber(mesa({ activoA: prot('Politica', 60, [{ nombre: 'X', costo: 1, danio: 50 }]), activoB: prot('Cultura', 50), reservaB: [prot('Sociedad')] }), 'A', 1);
  const { estado, eventos } = jugar(e, { tipo: 'accion', indice: 0 });
  assert.equal(estado.jugadores.A.hitos, 1);
  assert.ok(eventos.some(ev => ev.tipo === 'caida' && ev.carta));
  assert.equal(estado.fase, 'promover');
  assert.equal(estado.turno, 'B');
  const uid = estado.jugadores.B.reserva[0].uid;
  assert.deepEqual(jugadasValidas(estado), [{ tipo: 'promover', uid }]);
  const tras = jugar(estado, { tipo: 'promover', uid }).estado;
  assert.equal(tras.fase, 'turno');
  assert.equal(tras.turno, 'B');
  assert.equal(tras.jugadores.B.activo.uid, uid);
});

test('sin reserva el atacante gana', () => {
  let e = conSaber(mesa({ activoA: prot('Politica', 60, [{ nombre: 'X', costo: 1, danio: 50 }]), activoB: prot('Cultura', 50) }), 'A', 1);
  const r = jugar(e, { tipo: 'accion', indice: 0 }).estado;
  assert.equal(r.fase, 'fin');
  assert.equal(r.ganador, 'A');
});

test('3 hitos terminan la partida', () => {
  let e = conSaber(mesa({ activoA: prot('Politica', 60, [{ nombre: 'X', costo: 1, danio: 50 }]), activoB: prot('Cultura', 50), reservaB: [prot('Sociedad')] }), 'A', 1);
  e.jugadores.A.hitos = 2;
  const r = jugar(e, { tipo: 'accion', indice: 0 }).estado;
  assert.equal(r.fase, 'fin');
  assert.equal(r.ganador, 'A');
});

test('hitosParaGanar 2 termina con 2', () => {
  let e = conSaber(mesa({ hitosParaGanar: 2, activoA: prot('Politica', 60, [{ nombre: 'X', costo: 1, danio: 50 }]), activoB: prot('Cultura', 50), reservaB: [prot('Sociedad')] }), 'A', 1);
  e.jugadores.A.hitos = 1;
  assert.equal(jugar(e, { tipo: 'accion', indice: 0 }).estado.ganador, 'A');
});

test('el primer jugador no puede usar acción en su primer turno', () => {
  let e = prepararRapido(crearPartida({ mazoA: mazoSimple(), mazoB: mazoSimple(), semilla: 5 }));
  e.jugadores.A.activo.saber = 3;
  assert.ok(!jugadasValidas(e).some(j => j.tipo === 'accion'));
});

test('solo 1 carta aula por turno', () => {
  let e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [aula({ tipo: 'curar', n: 10 }), aula({ tipo: 'curar', n: 10 })] });
  e.jugadores.A.activo.danio = 40;
  e = jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado;
  assert.ok(!jugadasValidas(e).some(j => j.tipo === 'jugar' && j.uid === 'Am1'));
});

test('solo 1 asignarSaber por turno', () => {
  let e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura') });
  e = jugar(e, { tipo: 'asignarSaber', destino: e.jugadores.A.activo.uid }).estado;
  assert.equal(e.jugadores.A.activo.saber, 1);
  assert.ok(!jugadasValidas(e).some(j => j.tipo === 'asignarSaber'));
});

test('acción requiere saber mayor o igual al costo', () => {
  const e = conSaber(mesa({ activoA: prot('Politica', 60, [{ nombre: 'X', costo: 2, danio: 50 }]), activoB: prot('Cultura') }), 'A', 1);
  assert.ok(!jugadasValidas(e).some(j => j.tipo === 'accion'));
});

test('evolucionar conserva daño y saber y exige evolucionaDe del objetivo', () => {
  const base = prot('Sociedad', 60, undefined, { id: 'ALDEA' });
  const evo = prot('Sociedad', 100, undefined, { id: 'CIUDAD', evolucionaDe: 'ALDEA' });
  const otra = prot('Sociedad', 100, undefined, { id: 'OTRA', evolucionaDe: 'NADA' });
  let e = mesa({ activoA: base, activoB: prot('Cultura'), manoA: [evo, otra] });
  e.jugadores.A.activo.danio = 20; e.jugadores.A.activo.saber = 2;
  const obj = e.jugadores.A.activo.uid;
  const js = jugadasValidas(e);
  assert.ok(js.some(j => j.tipo === 'evolucionar' && j.uid === 'Am0' && j.objetivo === obj));
  assert.ok(!js.some(j => j.tipo === 'evolucionar' && j.uid === 'Am1'));
  const r = jugar(e, { tipo: 'evolucionar', uid: 'Am0', objetivo: obj }).estado;
  assert.equal(r.jugadores.A.activo.carta.id, 'CIUDAD');
  assert.equal(r.jugadores.A.activo.danio, 20);
  assert.equal(r.jugadores.A.activo.saber, 2);
});

test('no se evoluciona en el turno de entrada', () => {
  const base = prot('Sociedad', 60, undefined, { id: 'ALDEA2' });
  const evo = prot('Sociedad', 100, undefined, { id: 'CIUDAD2', evolucionaDe: 'ALDEA2' });
  let e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [base, evo] });
  e = jugar(e, { tipo: 'bajar', uid: 'Am0' }).estado;
  assert.ok(!jugadasValidas(e).some(j => j.tipo === 'evolucionar'));
});

test('las cartas Etapa 2 no se pueden bajar directamente', () => {
  const evo = prot('Sociedad', 100, undefined, { id: 'CIUDAD3', evolucionaDe: 'X' });
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [evo] });
  assert.ok(!jugadasValidas(e).some(j => j.tipo === 'bajar'));
});

test('la reserva admite como máximo 3', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), reservaA: [prot('Politica'), prot('Politica'), prot('Politica')], manoA: [prot('Cultura')] });
  assert.ok(!jugadasValidas(e).some(j => j.tipo === 'bajar'));
});

test('retirar exige saber mayor o igual a retirada y reserva no vacía', () => {
  let e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura') });
  e.jugadores.A.activo.saber = 1;
  assert.ok(!jugadasValidas(e).some(j => j.tipo === 'retirar'));
  e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), reservaA: [prot('Sociedad')] });
  assert.ok(!jugadasValidas(e).some(j => j.tipo === 'retirar'));
  e.jugadores.A.activo.saber = 1;
  const rem = e.jugadores.A.reserva[0].uid, viejo = e.jugadores.A.activo.uid;
  const r = jugar(e, { tipo: 'retirar', reemplazo: rem }).estado;
  assert.equal(r.jugadores.A.activo.uid, rem);
  assert.equal(r.jugadores.A.reserva[0].uid, viejo);
  assert.equal(r.jugadores.A.reserva[0].saber, 0);
});

test('pasar cambia de turno, roba 1 y da saber pendiente', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura') });
  const manoB = e.jugadores.B.mano.length;
  const r = jugar(e, { tipo: 'pasar' }).estado;
  assert.equal(r.turno, 'B');
  assert.equal(r.numeroTurno, 4);
  assert.equal(r.jugadores.B.mano.length, manoB + 1);
  assert.equal(r.jugadores.B.saberPendiente, 1);
});

test('mazo vacío: no roba y la partida continúa', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura') });
  e.jugadores.B.mazo = [];
  const manoB = e.jugadores.B.mano.length;
  const r = jugar(e, { tipo: 'pasar' }).estado;
  assert.equal(r.fase, 'turno');
  assert.equal(r.jugadores.B.mano.length, manoB);
});

test('JSON.parse(JSON.stringify(estado)) sigue siendo jugable', () => {
  let e = prepararRapido(crearPartida({ mazoA: mazoSimple(), mazoB: mazoSimple(), semilla: 11 }));
  for (let i = 0; i < 30 && e.fase !== 'fin'; i++) {
    e = JSON.parse(JSON.stringify(e));
    const js = jugadasValidas(e);
    e = aplicarJugada(e, js.find(j => j.tipo === 'accion') || js.find(j => j.tipo === 'asignarSaber') || js.find(j => j.tipo === 'promover') || js.find(j => j.tipo === 'pasar')).estado;
  }
  assert.ok(e.jugadores.A.hitos + e.jugadores.B.hitos > 0);
});
