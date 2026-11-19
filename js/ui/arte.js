import { FUERZAS } from '../colecciones.js';
// Ilustraciones originales de las cartas: un emblema simple sobre el color
// de su dimensión. Sin fotos ni retratos: todo se dibuja aquí.

export const COLORES = {
  Politica: '#B83A26',
  Economia: '#B9850F',
  Sociedad: '#2C64A8',
  Cultura: '#6E43A6',
  Territorio: '#2B7D52',
  personaje: '#9A5B2E',
  acontecimiento: '#4E5964',
  lugar: '#2F7178',
  aula: '#1D3557',
  ...Object.fromEntries(Object.entries(FUERZAS).map(([k, f]) => [k, f.tema.base])),
};

export function colorCarta(carta) {
  if (carta.tipo === 'protagonista') return COLORES[carta.dimension] || '#555';
  if (carta.tipo === 'lugar') return COLORES[carta.efecto?.dimension] ? COLORES.lugar : COLORES.lugar;
  return COLORES[carta.tipo] || '#555';
}

// Emblemas en una grilla de 100×100, solo trazos.
const E = {
  corona: '<path d="M20 70 L25 35 L40 55 L50 28 L60 55 L75 35 L80 70 Z"/><path d="M22 78 H78"/>',
  moneda: '<circle cx="50" cy="50" r="28"/><circle cx="50" cy="50" r="19"/><path d="M50 38 V62 M43 44 H55 Q60 44 58 50 Q56 54 45 54 M45 54 Q56 56 55 60 H43"/>',
  personas: '<circle cx="35" cy="38" r="9"/><circle cx="65" cy="38" r="9"/><circle cx="50" cy="32" r="10"/><path d="M20 75 Q35 50 50 52 Q65 50 80 75"/>',
  pergamino: '<path d="M30 25 H70 V72 Q70 80 62 80 H30 Q38 80 38 72 V25"/><path d="M30 25 Q22 25 22 32 Q22 38 30 38"/><path d="M46 40 H62 M46 50 H62 M46 60 H58"/>',
  montana: '<path d="M12 78 L38 32 L52 55 L62 42 L88 78 Z"/><path d="M32 43 L38 32 L45 44"/>',
  barco: '<path d="M18 62 H82 L72 78 H28 Z"/><path d="M50 62 V18"/><path d="M50 22 L74 50 H50"/><path d="M50 26 L30 52 H50"/>',
  templo: '<path d="M18 38 L50 18 L82 38 Z"/><path d="M26 42 V72 M40 42 V72 M60 42 V72 M74 42 V72"/><path d="M18 78 H82"/>',
  escudo: '<path d="M50 18 L78 28 V50 Q78 70 50 82 Q22 70 22 50 V28 Z"/><path d="M50 32 V68 M36 48 H64"/>',
  libro: '<path d="M50 30 Q36 22 20 26 V74 Q36 70 50 78 Q64 70 80 74 V26 Q64 22 50 30 Z"/><path d="M50 30 V78"/>',
  columna: '<path d="M30 24 H70 M34 30 H66"/><path d="M38 30 V72 M46 30 V72 M54 30 V72 M62 30 V72"/><path d="M30 78 H70 M34 72 H66"/>',
  piramide: '<path d="M14 78 L50 22 L86 78 Z"/><path d="M50 22 L58 78"/><path d="M30 54 H70"/>',
  campana: '<path d="M30 68 Q32 30 50 28 Q68 30 70 68 Z"/><path d="M24 68 H76"/><circle cx="50" cy="76" r="5"/><path d="M50 20 V28"/>',
  pluma: '<path d="M72 18 Q40 26 30 66 L26 80"/><path d="M72 18 Q70 50 34 62"/><path d="M48 40 L60 32"/>',
  mapa: '<path d="M18 28 L40 20 L60 28 L82 20 V72 L60 80 L40 72 L18 80 Z"/><path d="M40 20 V72 M60 28 V80"/><path d="M26 50 Q36 42 46 52 T70 46" stroke-dasharray="4 4"/>',
  urna: '<path d="M24 46 H76 V78 H24 Z"/><path d="M40 46 V54 H60 V46"/><path d="M40 22 H62 V44 H40 Z"/><path d="M45 30 H57 M45 36 H55"/>',
  balanza: '<path d="M50 20 V78 M34 78 H66"/><path d="M22 34 H78"/><path d="M22 34 L14 56 H30 Z M78 34 L70 56 H86 Z"/>',
  tren: '<path d="M26 28 H74 V66 H26 Z"/><path d="M26 46 H74"/><circle cx="38" cy="74" r="6"/><circle cx="62" cy="74" r="6"/><path d="M34 34 H46 V42 H34 Z M54 34 H66 V42 H54 Z"/>',
  volcan: '<path d="M14 80 L38 40 H62 L86 80 Z"/><path d="M44 40 Q42 26 50 20 Q58 26 56 40"/>',
  arbol: '<path d="M50 80 V50"/><circle cx="50" cy="38" r="20"/><path d="M50 58 L38 48 M50 54 L62 44"/>',
  sol: '<circle cx="50" cy="50" r="15"/><path d="M50 16 V26 M50 74 V84 M16 50 H26 M74 50 H84 M26 26 L33 33 M67 67 L74 74 M26 74 L33 67 M67 33 L74 26"/>',
  maiz: '<path d="M50 18 Q64 34 60 58 Q56 76 50 80 Q44 76 40 58 Q36 34 50 18 Z"/><path d="M44 36 H56 M42 46 H58 M42 56 H58 M44 66 H56"/><path d="M50 80 Q34 66 28 46 M50 80 Q66 66 72 46"/>',
  casa: '<path d="M18 48 L50 22 L82 48"/><path d="M26 44 V78 H74 V44"/><path d="M44 78 V58 H56 V78"/>',
  estrella: '<path d="M50 16 L59 40 L84 40 L64 55 L72 80 L50 64 L28 80 L36 55 L16 40 L41 40 Z"/>',
  engranaje: '<circle cx="50" cy="50" r="14"/><path d="M50 18 V30 M50 70 V82 M18 50 H30 M70 50 H82 M27 27 L36 36 M64 64 L73 73 M27 73 L36 64 M64 36 L73 27"/><circle cx="50" cy="50" r="24"/>',
  ola: '<path d="M12 46 Q24 34 36 46 T60 46 T84 46"/><path d="M12 60 Q24 48 36 60 T60 60 T84 60"/><path d="M12 74 Q24 62 36 74 T60 74 T84 74"/>',
  medalla: '<path d="M36 14 L44 40 M64 14 L56 40"/><circle cx="50" cy="60" r="22"/><path d="M50 48 L54 57 L63 58 L56 64 L58 73 L50 68 L42 73 L44 64 L37 58 L46 57 Z"/>',
  ancla: '<circle cx="50" cy="24" r="7"/><path d="M50 31 V80 M36 42 H64"/><path d="M22 60 Q26 80 50 80 Q74 80 78 60"/>',
};

export const EMBLEMAS = Object.keys(E);

// Paleta por tipo de carta, al estilo de los tipos de un TCG.
export const TEMAS = {
  Politica:       { base: '#C0392B', claro: '#F6C1B4', oscuro: '#7A1E12', papel: '#FDEDE8', icono: 'columna' },
  Economia:       { base: '#C98A0B', claro: '#F7DE97', oscuro: '#7C5205', papel: '#FFF6DD', icono: 'moneda' },
  Sociedad:       { base: '#2C64A8', claro: '#B9D3F2', oscuro: '#173E6E', papel: '#EAF2FC', icono: 'personas' },
  Cultura:        { base: '#7344B0', claro: '#D6C3F0', oscuro: '#45246F', papel: '#F3EDFB', icono: 'pluma' },
  Territorio:     { base: '#2B8152', claro: '#B5E0C4', oscuro: '#16502F', papel: '#E8F6EC', icono: 'montana' },
  personaje:      { base: '#9A5B2E', claro: '#EBC9A3', oscuro: '#5A3216', papel: '#FBF0E4', icono: 'medalla' },
  acontecimiento: { base: '#56626E', claro: '#CDD5DC', oscuro: '#2E363E', papel: '#F1F4F6', icono: 'pergamino' },
  lugar:          { base: '#23807F', claro: '#B2E3E0', oscuro: '#11504F', papel: '#E6F6F5', icono: 'mapa' },
  aula:           { base: '#1D3557', claro: '#E9C46A', oscuro: '#0F1E33', papel: '#F6F1E3', icono: 'libro' },
  ...Object.fromEntries(Object.entries(FUERZAS).map(([k, f]) => [k, f.tema])),
};

export function temaCarta(carta) {
  if (carta.tipo === 'protagonista') return TEMAS[carta.dimension] || TEMAS.acontecimiento;
  // En una expansión, el Lugar toma el color de la fuerza que favorece.
  if (carta.tipo === 'lugar' && carta.coleccion && TEMAS[carta.efecto?.dimension]) return TEMAS[carta.efecto.dimension];
  return TEMAS[carta.tipo] || TEMAS.acontecimiento;
}

// Ícono redondo de un tipo o dimensión (como el símbolo de energía de un TCG).
export function iconoTipo(clave, tam = 22) {
  const t = TEMAS[clave] || TEMAS.acontecimiento;
  return `<svg class="icono-tipo" viewBox="0 0 100 100" width="${tam}" height="${tam}" aria-hidden="true"><circle cx="50" cy="50" r="48" fill="${t.base}" stroke="#fff" stroke-width="6"/>` +
    `<g transform="translate(18 18) scale(.64)" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">${E[t.icono]}</g></svg>`;
}

export function iconoEmblema(nombre) {
  return `<svg viewBox="0 0 100 100" width="32" height="32" aria-label="${nombre}"><g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${E[nombre] || E.estrella}</g></svg>`;
}

export function arteCarta(carta) {
  const color = colorCarta(carta);
  const emblema = E[carta.emblema] || E.estrella;
  const fondo = carta.tipo === 'aula'
    ? `<rect width="100" height="100" fill="${color}"/><circle cx="50" cy="50" r="38" fill="none" stroke="#E9C46A" stroke-width="1.5" opacity=".6"/>`
    : `<rect width="100" height="100" fill="${color}"/><circle cx="82" cy="14" r="40" fill="#fff" opacity=".08"/><circle cx="10" cy="96" r="30" fill="#000" opacity=".08"/>`;
  const trazo = carta.tipo === 'aula' ? '#E9C46A' : '#fff';
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${fondo}` +
    `<g fill="none" stroke="${trazo}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".95">${emblema}</g></svg>`;
}
