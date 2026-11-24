import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// En muchos celulares los botones del sistema (atrás, inicio) quedan encima del borde de abajo.
// En el celular vertical, «Pasar turno» va en la franja central y «Deshacer» no se muestra.
const mesa = readFileSync('js/ui/mesa.js', 'utf8');
const css = readFileSync('css/estilos.css', 'utf8');
const celular = css.slice(css.indexOf('@media (orientation: portrait) and (max-width: 600px) {\n  .mesa.vista-jugador .lado { padding'));
const bloque = celular.slice(0, celular.indexOf('\n}\n'));

test('la franja central trae «Pasar turno» en la vista del jugador', () => {
  assert.match(mesa, /'boton-secundario boton-pasar boton-pasar-centro'/);
  assert.match(css, /\.boton-pasar-centro \{ display: none; \}/, 'fuera del celular no se ve');
});

test('en el celular vertical: «Pasar turno» al centro, sin «Deshacer», y el borde de abajo queda libre', () => {
  assert.match(bloque, /\.centro > \.boton-pasar-centro \{[^}]*display: block/);
  assert.match(bloque, /\.lado-A \.controles \.boton-pasar, \.mesa\.vista-jugador \.boton-deshacer \{ display: none; \}/);
  assert.match(bloque, /\.lado-A \.campo \{[^}]*"marc activo pil" "ctl activo pil"/, 'el orbe de Saber y la Pista van bajo la placa «Tú»');
  assert.match(bloque, /\.lado-A \.campo > \.controles \{[^}]*grid-area: ctl/);
  assert.match(bloque, /\.lado-A \{[^}]*padding-bottom: max\(/, 'espacio para los botones del sistema');
});

test('la pista de «Pasar turno» apunta al botón que se ve', () => {
  assert.match(mesa, /case 'pasar': return q\(`\$\{L\} \.controles \.boton-pasar, \.centro \.boton-pasar-centro`\)\.filter\(/);
});

test('en el celular vertical los controles del jugador van dentro de su campo (y se rehace al girar)', () => {
  assert.match(mesa, /const celularVertical = \(\) =>/);
  assert.match(mesa, /\(vistaJugador && j === 'A' && celularVertical\(\) \? campo : fila\)\.appendChild\(controles\)/);
  assert.match(mesa, /celularVertical\(\) !== eraCelular/);
});

// Franja central del celular vertical: sonido y Cronista a la izquierda, el Lugar justo al centro,
// y «Pasar turno» (o el aviso del turno) junto al menú, a la derecha.
test('en el celular vertical el Lugar queda centrado y «Pasar turno» va a la derecha, junto al menú', () => {
  assert.match(bloque, /\.centro \{ grid-template-columns: minmax\(0, 1fr\) auto minmax\(0, 1fr\);/, 'columnas laterales iguales: el Lugar al centro');
  assert.match(bloque, /\.centro \.lugar-en-juego \{[^}]*grid-column: 2;/);
  assert.match(bloque, /\.centro > \.boton-sonido \{[^}]*grid-column: 1;[^}]*justify-self: start;/);
  assert.match(bloque, /\.centro > \.boton-guia \{[^}]*grid-column: 1;[^}]*justify-self: start;/);
  assert.match(bloque, /\.centro > \.boton-menu \{[^}]*grid-column: 3;[^}]*justify-self: end;/);
  assert.match(bloque, /\.centro > \.boton-pasar-centro \{[^}]*grid-column: 3;[^}]*justify-self: end;/);
  assert.match(bloque, /\.centro > \.aviso-turno \{[^}]*grid-column: 3;[^}]*justify-self: end;/);
});
