// Auditoría de sintonía: lo que dice cada carta, tablero y habilidad es lo que el motor hace.
// Los números se leen del TEXTO que ve el estudiante (no de los datos) y se comparan con el
// resultado de jugar la carta en el motor.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { crearPartida, jugadasValidas, aplicarJugada, danioDeAccion, VENTAJA } from '../js/motor.js';
import { textoEfecto, textoHabilidad } from '../js/ui/carta.js';

const leer = f => JSON.parse(readFileSync(f, 'utf8'));
const TODAS = [5, 6, 7, 8].flatMap(c => leer(`data/mazo-${c}.json`).cartas).concat(leer('data/aula.json').cartas);
const TABLEROS = leer('data/tableros.json').tableros;
const PROT = TODAS.filter(c => c.tipo === 'protagonista' && !c.evolucionaDe && !c.habilidad);
const clon = x => JSON.parse(JSON.stringify(x));
const numeros = t => (t.match(/\d+/g) || []).map(Number);
const texto = c => c.texto || textoEfecto(c.efecto);
const lista = ef => (Array.isArray(ef) ? ef : ef ? [ef] : []);

// Dos Protagonistas sin ventaja entre ellos: el daño no se duplica.
function parNeutral(dimA) {
  const a = PROT.find(c => (!dimA || c.dimension === dimA) && c.acciones.length);
  const b = PROT.find(c => c.dimension !== a.dimension && VENTAJA[a.dimension] !== c.dimension && VENTAJA[c.dimension] !== a.dimension);
  return [a, b];
}

// Mesa lista: turno de A, con activo herido y con Saber, una reserva con Saber, un Lugar del rival en juego.
function mesa({ dimA = null, tablero = null } = {}) {
  const [a, b] = parNeutral(dimA);
  const relleno = PROT.filter(c => c !== a && c !== b);
  let e = crearPartida({ mazoA: [a, ...relleno.slice(0, 19)], mazoB: [b, ...relleno.slice(0, 19)], semilla: 7, tablero });
  e = clon(e);
  for (const j of ['A', 'B']) {
    const yo = e.jugadores[j];
    const prot = j === 'A' ? a : b;
    yo.activo = { uid: `${j}act`, carta: prot, danio: 30, saber: 2, protegido: false, bonus: 0, turnoEntrada: 0 };
    yo.reserva = [{ uid: `${j}res`, carta: relleno[3], danio: 20, saber: 2, protegido: false, bonus: 0, turnoEntrada: 0 }];
    yo.mano = []; yo.listo = true;
  }
  e.fase = 'turno'; e.turno = 'A'; e.numeroTurno = 3;
  e.jugadores.A.saberPendiente = 0;
  const lugar = TODAS.find(c => c.tipo === 'lugar');
  e.lugar = { uid: 'Blug', carta: lugar, duenio: 'B' };
  return e;
}

function jugarCarta(e, carta) {
  e.jugadores.A.mano.push({ uid: 'X', carta });
  const ops = jugadasValidas(e).filter(j => j.uid === 'X');
  assert.ok(ops.length, `${carta.nombre}: no se puede jugar en una mesa preparada para ella`);
  return { jugada: ops[0], r: aplicarJugada(e, ops[0]) };
}

for (const c of TODAS.filter(x => x.efecto && x.tipo !== 'protagonista')) {
  test(`${c.id} ${c.nombre}: el texto «${texto(c)}» es lo que pasa`, () => {
    const efs = lista(c.efecto);
    const tipos = efs.map(x => x.tipo);
    const t = texto(c);
    const n = numeros(t);
    assert.ok(t.length > 5, 'la carta no tiene texto de efecto');
    const bonusCon = efs.find(x => x.tipo === 'bonusDanio' && x.dimension);
    const e = mesa({ dimA: bonusCon ? bonusCon.dimension : null });
    const yo0 = clon(e.jugadores.A);
    // Para las búsquedas, el tope del mazo tiene cartas del tipo pedido.
    const b = efs.find(x => x.tipo === 'buscar' || x.tipo === 'buscarProtagonista');
    if (b) {
      const pedido = b.tipo === 'buscarProtagonista' ? 'protagonista' : (b.cartaTipo || 'cualquiera');
      const sirve = TODAS.filter(x => pedido === 'cualquiera' || x.tipo === pedido);
      e.jugadores.A.mazo.unshift({ uid: 'T1', carta: sirve[0] }, { uid: 'T2', carta: sirve[1] || sirve[0] });
    }
    const antesDanio = danioDeAccion(e, 'A', 0);
    const { jugada, r } = jugarCarta(e, c);
    const yo = r.estado.jugadores.A;
    let manoEsperada = yo0.mano.length;   // la carta jugada sale de la mano
    for (const ef of efs) {
      switch (ef.tipo) {
        case 'robar': assert.ok(n.includes(ef.n), `dice ${n} y roba ${ef.n}`); manoEsperada += ef.n; break;
        case 'robarPorReserva': manoEsperada += yo0.reserva.length; break;
        case 'saberExtra': assert.equal(yo.activo.saber - yo0.activo.saber, n[0] ?? 1); break;
        case 'curar': assert.equal(yo0.activo.danio - yo.activo.danio, Math.min(n[0], yo0.activo.danio), `dice ${n[0]}`); break;
        case 'curarTodos': assert.equal(yo0.reserva[0].danio - yo.reserva[0].danio, Math.min(n[0], yo0.reserva[0].danio)); break;
        case 'proteger': assert.equal(yo.activo.protegido, true); assert.equal(danioDeAccion({ ...r.estado, turno: 'B' }, 'B', 0), 0, 'protegido igual recibe daño'); break;
        case 'bonusDanio': assert.equal(danioDeAccion(r.estado, 'A', 0) - antesDanio, n[0], `dice +${n[0]}`); break;
        case 'anularLugar': assert.equal(r.estado.lugar, null); break;
        case 'moverSaber': assert.equal(yo.activo.saber - yo0.activo.saber, 1); assert.equal(yo0.reserva[0].saber - yo.reserva[0].saber, 1); break;
        case 'moverSaberTodo': assert.equal(yo.activo.saber, yo0.activo.saber + yo0.reserva[0].saber); assert.equal(yo.reserva[0].saber, 0); break;
        case 'retiroGratis': assert.equal(yo.activo.uid, yo0.reserva[0].uid); assert.equal(yo.reserva[0].saber, yo0.activo.saber, 'cobró retirada'); break;
        case 'buscar': case 'buscarProtagonista': {
          assert.equal(n[0], ef.n || 3, `dice que mira ${n[0]} cartas`);
          manoEsperada += 1;
          const tomada = yo.mano.find(x => x.uid === jugada.eleccion);
          assert.ok(tomada, 'no tomó la carta elegida');
          if (ef.tipo === 'buscarProtagonista') assert.equal(tomada.carta.tipo, 'protagonista');
          if (ef.cartaTipo && ef.cartaTipo !== 'cualquiera') assert.equal(tomada.carta.tipo, ef.cartaTipo);
          break;
        }
        case 'bonusDimension': {
          // Lugar: los Protagonistas de esa dimensión hacen +n (se compara contra la mesa sin ese Lugar).
          assert.ok(t.includes(String(ef.n)), `el texto no dice +${ef.n}`);
          const conLugar = mesa({ dimA: ef.dimension });
          conLugar.lugar = null;
          const sin = danioDeAccion(conLugar, 'A', 0);
          conLugar.lugar = { uid: 'L', carta: c, duenio: 'A' };
          assert.equal(danioDeAccion(conLugar, 'A', 0) - sin, n[0]);
          break;
        }
        default: assert.fail(`efecto ${ef.tipo} sin verificación`);
      }
    }
    if (c.tipo !== 'lugar') assert.equal(yo.mano.length, manoEsperada, `mano: esperaba ${manoEsperada}, hay ${yo.mano.length} (${tipos})`);
  });
}

for (const c of TODAS.filter(x => x.habilidad)) {
  test(`${c.id} ${c.nombre}: la habilidad «${textoHabilidad(c.habilidad)}» es lo que pasa`, () => {
    const h = c.habilidad, t = textoHabilidad(h), n = numeros(t);
    assert.ok(t, 'habilidad sin texto');
    const e = mesa({ dimA: c.dimension });
    const yo = e.jugadores.A, otro = e.jugadores.B;
    const inst = (uid, carta, extra = {}) => ({ uid, carta, danio: 0, saber: 0, protegido: false, bonus: 0, turnoEntrada: 0, ...extra });
    switch (h.tipo) {
      case 'resistente': {
        // El rival ataca a esta carta: recibe n menos que una carta igual sin la habilidad.
        const sinHab = { ...c, habilidad: undefined };
        e.turno = 'B'; otro.activo.saber = 9;
        yo.activo = inst('Aact', sinHab); const normal = danioDeAccion(e, 'B', 0);
        yo.activo = inst('Aact', c); const con = danioDeAccion(e, 'B', 0);
        assert.equal(normal - con, Math.min(n[0], normal), `dice ${n[0]} menos`);
        break;
      }
      case 'fuerzaReserva': {
        const sinHab = { ...c, habilidad: undefined };
        yo.activo = inst('Aact', sinHab, { saber: 9 }); const normal = danioDeAccion(e, 'A', 0);
        yo.activo = inst('Aact', c, { saber: 9 }); const con = danioDeAccion(e, 'A', 0);
        const k = yo.reserva.length, x2 = VENTAJA[c.dimension] === otro.activo.carta.dimension ? 2 : 1;
        assert.equal(con - normal, n[0] * k * x2, `dice +${n[0]} por cada uno en reserva (${k})`);
        break;
      }
      case 'sanador': {
        yo.activo = inst('Aact', c, { danio: 40 });
        let s = aplicarJugada(e, { tipo: 'pasar' }).estado;
        s = aplicarJugada(s, { tipo: 'pasar' }).estado;   // vuelve el turno de A
        assert.equal(40 - s.jugadores.A.activo.danio, n[0], `dice que recupera ${n[0]}`);
        break;
      }
      case 'inspirador': case 'saberAlEntrar': {
        const base = c.evolucionaDe ? TODAS.find(x => x.id === c.evolucionaDe) : null;
        if (base) yo.reserva = [inst('Ares', base, { turnoEntrada: 0 })];
        else yo.reserva = [];
        yo.mano = [{ uid: 'X', carta: c }];
        const op = jugadasValidas(e).find(j => j.uid === 'X' && (j.tipo === 'bajar' || j.tipo === 'evolucionar'));
        assert.ok(op, 'no se pudo poner en juego');
        const s = aplicarJugada(e, op).estado.jugadores.A;
        const entro = [s.activo, ...s.reserva].find(p => p && p.carta.id === c.id);
        if (h.tipo === 'inspirador') assert.equal(s.mano.length, 1, 'no robó 1 carta al entrar');
        else assert.equal(entro.saber, (base ? 0 : 0) + (n[0] ?? 1), `dice que entra con ${n[0]} de Saber`);
        break;
      }
      default: assert.fail(`habilidad ${h.tipo} sin verificación`);
    }
  });
}

// Una carta con habilidad "al entrar" que se pone en la preparación también la aplica.
test('una habilidad «al entrar» también funciona si la carta se pone al preparar la mesa', () => {
  const c = TODAS.find(x => x.habilidad && x.habilidad.tipo === 'saberAlEntrar' && !x.evolucionaDe);
  if (!c) return;
  const otros = PROT.slice(0, 19);
  let e = crearPartida({ mazoA: [c, ...otros], mazoB: PROT.slice(1, 21), semilla: 2 });
  e = clon(e);
  e.jugadores.A.mano = [{ uid: 'X', carta: c }, ...e.jugadores.A.mano.slice(1)];
  const s = aplicarJugada(e, { tipo: 'colocar', uid: 'X' }).estado;
  assert.equal(s.jugadores.A.activo.saber, numeros(textoHabilidad(c.habilidad))[0] ?? 1);
});

for (const t of TABLEROS) {
  test(`${t.id} ${t.nombre}: la regla «${t.textoRegla}» es lo que pasa`, () => {
    const n = numeros(t.textoRegla), g = t.regla;
    const tablero = { id: t.id, regla: g };
    switch (g.tipo) {
      case 'bonusDimension': {
        const sin = mesa({ dimA: g.dimension }); const con = mesa({ dimA: g.dimension, tablero });
        con.tablero = tablero; sin.lugar = null; con.lugar = null;
        const x2 = VENTAJA[g.dimension] === con.jugadores.B.activo.carta.dimension ? 2 : 1;
        assert.equal(danioDeAccion(con, 'A', 0) - danioDeAccion(sin, 'A', 0), n[0] * x2);
        break;
      }
      case 'reduccionDanio': {
        const sin = mesa(); const con = mesa(); con.tablero = tablero; sin.lugar = con.lugar = null;
        assert.equal(danioDeAccion(sin, 'A', 0) - danioDeAccion(con, 'A', 0), n[0]);
        break;
      }
      case 'curarInicioTurno': {
        const e = mesa(); e.tablero = tablero; e.jugadores.A.activo.danio = 40;
        let s = aplicarJugada(e, { tipo: 'pasar' }).estado; s = aplicarJugada(s, { tipo: 'pasar' }).estado;
        assert.equal(40 - s.jugadores.A.activo.danio, n[0]);
        break;
      }
      case 'personajeRoba': {
        const e = mesa(); e.tablero = tablero;
        const p = TODAS.find(x => x.tipo === 'personaje' && lista(x.efecto).every(y => y.tipo === 'saberExtra'));
        const antes = e.jugadores.A.mano.length;
        const { r } = jugarCarta(e, p);
        assert.equal(r.estado.jugadores.A.mano.length - antes, n[0]);
        break;
      }
      case 'saberPorHito': {
        const e = mesa(); e.tablero = tablero; e.lugar = null;
        e.jugadores.A.activo.saber = 9; e.jugadores.B.activo.danio = e.jugadores.B.activo.carta.resistencia - 1;
        const s = aplicarJugada(e, { tipo: 'accion', indice: 0 }).estado;
        assert.equal(s.jugadores.A.activo.saber - 9, n[0]);
        break;
      }
      case 'aulaDoble': {
        const e = mesa(); e.tablero = tablero;
        const a = TODAS.filter(x => x.tipo === 'aula' && lista(x.efecto).every(y => y.tipo === 'proteger' || y.tipo === 'bonusDanio'));
        let { r } = jugarCarta(e, a[0]);
        r.estado.jugadores.A.mano.push({ uid: 'Y', carta: a[1] });
        assert.ok(jugadasValidas(r.estado).some(j => j.uid === 'Y'), 'no deja jugar la segunda Aula');
        assert.equal(n[0], 2);
        break;
      }
      case 'retiroGratis': {
        const e = mesa(); e.tablero = tablero; e.jugadores.A.activo.saber = 0;
        const op = jugadasValidas(e).find(j => j.tipo === 'retirar');
        assert.ok(op, 'con 0 Saber igual debería poder retirarse');
        break;
      }
      default: assert.fail(`regla ${g.tipo} sin verificación`);
    }
  });
}

test('cada acción hace en una mesa neutra exactamente el daño que muestra la carta', () => {
  for (const c of TODAS.filter(x => x.tipo === 'protagonista')) {
    c.acciones.forEach((a, i) => {
      const e = mesa(); e.lugar = null;
      const otro = PROT.find(x => x.dimension !== c.dimension && VENTAJA[c.dimension] !== x.dimension && !x.habilidad);
      e.jugadores.A.activo = { uid: 'Aact', carta: c, danio: 0, saber: 9, protegido: false, bonus: 0, turnoEntrada: 0 };
      e.jugadores.A.reserva = [];
      e.jugadores.B.activo = { uid: 'Bact', carta: otro, danio: 0, saber: 0, protegido: false, bonus: 0, turnoEntrada: 0 };
      assert.equal(danioDeAccion(e, 'A', i), a.danio, `${c.nombre} · ${a.nombre}: muestra ${a.danio}`);
    });
  }
});

test('la debilidad impresa en cada carta es la que duplica el daño', () => {
  for (const c of TODAS.filter(x => x.tipo === 'protagonista')) {
    const fuerte = Object.keys(VENTAJA).find(d => VENTAJA[d] === c.dimension);
    const atk = PROT.find(x => x.dimension === fuerte && x.acciones.length);
    const e = mesa(); e.lugar = null;
    e.jugadores.A.activo = { uid: 'Aact', carta: atk, danio: 0, saber: 9, protegido: false, bonus: 0, turnoEntrada: 0 };
    e.jugadores.A.reserva = [];
    e.jugadores.B.activo = { uid: 'Bact', carta: { ...c, habilidad: undefined }, danio: 0, saber: 0, protegido: false, bonus: 0, turnoEntrada: 0 };
    assert.equal(danioDeAccion(e, 'A', 0), atk.acciones[0].danio * 2, `${c.nombre} debería ser débil ante ${fuerte}`);
  }
});

// En la mesa y en las pistas, todo número de daño sale del motor (danioDeAccion / desgloseDanio),
// nunca del número impreso en la carta: así el botón, el detalle y La Cronista dicen lo mismo.
test('los textos de la mesa y de La Cronista no muestran el daño impreso como si fuera el real', () => {
  for (const f of ['js/ui/mesa.js', 'js/ui/guia.js']) {
    const fuente = readFileSync(f, 'utf8');
    const malos = fuente.split('\n').filter(l => /\.danio\)\}\s*de daño/.test(l) && !/danioDeAccion|total/.test(l));
    assert.deepEqual(malos, [], `${f} muestra daño impreso: ${malos.join(' | ')}`);
  }
});
