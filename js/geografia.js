// Minijuego de geografía: mapas y zonas donde se sitúan las cartas de las expansiones.
// Las posiciones (x, y) van en % del mapa; las calcula gen/mapas.py con datos de Natural Earth.
export const MAPAS = {
  mundo: {
    imagen: 'img/mapas/mundo.svg', proporcion: 933 / 320,
    zonas: [
      { id: 'mesoamerica', nombre: 'Mesoamérica', x: 10.5, y: 66.9 },
      { id: 'escandinavia', nombre: 'Escandinavia', x: 50.2, y: 12.5 },
      { id: 'grecia', nombre: 'Grecia', x: 53.6, y: 41.2 },
      { id: 'egipto', nombre: 'Egipto', x: 56.7, y: 56.9 },
      { id: 'india', nombre: 'India', x: 74.0, y: 61.9 },
      { id: 'china', nombre: 'China', x: 83.6, y: 47.5 },
      { id: 'japon', nombre: 'Japón', x: 95.8, y: 44.4 },
    ],
  },
  chile: {
    imagen: 'img/mapas/chile.svg', proporcion: 220 / 478,
    zonas: [
      { id: 'rapanui', nombre: 'Rapa Nui', x: 33.6, y: 15.5 },
      { id: 'norte', nombre: 'Norte Grande', x: 71.3, y: 8.0 },
      { id: 'atacama', nombre: 'Desierto de Atacama', x: 73.9, y: 19.6 },
      { id: 'central', nombre: 'Zona central', x: 65.7, y: 42.2 },
      { id: 'araucania', nombre: 'Araucanía', x: 58.7, y: 55.0 },
      { id: 'chiloe', nombre: 'Chiloé', x: 52.6, y: 64.8 },
      { id: 'fuego', nombre: 'Tierra del Fuego', x: 73.0, y: 93.2 },
    ],
  },
};

export const nombreZona = (mapa, id) => {
  const z = MAPAS[mapa] && MAPAS[mapa].zonas.find(x => x.id === id);
  return z ? z.nombre : id;
};

// La pregunta que se le hace al jugador por una carta (o null si la carta no tiene origen).
// opciones: ids de zona (mapa) o textos (selección); correctas: las que valen.
export function preguntaDe(carta, rng) {
  const o = carta && carta.origen;
  if (!o) return null;
  const base = { id: carta.id, nombre: carta.nombre };
  if (o.mapa && MAPAS[o.mapa]) {
    return { ...base, mapa: o.mapa, texto: `¿De dónde viene ${carta.nombre}? Toca su lugar en el mapa.`,
      opciones: MAPAS[o.mapa].zonas.map(z => z.id), correctas: o.zonas.slice() };
  }
  if (o.respuesta) {
    const opciones = [o.respuesta, ...(o.otras || [])];
    for (let i = opciones.length - 1; i > 0; i--) { const k = Math.floor(rng() * (i + 1)); [opciones[i], opciones[k]] = [opciones[k], opciones[i]]; }
    return { ...base, mapa: null, texto: o.pregunta || `¿De dónde viene ${carta.nombre}?`, opciones, correctas: [o.respuesta] };
  }
  return null;
}
