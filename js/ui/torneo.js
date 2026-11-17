// Pantalla del torneo (día de juegos): crear la llave, jugar o anotar partidas y ver al campeón.
// Los nombres los escribe el docente: siempre pasan por esc().
import { almacen, CLAVES } from '../almacen.js';
import { crearTorneo, partidasPendientes, anotarGanador, campeon, nombreRonda } from '../torneo.js';
import { crearRng } from '../rng.js';
import { cargarDuelos } from './mesa.js';
import { esc } from '../html.js';

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const CURSOS = [5, 6, 7, 8];
let borrador = { curso: 7, modo: 'normal', duelo: null, hitos: 3, texto: '' };

export async function vistaTorneo({ volver, alJugar, alCambiar }) {
  const duelos = await cargarDuelos();
  const v = h('div', 'pantalla torneo');
  v.appendChild(volver);
  v.appendChild(h('h1', '', 'Torneo'));
  const torneo = almacen.leer(CLAVES.torneo, null);
  if (torneo && torneo.version === 1) v.appendChild(llave(torneo, duelos, alJugar, alCambiar));
  else v.appendChild(formulario(duelos, alCambiar));
  return v;
}

function formulario(duelos, alCambiar) {
  const f = h('div', 'form-torneo');
  f.appendChild(h('p', 'nota', 'Para el día de juegos: escribe los participantes (personas o equipos), uno por línea. Se sortea una llave de eliminación directa.'));
  const opciones = (titulo, lista, actual, alElegir) => {
    const g = h('div', 'grupo');
    g.appendChild(h('h2', '', titulo));
    const fila = h('div', 'opciones');
    for (const [valor, t, d] of lista) {
      const b = h('button', `opcion${actual === valor ? ' elegida' : ''}`, `<b>${t}</b>${d ? `<span>${d}</span>` : ''}`);
      b.onclick = () => { guardarTexto(); alElegir(valor); alCambiar(); };
      fila.appendChild(b);
    }
    g.appendChild(fila);
    f.appendChild(g);
  };
  const area = h('textarea', 'participantes');
  area.rows = 8;
  area.placeholder = 'Equipo Rojo\nEquipo Azul\n…';
  area.value = borrador.texto;
  area.maxLength = 1200;
  const guardarTexto = () => { borrador.texto = area.value; };

  opciones('Curso', CURSOS.map(c => [c, `${c}°`, 'básico']), borrador.curso, c => { borrador.curso = c; borrador.duelo = null; });
  const delCurso = duelos.filter(d => d.curso === borrador.curso);
  opciones('Mazos', [['normal', 'Mazo del curso', ''], ...(delCurso.length ? [['duelo', 'Duelo temático', '']] : [])], borrador.modo, m => { borrador.modo = m; });
  if (borrador.modo === 'duelo' && delCurso.length) {
    if (!delCurso.some(d => d.id === borrador.duelo)) borrador.duelo = delCurso[0].id;
    opciones('Duelo', delCurso.map(d => [d.id, esc(d.nombre), d.bandos.map(b => esc(b.nombre)).join(' vs. ')]), borrador.duelo, id => { borrador.duelo = id; });
  }
  opciones('Hitos para ganar cada partida', [[2, '2 Hitos', 'Partidas más cortas'], [3, '3 Hitos', 'Normal']], borrador.hitos, n => { borrador.hitos = n; });

  const g = h('div', 'grupo');
  g.appendChild(h('h2', '', 'Participantes'));
  g.appendChild(area);
  f.appendChild(g);
  const error = h('p', 'error', '');
  const crear = h('button', 'boton-principal grande', 'Sortear la llave');
  crear.onclick = () => {
    guardarTexto();
    try {
      const t = crearTorneo({
        participantes: borrador.texto.split('\n').map(x => x.trim().slice(0, 30)).filter(Boolean),
        curso: borrador.curso, rng: crearRng(Math.floor(Math.random() * 1e9)),
        modo: borrador.modo, duelo: borrador.modo === 'duelo' ? borrador.duelo : null, hitos: borrador.hitos,
      });
      const r = almacen.guardar(CLAVES.torneo, t);
      if (!r.ok) throw new Error('No hay espacio en la tablet para guardar el torneo');
      borrador.texto = '';
      alCambiar();
    } catch (e) { error.textContent = e.message; }
  };
  f.append(error, crear);
  return f;
}

function llave(t, duelos, alJugar, alCambiar) {
  const c = h('div', 'llave-torneo');
  const duelo = t.duelo ? duelos.find(d => d.id === t.duelo) : null;
  c.appendChild(h('p', 'nota', `${esc(t.curso)}° básico · ${duelo ? `Duelo: ${esc(duelo.nombre)}` : 'Mazo del curso'} · ${esc(t.hitos)} Hitos para ganar · ${t.participantes.length} participantes`));
  const ganador = campeon(t);
  if (ganador) c.appendChild(h('div', 'campeon', `<span class="medalla"></span><small>Campeón del torneo</small><b>${esc(ganador)}</b>`));

  const rondas = h('div', 'rondas');
  t.rondas.forEach((ronda, ri) => {
    const col = h('div', 'ronda');
    col.appendChild(h('h3', '', esc(nombreRonda(t, ri))));
    ronda.forEach((p, pi) => {
      const clase = 'partida-torneo' + (p.ganador ? ' jugada' : '') + (p.directo ? ' directa' : '');
      const m = h('div', clase);
      const linea = nombre => {
        if (!nombre) return '<div class="jugador-llave vacio">Por definir</div>';
        const gano = p.ganador === nombre && !p.directo ? ' gano' : '';
        return '<div class="jugador-llave' + gano + '">' + esc(nombre) + '</div>';
      };
      m.innerHTML = p.directo ? linea(p.a) + '<div class="jugador-llave vacio">Pasa directo</div>' : linea(p.a) + linea(p.b);   // linea() escapa
      if (p.a && p.b && !p.ganador) {
        const bandoA = duelo ? duelo.bandos[(ri + pi) % 2] : null;
        if (bandoA) m.appendChild(h('small', 'bando-llave', `${esc(p.a)} juega con ${esc(bandoA.nombre)}`));
        const acciones = h('div', 'acciones-llave');
        const jugarAqui = h('button', 'boton-principal', 'Jugar aquí');
        jugarAqui.onclick = () => alJugar({
          modo: 'caraacara', cursoA: t.curso, cursoB: t.curso, tablero: 'azar', reforzar: false, linea: true,
          duelo: t.duelo, bandoA: bandoA ? bandoA.id : null, hitosParaGanar: t.hitos,
          nombres: { A: p.a, B: p.b }, torneo: { partida: p.id },
        });
        const anotar = h('button', 'boton-secundario', 'Anotar ganador');
        anotar.onclick = () => {
          acciones.replaceChildren(h('span', 'nota', '¿Quién ganó?'));
          for (const n of [p.a, p.b]) {
            const b = h('button', 'boton-secundario', esc(n));
            b.onclick = () => { almacen.guardar(CLAVES.torneo, anotarGanador(t, p.id, n)); alCambiar(); };
            acciones.appendChild(b);
          }
        };
        acciones.append(jugarAqui, anotar);
        m.appendChild(acciones);
      }
      col.appendChild(m);
    });
    rondas.appendChild(col);
  });
  c.appendChild(rondas);
  if (!ganador) c.appendChild(h('p', 'nota', `Partidas por jugar ahora: ${partidasPendientes(t).length}. "Jugar aquí" abre la partida cara a cara en esta tablet y anota al ganador solo; "Anotar ganador" sirve si se jugó en otra tablet.`));

  const borrar = h('button', 'boton-secundario', 'Borrar torneo');
  borrar.onclick = () => {
    if (borrar.dataset.confirmar) { almacen.borrar(CLAVES.torneo); alCambiar(); return; }
    borrar.dataset.confirmar = '1';
    borrar.textContent = 'Toca otra vez para borrar el torneo';
  };
  c.appendChild(borrar);
  return c;
}
