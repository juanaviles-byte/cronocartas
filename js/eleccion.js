// Qué mazo usa cada jugador según lo elegido en «Nueva partida».
export const CURSOS = [5, 6, 7, 8];

// mazo: 'curso' (los dos juegan con el mismo curso) o 'libre' (cada uno el suyo; el de la tablet puede ser 'azar').
export function mazosDePartida(eleccion, azar = Math.random) {
  const cursoA = Number(eleccion.cursoA);
  if (eleccion.mazo !== 'libre') return { cursoA, cursoB: cursoA, reforzar: !!eleccion.reforzar };
  const cursoB = eleccion.cursoB === 'azar' ? CURSOS[Math.floor(azar() * CURSOS.length)] : Number(eleccion.cursoB);
  // Reforzar una unidad no tiene sentido si cada mazo es de otro curso.
  return { cursoA, cursoB, reforzar: false };
}
