// Banco de ideas: los estudiantes crean sus propias cartas.
import { almacen } from '../almacen.js';
import { PRESUPUESTO, puntosPoder, validarPropuesta, EFECTOS_ESTUDIANTE as EFECTOS } from '../balance.js';
import { DIMENSIONES } from '../motor.js';
import { NOMBRE_DIMENSION } from '../mazos.js';
import { EMBLEMAS, iconoEmblema } from './arte.js';
import { renderCarta } from './carta.js';
import { esc } from '../html.js';

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const UNIDADES = {};
const BORRADOR = 'cc.borrador';


function nuevaCarta() {
  return {
    autor: '', curso: 7, unidad: 1, tipo: 'protagonista', dimension: 'Politica', nombre: '',
    resistencia: 70, retirada: 1, acciones: [{ nombre: '', costo: 1, danio: 20 }],
    efecto: EFECTOS[0][0], dato: '', fuente: '', emblema: 'estrella', imagen: null,
  };
}

export async function comprimirImagen(archivo, max = 360, calidad = 0.7) {
  const url = URL.createObjectURL(archivo);
  try {
    const img = await new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = url; });
    const escala = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * escala); c.height = Math.round(img.height * escala);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', calidad);
  } finally { URL.revokeObjectURL(url); }
}

export async function vistaBanco({ volver }) {
  for (const c of [5, 6, 7, 8]) {
    if (!UNIDADES[c]) UNIDADES[c] = await fetch(`data/mazo-${c}.json`).then(r => r.json()).then(d => d.unidades).catch(() => ['Unidad 1', 'Unidad 2', 'Unidad 3', 'Unidad 4']);
  }
  let carta = almacen.leer(BORRADOR, null) || nuevaCarta();
  const v = h('div', 'pantalla banco');
  v.appendChild(volver);
  v.appendChild(h('h1', '', 'Banco de ideas'));
  v.appendChild(h('p', 'nota', 'Crea tu propia carta. Tu profesor la revisa y, si la aprueba, entra al mazo del curso.'));
  const cuerpo = h('div', 'banco-cuerpo');
  const form = h('div', 'banco-form');
  const vista = h('div', 'banco-vista');
  cuerpo.append(form, vista);
  v.appendChild(cuerpo);
  const mias = h('div', 'mis-cartas');
  v.appendChild(mias);

  function guardarBorrador() { almacen.guardar(BORRADOR, carta); }

  function actualizarVista() {
    vista.innerHTML = '';
    const muestra = { ...carta, nombre: carta.nombre || 'Nombre de tu carta', dato: carta.dato || 'Aquí va tu dato histórico.', comunidad: true };
    if (muestra.tipo === 'lugar') muestra.efecto = { tipo: 'bonusDimension', dimension: carta.dimension, n: 10 };
    if (muestra.tipo !== 'protagonista') { delete muestra.resistencia; }
    vista.appendChild(renderCarta(muestra, { tamano: 'grande', unidades: UNIDADES[carta.curso] }));
    if (carta.tipo === 'protagonista') {
      const p = puntosPoder(carta);
      const barra = h('div', `poder${p > PRESUPUESTO ? ' excedido' : ''}`,
        `<div class="poder-texto">Poder ${p} de ${PRESUPUESTO}</div><div class="poder-barra"><span style="width:${Math.min(100, (p / PRESUPUESTO) * 100)}%"></span></div>
         <small>${p > PRESUPUESTO ? 'Demasiado poderosa: baja la resistencia o el daño.' : 'Si subes el daño, baja la resistencia.'}</small>`);
      vista.appendChild(barra);
    }
    guardarBorrador();
  }

  const paso = (n, titulo) => { const s = h('section', 'paso'); s.appendChild(h('h2', '', `${n}. ${titulo}`)); form.appendChild(s); return s; };
  const elegir = (cont, opciones, valor, alElegir) => {
    const fila = h('div', 'opciones');
    for (const [val, texto] of opciones) {
      const b = h('button', `opcion chica${JSON.stringify(val) === JSON.stringify(valor) ? ' elegida' : ''}`, texto);
      b.onclick = () => { alElegir(val); dibujar(); };
      fila.appendChild(b);
    }
    cont.appendChild(fila);
  };
  const campoTexto = (cont, etiqueta, valor, alCambiar, { area = false, max = 220, placeholder = '' } = {}) => {
    const l = h('label', 'campo-texto', `<span>${etiqueta}</span>`);
    const i = h(area ? 'textarea' : 'input');
    i.value = valor || ''; i.maxLength = max; i.placeholder = placeholder;
    i.oninput = () => { alCambiar(i.value); actualizarVista(); };
    l.appendChild(i); cont.appendChild(l);
    return i;
  };
  const deslizador = (cont, etiqueta, valor, min, max, paso, alCambiar) => {
    const l = h('label', 'campo-rango', `<span>${etiqueta} <b>${valor}</b></span>`);
    const i = h('input'); i.type = 'range'; i.min = min; i.max = max; i.step = paso; i.value = valor;
    i.oninput = () => { alCambiar(Number(i.value)); l.querySelector('b').textContent = i.value; actualizarVista(); };
    l.appendChild(i); cont.appendChild(l);
  };

  function dibujar() {
    form.innerHTML = '';
    let s = paso(1, '¿Quién la crea?');
    campoTexto(s, 'Tu nombre o apodo (sin apellidos)', carta.autor, x => { carta.autor = x; }, { max: 24 });
    elegir(s, [5, 6, 7, 8].map(c => [c, `${c}°`]), carta.curso, x => { carta.curso = x; });

    s = paso(2, '¿De qué unidad?');
    elegir(s, UNIDADES[carta.curso].map((u, i) => [i + 1, `U${i + 1} · ${u}`]), carta.unidad, x => { carta.unidad = x; });

    s = paso(3, '¿Qué tipo de carta?');
    elegir(s, [['protagonista', 'Protagonista'], ['acontecimiento', 'Acontecimiento'], ['lugar', 'Lugar']], carta.tipo, x => { carta.tipo = x; });
    s.appendChild(h('p', 'nota', {
      protagonista: 'Una persona, pueblo o grupo que combate en la mesa.',
      acontecimiento: 'Un hecho o invento que se usa una vez.',
      lugar: 'Un espacio geográfico que da ventaja a una dimensión.',
    }[carta.tipo]));

    if (carta.tipo !== 'acontecimiento') {
      s = paso(4, carta.tipo === 'lugar' ? '¿Qué dimensión favorece?' : '¿Qué dimensión?');
      elegir(s, DIMENSIONES.map(d => [d, NOMBRE_DIMENSION[d]]), carta.dimension, x => { carta.dimension = x; });
    } else {
      s = paso(4, '¿Qué hace?');
      elegir(s, EFECTOS.map(([e, t]) => [e, t]), carta.efecto, x => { carta.efecto = x; });
    }

    s = paso(5, 'Nombre y poder');
    campoTexto(s, 'Nombre de la carta', carta.nombre, x => { carta.nombre = x; }, { max: 30 });
    if (carta.tipo === 'protagonista') {
      deslizador(s, 'Resistencia', carta.resistencia, 50, 120, 10, x => { carta.resistencia = x; });
      carta.acciones.forEach((a, i) => {
        const caja = h('div', 'accion-edit');
        caja.appendChild(h('div', 'subtitulo', `Acción ${i + 1}`));
        campoTexto(caja, 'Nombre de la acción', a.nombre, x => { a.nombre = x; }, { max: 22 });
        deslizador(caja, 'Saber necesario', a.costo, 1, 3, 1, x => { a.costo = x; });
        deslizador(caja, 'Daño', a.danio, 0, 100, 10, x => { a.danio = x; });
        if (carta.acciones.length > 1) {
          const q = h('button', 'enlace', 'Quitar esta acción');
          q.onclick = () => { carta.acciones.splice(i, 1); dibujar(); };
          caja.appendChild(q);
        }
        s.appendChild(caja);
      });
      if (carta.acciones.length < 2) {
        const mas = h('button', 'boton-secundario', '+ Agregar otra acción');
        mas.onclick = () => { carta.acciones.push({ nombre: '', costo: 2, danio: 30 }); dibujar(); };
        s.appendChild(mas);
      }
    }

    s = paso(6, 'El dato histórico');
    campoTexto(s, '¿Qué aprendiste? (dato real, máximo 220 letras)', carta.dato, x => { carta.dato = x; }, { area: true, max: 220 });
    campoTexto(s, '¿Dónde lo aprendiste?', carta.fuente, x => { carta.fuente = x; }, { max: 80, placeholder: 'Ej.: clase de Historia, libro del estudiante, página…' });

    s = paso(7, 'La imagen');
    s.appendChild(h('p', 'nota', 'Saca una foto a tu dibujo, dibuja aquí o elige un emblema.'));
    const fila = h('div', 'opciones');
    const foto = h('label', 'boton-secundario archivo', 'Foto de mi dibujo');
    const input = h('input'); input.type = 'file'; input.accept = 'image/*'; input.setAttribute('capture', 'environment');
    input.onchange = async () => {
      if (!input.files[0]) return;
      try { carta.imagen = await comprimirImagen(input.files[0]); } catch { mensaje('No se pudo leer esa imagen.', true); }
      dibujar();
    };
    foto.appendChild(input);
    const lienzo = h('button', 'boton-secundario', 'Dibujar aquí');
    lienzo.onclick = () => abrirLienzo(url => { carta.imagen = url; dibujar(); });
    fila.append(foto, lienzo);
    if (carta.imagen) {
      const q = h('button', 'enlace', 'Quitar imagen');
      q.onclick = () => { carta.imagen = null; dibujar(); };
      fila.appendChild(q);
    }
    s.appendChild(fila);
    if (!carta.imagen) elegir(s, EMBLEMAS.map(e => [e, iconoEmblema(e)]), carta.emblema, x => { carta.emblema = x; });

    const enviar = h('button', 'boton-principal grande', 'Enviar al profesor');
    enviar.onclick = enviarCarta;
    form.appendChild(enviar);
    form.appendChild(h('div', 'mensaje', ''));
    actualizarVista();
  }

  function mensaje(texto, error = false) {
    const m = form.querySelector('.mensaje');
    if (m) { m.innerHTML = texto; m.className = `mensaje${error ? ' error' : ' ok'}`; m.scrollIntoView({ block: 'nearest' }); }
  }

  function enviarCarta() {
    const p = { ...carta };
    if (p.tipo === 'lugar') p.efecto = { tipo: 'bonusDimension', dimension: p.dimension, n: 10 };
    if (p.tipo !== 'protagonista') { delete p.resistencia; delete p.acciones; delete p.retirada; }
    if (p.tipo === 'acontecimiento') delete p.dimension;
    if (!p.imagen) delete p.imagen;
    p.estado = 'pendiente';
    const errores = validarPropuesta(p);
    if (errores.length) return mensaje(`<b>Falta algo:</b><ul>${errores.map(e => `<li>${esc(e)}</li>`).join('')}</ul>`, true);
    const r = almacen.guardarPropuesta(p);
    if (!r.ok) {
      return mensaje(r.error === 'cuota'
        ? 'La tablet no tiene espacio para guardar esta carta. Prueba sin imagen o con una foto más pequeña. Tu carta sigue aquí.'
        : 'No se pudo guardar en esta tablet. Tu carta sigue aquí; avisa a tu profesor.', true);
    }
    carta = nuevaCarta();
    carta.curso = p.curso; carta.autor = p.autor;
    almacen.borrar(BORRADOR);
    dibujar();
    mensaje('¡Listo! Tu carta quedó enviada. Tu profesor la revisará.');
    listarMias();
  }

  function listarMias() {
    mias.innerHTML = '';
    const lista = almacen.listarPropuestas().slice().reverse();
    if (!lista.length) return;
    mias.appendChild(h('h2', '', 'Cartas creadas en esta tablet'));
    const g = h('div', 'grilla-cartas');
    const ESTADO = { pendiente: 'En revisión', aprobada: 'Aprobada', devuelta: 'Devuelta', descartada: 'No aprobada' };
    for (const p of lista) {
      const item = h('div', 'item-propuesta');
      item.appendChild(renderCarta({ ...p, comunidad: true }, { tamano: 'normal', unidades: UNIDADES[p.curso] }));
      item.appendChild(h('div', `estado estado-${p.estado}`, ESTADO[p.estado] || p.estado));
      if (p.estado === 'devuelta') {
        if (p.comentario) item.appendChild(h('p', 'comentario', `Profesor: ${esc(p.comentario)}`));
        const ed = h('button', 'boton-secundario', 'Corregir');
        ed.onclick = () => { carta = { ...nuevaCarta(), ...p }; dibujar(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
        item.appendChild(ed);
      }
      g.appendChild(item);
    }
    mias.appendChild(g);
  }

  dibujar();
  listarMias();
  return v;
}

function abrirLienzo(alTerminar) {
  const capa = h('div', 'capa');
  const panel = h('div', 'panel-aviso lienzo');
  const c = h('canvas');
  c.width = 480; c.height = 300;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f7f3ea'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = '#1d1d1f';
  let dibujando = false;
  const pos = e => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * (c.width / r.width), (e.clientY - r.top) * (c.height / r.height)]; };
  c.onpointerdown = e => { dibujando = true; c.setPointerCapture(e.pointerId); const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); };
  c.onpointermove = e => { if (!dibujando) return; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke(); };
  c.onpointerup = () => { dibujando = false; };
  const colores = h('div', 'opciones');
  for (const col of ['#1d1d1f', '#B83A26', '#B9850F', '#2C64A8', '#6E43A6', '#2B7D52']) {
    const b = h('button', 'color'); b.style.background = col;
    b.onclick = () => { ctx.strokeStyle = col; };
    colores.appendChild(b);
  }
  const botones = h('div', 'opciones');
  const usar = h('button', 'boton-principal', 'Usar dibujo');
  usar.onclick = () => { alTerminar(c.toDataURL('image/jpeg', 0.7)); capa.remove(); };
  const borrar = h('button', 'boton-secundario', 'Borrar');
  borrar.onclick = () => { ctx.fillStyle = '#f7f3ea'; ctx.fillRect(0, 0, c.width, c.height); };
  const cerrar = h('button', 'boton-secundario', 'Cancelar');
  cerrar.onclick = () => capa.remove();
  botones.append(usar, borrar, cerrar);
  panel.append(c, colores, botones);
  capa.appendChild(panel);
  document.body.appendChild(capa);
}
