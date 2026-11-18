import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// Un error de sintaxis en un módulo de pantalla deja la app en "Cargando…": se revisan todos los archivos.
test('todos los módulos JavaScript tienen sintaxis válida', () => {
  const archivos = ['js', 'js/ui'].flatMap(d => readdirSync(new URL(`../${d}/`, import.meta.url)).filter(f => f.endsWith('.js')).map(f => `${d}/${f}`)).concat(['sw.js']);
  const malos = [];
  for (const f of archivos) {
    try { execFileSync(process.execPath, ['--check', '--input-type=module'], { input: execFileSync('cat', [new URL(`../${f}`, import.meta.url).pathname]), stdio: ['pipe', 'pipe', 'pipe'] }); }
    catch (e) { malos.push(`${f}: ${String(e.stderr).split('\n').find(l => /Error/.test(l))}`); }
  }
  assert.deepEqual(malos, []);
});
