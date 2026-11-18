// Mesa de juego: cara a cara en la misma tablet, contra la tablet o tutorial.
// Solo dibuja y traduce toques en jugadas; las reglas viven en motor.js.
import { crearPartida, jugadasValidas, aplicarJugada, busquedaDe, danioDeAccion, jugadaReversible, VENTAJA } from '../motor.js';
import { situacion, situacionDeEvento, pista } from './guia.js';
import { elegirJugada } from '../ia.js';
import { armarMazo, mazoDeBando } from '../mazos.js';
import { crearAlbum, cartasVisibles } from '../album.js';
import { anotarGanador } from '../torneo.js';
import { cargarCursoCompleto } from './datos.js';
import { crearRng } from '../rng.js';
import { almacen, CLAVES } from '../almacen.js';
import { renderCarta, textoParaLeer, textoReglas } from './carta.js';
import { botonEscuchar, botonEscucharCarta, leer, detener, reproducir, rutaCronista } from './voz.js';
import { esc, pips } from '../html.js';
import { sonidos, sonidoActivo, alternarSonido } from './sonido.js';
import { hacerArrastrable } from './arrastre.js';

// Dorso de carta: reloj de arena dorado sobre azul noche (el emblema de La Cronista).
const DORSO = '<svg class="emblema-dorso" viewBox="0 0 40 56" aria-hidden="true"><rect x="3" y="3" width="34" height="50" rx="4" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M13 14h14M13 42h14M14 15c0 8 12 8 12 13s-12 5-12 13M26 15c0 8-12 8-12 13s12 5 12 13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M17 38c1-3 5-3 6 0z" fill="currentColor"/></svg>';

let DUELOS = null;
export async function cargarDuelos() {
  if (!DUELOS) DUELOS = await fetch('data/duelos.json').then(r => r.json()).then(d => d.duelos).catch(() => []);
  return DUELOS;
}

let TABLEROS = null;
export async function cargarTableros() {
  if (!TABLEROS) TABLEROS = await fetch('data/tableros.json').then(r => r.json()).then(d => d.tableros).catch(() => []);
  return TABLEROS;
}

export const FRASES_VENTAJA = {
  Politica: 'Las decisiones políticas reordenan la economía',
  Economia: 'La economía transforma la vida de las personas',
  Sociedad: 'Los grupos sociales crean y cambian la cultura',
  Cultura: 'Las ideas y técnicas transforman el territorio',
  Territorio: 'El territorio condiciona el poder',
};

const ICONO_SONIDO = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>';
const ICONO_SILENCIO = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

export async function montarMesa(contenedor, opciones) {
  const ajustes = almacen.leer(CLAVES.ajustes, {}) || {};
  const config = {
    modo: opciones.modo || 'caraacara',
    cursoA: Number(opciones.cursoA || 7),
    cursoB: Number(opciones.cursoB || opciones.cursoA || 7),
    semilla: opciones.semilla ?? Math.floor(Math.random() * 1e9),
    hitosParaGanar: opciones.hitosParaGanar || ajustes.hitosParaGanar || 3,
    sabias: ajustes.sabias !== false,
    leerSabias: !!ajustes.leerSabias,
    tablero: opciones.tablero || 'azar',
    reforzar: !!opciones.reforzar,
    nivel: ({ cronista: 'erudito' })[opciones.nivel || ajustes.nivel] || opciones.nivel || ajustes.nivel || 'historiador',
    linea: opciones.modo === 'tutorial' ? false : opciones.linea !== false,
    duelo: opciones.duelo || null,
    bandoA: opciones.bandoA || null,
    nombres: opciones.nombres || null,
    torneo: opciones.torneo || null,
    cronista: opciones.modo === 'tutorial' || ajustes.cronista !== false,
  };
  const contraIA = config.modo !== 'caraacara';
  // Los nombres solo se insertan en HTML: se guardan ya escapados (en el torneo los escribe el docente).
  const crudos = config.nombres || { A: contraIA ? 'Tú' : 'Jugador 1', B: contraIA ? 'Tablet' : 'Jugador 2' };
  const nombres = { A: esc(crudos.A), B: esc(crudos.B) };

  contenedor.innerHTML = '<div class="cargando">Barajando…</div>';
  const duelo = config.duelo ? (await cargarDuelos()).find(d => d.id === config.duelo) || null : null;
  if (duelo) { config.cursoA = duelo.curso; config.cursoB = duelo.curso; config.tablero = duelo.tablero; }
  const bandoDe = duelo ? (() => {
    const a = duelo.bandos.find(b => b.id === config.bandoA) || duelo.bandos[0];
    return { A: a, B: duelo.bandos.find(b => b !== a) };
  })() : null;
  const [datosA, datosB, tableros] = await Promise.all([cargarCursoCompleto(config.cursoA), cargarCursoCompleto(config.cursoB), cargarTableros()]);
  const unidadesDe = { [config.cursoA]: datosA.unidades, [config.cursoB]: datosB.unidades };

  let estado = opciones.estado;
  if (!estado) {
    const rng = crearRng(config.semilla);
    // Tablero: el elegido o uno al azar del curso.
    const delCurso = tableros.filter(t => t.curso === config.cursoA);
    let tablero = tableros.find(t => t.id === config.tablero);
    if (!tablero && delCurso.length) tablero = delCurso[Math.floor(rng.siguiente() * delCurso.length)];
    config.tablero = tablero ? tablero.id : null;
    const foco = config.reforzar && tablero ? { unidad: tablero.unidad } : {};
    estado = crearPartida({
      mazoA: bandoDe ? mazoDeBando(datosA.cartas, datosA.aula, rng, duelo, bandoDe.A.id) : armarMazo(datosA.cartas, datosA.aula, rng, foco),
      mazoB: bandoDe ? mazoDeBando(datosB.cartas, datosB.aula, rng, duelo, bandoDe.B.id) : armarMazo(datosB.cartas, datosB.aula, rng, foco),
      semilla: config.semilla + 1,
      hitosParaGanar: config.hitosParaGanar,
      tablero,
      lineaTiempo: config.linea,
    });
  }
  const tableroActual = () => tableros.find(t => t.id === (estado.tablero && estado.tablero.id)) || null;

  const partidaNueva = !opciones.estado;
  let vivo = true;
  let ocupado = false;           // mientras se muestra un aviso o juega la IA
  let historial = [];            // estados anteriores del turno, para Deshacer
  let caidas = [];               // cartas caídas, para el resumen final
  let temporizador = null;
  const raiz = h('div', `mesa modo-${config.modo}`);
  contenedor.innerHTML = '';
  contenedor.appendChild(raiz);

  const girado = j => config.modo === 'caraacara' && j === 'B';

  // Álbum: cartas vistas boca arriba en esta partida.
  const album = crearAlbum(almacen);
  const cartasAlbum = [...datosA.cartas, ...(config.cursoB !== config.cursoA ? datosB.cartas : []), ...datosA.aula];
  const nuevasPartida = new Set();
  const insigniasPartida = [];
  function registrarAlbum() {
    const r = album.descubrir([...cartasVisibles(estado, contraIA ? ['A'] : ['A', 'B'])], cartasAlbum, unidadesDe);
    r.nuevas.forEach(id => nuevasPartida.add(id));
    insigniasPartida.push(...r.insignias);
  }
  const unidadesCarta = c => unidadesDe[c.curso] || null;

  let avisoGuardar = false;
  function guardar() {
    if (config.modo === 'tutorial') return;
    if (estado.fase === 'fin') { almacen.borrar(CLAVES.partida); return; }
    const r = almacen.guardar(CLAVES.partida, { version: 1, config, estado });
    if (!r.ok && !avisoGuardar) {
      avisoGuardar = true;
      setTimeout(() => registrar('No hay espacio para guardar la partida: si se cierra la app, no se podrá continuar.'), 50);
    }
  }

  // Una partida nueva se guarda de inmediato: si la tablet se recarga antes de la primera jugada
  // (por ejemplo, en una partida del torneo), se retoma con su configuración.
  if (partidaNueva) guardar();

  // ---------- Dibujo ----------
  let uidsAntes = null;                 // para animar las cartas que entran a la mesa
  let hitosAntes = { A: 0, B: 0 };      // para animar el sello del Hito nuevo
  function render() {
    if (!vivo) return;
    raiz.innerHTML = '';
    pintarFondo();
    raiz.appendChild(lado('B'));
    raiz.appendChild(centro());
    raiz.appendChild(lado('A'));
    if (config.modo === 'tutorial') entrenador();
    const ahora = new Set([...raiz.querySelectorAll('.campo [data-uid]')].map(e => e.dataset.uid));
    if (uidsAntes) raiz.querySelectorAll('.campo [data-uid]').forEach(e => { if (!uidsAntes.has(e.dataset.uid)) e.classList.add('entra'); });
    uidsAntes = ahora;
    hitosAntes = { A: estado.jugadores.A.hitos, B: estado.jugadores.B.hitos };
    raiz.querySelectorAll('.mano').forEach(m => m.classList.toggle('desplazable', m.scrollWidth > m.clientWidth + 2));
    marcarSaber();
    registrarAlbum();
    activarArrastre();
    revisarUbicar();
    guiaProactiva();
    dibujarGlobo();
    programarIA();
  }

  // ---------- Saber visible ----------
  // Compara el Saber de cada Protagonista con el dibujo anterior y muestra "+1 Saber" donde cambió.
  let saberAntes = null;
  function marcarSaber() {
    const ahora = {};
    for (const j of ['A', 'B']) {
      const yo = estado.jugadores[j];
      for (const p of [yo.activo, ...yo.reserva]) if (p) ahora[p.uid] = p.saber;
      const humano = !(contraIA && j === 'B');
      if (humano && estado.turno === j && estado.fase === 'turno' && yo.saberPendiente > 0) {
        raiz.querySelectorAll(`.lado-${j} .campo .carta-mini[data-uid]`).forEach(el => el.classList.add('pide-saber'));
      }
    }
    if (saberAntes) {
      for (const [uid, n] of Object.entries(ahora)) {
        const d = n - (saberAntes[uid] ?? 0);
        if (d) flotarSaber(uid, d);
      }
    }
    saberAntes = ahora;
  }
  function flotarSaber(uid, d) {
    const el = raiz.querySelector(`.campo [data-uid="${CSS.escape(uid)}"]`);
    if (!el) return;
    const insignia = el.querySelector('.mini-saber');
    if (insignia) { insignia.classList.remove('gana'); void insignia.offsetWidth; insignia.classList.add(d > 0 ? 'gana' : 'pierde'); }
    if (d > 0) sonidos.saber();
    if (sinMovimiento()) return;
    const n = h('div', `numero-saber${d < 0 ? ' menos' : ''}`, `${d > 0 ? '+' : '−'}${Math.abs(d)} Saber`);
    el.appendChild(n);
    setTimeout(() => n.remove(), 1400);
  }

  // ---------- Arrastrar y soltar ----------
  // Mano → activo/reserva (bajar), → otra carta (evolucionar), → tu lado de la mesa (jugar).
  // Reserva → activo (retirarse o promover).
  function activarArrastre() {
    const j = estado.turno;
    if (estado.fase === 'fin' || (contraIA && j === 'B')) return;
    const yo = estado.jugadores[j];
    const lado = raiz.querySelector(`.lado-${j}`);
    if (!lado) return;
    const zonaActivo = lado.querySelector('.zona-activo');
    const reserva = lado.querySelector('.reserva');
    const validas = () => jugadasValidas(estado);

    lado.querySelectorAll('.mano [data-mano]').forEach(el => {
      const entrada = yo.mano.find(c => c.uid === el.dataset.mano);
      if (!entrada) return;
      hacerArrastrable(el, {
        girado: girado(j),
        objetivos: () => {
          const out = new Map();
          for (const v of validas().filter(x => x.uid === entrada.uid)) {
            if (v.tipo === 'colocar') out.set(yo.activo ? reserva : zonaActivo, v);
            if (v.tipo === 'bajar') out.set(reserva, v);
            if (v.tipo === 'evolucionar') { const t = lado.querySelector(`[data-uid="${v.objetivo}"]`); if (t) out.set(t, v); }
            if (v.tipo === 'jugar') out.set(lado, { jugarCarta: true });
          }
          return [...out].map(([el2, accion]) => ({ el: el2, accion }));
        },
        alSoltar: accion => {
          if (accion.jugarCarta) jugarDesdeMano(j, entrada);
          else jugar(accion);
        },
      });
    });

    lado.querySelectorAll('.reserva [data-uid]').forEach(el => {
      hacerArrastrable(el, {
        girado: girado(j),
        objetivos: () => validas()
          .filter(v => (v.tipo === 'retirar' && v.reemplazo === el.dataset.uid) || (v.tipo === 'promover' && v.uid === el.dataset.uid))
          .map(v => ({ el: zonaActivo, accion: v })),
        alSoltar: accion => jugar(accion),
      });
    });
  }

  // Jugar una carta soltada en la mesa: si pide elegir algo, se abre la elección.
  function jugarDesdeMano(j, entrada) {
    const opciones = jugadasValidas(estado).filter(v => v.tipo === 'jugar' && v.uid === entrada.uid);
    const b = busquedaDe(entrada.carta.efecto);
    if (b) return elegirBusqueda(j, entrada, b);
    if (opciones.length === 1) return jugar(opciones[0]);
    verCarta(entrada.carta, j, opciones.map(v => ({ jugada: v, texto: textoJugada(v, j) })));
  }

  // El fondo es el tablero; si el Lugar en juego tiene su propio escenario, se muestra ese.
  function pintarFondo() {
    const t = tableroActual();
    const lugarId = estado.lugar && estado.lugar.carta.id;
    const escenario = (lugarId && tableros.find(x => x.lugares.includes(lugarId))) || t;
    // URL completa: una ruta relativa en una variable CSS se resolvería desde css/.
    if (escenario) raiz.style.setProperty('--fondo-img', `url("${new URL(escenario.imagen, location.href).href}")`);
    raiz.classList.toggle('con-tablero', !!escenario);
  }

  function verTablero() {
    const t = tableroActual();
    if (!t) return;
    const capa = h('div', `capa${girado(estado.turno) ? ' girado' : ''}`);
    const panel = h('div', 'panel-aviso panel-tablero');
    panel.innerHTML = `<img src="${esc(t.imagen)}" alt=""><div class="titulo-sabias">${esc(t.nombre)}</div>
      <p class="lema">${esc(t.lema)}</p><p><b>Regla del tablero:</b> ${esc(t.textoRegla)}</p>`;
    const b = h('button', 'boton-principal', 'Entendido');
    b.onclick = () => capa.remove();
    panel.appendChild(b);
    capa.appendChild(panel);
    capa.onclick = ev => { if (ev.target === capa) capa.remove(); };
    raiz.appendChild(capa);
  }

  function centro() {
    const c = h('div', 'centro');
    const t = tableroActual();
    if (t) {
      const bt = h('button', 'tablero-en-juego', `<b>${esc(t.nombre)}</b> <span>${esc(t.textoRegla)}</span>`);
      bt.onclick = verTablero;
      c.appendChild(bt);
    }
    const l = estado.lugar;
    const lugar = h('button', `lugar-en-juego${l ? ' con-lugar' : ''}`);
    if (l) {
      lugar.appendChild(renderCarta(l.carta, { tamano: 'mini' }));
      lugar.appendChild(h('span', 'nombre-lugar', `<small>Lugar</small>${esc(l.carta.nombre)}`));
      lugar.setAttribute('aria-label', 'Lugar en juego: ' + l.carta.nombre);   // atributo: no se interpreta como HTML
      lugar.onclick = () => verCarta(l.carta, estado.turno);
    } else lugar.appendChild(h('div', 'hueco', '<span>Lugar</span>'));
    c.appendChild(lugar);
    const turno = estado.fase === 'fin' ? 'Partida terminada'
      : estado.fase === 'preparacion' ? `${nombres[estado.turno]}: prepara tu mesa`
      : estado.fase === 'promover' ? `${nombres[estado.turno]}: elige un nuevo activo`
      : (contraIA && estado.turno === 'A') ? 'Tu turno' : `Turno de ${nombres[estado.turno]}`;
    c.appendChild(h('div', `aviso-turno turno-${estado.turno}`, turno));
    c.appendChild(h('div', 'registro', ''));
    const son = h('button', 'boton-sonido', sonidoActivo() ? ICONO_SONIDO : ICONO_SILENCIO);
    son.setAttribute('aria-label', 'Sonido');
    son.onclick = () => { son.innerHTML = alternarSonido() ? ICONO_SONIDO : ICONO_SILENCIO; };
    c.appendChild(son);
    if (config.modo !== 'tutorial') {
      const cr = h('button', `boton-guia${config.cronista ? ' encendida' : ''}`, '<img src="img/cronista/cara.jpg" alt="">');
      cr.setAttribute('aria-label', config.cronista ? 'Apagar a La Cronista' : 'Encender a La Cronista');
      cr.title = config.cronista ? 'La Cronista: encendida' : 'La Cronista: apagada';
      cr.onclick = () => {
        config.cronista = !config.cronista;
        almacen.guardar(CLAVES.ajustes, { ...(almacen.leer(CLAVES.ajustes, {}) || {}), cronista: config.cronista });
        if (!config.cronista) globo = null;
        render();
      };
      c.appendChild(cr);
    }
    const menu = h('button', 'boton-menu', 'Menú');
    menu.onclick = () => { location.hash = '#inicio'; };
    c.appendChild(menu);
    return c;
  }

  function lado(j) {
    const yo = estado.jugadores[j];
    const esMiTurno = estado.turno === j && estado.fase !== 'fin';
    const humano = !(contraIA && j === 'B');
    const s = h('section', `lado lado-${j}${girado(j) ? ' girado' : ''}${esMiTurno ? ' activo-turno' : ''}`);

    // Campo: activo + acciones + reserva + marcador
    const campo = h('div', 'campo');
    const zonaActivo = h('div', 'zona-activo');
    if (yo.activo) {
      const ca = renderCarta(yo.activo.carta, { tamano: 'mini', instancia: yo.activo });
      ca.dataset.uid = yo.activo.uid;
      ca.classList.add('en-activo');
      ca.onclick = () => tocarEnMesa(j, yo.activo);
      zonaActivo.appendChild(ca);
    } else zonaActivo.appendChild(h('div', 'hueco', '<span>Activo</span>'));

    const acciones = h('div', 'acciones-activo');
    if (yo.activo && yo.activo.carta.acciones) {
      const validas = esMiTurno && humano ? jugadasValidas(estado) : [];
      const tiene = yo.activo.saber;
      const quien = humano ? 'Tu activo tiene' : 'Su activo tiene';
      acciones.appendChild(h('div', 'saber-activo', `<span class="pip"></span> ${quien} <b>${esc(tiene)}</b> de Saber`));
      yo.activo.carta.acciones.forEach((a, indice) => {
        const ok = validas.some(v => v.tipo === 'accion' && v.indice === indice);
        const falta = Math.max(0, a.costo - tiene);
        const costo = Array.from({ length: a.costo }, (_, i) => `<span class="pip${i < tiene ? '' : ' vacia'}"></span>`).join('');
        const primerTurno = estado.numeroTurno <= 1 && esMiTurno;
        const rivalActivo = estado.jugadores[j === 'A' ? 'B' : 'A'].activo;
        const ventaja = rivalActivo && VENTAJA[yo.activo.carta.dimension] === rivalActivo.carta.dimension;
        const efectivo = rivalActivo && !rivalActivo.protegido ? danioDeAccion(estado, j, indice) : a.danio;
        const nota = falta ? `<small class="falta">Falta ${falta} de Saber</small>`
          : primerTurno ? '<small class="falta">No se ataca en el primer turno</small>'
          : rivalActivo && rivalActivo.protegido ? '<small class="falta">El rival está protegido</small>' : '';
        const marca = ventaja ? '<i class="x2" title="Ventaja: daño doble">×2</i>' : '';
        const b = h('button', `boton-accion${falta ? ' sin-saber' : ''}${ventaja ? ' con-ventaja' : ''}`, `<span class="costo">${costo}</span><span class="an">${esc(a.nombre)}${nota}</span><b>${esc(efectivo)}${marca}</b>`);
        b.disabled = !ok;
        b.onclick = () => jugar({ tipo: 'accion', indice });
        acciones.appendChild(b);
      });
    }

    const reserva = h('div', 'reserva');
    for (let i = 0; i < 3; i++) {
      const r = yo.reserva[i];
      if (r) {
        const cr = renderCarta(r.carta, { tamano: 'mini', instancia: r });
        cr.dataset.uid = r.uid;
        cr.onclick = () => tocarEnMesa(j, r);
        reserva.appendChild(cr);
      } else reserva.appendChild(h('div', 'hueco', '<span>Reserva</span>'));
    }

    const marcador = h('div', 'marcador');
    if (bandoDe) marcador.style.setProperty('--bando-placa', bandoDe[j].color);
    marcador.innerHTML = `
      ${bandoDe ? `<div class="bando" style="--bando:${bandoDe[j].color}">${esc(bandoDe[j].nombre)}</div>` : ''}
      <div class="nombre-jugador">${nombres[j]}</div>
      <div class="hitos" title="Hitos">${[...Array(estado.hitosParaGanar)].map((_, i) => `<i class="${i < yo.hitos ? 'si' : ''}${i < yo.hitos && i >= hitosAntes[j] ? ' nuevo' : ''}"></i>`).join('')}</div>
      <div class="cuentas">Mano ${yo.mano.length}</div>`;
    if (estado.lineaTiempo) {
      const n = (yo.linea || []).length;
      const bl = h('button', 'linea-mini', `<span class="reloj"></span> Línea de tiempo · ${n}`);
      bl.onclick = () => verLinea(j);
      marcador.appendChild(bl);
    }

    // Mazo y descarte como pilas de cartas
    const pilas = h('div', 'pilas');
    const mazo = h('div', 'pila pila-mazo', `${yo.mazo.length ? DORSO : ''}<span class="cuenta">${yo.mazo.length}</span><small>Mazo</small>`);
    if (!yo.mazo.length) mazo.classList.add('vacia');
    const desc = h('button', 'pila pila-descarte');
    const tope = yo.descarte[yo.descarte.length - 1];
    if (tope) desc.appendChild(renderCarta(tope.carta, { tamano: 'mini' }));
    else desc.appendChild(h('div', 'hueco', '<span>Descarte</span>'));
    desc.appendChild(h('small', '', `Descarte · ${yo.descarte.length}`));
    desc.setAttribute('aria-label', `Ver el descarte (${yo.descarte.length} cartas)`);
    desc.onclick = () => verDescarte(j);
    pilas.append(mazo, desc);

    // Activo al centro; a su izquierda la placa y la reserva; a su derecha las acciones y las pilas.
    const izq = h('div', 'ala ala-izq');
    izq.append(marcador, reserva);
    const der = h('div', 'ala ala-der');
    der.append(acciones, pilas);
    campo.append(izq, zonaActivo, der);
    s.appendChild(campo);

    // Mano + controles
    const fila = h('div', 'fila-mano');
    const mano = h('div', 'mano');
    const mostrar = humano && esMiTurno;
    for (const c of yo.mano) {
      if (mostrar) {
        const el = renderCarta(c.carta, { tamano: 'mini' });
        el.dataset.mano = c.uid;
        const usable = jugadasValidas(estado).some(v => v.uid === c.uid);
        if (usable) el.classList.add('usable');
        el.onclick = () => tocarEnMano(j, c);
        mano.appendChild(el);
      } else mano.appendChild(h('div', 'carta carta-mini dorso', DORSO));
    }
    if (!mostrar) mano.classList.add('oculta');
    mano.style.setProperty('--n', yo.mano.length);
    [...mano.children].forEach((el, i) => el.style.setProperty('--i', i - (yo.mano.length - 1) / 2));
    fila.appendChild(mano);

    const controles = h('div', 'controles');
    if (humano && config.cronista) controles.appendChild(botonCronista(j));
    if (esMiTurno && humano && historial.length && ['turno', 'preparacion'].includes(estado.fase)) {
      const d = h('button', 'boton-secundario boton-deshacer', 'Deshacer');
      d.onclick = deshacer;
      controles.appendChild(d);
    }
    if (esMiTurno && humano) {
      const validas = jugadasValidas(estado);
      if (estado.fase === 'turno' && yo.saberPendiente > 0) controles.appendChild(h('div', 'pista pista-saber', `<span class="pip"></span> Ganaste 1 de Saber este turno: toca un Protagonista para dárselo`));
      if (estado.fase === 'preparacion') {
        const listo = validas.find(v => v.tipo === 'listo');
        const b = h('button', 'boton-principal', 'Listo');
        b.disabled = !listo;
        b.onclick = () => jugar({ tipo: 'listo' });
        controles.appendChild(b);
        if (!listo) controles.appendChild(h('div', 'pista', 'Toca un Protagonista de tu mano'));
        else if (!yo.reserva.length) controles.appendChild(h('div', 'pista suave', 'Consejo: pon Protagonistas en la reserva. Si tu activo cae y no tienes reserva, pierdes.'));
      } else if (estado.fase === 'turno') {
        const b = h('button', 'boton-secundario boton-pasar', 'Pasar turno');
        b.onclick = () => jugar({ tipo: 'pasar' });
        controles.appendChild(b);
      } else if (estado.fase === 'promover') {
        controles.appendChild(h('div', 'pista', 'Toca un Protagonista de tu reserva'));
      }
    }
    fila.appendChild(controles);
    s.appendChild(fila);
    return s;
  }

  function entrenador() {
    const e = estado, yo = e.jugadores.A;
    let t = '';
    if (e.fase === 'preparacion' && e.turno === 'A') t = !yo.activo
      ? 'Toca un Protagonista de tu mano y colócalo como <b>activo</b>: es quien combate.'
      : 'Puedes poner hasta 3 Protagonistas en la <b>reserva</b>. Cuando quieras, toca <b>Listo</b>.';
    else if (e.turno === 'A' && e.fase === 'turno') {
      const v = jugadasValidas(e);
      if (yo.saberPendiente > 0) t = 'Cada turno recibes 1 de <b>Saber</b>. Toca tu activo y dale Saber: las acciones lo necesitan.';
      else if (v.some(x => x.tipo === 'accion')) t = 'Ya tienes Saber suficiente. Usa una <b>acción</b> (botones junto a tu activo). Al usarla, termina tu turno.';
      else if (e.numeroTurno === 1) t = 'En el primer turno de la partida no se puede atacar. Baja cartas o toca <b>Pasar turno</b>.';
      else if (v.some(x => x.tipo === 'evolucionar')) t = '¡Puedes <b>evolucionar</b>! Una Etapa 2 muestra cómo cambia algo en la historia.';
      else t = 'Juega cartas de tu mano (las que brillan se pueden usar) o toca <b>Pasar turno</b>.';
      if (e.numeroTurno >= 7) t = '¡Ya sabes jugar! Gana quien consigue 3 <b>Hitos</b> (derrotar Protagonistas). Sigue o vuelve al menú.';
    } else if (e.fase === 'promover' && e.turno === 'A') t = 'Tu activo cayó. Elige quién de tu reserva pasa al frente.';
    else if (e.turno === 'B') t = 'Ahora juega la tablet…';
    // En el tutorial, La Cronista dice el paso a paso (salvo que se le haya pedido una pista).
    const clave = (CLAVES_TUTORIAL.find(([inicio]) => t.startsWith(inicio)) || [])[1];
    if (!globo || globo.tutorial) {
      globo = { j: 'A', expresion: 'explica', texto: t, tutorial: true, clave };
      if (clave && clave !== ultimoPasoTutorial) { ultimoPasoTutorial = clave; voz(clave); }
    }
  }

  // Frases del tutorial y su grabación de La Cronista.
  const CLAVES_TUTORIAL = [['Toca un Protagonista de tu mano', 'tut-activo'], ['Puedes poner hasta 3', 'tut-reserva'], ['Cada turno recibes', 'tut-saber'],
    ['Ya tienes Saber suficiente', 'tut-accion'], ['En el primer turno', 'tut-primer-turno'], ['¡Puedes <b>evolucionar', 'tut-evolucion'],
    ['Juega cartas de tu mano', 'tut-jugar'], ['¡Ya sabes jugar', 'tut-fin'], ['Tu activo cayó', 'tut-promover'], ['Ahora juega la tablet', 'tut-rival']];
  let ultimoPasoTutorial = null;

  // ---------- La Cronista (guía) ----------
  const vistasGuia = new Set();   // lo que ya explicó en esta partida, por jugador
  let globo = null;               // { j, expresion, texto, jugada?, auto?, tutorial? }
  let temporizadorGlobo = null;
  const humanoEs = j => !(contraIA && j === 'B');

  // Si La Cronista tiene grabada esa frase y el sonido está activo, la dice en voz alta.
  function voz(clave) {
    const ruta = rutaCronista(clave);
    if (ruta && sonidoActivo()) reproducir(ruta);
  }

  function hablar(j, dicho, { auto = false } = {}) {
    clearTimeout(temporizadorGlobo);
    globo = { j, ...dicho, auto };
    voz(globo.audio || globo.clave);
    if (auto) temporizadorGlobo = setTimeout(() => { if (globo && globo.auto) { globo = null; dibujarGlobo(); } }, 11000);
    dibujarGlobo();
  }

  function guiaProactiva() {
    if (!config.cronista || config.modo === 'tutorial' || ocupado || (globo && !globo.tutorial)) return;
    const j = estado.turno;
    if (!humanoEs(j)) return;
    const s = situacion(estado, j);
    if (!s || vistasGuia.has(`${j}:${s.clave}`)) return;
    vistasGuia.add(`${j}:${s.clave}`);
    hablar(j, s, { auto: true });
  }

  function guiaDeEvento(ev) {
    if (!config.cronista || config.modo === 'tutorial') return;
    for (const j of ['A', 'B'].filter(humanoEs)) {
      const s = situacionDeEvento(ev, j);
      if (s && !vistasGuia.has(`${j}:${s.clave}`)) { vistasGuia.add(`${j}:${s.clave}`); hablar(j, s, { auto: true }); }
    }
  }

  function pedirPista(j) {
    if (globo && globo.j === j && globo.esPista) { globo = null; dibujarGlobo(); return; }   // segundo toque: cierra
    const p = pista(estado, j);
    const audioPista = estado.turno !== j ? 'pista-rival' : estado.jugadores[j].porUbicar ? 'pista-ubicar' : 'pista';
    hablar(j, { ...p, esPista: true, audio: audioPista });
  }

  // Elemento de la mesa que corresponde a la jugada sugerida, para resaltarlo.
  function objetivoDe(jd) {
    if (!jd) return [];
    const L = `.lado-${estado.turno}`;
    const q = sel => [...raiz.querySelectorAll(sel)];
    switch (jd.tipo) {
      case 'asignarSaber': return q(`${L} .campo [data-uid="${CSS.escape(jd.destino)}"]`);
      case 'accion': return q(`${L} .boton-accion`).slice(jd.indice, jd.indice + 1);
      case 'colocar': case 'bajar': case 'evolucionar': case 'jugar': return q(`${L} .mano [data-mano="${CSS.escape(jd.uid)}"]`);
      case 'retirar': return q(`${L} .campo [data-uid="${CSS.escape(jd.reemplazo)}"]`);
      case 'promover': return q(`${L} .campo [data-uid="${CSS.escape(jd.uid)}"]`);
      case 'listo': return q(`${L} .controles .boton-principal`);
      case 'pasar': return q(`${L} .controles .boton-pasar`);
      default: return [];
    }
  }

  function dibujarGlobo() {
    raiz.querySelectorAll('.globo-cronista').forEach(g => g.remove());
    raiz.querySelectorAll('.sugerida').forEach(g => g.classList.remove('sugerida'));
    if (!globo || (!config.cronista && !globo.tutorial)) return;
    const g = h('div', `globo-cronista lado-globo-${globo.j}${girado(globo.j) ? ' girado' : ''}${globo.tutorial ? ' entrenador' : ''}`);
    const cara = ['explica', 'pista', 'celebra', 'atenta'].includes(globo.expresion) ? globo.expresion : 'explica';
    // globo.texto viene de guia.js (nombres ya escapados con esc) o del paso a paso del tutorial (texto fijo).
    g.innerHTML = '<img class="retrato" src="img/cronista/' + cara + '.jpg" alt="La Cronista"><div class="dice"><b class="quien">La Cronista</b><p>' + globo.texto + '</p></div>';
    const dice = g.querySelector('.dice');
    const acciones = h('div', 'acciones-globo');
    acciones.appendChild(botonEscuchar(() => globo ? globo.texto.replace(/<[^>]+>/g, '') : '', 'boton-mini', () => globo && rutaCronista(globo.audio || globo.clave)));
    if (!globo.tutorial) {
      const ok = h('button', 'boton-mini', 'Entendido');
      ok.onclick = ev => { ev.stopPropagation(); globo = null; dibujarGlobo(); };
      acciones.appendChild(ok);
    }
    dice.appendChild(acciones);
    raiz.appendChild(g);
    if (globo.jugada && estado.turno === globo.j) objetivoDe(globo.jugada).forEach(el => el.classList.add('sugerida'));
  }

  function botonCronista(j) {
    const b = h('button', 'boton-cronista', '<img src="img/cronista/cara.jpg" alt=""><span>Pista</span>');
    b.setAttribute('aria-label', 'Pedir una pista a La Cronista');
    b.onclick = () => pedirPista(j);
    return b;
  }

  // ---------- Toques ----------
  function tocarEnMano(j, entrada) {
    const validas = jugadasValidas(estado).filter(v => v.uid === entrada.uid);
    const b = busquedaDe(entrada.carta.efecto);
    if (b && validas.some(v => v.tipo === 'jugar')) {
      // Una búsqueda: primero se muestran las cartas y se elige.
      return verCarta(entrada.carta, j, [{ texto: 'Jugar esta carta', alElegir: () => elegirBusqueda(j, entrada, b) }]);
    }
    verCarta(entrada.carta, j, validas.map(v => ({ jugada: v, texto: textoJugada(v, j) })));
  }

  function elegirBusqueda(j, entrada, { n, cartaTipo }) {
    const QUE = { protagonista: 'el Protagonista', lugar: 'el Lugar', acontecimiento: 'el Acontecimiento', cualquiera: 'la carta' };
    const tope = estado.jugadores[j].mazo.slice(0, n);
    const validas = jugadasValidas(estado).filter(v => v.tipo === 'jugar' && v.uid === entrada.uid);
    const capa = h('div', `capa${girado(j) ? ' girado' : ''}`);
    const panel = h('div', 'panel-carta panel-elegir');
    const hayProt = validas.some(v => v.eleccion);
    panel.appendChild(h('div', 'titulo-sabias', `${esc(entrada.carta.nombre)}: las ${tope.length} primeras cartas de tu mazo`));
    panel.appendChild(h('p', 'nota', hayProt ? `Toca ${QUE[cartaTipo]} que quieres llevar a tu mano. Las demás van al fondo del mazo.` : 'No hay ninguna carta de ese tipo entre estas. Vuelven al fondo del mazo.'));
    const fila = h('div', 'elegir-cartas');
    let elegida = null;
    const confirmar = h('button', 'boton-principal', hayProt ? 'Elige una carta' : 'Seguir');
    confirmar.disabled = hayProt;
    for (const c of tope) {
      const el = renderCarta(c.carta, { tamano: 'mini', unidades: unidadesCarta(c.carta) });
      el.style.setProperty('--ch', 'min(34vh, 190px)');
      const jugada = validas.find(v => v.eleccion === c.uid);
      if (!jugada) el.classList.add('no-elegible');
      else el.onclick = () => {
        elegida = jugada;
        fila.querySelectorAll('.elegida-ahora').forEach(x => x.classList.remove('elegida-ahora'));
        el.classList.add('elegida-ahora');
        confirmar.disabled = false;
        confirmar.textContent = 'Tomar ' + c.carta.nombre;   // textContent: no interpreta HTML
      };
      fila.appendChild(el);
    }
    panel.appendChild(fila);
    const botones = h('div', 'botones');
    confirmar.onclick = () => { capa.remove(); jugar(hayProt ? elegida : validas[0]); };
    botones.appendChild(confirmar);
    const cancelar = h('button', 'boton-secundario', 'Cancelar');
    cancelar.onclick = () => capa.remove();
    botones.appendChild(cancelar);
    panel.appendChild(botones);
    capa.appendChild(panel);
    raiz.appendChild(capa);
  }

  function tocarEnMesa(j, inst) {
    const humano = !(contraIA && j === 'B');
    const mio = estado.turno === j && humano;
    const opciones = mio ? jugadasValidas(estado).filter(v =>
      (v.tipo === 'asignarSaber' && v.destino === inst.uid) ||
      (v.tipo === 'retirar' && v.reemplazo === inst.uid) ||
      (v.tipo === 'promover' && v.uid === inst.uid) ||
      (v.tipo === 'accion' && estado.jugadores[j].activo?.uid === inst.uid)
    ).map(v => ({ jugada: v, texto: textoJugada(v, j) })) : [];
    verCarta(inst.carta, estado.turno, opciones, inst);
  }

  function textoJugada(v, j) {
    const yo = estado.jugadores[j];
    switch (v.tipo) {
      case 'colocar': return yo.activo ? 'Colocar en la reserva' : 'Colocar como activo';
      case 'bajar': return 'Bajar a la reserva';
      case 'jugar': {
        const r = v.eleccion && yo.reserva.find(x => x.uid === v.eleccion);
        return r ? `Cambiar tu activo por ${esc(r.carta.nombre)}` : 'Jugar esta carta';
      }
      case 'evolucionar': {
        const obj = [yo.activo, ...yo.reserva].find(p => p && p.uid === v.objetivo);
        return `Evolucionar ${obj ? esc(obj.carta.nombre) : ''}`;
      }
      case 'asignarSaber': return 'Darle 1 de Saber';
      case 'retirar': {
        const gratis = estado.tablero && estado.tablero.regla && estado.tablero.regla.tipo === 'retiroGratis';
        return `Cambiar por el activo (cuesta ${gratis ? 0 : (yo.activo.carta.retirada ?? 1)} Saber)`;
      }
      case 'promover': return 'Pasar al frente como activo';
      case 'accion': { const a = yo.activo.carta.acciones[v.indice]; return `${esc(a.nombre)} · ${esc(a.danio)} de daño`; }
      default: return v.tipo;
    }
  }

  function verCarta(carta, orientadoA, opciones = [], instancia = null) {
    const capa = h('div', `capa${girado(orientadoA) ? ' girado' : ''}`);
    const panel = h('div', 'panel-carta');
    panel.appendChild(renderCarta(carta, { tamano: 'grande', instancia, unidades: unidadesCarta(carta) }));
    const botones = h('div', 'botones');
    for (const o of opciones) {
      const b = h('button', 'boton-principal', o.texto);   // textoJugada ya escapa los nombres
      b.onclick = () => { capa.remove(); if (o.alElegir) o.alElegir(); else jugar(o.jugada); };
      botones.appendChild(b);
    }
    botones.appendChild(botonEscucharCarta(carta, () => textoParaLeer(carta), () => textoReglas(carta)));
    const cerrar = h('button', 'boton-secundario', opciones.length ? 'Cancelar' : 'Cerrar');
    cerrar.onclick = () => { detener(); capa.remove(); };
    botones.appendChild(cerrar);
    panel.appendChild(botones);
    capa.appendChild(panel);
    capa.onclick = ev => { if (ev.target === capa) capa.remove(); };
    raiz.appendChild(capa);
  }

  // ---------- Jugadas y eventos ----------
  async function jugar(jugada) {
    if (!vivo || estado.fase === 'fin') return;
    let r;
    const antes = estado;
    try { r = aplicarJugada(estado, jugada); } catch { render(); return; }
    estado = r.estado;
    if (humanoEs(antes.turno) && jugadaReversible(antes, estado, jugada)) historial.push(antes);
    else historial = [];
    if (globo && !globo.tutorial) globo = null;
    guardar();
    render();
    await mostrarEventos(r.eventos);
    if (estado.fase === 'fin') pantallaFinal();
  }

  // Deshacer: vuelve al estado anterior a la última jugada reversible del turno.
  function deshacer() {
    if (ocupado || !historial.length) return;
    estado = historial.pop();
    globo = null;
    guardar();
    render();
    registrar('Se deshizo la última jugada.');
  }

  function registrar(texto) {
    const reg = raiz.querySelector('.registro');
    if (reg) { reg.innerHTML = texto; reg.classList.remove('nuevo'); void reg.offsetWidth; reg.classList.add('nuevo'); }
  }

  async function mostrarEventos(eventos) {
    ocupado = true;
    for (const ev of eventos) {
      if (['colocar', 'bajar', 'lugar', 'efecto', 'evolucion', 'retirar', 'promover'].includes(ev.tipo)) sonidos.jugar();
      if (ev.tipo === 'turno' && estado.fase === 'turno') { sonidos.turno(); if (ev.robo) sonidos.robar(); anunciarTurno(ev.jugador); }
      if (ev.tipo === 'ventaja') { sonidos.ventaja(); registrar(`<b>¡Ventaja ×2!</b> ${FRASES_VENTAJA[ev.de]}`); }
      if (ev.tipo === 'protegido') sonidos.protegido();
      guiaDeEvento(ev);
      if (ev.tipo === 'hito') sonidos.hito();
      if (ev.tipo === 'saber') {
        const yo = estado.jugadores[ev.jugador];
        const p = [yo.activo, ...yo.reserva].find(x => x && x.uid === ev.destino);
        if (p) registrar(`${esc(p.carta.nombre)} recibe 1 de Saber (ahora tiene ${esc(p.saber)})`);
      }
      if (ev.tipo === 'linea') registrar(`<b>${esc(ev.hecho.nombre)}</b> (${esc(ev.hecho.texto)}) entra a la línea de tiempo de ${nombres[ev.jugador]}`);
      if (ev.tipo === 'ubicar') {
        if (ev.correcto) sonidos.conexion();
        if (!(contraIA && ev.jugador === 'B')) avisoLinea(ev);
        registrar(`${nombres[ev.jugador]} ubicó <b>${esc(ev.hecho.nombre)}</b> (${esc(ev.hecho.texto)}): ${ev.correcto ? '¡bien ubicada! +1 Saber' : 'quedó en su lugar correcto'}`);
      }
      if (ev.tipo === 'conexion') { sonidos.conexion(); avisoConexion(ev); registrar(`¡Conexión histórica! <b>${esc(ev.causa.nombre)}</b> → <b>${esc(ev.efecto.nombre)}</b>: +1 Saber`); }
      if (ev.tipo === 'danio') {
        sonidos.ataque();
        embestida(ev.jugador);
        destello(ev.jugador === 'A' ? 'B' : 'A', ev.valor);
        if (!eventos.some(e => e.tipo === 'ventaja')) registrar(`${esc(ev.carta.nombre)} usa <b>${esc(ev.accion)}</b>: ${ev.valor} de daño`);
      }
      if (ev.tipo === 'protegido') registrar(`<b>${esc(ev.carta.nombre)}</b> estaba protegido: no recibe daño`);
      if (ev.tipo === 'evolucion') registrar(`<b>${esc(ev.de.nombre)}</b> evoluciona en <b>${esc(ev.a.nombre)}</b>`);
      if (ev.tipo === 'efecto' && !eventos.some(x => x.tipo === 'revelar' || x.tipo === 'conexion')) registrar(`${nombres[ev.jugador]}: <b>${esc(ev.carta.nombre)}</b>`);
      if (ev.tipo === 'lugar') registrar(`Nuevo lugar: <b>${esc(ev.carta.nombre)}</b>`);
      if (ev.tipo === 'revelar') registrar(`${nombres[ev.jugador]}: se miraron ${ev.cartas.length} cartas del mazo${ev.tomada ? ` y se tomó <b>${esc(ev.tomada.nombre)}</b>` : ', sin Protagonistas'}`);
      if (ev.tipo === 'caida') {
        caidas.push(ev.carta);
        sonidos.caida();
        await archivar(ev.carta, ev.jugador);
        if (config.sabias) await sabiasQue(ev.carta, ev.jugador === 'A' ? 'B' : 'A');
      }
    }
    ocupado = false;
    programarIA();
  }

  const esperar = ms => new Promise(r => setTimeout(r, ms));
  const sinMovimiento = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function embestida(atacante) {
    const a = raiz.querySelector(`.lado-${atacante} .zona-activo .carta`);
    const d = raiz.querySelector(`.lado-${atacante === 'A' ? 'B' : 'A'} .zona-activo .carta`);
    if (a) { a.classList.remove('embiste'); void a.offsetWidth; a.classList.add('embiste'); }
    if (d) { d.classList.remove('golpeado'); void d.offsetWidth; d.classList.add('golpeado'); }
  }

  // La carta derrotada se vuelve sepia y queda "archivada" un momento.
  async function archivar(carta, duenio) {
    const zona = raiz.querySelector(`.lado-${duenio} .zona-activo`);
    if (!zona || sinMovimiento()) return;
    const fantasma = renderCarta(carta, { tamano: 'mini' });
    fantasma.classList.add('archivada');
    fantasma.appendChild(h('div', 'sello-archivo', 'Archivada'));
    zona.appendChild(fantasma);
    await esperar(900);
    fantasma.remove();
  }

  // ---------- Descarte ----------
  function verDescarte(j) {
    const yo = estado.jugadores[j];
    const capa = h('div', `capa capa-descarte${girado(j) ? ' girado' : ''}`);
    const panel = h('div', 'panel-descarte');
    panel.appendChild(h('div', 'titulo-linea', `Descarte de ${nombres[j]} · ${yo.descarte.length}`));
    const grilla = h('div', 'grilla-descarte');
    if (!yo.descarte.length) grilla.appendChild(h('p', 'nota', 'Todavía vacío. Aquí quedan las cartas jugadas y los Protagonistas derrotados: sirven para las Conexiones.'));
    for (const c of [...yo.descarte].reverse()) {
      const el = renderCarta(c.carta, { tamano: 'mini' });
      el.onclick = () => verCarta(c.carta, j);
      grilla.appendChild(el);
    }
    panel.appendChild(grilla);
    const cerrar = h('button', 'boton-secundario', 'Cerrar');
    cerrar.onclick = () => capa.remove();
    panel.appendChild(cerrar);
    capa.appendChild(panel);
    capa.onclick = ev => { if (ev.target === capa) capa.remove(); };
    raiz.appendChild(capa);
  }

  // ---------- Línea de tiempo ----------
  function revisarUbicar() {
    const j = estado.turno, yo = estado.jugadores[j];
    if (ocupado || estado.fase !== 'turno' || !yo.porUbicar || (contraIA && j === 'B') || raiz.querySelector('.capa-linea')) return;
    const capa = h('div', `capa capa-linea${girado(j) ? ' girado' : ''}`);
    const panel = h('div', 'panel-linea');
    panel.appendChild(h('div', 'titulo-linea', '<span class="reloj"></span> Línea de tiempo'));
    panel.appendChild(h('p', 'pregunta-linea', `¿Dónde va <b>${esc(yo.porUbicar.nombre)}</b>? Toca el hueco correcto. Si aciertas, tu activo gana +1 de Saber.`));
    const fila = h('div', 'linea-huecos');
    const hueco = i => {
      const b = h('button', 'hueco-linea', 'Aquí');
      b.onclick = () => { capa.remove(); jugar({ tipo: 'ubicar', posicion: i }); };
      return b;
    };
    yo.linea.forEach((x, i) => {
      fila.appendChild(hueco(i));
      fila.appendChild(h('div', 'hito-linea', `<b>${esc(x.texto)}</b><span>${esc(x.nombre)}</span>`));
    });
    fila.appendChild(hueco(yo.linea.length));
    panel.appendChild(fila);
    panel.appendChild(h('p', 'nota', 'Más antiguo a la izquierda, más reciente a la derecha.'));
    capa.appendChild(panel);
    raiz.appendChild(capa);
  }

  function verLinea(j) {
    const yo = estado.jugadores[j];
    const capa = h('div', `capa capa-linea${girado(j) ? ' girado' : ''}`);
    const panel = h('div', 'panel-linea');
    panel.appendChild(h('div', 'titulo-linea', `<span class="reloj"></span> Línea de tiempo de ${nombres[j]}`));
    const fila = h('div', 'linea-huecos');
    if (!(yo.linea || []).length) fila.appendChild(h('p', 'nota', 'Todavía vacía. Los Personajes y Acontecimientos con fecha entran aquí al jugarlos.'));
    for (const x of yo.linea || []) fila.appendChild(h('div', 'hito-linea', `<b>${esc(x.texto)}</b><span>${esc(x.nombre)}</span>`));
    panel.appendChild(fila);
    panel.appendChild(h('p', 'nota', `Aciertos: ${yo.aciertos || 0}`));
    const cerrar = h('button', 'boton-secundario', 'Cerrar');
    cerrar.onclick = () => capa.remove();
    panel.appendChild(cerrar);
    capa.appendChild(panel);
    capa.onclick = ev => { if (ev.target === capa) capa.remove(); };
    raiz.appendChild(capa);
  }

  function avisoLinea(ev) {
    const yo = estado.jugadores[ev.jugador];
    const antes = yo.linea[ev.posicionCorrecta - 1], despues = yo.linea[ev.posicionCorrecta + 1];
    const donde = antes && despues ? `Va entre ${esc(antes.nombre)} y ${esc(despues.nombre)}.`
      : antes ? `Va después de ${esc(antes.nombre)}.` : despues ? `Va antes de ${esc(despues.nombre)}.` : '';
    const a = h('div', `aviso-conexion aviso-linea${ev.correcto ? '' : ' casi'}${girado(ev.jugador) ? ' girado' : ''}`,
      `<div class="titulo">${ev.correcto ? '¡Bien ubicada!' : 'Casi…'}</div><div class="cadena">${esc(ev.hecho.nombre)}<span>·</span>${esc(ev.hecho.texto)}</div>` +
      (ev.correcto ? '<div class="premio">+1 Saber para tu activo</div>' : `<p>${donde}</p>`));
    raiz.appendChild(a);
    setTimeout(() => a.remove(), 2700);
  }

  function avisoConexion(ev) {
    const a = h('div', `aviso-conexion${girado(ev.jugador) ? ' girado' : ''}`,
      `<div class="titulo">¡Conexión histórica!</div><div class="cadena">${esc(ev.causa.nombre)}<span>→</span>${esc(ev.efecto.nombre)}</div>` +
      `<p>${esc(ev.texto)}</p><div class="premio">+1 Saber para tu activo</div>`);
    raiz.appendChild(a);
    setTimeout(() => a.remove(), 2700);
  }

  function anunciarTurno(j) {
    if (sinMovimiento()) return;
    const texto = contraIA ? (j === 'A' ? 'Tu turno' : 'Turno de la Tablet') : `Turno de ${nombres[j]}`;   // nombres ya escapados
    const extra = estado.jugadores[j].saberPendiente > 0 ? '<small><span class="pip"></span> +1 de Saber para repartir</small>' : '';
    const b = h('div', `banner-turno${girado(j) ? ' girado' : ''}`, texto + extra);
    raiz.appendChild(b);
    setTimeout(() => b.remove(), 1100);
  }

  function destello(jugadorObjetivo, valor) {
    const zona = raiz.querySelector(`.lado-${jugadorObjetivo} .zona-activo`);
    if (!zona) return;
    const n = h('div', 'numero-danio', valor ? `−${valor}` : '0');
    zona.appendChild(n);
    setTimeout(() => n.remove(), 1200);
  }

  function dobleCara(contenido) {
    // En cara a cara el aviso se muestra dos veces, una hacia cada jugador.
    const capa = h('div', 'capa aviso');
    const caja = h('div', 'aviso-doble');
    if (config.modo === 'caraacara') {
      const arriba = h('div', 'panel-aviso girado'); arriba.appendChild(contenido.cloneNode(true));
      caja.appendChild(arriba);
    }
    const abajo = h('div', 'panel-aviso'); abajo.appendChild(contenido);
    caja.appendChild(abajo);
    capa.appendChild(caja);
    return capa;
  }

  function sabiasQue(carta, ganador) {
    return new Promise(resolve => {
      const c = h('div', 'sabias');
      c.innerHTML = `<div class="titulo-sabias">¿Sabías que…?</div>`;
      const fila = h('div', 'sabias-fila');
      fila.appendChild(renderCarta(carta, { tamano: 'mini' }));
      fila.appendChild(h('div', 'sabias-texto', `<b>${esc(carta.nombre)}</b><p>${esc(carta.dato)}</p><small>${nombres[ganador]} gana un Hito</small>`));
      c.appendChild(fila);
      const b = h('button', 'boton-principal', 'Seguir');
      c.appendChild(b);
      const capa = dobleCara(c);
      const texto = '¿Sabías que? ' + carta.nombre + '. ' + carta.dato;   // texto plano para la voz
      capa.querySelectorAll('.boton-principal').forEach(x => {
        x.parentNode.insertBefore(botonEscuchar(() => texto), x);
        x.onclick = () => { detener(); capa.remove(); resolve(); };
      });
      raiz.appendChild(capa);
      if (config.leerSabias) leer(texto);
    });
  }

  function pantallaFinal() {
    const g = estado.ganador;
    sonidos.victoria();
    const c = h('div', 'final');
    registrarAlbum();
    const lineas = estado.lineaTiempo ? ['A', 'B'].filter(j => (estado.jugadores[j].linea || []).length).map(j => {
      const yo = estado.jugadores[j];
      return `<div class="linea-final"><b>${nombres[j]}</b> · ${yo.aciertos || 0} acierto${yo.aciertos === 1 ? '' : 's'}<div class="linea-huecos">${yo.linea.map(x => `<div class="hito-linea"><b>${esc(x.texto)}</b><span>${esc(x.nombre)}</span></div>`).join('')}</div></div>`;
    }).join('') : '';
    const insignias = insigniasPartida.map(i => `<div class="insignia-nueva"><span class="medalla"></span> ¡Nueva insignia! ${esc(i.curso)}° · ${esc(i.nombre)}</div>`).join('');
    c.innerHTML = `<div class="titulo-final">¡Gana ${nombres[g]}!</div>
      <p>${razonFinal(g)}</p>
      ${insignias}
      ${nuevasPartida.size ? `<p class="album-final">Descubriste ${nuevasPartida.size} carta${nuevasPartida.size === 1 ? '' : 's'} nueva${nuevasPartida.size === 1 ? '' : 's'} para el álbum.</p>` : ''}
      ${lineas ? `<div class="aprendido"><b>Líneas de tiempo</b>${lineas}</div>` : ''}
      ${caidas.length ? `<div class="aprendido"><b>Lo que apareció en esta partida</b><ul>${caidas.slice(-4).map(k => `<li><b>${esc(k.nombre)}:</b> ${esc(k.dato)}</li>`).join('')}</ul></div>` : ''}`;
    if (config.torneo) {
      try {
        const t = almacen.leer(CLAVES.torneo, null);
        if (t) almacen.guardar(CLAVES.torneo, anotarGanador(t, config.torneo.partida, config.nombres[g]));
      } catch { /* la partida ya estaba anotada */ }
    }
    const botones = h('div', 'botones');
    const otra = h('button', 'boton-principal', config.torneo ? 'Volver al torneo' : 'Otra partida');
    const menu = h('button', 'boton-secundario', 'Menú');
    botones.append(otra, menu);
    c.appendChild(botones);
    const capa = dobleCara(c);
    capa.querySelectorAll('.boton-principal').forEach(b => { b.onclick = () => { if (config.torneo) { location.hash = '#torneo'; return; } capa.remove(); reiniciar(); }; });
    capa.querySelectorAll('.boton-secundario').forEach(b => { b.onclick = () => { location.hash = '#inicio'; }; });
    raiz.appendChild(capa);
  }

  function razonFinal(g) {
    const n = estado.jugadores[g].hitos;
    const perdedor = g === 'A' ? 'B' : 'A';
    if (n >= estado.hitosParaGanar) return `Consiguió ${n} Hito${n === 1 ? '' : 's'}.`;
    const quien = contraIA && perdedor === 'A' ? 'Te quedaste' : `${nombres[perdedor]} se quedó`;
    return `${quien} sin Protagonistas en la mesa (${n} Hito${n === 1 ? '' : 's'} conseguido${n === 1 ? '' : 's'}).`;
  }

  async function reiniciar() {
    destruir();
    const nueva = await montarMesa(contenedor, { ...opciones, estado: null, semilla: config.modo === 'tutorial' ? opciones.semilla : undefined });
    api.destruir = nueva.destruir;
  }

  // ---------- Rival automático ----------
  function programarIA() {
    if (!contraIA || ocupado || !vivo || estado.fase === 'fin' || estado.turno !== 'B' || temporizador) return;
    temporizador = setTimeout(async () => {
      temporizador = null;
      if (!vivo || ocupado || estado.turno !== 'B' || estado.fase === 'fin') return;
      const j = elegirJugada(estado, 'B', { nivel: config.nivel });
      if (j) await jugar(j);
    }, 700);
  }

  function destruir() {
    vivo = false;
    clearTimeout(temporizador);
  }

  const api = { destruir, get estado() { return estado; } };
  render();
  return api;
}
