// Equilibrio de las cartas creadas por estudiantes: un "presupuesto de poder".
import { DIMENSIONES } from './motor.js';

export const PRESUPUESTO = 14;
export const TIPOS = ['protagonista', 'acontecimiento', 'lugar'];

export function puntosPoder(carta) {
  const res = (carta.resistencia || 0) / 10;
  const acc = (carta.acciones || []).reduce((s, a) => s + Math.max(0, (a.danio || 0) / 10 - (a.costo || 0)), 0);
  return res + acc;
}

const largo = s => (typeof s === 'string' ? s.trim().length : 0);

export function validarPropuesta(p) {
  const err = [];
  if (!p || typeof p !== 'object') return ['La carta está vacía.'];
  if (largo(p.nombre) < 3 || largo(p.nombre) > 30) err.push('El nombre debe tener entre 3 y 30 letras.');
  if (!TIPOS.includes(p.tipo)) err.push('Elige un tipo de carta.');
  if (![5, 6, 7, 8].includes(Number(p.curso))) err.push('Elige el curso.');
  if (![1, 2, 3, 4].includes(Number(p.unidad))) err.push('Elige la unidad.');
  if (largo(p.dato) < 20) err.push('Escribe un dato histórico de al menos 20 letras.');
  if (largo(p.dato) > 220) err.push('El dato histórico es muy largo (máximo 220 letras).');
  if (largo(p.fuente) < 3) err.push('Cuenta dónde aprendiste el dato.');
  if (p.tipo === 'protagonista') {
    if (!DIMENSIONES.includes(p.dimension)) err.push('Elige una dimensión.');
    if (!(p.resistencia >= 50 && p.resistencia <= 120)) err.push('La resistencia va de 50 a 120.');
    const acc = p.acciones || [];
    if (acc.length < 1 || acc.length > 2) err.push('La carta necesita 1 o 2 acciones.');
    for (const a of acc) {
      if (largo(a.nombre) < 2 || largo(a.nombre) > 22) err.push('Cada acción necesita un nombre corto.');
      if (!(a.costo >= 1 && a.costo <= 3)) err.push('El costo de una acción va de 1 a 3 de Saber.');
      if (!(a.danio >= 0 && a.danio <= 100)) err.push('El daño va de 0 a 100.');
    }
    if (puntosPoder(p) > PRESUPUESTO) err.push(`La carta es demasiado poderosa (${puntosPoder(p)} de ${PRESUPUESTO} puntos).`);
  }
  if ((p.tipo === 'acontecimiento' || p.tipo === 'lugar') && !(p.efecto && p.efecto.tipo)) err.push('Elige qué hace la carta.');
  return err;
}
