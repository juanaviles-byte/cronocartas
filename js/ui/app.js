// Navegación de Cronocartas por #hash: #inicio #jugar #mesa #tutorial #coleccion #banco #docente
import { montarMesa } from './mesa.js';
import { renderCarta } from './carta.js';
import { cargarCursoCompleto } from './datos.js';
import { almacen, CLAVES } from '../almacen.js';
import { esc } from '../html.js';

const app = document.getElementById('app');
let actual = null;            // vista montada (con destruir opcional)
let eleccion = { modo: 'caraacara', cursoA: 7, cursoB: 7 };

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const CURSOS = [5, 6, 7, 8];

const vistas = {
  inicio() {
    const v = h('div', 'pantalla inicio');
    v.innerHTML = `
      <header class="portada">
        <div class="marca">Cronocartas</div>
        <p class="lema">Duelo de cartas de Historia · 5° a 8° básico</p>
      </header>`;
    const menu = h('nav', 'menu-principal');
    const guardada = almacen.leer(CLAVES.partida, null);
    if (guardada && guardada.version === 1 && guardada.estado && guardada.estado.fase !== 'fin') {
      const b = boton('Continuar partida', 'boton-principal grande', () => { location.hash = '#mesa'; });
      menu.appendChild(b);
    }
    menu.append(
      boton('Jugar', 'boton-principal grande', () => { location.hash = '#jugar'; }),
      boton('Aprender a jugar', 'boton-secundario grande', () => { location.hash = '#tutorial'; }),
      boton('Colección de cartas', 'boton-secundario grande', () => { location.hash = '#coleccion'; }),
      boton('Banco de ideas', 'boton-secundario grande', () => { location.hash = '#banco'; }),
    );
    v.appendChild(menu);
    const pie = h('footer', 'pie');
    pie.append(boton('Panel docente', 'enlace', () => { location.hash = '#docente'; }));
    pie.appendChild(h('span', '', 'Escuela Gabriela Mistral · Mostazal'));
    v.appendChild(pie);
    return v;
  },

  jugar() {
    const ajustes = almacen.leer(CLAVES.ajustes, {}) || {};
    const v = h('div', 'pantalla preparar');
    v.appendChild(volver());
    v.appendChild(h('h1', '', 'Nueva partida'));
    const modo = h('div', 'grupo');
    modo.appendChild(h('h2', '', '¿Cómo juegan?'));
    const opcionesModo = h('div', 'opciones');
    for (const [m, t, d] of [['caraacara', 'Cara a cara', 'Dos jugadores en esta tablet'], ['ia', 'Contra la tablet', 'Un jugador']]) {
      const b = h('button', `opcion${eleccion.modo === m ? ' elegida' : ''}`, `<b>${t}</b><span>${d}</span>`);
      b.onclick = () => { eleccion.modo = m; render(); };
      opcionesModo.appendChild(b);
    }
    modo.appendChild(opcionesModo);
    v.appendChild(modo);

    const cruzados = !!ajustes.cruzados;
    const cursos = h('div', 'grupo');
    cursos.appendChild(h('h2', '', cruzados ? 'Mazo de cada jugador' : '¿Qué curso?'));
    const filas = cruzados ? [['cursoA', eleccion.modo === 'ia' ? 'Tú' : 'Jugador 1'], ['cursoB', eleccion.modo === 'ia' ? 'Tablet' : 'Jugador 2']] : [['cursoA', '']];
    for (const [k, etiqueta] of filas) {
      const fila = h('div', 'opciones cursos');
      if (etiqueta) fila.appendChild(h('span', 'etiqueta', etiqueta));
      for (const c of CURSOS) {
        const b = h('button', `opcion curso-${c}${eleccion[k] === c ? ' elegida' : ''}`, `<b>${c}°</b><span>básico</span>`);
        b.onclick = () => { eleccion[k] = c; if (!cruzados) eleccion.cursoB = c; render(); };
        fila.appendChild(b);
      }
      cursos.appendChild(fila);
    }
    v.appendChild(cursos);
    const empezar = boton('Empezar', 'boton-principal grande', () => {
      almacen.borrar(CLAVES.partida);
      location.hash = '#mesa';
    });
    v.appendChild(empezar);
    if (eleccion.modo === 'caraacara') v.appendChild(h('p', 'nota', 'Pongan la tablet en horizontal, entre los dos jugadores.'));
    return v;
  },

  async mesa() {
    const guardada = almacen.leer(CLAVES.partida, null);
    const cont = h('div', 'pantalla-mesa');
    app.replaceChildren(cont);
    if (guardada && guardada.version === 1 && guardada.estado && guardada.estado.fase !== 'fin') {
      return montarMesa(cont, { ...guardada.config, estado: guardada.estado });
    }
    return montarMesa(cont, { ...eleccion });
  },

  async tutorial() {
    const cont = h('div', 'pantalla-mesa');
    app.replaceChildren(cont);
    return montarMesa(cont, { modo: 'tutorial', cursoA: 7, cursoB: 7, semilla: 2026 });
  },

  async coleccion() {
    const v = h('div', 'pantalla coleccion');
    v.appendChild(volver());
    v.appendChild(h('h1', '', 'Colección de cartas'));
    const pestanas = h('div', 'opciones cursos');
    const curso = Number(sessionStorage.getItem('cc.coleccion') || 7);
    for (const c of CURSOS) {
      const b = h('button', `opcion${c === curso ? ' elegida' : ''}`, `<b>${c}°</b>`);
      b.onclick = () => { sessionStorage.setItem('cc.coleccion', c); render(); };
      pestanas.appendChild(b);
    }
    v.appendChild(pestanas);
    const datos = await cargarCursoCompleto(curso);
    datos.unidades.forEach((u, i) => {
      v.appendChild(h('h2', 'titulo-unidad', `Unidad ${i + 1} · ${u}`));
      const grilla = h('div', 'grilla-cartas');
      for (const c of datos.cartas.filter(c => c.unidad === i + 1)) grilla.appendChild(cartaClicable(c, datos.unidades));
      v.appendChild(grilla);
    });
    v.appendChild(h('h2', 'titulo-unidad', 'Cartas Aula · Marco para la Buena Enseñanza'));
    const g = h('div', 'grilla-cartas');
    for (const c of datos.aula) g.appendChild(cartaClicable(c));
    v.appendChild(g);
    return v;
  },

  async banco() {
    const { vistaBanco } = await import('./banco.js');
    return vistaBanco({ volver: volver() });
  },

  async docente() {
    const { vistaDocente } = await import('./docente.js');
    return vistaDocente({ volver: volver() });
  },
};

function cartaClicable(c, unidades) {
  const el = renderCarta(c, { tamano: 'normal', unidades });
  el.onclick = () => {
    const capa = h('div', 'capa');
    const panel = h('div', 'panel-carta');
    panel.appendChild(renderCarta(c, { tamano: 'grande', unidades }));
    const b = boton('Cerrar', 'boton-secundario', () => capa.remove());
    panel.appendChild(b);
    capa.appendChild(panel);
    capa.onclick = ev => { if (ev.target === capa) capa.remove(); };
    document.body.appendChild(capa);
  };
  return el;
}

export function boton(texto, cls, fn) {
  const b = h('button', cls, texto);
  b.onclick = fn;
  return b;
}

function volver() {
  return boton('← Volver', 'volver', () => { location.hash = '#inicio'; });
}

let ficha = 0;   // cada navegación tiene su ficha; una vista que llega tarde se descarta
async function render() {
  if (actual && actual.destruir) actual.destruir();
  actual = null;
  const mia = ++ficha;
  document.querySelectorAll('body > .capa').forEach(c => c.remove());   // cerrar detalles abiertos de la pantalla anterior
  const nombre = (location.hash || '#inicio').slice(1);
  const vista = vistas[nombre] || vistas.inicio;
  document.body.dataset.vista = nombre;
  try {
    const r = await vista();
    if (mia !== ficha) { if (r && r.destruir) r.destruir(); return; }
    if (r instanceof HTMLElement) { app.replaceChildren(r); actual = null; }
    else actual = r;
  } catch (e) {
    console.error(e);
    if (mia === ficha) app.replaceChildren(h('div', 'pantalla error', `<h1>Algo falló</h1><p>${esc(e.message || e)}</p><p><a href="#inicio">Volver al inicio</a></p>`));
  }
}

window.addEventListener('hashchange', render);
render();

if ('serviceWorker' in navigator && window.isSecureContext) {
  // Si llega una versión nueva mientras la app está abierta, se recarga una vez
  // para no mezclar archivos viejos y nuevos.
  const habiaControlador = !!navigator.serviceWorker.controller;
  let recargado = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (habiaControlador && !recargado) { recargado = true; location.reload(); }
  });
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
