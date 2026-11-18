import { test } from 'node:test';
import assert from 'node:assert/strict';
import { textoParaLeer } from '../js/ui/carta.js';

test('Escuchar una carta lee solo el nombre y el dato, sin reglas', () => {
  const c = { id: 'x', tipo: 'protagonista', nombre: 'Gabriela Mistral', dimension: 'cultural', resistencia: 80,
    habilidad: { tipo: 'inspirador', nombre: 'Maestra' }, acciones: [{ nombre: 'Poema', costo: 2, danio: 30 }],
    dato: 'Primera latinoamericana en ganar el Nobel de Literatura.' };
  const t = textoParaLeer(c);
  assert.equal(t, 'Gabriela Mistral. Primera latinoamericana en ganar el Nobel de Literatura.');
  assert.doesNotMatch(t, /Saber|Habilidad|Acción|resistencia/);
});
