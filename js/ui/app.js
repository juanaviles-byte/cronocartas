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
import { revisarActualizacionApk } from '../actualizacion.js';
import { CURSOS, MAZOS_LIBRES, mazosDePartida, tablerosDisponibles } from '../eleccion.js';
import { modoEscuelaActivo } from '../rendimiento.js';
import { globoNovedades } from './novedades.js';
import { elegirTema, cartasDelTema } from '../temas-inicio.js';
import { mostrarAyudaIOS, estadoDelEquipo } from '../instalar-ios.js';

const app = document.getElementById('app');
// Modo escuela (perfil liviano): lo elige el docente o se activa solo en la tablet del colegio.
document.documentElement.classList.toggle('modo-escuela', modoEscuelaActivo(almacen.leer(CLAVES.ajustes, {}) || {}, navigator.userAgent, navigator.deviceMemory));
let actual = null;            // vista montada (con destruir opcional)
let eleccion = { modo: 'caraacara', cursoA: 7, cursoB: 7, tablero: 'azar', reforzar: false, mazo: 'curso', duelo: null, bandoA: null, linea: true, coleccion: null };
let partidaPendiente = null;   // la deja lista el torneo antes de ir a #mesa
// Tema del inicio (época: fondo y cartas): uno al azar cada vez que se abre el juego; se mantiene mientras siga abierto.
const TEMA = elegirTema();
// El color del tema (marco y gema) vale para todos los menús: la clase va en <html>.
if (typeof document !== 'undefined') {
  document.documentElement.classList.add(`tema-${TEMA.tema.id}`);
  document.documentElement.style.setProperty('--fondo-tema', `url("${new URL(TEMA.fondo, location.href).href}")`);
}

// replaceChildren llegó en Chrome 86; las tablets pueden traer uno más antiguo.
const vaciarYPoner = (padre, hijo) => { padre.textContent = ''; padre.appendChild(hijo); };
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

const vistas = {
  async inicio() {
    const v = h('div', `pantalla inicio tema-${TEMA.tema.id}`);
    // Fondo: un paisaje de la época del tema, con un paneo lento (se detiene con «reducir movimiento»).
    const fondo = h('div', 'inicio-fondo');
    fondo.style.backgroundImage = `url("${new URL(TEMA.fondo, location.href).href}")`;
    v.appendChild(fondo);

    const principal = h('section', 'inicio-principal');
    principal.innerHTML = `
      <header class="portada">
        <h1 class="marca"><img src="img/logo.webp" alt="Cronocartas: Duelo de Historia" width="1400" height="973"></h1>
        <p class="lema">Para 5° a 8° básico</p>
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
      const jugar = boton('Jugar', 'boton-principal grande boton-jugar', () => { location.hash = '#jugar'; });
      jugar.insertAdjacentHTML('afterbegin', '<svg class="icono-jugar" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/></svg>');
      menu.append(jugar);
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
    const docente = boton('Panel docente', 'enlace pastilla', () => { location.hash = '#docente'; });
    docente.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c.6-3.4 3-5.4 6-5.4s5.4 2 6 5.4"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.2c2.6.2 4.6 2 5.1 4.8"/></svg>');
    pie.append(docente);
    pie.appendChild(h('span', 'pastilla', '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M3 6.5C5.5 5 8.5 5 12 7c3.5-2 6.5-2 9-.5V19c-2.5-1.5-5.5-1.5-9 .5-3.5-2-6.5-2-9-.5z"/><path d="M12 7v12.5"/></svg>Escuela Gabriela Mistral · Mostazal'));
    principal.appendChild(pie);
    v.appendChild(principal);
    // Novedades: un globo con una carta, arriba a la derecha (actualizaciones y noticias).
    v.appendChild(globoNovedades(almacen));
    // iPhone y iPad: cómo instalar el juego desde Safari (una vez; se cierra con la ×).
    if (mostrarAyudaIOS({ ...estadoDelEquipo(), cerrada: !!almacen.leer(CLAVES.ayudaIOS, false) })) {
      const ayuda = h('aside', 'ayuda-ios', '<p><b>Instálalo en tu iPhone o iPad:</b> toca <span class="ios-compartir" aria-label="Compartir"></span> Compartir y luego «Agregar a pantalla de inicio». Así funciona sin internet.</p>');
      const cerrar = h('button', 'ayuda-ios-cerrar', '×');
      cerrar.setAttribute('aria-label', 'Cerrar');
      cerrar.onclick = () => { almacen.guardar(CLAVES.ayudaIOS, true); ayuda.remove(); };
      ayuda.appendChild(cerrar);
      v.appendChild(ayuda);
    }

    // Tres cartas de verdad, en abanico: lo más característico del juego.
    const abanico = h('div', 'inicio-abanico');
    abanico.setAttribute('aria-hidden', 'true');
    v.appendChild(abanico);
    // Tres cartas de la época del tema, al azar.
    const archivos = [...new Set(TEMA.tema.cartas.map(f => f.mazo))];
    Promise.all([fetch('data/arte.json').then(r => r.json()), ...archivos.map(m => fetch(`data/${m}.json`).then(r => r.json()))])
      .then(([arte, ...datos]) => {
        registrarImagenes(arte);
        const mazos = {};
        archivos.forEach((m, i) => { mazos[m] = datos[i].cartas; });
        const prot = cartasDelTema(TEMA.tema, mazos, arte);
        const elegidas = [];
        while (elegidas.length < 3 && prot.length) elegidas.push(prot.splice(Math.floor(Math.random() * prot.length), 1)[0]);
        elegidas.forEach((c, i) => { const el = renderCarta(c, { tamano: 'normal' }); el.style.setProperty('--i', i - 1); abanico.appendChild(el); });
      }).catch(() => { /* sin cartas: el inicio funciona igual */ });
    return v;
  },

  async jugar() {
    const ICONO_OPCION = {
      caraacara: '<path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2.5 19c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5zM12.6 14.6c1-.7 2.1-1.1 3.4-1.1 3 0 5.5 2.2 5.5 5.5h-6.2c-.2-1.7-1.2-3.2-2.7-4.4z"/>',
      ia: '<path d="M4 5h16a1 1 0 0 1 1 1v10H3V6a1 1 0 0 1 1-1zm1 2v7h14V7zM1.5 17.5h21l-1.2 2H2.7z"/>',
      curso: '<path d="M7.2 4.6l9.6-1.4 1.6 11.8-9.6 1.4zM4 6.6l2.6-.4 1.7 12 7.4-1.1.2 1.6-9.6 1.4z"/>',
      libre: '<path d="M4 5.5l7-2 2.8 9.8-7 2zM13.6 4.2l6.8 2.6-3.6 9.5-2.2-.9 2.6-6.9-3.9-1.5zM7.4 16.4l5.1-1.5.8 2.8 3.7-.8.5 2.4-6.2 1.3z"/>',
      duelo: '<path d="M4 3l7.5 7.5-1.6 1.6L2.4 4.6 2.6 3zM20 3l1.4 1.6L13.9 12l-1.6-1.6zM6.3 13.5l1.4 1.4-1.6 1.6 1.4 1.4 1.6-1.6 1.4 1.4-3.3 3.3-1.4-1.4L3.4 21 2 19.6l2.4-2.4L3 15.8zM17.7 13.5L21 16.8l-1.4 1.4 2.4 2.4-1.4 1.4-2.4-2.4-1.4 1.4-3.3-3.3 1.4-1.4 1.6 1.6 1.4-1.4-1.6-1.6z"/>',
    };
    const conIcono = (clave, texto) => ICONO_OPCION[clave] ? `<svg class="icono-opcion" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="currentColor">${ICONO_OPCION[clave]}</svg>${texto}` : texto;
    const [tableros, duelos] = await Promise.all([cargarTableros(), cargarDuelos()]);
    const ajustes = almacen.leer(CLAVES.ajustes, {}) || {};
    const v = h('div', `pantalla preparar tema-${TEMA.tema.id}`);
    // Cabecera: volver, título, pestañas y el logo; debajo, dos columnas (opciones y tablero) que se desplazan cada una por su cuenta.
    const cabecera = h('header', 'preparar-cabecera');
    const titulos = h('div', 'preparar-titulos');
    titulos.appendChild(volver());
    titulos.appendChild(h('h1', '', 'Nueva partida'));
    cabecera.appendChild(titulos);
    cabecera.appendChild(h('img', 'preparar-logo'));
    cabecera.lastChild.src = 'img/logo.webp'; cabecera.lastChild.alt = ''; cabecera.lastChild.width = 1400; cabecera.lastChild.height = 973;
    v.appendChild(cabecera);
    const cuerpo = h('div', 'preparar-cuerpo');
    const izq = h('div', 'preparar-col preparar-opciones');
    const der = h('div', 'preparar-col preparar-tablero');
    cuerpo.append(izq, der);
    const grupo = (titulo, donde = izq, clase = '') => { const g = h('section', `grupo${clase ? ' ' + clase : ''}`); g.appendChild(h('h2', '', titulo)); donde.appendChild(g); return g; };
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
    titulos.appendChild(pestanas);
    v.appendChild(cuerpo);
    const col = eleccion.coleccion ? coleccion(eleccion.coleccion) : null;
    if (eleccion.coleccion && !col) eleccion.coleccion = null;
    const exp = col ? await fetch(col.archivo).then(r => r.json()).catch(() => null) : null;
    const opciones = (lista, actual, alElegir, clase = 'opciones') => {
      const fila = h('div', clase);
      for (const [valor, t, d] of lista) {
        const b = h('button', `opcion${actual === valor ? ' elegida' : ''}${ICONO_OPCION[valor] && clase === 'opciones' ? ' con-icono' : ''}`,
          clase === 'opciones' ? conIcono(valor, `<b>${t}</b>${d ? `<span>${d}</span>` : ''}`) : `<b>${t}</b>${d ? `<span>${d}</span>` : ''}`);
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
      : [['curso', 'Mazo del curso', 'Cartas de las 4 unidades'], ['libre', 'Modo libre', 'Cada jugador, su mazo: un curso o una expansión'], ['duelo', 'Duelo temático', 'Cada jugador, un bando histórico']],
      eleccion.mazo, m => {
        // Al entrar al modo libre, la tablet parte con un mazo al azar; cara a cara, con el mismo curso.
        if (m === 'libre' && eleccion.mazo !== 'libre') eleccion.cursoB = eleccion.modo === 'ia' ? 'azar' : eleccion.cursoA;
        // Fuera del modo libre solo hay cursos: si se había elegido una expansión, se vuelve a un curso.
        if (m !== 'libre' && eleccion.mazo === 'libre') eleccion.tablero = 'azar';   // el tablero podía ser de otro curso
        if (m !== 'libre') { if (!CURSOS.includes(eleccion.cursoA)) eleccion.cursoA = CURSOS.includes(eleccion.cursoB) ? eleccion.cursoB : 7; eleccion.cursoB = eleccion.cursoA; }
        eleccion.mazo = m;
      }));

    const cruzados = !col && eleccion.mazo === 'libre';
    if (!col) {
    const cursos = grupo(cruzados ? 'Mazo de cada jugador' : '¿Qué curso?');
    const filas = cruzados ? [['cursoA', eleccion.modo === 'ia' ? 'Tú' : 'Jugador 1'], ['cursoB', eleccion.modo === 'ia' ? 'Tablet' : 'Jugador 2']] : [['cursoA', '']];
    for (const [k, etiqueta] of filas) {
      const fila = h('div', 'opciones cursos');
      if (etiqueta) fila.appendChild(h('span', 'etiqueta', etiqueta));
      // En el modo libre, las expansiones son un mazo más junto a los cursos.
      for (const c of cruzados ? MAZOS_LIBRES : CURSOS) {
        const ex = coleccion(c);
        const b = h('button', `opcion ${ex ? 'mazo-expansion' : `curso-${c}`}${eleccion[k] === c ? ' elegida' : ''}`,
          ex ? `<b>${esc(ex.sigla)}</b><span>${esc(ex.corto || ex.nombre)}</span>` : `<b>${c}°</b><span>básico</span>`);
        if (ex) { b.title = 'Expansión: ' + ex.nombre; b.setAttribute('aria-label', 'Expansión ' + ex.nombre); }
        b.onclick = () => { eleccion[k] = c; if (!cruzados) eleccion.cursoB = c; if (k === 'cursoA' || ex) { eleccion.tablero = 'azar'; eleccion.reforzar = false; eleccion.duelo = null; eleccion.bandoA = null; } render(); };
        fila.appendChild(b);
      }
      if (cruzados) {   // cada jugador puede pedir un mazo al azar (curso o expansión)
        const b = h('button', `opcion curso-azar${eleccion[k] === 'azar' ? ' elegida' : ''}`, '<b>?</b><span>al azar</span>');
        b.setAttribute('aria-label', `${etiqueta}: mazo al azar`);
        b.onclick = () => { eleccion[k] = 'azar'; if (k === 'cursoA') { eleccion.tablero = 'azar'; eleccion.reforzar = false; } render(); };
        fila.appendChild(b);
      }
      cursos.appendChild(fila);
    }
    }

    // Modo libre: el tablero sale del curso que haya en juego; con dos expansiones no hay tablero ni línea de tiempo.
    const cursoDeMesa = CURSOS.includes(eleccion.cursoA) ? eleccion.cursoA : CURSOS.includes(eleccion.cursoB) ? eleccion.cursoB : null;
    const nombreMazo = m => m === 'azar' ? 'un mazo al azar' : coleccion(m) ? coleccion(m).nombre : `${m}°`;
    let listo = true;
    if (eleccion.mazo === 'duelo') {
      const delCurso = col ? ((exp && exp.duelos) || []) : duelos.filter(d => d.curso === eleccion.cursoA);
      if (!delCurso.some(d => d.id === eleccion.duelo)) { eleccion.duelo = delCurso.length ? delCurso[0].id : null; eleccion.bandoA = null; }
      const gd = grupo('Duelo', der);
      gd.appendChild(opciones(delCurso.map(d => [d.id, esc(d.nombre), d.bandos.map(b => esc(b.nombre)).join(' vs. ')]), eleccion.duelo, id => { eleccion.duelo = id; eleccion.bandoA = null; }));
      const d = delCurso.find(x => x.id === eleccion.duelo);
      if (d) {
        if (!d.bandos.some(b => b.id === eleccion.bandoA)) eleccion.bandoA = d.bandos[0].id;
        const gb = grupo(eleccion.modo === 'ia' ? 'Tu bando' : 'Bando del Jugador 1', der);
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
    } else if (!col && (cursoDeMesa || cruzados)) {
      // Tablero: uno por unidad del curso (en el modo libre, los de todos los cursos), o sorpresa.
      const grupoT = grupo('Tablero', der, 'grupo-tableros');
      const grilla = h('div', 'tableros');
      const sorpresa = h('button', `opcion-tablero sorpresa${eleccion.tablero === 'azar' ? ' elegida' : ''}`, `<b>Sorpresa</b><small>${cruzados ? 'Un tablero al azar entre todos' : 'Un tablero al azar del curso'}</small>`);
      sorpresa.onclick = () => { eleccion.tablero = 'azar'; eleccion.reforzar = false; render(); };
      grilla.appendChild(sorpresa);
      for (const t of tablerosDisponibles(tableros, { libre: cruzados, curso: cursoDeMesa })) {
        const b = h('button', `opcion-tablero${eleccion.tablero === t.id ? ' elegida' : ''}`, `<b>${cruzados ? `${t.curso}° · ` : ''}U${t.unidad} · ${esc(t.nombre)}</b><small>${esc(t.textoRegla)}</small>`);
        b.style.backgroundImage = `url("${t.imagen}")`;
        b.onclick = () => { eleccion.tablero = t.id; render(); };
        grilla.appendChild(b);
      }
      grupoT.appendChild(grilla);
      der.classList.add('con-tableros');
      arrastrable(grilla);
      if (eleccion.tablero !== 'azar' && !cruzados) {
        const t = tableros.find(x => x.id === eleccion.tablero);
        const l = h('label', 'interruptor', `<input type="checkbox"${eleccion.reforzar ? ' checked' : ''}><span>Reforzar la unidad ${t ? t.unidad : ''}<small>El mazo incluye todas las cartas de esa unidad, ideal para repasar antes de una prueba.</small></span>`);
        l.querySelector('input').onchange = ev => { eleccion.reforzar = ev.target.checked; };
        grupoT.appendChild(l);
      }
    }

    // Las expansiones no tienen fechas: sin línea de tiempo (con un mazo al azar puede salir un curso; la mesa decide).
    if (!col && (cursoDeMesa || (cruzados && [eleccion.cursoA, eleccion.cursoB].includes('azar')))) {
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
        ...(col ? { coleccion: col.id, linea: false, tablero: null, reforzar: false } : { coleccion: null, ...mazosDePartida(eleccion) }) };
      location.hash = '#mesa';
    });
    empezar.disabled = !listo;
    // Barra fija abajo: lo elegido en una línea y «Empezar», siempre a la vista (en celular no hay que bajar a buscarlo).
    const duelos2 = col ? ((exp && exp.duelos) || []) : duelos;
    const dueloSel = eleccion.mazo === 'duelo' ? duelos2.find(d => d.id === eleccion.duelo) : null;
    const resumen = [
      eleccion.modo === 'ia' ? 'Contra la tablet' : 'Cara a cara',
      col ? col.nombre : cruzados ? `${nombreMazo(eleccion.cursoA)} contra ${nombreMazo(eleccion.cursoB)}` : `${eleccion.cursoA}° básico`,
      dueloSel ? dueloSel.nombre : col ? 'Mazo completo' : cruzados ? 'Modo libre' : 'Mazo del curso',
    ];
    const barra = h('div', 'barra-empezar');
    barra.appendChild(h('div', 'resumen-eleccion', resumen.map(x => `<span>${esc(x)}</span>`).join('')
      + (eleccion.modo === 'caraacara' ? '<small>Pongan la tablet en horizontal, entre los dos jugadores.</small>' : '')));
    barra.appendChild(empezar);
    v.appendChild(barra);
    if (!der.childNodes.length) v.classList.add('una-columna');
    return v;
  },

  async mesa() {
    const guardada = almacen.leer(CLAVES.partida, null);
    const cont = h('div', 'pantalla-mesa');
    vaciarYPoner(app, cont);
    if (guardada && guardada.version === 1 && guardada.estado && guardada.estado.fase !== 'fin') {
      return montarMesa(cont, { ...guardada.config, estado: guardada.estado });
    }
    const config = partidaPendiente || { ...eleccion, duelo: eleccion.mazo === 'duelo' ? eleccion.duelo : null, ...(eleccion.coleccion ? {} : mazosDePartida(eleccion)) };
    partidaPendiente = null;
    return montarMesa(cont, config);
  },

  async tutorial() {
    const cont = h('div', 'pantalla-mesa');
    vaciarYPoner(app, cont);
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
    if (r instanceof HTMLElement) { vaciarYPoner(app, r); actual = null; }
    else actual = r;
  } catch (e) {
    console.error(e);
    if (mia === ficha) vaciarYPoner(app, h('div', 'pantalla error', `<h1>Algo falló</h1><p>${esc(e.message || e)}</p><p><a href="#inicio">Volver al inicio</a></p>`));
  }
}

window.addEventListener('hashchange', render);
// Señal para index.html: la app arrancó (si no llega, se muestra el aviso de arranque fallido).
render().then(() => { window.__cronocartasListo = true; });

// En el APK: al abrir, si hay una versión publicada más nueva, se ofrece descargarla en Chrome.
if (window.Capacitor) revisarActualizacionApk();

// En el APK (Capacitor) los archivos ya vienen dentro de la app: no hace falta guardarlos otra vez.
if ('serviceWorker' in navigator && window.isSecureContext && !window.Capacitor) {
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

// Desplazar arrastrando con el mouse (en pantallas táctiles el dedo ya desplaza): la lista se mueve sola, sin mover la página.
// Si hubo arrastre, el clic que viene al soltar no elige nada.
function arrastrable(el) {
  let ini = null, movio = false;
  el.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    ini = { x: e.clientX, y: e.clientY, l: el.scrollLeft, t: el.scrollTop, id: e.pointerId }; movio = false;
  });
  el.addEventListener('pointermove', e => {
    if (!ini) return;
    const dx = e.clientX - ini.x, dy = e.clientY - ini.y;
    if (!movio && Math.abs(dx) + Math.abs(dy) < 6) return;
    if (!movio) { movio = true; el.classList.add('arrastrando'); try { el.setPointerCapture(ini.id); } catch (_) { /* sin captura: sigue igual */ } }
    el.scrollLeft = ini.l - dx; el.scrollTop = ini.t - dy;
  });
  const soltar = () => { if (ini) { ini = null; el.classList.remove('arrastrando'); } };
  el.addEventListener('pointerup', soltar);
  el.addEventListener('pointercancel', soltar);
  el.addEventListener('click', e => { if (movio) { e.stopPropagation(); e.preventDefault(); movio = false; } }, true);
}
