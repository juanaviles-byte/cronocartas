import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rangoDeFecha } from '../js/fechas.js';
import { prot, acont, mesa, jugar } from './ayudas.js';

// En la línea de tiempo el estudiante ve el texto de la fecha («siglo XV», «1519–1522», «c. 1500»),
// así que lo correcto se juzga con el rango que ese texto muestra, no con un año exacto escondido.
const r = (texto, anio) => rangoDeFecha({ texto, anio });

test('un año solo es un punto', () => {
  assert.deepEqual(r('1492', 1492), { desde: 1492, hasta: 1492 });
  assert.deepEqual(r('año 800', 800), { desde: 800, hasta: 800 });
  assert.deepEqual(r('776 a.C.', -776), { desde: -776, hasta: -776 });
  assert.deepEqual(r('desde 1541', 1541), { desde: 1541, hasta: 1541 });
});

test('un período cubre sus dos años', () => {
  assert.deepEqual(r('1519–1522', 1520), { desde: 1519, hasta: 1522 });
  assert.deepEqual(r('1643–1715', 1643), { desde: 1643, hasta: 1715 });
});

test('un siglo cubre sus cien años, también antes de Cristo', () => {
  assert.deepEqual(r('siglo XV', 1450), { desde: 1401, hasta: 1500 });
  assert.deepEqual(r('siglo V a.C.', -450), { desde: -500, hasta: -401 });
  assert.deepEqual(r('siglos XI–XII', 1088), { desde: 1001, hasta: 1200 });
  assert.deepEqual(r('siglos XVII–XVIII', 1650), { desde: 1601, hasta: 1800 });
});

test('«c.» y «hacia» dan un margen de 25 años (100 antes de Cristo)', () => {
  assert.deepEqual(r('c. 1500', 1500), { desde: 1475, hasta: 1525 });
  assert.deepEqual(r('hacia 1450', 1450), { desde: 1425, hasta: 1475 });
  assert.deepEqual(r('c. 3200 a.C.', -3200), { desde: -3300, hasta: -3100 });
});

test('una carta puede fijar su rango a mano, y sin texto reconocible se usa el año', () => {
  assert.deepEqual(rangoDeFecha({ anio: 1810, texto: '1810', desde: 1808, hasta: 1812 }), { desde: 1808, hasta: 1812 });
  assert.deepEqual(r('principios de la República', 1830), { desde: 1830, hasta: 1830 });
});

test('todas las fechas de los mazos se leen y su año cae dentro de su rango', () => {
  for (const c of [5, 6, 7, 8]) {
    const m = JSON.parse(readFileSync(`data/mazo-${c}.json`, 'utf8'));
    for (const x of (m.cartas || m).filter(x => x.fecha)) {
      const { desde, hasta } = rangoDeFecha(x.fecha);
      assert.ok(desde <= x.fecha.anio && x.fecha.anio <= hasta, `${x.nombre}: ${x.fecha.texto} → ${desde}..${hasta}`);
      if (!/^\d{1,4}$/.test(x.fecha.texto) && !/^año \d+$/.test(x.fecha.texto) && !/^\d+ a\.C\.$/.test(x.fecha.texto) && !/^desde \d+$/.test(x.fecha.texto))
        assert.ok(hasta > desde, `${x.nombre}: «${x.fecha.texto}» debería ser un rango`);
    }
  }
});

// La jugada «ubicar» con fechas de texto.
const hecho = (texto, anio) => acont({ tipo: 'robar', n: 1 }, { fecha: { anio, texto } });
const conLinea = (opciones, linea) => {
  const e = mesa(opciones);
  e.lineaTiempo = true;
  e.jugadores.A.linea = linea.map(([texto, anio], i) => ({ id: `T${i}`, nombre: texto, anio, texto }));
  e.jugadores.A.saberPendiente = 0;
  return e;
};
const ubicar = (linea, carta, posicion) => {
  const e = conLinea({ activoA: prot('Politica'), activoB: prot('Cultura'), manoA: [carta] }, linea);
  return jugar(jugar(e, { tipo: 'jugar', uid: 'Am0' }).estado, { tipo: 'ubicar', posicion }).eventos.find(x => x.tipo === 'ubicar');
};

test('«siglo XV» después de 1492 es correcto: 1492 también es siglo XV', () => {
  assert.equal(ubicar([['1492', 1492]], hecho('siglo XV', 1450), 1).correcto, true);
  assert.equal(ubicar([['1492', 1492]], hecho('siglo XV', 1450), 0).correcto, true);
});

test('«siglo XVI» antes de 1517 es correcto, pero no antes de 1492', () => {
  assert.equal(ubicar([['1517', 1517]], hecho('siglo XVI', 1542), 0).correcto, true);
  assert.equal(ubicar([['1492', 1492]], hecho('siglo XVI', 1542), 0).correcto, false);
});

test('lo que de verdad está fuera de orden sigue siendo un error', () => {
  assert.equal(ubicar([['siglo V a.C.', -450]], hecho('776 a.C.', -776), 1).correcto, false);
  assert.equal(ubicar([['1810', 1810], ['1833', 1833]], hecho('1900', 1900), 0).correcto, false);
});

test('una línea guardada antes de este cambio (sin rangos) sigue funcionando', () => {
  assert.equal(ubicar([['1810', 1810], ['1833', 1833]], hecho('1817', 1817), 1).correcto, true);
});
