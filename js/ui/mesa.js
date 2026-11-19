// Mesa de juego: cara a cara en la misma tablet, contra la tablet o tutorial.
// Solo dibuja y traduce toques en jugadas; las reglas viven en motor.js.
import { crearPartida, jugadasValidas, aplicarJugada, busquedaDe, danioDeAccion, desgloseDanio, jugadaReversible, VENTAJA } from '../motor.js';
import { situacion, situacionDeEvento, pista } from './guia.js';
import { elegirJugada } from '../ia.js';
import { armarMazo, mazoDeBando } from '../mazos.js';
import { crearAlbum, cartasVisibles } from '../album.js';
import { anotarGanador } from '../torneo.js';
import { cargarCursoCompleto, cargarColeccionCompleta } from './datos.js';
import { crearRng } from '../rng.js';
import { almacen, CLAVES } from '../almacen.js';
import { renderCarta, textoParaLeer, imagenCarta, escenarioCarta, textoEfecto } from './carta.js';
import { botonEscuchar, botonEscucharCarta, leer, detener, reproducir, rutaCronista, rutaNarrador, hablarPersonaje } from './voz.js';
import { esc, pips } from '../html.js';
import { sonidos, sonidoActivo, alternarSonido } from './sonido.js';
import { ambiente, rutaAmbiente, ambientesListos } from './ambiente.js';
import { FUERZAS, coleccion } from '../colecciones.js';
import { hacerArrastrable, ultimaSoltada } from './arrastre.js';
import { volar, impacto, deshacerEnArena, relojSobre, granoHacia } from './efectos.js';
import { arenaDelTiempo } from './viaje.js';
import { planDeEscena, escenaAtaque, escenaInvocacion } from './director.js';
import { dorsoDeMazo, cargarDorsos } from './dorsos.js';
import { textoAnio, direccionViaje, anioEnViaje, epocaDe, cargarEpocas } from './tiempo.js';

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
  ...Object.fromEntries(Object.entries(FUERZAS).map(([k, f]) => [k, f.frase])),
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
    coleccion: opciones.coleccion || null,   // expansión (js/colecciones.js); null en los cursos
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
  // Expansión: un solo mazo para los dos jugadores, sin tableros ni línea de tiempo (sus cartas no tienen fecha).
  const colec = config.coleccion ? coleccion(config.coleccion) : null;
  if (colec) { config.linea = false; config.reforzar = false; config.tablero = null; }
  const datosCol = colec ? await cargarColeccionCompleta(colec.id) : null;
  const duelo = config.duelo ? (colec ? datosCol.duelos : await cargarDuelos()).find(d => d.id === config.duelo) || null : null;
  if (duelo && !colec) { config.cursoA = duelo.curso; config.cursoB = duelo.curso; config.tablero = duelo.tablero; }
  const bandoDe = duelo ? (() => {
    const a = duelo.bandos.find(b => b.id === config.bandoA) || duelo.bandos[0];
    return { A: a, B: duelo.bandos.find(b => b !== a) };
  })() : null;
  const [datosA, datosB, tableros, epocas, dorsos] = await Promise.all([colec ? datosCol : cargarCursoCompleto(config.cursoA), colec ? datosCol : cargarCursoCompleto(config.cursoB), cargarTableros(), cargarEpocas(), cargarDorsos(), ambientesListos]);
  const unidadesDe = { [config.cursoA]: datosA.unidades, [config.cursoB]: datosB.unidades };

  let estado = opciones.estado;
  if (!estado) {
    const rng = crearRng(config.semilla);
    // Tablero: el elegido o uno al azar del curso.
    const delCurso = colec ? [] : tableros.filter(t => t.curso === config.cursoA);
    let tablero = colec ? null : tableros.find(t => t.id === config.tablero);
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
  // Dorso de cada mazo: el del bando en un Duelo, o el de la temática que domina sus cartas.
  const dorsoHtml = {};
  for (const j of ['A', 'B']) {
    const yo = estado.jugadores[j];
    const todas = [...yo.mano, ...yo.mazo, ...yo.descarte, ...(yo.activo ? [yo.activo] : []), ...yo.reserva].map(x => x.carta);
    const ruta = dorsoDeMazo(dorsos, todas, bandoDe ? bandoDe[j].id : null, colec ? colec.dorso : undefined);
    dorsoHtml[j] = ruta ? `<img class="dorso-img" src="${esc(ruta)}" alt="" draggable="false">` : DORSO;
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

  // Con mouse, pasar el cursor por una carta de la mano muestra una vista previa grande encima.
  let previa = null;
  const quitarPrevia = () => { if (previa) { previa.remove(); previa = null; } };
  function vistaPrevia(ev) {
    if (ev.pointerType !== 'mouse' || document.body.classList.contains('arrastrando')) return quitarPrevia();
    const el = ev.target.closest && ev.target.closest('.mano [data-mano]');
    if (!el) return quitarPrevia();
    const j = el.closest('.lado-A') ? 'A' : 'B';
    if (!humanoEs(j) || girado(j)) return quitarPrevia();
    const entrada = estado.jugadores[j].mano.find(c => c.uid === el.dataset.mano);
    if (!entrada || (previa && previa.dataset.uid === entrada.uid)) return;
    quitarPrevia();
    previa = h('div', 'vista-previa');
    previa.dataset.uid = entrada.uid;
    previa.appendChild(renderCarta(entrada.carta, { tamano: 'normal' }));
    raiz.appendChild(previa);   // dentro de la mesa: se va con ella al cambiar de pantalla
    const r = el.getBoundingClientRect(), w = previa.offsetWidth, hgt = previa.offsetHeight;
    previa.style.left = `${Math.min(Math.max(8, r.left + r.width / 2 - w / 2), innerWidth - w - 8)}px`;
    previa.style.top = `${Math.max(8, r.top - hgt - 10)}px`;
  }
  raiz.addEventListener('pointerover', vistaPrevia);
  raiz.addEventListener('pointerleave', quitarPrevia);
  raiz.addEventListener('pointerdown', quitarPrevia, true);
  raiz.addEventListener('pointerup', quitarPrevia, true);

  // ---------- Dibujo ----------
  let hitosAntes = { A: 0, B: 0 };      // para animar el sello del Hito nuevo
  function render() {
    if (!vivo) return quitarPrevia();
    quitarPrevia();
    raiz.innerHTML = '';
    pintarFondo();
    raiz.appendChild(lado('B'));
    raiz.appendChild(centro());
    raiz.appendChild(lado('A'));
    if (config.modo === 'tutorial') entrenador();
    animarMovimientos();
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

  // ---------- Movimiento de cartas ----------
  // Compara con el dibujo anterior: cartas nuevas en la mesa vuelan desde la mano (o desde donde se soltaron),
  // las robadas salen del mazo, el Lugar llega a la barra y una evolución hace girar el reloj.
  let cartasAntes = null, manosAntes = null, lugarAntes;
  function origenDe(j) {
    if (estado.turno === j && performance.now() - ultimaSoltada.t < 700) return { x: ultimaSoltada.x, y: ultimaSoltada.y };
    const m = raiz.querySelector(`.lado-${j} .mano`) || raiz.querySelector(`.lado-${j} .pila-mazo`);
    if (!m) return null;
    const r = m.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  function animarMovimientos() {
    const cartas = {}, manos = {};
    for (const j of ['A', 'B']) {
      const yo = estado.jugadores[j];
      for (const p of [yo.activo, ...yo.reserva]) if (p) cartas[p.uid] = { j, id: p.carta.id };
      manos[j] = new Set(yo.mano.map(c => c.uid));
    }
    const lugarAhora = estado.lugar ? estado.lugar.uid : null;
    const quieto = sinMovimiento();
    if (cartasAntes && !quieto) {
      raiz.querySelectorAll('.campo [data-uid]').forEach(el => {
        const uid = el.dataset.uid, antes = cartasAntes[uid], c = cartas[uid];
        if (!c) return;
        if (!antes) { if (entradasDirigidas.has(uid)) entradasDirigidas.delete(uid); else volar(el, origenDe(c.j)); }
        else if (antes.id !== c.id) relojSobre(el);   // misma carta en juego, otra etapa: evolucionó
      });
      for (const j of ['A', 'B']) {
        const nuevas = [...manos[j]].filter(u => !manosAntes[j].has(u));
        if (!nuevas.length || nuevas.length > 6) continue;
        const mazo = raiz.querySelector(`.lado-${j} .pila-mazo`);
        if (!mazo) continue;
        const r = mazo.getBoundingClientRect(), desde = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        const els = [...raiz.querySelectorAll(`.lado-${j} .mano > .carta-mini`)];
        const visibles = els.filter(el => el.dataset.mano && nuevas.includes(el.dataset.mano));
        (visibles.length ? visibles : els.slice(-nuevas.length)).forEach((el, k) => setTimeout(() => volar(el, desde, { ms: 480 }), k * 90));
      }
      if (lugarAhora && lugarAhora !== lugarAntes && !entradasDirigidas.delete('lugar')) {
        const el = raiz.querySelector('.centro .lugar-en-juego .carta');
        if (el) volar(el, origenDe(estado.lugar.duenio || estado.turno), { ms: 620 });
      }
    } else if (cartasAntes && quieto) {
      raiz.querySelectorAll('.campo [data-uid]').forEach(el => { if (!cartasAntes[el.dataset.uid]) el.classList.add('entra'); });
    }
    cartasAntes = cartas; manosAntes = manos; lugarAntes = lugarAhora;
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
    if (d > 0) {
      const b = raiz.querySelector('.centro'), r = b && b.getBoundingClientRect();
      if (r) granoHacia(el, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }
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
            if (v.tipo === 'jugar') {
              out.set(lado, { jugarCarta: true });
              // Un Lugar también se puede soltar en su espacio de la barra central.
              const hueco = entrada.carta.tipo === 'lugar' && raiz.querySelector('.centro .lugar-en-juego');
              if (hueco) out.set(hueco, { jugarCarta: true });
            }
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

  // El fondo es el tablero. Si hay un Lugar en juego, su escenario (o su ilustración) lo reemplaza.
  // Cada cambio de escenario es un viaje en el tiempo: el anterior se deshace en arena (viaje.js)
  // y un contador lleva el año de una época a la otra.
  let escena = null, viaje = null, fondoPrevio = null;
  const urlCompleta = ruta => `url("${new URL(ruta, location.href).href}")`;   // relativa en CSS se resolvería desde css/
  // En una expansión no hay tableros: su fondo general hace de escenario de base.
  const fondoColeccion = colec && colec.fondo ? { id: `${colec.id}-fondo`, nombre: colec.nombre, imagen: colec.fondo, lugares: [], textoRegla: '' } : null;
  function pintarFondo() {
    const t = tableroActual() || fondoColeccion;
    const lugar = estado.lugar && estado.lugar.carta;
    // Primero el escenario pintado para la mesa; si no hay, la ilustración de la carta (ampliada y desenfocada).
    const propio = lugar ? escenarioCarta(lugar) : null;
    const img = propio || (lugar ? imagenCarta(lugar) : null);
    // El sonido del escenario (si tiene); en una expansión, sin Lugar suena su ambiente general (si lo trae).
    ambiente.poner(lugar ? rutaAmbiente(lugar.id) : (colec && colec.ambiente) || null);
    const escenario = (!img && lugar && tableros.find(x => x.lugares.includes(lugar.id))) || t;
    if (escenario) raiz.style.setProperty('--fondo-img', urlCompleta(escenario.imagen));
    raiz.classList.toggle('con-tablero', !!escenario || !!img);
    raiz.classList.toggle('con-escena', !!img);

    // ¿Cambió el escenario desde el último dibujo?
    const ahora = img ? { clave: lugar.id, url: img, epoca: epocaDe(epocas, lugar.id), lugar }
      : escenario ? { clave: escenario.id, url: escenario.imagen, epoca: epocaDe(epocas, escenario.id), tablero: escenario } : null;
    const cambio = !fondoListo || (fondoPrevio && fondoPrevio.clave) !== (ahora && ahora.clave);
    if (cambio) {
      // Al abrir una partida nueva se viaja desde hoy hasta la época del tablero; una partida retomada no viaja.
      if (fondoListo) viajar(fondoPrevio, ahora);
      else if (partidaNueva && ahora && ahora.epoca && !ahora.epoca.hoy) viajar(null, ahora);
      fondoPrevio = ahora; fondoListo = true;
    }
    if (cambio || (escena && escena.id) !== (img ? lugar.id : null)) {
      if (escena) escena.el.remove();
      escena = null;
      if (img) {
        const el = h('div', `escena-lugar${propio ? ' nitida' : ''}${viaje ? '' : ' entra'}`);
        el.style.setProperty('--escena', urlCompleta(img));
        // Al terminar la entrada se quita la animación: si no, se repetiría en cada redibujo.
        el.addEventListener('animationend', () => el.classList.remove('entra'), { once: true });
        escena = { id: lugar.id, el };
      }
    }
    if (escena) raiz.appendChild(escena.el);
    if (viaje && !viaje.dataset.fin) raiz.appendChild(viaje); else viaje = null;
  }
  let fondoListo = false;

  // Viaje de un escenario a otro: arena sobre el anterior + cartel con el contador de años.
  function viajar(desde, hasta) {
    const quieto = sinMovimiento();
    sonidos.viaje();
    if (!quieto) {
      const r = raiz.getBoundingClientRect();
      viaje = arenaDelTiempo({ ancho: r.width || innerWidth, alto: r.height || innerHeight, imagen: desde ? new URL(desde.url, location.href).href : null });
    }
    if (hasta) anunciarViaje(desde ? desde.epoca : { anio: new Date().getFullYear(), hoy: true }, hasta, quieto);
  }

  function anunciarViaje(epocaDesde, hasta, quieto) {
    const dir = direccionViaje(epocaDesde, hasta.epoca);
    const titulo = dir === 'pasado' ? 'Viajando al pasado' : dir === 'futuro' ? 'Viajando al futuro' : colec ? 'Viajando a' : 'Nuevo escenario';
    const carta = hasta.lugar;
    const nombre = carta ? carta.nombre : hasta.tablero.nombre;
    const detalle = carta ? (carta.texto || textoEfecto(carta.efecto)) : (hasta.tablero.textoRegla ? `Regla del tablero: ${hasta.tablero.textoRegla}` : '');
    const c = h('div', `cartel-escenario viaje-${dir || 'mismo'}${girado(estado.turno) ? ' girado' : ''}`,
      `<small class="rumbo">${titulo}</small>${hasta.epoca ? '<div class="anio-viaje"></div>' : ''}${carta && carta.zona ? `<div class="zona-viaje">${esc(carta.zona)}</div>` : ''}<b>${esc(nombre)}</b>${detalle ? `<span>${esc(detalle)}</span>` : ''}`);
    raiz.appendChild(c);
    const caja = c.querySelector('.anio-viaje');
    if (caja && dir && !quieto) {
      const t0 = performance.now(), dura = 1300, a0 = epocaDesde.anio, a1 = hasta.epoca.anio;
      caja.textContent = textoAnio(epocaDesde);
      const paso = ms => {
        const t = (ms - t0) / dura;
        if (t >= 1 || !c.isConnected) { caja.textContent = textoAnio(hasta.epoca); caja.classList.add('llego'); return; }
        caja.textContent = textoAnio({ anio: anioEnViaje(a0, a1, t) });
        requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    } else if (caja) { caja.textContent = textoAnio(hasta.epoca); caja.classList.add('llego'); }
    setTimeout(() => c.remove(), 2800);
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
    son.onclick = () => { son.innerHTML = alternarSonido() ? ICONO_SONIDO : ICONO_SILENCIO; ambiente.refrescar(); };
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
    menu.onclick = abrirMenu;
    c.appendChild(menu);
    return c;
  }

  // Menú de la partida: seguir, salir dejándola guardada, o terminarla (con confirmación).
  function abrirMenu() {
    if (raiz.querySelector('.menu-partida')) return;
    sonidos.abrir();
    const capa = h('div', `capa capa-menu${girado(estado.turno) ? ' girado' : ''}`);
    const panel = h('div', 'panel-aviso menu-partida');
    panel.setAttribute('role', 'dialog');
    const cerrar = () => capa.remove();
    const opciones = () => {
      panel.innerHTML = '<div class="titulo-sabias">Partida en pausa</div>';
      const seguir = h('button', 'boton-principal', 'Seguir jugando');
      seguir.onclick = cerrar;
      const salir = h('button', 'boton-secundario', config.torneo ? 'Volver al torneo' : 'Volver al inicio');
      salir.appendChild(h('small', '', 'La partida queda guardada para continuar después.'));
      salir.onclick = () => { cerrar(); location.hash = config.torneo ? '#torneo' : '#inicio'; };
      const terminar = h('button', 'boton-secundario boton-peligro', 'Terminar partida');
      terminar.appendChild(h('small', '', 'Se borra y no se podrá continuar.'));
      terminar.onclick = preguntar;
      panel.append(seguir, salir, terminar);
      seguir.focus();
    };
    const preguntar = () => {
      panel.innerHTML = '<div class="titulo-sabias">¿Terminar esta partida?</div><p>Se borra la partida en curso. No se podrá continuar.</p>';
      const botones = h('div', 'botones');
      const no = h('button', 'boton-secundario', 'Cancelar');
      no.onclick = cerrar;   // vuelve directo a la partida
      const si = h('button', 'boton-principal boton-peligro', 'Sí, terminar');
      si.onclick = () => { cerrar(); terminarPartida(); };
      botones.append(no, si);
      panel.appendChild(botones);
      no.focus();
    };
    opciones();
    capa.onclick = ev => { if (ev.target === capa) cerrar(); };
    capa.appendChild(panel);
    raiz.appendChild(capa);
  }

  function terminarPartida() {
    detener();
    destruir();
    almacen.borrar(CLAVES.partida);
    location.hash = config.torneo ? '#torneo' : '#inicio';
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
        // El número del botón sale del mismo cálculo que aplica el motor, y se explica si difiere del de la carta.
        const dsg = rivalActivo ? desgloseDanio(estado, j, indice) : null;
        const efectivo = rivalActivo && rivalActivo.protegido ? 0 : dsg ? dsg.total : a.danio;
        const motivo = rivalActivo && rivalActivo.protegido ? 'el rival está protegido' : dsg ? textoDesglose(dsg) : '';
        const nota = falta ? `<small class="falta">Falta ${falta} de Saber</small>`
          : primerTurno ? '<small class="falta">No se ataca en el primer turno</small>'
          : rivalActivo && rivalActivo.protegido ? '<small class="falta">El rival está protegido</small>'
          : efectivo !== a.danio && motivo ? `<small class="calculo">${esc(motivo)}</small>` : '';
        const marca = ventaja ? '<i class="x2" title="Ventaja: daño doble">×2</i>' : '';
        const impreso = efectivo !== a.danio ? `<s class="impreso">${esc(a.danio)}</s>` : '';
        const b = h('button', `boton-accion${falta ? ' sin-saber' : ''}${ventaja ? ' con-ventaja' : ''}`, `<span class="costo">${costo}</span><span class="an">${esc(a.nombre)}${nota}</span><b>${impreso}${esc(efectivo)}${marca}</b>`);
        if (efectivo !== a.danio) b.title = `La carta dice ${a.danio}; en esta mesa hace ${efectivo}: ${motivo}.`;
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
    const mazo = h('div', 'pila pila-mazo', `${yo.mazo.length ? dorsoHtml[j] : ''}<span class="cuenta">${yo.mazo.length}</span><small>Mazo</small>`);
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
      } else mano.appendChild(h('div', 'carta carta-mini dorso', dorsoHtml[j]));
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
        // Desactivado, el botón dice qué falta en vez de solo apagarse.
        const b = h('button', 'boton-principal', listo ? 'Listo' : 'Primero elige tu activo');
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
      ? 'Elige un Protagonista de tu mano y ponlo como <b>activo</b>: es quien combate. Conviene uno con buena resistencia.'
      : 'Pon Protagonistas en tu <b>reserva</b> (hasta 3). Si tu activo cae y no tienes reserva, pierdes la partida. Cuando quieras, toca <b>Listo</b>.';
    else if (e.turno === 'A' && e.fase === 'turno') {
      const v = jugadasValidas(e);
      if (yo.saberPendiente > 0) t = 'Cada turno ganas 1 de <b>Saber</b>. Toca un Protagonista para dárselo: las acciones necesitan Saber, y no se pierde al atacar.';
      else if (v.some(x => x.tipo === 'accion')) t = 'Ya puedes usar una <b>acción</b>: los botones junto a tu activo. Al atacar se termina tu turno, así que primero juega tus cartas.';
      else if (e.numeroTurno === 1) t = 'En el primer turno de la partida no se puede atacar. Prepara tu mesa: baja Protagonistas o juega cartas, y luego pasa el turno.';
      else if (v.some(x => x.tipo === 'evolucionar')) t = '¡Puedes <b>evolucionar</b>! Una Etapa 2 muestra cómo algo cambió en la historia, y es más fuerte. Toca la carta que brilla en tu mano.';
      else t = 'Juega cartas de tu mano (las que brillan se pueden usar) o toca <b>Pasar turno</b>.';
      if (e.numeroTurno >= 7) t = '¡Ya sabes jugar! Gana quien consigue 3 <b>Hitos</b> (derrotar Protagonistas). Sigue o vuelve al menú.';
    } else if (e.fase === 'promover' && e.turno === 'A') t = 'Tu activo cayó. Elige quién de tu <b>reserva</b> pasa al frente: mira su resistencia y contra quién tiene ventaja.';
    else if (e.turno === 'B') t = 'Ahora juega la tablet…';
    // En el tutorial, La Cronista dice el paso a paso (salvo que se le haya pedido una pista).
    const clave = (CLAVES_TUTORIAL.find(([inicio]) => t.startsWith(inicio)) || [])[1];
    if (!globo || globo.tutorial) {
      globo = { j: 'A', expresion: 'explica', texto: t, tutorial: true, clave };
      if (clave && clave !== ultimoPasoTutorial) { ultimoPasoTutorial = clave; voz(clave); }
    }
  }

  // Frases del tutorial y su grabación de La Cronista.
  // Las frases del tutorial que coinciden con las de La Cronista en partida usan la misma grabación.
  const CLAVES_TUTORIAL = [['Elige un Protagonista de tu mano', 'prep-activo'], ['Pon Protagonistas en tu', 'prep-reserva'], ['Cada turno ganas', 'saber'],
    ['Ya puedes usar una', 'accion'], ['En el primer turno', 'primer-turno'], ['¡Puedes <b>evolucionar', 'evolucion'],
    ['Juega cartas de tu mano', 'tut-jugar'], ['¡Ya sabes jugar', 'tut-fin'], ['Tu activo cayó', 'promover'], ['Ahora juega la tablet', 'tut-rival']];
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
    acoplarGlobo(g);
    if (globo.jugada && estado.turno === globo.j) objetivoDe(globo.jugada).forEach(el => el.classList.add('sugerida'));
  }

  // Si hay espacio, el globo se acopla a la barra a la derecha del activo: así no tapa el tablero,
  // el Lugar, el turno ni los mensajes. Si no cabe (pantalla angosta o mitad girada), queda centrado.
  function acoplarGlobo(g) {
    if (g.classList.contains('girado')) return;
    const barra = raiz.querySelector('.centro'), son = raiz.querySelector('.centro .boton-sonido');
    const activo = raiz.querySelector(`.lado-${globo.j} .zona-activo`);
    if (!barra || !son || !activo) return;
    const izq = activo.getBoundingClientRect().right + 14, der = son.getBoundingClientRect().left - 12;
    if (der - izq < 280) return;
    const b = barra.getBoundingClientRect();
    g.classList.add('acoplado');
    g.style.left = `${izq}px`; g.style.width = `${der - izq}px`; g.style.top = `${b.top + b.height / 2}px`;
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
      case 'accion': { const a = yo.activo.carta.acciones[v.indice]; return `${esc(a.nombre)} · ${esc(danioDeAccion(estado, j, v.indice))} de daño`; }   // el mismo número que el botón
      default: return v.tipo;
    }
  }

  // Texto del desglose: "−10 Castillo feudal · ×2 ventaja".
  function textoDesglose(dsg) {
    const t = tableroActual(), l = estado.lugar && estado.lugar.carta;
    const nombre = { lugar: l ? l.nombre : 'Lugar', tablero: t ? t.nombre : 'tablero', bonus: 'carta jugada', reserva: 'por tu reserva', resistente: 'el rival resiste' };
    // Texto plano: quien lo inserta en HTML lo pasa por esc().
    return dsg.pasos.map(p => (p.por ? '×' + p.por + ' ventaja' : (p.valor > 0 ? '+' : '−') + Math.abs(p.valor) + ' ' + nombre[p.fuente])).join(' · ');
  }

  // Si la carta es un activo en juego, el detalle dice cuánto hace cada acción en esta mesa y por qué.
  function danioEnMesa(carta) {
    for (const j of ['A', 'B']) {
      const yo = estado.jugadores[j], otro = estado.jugadores[j === 'A' ? 'B' : 'A'];
      if (!yo.activo || yo.activo.carta.id !== carta.id || !otro.activo || !carta.acciones) continue;
      const filas = carta.acciones.map((a, i) => {
        const dsg = desgloseDanio(estado, j, i);
        const total = otro.activo.protegido ? 0 : dsg.total;
        const porque = otro.activo.protegido ? 'el rival está protegido' : textoDesglose(dsg);
        return `<li><b>${esc(a.nombre)}</b>: ${total === a.danio ? `${esc(total)} de daño` : `la carta dice ${esc(a.danio)}, aquí hace <b>${esc(total)}</b> (${esc(porque)})`}</li>`;
      }).join('');
      return h('div', 'en-esta-mesa', `<div class="titulo-mesa">En esta mesa, contra ${esc(otro.activo.carta.nombre)}</div><ul>${filas}</ul>`);
    }
    return null;
  }

  function verCarta(carta, orientadoA, opciones = [], instancia = null) {
    sonidos.abrir();
    const capa = h('div', `capa${girado(orientadoA) ? ' girado' : ''}`);
    const panel = h('div', 'panel-carta');
    panel.appendChild(renderCarta(carta, { tamano: 'grande', instancia, unidades: unidadesCarta(carta) }));
    const mesaInfo = carta.tipo === 'protagonista' && estado.fase !== 'preparacion' ? danioEnMesa(carta) : null;
    const botones = h('div', 'botones');
    for (const o of opciones) {
      const b = h('button', 'boton-principal', o.texto);   // textoJugada ya escapa los nombres
      b.onclick = () => { capa.remove(); if (o.alElegir) o.alElegir(); else jugar(o.jugada); };
      botones.appendChild(b);
    }
    botones.appendChild(botonEscucharCarta(carta, () => textoParaLeer(carta)));
    const cerrar = h('button', 'boton-secundario', opciones.length ? 'Cancelar' : 'Cerrar');
    cerrar.onclick = () => { detener(); capa.remove(); };
    botones.appendChild(cerrar);
    panel.appendChild(botones);            // las opciones van pegadas a la carta: siempre a mano
    if (mesaInfo) panel.appendChild(mesaInfo);
    capa.appendChild(panel);
    capa.onclick = ev => { if (ev.target === capa) capa.remove(); };
    raiz.appendChild(capa);
  }

  // ---------- Jugadas y eventos ----------
  async function jugar(jugada) {
    if (!vivo || estado.fase === 'fin' || enEscena) return;
    let r;
    const antes = estado;
    try { r = aplicarJugada(estado, jugada); } catch { render(); return; }
    // El director representa la jugada sobre la mesa de antes; recién después se dibuja el resultado.
    const plan = sinMovimiento() ? null : planDeEscena(antes, jugada, r.eventos);
    if (plan) {
      enEscena = true; ocupado = true;
      raiz.classList.add('en-escena');
      quitarPrevia();
      try { await dirigir(plan); } catch { /* si algo falla, igual se muestra el resultado */ }
      raiz.classList.remove('en-escena');
      enEscena = false; ocupado = false;
      if (!vivo) return;
    }
    escenaActual = plan;
    estado = r.estado;
    if (humanoEs(antes.turno) && jugadaReversible(antes, estado, jugada)) historial.push(antes);
    else historial = [];
    if (globo && !globo.tutorial) globo = null;
    guardar();
    render();
    await mostrarEventos(r.eventos);
    if (estado.fase === 'fin') pantallaFinal();
  }

  let enEscena = false, escenaActual = null;
  const entradasDirigidas = new Set();   // cartas que ya llegaron a la mesa con la invocación: no vuelan otra vez

  async function dirigir(plan) {
    const j = plan.jugador, otro = j === 'A' ? 'B' : 'A';
    if (plan.tipo === 'ataque') {
      return escenaAtaque({
        mesa: raiz, plan,
        atk: raiz.querySelector(`.lado-${j} .zona-activo .carta`),
        def: raiz.querySelector(`.lado-${otro} .zona-activo .carta`),
        alGolpear: () => sonidos.ataque(plan.ventaja ? Math.max(plan.valor, 50) : plan.valor),
        alCaer: () => sonidos.caida(),
      });
    }
    if (plan.breve) return;   // en la preparación basta con el vuelo normal
    const lado = raiz.querySelector(`.lado-${j}`);
    const enMano = raiz.querySelector(`.lado-${j} .mano [data-mano="${CSS.escape(plan.uid)}"]`)
      || [...raiz.querySelectorAll(`.lado-${j} .mano > .carta-mini`)].pop();
    let desde = null;
    if (performance.now() - ultimaSoltada.t < 900) desde = { x: ultimaSoltada.x, y: ultimaSoltada.y };
    else if (enMano) { const r = enMano.getBoundingClientRect(); desde = { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
    if (enMano) enMano.style.visibility = 'hidden';
    const destino = plan.destino === 'activo' ? lado.querySelector('.zona-activo')
      : plan.destino === 'reserva' ? (lado.querySelector('.reserva .hueco') || lado.querySelector('.reserva'))
        : plan.destino === 'evolucion' ? lado.querySelector(`[data-uid="${CSS.escape(plan.objetivo)}"]`)
          : plan.destino === 'lugar' ? raiz.querySelector('.centro .lugar-en-juego') : null;
    const efecto = plan.carta.texto || textoEfecto(plan.carta.efecto);
    const detalle = plan.destino === 'efecto'
      ? `<small>${plan.carta.tipo === 'personaje' ? (plan.carta.coleccion ? 'Presencia sagrada' : 'Personaje') : plan.carta.tipo === 'aula' ? 'Aula' : plan.carta.coleccion ? 'Relato' : 'Acontecimiento'}</small><b>${esc(plan.carta.nombre)}</b>${efecto ? `<span>${esc(efecto)}</span>` : ''}`
      : plan.destino === 'evolucion' ? `<small>Evolución</small><b>${esc(plan.carta.nombre)}</b>` : '';
    sonidos.invocar(plan.carta.tipo);   // cada tipo de carta tiene su sonido de invocación
    const espera = plan.carta.tipo === 'personaje' && sonidoActivo() ? hablarPersonaje(plan.carta) : null;
    await escenaInvocacion({ grande: renderCarta(plan.carta, { tamano: 'normal' }), desde, destino, plan, girado: girado(j), detalle, espera });
    if (plan.destino !== 'efecto') entradasDirigidas.add(plan.destino === 'lugar' ? 'lugar' : plan.uid);
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
      if (['colocar', 'bajar', 'lugar', 'efecto', 'evolucion', 'retirar', 'promover'].includes(ev.tipo) && !(escenaActual && escenaActual.tipo === 'invocacion' && !escenaActual.breve)) sonidos.jugar();
      if (ev.tipo === 'turno' && estado.fase === 'turno') { sonidos.turno(contraIA && ev.jugador === 'B'); if (ev.robo) sonidos.robar(); anunciarTurno(ev.jugador); }
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
      const atacoEnEscena = escenaActual && escenaActual.tipo === 'ataque';
      if (ev.tipo === 'danio' && !atacoEnEscena) {
        sonidos.ataque(ev.valor);
        embestida(ev.jugador);
        destello(ev.jugador === 'A' ? 'B' : 'A', ev.valor);
      }
      if (ev.tipo === 'danio') {
        if (!eventos.some(e => e.tipo === 'ventaja')) registrar(`${esc(ev.carta.nombre)} usa <b>${esc(ev.accion)}</b>: ${ev.valor} de daño`);
      }
      if (ev.tipo === 'protegido') registrar(`<b>${esc(ev.carta.nombre)}</b> estaba protegido: no recibe daño`);
      if (ev.tipo === 'evolucion') registrar(`<b>${esc(ev.de.nombre)}</b> evoluciona en <b>${esc(ev.a.nombre)}</b>`);
      if (ev.tipo === 'efecto' && !eventos.some(x => x.tipo === 'revelar' || x.tipo === 'conexion')) registrar(`${nombres[ev.jugador]}: <b>${esc(ev.carta.nombre)}</b>`);
      if (ev.tipo === 'lugar') { registrar(`Nuevo lugar: <b>${esc(ev.carta.nombre)}</b>`); }
      if (ev.tipo === 'efecto') {   // el sonido de lo que hace la carta
        const tipos = (Array.isArray(ev.carta.efecto) ? ev.carta.efecto : [ev.carta.efecto]).filter(Boolean).map(x => x.tipo);
        if (tipos.some(x => x === 'curar' || x === 'curarTodos')) sonidos.curar();
        if (tipos.some(x => x.startsWith('buscar') || x.startsWith('robar'))) sonidos.buscar();
      }
      if (ev.tipo === 'revelar') registrar(`${nombres[ev.jugador]}: se miraron ${ev.cartas.length} cartas del mazo${ev.tomada ? ` y se tomó <b>${esc(ev.tomada.nombre)}</b>` : ', sin Protagonistas'}`);
      if (ev.tipo === 'caida') {
        caidas.push(ev.carta);
        if (!atacoEnEscena) { sonidos.caida(); await archivar(ev.carta, ev.jugador); }
        if (config.sabias) await sabiasQue(ev.carta, ev.jugador === 'A' ? 'B' : 'A');
      }
    }
    ocupado = false;
    escenaActual = null;
    programarIA();
  }

  const esperar = ms => new Promise(r => setTimeout(r, ms));
  const sinMovimiento = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function embestida(atacante) {
    const a = raiz.querySelector(`.lado-${atacante} .zona-activo .carta`);
    const d = raiz.querySelector(`.lado-${atacante === 'A' ? 'B' : 'A'} .zona-activo .carta`);
    if (a) { a.classList.remove('embiste'); void a.offsetWidth; a.classList.add('embiste'); }
    if (d) { d.classList.remove('golpeado'); void d.offsetWidth; d.classList.add('golpeado'); }
    // Si el golpe lo derrotó, la carta ya no está: el impacto va al espacio del activo.
    const blanco = d || raiz.querySelector(`.lado-${atacante === 'A' ? 'B' : 'A'} .zona-activo`);
    if (blanco && !sinMovimiento()) setTimeout(() => impacto(blanco), 160);
  }

  // La carta derrotada se vuelve sepia y queda "archivada" un momento.
  async function archivar(carta, duenio) {
    const zona = raiz.querySelector(`.lado-${duenio} .zona-activo`);
    if (!zona || sinMovimiento()) return;
    // Se vuelve foto antigua (sepia, con el sello) y luego se deshace en arena.
    const fantasma = renderCarta(carta, { tamano: 'mini' });
    fantasma.classList.add('archivada');
    fantasma.appendChild(h('div', 'sello-archivo', 'Archivada'));
    zona.appendChild(fantasma);
    await esperar(520);
    await deshacerEnArena(fantasma, 820);
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
      const deCol = carta.coleccion ? coleccion(carta.coleccion) : null;
      c.innerHTML = `<div class="titulo-sabias">${esc(deCol ? deCol.etiquetaDato : '¿Sabías que…?')}</div>`;
      const fila = h('div', 'sabias-fila');
      fila.appendChild(renderCarta(carta, { tamano: 'mini' }));
      fila.appendChild(h('div', 'sabias-texto', `<b>${esc(carta.nombre)}</b>${carta.zona ? `<small class="zona">${esc(carta.zona)}</small>` : ''}<p>${esc(carta.dato)}</p><small>${nombres[ganador]} gana un Hito</small>`));
      c.appendChild(fila);
      const b = h('button', 'boton-principal', 'Seguir');
      c.appendChild(b);
      const capa = dobleCara(c);
      const texto = '¿Sabías que? ' + carta.nombre + '. ' + carta.dato;   // texto plano para la voz
      // Nombre y dato: es lo mismo que grabó el narrador; si la carta no tiene grabación, voz de la tablet.
      const grabacion = () => rutaNarrador(carta);
      capa.querySelectorAll('.boton-principal').forEach(x => {
        x.parentNode.insertBefore(botonEscuchar(() => texto, 'boton-secundario', grabacion), x);
        x.onclick = () => { detener(); capa.remove(); resolve(); };
      });
      raiz.appendChild(capa);
      if (config.leerSabias) { const r = grabacion(); if (r) reproducir(r); else leer(texto); }
    });
  }

  function pantallaFinal() {
    const g = estado.ganador;
    if (contraIA && g === 'B') sonidos.derrota(); else sonidos.victoria();
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
    ambiente.poner(null);
    vivo = false;
    clearTimeout(temporizador);
  }

  const api = { destruir, get estado() { return estado; } };
  render();
  return api;
}
