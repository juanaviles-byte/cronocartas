// Generador pseudoaleatorio con semilla (mulberry32). Su estado es un número,
// así la partida completa se puede guardar como JSON y repetir.
export function rngDesdeEstado(estadoInicial) {
  let s = estadoInicial >>> 0;
  return {
    siguiente() {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    get estado() { return s; },
  };
}

export function crearRng(semilla) {
  return rngDesdeEstado(semilla);
}

export function barajar(lista, rng) {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng.siguiente() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
