// La Cronista: la guía del juego. Decide qué decir según la situación y explica sus pistas.
// Funciones puras (sin pantalla): reciben el estado y devuelven { clave, expresion, texto }.
// Los textos se insertan como HTML: todo nombre de carta pasa por esc().
import { jugadasValidas, danioDeAccion, VENTAJA } from '../motor.js';
import { elegirJugada } from '../ia.js';
import { textoEfecto, nombreDim } from './carta.js';
import { esc } from '../html.js';

export const EXPRESIONES = ['explica', 'pista', 'celebra', 'atenta'];

const otro = j => (j === 'A' ? 'B' : 'A');
const vida = p => (p ? Math.max(0, p.carta.resistencia - p.danio) : 0);
const n = c => `<b>${esc(c.nombre)}</b>`;
const dice = (clave, expresion, texto) => ({ clave, expresion, texto });

function mejorGolpe(e, j, saberExtra) {
  const atk = e.jugadores[j].activo;
  if (!atk || !atk.carta.acciones) return 0;
  return Math.max(0, ...atk.carta.acciones.map((a, i) => (atk.saber + saberExtra >= a.costo ? danioDeAccion(e, j, i) : 0)));
}

// Situación actual del jugador j, de la más importante a la menos. null si no hay nada que explicar.
export function situacion(e, j) {
  const yo = e.jugadores[j], ot = e.jugadores[otro(j)];
  if (e.fase === 'fin' || e.turno !== j) return null;
  if (e.fase === 'preparacion') {
    if (!yo.activo) return dice('prep-activo', 'explica', 'Elige un Protagonista de tu mano y ponlo como <b>activo</b>: es quien combate. Conviene uno con buena resistencia.');
    if (!yo.reserva.length) return dice('prep-reserva', 'explica', 'Pon Protagonistas en tu <b>reserva</b> (hasta 3). Si tu activo cae y no tienes reserva, pierdes la partida.');
    return null;
  }
  if (e.fase === 'promover') return dice('promover', 'atenta', 'Tu activo cayó. Elige quién de tu <b>reserva</b> pasa al frente: mira su resistencia y contra quién tiene ventaja.');
  if (e.fase !== 'turno') return null;
  const v = jugadasValidas(e);
  if (yo.porUbicar) return dice('ubicar', 'explica', '¡Línea de tiempo! Pon la carta en su lugar: lo más antiguo a la izquierda. Si aciertas, tu activo gana +1 de Saber.');
  if (yo.saberPendiente > 0) return dice('saber', 'explica', 'Cada turno ganas 1 de <b>Saber</b>. Toca un Protagonista para dárselo: las acciones necesitan Saber, y no se pierde al atacar.');
  if (e.numeroTurno <= 1) return dice('primer-turno', 'explica', 'En el primer turno de la partida no se puede atacar. Prepara tu mesa: baja Protagonistas o juega cartas, y luego pasa el turno.');
  if (yo.activo && ot.activo && VENTAJA[ot.activo.carta.dimension] === yo.activo.carta.dimension && mejorGolpe(e, otro(j), 1) > 0) {
    return dice('desventaja', 'atenta', `¡Ojo! ${nombreDim(ot.activo.carta.dimension)} tiene <b>ventaja</b> sobre ${nombreDim(yo.activo.carta.dimension)}: el activo rival te hará el doble de daño. Podrías retirar a tu activo.`);
  }
  if (yo.activo && ot.activo && VENTAJA[yo.activo.carta.dimension] === ot.activo.carta.dimension) {
    return dice('ventaja', 'celebra', `¡Tu activo tiene <b>ventaja</b>! ${nombreDim(yo.activo.carta.dimension)} le gana a ${nombreDim(ot.activo.carta.dimension)}: tus acciones hacen el doble de daño.`);
  }
  if (v.some(x => x.tipo === 'evolucionar')) return dice('evolucion', 'celebra', '¡Puedes <b>evolucionar</b>! Una Etapa 2 muestra cómo algo cambió en la historia, y es más fuerte. Toca la carta que brilla en tu mano.');
  const enMano = tipo => yo.mano.some(c => c.carta.tipo === tipo && v.some(x => x.uid === c.uid));
  if (enMano('personaje')) return dice('personaje', 'explica', 'Tienes un <b>Personaje</b>: una persona real de la historia. Su efecto ocurre al instante, y puedes jugar solo uno por turno.');
  if (enMano('lugar')) return dice('lugar', 'explica', 'Tienes un <b>Lugar</b>: cambia el escenario y da una ventaja mientras esté en juego. Si el rival juega otro, el tuyo se va.');
  if (enMano('aula')) return dice('aula', 'explica', 'Las cartas <b>Aula</b> muestran buenas prácticas de una sala de clases. Te ayudan, y puedes jugar una por turno.');
  if (yo.activo && yo.reserva.length && vida(yo.activo) <= mejorGolpe(e, otro(j), 1)) {
    return dice('peligro', 'atenta', `¡Cuidado! ${n(yo.activo.carta)} puede caer en el próximo ataque. Retirarlo cuesta Saber, pero salva al Protagonista.`);
  }
  if (v.some(x => x.tipo === 'accion')) return dice('accion', 'explica', 'Ya puedes usar una <b>acción</b>: los botones junto a tu activo. Al atacar se termina tu turno, así que primero juega tus cartas.');
  return null;
}

// Lo que dice ante un evento de la partida (la primera vez), desde el punto de vista de j.
export function situacionDeEvento(ev, j) {
  if (ev.tipo === 'conexion' && ev.jugador === j) return dice('conexion', 'celebra', `¡Una <b>conexión</b> causa → consecuencia! ${esc(ev.texto || '')} Por entender cómo se relacionan los hechos, tu activo gana +1 de Saber.`);
  if (ev.tipo === 'hito' && ev.jugador === j) return dice('hito', 'celebra', '¡Ganaste un <b>Hito</b> por derrotar a un Protagonista rival! Los Hitos son los puntos: el primero en reunir los necesarios gana.');
  if (ev.tipo === 'ubicar' && ev.jugador === j && ev.correcto) return dice('ubicar-bien', 'celebra', '¡Muy bien ubicada en tu línea de tiempo! Ordenar los hechos en el tiempo es pensar como historiador.');
  if (ev.tipo === 'caida' && ev.jugador === j) return dice('caida', 'atenta', 'Perdiste un Protagonista y el rival gana un Hito. Elige bien quién sigue: busca a quien tenga ventaja.');
  return null;
}

// Pista a pedido: la jugada que haría el rival Erudito, explicada. En la línea de tiempo no se revela la respuesta.
export function pista(e, j) {
  const yo = e.jugadores[j], ot = e.jugadores[otro(j)];
  if (e.turno !== j || e.fase === 'fin') return { jugada: null, expresion: 'explica', texto: 'Ahora juega el rival. Mira qué hace: así también se aprende.' };
  if (yo.porUbicar) {
    const ref = yo.linea[0];
    return { jugada: null, expresion: 'pista', texto: `Piensa en las fechas que ya tienes: ¿${n(yo.porUbicar)} ocurrió antes o después de ${n(ref)} (${esc(ref.texto)})? Lo más antiguo va a la izquierda.` };
  }
  const jugada = elegirJugada(e, j, { nivel: 'erudito' });
  return { jugada, expresion: 'pista', texto: explicar(e, j, jugada) };
}

function cartaDe(e, j, uid) {
  const yo = e.jugadores[j];
  const x = [...yo.mano, ...yo.reserva, yo.activo].find(c => c && c.uid === uid);
  return x ? x.carta : null;
}

function explicar(e, j, jd) {
  const yo = e.jugadores[j], ot = e.jugadores[otro(j)];
  switch (jd.tipo) {
    case 'colocar': {
      const c = cartaDe(e, j, jd.uid);
      return yo.activo ? `Pon a ${n(c)} en tu reserva: así tendrás quien entre si tu activo cae.` : `Pon a ${n(c)} como tu activo: tiene ${esc(c.resistencia)} de resistencia.`;
    }
    case 'listo': return 'Tu mesa ya está lista. Toca <b>Listo</b> para empezar.';
    case 'asignarSaber': {
      const destino = [yo.activo, ...yo.reserva].find(p => p && p.uid === jd.destino);
      const siguiente = (destino.carta.acciones || []).find(a => a.costo === destino.saber + 1) || (destino.carta.acciones || []).find(a => a.costo > destino.saber);
      if (destino === yo.activo && siguiente) return `Dale el Saber a ${n(destino.carta)}: con ${esc(destino.saber + 1)} de Saber podrá usar <b>${esc(siguiente.nombre)}</b> (${esc(danioDeAccion(e, j, destino.carta.acciones.indexOf(siguiente)))} de daño).`;
      if (destino === yo.activo) return `Dale el Saber a ${n(destino.carta)}, tu activo: el Saber nunca se pierde al atacar.`;
      return `Dale el Saber a ${n(destino.carta)}, de tu reserva: así estará listo para atacar cuando pase al frente.`;
    }
    case 'accion': {
      const a = yo.activo.carta.acciones[jd.indice];
      const d = danioDeAccion(e, j, jd.indice);
      const ventaja = VENTAJA[yo.activo.carta.dimension] === ot.activo.carta.dimension;
      const remata = d >= vida(ot.activo);
      return `Usa <b>${esc(a.nombre)}</b>: hace ${esc(d)} de daño${ventaja ? ', ¡con ventaja ×2!' : '.'}${remata ? ` Así derrotas a ${n(ot.activo.carta)} y ganas un Hito.` : ''}`;
    }
    case 'bajar': return `Baja a ${n(cartaDe(e, j, jd.uid))} a tu reserva: si tu activo cae, necesitarás quien lo reemplace.`;
    case 'evolucionar': {
      const c = cartaDe(e, j, jd.uid);
      return `Evoluciona: ${n(c)} es la Etapa 2. Muestra cómo cambió la historia, y tiene más resistencia y mejores acciones.`;
    }
    case 'jugar': {
      const c = cartaDe(e, j, jd.uid);
      return `Juega ${n(c)}. ${esc(c.texto || textoEfecto(c.efecto))}`;
    }
    case 'retirar': {
      const r = yo.reserva.find(p => p.uid === jd.reemplazo);
      return `Retira a ${n(yo.activo.carta)}, que está en peligro, y pon a ${n(r.carta)} al frente.`;
    }
    case 'promover': {
      const r = yo.reserva.find(p => p.uid === jd.uid);
      return `Pon a ${n(r.carta)} al frente: es tu mejor opción contra ${ot.activo ? n(ot.activo.carta) : 'el rival'}.`;
    }
    case 'pasar': return 'No hay una jugada mejor ahora: toca <b>Pasar turno</b> y guarda tus cartas para después.';
    default: return 'Mira las cartas que brillan: esas se pueden jugar.';
  }
}
