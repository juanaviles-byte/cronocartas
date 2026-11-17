import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { esc, pips } from '../js/html.js';
import { exportarCartas, importarCartas, resumenExportacion } from '../js/compartir.js';
import { validarPropuesta } from '../js/balance.js';

const base = (extra = {}) => ({
  id: 'CC-COM-abc1', nombre: 'Navegante', tipo: 'protagonista', curso: 5, unidad: 1, dimension: 'Territorio',
  resistencia: 80, retirada: 1, acciones: [{ nombre: 'Ruta nueva', costo: 2, danio: 40 }],
  dato: 'Magallanes cruzó el estrecho que hoy lleva su nombre en 1520.', fuente: 'Clase', autor: 'Sofía',
  emblema: 'barco', estado: 'pendiente', ...extra,
});
const ida = c => importarCartas(exportarCartas([c]));

test('esc neutraliza HTML', () => {
  assert.equal(esc('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
  assert.equal(esc(null), '');
});

test('pips limita la cantidad entre 0 y 3', () => {
  assert.equal(pips(-1), '');
  assert.equal((pips(99).match(/pip/g) || []).length, 3);
  assert.equal(pips('x'), '');
});

test('ningún texto de carta se inserta en HTML sin esc()', () => {
  const peligro = /\$\{(?![^}]*esc\()[^}]*\.(nombre|dato|accion|texto|comentario|autor|fuente|message|dominio|nombreDominio|baseNombre)\b[^}]*\}/;
  for (const f of ['js/ui/mesa.js', 'js/ui/banco.js', 'js/ui/docente.js', 'js/ui/app.js', 'js/ui/carta.js', 'js/ui/editor.js', 'js/ui/torneo.js']) {
    const lineas = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').split('\n');
    lineas.forEach((l, i) => assert.ok(!peligro.test(l), `${f}:${i + 1} inserta texto sin esc(): ${l.trim()}`));
  }
});

test('importar descarta campos desconocidos y fija retirada en 1', () => {
  const r = ida(base({ retirada: -1, mbe: { dominio: '<img onerror=x>' }, extra: 'x' }));
  assert.equal(r.cartas.length, 1);
  assert.equal(r.cartas[0].retirada, 1);
  assert.equal(r.cartas[0].mbe, undefined);
  assert.equal(r.cartas[0].extra, undefined);
});

test('importar rechaza efectos con valores fuera del menú', () => {
  const a = base({ tipo: 'acontecimiento', efecto: { tipo: 'curar', n: 'x' } });
  delete a.dimension; delete a.resistencia; delete a.acciones;
  assert.equal(ida(a).cartas.length, 0);
  assert.equal(ida({ ...a, efecto: { tipo: 'bonusDanio', n: 1000 } }).cartas.length, 0);
  assert.equal(ida({ ...a, efecto: { tipo: 'robar', n: 2 } }).cartas.length, 1);
  const l = { ...a, tipo: 'lugar', dimension: 'Cultura', efecto: { tipo: 'bonusDimension', dimension: 'Cultura', n: 500 } };
  assert.equal(ida(l).cartas[0].efecto.n, 10);
});

test('importar solo acepta imágenes JPEG en data URL e ids de comunidad', () => {
  assert.equal(ida(base({ imagen: 'javascript:alert(1)' })).cartas[0].imagen, undefined);
  assert.ok(ida(base({ imagen: 'data:image/jpeg;base64,AAAA' })).cartas[0].imagen);
  assert.match(ida(base({ id: '<b>' })).cartas[0].id, /^CC-COM-[a-z0-9]+$/);
  assert.equal(ida(base({ emblema: 'nada' })).cartas[0].emblema, 'estrella');
});

test('resumenExportacion avisa qué cartas pierden su imagen', () => {
  const grande = base({ nombre: 'Grande', imagen: 'data:image/jpeg;base64,' + 'A'.repeat(70000) });
  const chica = base({ nombre: 'Chica', imagen: 'data:image/jpeg;base64,AAAA' });
  assert.deepEqual(resumenExportacion([grande, chica]).sinImagen, ['Grande']);
});

test('el daño de una acción queda limitado por su costo', () => {
  assert.ok(validarPropuesta(base({ resistencia: 50, acciones: [{ nombre: 'Golpe', costo: 1, danio: 90 }] })).length > 0);
  assert.deepEqual(validarPropuesta(base({ resistencia: 50, acciones: [{ nombre: 'Golpe', costo: 1, danio: 20 }] })), []);
});

test('la pantalla del torneo escapa cada nombre de participante', () => {
  const src = readFileSync(new URL('../js/ui/torneo.js', import.meta.url), 'utf8');
  const crudos = src.split('\n').filter(l => /\$\{(?![^}]*esc\()[^}]*\b(p\.a|p\.b|nombre|n|ganador)\b[^}]*\}/.test(l) && !/\$\{t\b|\$\{d\b/.test(l));
  assert.deepEqual(crudos, []);
});
