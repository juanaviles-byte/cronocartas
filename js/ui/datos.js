// Carga un curso con todo lo de esta tablet: ediciones del docente,
// imágenes y cartas aprobadas del banco de ideas.
import { cargarCurso } from '../mazos.js';
import { almacen, CLAVES } from '../almacen.js';
import { leerImagenes } from '../imagenes.js';
import { extraerImagenes } from '../ediciones.js';
import { registrarImagenes, registrarEscenarios } from './carta.js';

// Ilustraciones que trae el juego (data/arte.json). Las que sube el docente en esta tablet tienen prioridad.
// Si la descarga falla (o llega algo que no es la lista), no se guarda: se vuelve a pedir en la próxima carga.
function pedirLista(ruta) {
  return fetch(ruta).then(r => (r.ok ? r.json() : null)).catch(() => null)
    .then(m => (m && typeof m === 'object' && !Array.isArray(m) && Object.keys(m).length ? m : null));
}
let arteDelJuego = null;
async function cargarArte() {
  if (arteDelJuego) return arteDelJuego;
  const m = await pedirLista('data/arte.json');
  if (m) arteDelJuego = m; else arteDelJuego = null;
  return m || {};
}

// Escenarios de mesa de los Lugares (data/escenarios.json).
let escenarios = null;
async function cargarEscenarios() {
  if (escenarios) return escenarios;
  const m = await pedirLista('data/escenarios.json');
  if (m) { escenarios = m; registrarEscenarios(m); }
  return m || {};
}

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
