// Mover cartas entre tablets con un código de texto ("CC1:...").
// Más adelante este mismo código puede viajar dentro de un QR.
import { validarPropuesta, efectoPermitido } from './balance.js';
import { EMBLEMAS } from './ui/arte.js';

const PREFIJO = 'CC1:';
const IMAGEN_MAX = 60 * 1024;

function aBase64(texto) {
  const bytes = new TextEncoder().encode(texto);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function deBase64(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

const texto = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
const numero = v => (Number.isFinite(Number(v)) ? Number(v) : NaN);
const ESTADOS = ['pendiente', 'aprobada', 'devuelta', 'descartada'];

function idSeguro(c) {
  if (typeof c.id === 'string' && /^CC-COM-[a-z0-9]+$/.test(c.id)) return c.id;
  let h = 0;
  for (const ch of `${c.nombre}|${c.dato}`) h = (Math.imul(h, 31) + ch.codePointAt(0)) >>> 0;
  return `CC-COM-i${h.toString(36)}`;
}

// Reconstruye la carta solo con los campos que el banco de ideas conoce.
// Lo demás que traiga un código (editado a mano o dañado) se descarta.
export function sanear(c) {
  if (!c || typeof c !== 'object') return null;
  const s = {
    id: idSeguro(c), nombre: texto(c.nombre, 30), tipo: c.tipo, curso: numero(c.curso), unidad: numero(c.unidad),
    dato: texto(c.dato, 220), fuente: texto(c.fuente, 80), autor: texto(c.autor, 24),
    emblema: EMBLEMAS.includes(c.emblema) ? c.emblema : 'estrella',
    estado: ESTADOS.includes(c.estado) ? c.estado : 'pendiente', comentario: texto(c.comentario, 200),
  };
  if (typeof c.creada === 'string') s.creada = c.creada.slice(0, 30);
  if (typeof c.imagen === 'string' && c.imagen.startsWith('data:image/jpeg;base64,') && c.imagen.length <= 200000) s.imagen = c.imagen;
  if (c.tipo === 'protagonista') {
    s.dimension = c.dimension;
    s.resistencia = numero(c.resistencia);
    s.retirada = 1;
    s.acciones = (Array.isArray(c.acciones) ? c.acciones.slice(0, 2) : []).map(a => ({
      nombre: texto(a && a.nombre, 22), costo: numero(a && a.costo), danio: numero(a && a.danio),
    }));
  } else if (c.tipo === 'acontecimiento') {
    if (!efectoPermitido(c.efecto)) return null;
    s.efecto = c.efecto.n == null ? { tipo: c.efecto.tipo } : { tipo: c.efecto.tipo, n: c.efecto.n };
  } else if (c.tipo === 'lugar') {
    s.dimension = c.dimension;
    s.efecto = { tipo: 'bonusDimension', dimension: c.dimension, n: 10 };
  }
  return s;
}

export function resumenExportacion(cartas) {
  return { sinImagen: cartas.filter(c => c.imagen && c.imagen.length > IMAGEN_MAX).map(c => c.nombre) };
}

export function exportarCartas(cartas) {
  const limpias = cartas.map(c => {
    const { enMazo, ...resto } = c;
    if (resto.imagen && resto.imagen.length > IMAGEN_MAX) delete resto.imagen;
    return resto;
  });
  return PREFIJO + aBase64(JSON.stringify({ v: 1, cartas: limpias }));
}

export function importarCartas(codigo) {
  const errores = [];
  try {
    const t = typeof codigo === 'string' ? codigo.trim() : '';
    if (!t.startsWith(PREFIJO)) return { cartas: [], errores: ['El código no es de Cronocartas (debe empezar con CC1:).'] };
    const datos = JSON.parse(deBase64(t.slice(PREFIJO.length)));
    if (!datos || !Array.isArray(datos.cartas)) return { cartas: [], errores: ['El código no trae cartas.'] };
    const cartas = [];
    datos.cartas.forEach((c, i) => {
      const limpia = sanear(c);
      const e = limpia ? validarPropuesta(limpia) : ['tiene un efecto que no existe en el banco de ideas.'];
      if (e.length) errores.push(`Carta ${i + 1} (${texto(c && c.nombre, 30) || 'sin nombre'}): ${e[0]}`);
      else cartas.push(limpia);
    });
    return { cartas, errores };
  } catch {
    return { cartas: [], errores: ['El código está incompleto o fue modificado. Cópialo de nuevo.'] };
  }
}
