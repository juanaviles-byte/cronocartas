// Director de escena: antes de mostrar el resultado de una jugada, la representa paso a paso
// sobre la mesa tal como estaba (anticipación → acción → impacto → reacción). Luego la mesa
// se redibuja con el estado nuevo. Solo transform/opacity/filter y Web Animations API.
import { impacto, estallido, deshacerEnArena } from './efectos.js';

const rival = j => (j === 'A' ? 'B' : 'A');

// Qué escena corresponde a una jugada (función pura: no toca el DOM).
export function planDeEscena(antes, jugada, eventos) {
  const j = antes.turno, yo = antes.jugadores[j];
  if (jugada.tipo === 'accion') {
    const d = eventos.find(e => e.tipo === 'danio' && e.jugador === j);
    const def = antes.jugadores[rival(j)].activo;
    if (!d || !def || !yo.activo) return null;
    const vidaAntes = Math.max(0, def.carta.resistencia - def.danio);
    return {
      tipo: 'ataque', jugador: j, valor: d.valor, accion: d.accion,
      ventaja: eventos.some(e => e.tipo === 'ventaja'), protegido: eventos.some(e => e.tipo === 'protegido'),
      cae: eventos.some(e => e.tipo === 'caida' && e.jugador === rival(j)),
      vidaAntes, vidaDespues: Math.max(0, vidaAntes - d.valor),
    };
  }
  if (['colocar', 'bajar', 'evolucionar', 'jugar'].includes(jugada.tipo)) {
    const entrada = yo.mano.find(c => c.uid === jugada.uid);
    if (!entrada) return null;
    const destino = jugada.tipo === 'colocar' ? (yo.activo ? 'reserva' : 'activo')
      : jugada.tipo === 'bajar' ? 'reserva'
        : jugada.tipo === 'evolucionar' ? 'evolucion'
          : entrada.carta.tipo === 'lugar' ? 'lugar' : 'efecto';
    return { tipo: 'invocacion', jugador: j, uid: entrada.uid, carta: entrada.carta, destino, objetivo: jugada.objetivo || null, breve: antes.fase === 'preparacion' };
  }
  return null;
}

const esperar = ms => new Promise(r => setTimeout(r, ms));
const centro = r => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
// Dentro de la mitad girada (cara a cara), un desplazamiento en pantalla se aplica al revés.
const signo = el => (el.closest('.girado') ? -1 : 1);
const fin = a => (a && a.finished ? a.finished.catch(() => {}) : Promise.resolve());

function sacudir(mesa, fuerza = 7) {
  if (!mesa || !mesa.animate) return;
  const f = fuerza;
  mesa.animate([{ transform: 'none' }, { transform: `translate(${-f}px, ${f * 0.4}px)` }, { transform: `translate(${f * 0.8}px, ${-f * 0.5}px)` },
    { transform: `translate(${-f * 0.5}px, ${-f * 0.3}px)` }, { transform: `translate(${f * 0.3}px, ${f * 0.2}px)` }, { transform: 'none' }], { duration: 260, easing: 'ease-out' });
}

function numeroGolpe(el, texto, extra) {
  const r = el.getBoundingClientRect(), c = centro(r);
  const n = document.createElement('div');
  n.className = 'numero-golpe';
  n.innerHTML = `<b>${texto}</b>${extra ? `<small>${extra}</small>` : ''}`;
  n.style.left = `${c.x}px`; n.style.top = `${c.y}px`;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 1300);
}

function contarVida(el, desde, hasta, ms) {
  const res = el && el.querySelector('.m-res');
  if (!res || desde === hasta) return;
  res.classList.add('herido', 'bajando');
  const t0 = performance.now();
  const paso = ahora => {
    const k = Math.min(1, (ahora - t0) / ms);
    res.textContent = String(Math.round(desde + (hasta - desde) * k));
    if (k < 1) requestAnimationFrame(paso); else res.classList.remove('bajando');
  };
  requestAnimationFrame(paso);
}

/** Ataque: el activo se levanta, toma impulso, embiste, la acción se congela en el impacto y el rival acusa el golpe. */
export async function escenaAtaque({ mesa, atk, def, plan, alGolpear, alCaer }) {
  if (!atk || !def || !atk.animate) return;
  const a = centro(atk.getBoundingClientRect()), d = centro(def.getBoundingClientRect());
  const s = signo(atk), dx = (d.x - a.x) * s, dy = (d.y - a.y) * s;
  const dist = Math.hypot(dx, dy) || 1, ux = dx / dist, uy = dy / dist;
  const alcance = Math.max(0, dist - def.getBoundingClientRect().height * 0.55);
  atk.style.zIndex = '30';
  atk.classList.add('en-ataque');
  // 1) Se levanta y 2) toma impulso hacia atrás.
  await fin(atk.animate([{ transform: 'none' }, { transform: 'translateY(-6%) scale(1.1)' }, { transform: `translate(${-ux * 16}px, ${-uy * 16 - 8}px) scale(1.12) rotate(${-ux * 4}deg)` }],
    { duration: 300, easing: 'cubic-bezier(.3,.6,.4,1)', fill: 'forwards' }));
  // 3) Embiste.
  await fin(atk.animate([{ transform: `translate(${-ux * 16}px, ${-uy * 16 - 8}px) scale(1.12) rotate(${-ux * 4}deg)` }, { transform: `translate(${ux * alcance}px, ${uy * alcance}px) scale(1.06) rotate(${ux * 3}deg)` }],
    { duration: 170, easing: 'cubic-bezier(.6,0,.9,.6)', fill: 'forwards' }));
  // 4) Impacto: la acción se congela un instante, tiembla la mesa, salta el daño.
  if (alGolpear) alGolpear();
  impacto(def);
  sacudir(mesa, plan.valor >= 60 ? 10 : 7);
  def.animate([{ filter: 'brightness(2.4) saturate(.3)' }, { filter: 'none' }], { duration: 260 });
  const extra = plan.protegido ? 'Protegido' : plan.ventaja ? '¡Ventaja ×2!' : '';
  numeroGolpe(def, plan.valor ? `−${plan.valor}` : '0', extra);
  contarVida(def, plan.vidaAntes, plan.vidaDespues, 420);
  await esperar(90);
  // 5) El defensor retrocede; el atacante vuelve a su lugar.
  const sd = signo(def);
  def.animate([{ transform: 'none' }, { transform: `translate(${ux * 14 * sd}px, ${uy * 14 * sd}px) rotate(${ux * 5}deg)` }, { transform: 'none' }], { duration: 380, easing: 'ease-out' });
  await fin(atk.animate([{ transform: `translate(${ux * alcance}px, ${uy * alcance}px) scale(1.06) rotate(${ux * 3}deg)` }, { transform: 'none' }],
    { duration: 300, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' }));
  atk.classList.remove('en-ataque');
  atk.style.zIndex = '';
  await esperar(160);
  // 6) Si cayó: cámara lenta, se vuelve foto antigua y se deshace en arena.
  if (plan.cae) {
    if (alCaer) alCaer();
    def.classList.add('cayendo');
    await fin(def.animate([{ filter: 'none', transform: 'none' }, { filter: 'sepia(1) saturate(.5) brightness(.9)', transform: 'scale(1.04) rotate(-2deg)' }],
      { duration: 520, easing: 'ease-out', fill: 'forwards' }));
    const sello = document.createElement('div');
    sello.className = 'sello-archivo';
    sello.textContent = 'Archivada';
    def.appendChild(sello);
    await esperar(260);
    await deshacerEnArena(def, 950);
  }
}

/**
 * Invocación: la carta sale de la mano, se muestra en grande sobre un círculo dorado y aterriza en su lugar.
 * Personajes y Acontecimientos se muestran con su efecto y se deshacen en arena (van al descarte).
 */
export async function escenaInvocacion({ grande, desde, destino, plan, girado = false, detalle = '', espera = null }) {
  if (!grande || !grande.animate) return;
  const capa = document.createElement('div');
  capa.className = `escena-invocacion${girado ? ' girado' : ''}`;
  const caja = document.createElement('div');
  caja.className = 'invocada';
  caja.appendChild(grande);
  capa.appendChild(caja);
  if (detalle) {
    const t = document.createElement('div');
    t.className = 'cartel-invocacion';
    t.innerHTML = detalle;
    capa.appendChild(t);
  }
  document.body.appendChild(capa);
  const rc = caja.getBoundingClientRect(), c = centro(rc);
  // Círculo dorado en el destino (o bajo la carta si es un efecto).
  let circulo = null;
  const rd = destino ? destino.getBoundingClientRect() : null;
  if (rd || plan.destino === 'efecto') {
    circulo = document.createElement('div');
    circulo.className = 'circulo-invocacion';
    const p = rd ? centro(rd) : c;
    circulo.style.left = `${p.x}px`; circulo.style.top = `${p.y}px`;
    circulo.style.setProperty('--d', `${Math.max(rd ? rd.width : rc.width, 80) * 1.7}px`);
    document.body.appendChild(circulo);
  }
  const g = girado ? -1 : 1;
  const de = desde || { x: c.x, y: innerHeight };
  const k0 = Math.max(0.2, Math.min(0.5, 80 / rc.width));
  // Sale de la mano y crece en el centro.
  await fin(caja.animate([
    { transform: `translate(${(de.x - c.x) * g}px, ${(de.y - c.y) * g}px) scale(${k0}) rotate(-10deg)`, opacity: 0.4 },
    { offset: 0.7, transform: 'translate(0, -6px) scale(1.06) rotate(1deg)', opacity: 1 },
    { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' }));
  estallido(c.x, c.y, 22, 3);
  await Promise.all([esperar(plan.destino === 'efecto' ? 1100 : 480), espera]);   // si el Personaje habla, la carta espera su frase
  if (plan.destino === 'efecto') {
    await deshacerEnArena(caja, 700);
  } else if (rd) {
    const p = centro(rd), k = Math.max(0.15, rd.height / rc.height);
    await fin(caja.animate([{ transform: 'none' }, { transform: `translate(${(p.x - c.x) * g}px, ${(p.y - c.y) * g}px) scale(${k})`, opacity: 1 }],
      { duration: 300, easing: 'cubic-bezier(.6,0,.4,1)', fill: 'forwards' }));
    estallido(p.x, p.y + rd.height * 0.3, 26, 3.4);
  }
  if (circulo) { circulo.classList.add('apaga'); setTimeout(() => circulo.remove(), 450); }
  capa.remove();
}
