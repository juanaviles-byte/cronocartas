// Rival automático con tres niveles:
// Aprendiz (a veces se equivoca), Historiador (reglas simples) y Erudito (simula cada jugada y elige la mejor).
import { jugadasValidas, aplicarJugada, danioDeAccion, efectoEfectivo } from './motor.js';
import { rngDesdeEstado } from './rng.js';

export const NIVELES = [
  { id: 'aprendiz', nombre: 'Aprendiz', texto: 'Está aprendiendo: a veces se equivoca.' },
  { id: 'historiador', nombre: 'Historiador', texto: 'Juega con reglas claras.' },
  { id: 'erudito', nombre: 'Erudito', texto: 'Piensa cada jugada. ¡Difícil!' },
];

const valorBase = c => (c.resistencia || 0) + Math.max(0, ...(c.acciones || []).map(a => a.danio || 0));

export function elegirJugada(estado, jugador, { nivel = 'historiador' } = {}) {
  const js = jugadasValidas(estado);
  if (!js.length) return null;
  if (nivel === 'aprendiz') {
    const rng = rngDesdeEstado(((estado.rng >>> 0) ^ Math.imul(estado.numeroTurno + 1, 2654435761) ^ (js.length * 97)) >>> 0);
    if (rng.siguiente() < 0.5) {
      const sinPasar = js.filter(j => j.tipo !== 'pasar');
      const lista = sinPasar.length ? sinPasar : js;
      return lista[Math.floor(rng.siguiente() * lista.length)];
    }
  }
  if (js[0].tipo === 'ubicar') return ubicarBien(estado.jugadores[jugador]);
  if (nivel === 'erudito' && estado.fase === 'turno') return erudito(estado, jugador, js);
  return historiador(estado, jugador, js);
}

// Línea de tiempo: el primer hueco donde la carta queda en orden.
function ubicarBien(yo) {
  const k = yo.linea.findIndex(x => x.anio > yo.porUbicar.anio);
  return { tipo: 'ubicar', posicion: k < 0 ? yo.linea.length : k };
}

// ---------- Erudito ----------
const vida = p => (p ? Math.max(0, p.carta.resistencia - p.danio) : 0);
const enMesa = yo => [yo.activo, ...yo.reserva].filter(Boolean);
const suma = xs => xs.reduce((a, b) => a + b, 0);

function mejorGolpe(e, j, saberExtra) {
  const atk = e.jugadores[j].activo;
  if (!atk || !atk.carta.acciones) return 0;
  return Math.max(0, ...atk.carta.acciones.map((a, i) => (atk.saber + saberExtra >= a.costo ? danioDeAccion(e, j, i) : 0)));
}

function evaluar(e, j) {
  const o = j === 'A' ? 'B' : 'A';
  if (e.fase === 'fin') return e.ganador === j ? 1e6 : -1e6;
  const yo = e.jugadores[j], ot = e.jugadores[o];
  let v = 1000 * (yo.hitos - ot.hitos);
  v += suma(enMesa(yo).map(vida)) - 1.2 * suma(enMesa(ot).map(vida));
  v += 14 * suma(enMesa(yo).map(p => p.saber)) - 8 * suma(enMesa(ot).map(p => p.saber));
  v += 4 * yo.mano.length - 2 * ot.mano.length;
  if (yo.activo) v += (yo.activo.bonus || 0) * 0.5 + (yo.activo.protegido ? 30 : 0);
  const miTurno = e.turno === j && e.fase === 'turno';
  const golpeMio = mejorGolpe(e, j, miTurno ? yo.saberPendiente : 1);
  const golpeSuyo = mejorGolpe(e, o, miTurno ? 1 : ot.saberPendiente);
  if (ot.activo && golpeMio >= vida(ot.activo)) v += 250;
  if (yo.activo && golpeSuyo >= vida(yo.activo)) v -= yo.reserva.length ? 300 : 1500;
  return v + 0.4 * golpeMio - 0.4 * golpeSuyo;
}

function erudito(e, j, js) {
  const base = evaluar(e, j);
  let libre = null, vLibre = -Infinity, accion = null, vAccion = -Infinity;
  for (const jd of js) {
    if (jd.tipo === 'pasar') continue;
    const v = evaluar(aplicarJugada(e, jd).estado, j);
    if (jd.tipo === 'accion') { if (v > vAccion) { vAccion = v; accion = jd; } }
    else if (v > vLibre) { vLibre = v; libre = jd; }
  }
  // Primero todo lo que mejora la posición sin terminar el turno; después, la mejor acción.
  if (libre && vLibre > base + 1) return libre;
  return accion || { tipo: 'pasar' };
}

// ---------- Historiador ----------
function historiador(estado, jugador, js) {
  const yo = estado.jugadores[jugador];
  const otro = estado.jugadores[jugador === 'A' ? 'B' : 'A'];
  const carta = uid => { const e = yo.mano.find(c => c.uid === uid); return e && e.carta; };
  const deTipo = t => js.filter(j => j.tipo === t);

  if (estado.fase === 'preparacion') {
    const colocar = deTipo('colocar').sort((a, b) => valorBase(carta(b.uid)) - valorBase(carta(a.uid)));
    if (colocar.length && (!yo.activo || yo.reserva.length < 2)) return colocar[0];
    return js.find(j => j.tipo === 'listo') || js[0];
  }

  if (estado.fase === 'promover') {
    const r = yo.reserva.slice().sort((a, b) => (b.carta.resistencia - b.danio) - (a.carta.resistencia - a.danio));
    return { tipo: 'promover', uid: r[0].uid };
  }

  // 1. Evolucionar.
  const evo = deTipo('evolucionar')[0];
  if (evo) return evo;
  // 2. Bajar protagonistas a la reserva (deja un espacio si ya hay 2).
  const bajar = deTipo('bajar');
  if (bajar.length && yo.reserva.length < 2) return bajar[0];
  // 3. Saber al activo.
  const saber = deTipo('asignarSaber').find(j => j.destino === yo.activo.uid);
  if (saber) return saber;
  // 4. Lugar favorable (bonifica la dimensión del activo) si no hay otro lugar propio.
  const lugar = deTipo('jugar').find(j => {
    const c = carta(j.uid);
    return c.tipo === 'lugar' && !!c.efecto && c.efecto.dimension === yo.activo.carta.dimension && !(estado.lugar && estado.lugar.carta.id === c.id);
  });
  if (lugar) return lugar;
  // 5. Aula o acontecimiento útil.
  const util = deTipo('jugar').find(j => {
    const c = carta(j.uid);
    if (c.tipo === 'lugar') return false;
    // Con respaldo, cuenta el efecto que de verdad se aplicará ahora.
    const ef = efectoEfectivo(estado, jugador, Array.isArray(c.efecto) ? c.efecto[0] : c.efecto);
    const t = ef && ef.tipo;
    if (t === 'curar') return yo.activo.danio >= 20;
    if (t === 'curarTodos') return [yo.activo, ...yo.reserva].some(p => p.danio >= 20);
    if (t === 'retiroGratis') return yo.activo.danio * 2 >= yo.activo.carta.resistencia;
    if (t === 'epidemia') return enMesa(otro).length >= enMesa(yo).length;
    // Quitar el Lugar: si es del rival o favorece a su activo (nunca el propio que conviene).
    if (t === 'anularLugar') return !!(estado.lugar && otro.activo) && (estado.lugar.duenio === (jugador === 'A' ? 'B' : 'A') ||
      !!(estado.lugar.carta.efecto && estado.lugar.carta.efecto.dimension === otro.activo.carta.dimension));
    return true;
  });
  if (util) {
    // Si hay que elegir: en una búsqueda, la carta de mayor valor; al cambiar de activo, el más sano.
    const opciones = deTipo('jugar').filter(j => j.uid === util.uid && j.eleccion);
    if (opciones.length) {
      const valor = j => {
        const enMazo = yo.mazo.find(c => c.uid === j.eleccion);
        if (enMazo) return valorBase(enMazo.carta);
        const r = yo.reserva.find(x => x.uid === j.eleccion);   // cambio de activo: el más sano
        return r ? r.carta.resistencia - r.danio : 0;
      };
      return opciones.reduce((m, j) => (valor(j) > valor(m) ? j : m));
    }
    return util;
  }
  // 6. Retirarse si el activo está por caer y hay alguien sano en reserva.
  const pagable = deTipo('accion');
  const restante = yo.activo.carta.resistencia - yo.activo.danio;
  const retirar = deTipo('retirar');
  if (retirar.length && restante <= 20 && !pagable.length) return retirar[0];
  // 7. La acción de mayor daño base.
  if (pagable.length) {
    pagable.sort((a, b) => (yo.activo.carta.acciones[b.indice].danio || 0) - (yo.activo.carta.acciones[a.indice].danio || 0));
    return pagable[0];
  }
  return { tipo: 'pasar' };
}
