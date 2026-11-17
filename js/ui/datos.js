// Carga un curso con todo lo de esta tablet: ediciones del docente,
// imágenes y cartas aprobadas del banco de ideas.
import { cargarCurso } from '../mazos.js';
import { almacen, CLAVES } from '../almacen.js';
import { leerImagenes } from '../imagenes.js';

export async function cargarCursoCompleto(curso) {
  return cargarCurso(curso, {
    comunidad: almacen.cartasComunidad(curso),
    ediciones: almacen.leer(CLAVES.ediciones, {}) || {},
    imagenes: await leerImagenes(),
  });
}
