// Mover cartas entre tablets con un código de texto ("CC1:...").
// Más adelante este mismo código puede viajar dentro de un QR.
import { validarPropuesta } from './balance.js';

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

export function exportarCartas(cartas) {
  const limpias = cartas.map(c => {
    const { enMazo, ...resto } = c;
    if (resto.imagen && resto.imagen.length > IMAGEN_MAX) delete resto.imagen;
    return resto;
  });
  return PREFIJO + aBase64(JSON.stringify({ v: 1, cartas: limpias }));
}

export function importarCartas(texto) {
  const errores = [];
  try {
    const t = typeof texto === 'string' ? texto.trim() : '';
    if (!t.startsWith(PREFIJO)) return { cartas: [], errores: ['El código no es de Cronocartas (debe empezar con CC1:).'] };
    const datos = JSON.parse(deBase64(t.slice(PREFIJO.length)));
    if (!datos || !Array.isArray(datos.cartas)) return { cartas: [], errores: ['El código no trae cartas.'] };
    const cartas = [];
    datos.cartas.forEach((c, i) => {
      const e = validarPropuesta(c);
      if (e.length) errores.push(`Carta ${i + 1} (${(c && c.nombre) || 'sin nombre'}): ${e[0]}`);
      else cartas.push(c);
    });
    return { cartas, errores };
  } catch {
    return { cartas: [], errores: ['El código está incompleto o fue modificado. Cópialo de nuevo.'] };
  }
}
