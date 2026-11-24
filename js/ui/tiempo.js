// El tiempo del juego: épocas de tableros y Lugares, y el contador de años del "viaje en el tiempo".

// { anio, aprox?, hoy? } → texto para mostrar.
export function textoAnio(e) {
  if (!e) return '';
  if (e.hoy) return 'Hoy';
  const n = Math.abs(e.anio);
  return `${e.aprox ? 'c. ' : ''}${n}${e.anio < 0 ? ' a. C.' : ''}`;
}

// 'pasado' si la llegada es anterior a la partida, 'futuro' si es posterior; null si no hay salto.
export function direccionViaje(desde, hasta) {
  if (!desde || !hasta || desde.anio === hasta.anio) return null;
  return hasta.anio < desde.anio ? 'pasado' : 'futuro';
}

// Año que muestra el contador en el instante t (0 a 1). Arranca rápido y frena al llegar; no existe el año 0.
export function anioEnViaje(desde, hasta, t) {
  const k = 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
  const a = Math.round(desde + (hasta - desde) * k);
  return a === 0 ? (hasta < desde ? -1 : 1) : a;
}

export const epocaDe = (epocas, id) => (epocas && id && epocas[id]) || null;

let epocas = null;
export const cargarEpocas = () => (epocas = epocas || fetch('data/epocas.json').then(r => (r.ok ? r.json() : {})).catch(() => ({})));
