import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const SFX = JSON.parse(readFileSync('data/sfx.json', 'utf8'));

test('el banco de efectos tiene los sonidos de interfaz, cartas, invocaciones y combate, y sus archivos existen', () => {
  for (const n of ['ui_toque', 'ui_abrir', 'ui_cerrar', 'ui_confirmar', 'ui_error', 'carta_robar', 'carta_colocar', 'carta_voltear', 'buscar',
    'invocar_protagonista', 'invocar_personaje', 'invocar_acontecimiento', 'invocar_lugar', 'ataque_ligero', 'ataque_fuerte', 'ventaja',
    'caida', 'curar', 'proteger', 'saber', 'conexion', 'hito', 'turno_propio', 'turno_rival', 'viaje', 'victoria', 'derrota']) {
    assert.ok(SFX[n], `falta ${n}`);
    assert.ok(existsSync(SFX[n]), `falta el archivo ${SFX[n]}`);
  }
});

test('cada efecto que usa el juego está en el banco o tiene respaldo sintetizado', () => {
  const js = readFileSync('js/ui/sonido.js', 'utf8');
  const usados = [...js.matchAll(/efecto\('([a-z_]+)'/g)].map(m => m[1]);
  for (const n of usados) assert.ok(SFX[n], `${n} no está en data/sfx.json`);
});

test('la mesa suena distinto según la carta, el daño, el turno y el final', () => {
  const mesa = readFileSync('js/ui/mesa.js', 'utf8');
  assert.match(mesa, /sonidos\.invocar\(plan\.carta\.tipo, dimensionDeInvocacion\(plan\.carta\)\)/);
  assert.match(mesa, /sonidos\.ataque\(plan\.ventaja \? Math\.max\(plan\.valor, 50\) : plan\.valor\)/);
  assert.match(mesa, /sonidos\.turno\(contraIA && ev\.jugador === 'B'\)/);
  assert.match(mesa, /sonidos\.derrota\(\)/);
  assert.match(mesa, /sonidos\.curar\(\)/);
  assert.match(mesa, /sonidos\.viaje\(\)/);
  const app = readFileSync('js/ui/app.js', 'utf8');
  assert.match(app, /precargarSonidos\(\)/);
  assert.match(app, /sonidos\.toque\(\)/);
});
