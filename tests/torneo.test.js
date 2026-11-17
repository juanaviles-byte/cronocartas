import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearTorneo, partidasPendientes, anotarGanador, campeon } from '../js/torneo.js';
import { crearRng } from '../js/rng.js';

const nombres = n => Array.from({ length: n }, (_, i) => `J${i + 1}`);

test('una llave de 4 tiene 2 rondas y 2 partidas pendientes al inicio', () => {
  const t = crearTorneo({ participantes: nombres(4), curso: 7, rng: crearRng(1) });
  assert.equal(t.rondas.length, 2);
  assert.equal(partidasPendientes(t).length, 2);
  assert.deepEqual(t.rondas[0].flatMap(p => [p.a, p.b]).sort(), nombres(4).sort());
});

test('con 5 participantes, 3 pasan directo a la segunda ronda', () => {
  const t = crearTorneo({ participantes: nombres(5), curso: 7, rng: crearRng(2) });
  assert.equal(t.rondas.length, 3);
  const r1 = t.rondas[0];
  assert.equal(r1.filter(p => p.a && p.b).length, 1, 'una sola partida real en la primera ronda');
  assert.equal(r1.filter(p => p.directo).length, 3);
  // La partida real de la primera ronda y la de dos que pasaron directo (ya pueden jugar).
  assert.equal(partidasPendientes(t).length, 2);
});

test('anotar ganadores avanza la llave hasta el campeón', () => {
  let t = crearTorneo({ participantes: nombres(6), curso: 7, rng: crearRng(3) });
  let vueltas = 0;
  while (!campeon(t) && vueltas++ < 20) {
    const p = partidasPendientes(t)[0];
    t = anotarGanador(t, p.id, p.a);
  }
  assert.ok(nombres(6).includes(campeon(t)));
  assert.equal(partidasPendientes(t).length, 0);
});

test('no se puede anotar a quien no juega esa partida', () => {
  const t = crearTorneo({ participantes: nombres(4), curso: 7, rng: crearRng(4) });
  const p = partidasPendientes(t)[0];
  assert.throws(() => anotarGanador(t, p.id, 'Intruso'));
});

test('exige entre 2 y 32 participantes con nombres distintos', () => {
  assert.throws(() => crearTorneo({ participantes: ['Solo'], curso: 7, rng: crearRng(1) }));
  assert.throws(() => crearTorneo({ participantes: ['Ana', 'Ana'], curso: 7, rng: crearRng(1) }));
  assert.throws(() => crearTorneo({ participantes: nombres(33), curso: 7, rng: crearRng(1) }));
});
