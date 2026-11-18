import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { crearPartida, jugadasValidas, aplicarJugada } from '../js/motor.js';
import { planDeEscena } from '../js/ui/director.js';

const d7 = JSON.parse(readFileSync('data/mazo-7.json', 'utf8')).cartas;
const P = d7.filter(c => c.tipo === 'protagonista' && !c.evolucionaDe);
const personaje = d7.find(c => c.tipo === 'personaje');
const lugar = d7.find(c => c.tipo === 'lugar');

function enJuego() {
  let e = crearPartida({ mazoA: P.slice(0, 20), mazoB: P.slice(1, 21), semilla: 3 });
  while (e.fase === 'preparacion') {
    const js = jugadasValidas(e); const yo = e.jugadores[e.turno];
    e = aplicarJugada(e, js.find(x => x.tipo === 'colocar' && !yo.activo) || js.find(x => x.tipo === 'listo')).estado;
  }
  e.jugadores.A.activo.saber = 5; e.turno = 'A'; e.numeroTurno = 3;
  return e;
}

test('un ataque genera la escena de ataque con daño, vida antes y después', () => {
  const e = enJuego();
  const def = e.jugadores.B.activo;
  const r = aplicarJugada(e, { tipo: 'accion', indice: 0 });
  const p = planDeEscena(e, { tipo: 'accion', indice: 0 }, r.eventos);
  const dan = r.eventos.find(x => x.tipo === 'danio');
  assert.equal(p.tipo, 'ataque');
  assert.equal(p.jugador, 'A');
  assert.equal(p.valor, dan.valor);
  assert.equal(p.vidaAntes, def.carta.resistencia - def.danio);
  assert.equal(p.vidaDespues, Math.max(0, p.vidaAntes - dan.valor));
  assert.equal(p.cae, false);
});

test('si el golpe derrota al defensor, la escena lo sabe', () => {
  const e = enJuego();
  e.jugadores.B.activo.danio = e.jugadores.B.activo.carta.resistencia - 1;
  const r = aplicarJugada(e, { tipo: 'accion', indice: 0 });
  assert.equal(planDeEscena(e, { tipo: 'accion', indice: 0 }, r.eventos).cae, true);
});

test('bajar un Protagonista o jugar un Personaje o un Lugar genera una invocación con su destino', () => {
  const e = enJuego();
  const yo = e.jugadores.A;
  yo.mano.push({ uid: 'p1', carta: P[5] }, { uid: 'per', carta: personaje }, { uid: 'lug', carta: lugar });
  const bajar = planDeEscena(e, { tipo: 'bajar', uid: 'p1' }, []);
  assert.deepEqual([bajar.tipo, bajar.destino, bajar.uid, bajar.carta.id], ['invocacion', 'reserva', 'p1', P[5].id]);
  assert.equal(planDeEscena(e, { tipo: 'jugar', uid: 'per' }, []).destino, 'efecto');
  assert.equal(planDeEscena(e, { tipo: 'jugar', uid: 'lug' }, []).destino, 'lugar');
});

test('en la preparación la invocación es breve, y pasar o dar Saber no tienen escena', () => {
  const e = crearPartida({ mazoA: P.slice(0, 20), mazoB: P.slice(1, 21), semilla: 3 });
  const uid = e.jugadores.A.mano.find(c => c.carta.tipo === 'protagonista').uid;
  const p = planDeEscena(e, { tipo: 'colocar', uid }, []);
  assert.equal(p.destino, 'activo');
  assert.equal(p.breve, true);
  assert.equal(planDeEscena(enJuego(), { tipo: 'pasar' }, []), null);
  assert.equal(planDeEscena(enJuego(), { tipo: 'saber', destino: 'x' }, []), null);
});
