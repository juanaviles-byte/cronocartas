// Navegación de Cronocartas por #hash: #inicio #jugar #mesa #tutorial #coleccion #torneo #banco #docente
import { montarMesa, cargarTableros, cargarDuelos } from './mesa.js';
import { NIVELES } from '../ia.js';
import { crearAlbum } from '../album.js';
import { renderCarta, textoParaLeer, registrarImagenes } from './carta.js';
import { botonEscucharCarta, detener } from './voz.js';
import { cargarCursoCompleto } from './datos.js';
import { confirmar } from './confirmar.js';
import { COLECCIONES, coleccion } from '../colecciones.js';
import { sonidos, precargarSonidos } from './sonido.js';
import { ambiente } from './ambiente.js';
import { almacen, CLAVES } from '../almacen.js';
import { esc } from '../html.js';

const app = document.getElementById('app');
let actual = null;            // vista montada (con destruir opcional)
let eleccion = { modo: 'caraacara', cursoA: 7, cursoB: 7, tablero: 'azar', reforzar: false, mazo: 'curso', duelo: null, bandoA: null, linea: true, coleccion: null };
let partidaPendiente = null;   // la deja lista el torneo antes de ir a #mesa

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const CURSOS = [5, 6, 7, 8];

const vistas = {
  async inicio() {
    const v = h('div', 'pantalla inicio');
    // Fondo: un escenario del juego al azar, con un paneo lento (se detiene con «reducir movimiento»).
    const fondos = await fetch('data/escenarios.json').then(r => (r.ok ? r.json() : {})).catch(() => ({}));
    const lista = Object.values(fondos);
    const fondo = h('div', 'inicio-fondo');
    if (lista.length) fondo.style.backgroundImage = `url("${new URL(lista[Math.floor(Math.random() * lista.length)], location.href).href}")`;
    v.appendChild(fondo);

    const principal = h('section', 'inicio-principal');
    principal.innerHTML = `
      <header class="portada">
        <div class="marca">Cronocartas</div>
        <p class="lema">Duelo de cartas de Historia · 5° a 8° básico</p>
      </header>`;
    const menu = h('nav', 'menu-principal');
    menu.setAttribute('aria-label', 'Menú principal');
    const guardada = almacen.leer(CLAVES.partida, null);
    if (guardada && guardada.version === 1 && guardada.estado && guardada.estado.fase !== 'fin') {
      const b = boton('Continuar partida', 'boton-principal grande', () => { location.hash = '#mesa'; });
      const terminar = boton('Terminar partida guardada', 'boton-secundario boton-peligro', async () => {
        const si = await confirmar({ titulo: '¿Terminar la partida guardada?', texto: 'Se borra la partida en curso. No se podrá continuar.', si: 'Sí, terminar' });
        if (si) { almacen.borrar(CLAVES.partida); render(); }
      });
      menu.append(b, terminar);
      menu.append(boton('Nueva partida', 'boton-secundario grande', () => { location.hash = '#jugar'; }));
    } else {
      menu.append(boton('Jugar', 'boton-principal grande', () => { location.hash = '#jugar'; }));
    }
    principal.appendChild(menu);

    // El resto del menú: fichas con ícono.
    const ICONOS = {
      tutorial: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M9 8h7M9 12h5"/>',
      coleccion: '<rect x="3" y="6" width="11" height="15" rx="1.6" transform="rotate(-8 8.5 13.5)"/><rect x="10" y="3" width="11" height="15" rx="1.6" transform="rotate(8 15.5 10.5)"/>',
      torneo: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
      banco: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.3 1 2.2h5.2c0-.9.4-1.7 1-2.2A6 6 0 0 0 12 3z"/>',
    };
    const fichas = h('nav', 'menu-fichas');
    fichas.setAttribute('aria-label', 'Más opciones');
    for (const [clave, titulo, detalle, destino] of [
      ['tutorial', 'Aprender a jugar', 'Una partida guiada', '#tutorial'],
      ['coleccion', 'Colección y álbum', 'Las cartas que descubriste', '#coleccion'],
      ['torneo', 'Torneo', 'Llaves para todo el curso', '#torneo'],
      ['banco', 'Banco de ideas', 'Crea tus propias cartas', '#banco'],
    ]) {
      const f = h('button', 'ficha-menu', `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[clave]}</svg><b>${titulo}</b><span>${detalle}</span>`);
      f.onclick = () => { location.hash = destino; };
      fichas.appendChild(f);
    }
    principal.appendChild(fichas);
    const pie = h('footer', 'pie');
    pie.append(boton('Panel docente', 'enlace', () => { location.hash = '#docente'; }));
    pie.appendChild(h('span', '', 'Escuela Gabriela Mistral · Mostazal'));
    principal.appendChild(pie);
    v.appendChild(principal);

    // Tres cartas de verdad, en abanico: lo más característico del juego.
    const abanico = h('div', 'inicio-abanico');
    abanico.setAttribute('aria-hidden', 'true');
    v.appendChild(abanico);
    Promise.all([fetch('data/arte.json').then(r => r.json()), fetch(`data/mazo-${CURSOS[Math.floor(Math.random() * CURSOS.length)]}.json`).then(r => r.json())])
      .then(([arte, mazo]) => {
        registrarImagenes(arte);
        const prot = mazo.cartas.filter(c => c.tipo === 'protagonista' && arte[c.id]);
        const elegidas = [];
        while (elegidas.length < 3 && prot.length) elegidas.push(prot.splice(Math.floor(Math.random() * prot.length), 1)[0]);
        elegidas.forEach((c, i) => { const el = renderCarta(c, { tamano: 'normal' }); el.style.setProperty('--i', i - 1); abanico.appendChild(el); });
      }).catch(() => { /* sin cartas: el inicio funciona igual */ });
    return v;
  },

  async jugar() {
    const [tableros, duelos] = await Promise.all([cargarTableros(), cargarDuelos()]);
    const ajustes = almacen.leer(CLAVES.ajustes, {}) || {};
    const v = h('div', 'pantalla preparar');
    v.appendChild(volver());
    v.appendChild(h('h1', '', 'Nueva partida'));
    const grupo = titulo => { const g = h('div', 'grupo'); g.appendChild(h('h2', '', titulo)); v.appendChild(g); return g; };
    // Categoría: los cursos de Historia o las expansiones.
    const pestanas = h('div', 'pestanas');
    pestanas.setAttribute('role', 'tablist');
    for (const [clave, texto] of [['cursos', 'Cursos'], ['expansiones', 'Expansiones']]) {
      const activa = (clave === 'expansiones') === !!eleccion.coleccion;
      const b = h('button', `pestana${activa ? ' activa' : ''}`, texto);
      b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(activa));
      b.onclick = () => {
        if (activa) return;
        Object.assign(eleccion, { coleccion: clave === 'expansiones' ? COLECCIONES[0].id : null, duelo: null, bandoA: null, tablero: 'azar', reforzar: false, mazo: 'curso' });
        render();
      };
      pestanas.appendChild(b);
    }
    v.appendChild(pestanas);
    const col = eleccion.coleccion ? coleccion(eleccion.coleccion) : null;
    if (eleccion.coleccion && !col) eleccion.coleccion = null;
    const exp = col ? await fetch(col.archivo).then(r => r.json()).catch(() => null) : null;
    const opciones = (lista, actual, alElegir, clase = 'opciones') => {
      const fila = h('div', clase);
      for (const [valor, t, d] of lista) {
        const b = h('button', `opcion${actual === valor ? ' elegida' : ''}`, `<b>${t}</b>${d ? `<span>${d}</span>` : ''}`);
        b.onclick = () => { alElegir(valor); render(); };
        fila.appendChild(b);
      }
      return fila;
    };

    if (col) {
      grupo('¿Qué expansión?').appendChild(opciones(COLECCIONES.map(c => [c.id, esc(c.nombre), esc(c.descripcion || '')]), eleccion.coleccion,
        id => { eleccion.coleccion = id; eleccion.duelo = null; eleccion.bandoA = null; }, 'opciones colecciones'));
    }

    grupo('¿Cómo juegan?').appendChild(opciones([['caraacara', 'Cara a cara', 'Dos jugadores en esta tablet'], ['ia', 'Contra la tablet', 'Un jugador']],
      eleccion.modo, m => { eleccion.modo = m; }));
    if (eleccion.modo === 'ia') {
      const nivel = ajustes.nivel === 'cronista' ? 'erudito' : ajustes.nivel || 'historiador';
      grupo('Nivel de la tablet').appendChild(opciones(NIVELES.map(n => [n.id, n.nombre, n.texto]), nivel,
        n => { almacen.guardar(CLAVES.ajustes, { ...(almacen.leer(CLAVES.ajustes, {}) || {}), nivel: n }); }, 'opciones niveles'));
    }

    grupo('¿Con qué mazos?').appendChild(opciones(col
      ? [['curso', 'Mazo completo', 'Todas las cartas de la expansión'], ['duelo', 'Duelo temático', 'Cada jugador, una fuerza']]
      : [['curso', 'Mazo del curso', 'Cartas de las 4 unidades'], ['duelo', 'Duelo temático', 'Cada jugador, un bando histórico']],
      eleccion.mazo, m => { eleccion.mazo = m; }));

    const cruzados = !col && !!ajustes.cruzados && eleccion.mazo === 'curso';
    if (!col) {
    const cursos = grupo(cruzados ? 'Mazo de cada jugador' : '¿Qué curso?');
    const filas = cruzados ? [['cursoA', eleccion.modo === 'ia' ? 'Tú' : 'Jugador 1'], ['cursoB', eleccion.modo === 'ia' ? 'Tablet' : 'Jugador 2']] : [['cursoA', '']];
    for (const [k, etiqueta] of filas) {
      const fila = h('div', 'opciones cursos');
      if (etiqueta) fila.appendChild(h('span', 'etiqueta', etiqueta));
      for (const c of CURSOS) {
        const b = h('button', `opcion curso-${c}${eleccion[k] === c ? ' elegida' : ''}`, `<b>${c}°</b><span>básico</span>`);
        b.onclick = () => { eleccion[k] = c; if (!cruzados) eleccion.cursoB = c; if (k === 'cursoA') { eleccion.tablero = 'azar'; eleccion.reforzar = false; eleccion.duelo = null; eleccion.bandoA = null; } render(); };
        fila.appendChild(b);
      }
      cursos.appendChild(fila);
    }
    }

    let listo = true;
    if (eleccion.mazo === 'duelo') {
      const delCurso = col ? ((exp && exp.duelos) || []) : duelos.filter(d => d.curso === eleccion.cursoA);
      if (!delCurso.some(d => d.id === eleccion.duelo)) { eleccion.duelo = delCurso[0]?.id || null; eleccion.bandoA = null; }
      const gd = grupo('Duelo');
      gd.appendChild(opciones(delCurso.map(d => [d.id, esc(d.nombre), d.bandos.map(b => esc(b.nombre)).join(' vs. ')]), eleccion.duelo, id => { eleccion.duelo = id; eleccion.bandoA = null; }));
      const d = delCurso.find(x => x.id === eleccion.duelo);
      if (d) {
        if (!d.bandos.some(b => b.id === eleccion.bandoA)) eleccion.bandoA = d.bandos[0].id;
        const gb = grupo(eleccion.modo === 'ia' ? 'Tu bando' : 'Bando del Jugador 1');
        const fila = h('div', 'opciones bandos');
        for (const b of d.bandos) {
          const el = h('button', `opcion bando-opcion${eleccion.bandoA === b.id ? ' elegida' : ''}`, `<b>${esc(b.nombre)}</b><span>${esc(b.lema)}</span>`);
          el.style.setProperty('--bando', b.color);
          el.onclick = () => { eleccion.bandoA = b.id; render(); };
          fila.appendChild(el);
        }
        gb.appendChild(fila);
        const t = tableros.find(x => x.id === d.tablero);
        if (t) gb.appendChild(h('p', 'nota', `Tablero: <b>${esc(t.nombre)}</b> · ${esc(t.textoRegla)}`));
        if (d.arte) {
          const arte = h('figure', 'duelo-portada', `<img class="arte-duelo" src="${esc(d.arte)}" alt="">${d.texto ? `<figcaption>${esc(d.texto)}</figcaption>` : ''}`);
          gb.appendChild(arte);
        }
      } else { listo = false; gd.appendChild(h('p', 'nota', col ? 'Esta expansión todavía no tiene duelos.' : 'Este curso todavía no tiene duelos temáticos.')); }
    } else if (!col) {
      // Tablero: uno por unidad del curso, o sorpresa.
      const grupoT = grupo('Tablero');
      const grilla = h('div', 'tableros');
      const sorpresa = h('button', `opcion-tablero sorpresa${eleccion.tablero === 'azar' ? ' elegida' : ''}`, '<b>Sorpresa</b><small>Un tablero al azar del curso</small>');
      sorpresa.onclick = () => { eleccion.tablero = 'azar'; eleccion.reforzar = false; render(); };
      grilla.appendChild(sorpresa);
      for (const t of tableros.filter(t => t.curso === eleccion.cursoA)) {
        const b = h('button', `opcion-tablero${eleccion.tablero === t.id ? ' elegida' : ''}`, `<b>U${t.unidad} · ${esc(t.nombre)}</b><small>${esc(t.textoRegla)}</small>`);
        b.style.backgroundImage = `url("${t.imagen}")`;
        b.onclick = () => { eleccion.tablero = t.id; render(); };
        grilla.appendChild(b);
      }
      grupoT.appendChild(grilla);
      if (eleccion.tablero !== 'azar') {
        const t = tableros.find(x => x.id === eleccion.tablero);
        const l = h('label', 'interruptor', `<input type="checkbox"${eleccion.reforzar ? ' checked' : ''}><span>Reforzar la unidad ${t ? t.unidad : ''}<small>El mazo incluye todas las cartas de esa unidad, ideal para repasar antes de una prueba.</small></span>`);
        l.querySelector('input').onchange = ev => { eleccion.reforzar = ev.target.checked; };
        grupoT.appendChild(l);
      }
    }

    if (!col) {   // Las expansiones no tienen fechas: sin línea de tiempo.
      const gl = grupo('Reglas extra');
      const ll = h('label', 'interruptor', `<input type="checkbox"${eleccion.linea ? ' checked' : ''}><span>Línea de tiempo<small>Los Personajes y Acontecimientos con fecha se ordenan en una línea de tiempo. Si los ubicas bien, ganas +1 de Saber.</small></span>`);
      ll.querySelector('input').onchange = ev => { eleccion.linea = ev.target.checked; };
      gl.appendChild(ll);
    }

    const empezar = boton('Empezar', 'boton-principal grande', async () => {
      const guardada = almacen.leer(CLAVES.partida, null);
      if (guardada && guardada.estado && guardada.estado.fase !== 'fin') {
        const si = await confirmar({ titulo: 'Tienes una partida guardada', texto: 'Si empiezas otra, la partida guardada se pierde.', si: 'Empezar otra' });
        if (!si) return;
      }
      almacen.borrar(CLAVES.partida);
      partidaPendiente = { ...eleccion, duelo: eleccion.mazo === 'duelo' ? eleccion.duelo : null, nivel: (almacen.leer(CLAVES.ajustes, {}) || {}).nivel,
        ...(col ? { coleccion: col.id, linea: false, tablero: null, reforzar: false } : { coleccion: null }) };
      location.hash = '#mesa';
    });
    empezar.disabled = !listo;
    // Barra fija abajo: lo elegido en una línea y «Empezar», siempre a la vista (en celular no hay que bajar a buscarlo).
    const duelos2 = col ? ((exp && exp.duelos) || []) : duelos;
    const dueloSel = eleccion.mazo === 'duelo' ? duelos2.find(d => d.id === eleccion.duelo) : null;
    const resumen = [
      eleccion.modo === 'ia' ? 'Contra la tablet' : 'Cara a cara',
      col ? col.nombre : `${eleccion.cursoA}° básico`,
      dueloSel ? dueloSel.nombre : col ? 'Mazo completo' : 'Mazo del curso',
    ];
    const barra = h('div', 'barra-empezar');
    barra.appendChild(h('div', 'resumen-eleccion', resumen.map(x => `<span>${esc(x)}</span>`).join('')
      + (eleccion.modo === 'caraacara' ? '<small>Pongan la tablet en horizontal, entre los dos jugadores.</small>' : '')));
    barra.appendChild(empezar);
    v.appendChild(barra);
    return v;
  },

  async mesa() {
    const guardada = almacen.leer(CLAVES.partida, null);
    const cont = h('div', 'pantalla-mesa');
    app.replaceChildren(cont);
    if (guardada && guardada.version === 1 && guardada.estado && guardada.estado.fase !== 'fin') {
      return montarMesa(cont, { ...guardada.config, estado: guardada.estado });
    }
    const config = partidaPendiente || { ...eleccion, duelo: eleccion.mazo === 'duelo' ? eleccion.duelo : null };
    partidaPendiente = null;
    return montarMesa(cont, config);
  },

  async tutorial() {
    const cont = h('div', 'pantalla-mesa');
    app.replaceChildren(cont);
    return montarMesa(cont, { modo: 'tutorial', cursoA: 7, cursoB: 7, semilla: 2026, tablero: 'T-7-2' });
  },

  async coleccion() {
    const v = h('div', 'pantalla coleccion');
    v.appendChild(volver());
    const modoAlbum = sessionStorage.getItem('cc.vistaColeccion') === 'album';
    v.appendChild(h('h1', '', modoAlbum ? 'Mi álbum' : 'Colección de cartas'));
    const vistasCol = h('div', 'opciones');
    for (const [m, t, d] of [['todas', 'Todas las cartas', 'Para consultar'], ['album', 'Mi álbum', 'Las que has descubierto jugando']]) {
      const b = h('button', `opcion${(m === 'album') === modoAlbum ? ' elegida' : ''}`, `<b>${t}</b><span>${d}</span>`);
      b.onclick = () => { sessionStorage.setItem('cc.vistaColeccion', m); render(); };
      vistasCol.appendChild(b);
    }
    v.appendChild(vistasCol);
    const pestanas = h('div', 'opciones cursos');
    const curso = Number(sessionStorage.getItem('cc.coleccion') || 7);
    for (const c of CURSOS) {
      const b = h('button', `opcion${c === curso ? ' elegida' : ''}`, `<b>${c}°</b>`);
      b.onclick = () => { sessionStorage.setItem('cc.coleccion', c); render(); };
      pestanas.appendChild(b);
    }
    v.appendChild(pestanas);
    const datos = await cargarCursoCompleto(curso);
    const album = crearAlbum(almacen);
    const oficiales = datos.cartas.filter(c => !c.comunidad);
    if (modoAlbum) {
      const progreso = album.progreso(oficiales);
      const total = progreso.reduce((a, p) => a + p.total, 0), vistas = progreso.reduce((a, p) => a + p.descubiertas, 0);
      v.appendChild(h('p', 'nota', `Has descubierto <b>${vistas} de ${total}</b> cartas de ${curso}° básico. Una carta se descubre cuando aparece boca arriba en una partida. Completa una unidad para ganar su insignia.`));
      const ganadas = album.insignias().filter(i => i.curso === curso);
      if (ganadas.length) {
        const fila = h('div', 'insignias');
        for (const i of ganadas) fila.appendChild(h('div', 'insignia', `<span class="medalla"></span><b>Unidad ${esc(i.unidad)}</b><small>${esc(i.nombre)}</small>`));
        v.appendChild(fila);
      }
    }
    datos.unidades.forEach((u, i) => {
      const p = modoAlbum ? album.progreso(oficiales).find(x => x.unidad === i + 1) : null;
      const titulo = h('h2', 'titulo-unidad', `Unidad ${i + 1} · ${esc(u)}${p ? ` <small class="avance">${p.descubiertas}/${p.total}</small>` : ''}`);
      v.appendChild(titulo);
      if (p) {
        const barra = h('div', 'barra-album', `<span style="width:${p.total ? Math.round((p.descubiertas / p.total) * 100) : 0}%"></span>`);
        v.appendChild(barra);
      }
      const grilla = h('div', 'grilla-cartas');
      for (const c of datos.cartas.filter(c => c.unidad === i + 1)) {
        if (modoAlbum && (c.comunidad || !album.tiene(c.id))) {
          if (!c.comunidad) grilla.appendChild(h('div', 'carta carta-normal por-descubrir', '<span>?</span><small>Por descubrir</small>'));
        } else grilla.appendChild(cartaClicable(c, datos.unidades));
      }
      v.appendChild(grilla);
    });
    v.appendChild(h('h2', 'titulo-unidad', 'Cartas Aula · Marco para la Buena Enseñanza'));
    const g = h('div', 'grilla-cartas');
    for (const c of datos.aula) {
      if (modoAlbum && !album.tiene(c.id)) g.appendChild(h('div', 'carta carta-normal por-descubrir', '<span>?</span><small>Por descubrir</small>'));
      else g.appendChild(cartaClicable(c));
    }
    v.appendChild(g);
    return v;
  },

  async torneo() {
    const { vistaTorneo } = await import('./torneo.js');
    return vistaTorneo({
      volver: volver(),
      alJugar: config => { almacen.borrar(CLAVES.partida); partidaPendiente = config; location.hash = '#mesa'; },
      alCambiar: () => render(),
    });
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
    panel.appendChild(botonEscucharCarta(c, () => textoParaLeer(c)));
    const b = boton('Cerrar', 'boton-secundario', () => { detener(); capa.remove(); });
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

// El tema del inicio suena en los menús; en la mesa manda el ambiente del escenario.
const TEMA_INICIO = 'audio/tema/inicio.ogg';
const VISTAS_DE_JUEGO = new Set(['mesa', 'tutorial']);

let ficha = 0;   // cada navegación tiene su ficha; una vista que llega tarde se descarta
async function render() {
  if (actual && actual.destruir) actual.destruir();
  actual = null;
  const mia = ++ficha;
  document.querySelectorAll('body > .capa').forEach(c => c.remove());   // cerrar detalles abiertos de la pantalla anterior
  const nombre = (location.hash || '#inicio').slice(1);
  const vista = vistas[nombre] || vistas.inicio;
  document.body.dataset.vista = nombre;
  if (!VISTAS_DE_JUEGO.has(nombre)) ambiente.poner(TEMA_INICIO);
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
  // Mientras se descarga una versión nueva, se avisa en pantalla (al terminar, la app se recarga sola).
  const avisarDescarga = () => {
    if (!habiaControlador || document.querySelector('.aviso-actualizacion')) return;
    const aviso = document.createElement('div');
    aviso.className = 'aviso-actualizacion';
    aviso.setAttribute('role', 'status');
    aviso.textContent = 'Descargando la versión nueva del juego… se abrirá sola al terminar.';
    document.body.appendChild(aviso);
  };
  navigator.serviceWorker.register('sw.js').then(reg => {
    if (reg.installing) avisarDescarga();
    reg.addEventListener('updatefound', avisarDescarga);
    // Una app que vuelve del segundo plano no recarga la página: se revisa a mano si hay versión nueva.
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  }).catch(() => {});
}

// Sonido de interfaz: un toque suave en cada botón, y el banco de efectos se carga con el primer gesto
// (los navegadores no dejan sonar nada antes de que la persona toque la pantalla).
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', () => { precargarSonidos(); ambiente.pausar(false); }, { once: true, capture: true });
  document.addEventListener('click', ev => {
    const b = ev.target.closest && ev.target.closest('button, .opcion, [role="tab"]');
    if (b && !b.disabled && !b.classList.contains('boton-sonido')) sonidos.toque();
  }, true);
}
