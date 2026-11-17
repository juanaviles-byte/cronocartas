import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pinValido, huellaPin, verificarPin } from '../js/pin.js';

test('el PIN debe tener exactamente 4 dígitos', () => {
  assert.equal(pinValido('1234'), true);
  for (const p of ['123', '12345', 'abcd', '12 4', '', null]) assert.equal(pinValido(p), false);
});

test('la huella no guarda el PIN en texto plano y es estable', () => {
  assert.notEqual(huellaPin('1234'), '1234');
  assert.equal(huellaPin('1234'), huellaPin('1234'));
  assert.notEqual(huellaPin('1234'), huellaPin('4321'));
});

test('verificarPin compara contra la huella guardada', () => {
  const h = huellaPin('2026');
  assert.equal(verificarPin('2026', h), true);
  assert.equal(verificarPin('2027', h), false);
});
