import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { crearAmbiente, rutaDeAmbiente } from '../js/ui/ambiente.js';

// Audio falso: registra play/pause y deja leer el volumen.
function fabrica() {
  const creados = [];
  const crearAudio = ruta => {
    const a = { ruta, volume: 1, loop: false, pausado: true, play() { this.pausado = false; return Promise.resolve(); }, pause() { this.pausado = true; } };
    creados.push(a);
    return a;
  };
  return { creados, crearAudio };
}
const cerca = (a, b) => Math.abs(a - b) < 0.005;

test('poner un ambiente lo reproduce en bucle y sube el volumen de a poco', () => {
  mock.timers.enable({ apis: ['setInterval', 'setTimeout'] });
  const { creados, crearAudio } = fabrica();
  const amb = crearAmbiente({ crearAudio, volumen: 0.2, fundido: 1000 });
  amb.poner('audio/ambientes/a.ogg');
  assert.equal(creados.length, 1);
  assert.equal(creados[0].loop, true);
  assert.equal(creados[0].pausado, false);
  assert.ok(creados[0].volume < 0.05, 'empieza casi en silencio');
  mock.timers.tick(1100);
  assert.ok(cerca(creados[0].volume, 0.2));
  mock.timers.reset();
});

test('poner el mismo ambiente otra vez no lo reinicia', () => {
  mock.timers.enable({ apis: ['setInterval', 'setTimeout'] });
  const { creados, crearAudio } = fabrica();
  const amb = crearAmbiente({ crearAudio });
  amb.poner('a.ogg'); amb.poner('a.ogg');
  assert.equal(creados.length, 1);
  mock.timers.reset();
});

test('al cambiar de escenario el anterior se apaga y el nuevo entra', () => {
  mock.timers.enable({ apis: ['setInterval', 'setTimeout'] });
  const { creados, crearAudio } = fabrica();
  const amb = crearAmbiente({ crearAudio, volumen: 0.2, fundido: 1000 });
  amb.poner('a.ogg'); mock.timers.tick(1100);
  amb.poner('b.ogg'); mock.timers.tick(1100);
  assert.equal(creados.length, 2);
  assert.equal(creados[0].pausado, true);
  assert.ok(cerca(creados[0].volume, 0));
  assert.ok(cerca(creados[1].volume, 0.2));
  assert.equal(amb.ruta, 'b.ogg');
  mock.timers.reset();
});

test('sin escenario (null) el ambiente se apaga', () => {
  mock.timers.enable({ apis: ['setInterval', 'setTimeout'] });
  const { creados, crearAudio } = fabrica();
  const amb = crearAmbiente({ crearAudio, fundido: 500 });
  amb.poner('a.ogg'); mock.timers.tick(600);
  amb.poner(null); mock.timers.tick(600);
  assert.equal(creados[0].pausado, true);
  assert.equal(amb.ruta, null);
  mock.timers.reset();
});

test('mientras habla una voz el ambiente baja, y luego vuelve', () => {
  mock.timers.enable({ apis: ['setInterval', 'setTimeout'] });
  const { creados, crearAudio } = fabrica();
  const amb = crearAmbiente({ crearAudio, volumen: 0.2, fundido: 400 });
  amb.poner('a.ogg'); mock.timers.tick(500);
  amb.atenuar(true); mock.timers.tick(500);
  assert.ok(creados[0].volume < 0.08, `con voz: ${creados[0].volume}`);
  amb.atenuar(false); mock.timers.tick(500);
  assert.ok(cerca(creados[0].volume, 0.2));
  mock.timers.reset();
});

test('con el sonido apagado no suena nada, y al volver retoma el escenario', () => {
  mock.timers.enable({ apis: ['setInterval', 'setTimeout'] });
  const { creados, crearAudio } = fabrica();
  let activo = false;
  const amb = crearAmbiente({ crearAudio, activo: () => activo, fundido: 300 });
  amb.poner('a.ogg');
  assert.equal(creados.length, 0);
  activo = true; amb.refrescar(); mock.timers.tick(400);
  assert.equal(creados.length, 1);
  assert.equal(creados[0].pausado, false);
  activo = false; amb.refrescar(); mock.timers.tick(400);
  assert.equal(creados[0].pausado, true);
  mock.timers.reset();
});

test('si el audio no se puede reproducir, el juego sigue sin error', () => {
  const amb = crearAmbiente({ crearAudio: () => { throw new Error('sin audio'); } });
  assert.doesNotThrow(() => amb.poner('a.ogg'));
  const amb2 = crearAmbiente({ crearAudio: () => ({ play: () => Promise.reject(new Error('bloqueado')), pause() {} }) });
  assert.doesNotThrow(() => amb2.poner('a.ogg'));
});

test('cada ambiente listado es de un Lugar con escenario y su archivo existe', () => {
  const amb = JSON.parse(readFileSync('data/ambientes.json', 'utf8'));
  const esc = JSON.parse(readFileSync('data/escenarios.json', 'utf8'));
  for (const [id, a] of Object.entries(amb)) {
    assert.ok(esc[id], `${id} no es un escenario`);
    assert.ok(existsSync(a.ruta), `falta ${a.ruta}`);
    assert.ok(['CC0', 'CC BY'].includes(a.licencia), `${id}: licencia ${a.licencia} (solo CC0 o CC BY)`);
    if (a.licencia === 'CC BY') assert.ok(a.autor && a.url, `${id}: CC BY necesita autor y enlace`);
    assert.equal(rutaDeAmbiente(amb, id), a.ruta);
  }
  assert.equal(rutaDeAmbiente(amb, 'NO-EXISTE'), null);
});

test('la mesa pone el ambiente del Lugar y lo apaga al salir', () => {
  const mesa = readFileSync('js/ui/mesa.js', 'utf8');
  assert.match(mesa, /ambiente\.poner\(/);
  assert.match(mesa, /function destruir\(\) \{[^}]*ambiente\.poner\(null\)/);
  const voz = readFileSync('js/ui/voz.js', 'utf8');
  assert.match(voz, /ambiente\.atenuar\(true\)/, 'las voces bajan el ambiente');
});
