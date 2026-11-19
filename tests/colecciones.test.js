import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { coleccion, COLECCIONES, FUERZAS } from '../js/colecciones.js';
import { crearPartida, desgloseDanio, VENTAJA, TODAS_DIMENSIONES, DIMENSIONES } from '../js/motor.js';
import { validarCarta, NOMBRE_DIMENSION } from '../js/mazos.js';
import { TEMAS, COLORES } from '../js/ui/arte.js';
import { prot } from './ayudas.js';

const clon = x => JSON.parse(JSON.stringify(x));
function mesa(a, b) {
  const base = Array.from({ length: 20 }, () => prot('Politica'));
  const e = clon(crearPartida({ mazoA: base, mazoB: base, semilla: 1 }));
  e.fase = 'turno'; e.turno = 'A';
  e.jugadores.A.activo = { uid: 'a', carta: a, danio: 0, saber: 9, protegido: false, bonus: 0, turnoEntrada: 0 };
  e.jugadores.A.reserva = [];
  e.jugadores.B.activo = { uid: 'b', carta: b, danio: 0, saber: 0, protegido: false, bonus: 0, turnoEntrada: 0 };
  e.lugar = null; e.tablero = null;
  return e;
}

test('la ronda de ventajas de la expansión se cierra: cada fuerza le gana a una y pierde con otra', () => {
  const fm = coleccion('fin-del-mundo');
  assert.ok(fm, 'falta la colección');
  const claves = Object.keys(fm.fuerzas).sort();
  assert.deepEqual(claves, ['BosqueNoche', 'CieloViento', 'Mar', 'TierraFuego']);
  assert.deepEqual(Object.values(fm.ventaja).sort(), claves);
  assert.equal(fm.ventaja.Mar, 'TierraFuego');
  assert.equal(fm.ventaja.TierraFuego, 'CieloViento');
  assert.equal(fm.ventaja.CieloViento, 'BosqueNoche');
  assert.equal(fm.ventaja.BosqueNoche, 'Mar');
  assert.equal(fm.etiquetaDato, 'De dónde viene');
  assert.equal(coleccion('no-existe'), null);
});

test('el motor aplica ×2 de Mar contra Tierra y Fuego y nada contra Cielo y Viento', () => {
  const golpe = [{ nombre: 'Ola', costo: 1, danio: 20 }];
  const mar = prot('Mar', 70, golpe), tierra = prot('TierraFuego', 70, golpe), cielo = prot('CieloViento', 70, golpe);
  assert.deepEqual(desgloseDanio(mesa(mar, tierra), 'A', 0).pasos, [{ fuente: 'ventaja', por: 2 }]);
  assert.equal(desgloseDanio(mesa(mar, tierra), 'A', 0).total, 40);
  assert.deepEqual(desgloseDanio(mesa(mar, cielo), 'A', 0).pasos, []);
  assert.deepEqual(desgloseDanio(mesa(prot('BosqueNoche', 70, golpe), mar), 'A', 0).pasos, [{ fuente: 'ventaja', por: 2 }]);
});

test('las ventajas y dimensiones de Historia no cambian', () => {
  assert.deepEqual(DIMENSIONES, ['Politica', 'Economia', 'Sociedad', 'Cultura', 'Territorio']);
  assert.equal(VENTAJA.Politica, 'Economia');
  assert.equal(VENTAJA.Territorio, 'Politica');
  assert.deepEqual(TODAS_DIMENSIONES, [...DIMENSIONES, 'Mar', 'TierraFuego', 'CieloViento', 'BosqueNoche']);
});

test('una carta con fuerza válida pasa la validación y una inventada no', () => {
  assert.deepEqual(validarCarta(prot('Mar')), []);
  assert.ok(validarCarta(prot('Lava')).length);
  const lugarFM = { id: 'L', nombre: 'Bosque', tipo: 'lugar', efecto: { tipo: 'bonusDimension', dimension: 'BosqueNoche', n: 10 }, dato: 'Dato.', emblema: 'arbol' };
  assert.deepEqual(validarCarta(lugarFM), []);
});

test('nombres, temas, colores y frases de cada fuerza', () => {
  assert.equal(NOMBRE_DIMENSION.Mar, 'Mar');
  assert.equal(NOMBRE_DIMENSION.TierraFuego, 'Tierra y Fuego');
  assert.equal(NOMBRE_DIMENSION.CieloViento, 'Cielo y Viento');
  assert.equal(NOMBRE_DIMENSION.BosqueNoche, 'Bosque y Noche');
  assert.equal(TEMAS.Mar.icono, 'ola');
  assert.equal(TEMAS.TierraFuego.icono, 'volcan');
  assert.equal(TEMAS.CieloViento.icono, 'estrella');
  assert.equal(TEMAS.BosqueNoche.icono, 'arbol');
  for (const k of Object.keys(FUERZAS)) {
    assert.match(COLORES[k], /^#[0-9A-F]{6}$/i, k);
    for (const p of ['base', 'claro', 'oscuro', 'papel']) assert.match(TEMAS[k][p], /^#[0-9A-F]{6}$/i, `${k}.${p}`);
    assert.ok(FUERZAS[k].frase.length > 5, k);
  }
  const mesaJs = readFileSync('js/ui/mesa.js', 'utf8');
  assert.match(mesaJs, /FRASES_VENTAJA = \{[^}]*\.\.\.Object\.fromEntries\(Object\.entries\(FUERZAS\)/s);
});

test('cada colección del registro declara lo que necesita la app', () => {
  for (const c of COLECCIONES) {
    for (const k of ['id', 'nombre', 'sigla', 'archivo', 'fondo', 'dorso', 'etiquetaDato', 'fuerzas', 'ventaja']) assert.ok(c[k], `${c.id}.${k}`);
    for (const f of Object.keys(c.fuerzas)) assert.ok(!DIMENSIONES.includes(f), `${f} choca con una dimensión de Historia`);
  }
  const js = readFileSync('js/colecciones.js', 'utf8');
  assert.doesNotMatch(js, /from '\.\/motor\.js'/, 'colecciones.js no depende del motor');
});
