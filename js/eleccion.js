// Qué mazo usa cada jugador según lo elegido en «Nueva partida».
import { COLECCIONES } from './colecciones.js';

export const CURSOS = [5, 6, 7, 8];
// En el modo libre, cada jugador elige un curso o una expansión.
export const MAZOS_LIBRES = [...CURSOS, ...COLECCIONES.map(c => c.id)];

const esCurso = m => CURSOS.includes(Number(m));

// mazo: 'curso' (los dos juegan con el mismo curso) o 'libre' (cada uno el suyo, curso o expansión;
// el de la tablet puede ser 'azar').
export function mazosDePartida(eleccion, azar = Math.random) {
  if (eleccion.mazo !== 'libre') {
    const cursoA = Number(eleccion.cursoA);
    return { cursoA, cursoB: cursoA, reforzar: !!eleccion.reforzar };
  }
  const a = eleccion.cursoA;
  const b = eleccion.cursoB === 'azar' ? MAZOS_LIBRES[Math.floor(azar() * MAZOS_LIBRES.length)] : eleccion.cursoB;
  // El lado de una expansión usa el curso del rival (de él salen el tablero y las unidades); si los dos son expansiones, 7°.
  const cursoA = esCurso(a) ? Number(a) : esCurso(b) ? Number(b) : 7;
  const cursoB = esCurso(b) ? Number(b) : cursoA;
  // Reforzar una unidad no tiene sentido si cada mazo es de otro curso.
  return { cursoA, cursoB, reforzar: false, coleccionA: esCurso(a) ? null : a, coleccionB: esCurso(b) ? null : b };
}
