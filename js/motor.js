// Motor de reglas de Cronocartas.
// Es puro: recibe un estado y una jugada y devuelve un estado nuevo y la lista
// de eventos ocurridos. No sabe nada de la pantalla, así que el mismo motor
// sirve para jugar en una tablet, contra la IA o, en el futuro, en línea.
import { rngDesdeEstado, barajar } from './rng.js';
import { FUERZAS, VENTAJA_FUERZAS } from './colecciones.js';
import { rangoDeFecha } from './fechas.js';

export const DIMENSIONES = ['Politica', 'Economia', 'Sociedad', 'Cultura', 'Territorio'];
// Las de Historia más las fuerzas de las expansiones (js/colecciones.js).
export const TODAS_DIMENSIONES = [...DIMENSIONES, ...Object.keys(FUERZAS)];

// Cada dimensión es fuerte contra la siguiente (daño ×2). Las fuerzas de cada expansión, en su ronda.
export const VENTAJA = {
  Politica: 'Economia',
  Economia: 'Sociedad',
  Sociedad: 'Cultura',
  Cultura: 'Territorio',
  Territorio: 'Politica',
  ...VENTAJA_FUERZAS,
};

export const MANO_INICIAL = 5;
export const RESERVA_MAX = 3;

const rival = j => (j === 'A' ? 'B' : 'A');
// structuredClone no existe en Chrome antiguo (< 98); el estado es JSON puro.
// El estado es JSON puro (se guarda en la tablet), así que se clona como JSON: funciona en cualquier navegador.
const clonar = x => JSON.parse(JSON.stringify(x));
const esBase = c => c.tipo === 'protagonista' && !c.evolucionaDe;

function nuevoJugador() {
  return { mazo: [], mano: [], activo: null, reserva: [], descarte: [], hitos: 0,
    saberPendiente: 0, aulaUsada: false, personajeUsado: false, retiroUsado: false, listo: false,
    linea: [], porUbicar: null, aciertos: 0 };
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

// primero: quién juega el primer turno (lo decide el sorteo de la moneda; sin sorteo, A).
export function crearPartida({ mazoA, mazoB, semilla, hitosParaGanar = 3, tablero = null, lineaTiempo = false, primero = 'A' }) {
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
    ganador: null, hitosParaGanar, rng: rng.estado, tablero: tablero ? { id: tablero.id, regla: tablero.regla || null } : null, lineaTiempo: !!lineaTiempo,
    primero: primero === 'B' ? 'B' : 'A' };
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

  // Línea de tiempo: hasta ubicar la carta, solo se puede elegir el hueco.
  if (yo.porUbicar) return Array.from({ length: (yo.linea || []).length + 1 }, (_, posicion) => ({ tipo: 'ubicar', posicion }));

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
      // Descanso: tras un ataque de costo 3, la carta no puede repetir otro de costo 3 en su turno siguiente.
      if (yo.activo.saber >= a.costo && !(yo.activo.descansa && a.costo >= COSTO_POTENTE)) js.push({ tipo: 'accion', indice });
    });
  }
  js.push({ tipo: 'pasar' });
  return js;
}

// Un ataque de este costo o más es «potente»: después, la carta descansa un turno (ver jugadasValidas).
export const COSTO_POTENTE = 3;

// Regla del tablero en juego (o null).
const regla = (e, tipo) => (e.tablero && e.tablero.regla && e.tablero.regla.tipo === tipo ? e.tablero.regla : null);
const limiteAula = e => (regla(e, 'aulaDoble') ? 2 : 1);
const costoRetirada = (e, inst) => (regla(e, 'retiroGratis') ? 0 : (inst.carta.retirada != null ? inst.carta.retirada : 1));

const habilidad = (inst, tipo) => (inst && inst.carta.habilidad && inst.carta.habilidad.tipo === tipo ? inst.carta.habilidad : null);

// Línea de tiempo: los Personajes y Acontecimientos con fecha entran a la línea del jugador.
// La primera entra sola; desde la segunda, el jugador elige el hueco (jugada 'ubicar').
function entrarALinea(e, j, carta, ev) {
  if (!e.lineaTiempo || !carta.fecha || !['personaje', 'acontecimiento'].includes(carta.tipo)) return;
  const yo = e.jugadores[j];
  yo.linea = yo.linea || [];
  const { desde, hasta } = rangoDeFecha(carta.fecha);
  const hecho = { id: carta.id, nombre: carta.nombre, anio: carta.fecha.anio, texto: carta.fecha.texto, desde, hasta };
  if (!yo.linea.length) { yo.linea.push(hecho); ev.push({ tipo: 'linea', jugador: j, hecho, automatico: true }); }
  else yo.porUbicar = hecho;
}

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
    case 'recuperar': return yo.descarte.length > 0;
    case 'asedio': return e.jugadores[rival(j)].reserva.some(r => vidaDe(r) > MINIMO_ASEDIO);
    case 'debilitar': return !!e.jugadores[rival(j)].activo;
    case 'quitarSaber': { const o = e.jugadores[rival(j)].activo; return !!o && o.saber > 0; }
    case 'saberReserva': return yo.reserva.length > 0;
    default: return true;
  }
}

function mismaJugada(a, b) {
  return a.tipo === b.tipo && a.uid === b.uid && a.objetivo === b.objetivo &&
    a.destino === b.destino && a.reemplazo === b.reemplazo && a.indice === b.indice && a.eleccion === b.eleccion &&
    a.posicion === b.posicion;
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
      alEntrar(e, j, inst);   // "al entrar en juego" también vale al preparar la mesa
      break;
    }
    case 'listo': {
      yo.listo = true;
      if (!e.jugadores[rival(j)].listo) e.turno = rival(j);
      else { e.fase = 'turno'; e.turno = e.primero || 'A'; iniciarTurno(e, ev); }
      break;
    }
    case 'promover': {
      const k = yo.reserva.findIndex(r => r.uid === jugada.uid);
      yo.activo = yo.reserva.splice(k, 1)[0];
      ev.push({ tipo: 'promover', jugador: j, carta: yo.activo.carta });
      // Refuerzo: la carta que reemplaza a una caída llega con +1 de Saber, para poder responder.
      yo.activo.saber += 1 + (yo.legado || 0);
      ev.push({ tipo: 'refuerzo', jugador: j, carta: yo.activo.carta, legado: yo.legado || 0 });
      yo.legado = 0;
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
        entrarALinea(e, j, c.carta, ev);
      }
      break;
    }
    case 'ubicar': {
      const hecho = yo.porUbicar;
      const linea = yo.linea;
      const antes = linea[jugada.posicion - 1], despues = linea[jugada.posicion];
      // Se juzga con el rango que muestra el texto de cada fecha: es correcto si los rangos permiten ese orden.
      // (Las líneas guardadas antes no tienen rango: se usa el año.)
      const desde = x => (x.desde != null ? x.desde : x.anio), hasta = x => (x.hasta != null ? x.hasta : x.anio);
      const correcto = (!antes || desde(antes) <= hasta(hecho)) && (!despues || desde(hecho) <= hasta(despues));
      let posicionCorrecta = linea.findIndex(x => x.anio > hecho.anio);
      if (posicionCorrecta < 0) posicionCorrecta = linea.length;
      linea.splice(correcto ? jugada.posicion : posicionCorrecta, 0, hecho);
      yo.porUbicar = null;
      if (correcto) { yo.aciertos = (yo.aciertos || 0) + 1; if (yo.activo) yo.activo.saber += 1; }
      ev.push({ tipo: 'ubicar', jugador: j, hecho, correcto, posicion: jugada.posicion, posicionCorrecta: correcto ? jugada.posicion : posicionCorrecta });
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

// Asedio y epidemia desgastan, pero no eliminan: nadie queda con menos de 10 de resistencia por ellos.
const MINIMO_ASEDIO = 10;
const vidaDe = p => p.carta.resistencia - p.danio;
function desgastar(p, n) { p.danio = Math.max(p.danio, Math.min(p.danio + n, p.carta.resistencia - MINIMO_ASEDIO)); }

function aplicarEfecto(e, j, ef, ev, eleccion) {
  if (Array.isArray(ef)) { for (const x of ef) aplicarEfecto(e, j, x, ev, eleccion); return; }
  const yo = e.jugadores[j], otro = e.jugadores[rival(j)];
  switch (ef.tipo) {
    case 'recuperar': {
      const c = yo.descarte.pop();
      if (c) { yo.mano.push(c); ev.push({ tipo: 'recuperar', jugador: j, carta: c.carta }); }
      break;
    }
    case 'asedio': for (const r of otro.reserva) desgastar(r, ef.n); ev.push({ tipo: 'asedio', jugador: j, n: ef.n }); break;
    case 'epidemia': for (const p of [...enMesa(yo), ...enMesa(otro)]) desgastar(p, ef.n); ev.push({ tipo: 'epidemia', jugador: j, n: ef.n }); break;
    case 'debilitar': if (otro.activo) otro.activo.debil = (otro.activo.debil || 0) + ef.n; break;
    case 'quitarSaber': if (otro.activo) otro.activo.saber = Math.max(0, otro.activo.saber - (ef.n || 1)); break;
    case 'saberReserva': for (const r of yo.reserva) r.saber += ef.n || 1; break;
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

// Desglose del daño de una acción del activo de j contra el activo rival (sin contar la protección):
// parte del daño impreso en la carta y anota cada cambio, en el orden en que se aplica.
// { base, pasos: [{ fuente, valor } | { fuente: 'ventaja', por: 2 }], total }
// fuente: 'lugar' | 'tablero' | 'bonus' | 'reserva' | 'ventaja' | 'resistente'
export function desgloseDanio(e, j, indice) {
  const yo = e.jugadores[j], otro = e.jugadores[rival(j)];
  const atk = yo.activo, def = otro.activo;
  const accion = atk && atk.carta.acciones && atk.carta.acciones[indice];
  const base = (accion && accion.danio) || 0;
  const pasos = [];
  if (base <= 0 || !def) return { base, pasos, total: Math.max(0, base) };
  const suma = (fuente, valor) => { if (valor) pasos.push({ fuente, valor }); };
  const lugarEf = e.lugar && e.lugar.carta.efecto;
  if (lugarEf && lugarEf.tipo === 'bonusDimension' && lugarEf.dimension === atk.carta.dimension) suma('lugar', lugarEf.n);
  const bt = regla(e, 'bonusDimension');
  if (bt && bt.dimension === atk.carta.dimension) suma('tablero', bt.n);
  suma('bonus', atk.bonus);
  const fr = habilidad(atk, 'fuerzaReserva');
  if (fr) suma('reserva', fr.n * yo.reserva.length);
  const al = habilidad(atk, 'alianza');
  if (al) suma('alianza', al.n * yo.reserva.filter(r => r.carta.dimension === atk.carta.dimension).length);
  if (VENTAJA[atk.carta.dimension] === def.carta.dimension) pasos.push({ fuente: 'ventaja', por: 2 });
  let total = base;
  for (const p of pasos) total = p.por ? total * p.por : total + p.valor;
  const muro = regla(e, 'reduccionDanio');
  if (muro) { const q = Math.min(total, muro.n); if (q) pasos.push({ fuente: 'tablero', valor: -q }); total -= q; }
  const res = habilidad(def, 'resistente');
  if (res) { const q = Math.min(total, res.n); if (q) pasos.push({ fuente: 'resistente', valor: -q }); total -= q; }
  if (lugarEf && lugarEf.tipo === 'escudoDimension' && lugarEf.dimension === def.carta.dimension) {
    const q = Math.min(total, lugarEf.n); if (q) pasos.push({ fuente: 'lugar', valor: -q }); total -= q;
  }
  if (atk.debil) { const q = Math.min(total, atk.debil); if (q) pasos.push({ fuente: 'debilitado', valor: -q }); total -= q; }
  return { base, pasos, total };
}

function calcularDanio(e, j, accion) {
  const indice = e.jugadores[j].activo.carta.acciones.indexOf(accion);
  return { danio: desgloseDanio(e, j, indice).total };
}

// Para el rival automático: daño de la acción `indice` del activo de j (0 si el rival está protegido).
export function danioDeAccion(e, j, indice) {
  const yo = e.jugadores[j], def = e.jugadores[rival(j)].activo;
  if (!yo.activo || !def || !yo.activo.carta.acciones || !yo.activo.carta.acciones[indice]) return 0;
  return def.protegido ? 0 : calcularDanio(e, j, yo.activo.carta.acciones[indice]).danio;
}

function resolverAccion(e, j, indice, ev) {
  const yo = e.jugadores[j], otro = e.jugadores[rival(j)];
  const atk = yo.activo, def = otro.activo;
  const accion = atk.carta.acciones[indice];
  let danio = calcularDanio(e, j, accion).danio;
  if (danio > 0) {
    if (VENTAJA[atk.carta.dimension] === def.carta.dimension) ev.push({ tipo: 'ventaja', de: atk.carta.dimension, contra: def.carta.dimension });
    if (def.protegido) {
      def.protegido = false;
      ev.push({ tipo: 'protegido', jugador: rival(j), carta: def.carta });
      danio = 0;
    }
  }
  atk.bonus = 0;
  atk.debil = 0;
  if (accion.costo >= COSTO_POTENTE) atk.atacoFuerte = true;
  def.danio += danio;
  ev.push({ tipo: 'danio', jugador: j, accion: accion.nombre, valor: danio, carta: atk.carta, objetivo: def.carta });
  // Efecto de la acción: se aplica la parte que tenga sentido (no falla si, por ejemplo, el rival no tiene reserva).
  for (const x of listaEfectos(accion.efecto)) if (efectoAplicable(e, j, x)) aplicarEfecto(e, j, x, ev);

  // Tenaz: la primera vez que caería, queda con 10.
  if (def.danio >= def.carta.resistencia && habilidad(def, 'tenaz') && !def.tenazUsado) {
    def.tenazUsado = true;
    def.danio = def.carta.resistencia - 10;
    ev.push({ tipo: 'tenaz', jugador: rival(j), carta: def.carta });
  }
  // Contraataque: si el defensor sobrevive a un golpe con daño, el atacante recibe daño (sin bajar de 10).
  const ca = habilidad(def, 'contraataque');
  if (ca && danio > 0 && def.danio < def.carta.resistencia) {
    const antes = atk.danio;
    desgastar(atk, ca.n);
    if (atk.danio > antes) ev.push({ tipo: 'contraataque', jugador: rival(j), carta: def.carta, valor: atk.danio - antes });
  }

  if (def.danio >= def.carta.resistencia) {
    const lg = habilidad(def, 'legado');
    if (lg) otro.legado = (otro.legado || 0) + (lg.n || 1);
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
  for (const p of enMesa(yo)) { p.protegido = false; p.descansa = !!p.atacoFuerte; p.atacoFuerte = false; }
  yo.aulaUsada = false;
  yo.aulaCuenta = 0;
  yo.personajeUsado = false;
  const cura = regla(e, 'curarInicioTurno');
  if (cura && yo.activo) yo.activo.danio = Math.max(0, yo.activo.danio - cura.n);
  const lugarEf = e.lugar && e.lugar.carta.efecto;
  if (lugarEf && lugarEf.tipo === 'curaDimension' && yo.activo && yo.activo.carta.dimension === lugarEf.dimension) {
    yo.activo.danio = Math.max(0, yo.activo.danio - lugarEf.n);
  }
  const san = habilidad(yo.activo, 'sanador');
  if (san) yo.activo.danio = Math.max(0, yo.activo.danio - san.n);
  yo.retiroUsado = false;
  yo.saberPendiente = 1;
  const robadas = robar(yo, 1);
  ev.push({ tipo: 'turno', jugador: e.turno, numero: e.numeroTurno, robo: robadas.length });
}

// Deshacer: una jugada se puede revertir si no terminó el turno y no reveló información nueva
// (no robó ni buscó en el mazo, no ubicó en la línea de tiempo, no atacó).
export function jugadaReversible(antes, despues, jugada) {
  if (['accion', 'pasar', 'ubicar', 'promover'].includes(jugada.tipo)) return false;
  if (despues.turno !== antes.turno || despues.fase !== antes.fase) return false;
  const j = antes.turno;
  return despues.jugadores[j].mazo.length === antes.jugadores[j].mazo.length;
}
