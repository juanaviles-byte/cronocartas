// Carga, revisión y armado de mazos. Los mazos viven en data/*.json para que
// se puedan corregir o ampliar sin tocar el código.
import { DIMENSIONES } from './motor.js';
import { barajar } from './rng.js';

export const COMPOSICION = { protagonista: 11, personaje: 3, acontecimiento: 3, lugar: 1, aula: 2 };
export const TIPOS = ['protagonista', 'personaje', 'acontecimiento', 'lugar', 'aula'];
export const EFECTOS = ['robar', 'curar', 'proteger', 'bonusDanio', 'moverSaber', 'anularLugar', 'robarPorReserva', 'buscarProtagonista',
  'buscar', 'retiroGratis', 'saberExtra', 'curarTodos', 'moverSaberTodo'];
const TIPOS_BUSQUEDA = ['protagonista', 'lugar', 'acontecimiento', 'cualquiera'];

function efectoValido(ef) {
  if (Array.isArray(ef)) return ef.length > 0 && ef.every(efectoValido);
  if (!ef || !EFECTOS.includes(ef.tipo)) return false;
  if (ef.tipo === 'buscar' && !TIPOS_BUSQUEDA.includes(ef.cartaTipo)) return false;
  if (ef.dimension && !DIMENSIONES.includes(ef.dimension)) return false;
  return true;
}

export const HABILIDADES = ['resistente', 'fuerzaReserva', 'sanador', 'inspirador', 'saberAlEntrar'];

export const NOMBRE_DIMENSION = { Politica: 'Política', Economia: 'Economía', Sociedad: 'Sociedad', Cultura: 'Cultura', Territorio: 'Territorio' };

export function validarCarta(c) {
  const e = [];
  const id = (c && c.id) || '(sin id)';
  if (!c || typeof c !== 'object') return ['Carta vacía'];
  if (!c.id) e.push('Carta sin id');
  if (!c.nombre) e.push(`${id}: sin nombre`);
  if (!TIPOS.includes(c.tipo)) e.push(`${id}: tipo desconocido "${c.tipo}"`);
  if (c.fecha !== undefined && !(c.fecha && Number.isInteger(c.fecha.anio) && typeof c.fecha.texto === 'string' && c.fecha.texto.length <= 30)) {
    e.push(`${id}: fecha mal escrita`);
  }
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
  if (c.habilidad && (!HABILIDADES.includes(c.habilidad.tipo) || !c.habilidad.nombre)) e.push(`${id}: habilidad desconocida`);
  if (c.conexiones && (!Array.isArray(c.conexiones) || c.conexiones.some(x => !x || typeof x.causa !== 'string' || typeof x.texto !== 'string'))) {
    e.push(`${id}: conexiones mal formadas`);
  }
  if (c.tipo === 'acontecimiento' || c.tipo === 'aula' || c.tipo === 'personaje') {
    if (!efectoValido(c.efecto)) e.push(`${id}: efecto desconocido o mal escrito`);
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
    for (const x of Array.isArray(c.conexiones) ? c.conexiones : []) {
      if (x && typeof x.causa === 'string' && !ids.has(x.causa)) e.push(`${c.id}: su conexión apunta a ${x.causa}, que no existe`);
    }
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

// Con { unidad } el mazo refuerza esa unidad: primero entran sus cartas.
export function armarMazo(todas, aula, rng, { unidad = null, nucleo = null, excluir = null } = {}) {
  const cartas = excluir ? todas.filter(c => !excluir.has(c.id)) : todas;
  const porId = new Map(cartas.map(c => [c.id, c]));
  // Preferidas: las del núcleo de un bando o las de la unidad elegida. Van primero; el resto, al azar.
  const prefiere = c => (nucleo ? nucleo.has(c.id) : unidad ? c.unidad === unidad : false);
  const enfocado = !!(nucleo || unidad);
  const primeroUnidad = lista => (enfocado ? [...barajar(lista.filter(prefiere), rng), ...barajar(lista.filter(c => !prefiere(c)), rng)] : barajar(lista, rng));
  const prot = primeroUnidad(cartas.filter(c => c.tipo === 'protagonista'));
  const elegidos = [];
  const ya = new Set();
  const meter = c => { elegidos.push(c); ya.add(c.id); };

  // Sin unidad elegida, asegura una carta base por unidad, para mezclar las 4.
  if (!enfocado) for (const u of [...new Set(prot.map(c => c.unidad))]) {
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

  const deTipo = t => {
    const grupo = cartas.filter(c => c.tipo === t);
    if (!enfocado) return tomar(grupo, COMPOSICION[t], rng);
    const propias = barajar(grupo.filter(prefiere), rng).slice(0, COMPOSICION[t]);
    const resto = grupo.filter(c => !prefiere(c));
    return [...propias, ...tomar(resto.length ? resto : grupo, COMPOSICION[t] - propias.length, rng)];
  };
  const mazo = [
    ...elegidos,
    ...deTipo('personaje'),
    ...deTipo('acontecimiento'),
    ...deTipo('lugar'),
    ...tomar(aula, COMPOSICION.aula, rng),
  ];
  // Completa con protagonistas base si faltan acontecimientos o lugares.
  while (mazo.length < 20 && bases.length) mazo.push(...tomar(bases, 1, rng));
  return mazo;
}

export const REGLAS_TABLERO = ['bonusDimension', 'reduccionDanio', 'retiroGratis', 'personajeRoba', 'saberPorHito', 'aulaDoble', 'curarInicioTurno'];

export function validarTablero(t) {
  const e = [];
  const id = (t && t.id) || '(sin id)';
  if (!t || !t.id || !t.nombre) e.push(`${id}: falta id o nombre`);
  const r = t && t.regla;
  if (!r || !REGLAS_TABLERO.includes(r.tipo)) e.push(`${id}: regla desconocida`);
  else if (r.tipo === 'bonusDimension' && !DIMENSIONES.includes(r.dimension)) e.push(`${id}: dimensión desconocida`);
  if (!t || typeof t.imagen !== 'string' || !/^img\/tableros\/[\w-]+\.jpg$/.test(t.imagen)) e.push(`${id}: imagen inválida`);
  if (!t || !Array.isArray(t.lugares)) e.push(`${id}: lugares debe ser una lista`);
  return e;
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
  const porId = new Map(cartas.map(c => [c.id, c]));
  for (const c of cartas) if (Array.isArray(c.conexiones)) {
    c.conexiones = c.conexiones.map(x => ({ ...x, causaNombre: porId.get(x.causa)?.nombre }));
  }
  for (const c of cartas) if (c.evolucionaDe && porId.get(c.evolucionaDe)) {
    const b = porId.get(c.evolucionaDe);
    Object.assign(c, { baseNombre: b.nombre, baseEmblema: b.emblema, baseDimension: b.dimension });
  }
  return { curso, unidades: m.unidades, cartas, aula: aplicarEdiciones(a.cartas, ediciones, imagenes) };
}

// Duelo temático: el mazo de un bando trae su núcleo y no trae el núcleo del bando rival.
export function mazoDeBando(cartas, aula, rng, duelo, bandoId) {
  const ids = nombres => new Set(cartas.filter(c => nombres.includes(c.nombre)).map(c => c.id));
  const propio = duelo.bandos.find(b => b.id === bandoId);
  const rival = duelo.bandos.find(b => b.id !== bandoId);
  const nucleo = ids(propio.nucleo);
  // Si una Etapa 2 está en el núcleo, su base también.
  for (const c of cartas) if (nucleo.has(c.id) && c.evolucionaDe) nucleo.add(c.evolucionaDe);
  return armarMazo(cartas, aula, rng, { nucleo, excluir: ids(rival.nucleo) });
}
