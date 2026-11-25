// «Recuperar» no puede traer otra carta que también recupera: con dos copias, se jugarían una a la otra sin fin.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aplicarJugada, jugadasValidas } from '../js/motor.js';
import { acont, prot, mesa } from './ayudas.js';

test('recuperar salta las cartas que también recuperan', () => {
  const monjes1 = acont({ tipo: 'recuperar' }), monjes2 = acont({ tipo: 'recuperar' }), relato = acont({ tipo: 'robar', n: 1 });
  let e = mesa({ activoA: prot('Politica', 80), activoB: prot('Politica', 80), manoA: [monjes1] });
  e.jugadores.A.descarte = [{ uid: 'r', carta: relato }, { uid: 'm2', carta: monjes2 }];
  const uid = e.jugadores.A.mano.find(c => c.carta === monjes1 || c.carta.id === monjes1.id).uid;
  const r = aplicarJugada(e, { tipo: 'jugar', uid });
  const mano = r.estado.jugadores.A.mano.map(c => c.carta.id);
  assert.ok(mano.includes(relato.id), 'trae el relato');
  assert.ok(!mano.includes(monjes2.id), 'no trae la otra copia');
});

test('si en el descarte solo hay cartas que recuperan, no se puede jugar', () => {
  const monjes1 = acont({ tipo: 'recuperar' }), monjes2 = acont({ tipo: 'recuperar' });
  const e = mesa({ activoA: prot('Politica', 80), activoB: prot('Politica', 80), manoA: [monjes1] });
  e.jugadores.A.descarte = [{ uid: 'm2', carta: monjes2 }];
  const uid = e.jugadores.A.mano.find(c => c.carta.id === monjes1.id).uid;
  assert.ok(!jugadasValidas(e).some(j => j.tipo === 'jugar' && j.uid === uid));
});
