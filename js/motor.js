// Motor de reglas de Cronocartas.
// Es puro: recibe un estado y una jugada y devuelve un estado nuevo y la lista
// de eventos ocurridos. No sabe nada de la pantalla, así que el mismo motor
// sirve para jugar en una tablet, contra la IA o, en el futuro, en línea.
import { rngDesdeEstado, barajar } from './rng.js';

export const DIMENSIONES = ['Politica', 'Economia', 'Sociedad', 'Cultura', 'Territorio'];

// Cada dimensión es fuerte contra la siguiente (daño ×2).
export const VENTAJA = {
  Politica: 'Economia',
  Economia: 'Sociedad',
  Sociedad: 'Cultura',
  Cultura: 'Territorio',
  Territorio: 'Politica',
};

export const MANO_INICIAL = 5;
export const RESERVA_MAX = 3;

const rival = j => (j === 'A' ? 'B' : 'A');
// structuredClone no existe en Chrome antiguo (< 98); el estado es JSON puro.
const clonar = x => (typeof structuredClone === 'function' ? structuredClone(x) : JSON.parse(JSON.stringify(x)));
const esBase = c => c.tipo === 'protagonista' && !c.evolucionaDe;

function nuevoJugador() {
  return { mazo: [], mano: [], activo: null, reserva: [], descarte: [], hitos: 0,
    saberPendiente: 0, aulaUsada: false, personajeUsado: false, retiroUsado: false, listo: false };
}

function robar(jug, n = 1) {
  const robadas = [];
  for (let i = 0; i < n && jug.mazo.length; i++) {
    const c = jug.mazo.shift();
    jug.mano.push(c);
    robadas.push(c);
  }
  return robadas;
}

function enMesa(jug) {
  return [jug.activo, ...jug.reserva].filter(Boolean);
}

function instancia(entrada, turno) {
  return { uid: entrada.uid, carta: entrada.carta, danio: 0, saber: 0, protegido: false, bonus: 0, turnoEntrada: turno };
}

export function crearPartida({ mazoA, mazoB, semilla, hitosParaGanar = 3, tablero = null }) {
  const rng = rngDesdeEstado(semilla);
  const jugadores = { A: nuevoJugador(), B: nuevoJugador() };
  for (const [j, mazo] of [['A', mazoA], ['B', mazoB]]) {
    if (!mazo.some(esBase)) throw new Error(`El mazo de ${j} no tiene Protagonistas base`);
    const entradas = mazo.map((carta, i) => ({ uid: `${j}${i}`, carta }));
    let intentos = 0;
    do {
      const todas = barajar([...jugadores[j].mano, ...(jugadores[j].mazo.length ? jugadores[j].mazo : entradas)], rng);
      jugadores[j].mano = [];
      jugadores[j].mazo = todas;
      robar(jugadores[j], MANO_INICIAL);
      intentos++;
    } while (!jugadores[j].mano.some(c => esBase(c.carta)) && intentos < 50);
    if (!jugadores[j].mano.some(c => esBase(c.carta))) {
      // Mazo casi sin Protagonistas: se fuerza uno a la mano.
      const k = jugadores[j].mazo.findIndex(c => esBase(c.carta));
      jugadores[j].mano.push(jugadores[j].mazo.splice(k, 1)[0]);
      jugadores[j].mazo.push(jugadores[j].mano.shift());
    }
  }
  return { fase: 'preparacion', turno: 'A', numeroTurno: 0, jugadores, lugar: null,
    ganador: null, hitosParaGanar, rng: rng.estado, tablero: tablero ? { id: tablero.id, regla: tablero.regla || null } : null };
}

export function jugadasValidas(e) {
  if (e.fase === 'fin') return [];
  const j = e.turno, yo = e.jugadores[j];

  if (e.fase === 'preparacion') {
    const js = [];
    const puedeColocar = !yo.activo || yo.reserva.length < RESERVA_MAX;
    if (puedeColocar) for (const c of yo.mano) if (esBase(c.carta)) js.push({ tipo: 'colocar', uid: c.uid });
    if (yo.activo) js.push({ tipo: 'listo' });
    return js;
  }

  if (e.fase === 'promover') {
    return yo.reserva.map(r => ({ tipo: 'promover', uid: r.uid }));
  }

  const js = [];
  for (const c of yo.mano) {
    const t = c.carta.tipo;
    if (t === 'protagonista') {
      if (esBase(c.carta) && yo.reserva.length < RESERVA_MAX) js.push({ tipo: 'bajar', uid: c.uid });
      if (c.carta.evolucionaDe) {
        for (const obj of enMesa(yo)) {
          if (obj.carta.id === c.carta.evolucionaDe && obj.turnoEntrada < e.numeroTurno) {
            js.push({ tipo: 'evolucionar', uid: c.uid, objetivo: obj.uid });
          }
        }
      }
    } else if (t === 'aula') {
      if ((yo.aulaCuenta || 0) < limiteAula(e) && efectoAplicable(e, j, c.carta.efecto)) js.push(...jugadasDeCarta(yo, c));
    } else if (t === 'personaje') {
      if (!yo.personajeUsado && efectoAplicable(e, j, c.carta.efecto)) js.push(...jugadasDeCarta(yo, c));
    } else if (t === 'lugar') {
      js.push({ tipo: 'jugar', uid: c.uid });
    } else if (t === 'acontecimiento') {
      if (efectoAplicable(e, j, c.carta.efecto)) js.push(...jugadasDeCarta(yo, c));
    }
  }
  if (yo.saberPendiente > 0) for (const p of enMesa(yo)) js.push({ tipo: 'asignarSaber', destino: p.uid });
  const retirada = costoRetirada(e, yo.activo);
  if (!yo.retiroUsado && yo.reserva.length && yo.activo.saber >= retirada) {
    for (const r of yo.reserva) js.push({ tipo: 'retirar', reemplazo: r.uid });
  }
  if (e.numeroTurno > 1) {
    (yo.activo.carta.acciones || []).forEach((a, indice) => {
      if (yo.activo.saber >= a.costo) js.push({ tipo: 'accion', indice });
    });
  }
  js.push({ tipo: 'pasar' });
  return js;
}

// Regla del tablero en juego (o null).
const regla = (e, tipo) => (e.tablero && e.tablero.regla && e.tablero.regla.tipo === tipo ? e.tablero.regla : null);
const limiteAula = e => (regla(e, 'aulaDoble') ? 2 : 1);
const costoRetirada = (e, inst) => (regla(e, 'retiroGratis') ? 0 : (inst.carta.retirada ?? 1));

const habilidad = (inst, tipo) => (inst && inst.carta.habilidad && inst.carta.habilidad.tipo === tipo ? inst.carta.habilidad : null);

// Conexión causa → consecuencia: si la causa está en tu mesa, tu descarte o es el Lugar en juego,
// tu activo recibe +1 Saber. Solo un bonus por carta.
function revisarConexion(e, j, carta, ev) {
  if (!Array.isArray(carta.conexiones) || !carta.conexiones.length) return;
  const yo = e.jugadores[j];
  const presentes = [...yo.descarte.map(c => c.carta), ...enMesa(yo).map(p => p.carta), ...(e.lugar ? [e.lugar.carta] : [])];
  for (const cx of carta.conexiones) {
    const causa = presentes.find(c => c.id === cx.causa && c !== carta);
    if (causa) {
      if (yo.activo) yo.activo.saber += 1;
      ev.push({ tipo: 'conexion', jugador: j, causa, efecto: carta, texto: cx.texto });
      return;
    }
  }
}

// Al entrar un Protagonista a la mesa (bajar o evolucionar).
function alEntrar(e, j, inst) {
  const yo = e.jugadores[j];
  const s = habilidad(inst, 'saberAlEntrar');
  if (s) inst.saber += s.n || 1;
  if (habilidad(inst, 'inspirador')) robar(yo, 1);
}

const listaEfectos = ef => (Array.isArray(ef) ? ef : ef ? [ef] : []);

// Normaliza las búsquedas: buscarProtagonista es buscar con cartaTipo 'protagonista'.
export function busquedaDe(ef) {
  for (const x of listaEfectos(ef)) {
    if (x.tipo === 'buscarProtagonista') return { n: x.n || 3, cartaTipo: 'protagonista' };
    if (x.tipo === 'buscar') return { n: x.n || 3, cartaTipo: x.cartaTipo || 'cualquiera' };
  }
  return null;
}
const sirve = (carta, cartaTipo) => cartaTipo === 'cualquiera' || carta.tipo === cartaTipo;

// Las cartas que piden elegir (búsquedas, cambio de activo) ofrecen una jugada por opción.
function jugadasDeCarta(yo, c) {
  const ef = c.carta.efecto;
  const b = busquedaDe(ef);
  if (b) {
    const tope = yo.mazo.slice(0, b.n).filter(x => sirve(x.carta, b.cartaTipo));
    if (tope.length) return tope.map(x => ({ tipo: 'jugar', uid: c.uid, eleccion: x.uid }));
  }
  if (listaEfectos(ef).some(x => x.tipo === 'retiroGratis')) return yo.reserva.map(r => ({ tipo: 'jugar', uid: c.uid, eleccion: r.uid }));
  return [{ tipo: 'jugar', uid: c.uid }];
}

function efectoAplicable(e, j, ef) {
  if (!ef) return false;
  if (Array.isArray(ef)) return ef.length > 0 && ef.every(x => efectoAplicable(e, j, x));
  const yo = e.jugadores[j];
  switch (ef.tipo) {
    case 'buscar': return yo.mazo.length > 0;
    case 'retiroGratis': return yo.reserva.length > 0;
    case 'curarTodos': return enMesa(yo).some(p => p.danio > 0);
    case 'moverSaberTodo': return yo.reserva.some(r => r.saber > 0);
    case 'bonusDanio': return !ef.dimension || yo.activo.carta.dimension === ef.dimension;
    case 'anularLugar': return !!e.lugar;
    case 'moverSaber': return yo.reserva.some(r => r.saber > 0);
    case 'curar': return yo.activo.danio > 0;
    case 'robar': case 'buscarProtagonista': return yo.mazo.length > 0;
    case 'robarPorReserva': return yo.reserva.length > 0 && yo.mazo.length > 0;
    default: return true;
  }
}

function mismaJugada(a, b) {
  return a.tipo === b.tipo && a.uid === b.uid && a.objetivo === b.objetivo &&
    a.destino === b.destino && a.reemplazo === b.reemplazo && a.indice === b.indice && a.eleccion === b.eleccion;
}

export function aplicarJugada(estadoEntrada, jugada) {
  if (!jugada || !jugadasValidas(estadoEntrada).some(v => mismaJugada(v, jugada))) {
    throw new Error('jugada inválida');
  }
  const e = clonar(estadoEntrada);
  const ev = [];
  const j = e.turno, yo = e.jugadores[j];
  const sacarDeMano = uid => yo.mano.splice(yo.mano.findIndex(c => c.uid === uid), 1)[0];
  const buscar = uid => enMesa(yo).find(p => p.uid === uid);

  switch (jugada.tipo) {
    case 'colocar': {
      const c = sacarDeMano(jugada.uid);
      const inst = instancia(c, 0);
      if (!yo.activo) yo.activo = inst; else yo.reserva.push(inst);
      ev.push({ tipo: 'colocar', jugador: j, carta: c.carta });
      break;
    }
    case 'listo': {
      yo.listo = true;
      if (!e.jugadores[rival(j)].listo) e.turno = rival(j);
      else { e.fase = 'turno'; e.turno = 'A'; iniciarTurno(e, ev); }
      break;
    }
    case 'promover': {
      const k = yo.reserva.findIndex(r => r.uid === jugada.uid);
      yo.activo = yo.reserva.splice(k, 1)[0];
      ev.push({ tipo: 'promover', jugador: j, carta: yo.activo.carta });
      // El turno del atacante terminó con su acción: ahora juega quien promovió.
      e.fase = 'turno';
      e.numeroTurno++;
      iniciarTurno(e, ev);
      break;
    }
    case 'bajar': {
      const c = sacarDeMano(jugada.uid);
      const inst = instancia(c, e.numeroTurno);
      yo.reserva.push(inst);
      ev.push({ tipo: 'bajar', jugador: j, carta: c.carta });
      alEntrar(e, j, inst);
      revisarConexion(e, j, c.carta, ev);
      break;
    }
    case 'evolucionar': {
      const c = sacarDeMano(jugada.uid);
      const obj = buscar(jugada.objetivo);
      yo.descarte.push({ uid: obj.uid + 'b', carta: obj.carta });
      const anterior = obj.carta;
      obj.carta = c.carta;
      obj.turnoEntrada = e.numeroTurno;
      ev.push({ tipo: 'evolucion', jugador: j, de: anterior, a: c.carta });
      alEntrar(e, j, obj);
      revisarConexion(e, j, c.carta, ev);
      break;
    }
    case 'asignarSaber': {
      buscar(jugada.destino).saber += 1;
      yo.saberPendiente = 0;
      ev.push({ tipo: 'saber', jugador: j, destino: jugada.destino });
      break;
    }
    case 'jugar': {
      const c = sacarDeMano(jugada.uid);
      if (c.carta.tipo === 'lugar') {
        if (e.lugar) e.jugadores[e.lugar.duenio || j].descarte.push({ uid: e.lugar.uid, carta: e.lugar.carta });
        e.lugar = { uid: c.uid, carta: c.carta, duenio: j };
        ev.push({ tipo: 'lugar', jugador: j, carta: c.carta });
      } else {
        revisarConexion(e, j, c.carta, ev);
        if (c.carta.tipo === 'aula') { yo.aulaCuenta = (yo.aulaCuenta || 0) + 1; yo.aulaUsada = true; }
        if (c.carta.tipo === 'personaje') {
          yo.personajeUsado = true;
          const r = regla(e, 'personajeRoba');
          if (r) robar(yo, r.n || 1);
        }
        aplicarEfecto(e, j, c.carta.efecto, ev, jugada.eleccion);
        yo.descarte.push(c);
        ev.push({ tipo: 'efecto', jugador: j, carta: c.carta });
      }
      break;
    }
    case 'retirar': {
      const k = yo.reserva.findIndex(r => r.uid === jugada.reemplazo);
      const viejo = yo.activo;
      viejo.saber -= costoRetirada(e, viejo);
      yo.activo = yo.reserva[k];
      yo.reserva[k] = viejo;
      yo.retiroUsado = true;
      ev.push({ tipo: 'retirar', jugador: j, carta: yo.activo.carta });
      break;
    }
    case 'accion': {
      resolverAccion(e, j, jugada.indice, ev);
      if (e.fase === 'turno') terminarTurno(e, ev);
      break;
    }
    case 'pasar': {
      terminarTurno(e, ev);
      break;
    }
  }
  return { estado: e, eventos: ev };
}

function aplicarEfecto(e, j, ef, ev, eleccion) {
  if (Array.isArray(ef)) { for (const x of ef) aplicarEfecto(e, j, x, ev, eleccion); return; }
  const yo = e.jugadores[j];
  switch (ef.tipo) {
    case 'saberExtra': yo.activo.saber += ef.n || 1; break;
    case 'curarTodos': for (const p of enMesa(yo)) p.danio = Math.max(0, p.danio - ef.n); break;
    case 'moverSaberTodo': {
      const origen = yo.reserva.filter(r => r.saber > 0).sort((a, b) => b.saber - a.saber)[0];
      yo.activo.saber += origen.saber;
      origen.saber = 0;
      break;
    }
    case 'retiroGratis': {
      const k = yo.reserva.findIndex(r => r.uid === eleccion);
      const viejo = yo.activo;
      yo.activo = yo.reserva[k];
      yo.reserva[k] = viejo;
      ev.push({ tipo: 'retirar', jugador: j, carta: yo.activo.carta });
      break;
    }
    case 'robar': robar(yo, ef.n); break;
    case 'robarPorReserva': robar(yo, yo.reserva.length); break;
    case 'curar': yo.activo.danio = Math.max(0, yo.activo.danio - ef.n); break;
    case 'proteger': yo.activo.protegido = true; break;
    case 'bonusDanio': yo.activo.bonus += ef.n; break;
    case 'anularLugar': {
      const l = e.lugar;
      e.jugadores[l.duenio || j].descarte.push({ uid: l.uid, carta: l.carta });
      e.lugar = null;
      break;
    }
    case 'moverSaber': {
      const origen = yo.reserva.filter(r => r.saber > 0).sort((a, b) => b.saber - a.saber)[0];
      origen.saber -= 1;
      yo.activo.saber += 1;
      break;
    }
    case 'buscar':
    case 'buscarProtagonista': {
      const n = ef.n || 3;
      const tope = yo.mazo.slice(0, n);
      const vistas = tope.map(c => c.carta);
      const k = eleccion ? tope.findIndex(c => c.uid === eleccion) : -1;
      const tomada = k >= 0 ? tope.splice(k, 1)[0] : null;
      if (tomada) yo.mano.push(tomada);
      yo.mazo = [...yo.mazo.slice(n), ...tope];
      ev.push({ tipo: 'revelar', jugador: j, cartas: vistas, tomada: tomada ? tomada.carta : null });
      break;
    }
  }
}

function resolverAccion(e, j, indice, ev) {
  const yo = e.jugadores[j], otro = e.jugadores[rival(j)];
  const atk = yo.activo, def = otro.activo;
  const accion = atk.carta.acciones[indice];
  let danio = accion.danio || 0;
  if (danio > 0) {
    const lugarEf = e.lugar && e.lugar.carta.efecto;
    if (lugarEf && lugarEf.tipo === 'bonusDimension' && lugarEf.dimension === atk.carta.dimension) danio += lugarEf.n;
    const bt = regla(e, 'bonusDimension');
    if (bt && bt.dimension === atk.carta.dimension) danio += bt.n;
    danio += atk.bonus;
    const fr = habilidad(atk, 'fuerzaReserva');
    if (fr) danio += fr.n * yo.reserva.length;
    const ventaja = VENTAJA[atk.carta.dimension] === def.carta.dimension;
    if (ventaja) {
      danio *= 2;
      ev.push({ tipo: 'ventaja', de: atk.carta.dimension, contra: def.carta.dimension });
    }
    const muro = regla(e, 'reduccionDanio');
    if (muro) danio = Math.max(0, danio - muro.n);
    const res = habilidad(def, 'resistente');
    if (res) danio = Math.max(0, danio - res.n);
    if (def.protegido) {
      def.protegido = false;
      ev.push({ tipo: 'protegido', jugador: rival(j), carta: def.carta });
      danio = 0;
    }
  }
  atk.bonus = 0;
  def.danio += danio;
  ev.push({ tipo: 'danio', jugador: j, accion: accion.nombre, valor: danio, carta: atk.carta, objetivo: def.carta });
  if (accion.efecto) aplicarEfecto(e, j, accion.efecto, ev);

  if (def.danio >= def.carta.resistencia) {
    otro.descarte.push({ uid: def.uid, carta: def.carta });
    otro.activo = null;
    yo.hitos += 1;
    const sh = regla(e, 'saberPorHito');
    if (sh) atk.saber += sh.n || 1;
    ev.push({ tipo: 'caida', jugador: rival(j), carta: def.carta });
    ev.push({ tipo: 'hito', jugador: j, hitos: yo.hitos });
    if (yo.hitos >= e.hitosParaGanar || otro.reserva.length === 0) {
      e.fase = 'fin';
      e.ganador = j;
      ev.push({ tipo: 'fin', ganador: j });
    } else {
      e.fase = 'promover';
      e.turno = rival(j);
    }
  }
}

function terminarTurno(e, ev) {
  e.turno = rival(e.turno);
  e.numeroTurno++;
  iniciarTurno(e, ev);
}

function iniciarTurno(e, ev) {
  const yo = e.jugadores[e.turno];
  if (e.numeroTurno === 0) e.numeroTurno = 1;
  for (const p of enMesa(yo)) p.protegido = false;
  yo.aulaUsada = false;
  yo.aulaCuenta = 0;
  yo.personajeUsado = false;
  const cura = regla(e, 'curarInicioTurno');
  if (cura && yo.activo) yo.activo.danio = Math.max(0, yo.activo.danio - cura.n);
  const san = habilidad(yo.activo, 'sanador');
  if (san) yo.activo.danio = Math.max(0, yo.activo.danio - san.n);
  yo.retiroUsado = false;
  yo.saberPendiente = 1;
  const robadas = robar(yo, 1);
  ev.push({ tipo: 'turno', jugador: e.turno, numero: e.numeroTurno, robo: robadas.length });
}
