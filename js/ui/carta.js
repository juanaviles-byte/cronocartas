// Dibuja una carta al estilo de un TCG: marco de color según el tipo, ventana de
// ilustración, acciones con íconos de Saber, debilidad, retirada y el dato.
// Tamaños: mini (mano y mesa), normal (colección) y grande (detalle).
import { arteCarta, temaCarta, iconoTipo } from './arte.js';
import { VENTAJA } from '../motor.js';
import { NOMBRE_DIMENSION } from '../mazos.js';
import { esc, pips } from '../html.js';

const DEBIL_ANTE = Object.fromEntries(Object.entries(VENTAJA).map(([a, b]) => [b, a]));
const ETIQUETA = { personaje: 'Personaje', acontecimiento: 'Acontecimiento', lugar: 'Lugar', aula: 'Aula · MBE' };
const NOMBRE_BUSQUEDA = { lugar: 'un Lugar', protagonista: 'un Protagonista', acontecimiento: 'un Acontecimiento', cualquiera: 'la carta que quieras' };

export const nombreDim = d => NOMBRE_DIMENSION[d] || d;

export function textoEfecto(ef) {
  if (!ef) return '';
  if (Array.isArray(ef)) return ef.map(textoEfecto).join(' Luego, ').replace(/ Luego, (\w)/g, (m, l) => ` Luego, ${l.toLowerCase()}`);
  switch (ef.tipo) {
    case 'buscar': return `Mira las ${ef.n || 3} primeras cartas de tu mazo y toma ${NOMBRE_BUSQUEDA[ef.cartaTipo] || 'una carta'}. El resto va al fondo.`;
    case 'retiroGratis': return 'Cambia tu activo por un Protagonista de tu reserva, sin pagar retirada.';
    case 'saberExtra': return `Tu activo recibe ${ef.n || 1} de Saber extra.`;
    case 'curarTodos': return `Todos tus Protagonistas recuperan ${ef.n} de resistencia.`;
    case 'moverSaberTodo': return 'Pasa todo el Saber de un Protagonista de tu reserva a tu activo.';
    case 'robar': return `Roba ${ef.n} carta${ef.n > 1 ? 's' : ''}.`;
    case 'curar': return `Tu activo recupera ${ef.n} de resistencia.`;
    case 'proteger': return 'Tu activo no recibe daño hasta tu próximo turno.';
    case 'bonusDanio': return ef.dimension ? `Si tu activo es de ${nombreDim(ef.dimension)}, su próxima acción hace +${ef.n} de daño.` : `Tu próxima acción hace +${ef.n} de daño.`;
    case 'moverSaber': return 'Pasa 1 de Saber de tu reserva a tu activo.';
    case 'anularLugar': return 'Quita el Lugar en juego.';
    case 'robarPorReserva': return 'Roba 1 carta por cada Protagonista en tu reserva.';
    case 'buscarProtagonista': return `Mira las ${ef.n || 3} primeras cartas de tu mazo y toma un Protagonista. El resto va al fondo.`;
    case 'bonusDimension': return `Mientras esté en juego, los Protagonistas de ${nombreDim(ef.dimension)} hacen +${ef.n} de daño.`;
    default: return '';
  }
}

// Imágenes por código de carta (las registra datos.js al cargar un curso).
const IMAGENES = new Map();
export function registrarImagenes(mapa) {
  for (const [id, img] of Object.entries(mapa || {})) IMAGENES.set(id, img);
}

function imagenDe(carta) {
  const img = carta.imagen || IMAGENES.get(carta.id);
  return img ? `<img src="${esc(img)}" alt="">` : arteCarta(carta);
}

function miniaturaBase(carta) {
  if (!carta.evolucionaDe) return '';
  const base = { id: carta.evolucionaDe, tipo: 'protagonista', dimension: carta.baseDimension || carta.dimension, emblema: carta.baseEmblema || 'estrella' };
  return `<div class="miniatura-base" title="Viene de ${esc(carta.baseNombre || '')}">${imagenDe(base)}</div>`;
}

function aplicarTema(el, carta) {
  const t = temaCarta(carta);
  el.style.setProperty('--c', t.base);
  el.style.setProperty('--c-claro', t.claro);
  el.style.setProperty('--c-oscuro', t.oscuro);
  el.style.setProperty('--c-papel', t.papel);
}

export function renderCarta(carta, { tamano = 'normal', instancia = null, unidades = null } = {}) {
  const el = document.createElement('div');
  el.className = `carta carta-${tamano} tipo-${carta.tipo}${carta.comunidad ? ' comunidad' : ''}`;
  aplicarTema(el, carta);
  const esProt = carta.tipo === 'protagonista';
  const res = carta.resistencia;
  const vida = instancia ? Math.max(0, res - instancia.danio) : res;
  const claveTipo = esProt ? carta.dimension : carta.tipo;

  if (tamano === 'mini') {
    el.innerHTML = `
      <div class="m-cab"><span class="m-nombre">${esc(carta.nombre)}</span></div>
      <div class="m-ventana">${imagenDe(carta)}
        ${instancia ? `<div class="mini-saber">${pips(instancia.saber)}</div>` : ''}
        ${carta.evolucionaDe ? '<div class="etapa">2</div>' : ''}
        ${instancia?.protegido ? '<div class="sello">Protegido</div>' : ''}
        ${instancia?.bonus ? `<div class="sello">+${esc(instancia.bonus)}</div>` : ''}
      </div>
      <div class="m-pie">
        ${esProt ? `<b class="m-res">${esc(vida)}</b>${instancia && instancia.danio ? `<span class="barra"><span style="width:${(vida / res) * 100}%"></span></span>` : ''}`
                 : `<span class="m-tipo">${ETIQUETA[carta.tipo]}</span>`}
        ${iconoTipo(claveTipo, 16)}
      </div>`;
    return el;
  }

  const unidad = carta.unidad && unidades ? unidades[carta.unidad - 1] : null;
  const franja = carta.mbe
    ? `Dominio ${esc(carta.mbe.dominio)} · Estándar ${esc(carta.mbe.estandar)}: ${esc(carta.mbe.nombre)}`
    : `${carta.curso ? `${esc(carta.curso)}° básico` : ''}${carta.unidad ? ` · Unidad ${esc(carta.unidad)}${unidad ? `: ${esc(unidad)}` : ''}` : ''}`;

  let cabeza;
  if (esProt) {
    cabeza = `
      <div class="cab${carta.evolucionaDe ? ' con-base' : ''}">
        ${miniaturaBase(carta)}
        ${carta.evolucionaDe ? `<div class="etapa-previa" title="Viene de ${esc(carta.baseNombre || '')}"><span>Etapa 2</span>${carta.baseNombre ? `<small>de ${esc(carta.baseNombre)}</small>` : ''}</div>` : '<div class="etapa-previa"><span>Básico</span></div>'}
        <div class="nombre">${esc(carta.nombre)}</div>
        <div class="res"><small>RES</small>${instancia ? `${esc(vida)}<small>/${esc(res)}</small>` : esc(res)}${iconoTipo(claveTipo, 26)}</div>
      </div>`;
  } else {
    cabeza = `
      <div class="cab cab-apoyo">
        <div class="etiqueta-apoyo">${ETIQUETA[carta.tipo]}</div>
        <div class="nombre">${esc(carta.nombre)}</div>
        ${iconoTipo(claveTipo, 26)}
      </div>`;
  }

  let cuerpo;
  if (esProt) {
    cuerpo = `
      <div class="acciones">${carta.acciones.map(a => `
        <div class="accion"><span class="costo">${pips(a.costo)}</span><span class="an">${esc(a.nombre)}</span><b>${esc(a.danio)}</b></div>`).join('')}
      </div>
      <div class="pie-tcg">
        <span><small>Débil ante</small> ${iconoTipo(DEBIL_ANTE[carta.dimension], 18)} <b>×2</b></span>
        <span><small>Dimensión</small> ${esc(nombreDim(carta.dimension))}</span>
        <span><small>Retirada</small> ${pips(carta.retirada ?? 1)}</span>
      </div>`;
  } else {
    cuerpo = `<div class="efecto"><small>Efecto</small>${esc(carta.texto || textoEfecto(carta.efecto))}</div>`;
  }

  el.innerHTML = `
    <div class="marco">
      ${cabeza}
      <div class="ventana">${imagenDe(carta)}${instancia ? `<div class="saber-en-mesa">${pips(instancia.saber)}</div>` : ''}</div>
      <div class="franja">${franja}</div>
      ${cuerpo}
      <div class="dato">${esc(carta.dato)}</div>
      <div class="pie-codigo"><span>${esc(carta.id || '')}${carta.oa ? ` · ${esc(carta.oa)}` : ''}</span>${carta.comunidad ? `<span class="autor">★ ${esc(carta.autor || 'Estudiante')}</span>` : ''}</div>
    </div>`;
  return el;
}
