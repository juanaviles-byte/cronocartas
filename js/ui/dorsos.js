// Dorsos temáticos: qué cara de atrás muestra cada mazo (data/dorsos.json).

// En un Duelo, el bando decide. En otro caso, la temática que más se repite en el mazo,
// siempre que sea al menos un 30 % y le gane a la segunda. Si no hay una clara:
// - un lado de expansión usa el dorso de su colección;
// - un mazo de curso con semilla (modo libre y partidas de curso) usa un arquetipo al azar entre los de sus cartas,
//   distinto del rival si se puede; la semilla lo fija, así al retomar la partida el dorso no cambia;
// - sin semilla, el dorso general.
export function dorsoDeMazo(dorsos, cartas, bando, general, azar) {
  if (!dorsos) return null;
  const propio = general != null;
  if (!propio) general = dorsos.general;
  if (bando && dorsos.bandos[bando] && dorsos.temas[dorsos.bandos[bando]]) return dorsos.temas[dorsos.bandos[bando]];
  const cuenta = {};
  // El Aula está en los mazos de todos los cursos: no es un arquetipo y no cuenta para elegir el dorso.
  const historicas = (cartas || []).filter(c => dorsos.cartas[c.id] !== 'aula');
  for (const c of historicas) { const t = dorsos.cartas[c.id]; if (t && dorsos.temas[t]) cuenta[t] = (cuenta[t] || 0) + 1; }
  const orden = Object.entries(cuenta).sort((a, b) => b[1] - a[1]);
  const total = historicas.length;
  if (orden.length && total && orden[0][1] / total >= 0.3 && (!orden[1] || orden[0][1] > orden[1][1])) return dorsos.temas[orden[0][0]] || general;
  if (propio || !azar || azar.semilla == null || !orden.length) return general;
  let opciones = Object.keys(cuenta).sort().map(t => dorsos.temas[t]);
  if (azar.evitar && opciones.length > 1) opciones = opciones.filter(r => r !== azar.evitar);
  return opciones[mezclar(azar.semilla) % opciones.length];
}

// Un entero a partir de la semilla, bien repartido (semillas seguidas no dan dorsos seguidos).
function mezclar(n) {
  let x = (Math.floor(Number(n)) || 0) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

let dorsos = null;
export const cargarDorsos = () => (dorsos = dorsos || fetch('data/dorsos.json').then(r => (r.ok ? r.json() : null)).catch(() => null));
