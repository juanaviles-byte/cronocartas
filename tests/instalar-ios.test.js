import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mostrarAyudaIOS } from '../js/instalar-ios.js';

const IPHONE_SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const IPAD_ESCRITORIO = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';
const IPHONE_CHROME = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 9; SM-T290) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0 Safari/537.36';

test('se muestra en Safari de iPhone y de iPad sin instalar', () => {
  assert.equal(mostrarAyudaIOS({ ua: IPHONE_SAFARI, toques: 5, instalada: false, cerrada: false }), true);
  assert.equal(mostrarAyudaIOS({ ua: IPAD_ESCRITORIO, toques: 5, instalada: false, cerrada: false }), true);
});

test('no se muestra si ya está instalada, si se cerró, en un Mac, en Chrome de iPhone ni en Android', () => {
  assert.equal(mostrarAyudaIOS({ ua: IPHONE_SAFARI, toques: 5, instalada: true, cerrada: false }), false);
  assert.equal(mostrarAyudaIOS({ ua: IPHONE_SAFARI, toques: 5, instalada: false, cerrada: true }), false);
  assert.equal(mostrarAyudaIOS({ ua: IPAD_ESCRITORIO, toques: 0, instalada: false, cerrada: false }), false);
  assert.equal(mostrarAyudaIOS({ ua: IPHONE_CHROME, toques: 5, instalada: false, cerrada: false }), false);
  assert.equal(mostrarAyudaIOS({ ua: ANDROID, toques: 5, instalada: false, cerrada: false }), false);
});
