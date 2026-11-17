// Carga, revisión y armado de mazos. Los mazos viven en data/*.json para que
// se puedan corregir o ampliar sin tocar el código.
import { DIMENSIONES } from './motor.js';
import { barajar } from './rng.js';

export const COMPOSICION = { protagonista: 12, acontecimiento: 4, lugar: 2, aula: 2 };
export const TIPOS = ['protagonista', 'acontecimiento', 'lugar', 'aula'];
export const EFECTOS = ['robar', 'curar', 'proteger', 'bonusDanio', 'moverSaber', 'anularLugar', 'robarPorReserva', 'buscarProtagonista'];

export const NOMBRE_DIMENSION = { Politica: 'Política', Economia: 'Economía', Sociedad: 'Sociedad', Cultura: 'Cultura', Territorio: 'Territorio' };

export function validarCarta(c) {
  const e = [];
  const id = (c && c.id) || '(sin id)';
  if (!c || typeof c !== 'object') return ['Carta vacía'];
  if (!c.id) e.push('Carta sin id');
  if (!c.nombre) e.push(`${id}: sin nombre`);
  if (!TIPOS.includes(c.tipo)) e.push(`${id}: tipo desconocido "${c.tipo}"`);
  if (!c.dato) e.push(`${id}: sin dato`);
  if (c.tipo === 'protagonista') {
    if (!DIMENSIONES.includes(c.dimension)) e.push(`${id}: dimensión desconocida "${c.dimension}"`);
    if (!(c.resistencia >= 50 && c.resistencia <= 120)) e.push(`${id}: resistencia fuera de 50–120`);
    if (!Array.isArray(c.acciones) || c.acciones.length < 1 || c.acciones.length > 2) e.push(`${id}: necesita 1 o 2 acciones`);
    for (const a of c.acciones || []) {
      if (!a.nombre) e.push(`${id}: acción sin nombre`);
      if (!(a.costo >= 1 && a.costo <= 3)) e.push(`${id}: costo fuera de 1–3`);
      if (!(a.danio >= 0)) e.push(`${id}: daño inválido`);
    }
  }
  if (c.tipo === 'acontecimiento' || c.tipo === 'aula') {
    if (!c.efecto || !EFECTOS.includes(c.efecto.tipo)) e.push(`${id}: efecto desconocido "${c.efecto && c.efecto.tipo}"`);
  }
  if (c.tipo === 'lugar') {
    if (!c.efecto || c.efecto.tipo !== 'bonusDimension' || !DIMENSIONES.includes(c.efecto.dimension)) e.push(`${id}: el lugar necesita bonusDimension con una dimensión válida`);
  }
  return e;
}

export function validarMazo(cartas) {
  const e = [];
  const ids = new Map();
  for (const c of cartas) {
    e.push(...validarCarta(c));
    if (ids.has(c.id)) e.push(`${c.id}: id repetido`);
    ids.set(c.id, c);
  }
  for (const c of cartas) {
    if (!c.evolucionaDe) continue;
    const base = ids.get(c.evolucionaDe);
    if (!base) e.push(`${c.id}: evoluciona de ${c.evolucionaDe}, que no existe`);
    else if (base.evolucionaDe) e.push(`${c.id}: su base ${base.id} ya es una Etapa 2`);
  }
  return e;
}

// Toma n cartas del grupo (barajado); si no alcanzan, repite.
function tomar(grupo, n, rng) {
  if (!grupo.length) return [];
  const out = [];
  while (out.length < n) out.push(...barajar(grupo, rng).slice(0, n - out.length));
  return out;
}

export function armarMazo(cartas, aula, rng) {
  const porId = new Map(cartas.map(c => [c.id, c]));
  const prot = barajar(cartas.filter(c => c.tipo === 'protagonista'), rng);
  const elegidos = [];
  const ya = new Set();
  const meter = c => { elegidos.push(c); ya.add(c.id); };

  // Primero asegura una carta base por unidad, para mezclar las 4 unidades.
  for (const u of [...new Set(prot.map(c => c.unidad))]) {
    const b = prot.find(c => c.unidad === u && !c.evolucionaDe && !ya.has(c.id));
    if (b && elegidos.length < COMPOSICION.protagonista) meter(b);
  }
  for (const c of prot) {
    if (elegidos.length >= COMPOSICION.protagonista) break;
    if (ya.has(c.id)) continue;
    if (c.evolucionaDe) {
      const base = porId.get(c.evolucionaDe);
      if (!base) continue;
      if (ya.has(base.id)) meter(c);
      else if (elegidos.length + 2 <= COMPOSICION.protagonista) { meter(base); meter(c); }
    } else meter(c);
  }
  // Si no alcanzó (mazo pequeño), repite cartas base.
  const bases = prot.filter(c => !c.evolucionaDe);
  while (elegidos.length < COMPOSICION.protagonista && bases.length) elegidos.push(...tomar(bases, 1, rng));

  const mazo = [
    ...elegidos,
    ...tomar(cartas.filter(c => c.tipo === 'acontecimiento'), COMPOSICION.acontecimiento, rng),
    ...tomar(cartas.filter(c => c.tipo === 'lugar'), COMPOSICION.lugar, rng),
    ...tomar(aula, COMPOSICION.aula, rng),
  ];
  // Completa con protagonistas base si faltan acontecimientos o lugares.
  while (mazo.length < 20 && bases.length) mazo.push(...tomar(bases, 1, rng));
  return mazo;
}

// Solo en el navegador: carga los JSON, aplica las ediciones del docente
// (textos e imágenes) y suma las cartas aprobadas del banco de ideas.
export async function cargarCurso(curso, { comunidad = [], ediciones = {}, imagenes = {} } = {}) {
  const [m, a] = await Promise.all([
    fetch(`data/mazo-${curso}.json`).then(r => r.json()),
    fetch('data/aula.json').then(r => r.json()),
  ]);
  const { aplicarEdiciones } = await import('./ediciones.js');
  const extra = comunidad.filter(c => validarCarta(c).length === 0);
  const cartas = [...aplicarEdiciones(m.cartas, ediciones, imagenes), ...extra];
  const nombres = new Map(cartas.map(c => [c.id, c.nombre]));
  for (const c of cartas) if (c.evolucionaDe) c.baseNombre = nombres.get(c.evolucionaDe);
  return { curso, unidades: m.unidades, cartas, aula: aplicarEdiciones(a.cartas, ediciones, imagenes) };
}
