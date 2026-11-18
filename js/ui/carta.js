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

export function textoHabilidad(h) {
  if (!h) return '';
  switch (h.tipo) {
    case 'resistente': return `Recibe ${h.n} menos de daño.`;
    case 'fuerzaReserva': return `+${h.n} de daño por cada Protagonista en tu reserva.`;
    case 'sanador': return `Si es tu activo, recupera ${h.n} al inicio de tu turno.`;
    case 'inspirador': return 'Al entrar en juego, robas 1 carta.';
    case 'saberAlEntrar': return `Entra en juego con ${h.n || 1} de Saber.`;
    default: return '';
  }
}

// Texto para leer la carta en voz alta.
export function textoParaLeer(c) {
  const partes = [c.nombre];
  if (c.tipo === 'protagonista') partes.push(`Protagonista de ${nombreDim(c.dimension)}, resistencia ${c.resistencia}.`);
  else partes.push(`${ETIQUETA[c.tipo] || ''}.`);
  // Texto plano para la voz (no se inserta como HTML).
  if (c.habilidad) partes.push('Habilidad ' + c.habilidad.nombre + ': ' + textoHabilidad(c.habilidad));
  if (c.tipo === 'protagonista') c.acciones.forEach(a => partes.push('Acción ' + a.nombre + ': necesita ' + a.costo + ' de Saber y hace ' + a.danio + ' de daño.'));
  else if (c.efecto || c.texto) partes.push(c.texto || textoEfecto(c.efecto));
  partes.push(c.dato);
  return partes.join(' ');
}

// Solo las reglas de la carta (sin nombre ni dato): lo que la voz del dispositivo lee después del narrador grabado.
export function textoReglas(c) {
  const partes = [];
  if (c.tipo === 'protagonista') partes.push(`Protagonista de ${nombreDim(c.dimension)}, resistencia ${c.resistencia}.`);
  else partes.push(`${ETIQUETA[c.tipo] || ''}.`);
  if (c.habilidad) partes.push('Habilidad ' + c.habilidad.nombre + ': ' + textoHabilidad(c.habilidad));
  if (c.tipo === 'protagonista') c.acciones.forEach(a => partes.push('Acción ' + a.nombre + ': necesita ' + a.costo + ' de Saber y hace ' + a.danio + ' de daño.'));
  else if (c.efecto || c.texto) partes.push(c.texto || textoEfecto(c.efecto));
  return partes.join(' ');
}

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

// Clases de tamaño según el largo del texto: así nada se monta sobre nada.
const claseNombre = n => (n.length <= 14 ? 'n1' : n.length <= 20 ? 'n2' : n.length <= 26 ? 'n3' : 'n4');
const claseCategoria = t => (t.length <= 10 ? 'k1' : 'k2');
const fraseDe = c => c.frase || (c.dato && c.dato.length > 80 ? c.dato.slice(0, 77).replace(/\s+\S*$/, '') + '…' : c.dato || '');
const ICONO_PERSONAJE_DERECHA = '1×';

export function renderCarta(carta, { tamano = 'normal', instancia = null, unidades = null } = {}) {
  const esProt = carta.tipo === 'protagonista';
  const res = carta.resistencia;
  const vida = instancia ? Math.max(0, res - instancia.danio) : res;
  const claveTipo = esProt ? carta.dimension : carta.tipo;
  const categoria = esProt ? nombreDim(carta.dimension) : ETIQUETA[carta.tipo];

  const el = document.createElement('div');
  el.className = `carta carta-${tamano} tipo-${carta.tipo}${carta.comunidad ? ' comunidad' : ''}`;
  aplicarTema(el, carta);

  if (tamano === 'mini') {
    el.innerHTML = `
      <div class="m-ventana">${imagenDe(carta)}</div>
      <div class="m-disco">${iconoTipo(claveTipo, 40)}</div>
      ${esProt ? `<div class="m-res${instancia && instancia.danio ? ' herido' : ''}">${esc(vida)}</div>` : ''}
      ${carta.evolucionaDe ? '<div class="etapa">2</div>' : ''}
      ${esProt && instancia ? `<div class="mini-saber${instancia.saber ? '' : ' cero'}" title="Saber"><span class="pip"></span><b>${esc(instancia.saber)}</b></div>` : ''}
      ${instancia?.protegido ? '<div class="sello">Protegido</div>' : ''}
      ${instancia?.bonus ? `<div class="sello">+${esc(instancia.bonus)}</div>` : ''}
      <div class="m-banda">
        ${carta.habilidad ? '<span class="m-hab" title="Tiene habilidad">◆</span>' : ''}
        <span class="m-nombre">${esc(carta.nombre)}</span>
        ${esProt && instancia && instancia.danio ? `<span class="barra"><span style="width:${(vida / res) * 100}%"></span></span>` : ''}
      </div>`;
    return el;
  }

  // Recuadro de texto (pergamino)
  const partes = [];
  if (carta.evolucionaDe && carta.baseNombre) partes.push(`<div class="t-evo">Evoluciona de ${esc(carta.baseNombre)}</div>`);
  if (carta.habilidad) partes.push(`<div class="t-linea"><b>${esc(carta.habilidad.nombre)}.</b> ${esc(textoHabilidad(carta.habilidad))}</div>`);
  if (esProt) {
    partes.push(carta.acciones.map(a => `<div class="t-accion"><span class="t-costo">${pips(a.costo)}</span><span class="t-an">${esc(a.nombre)}</span><b>${esc(a.danio)}</b></div>`).join(''));
  } else {
    partes.push(`<div class="t-linea"><b>${carta.tipo === 'personaje' ? 'Personaje.' : 'Efecto.'}</b> ${esc(carta.texto || textoEfecto(carta.efecto))}</div>`);
  }
  const conex = (carta.conexiones || []).filter(x => x.causaNombre).map(x => esc(x.causaNombre));
  if (conex.length) partes.push(`<div class="t-conexion"><b>Conexión:</b> ${conex.join(' o ')} → +1 Saber</div>`);
  // Cada renglón ocupa espacio aunque sea corto: se suman letras y renglones.
  const renglones = (carta.evolucionaDe ? 1 : 0) + (carta.habilidad ? 1 : 0) + (esProt ? carta.acciones.length : 1) + (conex.length ? 1 : 0);
  const largoTexto = partes.join('').replace(/<[^>]+>/g, '').length + renglones * 12;
  const claseTexto = renglones >= 5 ? 'tx4' : largoTexto <= 90 ? 'tx1' : largoTexto <= 120 ? 'tx2' : 'tx3';

  const unidad = carta.unidad && unidades ? unidades[carta.unidad - 1] : null;
  const claseN = claseNombre(carta.nombre);   // n1–n4 según el largo del nombre
  const refPie = carta.oa || (carta.mbe ? 'MBE ' + carta.mbe.dominio + '·' + carta.mbe.estandar : '');
  const pie = esProt
    ? `<span>Débil ${iconoTipo(DEBIL_ANTE[carta.dimension], 14)}×2 · Retirada ${pips(carta.retirada ?? 1)}</span><span>${esc(carta.oa || '')}</span>`
    : `<span>${esc(carta.id || '')}</span><span>${esc(refPie)}</span>`;
  const sello = carta.curso ? `${esc(carta.curso)}°` : carta.mbe ? esc(carta.mbe.dominio) : '';

  const tarjeta = `
    <div class="myl">
      <div class="myl-arte">${imagenDe(carta)}</div>
      <div class="myl-disco">${iconoTipo(claveTipo, 64)}</div>
      <div class="myl-cat ${claseCategoria(categoria)}">${esc(categoria)}</div>
      ${esProt ? `<div class="myl-res">${esc(vida)}${instancia && instancia.danio ? `<small>/${esc(res)}</small>` : ''}</div>`
               : carta.tipo === 'personaje' ? `<div class="myl-res myl-res-pj" title="1 por turno">${ICONO_PERSONAJE_DERECHA}</div>` : ''}
      ${carta.evolucionaDe ? '<div class="myl-etapa">Etapa 2</div>' : ''}
      ${esProt && instancia ? `<div class="myl-saber" title="Saber"><span class="pip"></span><b>${esc(instancia.saber)}</b></div>` : ''}
      <div class="myl-nombre ${claseN}"><span>${esc(carta.nombre)}</span></div>
      <div class="myl-frase">${esc(fraseDe(carta))}</div>
      ${sello ? `<div class="myl-sello">${sello}</div>` : ''}
      <div class="myl-texto ${claseTexto}">${partes.join('')}</div>
      <div class="myl-pie">${pie}</div>
      ${carta.comunidad ? `<div class="myl-autor">★ ${esc(carta.autor || 'Estudiante')}</div>` : ''}
    </div>`;

  if (tamano !== 'grande') { el.innerHTML = tarjeta; return el; }

  // Grande: la carta y, debajo, el dato completo (el que no cabe sobre la imagen).
  el.innerHTML = tarjeta;
  const envoltura = document.createElement('div');
  envoltura.className = 'carta-grande-envoltura';
  envoltura.appendChild(el);
  const ficha = document.createElement('div');
  ficha.className = 'ficha-dato';
  ficha.innerHTML = `<small>Dato histórico</small><p>${esc(carta.dato)}</p>
    <div class="ficha-ref">${carta.curso ? `${esc(carta.curso)}° básico` : ''}${unidad ? ` · Unidad ${esc(carta.unidad)}: ${esc(unidad)}` : ''}${carta.oa ? ` · ${esc(carta.oa)}` : ''}${carta.mbe ? `Marco para la Buena Enseñanza · Dominio ${esc(carta.mbe.dominio)} · Estándar ${esc(carta.mbe.estandar)}: ${esc(carta.mbe.nombre)}` : ''}</div>`;
  envoltura.appendChild(ficha);
  return envoltura;
}
