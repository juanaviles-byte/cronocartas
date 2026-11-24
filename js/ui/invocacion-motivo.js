// Animación de invocación según el motivo de la carta (js/motivos.js): un tren que cruza echando
// humo, un barco sobre las olas, una marcha, espigas que se alzan, papeletas que caen en la urna…
// Cada motivo combina capas simples (cruza, alza, lluvia, sube, golpe, vaivén, ronda, órbita, traza,
// ondas, pulso). Todo es SVG en línea animado con transform y opacity (CSS), así que también corre en
// el modo escuela, donde se dibuja la mitad de las piezas.

const s = (vb, cuerpo, estirar = false) => `<svg viewBox="${vb}"${estirar ? ' preserveAspectRatio="none"' : ''} aria-hidden="true">${cuerpo}</svg>`;
const I = {
  tren: s('0 0 96 56', '<rect x="6" y="22" width="52" height="18" rx="3"/><rect x="56" y="10" width="22" height="30" rx="3"/><rect x="60" y="14" width="14" height="10" fill="#FFE9A8"/>'
    + '<rect x="14" y="8" width="9" height="14"/><path d="M11 8h15l-2-6H13z"/><path d="M78 40l12 8H74z"/><circle cx="18" cy="44" r="7"/><circle cx="36" cy="44" r="7"/><circle cx="64" cy="44" r="8"/><rect x="0" y="34" width="8" height="5"/>'),
  humo: s('0 0 40 40', '<circle cx="14" cy="22" r="11"/><circle cx="26" cy="18" r="12"/><circle cx="22" cy="28" r="10"/>'),
  barco: s('0 0 80 70', '<path d="M6 50h68l-9 14H14z"/><path d="M38 6v44" stroke-width="3"/><path d="M40 8c14 6 18 22 14 38H40z"/><path d="M36 12c-12 6-16 20-13 32h13z"/><path d="M38 6l12 4-12 4z" fill="#C0392B"/>'),
  soldados: s('0 0 110 64', [0, 36, 72].map(x => `<g transform="translate(${x})"><circle cx="14" cy="10" r="6"/><path d="M8 18h12l3 24h-5l-2 20h-4l-2-20h-5z"/><path d="M27 0v58" stroke-width="3"/><ellipse cx="7" cy="30" rx="6" ry="10"/></g>`).join('')),
  polvo: s('0 0 20 20', '<circle cx="10" cy="10" r="8"/>'),
  guarda: s('0 0 40 40', '<path d="M20 2l6 6-6 6-6-6zM20 26l6 6-6 6-6-6zM2 20l6-6 6 6-6 6zM26 20l6-6 6 6-6 6zM16 20l4-4 4 4-4 4z"/>'),
  persona: s('0 0 30 40', '<circle cx="15" cy="10" r="7"/><path d="M2 40c0-10 6-17 13-17s13 7 13 17z"/>'),
  corazon: s('0 0 32 30', '<path d="M16 28C4 19 1 13 1 8a7 7 0 0 1 15-3 7 7 0 0 1 15 3c0 5-3 11-15 20z"/>'),
  campana: s('0 0 60 70', '<path d="M30 4a4 4 0 0 1 4 4v3c10 2 14 12 14 22v12l6 8H6l6-8V33c0-10 4-20 14-22V8a4 4 0 0 1 4-4z"/><circle cx="30" cy="60" r="6"/>'),
  sol: s('0 0 80 80', '<circle cx="40" cy="40" r="17"/>' + Array.from({ length: 12 }, (_, k) => `<path d="M40 4l4 13h-8z" transform="rotate(${k * 30} 40 40)"/>`).join('')),
  grano: s('0 0 10 10', '<circle cx="5" cy="5" r="4"/>'),
  espiga: s('0 0 30 90', '<path d="M15 30v58" stroke-width="3" fill="none"/>' + [8, 20, 32, 44].map(y => `<ellipse cx="9" cy="${y}" rx="5" ry="8" transform="rotate(-25 9 ${y})"/><ellipse cx="21" cy="${y}" rx="5" ry="8" transform="rotate(25 21 ${y})"/>`).join('') + '<ellipse cx="15" cy="2" rx="4" ry="7"/>'),
  hoja: s('0 0 30 20', '<path d="M2 10C8 0 22 0 28 10 22 20 8 20 2 10z"/>'),
  copo: s('0 0 40 40', '<g stroke-width="3" stroke-linecap="round" fill="none">' + [0, 60, 120].map(a => `<path d="M20 3v34M14 8l6 5 6-5M14 32l6-5 6 5" transform="rotate(${a} 20 20)"/>`).join('') + '</g>'),
  glaciar: s('0 0 200 80', '<path d="M0 80L24 30 42 46 70 8 96 40 118 22 146 52 170 26 200 50V80z"/><path d="M70 8l-10 18 10-5 9 6zM118 22l-7 12 7-3 6 4zM24 30l-6 10 6-2 5 3z" fill="#FFFFFF"/>'),
  montanas: s('0 0 200 80', '<path d="M0 80L30 38 48 54 78 14 104 46 122 30 150 58 172 34 200 56V80z"/><path d="M78 14l-10 16 10-4 8 6zM122 30l-6 10 6-2 5 4z" fill="#F3EAD3"/>'),
  condor: s('0 0 120 40', '<path d="M60 14c-6-2-10 0-12 4L0 8c10 10 24 16 40 18l-6 10 14-6 4 6 8-6 8 6 4-6 14 6-6-10c16-2 30-8 40-18l-48 10c-2-4-6-6-12-4z"/>'),
  pico: s('0 0 70 70', '<path d="M8 22C24 4 46 4 62 22c-14-6-30-6-46 0z"/><path d="M33 10l4 2-14 54-5-1z"/>'),
  chispa: s('0 0 20 20', '<path d="M10 0l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>'),
  pergamino: s('0 0 80 60', '<rect x="12" y="8" width="56" height="44" rx="2" fill="#F3E3C0"/><rect x="4" y="4" width="10" height="52" rx="5"/><rect x="66" y="4" width="10" height="52" rx="5"/>'
    + '<path d="M22 20h36M22 28h36M22 36h28M22 44h18" stroke="#8A6A3A" stroke-width="2.5"/>'),
  urna: s('0 0 70 60', '<rect x="6" y="16" width="58" height="42" rx="3"/><rect x="22" y="12" width="26" height="6" rx="2" fill="#2A2017"/><path d="M24 36h22" stroke="#F3EAD3" stroke-width="3"/>'),
  papeleta: s('0 0 30 36', '<rect x="1" y="1" width="28" height="34" rx="2" fill="#FFFFFF"/><path d="M8 18l5 6 10-12" stroke="#2C64A8" stroke-width="3.5" fill="none" stroke-linecap="round"/>'),
  templo: s('0 0 120 80', '<path d="M6 26L60 4l54 22z"/><rect x="8" y="26" width="104" height="6"/>' + [16, 36, 56, 76, 96].map(x => `<rect x="${x}" y="34" width="8" height="34"/>`).join('') + '<rect x="4" y="68" width="112" height="6"/><rect x="0" y="74" width="120" height="6"/>'),
  libro: s('0 0 50 36', '<path d="M25 6C18 1 8 1 2 4v30c6-3 16-3 23 2 7-5 17-5 23-2V4c-6-3-16-3-23 2z"/><path d="M25 6v30" stroke="#1B2647" stroke-width="2"/>'),
  lapiz: s('0 0 60 14', '<rect x="10" y="2" width="40" height="10"/><path d="M10 2L0 7l10 5z" fill="#E8C9A0"/><rect x="50" y="2" width="8" height="10" fill="#E57373"/>'),
  bandera: s('0 0 50 70', '<rect x="4" y="2" width="4" height="66"/><path d="M8 4c10-4 20 4 30 0s10-2 10-2v26s-4 4-12 4-16-6-28-2z"/>'),
  estrella: s('0 0 40 40', '<path d="M20 2l5 12 13 1-10 9 3 13-11-7-11 7 3-13-10-9 13-1z"/>'),
  fabrica: s('0 0 120 80', '<path d="M0 80V40l20-12v12l20-12v12l20-12v12h20V8h10v32h10V20h10v20h10v40z"/><rect x="10" y="54" width="10" height="10" fill="#FFE9A8"/><rect x="30" y="54" width="10" height="10" fill="#FFE9A8"/><rect x="50" y="54" width="10" height="10" fill="#FFE9A8"/>'),
  mazo: s('0 0 80 80', '<rect x="14" y="10" width="40" height="18" rx="4" transform="rotate(-30 34 19)"/><path d="M34 26l5-3 26 45-5 3z"/><rect x="40" y="64" width="34" height="10" rx="3"/>'),
  llama: s('0 0 40 60', '<path d="M20 2c4 12 16 18 16 34a16 16 0 0 1-32 0c0-8 4-12 6-16 2 6 4 8 6 8C16 20 16 12 20 2z"/><path d="M20 30c2 6 8 8 8 16a8 8 0 0 1-16 0c0-4 4-8 8-16z" fill="#FFE08A"/>'),
  piramide: s('0 0 160 80', '<path d="M0 80L50 10l50 70zM80 80l40-52 40 52z"/><path d="M50 10L32 80h-4z" fill="#C79A4A"/>'),
  pluma: s('0 0 80 30', '<path d="M2 28C20 10 50 0 78 2 60 8 40 20 10 28z"/><path d="M2 28l12-6" stroke="#3A2A1A" stroke-width="2"/>'),
  corona: s('0 0 80 60', '<path d="M6 50L2 14l20 16L40 4l18 26 20-16-4 36z"/><rect x="6" y="50" width="68" height="8" rx="2"/><circle cx="40" cy="36" r="5" fill="#C0392B"/><circle cx="22" cy="40" r="4" fill="#2C64A8"/><circle cx="58" cy="40" r="4" fill="#2B8152"/>'),
  laurel: s('0 0 80 70', '<g fill="none" stroke-width="3"><path d="M40 66C14 60 6 36 14 10"/><path d="M40 66c26-6 34-30 26-56"/></g>'
    + [[14, 52, 30], [9, 40, 10], [9, 27, -10], [13, 15, -30], [66, 52, -30], [71, 40, -10], [71, 27, 10], [67, 15, 30]].map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="9" transform="rotate(${a} ${x} ${y})"/>`).join('')),
  castillo: s('0 0 120 90', '<path d="M0 90V30h8v-8h8v8h8v-8h8v8h8v60zM80 90V30h8v-8h8v8h8v-8h8v8h8v60zM36 90V44h48v46z"/><path d="M50 90V66a10 10 0 0 1 20 0v24z" fill="#2A2017"/><rect x="58" y="6" width="3" height="38"/><path d="M61 6h16l-4 6 4 6H61z" fill="#C0392B"/>'),
  balanza: s('0 0 80 70', '<rect x="38" y="6" width="4" height="54"/><rect x="22" y="60" width="36" height="6" rx="2"/><path d="M8 16h64" stroke-width="4"/><path d="M8 16L0 40h16zM72 16l-8 24h16z"/><path d="M0 40a8 5 0 0 0 16 0zM64 40a8 5 0 0 0 16 0z"/>'),
  moneda: s('0 0 40 40', '<circle cx="20" cy="20" r="18" fill="#E9B949"/><circle cx="20" cy="20" r="12" fill="none" stroke="#B9850F" stroke-width="2"/>'),
  escalonado: s('0 0 120 90', '<path d="M10 90V74h10V60h12V46h12V32h32v14h12v14h12v14h10v16z"/><rect x="50" y="16" width="20" height="16"/><path d="M48 16h24l-12-10z"/><path d="M56 32h8v58h-8z" fill="#7A5A2A"/>'),
  corredor: s('0 0 50 60', '<circle cx="30" cy="8" r="6"/><path d="M28 16l-8 18 10 6-6 16h6l8-18-8-6 4-8 10 6 4-4-14-10z"/><path d="M20 34l-12 8 3 4 13-8z"/>'),
  moai: s('0 0 50 90', '<path d="M12 90V40c0-14 2-30 14-36 10 4 14 14 14 26l-4 6 4 4v50z"/><path d="M18 38h12" stroke="#3A332B" stroke-width="3"/><path d="M28 42l-2 14h6" stroke="#3A332B" stroke-width="2" fill="none"/>'),
  edificio: s('0 0 120 90', '<rect x="10" y="20" width="40" height="70"/><rect x="56" y="36" width="54" height="54"/>' + [26, 40, 54, 68].map(y => `<rect x="18" y="${y}" width="8" height="8" fill="#FFE9A8"/><rect x="34" y="${y}" width="8" height="8" fill="#FFE9A8"/>`).join('') + '<path d="M2 88h116" stroke-width="4"/>'),
  tipo: s('0 0 36 36', '<rect x="2" y="2" width="32" height="32" rx="3"/><text x="18" y="27" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="24" fill="#1B2647">A</text>'),
  voluta: s('0 0 60 60', '<path d="M30 54C10 54 4 36 14 26s26-4 24 8-14 10-16 2 6-10 10-6" fill="none" stroke-width="5" stroke-linecap="round"/><path d="M30 54c20 0 26-18 16-28" fill="none" stroke-width="5" stroke-linecap="round"/>'),
};

// Capas de cada motivo. c: color; n: cuántas piezas; t: tamaño relativo; y: altura (0 arriba, 1 abajo).
export const DEF_MOTIVOS = {
  tren: [{ p: 'cruza', i: 'tren', c: '#D9B66B', t: 0.5, y: 0.88 }, { p: 'sube', i: 'humo', c: '#ECE7DD', n: 9, t: 0.1, desde: 0.2 }],
  barco: [{ p: 'ondas', c: '#4FA3D1' }, { p: 'cruza', i: 'barco', c: '#EFE2C2', t: 0.38, y: 0.84 }],
  marcha: [{ p: 'cruza', i: 'soldados', c: '#CDB78C', t: 0.5, y: 0.87 }, { p: 'sube', i: 'polvo', c: '#B89C6C', n: 10, t: 0.05 }],
  originario: [{ p: 'ronda', i: 'guarda', c: '#E7A86A', n: 10, t: 0.08 }, { p: 'sube', i: 'guarda', c: '#C8643B', n: 8, t: 0.05 }],
  comunidad: [{ p: 'ronda', i: 'persona', c: '#BFD6F6', n: 12, t: 0.08 }, { p: 'sube', i: 'corazon', c: '#F28B82', n: 8, t: 0.05 }],
  campana: [{ p: 'pulso', c: '#E9C46A' }, { p: 'vaiven', i: 'campana', c: '#E9C46A', t: 0.42 }],
  desierto: [{ p: 'alza', items: [['sol', 0.5, 0.06, 0.62]], c: '#F4B942' }, { p: 'sube', i: 'grano', c: '#E8C27A', n: 14, t: 0.02 }],
  campo: [{ p: 'alza', items: [['espiga', 0.12, 0.5, 0.13], ['espiga', 0.22, 0.56, 0.11], ['espiga', 0.78, 0.56, 0.11], ['espiga', 0.88, 0.5, 0.13]], c: '#E2B653' },
    { p: 'lluvia', i: 'hoja', c: '#9BCB6B', n: 10, t: 0.045 }],
  hielo: [{ p: 'alza', items: [['glaciar', 0.5, 0.62, 1.05]], c: '#9FC3DD' }, { p: 'lluvia', i: 'copo', c: '#F2FAFF', n: 14, t: 0.045 }],
  cordillera: [{ p: 'alza', items: [['montanas', 0.5, 0.6, 1.05]], c: '#7C8FA6' }, { p: 'cruza', i: 'condor', c: '#2E2A26', t: 0.42, y: 0.13 }],
  mina: [{ p: 'golpe', i: 'pico', c: '#D8D8D8', t: 0.5, gira: true }, { p: 'sube', i: 'chispa', c: '#E07B39', n: 12, t: 0.035, desde: 0.4 }],
  pergamino: [{ p: 'pulso', c: '#E9C46A' }, { p: 'golpe', i: 'pergamino', c: '#8A5A2A', t: 0.48 }],
  votacion: [{ p: 'alza', items: [['urna', 0.82, 0.2, 0.26]], c: '#2C64A8' }, { p: 'lluvia', i: 'papeleta', c: '#FFFFFF', n: 10, t: 0.05 }],
  columnas: [{ p: 'pulso', c: '#E8DFC8' }, { p: 'alza', items: [['templo', 0.5, 0.58, 0.9]], c: '#E8DFC8' }],
  escuela: [{ p: 'lluvia', i: 'libro', c: '#7FB0EE', n: 8, t: 0.06 }, { p: 'lluvia', i: 'lapiz', c: '#F4C542', n: 8, t: 0.07 }],
  independencia: [{ p: 'alza', items: [['bandera', 0.14, 0.3, 0.2], ['bandera', 0.86, 0.3, 0.2]], c: 'var(--dim, #C0392B)' },
    { p: 'lluvia', i: 'estrella', c: '#F3D98B', n: 14, t: 0.035 }],
  fabrica: [{ p: 'alza', items: [['fabrica', 0.5, 0.62, 0.9]], c: '#8C8C8C' }, { p: 'sube', i: 'humo', c: '#BDBDBD', n: 9, t: 0.09, desde: 0.2 }],
  mazo: [{ p: 'pulso', c: '#B07A4A' }, { p: 'golpe', i: 'mazo', c: '#B07A4A', t: 0.48, gira: true }],
  fuego: [{ p: 'sube', i: 'llama', c: '#F28C28', n: 12, t: 0.09 }, { p: 'sube', i: 'chispa', c: '#FFD27A', n: 12, t: 0.03, desde: 0.3 }],
  piramide: [{ p: 'alza', items: [['sol', 0.5, 0.08, 0.4], ['piramide', 0.5, 0.62, 1.0]], c: '#E0B867' }],
  escritura: [{ p: 'signos', c: '#F6EEFF' }, { p: 'cruza', i: 'pluma', c: '#F3EAD3', t: 0.22, y: 0.9 }],
  corona: [{ p: 'lluvia', i: 'estrella', c: '#FFF1C4', n: 12, t: 0.03 }, { p: 'baja', i: 'corona', c: '#E9C46A', t: 0.48 }],
  ciencia: [{ p: 'orbita', c: '#BFD6F6' }, { p: 'sube', i: 'estrella', c: '#FFF1C4', n: 10, t: 0.035 }],
  olimpico: [{ p: 'sube', i: 'llama', c: '#F28C28', n: 8, t: 0.06 }, { p: 'baja', i: 'laurel', c: '#9BCB6B', t: 0.46 }],
  castillo: [{ p: 'pulso', c: '#9A8F80' }, { p: 'alza', items: [['castillo', 0.5, 0.58, 0.95]], c: '#9A8F80' }],
  mercado: [{ p: 'lluvia', i: 'moneda', c: '#E9B949', n: 12, t: 0.05 }, { p: 'golpe', i: 'balanza', c: '#E9C46A', t: 0.46 }],
  templo: [{ p: 'pulso', c: '#C2A26B' }, { p: 'alza', items: [['escalonado', 0.5, 0.58, 0.95]], c: '#C2A26B' }],
  lago: [{ p: 'ondas', c: '#4FA3D1' }, { p: 'alza', items: [['escalonado', 0.5, 0.5, 0.8]], c: '#C2A26B' }],
  camino: [{ p: 'traza', c: '#E2C28E' }, { p: 'cruza', i: 'corredor', c: '#F3EAD3', t: 0.14, y: 0.88 }],
  moai: [{ p: 'ondas', c: '#4FA3D1' }, { p: 'alza', items: [['moai', 0.12, 0.45, 0.16], ['moai', 0.88, 0.45, 0.16]], c: '#8D8478' }],
  sismo: [{ p: 'pulso', c: '#D9A066' }, { p: 'alza', items: [['edificio', 0.5, 0.58, 0.9]], c: '#C9C2B8', tiembla: true }],
  imprenta: [{ p: 'pulso', c: '#E8DFC8' }, { p: 'lluvia', i: 'tipo', c: '#E8DFC8', n: 12, t: 0.06 }],
  barroco: [{ p: 'ronda', i: 'voluta', c: '#E9C46A', n: 10, t: 0.09 }, { p: 'sube', i: 'estrella', c: '#FFF1C4', n: 8, t: 0.03 }],
};

const SIGNOS = ['α', 'Ω', 'Σ', 'A', 'Ж', '文', 'ب', 'Ψ', 'π', 'ℵ'];
// Posiciones repartidas sin azar (las piezas siempre caen igual; se ve ordenado y no depende del motor).
const reparto = (k, n) => (((k * 0.618034) % 1) * 0.9 + 0.05);

function capa(def, k0) {
  const c = document.createElement('div');
  c.className = `motivo-capa capa-${def.p}${def.tiembla ? ' tiembla' : ''}${def.gira ? ' gira' : ''}`;
  c.style.color = def.c;
  const pieza = (html, estilo) => `<i class="pieza" style="${estilo}">${html}</i>`;
  const n = def.n || 0;
  if (def.p === 'cruza') c.innerHTML = pieza(I[def.i], `--t:${def.t};--y:${def.y}`);
  else if (def.p === 'alza') c.innerHTML = def.items.map(([i, x, y, t], k) => pieza(I[i], `--x:${x};--y:${y};--t:${t};--k:${k}`)).join('');
  else if (def.p === 'lluvia' || def.p === 'sube') c.innerHTML = Array.from({ length: n }, (_, k) => pieza(I[def.i], `--x:${reparto(k + k0, n).toFixed(3)};--t:${def.t};--k:${k};--d:${def.desde || 0}`)).join('');
  else if (def.p === 'ronda') c.innerHTML = Array.from({ length: n }, (_, k) => pieza(I[def.i], `--a:${(k / n * 360).toFixed(1)}deg;--t:${def.t};--k:${k}`)).join('');
  else if (def.p === 'golpe' || def.p === 'baja' || def.p === 'vaiven') c.innerHTML = pieza(I[def.i], `--t:${def.t}`);
  else if (def.p === 'signos') c.innerHTML = SIGNOS.map((g, k) => pieza(g, `--x:${reparto(k, SIGNOS.length).toFixed(3)};--k:${k}`)).join('');
  else if (def.p === 'ondas') c.innerHTML = '<i class="ola">' + s('0 0 400 40', '<path d="M0 20 Q25 0 50 20 T100 20 T150 20 T200 20 T250 20 T300 20 T350 20 T400 20 V40 H0z"/>', true) + '</i>'
    + '<i class="ola ola-2">' + s('0 0 400 40', '<path d="M0 20 Q25 4 50 20 T100 20 T150 20 T200 20 T250 20 T300 20 T350 20 T400 20 V40 H0z"/>', true) + '</i>';
  else if (def.p === 'orbita') c.innerHTML = [0, 60, 120].map((a, k) => `<i class="orbita" style="--a:${a}deg;--k:${k}">${s('0 0 200 200', '<ellipse cx="100" cy="100" rx="96" ry="34" fill="none" stroke-width="2.5"/><circle cx="196" cy="100" r="7"/>')}</i>`).join('');
  else if (def.p === 'traza') c.innerHTML = '<i class="traza">' + s('0 0 400 120', '<path d="M0 100 L60 70 L110 90 L170 40 L230 70 L290 30 L350 60 L400 20" fill="none" stroke-width="6" stroke-dasharray="14 10" stroke-linecap="round"/>', true) + '</i>';
  else if (def.p === 'pulso') c.innerHTML = '<i class="anillo"></i><i class="anillo segundo"></i>';
  return c;
}

// Devuelve { fondo, frente }: lo que va detrás de la carta y lo que va encima (golpes, coronas, campanas).
export function escenaMotivo(motivo) {
  const def = DEF_MOTIVOS[motivo];
  if (!def) return null;
  const fondo = document.createElement('div');
  fondo.className = `motivo motivo-${motivo}`;
  fondo.setAttribute('aria-hidden', 'true');
  const frente = document.createElement('div');
  frente.className = `motivo-frente motivo-${motivo}`;
  frente.setAttribute('aria-hidden', 'true');
  def.forEach((d, k) => (['golpe', 'baja', 'vaiven'].includes(d.p) ? frente : fondo).appendChild(capa(d, k * 3)));
  return { fondo, frente: frente.children.length ? frente : null };
}

export const ICONOS_MOTIVO = I;
