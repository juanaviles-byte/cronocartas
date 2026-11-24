// Novedades (actualizaciones y noticias, data/novedades.json): cuáles ya vio esta tablet.
import { CLAVES } from './almacen.js';

const vistas = almacen => {
  const v = almacen.leer(CLAVES.novedades, []);
  return Array.isArray(v) ? v : [];
};

export function noLeidas(novedades, almacen) {
  const v = vistas(almacen);
  return (novedades || []).filter(n => v.indexOf(n.id) < 0).length;
}

export function marcarLeidas(novedades, almacen) {
  const v = vistas(almacen);
  for (const n of novedades || []) if (v.indexOf(n.id) < 0) v.push(n.id);
  almacen.guardar(CLAVES.novedades, v);
}
