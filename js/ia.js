// Rival automático: simple, predecible y suficiente para practicar.
import { jugadasValidas } from './motor.js';

const valorBase = c => (c.resistencia || 0) + Math.max(0, ...(c.acciones || []).map(a => a.danio || 0));

export function elegirJugada(estado, jugador) {
  const js = jugadasValidas(estado);
  if (!js.length) return null;
  const yo = estado.jugadores[jugador];
  const otro = estado.jugadores[jugador === 'A' ? 'B' : 'A'];
  const carta = uid => yo.mano.find(c => c.uid === uid)?.carta;
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
    return c.tipo === 'lugar' && c.efecto?.dimension === yo.activo.carta.dimension && estado.lugar?.carta.id !== c.id;
  });
  if (lugar) return lugar;
  // 5. Aula o acontecimiento útil.
  const util = deTipo('jugar').find(j => {
    const c = carta(j.uid);
    if (c.tipo === 'lugar') return false;
    const t = c.efecto?.tipo;
    if (t === 'curar') return yo.activo.danio >= 20;
    if (t === 'anularLugar') return estado.lugar?.carta.efecto?.dimension === otro.activo?.carta.dimension;
    return true;
  });
  if (util) {
    // En una búsqueda, toma el Protagonista de mayor valor.
    const opciones = deTipo('jugar').filter(j => j.uid === util.uid && j.eleccion);
    if (opciones.length) {
      const valor = j => valorBase(yo.mazo.find(c => c.uid === j.eleccion).carta);
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
