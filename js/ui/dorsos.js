// Dorsos temáticos: qué cara de atrás muestra cada mazo (data/dorsos.json).

// En un Duelo, el bando decide. En otro caso, la temática que más se repite en el mazo,
// siempre que sea al menos un 30 % y le gane a la segunda; si no, el dorso general
// (el de la colección, si la partida es de una expansión).
export function dorsoDeMazo(dorsos, cartas, bando, general = dorsos && dorsos.general) {
  if (!dorsos) return null;
  if (bando && dorsos.bandos[bando] && dorsos.temas[dorsos.bandos[bando]]) return dorsos.temas[dorsos.bandos[bando]];
  const cuenta = {};
  for (const c of cartas || []) { const t = dorsos.cartas[c.id]; if (t) cuenta[t] = (cuenta[t] || 0) + 1; }
  const orden = Object.entries(cuenta).sort((a, b) => b[1] - a[1]);
  const total = (cartas || []).length;
  if (orden.length && total && orden[0][1] / total >= 0.3 && (!orden[1] || orden[0][1] > orden[1][1])) return dorsos.temas[orden[0][0]] || general;
  return general;
}

let dorsos = null;
export const cargarDorsos = () => (dorsos ||= fetch('data/dorsos.json').then(r => (r.ok ? r.json() : null)).catch(() => null));
