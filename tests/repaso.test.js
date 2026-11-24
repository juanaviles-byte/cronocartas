import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Repasar la mano con el dedo (como en Hearthstone): deslizar marca la carta bajo el dedo, dejarlo quieto
// la agranda hasta levantarlo, y para jugarla se saca el dedo de la mano hacia la mesa.
const repaso = readFileSync('js/ui/repaso.js', 'utf8');
const arrastre = readFileSync('js/ui/arrastre.js', 'utf8');
const mesa = readFileSync('js/ui/mesa.js', 'utf8');
const css = readFileSync('css/estilos.css', 'utf8');

test('el repaso marca la carta bajo el dedo y la agranda si el dedo se queda quieto', () => {
  assert.match(repaso, /export function repasarMano\(mano, \{ mirar, dejar \}\)/);
  assert.match(repaso, /classList\.add\('repasada'\)/);
  assert.match(repaso, /setTimeout\([\s\S]*mirar\(actual\)[\s\S]*ESPERA_PREVIA\)/);
  assert.match(repaso, /if \(mirando\) mirar\(c\)/, 'con la carta grande, al pasar a otra se agranda esa');
  assert.match(repaso, /if \(mirando\) dejar\(\)/, 'al levantar el dedo se quita');
  assert.match(repaso, /ev\.pointerType === 'mouse'/, 'con mouse sigue la vista previa al pasar el cursor');
});

test('mirar o repasar no cuenta como tocar la carta', () => {
  assert.match(repaso, /if \(mirando \|\| movida\) bloquearHasta = /);
  assert.match(repaso, /addEventListener\('click', ev => \{\s*if \(performance\.now\(\) < bloquearHasta\)/);
});

test('con el dedo, la carta se arrastra solo al salir de la mano, y se arrastra la que está marcada', () => {
  assert.match(arrastre, /const REGISTRO = new WeakMap\(\)/);
  assert.match(arrastre, /ev\.pointerType !== 'mouse'/);
  assert.match(arrastre, /fila\.querySelector\('\.repasada'\)/);
  assert.match(arrastre, /girado \? ev\.clientY > r\.bottom \+ SALIDA : ev\.clientY < r\.top - SALIDA/);
});

test('la mesa activa el repaso en las manos a la vista y muestra la carta grande al tacto', () => {
  assert.match(mesa, /repasarMano\(mano, \{ mirar: el => mostrarPrevia\(el, j, true\), dejar: quitarPrevia \}\)/);
  assert.match(css, /\.mano \.carta-mini\.repasada \{/);
  assert.match(css, /\.vista-previa\.tactil \.carta-normal \{/);
});
