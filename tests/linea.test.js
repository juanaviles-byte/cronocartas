import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearPartida, jugadasValidas, aplicarJugada } from '../js/motor.js';
import { prot, acont, mazoSimple, mesa, jugar } from './ayudas.js';

const conFecha = (anio, extra = {}) => acont({ tipo: 'robar', n: 1 }, { fecha: { anio, texto: String(anio) }, ...extra });
const conLinea = (opciones, linea = []) => {
  const e = mesa(opciones);
  e.lineaTiempo = true;
  e.jugadores.A.linea = linea.map(anio => ({ id: `T${anio}`, nombre: `Hecho ${anio}`, anio, texto: String(anio) }));
  e.jugadores.A.saberPendiente = 0;
  return e;
};

test('crearPartida con lineaTiempo deja la regla activa y líneas vacías', () => {
  const e = crearPartida({ mazoA: mazoSimple(), mazoB: mazoSimple(), semilla: 1, lineaTiempo: true });
  assert.equal(e.lineaTiempo, true);
  assert.deepEqual(e.jugadores.A.linea, []);
  assert.equal(e.jugadores.B.porUbicar, null);
});

test('la primera carta con fecha entra sola a la línea, sin pregunta ni premio', () => {
  const e = conLinea({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [conFecha(1810)] });
  const r = jugar(e, { tipo: 'jugar', uid: 'Am0' });
  assert.deepEqual(r.estado.jugadores.A.linea.map(x => x.anio), [1810]);
  assert.equal(r.estado.jugadores.A.porUbicar, null);
  assert.equal(r.estado.jugadores.A.activo.saber, 0);
  assert.ok(r.eventos.some(x => x.tipo === 'linea' && x.automatico));
});

test('desde la segunda carta con fecha solo se puede ubicar, con una opción por hueco', () => {
  const e = conLinea({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [conFecha(1817), prot('Sociedad')] }, [1810, 1833]);
  const r = jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado;
  assert.equal(r.jugadores.A.porUbicar.anio, 1817);
  const js = jugadasValidas(r);
  assert.deepEqual(js, [0, 1, 2].map(posicion => ({ tipo: 'ubicar', posicion })));
});

test('ubicar bien da +1 Saber al activo y deja la línea en orden', () => {
  const e = conLinea({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [conFecha(1817)] }, [1810, 1833]);
  const r = jugar(jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado, { tipo: 'ubicar', posicion: 1 });
  assert.deepEqual(r.estado.jugadores.A.linea.map(x => x.anio), [1810, 1817, 1833]);
  assert.equal(r.estado.jugadores.A.activo.saber, 1);
  assert.equal(r.estado.jugadores.A.porUbicar, null);
  const ev = r.eventos.find(x => x.tipo === 'ubicar');
  assert.equal(ev.correcto, true);
  assert.equal(r.estado.jugadores.A.aciertos, 1);
});

test('ubicar mal no premia, pero la carta queda en su lugar correcto', () => {
  const e = conLinea({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [conFecha(1900)] }, [1810, 1833]);
  const r = jugar(jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado, { tipo: 'ubicar', posicion: 0 });
  assert.deepEqual(r.estado.jugadores.A.linea.map(x => x.anio), [1810, 1833, 1900]);
  assert.equal(r.estado.jugadores.A.activo.saber, 0);
  const ev = r.eventos.find(x => x.tipo === 'ubicar');
  assert.equal(ev.correcto, false);
  assert.equal(ev.posicionCorrecta, 2);
});

test('un año igual a otro de la línea es correcto a cualquiera de sus lados', () => {
  for (const posicion of [0, 1]) {
    const e = conLinea({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [conFecha(1541)] }, [1541]);
    const r = jugar(jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado, { tipo: 'ubicar', posicion });
    assert.equal(r.eventos.find(x => x.tipo === 'ubicar').correcto, true, `posición ${posicion}`);
  }
});

test('sin la regla, o con cartas sin fecha, no hay línea de tiempo', () => {
  const e1 = mesa({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [conFecha(1810)] });
  const r1 = jugar(e1, { tipo: 'jugar', uid: 'Am0' }).estado;
  assert.ok(!(r1.jugadores.A.linea || []).length);
  const e2 = conLinea({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [acont({ tipo: 'robar', n: 1 })] }, [1810]);
  assert.equal(jugar(e2, { tipo: 'jugar', uid: 'Am0' }).estado.jugadores.A.porUbicar, null);
});

test('la carta ubicada igual va al descarte (las conexiones siguen funcionando)', () => {
  const e = conLinea({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [conFecha(1817, { id: 'X1' })] }, [1810]);
  const r = jugar(jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado, { tipo: 'ubicar', posicion: 1 }).estado;
  assert.ok(r.jugadores.A.descarte.some(c => c.carta.id === 'X1'));
});
