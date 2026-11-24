// Sorteo inicial con la moneda SIU: un jugador al azar elige anverso o reverso, se lanza la moneda
// y, si acierta, parte él. Contra la tablet, si le toca elegir a la tablet, elige sola.
// Devuelve una promesa con quién parte ('A' o 'B').
import { quienElige, lanzarMoneda, quienParte } from '../moneda.js';
import { sonidos } from './sonido.js';

const CARAS = { anverso: 'img/moneda/anverso.webp', reverso: 'img/moneda/reverso.webp' };
const NOMBRE_LADO = { anverso: 'Anverso', reverso: 'Reverso' };
const esperar = ms => new Promise(r => setTimeout(r, ms));
const sinMovimiento = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const el = (tag, cls, texto) => { const e = document.createElement(tag); if (cls) e.className = cls; if (texto != null) e.textContent = texto; return e; };

export async function sorteoInicial(contenedor, { nombres, contraIA = false, caraACara = false, azar = Math.random } = {}) {
  const elige = quienElige(azar);
  const nombre = j => (contraIA ? (j === 'A' ? 'Tú' : 'La tablet') : nombres[j]);
  const capa = el('div', 'sorteo');
  const panel = el('div', `sorteo-panel${caraACara && elige === 'B' ? ' girado' : ''}`);
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', '¿Quién parte?');
  const titulo = el('h2', '', '¿Quién parte?');
  const texto = el('p', 'sorteo-texto', contraIA
    ? (elige === 'A' ? 'Elige un lado de la moneda. Si aciertas, partes tú.' : 'La tablet elige un lado de la moneda…')
    : `${nombre(elige)} elige un lado de la moneda. Si acierta, parte.`);
  const escena = el('div', 'moneda-escena');
  const moneda = el('div', 'moneda');
  for (const lado of ['anverso', 'reverso']) {
    const img = el('img', `cara cara-${lado}`);
    img.src = CARAS[lado]; img.alt = ''; img.draggable = false;
    moneda.appendChild(img);
  }
  escena.append(moneda, el('i', 'sombra-moneda'));
  const opciones = el('div', 'sorteo-opciones');
  const comenzar = el('button', 'boton-principal sorteo-comenzar', 'Comenzar');
  comenzar.hidden = true;
  panel.append(titulo, texto, escena, opciones, comenzar);
  capa.appendChild(panel);
  contenedor.appendChild(capa);

  // 1. Quien elige escoge un lado (la tablet, sola).
  let eleccion;
  if (contraIA && elige === 'B') {
    await esperar(1100);
    eleccion = azar() < 0.5 ? 'anverso' : 'reverso';
    texto.textContent = `La tablet eligió ${NOMBRE_LADO[eleccion].toLowerCase()}.`;
    await esperar(700);
  } else {
    eleccion = await new Promise(listo => {
      for (const lado of ['anverso', 'reverso']) {
        const b = el('button', 'opcion opcion-lado');
        const img = el('img'); img.src = CARAS[lado]; img.alt = '';
        b.append(img, el('b', '', NOMBRE_LADO[lado]));
        b.onclick = () => listo(lado);
        opciones.appendChild(b);
      }
    });
    opciones.innerHTML = '';
    texto.textContent = contraIA ? `Elegiste ${NOMBRE_LADO[eleccion].toLowerCase()}.` : `${nombre(elige)} eligió ${NOMBRE_LADO[eleccion].toLowerCase()}.`;
  }

  // 2. Se lanza la moneda: gira en el aire y cae mostrando el lado que salió.
  const salio = lanzarMoneda(azar);
  sonidos.monedaLanzar();
  const final = salio === 'reverso' ? 180 : 0;
  if (!sinMovimiento() && moneda.animate) {
    const vueltas = 6 * 360 + final;
    const anim = moneda.animate([
      { transform: 'translateY(0) rotateY(0deg) scale(1)' },
      { offset: 0.45, transform: `translateY(-38%) rotateY(${vueltas * 0.55}deg) scale(1.18)` },
      { offset: 0.85, transform: `translateY(0) rotateY(${vueltas * 0.95}deg) scale(1)` },
      { transform: `translateY(0) rotateY(${vueltas}deg) scale(1)` },
    ], { duration: 1700, easing: 'cubic-bezier(.3,.6,.4,1)', fill: 'forwards' });
    await new Promise(r => { anim.onfinish = r; setTimeout(r, 1900); });
  } else moneda.style.transform = `rotateY(${final}deg)`;
  sonidos.monedaCae();

  // 3. Resultado: parte quien acertó (o el otro).
  const parte = quienParte(elige, eleccion, salio);
  const acerto = eleccion === salio;
  const quien = contraIA ? (elige === 'A' ? '' : 'la tablet') : nombre(elige);
  const veredicto = !quien ? (acerto ? '¡acertaste!' : 'no acertaste.') : acerto ? `¡${quien} acertó!` : `${quien} no acertó.`;
  texto.textContent = `Salió ${NOMBRE_LADO[salio].toLowerCase()}: ${veredicto}`;
  titulo.textContent = contraIA ? (parte === 'A' ? 'Partes tú' : 'Parte la tablet') : `Parte ${nombre(parte)}`;
  panel.classList.remove('girado');
  panel.classList.add('resuelto');
  comenzar.hidden = false;
  comenzar.focus();
  await new Promise(r => { comenzar.onclick = r; });
  capa.remove();
  return parte;
}
