import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearAlmacen } from '../js/almacen.js';
import { PRESUPUESTO, puntosPoder, validarPropuesta } from '../js/balance.js';
import { exportarCartas, importarCartas } from '../js/compartir.js';

function memoria() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
}
const propuesta = (extra = {}) => ({
  id: 'X1', nombre: 'Navegante', tipo: 'protagonista', curso: 5, unidad: 1, dimension: 'Territorio',
  resistencia: 80, retirada: 1, acciones: [{ nombre: 'Ruta nueva', costo: 2, danio: 60 }],
  dato: 'Magallanes cruzó el estrecho que hoy lleva su nombre en 1520.', fuente: 'Clase de Historia',
  autor: 'Sofía', emblema: 'barco', ...extra,
});

test('guardar devuelve error cuota cuando setItem lanza QuotaExceededError', () => {
  const s = memoria();
  s.setItem = () => { const e = new Error('lleno'); e.name = 'QuotaExceededError'; throw e; };
  assert.deepEqual(crearAlmacen(s).guardar('cc.banco', [1]), { ok: false, error: 'cuota' });
});

test('storage que lanza en getItem: leer devuelve el valor por defecto', () => {
  const s = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } };
  const a = crearAlmacen(s);
  assert.deepEqual(a.leer('cc.ajustes', { hitos: 3 }), { hitos: 3 });
  assert.deepEqual(a.guardar('x', 1), { ok: false, error: 'bloqueado' });
});

test('sin storage disponible el almacén funciona en memoria', () => {
  const a = crearAlmacen(null);
  a.guardar('k', { v: 1 });
  assert.deepEqual(a.leer('k', null), { v: 1 });
});

test('guardarPropuesta la deja pendiente y listarPropuestas la devuelve', () => {
  const a = crearAlmacen(memoria());
  assert.equal(a.guardarPropuesta(propuesta()).ok, true);
  const l = a.listarPropuestas();
  assert.equal(l.length, 1);
  assert.equal(l[0].estado, 'pendiente');
  assert.equal(a.listarPropuestas({ estado: 'aprobada' }).length, 0);
});

test('aprobar y activar enMazo la hace aparecer en cartasComunidad del curso', () => {
  const a = crearAlmacen(memoria());
  a.guardarPropuesta(propuesta());
  const id = a.listarPropuestas()[0].id;
  a.cambiarEstado(id, 'aprobada');
  assert.equal(a.cartasComunidad(5).length, 0);
  a.activarEnMazo(id, true);
  const c = a.cartasComunidad(5);
  assert.equal(c.length, 1);
  assert.equal(c[0].nombre, 'Navegante');
  assert.equal(c[0].comunidad, true);
  assert.equal(a.cartasComunidad(6).length, 0);
});

test('devolver con comentario guarda el comentario', () => {
  const a = crearAlmacen(memoria());
  a.guardarPropuesta(propuesta());
  const id = a.listarPropuestas()[0].id;
  a.cambiarEstado(id, 'devuelta', 'Revisa el año');
  assert.equal(a.listarPropuestas()[0].comentario, 'Revisa el año');
});

test('puntosPoder suma resistencia/10 y daño/10 menos costo', () => {
  assert.equal(puntosPoder({ resistencia: 80, acciones: [{ costo: 2, danio: 60 }] }), 12);
  assert.equal(PRESUPUESTO, 14);
});

test('propuesta válida no tiene errores', () => {
  assert.deepEqual(validarPropuesta(propuesta()), []);
});

test('propuesta sin dato es inválida', () => {
  assert.ok(validarPropuesta(propuesta({ dato: '' })).length > 0);
});

test('propuesta sin fuente es inválida', () => {
  assert.ok(validarPropuesta(propuesta({ fuente: '' })).length > 0);
});

test('propuesta que excede el presupuesto es inválida', () => {
  assert.ok(validarPropuesta(propuesta({ resistencia: 120, acciones: [{ nombre: 'X', costo: 1, danio: 90 }] })).length > 0);
});

test('propuesta fuera de rango de resistencia o costo es inválida', () => {
  assert.ok(validarPropuesta(propuesta({ resistencia: 40 })).length > 0);
  assert.ok(validarPropuesta(propuesta({ acciones: [{ nombre: 'X', costo: 4, danio: 10 }] })).length > 0);
});

test('export e import ida y vuelta conserva tildes y ñ', () => {
  const c = [propuesta({ nombre: 'Señora de la Pampa', dato: 'Año de la ñ: niñez, España, ¿qué?' })];
  const texto = exportarCartas(c);
  assert.ok(texto.startsWith('CC1:'));
  const r = importarCartas(texto);
  assert.deepEqual(r.errores, []);
  assert.equal(r.cartas[0].nombre, 'Señora de la Pampa');
  assert.equal(r.cartas[0].dato, c[0].dato);
});

test('importar texto basura devuelve errores sin lanzar', () => {
  for (const t of ['basura', 'CC1:%%%', 'CC1:' + Buffer.from('{"a":1}').toString('base64'), '', null]) {
    const r = importarCartas(t);
    assert.equal(r.cartas.length, 0);
    assert.ok(r.errores.length > 0);
  }
});

test('importar descarta cartas inválidas y conserva las válidas', () => {
  const texto = exportarCartas([propuesta(), { nombre: 'rota' }]);
  const r = importarCartas(texto);
  assert.equal(r.cartas.length, 1);
  assert.equal(r.errores.length, 1);
});
