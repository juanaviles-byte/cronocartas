// Dibuja una carta en tres tamaños: mini (mano y mesa), normal y grande (detalle).
import { arteCarta, colorCarta } from './arte.js';
import { VENTAJA } from '../motor.js';
import { NOMBRE_DIMENSION } from '../mazos.js';

const DEBIL_ANTE = Object.fromEntries(Object.entries(VENTAJA).map(([a, b]) => [b, a]));
const TIPO = { protagonista: 'Protagonista', acontecimiento: 'Acontecimiento', lugar: 'Lugar', aula: 'Aula · MBE' };

export const nombreDim = d => NOMBRE_DIMENSION[d] || d;

export function textoEfecto(ef) {
  if (!ef) return '';
  switch (ef.tipo) {
    case 'robar': return `Roba ${ef.n} carta${ef.n > 1 ? 's' : ''}.`;
    case 'curar': return `Tu activo recupera ${ef.n} de resistencia.`;
    case 'proteger': return 'Tu activo no recibe daño hasta tu próximo turno.';
    case 'bonusDanio': return `Tu próxima acción hace +${ef.n} de daño.`;
    case 'moverSaber': return 'Pasa 1 de Saber de tu reserva a tu activo.';
    case 'anularLugar': return 'Quita el Lugar en juego.';
    case 'robarPorReserva': return 'Roba 1 carta por cada Protagonista en tu reserva.';
    case 'buscarProtagonista': return `Mira ${ef.n || 3} cartas de tu mazo y toma un Protagonista.`;
    case 'bonusDimension': return `Los Protagonistas de ${nombreDim(ef.dimension)} hacen +${ef.n} de daño.`;
    default: return '';
  }
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const pips = n => '<i class="pip"></i>'.repeat(n);

export function renderCarta(carta, { tamano = 'normal', instancia = null, unidades = null } = {}) {
  const el = document.createElement('div');
  el.className = `carta carta-${tamano} tipo-${carta.tipo}`;
  el.style.setProperty('--c', colorCarta(carta));
  if (carta.comunidad) el.classList.add('comunidad');

  const imagen = carta.imagen ? `<img src="${esc(carta.imagen)}" alt="">` : arteCarta(carta);
  const res = carta.resistencia;
  const vida = instancia ? Math.max(0, res - instancia.danio) : res;

  if (tamano === 'mini') {
    el.innerHTML = `
      <div class="arte">${imagen}</div>
      <div class="mini-nombre">${esc(carta.nombre)}</div>
      ${carta.tipo === 'protagonista' ? `
        <div class="mini-vida"><b>${vida}</b>${instancia && instancia.danio ? `<span class="barra"><span style="width:${(vida / res) * 100}%"></span></span>` : ''}</div>
        ${instancia ? `<div class="mini-saber">${pips(instancia.saber)}</div>` : ''}
        ${instancia?.protegido ? '<div class="sello">Protegido</div>' : ''}
        ${instancia?.bonus ? `<div class="sello">+${instancia.bonus}</div>` : ''}
      ` : `<div class="mini-tipo">${TIPO[carta.tipo]}</div>`}
      ${carta.evolucionaDe ? '<div class="etapa">2</div>' : ''}`;
    return el;
  }

  const unidad = carta.unidad && unidades ? unidades[carta.unidad - 1] : null;
  const encabezado = carta.tipo === 'protagonista'
    ? `<span class="chip">${nombreDim(carta.dimension)}</span>${carta.evolucionaDe ? `<span class="chip claro">Etapa 2${carta.baseNombre ? ` · viene de ${esc(carta.baseNombre)}` : ''}</span>` : ''}`
    : `<span class="chip">${TIPO[carta.tipo]}</span>`;

  let cuerpo = '';
  if (carta.tipo === 'protagonista') {
    cuerpo = `<ul class="acciones">${carta.acciones.map(a => `
      <li><span class="costo" title="Saber necesario">${pips(a.costo)}</span><span class="an">${esc(a.nombre)}</span><b>${a.danio}</b></li>`).join('')}
    </ul>
    <div class="pie-prot"><span>Débil ante <b>${nombreDim(DEBIL_ANTE[carta.dimension])}</b></span><span>Retirada ${pips(carta.retirada ?? 1)}</span></div>`;
  } else {
    cuerpo = `<p class="efecto">${esc(carta.texto || textoEfecto(carta.efecto))}</p>`;
  }

  el.innerHTML = `
    <div class="cabeza">
      <div class="nombre">${esc(carta.nombre)}</div>
      ${res ? `<div class="res"><small>RES</small>${instancia ? `${vida}<small>/${res}</small>` : res}</div>` : ''}
    </div>
    <div class="arte">${imagen}${instancia ? `<div class="saber-en-mesa">${pips(instancia.saber)}</div>` : ''}</div>
    <div class="linea">${encabezado}</div>
    ${cuerpo}
    <p class="dato">${esc(carta.dato)}</p>
    <div class="ref">${carta.mbe ? `MBE · Dominio ${carta.mbe.dominio} · Estándar ${carta.mbe.estandar}` :
      `${carta.curso ? `${carta.curso}° básico` : ''}${unidad ? ` · U${carta.unidad} ${esc(unidad)}` : carta.unidad ? ` · Unidad ${carta.unidad}` : ''}${carta.oa ? ` · ${esc(carta.oa)}` : ''}`}
      ${carta.comunidad ? `<span class="autor">Creada por ${esc(carta.autor || 'estudiante')}</span>` : ''}</div>`;
  return el;
}
