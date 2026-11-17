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

test('buscarProtagonista toma el protagonista elegido entre las 3 primeras cartas del mazo', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [aula({ tipo: 'buscarProtagonista', n: 3 })] });
  const P = prot('Territorio', 70, undefined, { id: 'BUSCADO' });
  e.jugadores.A.mazo = [{ uid: 'q1', carta: acont({ tipo: 'robar', n: 1 }) }, { uid: 'q2', carta: P }, { uid: 'q3', carta: acont({ tipo: 'robar', n: 1 }) }, { uid: 'q4', carta: prot('Politica') }];
  const r = jugar(e, { tipo: 'jugar', uid: 'Am0', eleccion: 'q2' }).estado;
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

test('el motor funciona sin structuredClone (Chrome antiguo)', async () => {
  const original = globalThis.structuredClone;
  globalThis.structuredClone = undefined;
  try {
    const e = crearPartida({ mazoA: mazoSimple(), mazoB: mazoSimple(), semilla: 4 });
    assert.doesNotThrow(() => aplicarJugada(e, jugadasValidas(e)[0]));
  } finally { globalThis.structuredClone = original; }
});

// ---- v1.1: búsqueda visible con elección ----
function mesaBusqueda(mazo) {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [aula({ tipo: 'buscarProtagonista', n: 3 })] });
  e.jugadores.A.mazo = mazo.map((c, i) => ({ uid: `q${i}`, carta: c }));
  return e;
}

test('buscarProtagonista ofrece una jugada por cada Protagonista entre las 3 primeras', () => {
  const e = mesaBusqueda([acont({ tipo: 'robar', n: 1 }), prot('Sociedad'), prot('Cultura'), prot('Territorio')]);
  const js = jugadasValidas(e).filter(j => j.tipo === 'jugar');
  assert.deepEqual(js.map(j => j.eleccion), ['q1', 'q2']);
});

test('elegir el segundo Protagonista lo lleva a la mano y el resto va al fondo en orden', () => {
  const P1 = prot('Sociedad', 60, undefined, { id: 'P-UNO' }), P2 = prot('Cultura', 60, undefined, { id: 'P-DOS' });
  const e = mesaBusqueda([acont({ tipo: 'robar', n: 1 }, { id: 'E-0' }), P1, P2, prot('Territorio', 60, undefined, { id: 'P-RESTO' })]);
  const { estado, eventos } = aplicarJugada(e, { tipo: 'jugar', uid: 'Am0', eleccion: 'q2' });
  assert.ok(estado.jugadores.A.mano.some(c => c.carta.id === 'P-DOS'));
  assert.deepEqual(estado.jugadores.A.mazo.map(c => c.carta.id), ['P-RESTO', 'E-0', 'P-UNO']);
  const rev = eventos.find(ev => ev.tipo === 'revelar');
  assert.equal(rev.cartas.length, 3);
  assert.equal(rev.tomada.id, 'P-DOS');
});

test('sin Protagonistas entre las 3 primeras se ven y vuelven al fondo', () => {
  const e = mesaBusqueda([acont({ tipo: 'robar', n: 1 }, { id: 'E-1' }), acont({ tipo: 'robar', n: 1 }, { id: 'E-2' }), acont({ tipo: 'robar', n: 1 }, { id: 'E-3' }), prot('Politica', 60, undefined, { id: 'P-4' })]);
  const js = jugadasValidas(e).filter(j => j.tipo === 'jugar');
  assert.deepEqual(js, [{ tipo: 'jugar', uid: 'Am0' }]);
  const { estado, eventos } = aplicarJugada(e, js[0]);
  assert.deepEqual(estado.jugadores.A.mazo.map(c => c.carta.id), ['P-4', 'E-1', 'E-2', 'E-3']);
  assert.equal(eventos.find(ev => ev.tipo === 'revelar').tomada, null);
});

test('búsqueda con solo 2 cartas en el mazo no se bloquea', () => {
  const e = mesaBusqueda([prot('Sociedad', 60, undefined, { id: 'P-A' }), acont({ tipo: 'robar', n: 1 })]);
  const r = aplicarJugada(e, { tipo: 'jugar', uid: 'Am0', eleccion: 'q0' }).estado;
  assert.ok(r.jugadores.A.mano.some(c => c.carta.id === 'P-A'));
  assert.equal(r.jugadores.A.mazo.length, 1);
});

test('una elección que no está entre las 3 primeras es inválida', () => {
  const e = mesaBusqueda([acont({ tipo: 'robar', n: 1 }), acont({ tipo: 'robar', n: 1 }), acont({ tipo: 'robar', n: 1 }), prot('Sociedad')]);
  assert.throws(() => aplicarJugada(e, { tipo: 'jugar', uid: 'Am0', eleccion: 'q3' }), /jugada inválida/);
});

// ---- Personajes ----
const personaje = (efecto, extra = {}) => ({ id: extra.id || `PJ${Math.random().toString(36).slice(2, 7)}`, nombre: 'Personaje', tipo: 'personaje', curso: 5, unidad: 1, efecto, dato: 'Dato.', oa: 'OA 1', emblema: 'medalla', ...extra });

test('solo se puede jugar 1 Personaje por turno', () => {
  let e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [personaje({ tipo: 'robar', n: 1 }), personaje({ tipo: 'robar', n: 1 })] });
  e = jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado;
  assert.ok(!jugadasValidas(e).some(j => j.tipo === 'jugar' && j.uid === 'Am1'));
  e = jugar(jugar(e, { tipo: 'pasar' }).estado, { tipo: 'pasar' }).estado;
  assert.ok(jugadasValidas(e).some(j => j.tipo === 'jugar' && j.uid === 'Am1'));
});

test('buscar un Lugar ofrece solo los Lugares entre las primeras 5', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [personaje({ tipo: 'buscar', n: 5, cartaTipo: 'lugar' })] });
  const L = lugar({ tipo: 'bonusDimension', dimension: 'Politica', n: 10 });
  e.jugadores.A.mazo = [prot('Sociedad'), acont({ tipo: 'robar', n: 1 }), prot('Cultura'), L, prot('Politica'), lugar({ tipo: 'bonusDimension', dimension: 'Cultura', n: 10 })]
    .map((c, i) => ({ uid: `q${i}`, carta: c }));
  assert.deepEqual(jugadasValidas(e).filter(j => j.tipo === 'jugar').map(j => j.eleccion), ['q3']);
  const r = jugar(e, { tipo: 'jugar', uid: 'Am0', eleccion: 'q3' }).estado;
  assert.ok(r.jugadores.A.mano.some(c => c.carta.id === L.id));
});

test('buscar cualquier carta permite elegir cualquiera de las primeras', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [personaje({ tipo: 'buscar', n: 5, cartaTipo: 'cualquiera' })] });
  e.jugadores.A.mazo = [acont({ tipo: 'robar', n: 1 }), prot('Cultura')].map((c, i) => ({ uid: `q${i}`, carta: c }));
  assert.deepEqual(jugadasValidas(e).filter(j => j.tipo === 'jugar').map(j => j.eleccion), ['q0', 'q1']);
});

test('retiroGratis cambia el activo por el elegido sin gastar Saber', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), reservaA: [prot('Sociedad'), prot('Territorio')], manoA: [personaje({ tipo: 'retiroGratis' })] });
  e.jugadores.A.activo.saber = 2;
  const destino = e.jugadores.A.reserva[1].uid, viejo = e.jugadores.A.activo.uid;
  assert.equal(jugadasValidas(e).filter(j => j.tipo === 'jugar').length, 2);
  const r = jugar(e, { tipo: 'jugar', uid: 'Am0', eleccion: destino }).estado;
  assert.equal(r.jugadores.A.activo.uid, destino);
  assert.ok(r.jugadores.A.reserva.some(x => x.uid === viejo && x.saber === 2));
});

test('retiroGratis sin reserva no se puede jugar', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [personaje({ tipo: 'retiroGratis' })] });
  assert.ok(!jugadasValidas(e).some(j => j.tipo === 'jugar'));
});

test('saberExtra suma Saber al activo', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [personaje({ tipo: 'saberExtra', n: 1 })] });
  assert.equal(jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado.jugadores.A.activo.saber, 1);
});

test('curarTodos cura al activo y a la reserva', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), reservaA: [prot('Sociedad')], manoA: [personaje({ tipo: 'curarTodos', n: 20 })] });
  e.jugadores.A.activo.danio = 30; e.jugadores.A.reserva[0].danio = 10;
  const r = jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado;
  assert.equal(r.jugadores.A.activo.danio, 10);
  assert.equal(r.jugadores.A.reserva[0].danio, 0);
});

test('moverSaberTodo pasa todo el Saber del de la reserva que más tiene', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), reservaA: [prot('Sociedad'), prot('Cultura')], manoA: [personaje({ tipo: 'moverSaberTodo' })] });
  e.jugadores.A.reserva[0].saber = 1; e.jugadores.A.reserva[1].saber = 3;
  const r = jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado;
  assert.equal(r.jugadores.A.activo.saber, 3);
  assert.equal(r.jugadores.A.reserva[1].saber, 0);
});

test('bonusDanio con dimensión solo se juega si el activo es de esa dimensión', () => {
  const pj = personaje({ tipo: 'bonusDanio', n: 40, dimension: 'Politica' });
  const si = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [pj] });
  const no = mesa({ activoA: prot('Economia'), activoB: prot('Cultura'), manoA: [pj] });
  assert.ok(jugadasValidas(si).some(j => j.tipo === 'jugar'));
  assert.ok(!jugadasValidas(no).some(j => j.tipo === 'jugar'));
});

test('un efecto doble aplica ambos efectos y exige que los dos sirvan', () => {
  const pj = personaje([{ tipo: 'anularLugar' }, { tipo: 'robar', n: 1 }]);
  const sinLugar = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [pj] });
  assert.ok(!jugadasValidas(sinLugar).some(j => j.tipo === 'jugar'));
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [pj], lugarEnJuego: lugar({ tipo: 'bonusDimension', dimension: 'Cultura', n: 10 }) });
  const r = jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado;
  assert.equal(r.lugar, null);
  assert.equal(r.jugadores.A.mano.length, 1);
});

// ---- Ola 1: reglas de tablero ----
function conTablero(regla, opciones) {
  const e = mesa(opciones);
  e.tablero = { id: 'T-x', regla };
  return e;
}

test('crearPartida guarda el tablero', () => {
  const e = crearPartida({ mazoA: mazoSimple(), mazoB: mazoSimple(), semilla: 1, tablero: { id: 'T-7-3', regla: { tipo: 'reduccionDanio', n: 10 } } });
  assert.equal(e.tablero.id, 'T-7-3');
});

test('tablero bonusDimension suma a la dimensión indicada', () => {
  const e = conTablero({ tipo: 'bonusDimension', dimension: 'Politica', n: 10 }, { activoA: prot('Politica', 60, [{ nombre: 'X', costo: 1, danio: 20 }]), activoB: prot('Cultura', 200) });
  e.jugadores.A.activo.saber = 1;
  assert.equal(jugar(e, { tipo: 'accion', indice: 0 }).estado.jugadores.B.activo.danio, 30);
});

test('tablero reduccionDanio resta daño sin bajar de 0', () => {
  const e = conTablero({ tipo: 'reduccionDanio', n: 10 }, { activoA: prot('Politica', 60, [{ nombre: 'X', costo: 1, danio: 30 }, { nombre: 'Y', costo: 1, danio: 0 }]), activoB: prot('Cultura', 200) });
  e.jugadores.A.activo.saber = 1;
  assert.equal(jugar(e, { tipo: 'accion', indice: 0 }).estado.jugadores.B.activo.danio, 20);
  assert.equal(jugar(e, { tipo: 'accion', indice: 1 }).estado.jugadores.B.activo.danio, 0);
});

test('tablero retiroGratis permite retirarse sin Saber y no lo gasta', () => {
  const e = conTablero({ tipo: 'retiroGratis' }, { activoA: prot('Politica'), activoB: prot('Cultura'), reservaA: [prot('Sociedad')] });
  const j = jugadasValidas(e).find(x => x.tipo === 'retirar');
  assert.ok(j);
  const r = jugar(e, j).estado;
  assert.equal(r.jugadores.A.reserva[0].saber, 0);
});

test('tablero personajeRoba: jugar un Personaje roba 1 carta extra', () => {
  const pj = { id: 'PJ1', nombre: 'P', tipo: 'personaje', efecto: { tipo: 'saberExtra', n: 1 }, dato: 'x', emblema: 'medalla' };
  const e = conTablero({ tipo: 'personajeRoba', n: 1 }, { activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [pj] });
  assert.equal(jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado.jugadores.A.mano.length, 1);
});

test('tablero saberPorHito: ganar un Hito da +1 Saber al activo', () => {
  const e = conTablero({ tipo: 'saberPorHito', n: 1 }, { activoA: prot('Politica', 60, [{ nombre: 'X', costo: 1, danio: 50 }]), activoB: prot('Cultura', 50), reservaB: [prot('Sociedad')] });
  e.jugadores.A.activo.saber = 1;
  assert.equal(jugar(e, { tipo: 'accion', indice: 0 }).estado.jugadores.A.activo.saber, 2);
});

test('tablero aulaDoble permite 2 cartas Aula por turno, no 3', () => {
  let e = conTablero({ tipo: 'aulaDoble' }, { activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [aula({ tipo: 'robar', n: 1 }), aula({ tipo: 'robar', n: 1 }), aula({ tipo: 'robar', n: 1 })] });
  e = jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado;
  assert.ok(jugadasValidas(e).some(j => j.tipo === 'jugar' && j.uid === 'Am1'));
  e = jugar(e, { tipo: 'jugar', uid: 'Am1' }).estado;
  assert.ok(!jugadasValidas(e).some(j => j.tipo === 'jugar' && j.uid === 'Am2'));
});

test('tablero curarInicioTurno cura al activo al empezar su turno', () => {
  const e = conTablero({ tipo: 'curarInicioTurno', n: 10 }, { activoA: prot('Politica'), activoB: prot('Cultura') });
  e.jugadores.B.activo.danio = 30;
  assert.equal(jugar(e, { tipo: 'pasar' }).estado.jugadores.B.activo.danio, 20);
});

// ---- Ola 2: conexiones y habilidades ----
test('conexión: bajar una carta cuya causa está en tu descarte da +1 Saber al activo', () => {
  const causa = acont({ tipo: 'robar', n: 1 }, { id: 'IMPRENTA' });
  const efecto = prot('Sociedad', 60, undefined, { id: 'LUTERO', conexiones: [{ causa: 'IMPRENTA', texto: 'La imprenta difundió las 95 tesis.' }] });
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [efecto] });
  e.jugadores.A.descarte = [{ uid: 'd1', carta: causa }];
  const { estado, eventos } = jugar(e, { tipo: 'bajar', uid: 'Am0' });
  assert.equal(estado.jugadores.A.activo.saber, 1);
  const c = eventos.find(x => x.tipo === 'conexion');
  assert.equal(c.causa.id, 'IMPRENTA');
  assert.equal(c.efecto.id, 'LUTERO');
  assert.match(c.texto, /95 tesis/);
});

test('conexión: la causa puede estar en tu mesa o ser el Lugar en juego', () => {
  const efecto = acont({ tipo: 'robar', n: 1 }, { id: 'E-MERC', conexiones: [{ causa: 'L-MED', texto: 'x' }, { causa: 'P-X', texto: 'y' }] });
  const L = lugar({ tipo: 'bonusDimension', dimension: 'Economia', n: 10 }); L.id = 'L-MED';
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [efecto], lugarEnJuego: L });
  assert.equal(jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado.jugadores.A.activo.saber, 1);
  const e2 = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), reservaA: [prot('Sociedad', 60, undefined, { id: 'P-X' })], manoA: [efecto] });
  assert.equal(jugar(e2, { tipo: 'jugar', uid: 'Am0' }).estado.jugadores.A.activo.saber, 1);
});

test('conexión: sin la causa no hay bonus, y varias causas dan un solo bonus', () => {
  const efecto = acont({ tipo: 'robar', n: 1 }, { conexiones: [{ causa: 'NO-ESTA', texto: 'x' }] });
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [efecto] });
  const r = jugar(e, { tipo: 'jugar', uid: 'Am0' });
  assert.equal(r.estado.jugadores.A.activo.saber, 0);
  assert.ok(!r.eventos.some(x => x.tipo === 'conexion'));
  const doble = acont({ tipo: 'robar', n: 1 }, { conexiones: [{ causa: 'C1', texto: 'a' }, { causa: 'C2', texto: 'b' }] });
  const e2 = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [doble] });
  e2.jugadores.A.descarte = [{ uid: 'x1', carta: acont({ tipo: 'robar', n: 1 }, { id: 'C1' }) }, { uid: 'x2', carta: acont({ tipo: 'robar', n: 1 }, { id: 'C2' }) }];
  assert.equal(jugar(e2, { tipo: 'jugar', uid: 'Am0' }).estado.jugadores.A.activo.saber, 1);
});

test('conexión al evolucionar: la causa en el descarte cuenta', () => {
  const base = prot('Sociedad', 60, undefined, { id: 'BASE' });
  const evo = prot('Politica', 100, undefined, { id: 'EVO', evolucionaDe: 'BASE', conexiones: [{ causa: 'MONT', texto: 'separación de poderes' }] });
  const e = mesa({ activoA: base, activoB: prot('Cultura'), manoA: [evo] });
  e.jugadores.A.descarte = [{ uid: 'm', carta: acont({ tipo: 'robar', n: 1 }, { id: 'MONT' }) }];
  const r = jugar(e, { tipo: 'evolucionar', uid: 'Am0', objetivo: e.jugadores.A.activo.uid });
  assert.ok(r.eventos.some(x => x.tipo === 'conexion'));
});

test('habilidad resistente reduce el daño recibido', () => {
  const e = mesa({ activoA: prot('Politica', 60, [{ nombre: 'X', costo: 1, danio: 30 }]), activoB: prot('Cultura', 100, undefined, { habilidad: { nombre: 'Disciplina', tipo: 'resistente', n: 10 } }) });
  e.jugadores.A.activo.saber = 1;
  assert.equal(jugar(e, { tipo: 'accion', indice: 0 }).estado.jugadores.B.activo.danio, 20);
});

test('habilidad fuerzaReserva suma daño por cada Protagonista en la reserva', () => {
  const e = mesa({ activoA: prot('Sociedad', 60, [{ nombre: 'X', costo: 1, danio: 20 }], { habilidad: { nombre: 'Ayni', tipo: 'fuerzaReserva', n: 10 } }),
    activoB: prot('Politica', 200), reservaA: [prot('Cultura'), prot('Cultura')] });
  e.jugadores.A.activo.saber = 1;
  assert.equal(jugar(e, { tipo: 'accion', indice: 0 }).estado.jugadores.B.activo.danio, 40);
});

test('habilidad sanador cura al activo al inicio de su turno', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura', 80, undefined, { habilidad: { nombre: 'Cosechas', tipo: 'sanador', n: 10 } }) });
  e.jugadores.B.activo.danio = 30;
  assert.equal(jugar(e, { tipo: 'pasar' }).estado.jugadores.B.activo.danio, 20);
});

test('habilidad inspirador roba 1 carta al entrar en juego', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [prot('Cultura', 70, undefined, { habilidad: { nombre: 'Preguntar', tipo: 'inspirador' } })] });
  assert.equal(jugar(e, { tipo: 'bajar', uid: 'Am0' }).estado.jugadores.A.mano.length, 1);
});

test('habilidad saberAlEntrar hace que entre con Saber (también al evolucionar)', () => {
  const e = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [prot('Territorio', 80, undefined, { habilidad: { nombre: 'Avanzada', tipo: 'saberAlEntrar', n: 1 } })] });
  assert.equal(jugar(e, { tipo: 'bajar', uid: 'Am0' }).estado.jugadores.A.reserva[0].saber, 1);
});
