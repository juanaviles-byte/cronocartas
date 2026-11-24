// Álbum de colección: cada tablet recuerda qué cartas se han visto boca arriba en una partida.
// Completar una unidad entrega una insignia. No guarda nombres de estudiantes.
import { CLAVES } from './almacen.js';

// Cartas que el jugador humano pudo ver: la mesa, los Lugares, los descartes y su propia mano.
export function cartasVisibles(estado, humanos = ['A', 'B']) {
  const v = new Set();
  const poner = c => { if (c && c.carta && c.carta.id) v.add(c.carta.id); };
  for (const j of ['A', 'B']) {
    const yo = estado.jugadores[j];
    poner(yo.activo);
    yo.reserva.forEach(poner);
    yo.descarte.forEach(poner);
    if (humanos.includes(j)) yo.mano.forEach(poner);
  }
  poner(estado.lugar);
  return v;
}

export function crearAlbum(almacen) {
  const leer = () => {
    const a = almacen.leer(CLAVES.album, null);
    return { descubiertas: Array.isArray(a && a.descubiertas) ? a.descubiertas : [], insignias: Array.isArray(a && a.insignias) ? a.insignias : [] };
  };
  const cuentan = cartas => cartas.filter(c => !c.comunidad);

  function descubrir(ids, cartas, unidadesPorCurso = {}) {
    const a = leer();
    const ya = new Set(a.descubiertas);
    const validas = new Set(cuentan(cartas).map(c => c.id));
    const nuevas = [...new Set(ids)].filter(id => validas.has(id) && !ya.has(id));
    nuevas.forEach(id => ya.add(id));
    const insignias = [];
    const tocadas = new Set(cuentan(cartas).filter(c => nuevas.includes(c.id) && c.unidad).map(c => `${c.curso}-${c.unidad}`));
    for (const clave of tocadas) {
      if (a.insignias.some(i => i.clave === clave)) continue;
      const [curso, unidad] = clave.split('-').map(Number);
      const deUnidad = cuentan(cartas).filter(c => c.curso === curso && c.unidad === unidad);
      if (deUnidad.length && deUnidad.every(c => ya.has(c.id))) {
        const nombre = (unidadesPorCurso[curso] || [])[unidad - 1] || `Unidad ${unidad}`;
        insignias.push({ clave, curso, unidad, nombre });
      }
    }
    if (nuevas.length) almacen.guardar(CLAVES.album, { descubiertas: [...ya], insignias: [...a.insignias, ...insignias] });
    return { nuevas, insignias };
  }

  function progreso(cartas) {
    const ya = new Set(leer().descubiertas);
    const unidades = [...new Set(cuentan(cartas).filter(c => c.unidad).map(c => c.unidad))].sort((x, y) => x - y);
    return unidades.map(unidad => {
      const de = cuentan(cartas).filter(c => c.unidad === unidad);
      return { unidad, total: de.length, descubiertas: de.filter(c => ya.has(c.id)).length };
    });
  }

  return {
    descubrir,
    progreso,
    tiene: id => leer().descubiertas.includes(id),
    insignias: () => leer().insignias,
    reiniciar: () => almacen.borrar(CLAVES.album),
  };
}
