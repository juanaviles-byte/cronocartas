// Mesa de juego: cara a cara en la misma tablet, contra la tablet o tutorial.
// Solo dibuja y traduce toques en jugadas; las reglas viven en motor.js.
import { crearPartida, jugadasValidas, aplicarJugada } from '../motor.js';
import { elegirJugada } from '../ia.js';
import { armarMazo, cargarCurso } from '../mazos.js';
import { crearRng } from '../rng.js';
import { almacen, CLAVES } from '../almacen.js';
import { renderCarta } from './carta.js';

export const FRASES_VENTAJA = {
  Politica: 'Las decisiones políticas reordenan la economía',
  Economia: 'La economía transforma la vida de las personas',
  Sociedad: 'Los grupos sociales crean y cambian la cultura',
  Cultura: 'Las ideas y técnicas transforman el territorio',
  Territorio: 'El territorio condiciona el poder',
};

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const pips = n => '<i class="pip"></i>'.repeat(n);

export async function montarMesa(contenedor, opciones) {
  const ajustes = almacen.leer(CLAVES.ajustes, {}) || {};
  const config = {
    modo: opciones.modo || 'caraacara',
    cursoA: Number(opciones.cursoA || 7),
    cursoB: Number(opciones.cursoB || opciones.cursoA || 7),
    semilla: opciones.semilla ?? Math.floor(Math.random() * 1e9),
    hitosParaGanar: opciones.hitosParaGanar || ajustes.hitosParaGanar || 3,
    sabias: ajustes.sabias !== false,
  };
  const contraIA = config.modo !== 'caraacara';
  const nombres = { A: contraIA ? 'Tú' : 'Jugador 1', B: contraIA ? 'Tablet' : 'Jugador 2' };

  contenedor.innerHTML = '<div class="cargando">Barajando…</div>';
  const comunidad = c => almacen.cartasComunidad(c);
  const [datosA, datosB] = await Promise.all([
    cargarCurso(config.cursoA, { comunidad: comunidad(config.cursoA) }),
    cargarCurso(config.cursoB, { comunidad: comunidad(config.cursoB) }),
  ]);
  const unidadesDe = { [config.cursoA]: datosA.unidades, [config.cursoB]: datosB.unidades };

  let estado = opciones.estado;
  if (!estado) {
    const rng = crearRng(config.semilla);
    estado = crearPartida({
      mazoA: armarMazo(datosA.cartas, datosA.aula, rng),
      mazoB: armarMazo(datosB.cartas, datosB.aula, rng),
      semilla: config.semilla + 1,
      hitosParaGanar: config.hitosParaGanar,
    });
  }

  let vivo = true;
  let ocupado = false;           // mientras se muestra un aviso o juega la IA
  let caidas = [];               // cartas caídas, para el resumen final
  let temporizador = null;
  const raiz = h('div', `mesa modo-${config.modo}`);
  contenedor.innerHTML = '';
  contenedor.appendChild(raiz);

  const girado = j => config.modo === 'caraacara' && j === 'B';
  const unidadesCarta = c => unidadesDe[c.curso] || null;

  function guardar() {
    if (estado.fase === 'fin') almacen.borrar(CLAVES.partida);
    else almacen.guardar(CLAVES.partida, { config, estado });
  }

  // ---------- Dibujo ----------
  function render() {
    if (!vivo) return;
    raiz.innerHTML = '';
    raiz.appendChild(lado('B'));
    raiz.appendChild(centro());
    raiz.appendChild(lado('A'));
    if (config.modo === 'tutorial') raiz.appendChild(entrenador());
    programarIA();
  }

  function centro() {
    const c = h('div', 'centro');
    const l = estado.lugar;
    const lugar = h('button', 'lugar-en-juego', l ? `<span>Lugar</span> ${l.carta.nombre}` : '<span>Sin lugar en juego</span>');
    if (l) lugar.onclick = () => verCarta(l.carta, estado.turno);
    c.appendChild(lugar);
    const turno = estado.fase === 'fin' ? 'Partida terminada'
      : estado.fase === 'preparacion' ? `${nombres[estado.turno]}: prepara tu mesa`
      : estado.fase === 'promover' ? `${nombres[estado.turno]}: elige un nuevo activo`
      : `Turno de ${nombres[estado.turno]}`;
    c.appendChild(h('div', `aviso-turno turno-${estado.turno}`, turno));
    c.appendChild(h('div', 'registro', ''));
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
        const b = h('button', 'boton-accion', `<span class="costo">${pips(a.costo)}</span><span>${a.nombre}</span><b>${a.danio}</b>`);
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
        cr.onclick = () => tocarEnMesa(j, r);
        reserva.appendChild(cr);
      } else reserva.appendChild(h('div', 'hueco', 'Reserva'));
    }
    campo.appendChild(reserva);

    const marcador = h('div', 'marcador');
    marcador.innerHTML = `
      <div class="nombre-jugador">${nombres[j]}</div>
      <div class="hitos" title="Hitos">${[...Array(estado.hitosParaGanar)].map((_, i) => `<i class="${i < yo.hitos ? 'si' : ''}"></i>`).join('')}</div>
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
    const opciones = jugadasValidas(estado).filter(v => v.uid === entrada.uid).map(v => ({ jugada: v, texto: textoJugada(v, j) }));
    verCarta(entrada.carta, j, opciones);
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
      case 'jugar': return 'Jugar esta carta';
      case 'evolucionar': {
        const obj = [yo.activo, ...yo.reserva].find(p => p && p.uid === v.objetivo);
        return `Evolucionar ${obj ? obj.carta.nombre : ''}`;
      }
      case 'asignarSaber': return 'Darle 1 de Saber';
      case 'retirar': return `Cambiar por el activo (cuesta ${yo.activo.carta.retirada ?? 1} Saber)`;
      case 'promover': return 'Pasar al frente como activo';
      case 'accion': { const a = yo.activo.carta.acciones[v.indice]; return `${a.nombre} · ${a.danio} de daño`; }
      default: return v.tipo;
    }
  }

  function verCarta(carta, orientadoA, opciones = [], instancia = null) {
    const capa = h('div', `capa${girado(orientadoA) ? ' girado' : ''}`);
    const panel = h('div', 'panel-carta');
    panel.appendChild(renderCarta(carta, { tamano: 'grande', instancia, unidades: unidadesCarta(carta) }));
    const botones = h('div', 'botones');
    for (const o of opciones) {
      const b = h('button', 'boton-principal', o.texto);
      b.onclick = () => { capa.remove(); jugar(o.jugada); };
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
      if (ev.tipo === 'ventaja') registrar(`<b>¡Ventaja ×2!</b> ${FRASES_VENTAJA[ev.de]}`);
      if (ev.tipo === 'danio') {
        destello(ev.jugador === 'A' ? 'B' : 'A', ev.valor);
        if (!eventos.some(e => e.tipo === 'ventaja')) registrar(`${ev.carta.nombre} usa <b>${ev.accion}</b>: ${ev.valor} de daño`);
      }
      if (ev.tipo === 'protegido') registrar(`<b>${ev.carta.nombre}</b> estaba protegido: no recibe daño`);
      if (ev.tipo === 'evolucion') registrar(`<b>${ev.de.nombre}</b> evoluciona en <b>${ev.a.nombre}</b>`);
      if (ev.tipo === 'efecto') registrar(`${nombres[ev.jugador]} juega <b>${ev.carta.nombre}</b>`);
      if (ev.tipo === 'lugar') registrar(`Nuevo lugar: <b>${ev.carta.nombre}</b>`);
      if (ev.tipo === 'caida') {
        caidas.push(ev.carta);
        if (config.sabias) await sabiasQue(ev.carta, ev.jugador === 'A' ? 'B' : 'A');
      }
    }
    ocupado = false;
    programarIA();
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
      fila.appendChild(h('div', 'sabias-texto', `<b>${carta.nombre}</b><p>${carta.dato}</p><small>${nombres[ganador]} gana un Hito</small>`));
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
    const c = h('div', 'final');
    c.innerHTML = `<div class="titulo-final">¡Gana ${nombres[g]}!</div>
      <p>${razonFinal(g)}</p>
      ${caidas.length ? `<div class="aprendido"><b>Lo que apareció en esta partida</b><ul>${caidas.slice(-4).map(k => `<li><b>${k.nombre}:</b> ${k.dato}</li>`).join('')}</ul></div>` : ''}`;
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
