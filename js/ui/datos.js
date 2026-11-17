// Carga un curso con todo lo de esta tablet: ediciones del docente,
// imágenes y cartas aprobadas del banco de ideas.
import { cargarCurso } from '../mazos.js';
import { almacen, CLAVES } from '../almacen.js';
import { leerImagenes } from '../imagenes.js';
import { extraerImagenes } from '../ediciones.js';
import { registrarImagenes } from './carta.js';

export async function cargarCursoCompleto(curso) {
  const d = await cargarCurso(curso, {
    comunidad: almacen.cartasComunidad(curso),
    ediciones: almacen.leer(CLAVES.ediciones, {}) || {},
    imagenes: await leerImagenes(),
  });
  // Las imágenes quedan en un mapa por código de carta; las cartas no las llevan.
  const c = extraerImagenes(d.cartas), a = extraerImagenes(d.aula);
  registrarImagenes({ ...c.mapa, ...a.mapa });
  return { ...d, cartas: c.cartas, aula: a.cartas };
}
