import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { crearPartida, desgloseDanio, danioDeAccion, VENTAJA } from '../js/motor.js';

const d = [5, 6, 7, 8].flatMap(c => JSON.parse(readFileSync(`data/mazo-${c}.json`, 'utf8')).cartas);
const P = d.filter(c => c.tipo === 'protagonista' && !c.evolucionaDe && !c.habilidad);
const lugares = d.filter(c => c.tipo === 'lugar');
const tableros = JSON.parse(readFileSync('data/tableros.json', 'utf8')).tableros;
const clon = x => JSON.parse(JSON.stringify(x));

function mesa(a, b, extra = {}) {
  const e = clon(crearPartida({ mazoA: P.slice(0, 20), mazoB: P.slice(0, 20), semilla: 1 }));
  e.fase = 'turno'; e.turno = 'A';
  e.jugadores.A.activo = { uid: 'a', carta: a, danio: 0, saber: 9, protegido: false, bonus: extra.bonus || 0, turnoEntrada: 0 };
  e.jugadores.A.reserva = [];
  e.jugadores.B.activo = { uid: 'b', carta: b, danio: 0, saber: 0, protegido: false, bonus: 0, turnoEntrada: 0 };
  e.lugar = extra.lugar ? { uid: 'l', carta: extra.lugar, duenio: 'A' } : null;
  e.tablero = extra.tablero ? { id: extra.tablero.id, regla: extra.tablero.regla } : null;
  return e;
}

test('el desglose parte del daño impreso, explica cada cambio y suma lo que aplica el motor', () => {
  let casos = 0;
  for (const a of P.slice(0, 12)) for (const b of P.slice(0, 12)) for (const t of [null, ...tableros]) for (const l of [null, ...lugares.slice(0, 4)]) {
    const e = mesa(a, b, { tablero: t, lugar: l, bonus: casos % 3 === 0 ? 20 : 0 });
    const dsg = desgloseDanio(e, 'A', 0);
    assert.equal(dsg.base, a.acciones[0].danio);
    assert.equal(dsg.total, danioDeAccion(e, 'A', 0));
    let x = dsg.base;
    for (const p of dsg.pasos) x = p.por ? x * p.por : Math.max(0, x + p.valor);
    assert.equal(x, dsg.total, `${a.nombre} vs ${b.nombre}: los pasos no suman`);
    casos++;
  }
  assert.ok(casos > 1000);
});

test('el caso de la captura: Castillo feudal reduce 10 y se explica', () => {
  const a = P.find(c => c.acciones[0].danio === 40);
  const b = P.find(c => VENTAJA[a.dimension] !== c.dimension && VENTAJA[c.dimension] !== a.dimension);
  const castillo = tableros.find(t => t.regla.tipo === 'reduccionDanio');
  const dsg = desgloseDanio(mesa(a, b, { tablero: castillo }), 'A', 0);
  assert.equal(dsg.base, 40);
  assert.equal(dsg.total, 30);
  assert.deepEqual(dsg.pasos.map(p => [p.fuente, p.valor]), [['tablero', -10]]);
});
