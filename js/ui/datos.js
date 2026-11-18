// Carga un curso con todo lo de esta tablet: ediciones del docente,
// imágenes y cartas aprobadas del banco de ideas.
import { cargarCurso } from '../mazos.js';
import { almacen, CLAVES } from '../almacen.js';
import { leerImagenes } from '../imagenes.js';
import { extraerImagenes } from '../ediciones.js';
import { registrarImagenes, registrarEscenarios } from './carta.js';

// Ilustraciones que trae el juego (data/arte.json). Las que sube el docente en esta tablet tienen prioridad.
let arteDelJuego = null;
const cargarArte = () => (arteDelJuego ||= fetch('data/arte.json').then(r => (r.ok ? r.json() : {})).catch(() => ({})));

// Escenarios de mesa de los Lugares (data/escenarios.json).
let escenarios = null;
const cargarEscenarios = () => (escenarios ||= fetch('data/escenarios.json').then(r => (r.ok ? r.json() : {})).catch(() => ({})).then(m => { registrarEscenarios(m); return m; }));

export async function cargarCursoCompleto(curso) {
  await cargarEscenarios();
  const d = await cargarCurso(curso, {
    comunidad: almacen.cartasComunidad(curso),
    ediciones: almacen.leer(CLAVES.ediciones, {}) || {},
    imagenes: await leerImagenes(),
  });
  // Las imágenes quedan en un mapa por código de carta; las cartas no las llevan.
  const c = extraerImagenes(d.cartas), a = extraerImagenes(d.aula);
  registrarImagenes({ ...(await cargarArte()), ...c.mapa, ...a.mapa });
  return { ...d, cartas: c.cartas, aula: a.cartas };
}
