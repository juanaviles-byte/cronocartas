// Ediciones del docente sobre las cartas oficiales: textos (en la tablet) e
// imágenes (en IndexedDB). Este módulo es puro: mezcla, limpia y empaqueta.
import { validarCarta } from './mazos.js';
import { EMBLEMAS } from './ui/arte.js';

export const CAMPOS_EDITABLES = ['nombre', 'dato', 'resistencia', 'acciones', 'emblema'];
const ID_VALIDO = /^CC-(\d-U\d-\d{3}|A-E\d{1,2})$/;
const IMAGEN_VALIDA = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const IMAGEN_MAX = 1500000;

const texto = (v, max) => (typeof v === 'string' ? v.slice(0, max) : undefined);
const numero = v => (v === '' || v == null || !Number.isFinite(Number(v)) ? undefined : Number(v));

export function limpiarEdicion(e) {
  if (!e || typeof e !== 'object') return {};
  const out = {};
  const nombre = texto(e.nombre, 30); if (nombre && nombre.trim()) out.nombre = nombre;
  const dato = texto(e.dato, 220); if (dato && dato.trim()) out.dato = dato;
  // Solo los valores que permite el editor: resistencia 50–120 de 10 en 10,
  // costo entero 1–3, daño 0–100 de 10 en 10. Si algo no calza, ese campo no se edita.
  const res = numero(e.resistencia);
  if (res !== undefined && res >= 50 && res <= 120 && res % 10 === 0) out.resistencia = res;
  if (EMBLEMAS.includes(e.emblema)) out.emblema = e.emblema;
  if (Array.isArray(e.acciones) && e.acciones.length) {
    const acciones = e.acciones.slice(0, 2).map(a => ({
      nombre: (texto(a && a.nombre, 22) || '').trim(), costo: numero(a && a.costo), danio: numero(a && a.danio),
    }));
    const valida = a => a.nombre && Number.isInteger(a.costo) && a.costo >= 1 && a.costo <= 3 &&
      Number.isInteger(a.danio) && a.danio >= 0 && a.danio <= 100 && a.danio % 10 === 0;
    if (acciones.every(valida)) out.acciones = acciones;
  }
  return out;
}

// Saca las imágenes de las cartas a un mapa aparte. Así las partidas guardadas
// no copian imágenes pesadas en cada jugada.
export function extraerImagenes(cartas) {
  const mapa = {};
  const limpias = cartas.map(c => {
    if (!c.imagen) return c;
    mapa[c.id] = c.imagen;
    const { imagen, ...resto } = c;
    return resto;
  });
  return { cartas: limpias, mapa };
}

export function aplicarEdiciones(cartas, ediciones = {}, imagenes = {}) {
  return cartas.map(c => {
    let r = c;
    const ed = ediciones[c.id];
    if (ed) {
      const limpia = limpiarEdicion(ed);
      if (c.tipo !== 'protagonista') { delete limpia.resistencia; delete limpia.acciones; }
      const mezcla = { ...c, ...limpia };
      if (validarCarta(mezcla).length === 0) r = mezcla;
    }
    const img = imagenes[c.id];
    if (typeof img === 'string' && IMAGEN_VALIDA.test(img)) r = { ...r, imagen: img };
    return r;
  });
}

export function crearPaquete(ediciones, imagenes) {
  return { app: 'cronocartas', tipo: 'ediciones', v: 1, creado: new Date().toISOString(), ediciones, imagenes };
}

export function sanearPaquete(entrada) {
  // errores: el archivo no sirve. avisos: entradas que se ignoraron.
  const vacio = errores => ({ ediciones: {}, imagenes: {}, errores, avisos: [] });
  let p = entrada;
  try { if (typeof p === 'string') p = JSON.parse(p); } catch { return vacio(['El archivo no es un paquete de ediciones de Cronocartas.']); }
  if (!p || typeof p !== 'object' || p.app !== 'cronocartas' || p.tipo !== 'ediciones') return vacio(['El archivo no es un paquete de ediciones de Cronocartas.']);
  if ((p.ediciones && typeof p.ediciones !== 'object') || (p.imagenes && typeof p.imagenes !== 'object') || Array.isArray(p.ediciones)) {
    return vacio(['El archivo está dañado.']);
  }
  const ediciones = {}, imagenes = {}, avisos = [];
  for (const [id, ed] of Object.entries(p.ediciones || {})) {
    if (!ID_VALIDO.test(id)) { avisos.push('Se ignoró una edición con código desconocido.'); continue; }
    const l = limpiarEdicion(ed);
    if (Object.keys(l).length) ediciones[id] = l;
  }
  for (const [id, img] of Object.entries(p.imagenes || {})) {
    if (!ID_VALIDO.test(id) || typeof img !== 'string' || img.length > IMAGEN_MAX || !IMAGEN_VALIDA.test(img)) {
      avisos.push(`Se ignoró una imagen no válida (${ID_VALIDO.test(id) ? id : 'código desconocido'}).`);
      continue;
    }
    imagenes[id] = img;
  }
  return { ediciones, imagenes, errores: [], avisos };
}
