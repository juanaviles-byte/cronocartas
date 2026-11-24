// Qué mazo usa cada jugador según lo elegido en «Nueva partida».
import { COLECCIONES } from './colecciones.js';

export const CURSOS = [5, 6, 7, 8];
// En el modo libre, cada jugador elige un curso o una expansión.
export const MAZOS_LIBRES = [...CURSOS, ...COLECCIONES.map(c => c.id)];

const esCurso = m => CURSOS.includes(Number(m));

// mazo: 'curso' (los dos juegan con el mismo curso) o 'libre' (cada uno el suyo, curso o expansión;
// cualquiera de los dos puede ser 'azar').
export function mazosDePartida(eleccion, azar = Math.random) {
  if (eleccion.mazo !== 'libre') {
    const cursoA = Number(eleccion.cursoA);
    return { cursoA, cursoB: cursoA, reforzar: !!eleccion.reforzar };
  }
  const sortear = m => (m === 'azar' ? MAZOS_LIBRES[Math.min(MAZOS_LIBRES.length - 1, Math.floor(azar() * MAZOS_LIBRES.length))] : m);
  const a = sortear(eleccion.cursoA);
  const b = sortear(eleccion.cursoB);
  // El lado de una expansión usa el curso del rival (de él salen el tablero y las unidades); si los dos son expansiones, 7°.
  const cursoA = esCurso(a) ? Number(a) : esCurso(b) ? Number(b) : 7;
  const cursoB = esCurso(b) ? Number(b) : cursoA;
  // Reforzar una unidad no tiene sentido si cada mazo es de otro curso.
  return { cursoA, cursoB, reforzar: false, coleccionA: esCurso(a) ? null : a, coleccionB: esCurso(b) ? null : b,
    // Si algún mazo salió al azar, la partida recuerda lo elegido y «Otra partida» lo vuelve a sortear.
    ...(eleccion.cursoA === 'azar' || eleccion.cursoB === 'azar' ? { azarLibre: { cursoA: eleccion.cursoA, cursoB: eleccion.cursoB } } : {}) };
}

// Tableros que se pueden elegir (y de los que sale «Sorpresa»): en el modo libre, los de todos los cursos;
// si no, solo los del curso.
export function tablerosDisponibles(tableros, { libre = false, curso = null } = {}) {
  return libre ? tableros.slice() : tableros.filter(t => t.curso === curso);
}
