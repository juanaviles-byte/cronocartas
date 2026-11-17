// Mesa de juego: cara a cara en la misma tablet, contra la tablet o tutorial.
// Solo dibuja y traduce toques en jugadas; las reglas viven en motor.js.
import { crearPartida, jugadasValidas, aplicarJugada, busquedaDe } from '../motor.js';
import { elegirJugada } from '../ia.js';
import { armarMazo } from '../mazos.js';
import { cargarCursoCompleto } from './datos.js';
import { crearRng } from '../rng.js';
import { almacen, CLAVES } from '../almacen.js';
import { renderCarta } from './carta.js';
import { esc, pips } from '../html.js';
import { sonidos, sonidoActivo, alternarSonido } from './sonido.js';

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
    tablero: opciones.tablero || 'azar',
    reforzar: !!opciones.reforzar,
  };
  const contraIA = config.modo !== 'caraacara';
  const nombres = { A: contraIA ? 'Tú' : 'Jugador 1', B: contraIA ? 'Tablet' : 'Jugador 2' };

  contenedor.innerHTML = '<div class="cargando">Barajando…</div>';
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
      mazoA: armarMazo(datosA.cartas, datosA.aula, rng, foco),
      mazoB: armarMazo(datosB.cartas, datosB.aula, rng, foco),
      semilla: config.semilla + 1,
      hitosParaGanar: config.hitosParaGanar,
      tablero,
    });
  }
  const tableroActual = () => tableros.find(t => t.id === (estado.tablero && estado.tablero.id)) || null;

  let vivo = true;
  let ocupado = false;           // mientras se muestra un aviso o juega la IA
  let caidas = [];               // cartas caídas, para el resumen final
  let temporizador = null;
  const raiz = h('div', `mesa modo-${config.modo}`);
  contenedor.innerHTML = '';
  contenedor.appendChild(raiz);

  const girado = j => config.modo === 'caraacara' && j === 'B';
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
    if (config.modo === 'tutorial') raiz.appendChild(entrenador());
    const ahora = new Set([...raiz.querySelectorAll('.campo [data-uid]')].map(e => e.dataset.uid));
    if (uidsAntes) raiz.querySelectorAll('.campo [data-uid]').forEach(e => { if (!uidsAntes.has(e.dataset.uid)) e.classList.add('entra'); });
    uidsAntes = ahora;
    hitosAntes = { A: estado.jugadores.A.hitos, B: estado.jugadores.B.hitos };
    programarIA();
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
    const lugar = h('button', 'lugar-en-juego', l ? `<span>Lugar</span> ${esc(l.carta.nombre)}` : '<span>Sin lugar en juego</span>');
    if (l) lugar.onclick = () => verCarta(l.carta, estado.turno);
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
    } else zonaActivo.appendChild(h('div', 'hueco', 'Activo'));
    campo.appendChild(zonaActivo);

    const acciones = h('div', 'acciones-activo');
    if (yo.activo && yo.activo.carta.acciones) {
      const validas = esMiTurno && humano ? jugadasValidas(estado) : [];
      yo.activo.carta.acciones.forEach((a, indice) => {
        const ok = validas.some(v => v.tipo === 'accion' && v.indice === indice);
        const b = h('button', 'boton-accion', `<span class="costo">${pips(a.costo)}</span><span>${esc(a.nombre)}</span><b>${esc(a.danio)}</b>`);
        b.disabled = !ok;
        b.onclick = () => jugar({ tipo: 'accion', indice });
        acciones.appendChild(b);
      });
    }
    campo.appendChild(acciones);

    const reserva = h('div', 'reserva');
    for (let i = 0; i < 3; i++) {
      const r = yo.reserva[i];
      if (r) {
        const cr = renderCarta(r.carta, { tamano: 'mini', instancia: r });
        cr.dataset.uid = r.uid;
        cr.onclick = () => tocarEnMesa(j, r);
        reserva.appendChild(cr);
      } else reserva.appendChild(h('div', 'hueco', 'Reserva'));
    }
    campo.appendChild(reserva);

    const marcador = h('div', 'marcador');
    marcador.innerHTML = `
      <div class="nombre-jugador">${nombres[j]}</div>
      <div class="hitos" title="Hitos">${[...Array(estado.hitosParaGanar)].map((_, i) => `<i class="${i < yo.hitos ? 'si' : ''}${i < yo.hitos && i >= hitosAntes[j] ? ' nuevo' : ''}"></i>`).join('')}</div>
      <div class="cuentas">Mazo ${yo.mazo.length}</div>`;
    campo.appendChild(marcador);
    s.appendChild(campo);

    // Mano + controles
    const fila = h('div', 'fila-mano');
    const mano = h('div', 'mano');
    const mostrar = humano && esMiTurno;
    for (const c of yo.mano) {
      if (mostrar) {
        const el = renderCarta(c.carta, { tamano: 'mini' });
        const usable = jugadasValidas(estado).some(v => v.uid === c.uid);
        if (usable) el.classList.add('usable');
        el.onclick = () => tocarEnMano(j, c);
        mano.appendChild(el);
      } else mano.appendChild(h('div', 'carta carta-mini dorso', '<span>CC</span>'));
    }
    fila.appendChild(mano);

    const controles = h('div', 'controles');
    if (esMiTurno && humano) {
      const validas = jugadasValidas(estado);
      if (estado.fase === 'turno' && yo.saberPendiente > 0) controles.appendChild(h('div', 'pista', `Tienes ${pips(yo.saberPendiente)} Saber: toca un Protagonista`));
      if (estado.fase === 'preparacion') {
        const listo = validas.find(v => v.tipo === 'listo');
        const b = h('button', 'boton-principal', 'Listo');
        b.disabled = !listo;
        b.onclick = () => jugar({ tipo: 'listo' });
        controles.appendChild(b);
        if (!listo) controles.appendChild(h('div', 'pista', 'Toca un Protagonista de tu mano'));
        else if (!yo.reserva.length) controles.appendChild(h('div', 'pista suave', 'Consejo: pon Protagonistas en la reserva. Si tu activo cae y no tienes reserva, pierdes.'));
      } else if (estado.fase === 'turno') {
        const b = h('button', 'boton-secundario', 'Pasar turno');
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
    return h('div', 'entrenador', t);
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
    const cerrar = h('button', 'boton-secundario', opciones.length ? 'Cancelar' : 'Cerrar');
    cerrar.onclick = () => capa.remove();
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
    try { r = aplicarJugada(estado, jugada); } catch { render(); return; }
    estado = r.estado;
    guardar();
    render();
    await mostrarEventos(r.eventos);
    if (estado.fase === 'fin') pantallaFinal();
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
      if (ev.tipo === 'hito') sonidos.hito();
      if (ev.tipo === 'danio') {
        sonidos.ataque();
        embestida(ev.jugador);
        destello(ev.jugador === 'A' ? 'B' : 'A', ev.valor);
        if (!eventos.some(e => e.tipo === 'ventaja')) registrar(`${esc(ev.carta.nombre)} usa <b>${esc(ev.accion)}</b>: ${ev.valor} de daño`);
      }
      if (ev.tipo === 'protegido') registrar(`<b>${esc(ev.carta.nombre)}</b> estaba protegido: no recibe daño`);
      if (ev.tipo === 'evolucion') registrar(`<b>${esc(ev.de.nombre)}</b> evoluciona en <b>${esc(ev.a.nombre)}</b>`);
      if (ev.tipo === 'efecto' && !eventos.some(x => x.tipo === 'revelar')) registrar(`${nombres[ev.jugador]}: <b>${esc(ev.carta.nombre)}</b>`);
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

  function anunciarTurno(j) {
    if (sinMovimiento()) return;
    const texto = contraIA ? (j === 'A' ? 'Tu turno' : 'Turno de la Tablet') : `Turno de ${nombres[j]}`;
    const b = h('div', `banner-turno${girado(j) ? ' girado' : ''}`, esc(texto));
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
      capa.querySelectorAll('button').forEach(x => { x.onclick = () => { capa.remove(); resolve(); }; });
      raiz.appendChild(capa);
    });
  }

  function pantallaFinal() {
    const g = estado.ganador;
    sonidos.victoria();
    const c = h('div', 'final');
    c.innerHTML = `<div class="titulo-final">¡Gana ${nombres[g]}!</div>
      <p>${razonFinal(g)}</p>
      ${caidas.length ? `<div class="aprendido"><b>Lo que apareció en esta partida</b><ul>${caidas.slice(-4).map(k => `<li><b>${esc(k.nombre)}:</b> ${esc(k.dato)}</li>`).join('')}</ul></div>` : ''}`;
    const botones = h('div', 'botones');
    const otra = h('button', 'boton-principal', 'Otra partida');
    const menu = h('button', 'boton-secundario', 'Menú');
    botones.append(otra, menu);
    c.appendChild(botones);
    const capa = dobleCara(c);
    capa.querySelectorAll('.boton-principal').forEach(b => { b.onclick = () => { capa.remove(); reiniciar(); }; });
    capa.querySelectorAll('.boton-secundario').forEach(b => { b.onclick = () => { location.hash = '#inicio'; }; });
    raiz.appendChild(capa);
  }

  function razonFinal(g) {
    const n = estado.jugadores[g].hitos;
    const perdedor = g === 'A' ? 'B' : 'A';
    if (n >= estado.hitosParaGanar) return `Consiguió ${n} Hito${n === 1 ? '' : 's'}.`;
    return `${nombres[perdedor]} se quedó sin Protagonistas en la mesa (${n} Hito${n === 1 ? '' : 's'} conseguido${n === 1 ? '' : 's'}).`;
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
      const j = elegirJugada(estado, 'B');
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
