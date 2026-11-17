// Panel docente: aprobar cartas del banco de ideas, ver la cobertura curricular
// (OA por unidad y MBE), mover cartas entre tablets y ajustar el juego.
import { almacen, CLAVES } from '../almacen.js';
import { pinValido, huellaPin, verificarPin } from '../pin.js';
import { exportarCartas, importarCartas, resumenExportacion } from '../compartir.js';
import { esc } from '../html.js';
import { renderCarta } from './carta.js';
import { NOMBRE_DIMENSION } from '../mazos.js';

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
let desbloqueado = false;
let pestana = 'propuestas';

export async function vistaDocente({ volver }) {
  desbloqueado = false;   // cada vez que se entra al panel se pide el PIN
  const v = h('div', 'pantalla docente');
  v.appendChild(volver);
  v.appendChild(h('h1', '', 'Panel docente'));
  const cuerpo = h('div', '');
  v.appendChild(cuerpo);
  const datos = {};
  for (const c of [5, 6, 7, 8]) datos[c] = await fetch(`data/mazo-${c}.json`).then(r => r.json());
  const aula = (await fetch('data/aula.json').then(r => r.json())).cartas;

  function pantallaPin() {
    cuerpo.innerHTML = '';
    const guardado = almacen.leer(CLAVES.pin, null);
    const caja = h('div', 'pin');
    caja.appendChild(h('p', '', guardado ? 'Ingresa tu PIN de 4 dígitos.' : 'Crea un PIN de 4 dígitos para que solo tú entres a este panel en esta tablet.'));
    const i1 = h('input'); i1.type = 'password'; i1.inputMode = 'numeric'; i1.maxLength = 4; i1.placeholder = 'PIN';
    caja.appendChild(i1);
    let i2 = null;
    if (!guardado) { i2 = h('input'); i2.type = 'password'; i2.inputMode = 'numeric'; i2.maxLength = 4; i2.placeholder = 'Repite el PIN'; caja.appendChild(i2); }
    const msg = h('div', 'mensaje', '');
    const ok = h('button', 'boton-principal', guardado ? 'Entrar' : 'Crear PIN');
    ok.onclick = () => {
      const p = i1.value.trim();
      if (guardado) {
        if (verificarPin(p, guardado)) { desbloqueado = true; panel(); } else { msg.textContent = 'PIN incorrecto.'; msg.className = 'mensaje error'; }
      } else {
        if (!pinValido(p)) { msg.textContent = 'El PIN debe tener 4 números.'; msg.className = 'mensaje error'; return; }
        if (p !== i2.value.trim()) { msg.textContent = 'Los PIN no coinciden.'; msg.className = 'mensaje error'; return; }
        const r = almacen.guardar(CLAVES.pin, huellaPin(p));
        if (!r.ok) { msg.textContent = 'No se pudo guardar el PIN en esta tablet.'; msg.className = 'mensaje error'; return; }
        desbloqueado = true; panel();
      }
    };
    caja.append(ok, msg);
    cuerpo.appendChild(caja);
    i1.focus();
  }

  function panel() {
    cuerpo.innerHTML = '';
    const tabs = h('div', 'opciones pestanas');
    const pendientes = almacen.listarPropuestas({ estado: 'pendiente' }).length;
    for (const [k, t] of [['propuestas', `Banco de ideas${pendientes ? ` (${pendientes})` : ''}`], ['editar', 'Editar cartas'], ['cobertura', 'Cobertura OA y MBE'], ['compartir', 'Mover cartas'], ['ajustes', 'Ajustes']]) {
      const b = h('button', `opcion chica${pestana === k ? ' elegida' : ''}`, t);
      b.onclick = () => { pestana = k; panel(); };
      tabs.appendChild(b);
    }
    cuerpo.appendChild(tabs);
    const zona = h('div', 'zona-docente');
    cuerpo.appendChild(zona);
    ({ propuestas, editar, cobertura, compartir, ajustes })[pestana](zona);
  }

  // ---------- Propuestas ----------
  function propuestas(zona) {
    const lista = almacen.listarPropuestas();
    if (!lista.length) { zona.appendChild(h('p', 'nota', 'Todavía no hay cartas creadas en esta tablet. Los estudiantes las crean desde "Banco de ideas".')); return; }
    const orden = { pendiente: 0, devuelta: 1, aprobada: 2, descartada: 3 };
    for (const p of lista.slice().sort((a, b) => orden[a.estado] - orden[b.estado])) {
      const fila = h('div', 'fila-propuesta');
      fila.appendChild(renderCarta({ ...p, comunidad: true }, { tamano: 'normal', unidades: datos[p.curso]?.unidades }));
      const lado = h('div', 'acciones-propuesta');
      lado.appendChild(h('div', `estado estado-${p.estado}`, { pendiente: 'Pendiente', aprobada: 'Aprobada', devuelta: 'Devuelta', descartada: 'Descartada' }[p.estado]));
      lado.appendChild(h('p', 'nota', `Por <b>${esc(p.autor || 'sin nombre')}</b> · Fuente: ${esc(p.fuente)}`));
      const dato = h('textarea', 'editar-dato'); dato.value = p.dato; dato.maxLength = 220;
      lado.appendChild(h('label', 'campo-texto', '<span>Dato (puedes corregirlo)</span>')).appendChild(dato);
      const comentario = h('input'); comentario.placeholder = 'Comentario para el estudiante (para devolver)'; comentario.value = p.comentario || '';
      lado.appendChild(comentario);
      const botones = h('div', 'opciones');
      const aviso = h('div', 'mensaje', '');
      const guardarDato = () => {
        const nuevo = dato.value.trim();
        if (nuevo === p.dato) return true;
        if (nuevo.length < 20) { aviso.textContent = 'El dato corregido debe tener al menos 20 letras; no se guardó.'; aviso.className = 'mensaje error'; return false; }
        return almacen.guardarPropuesta({ ...almacen.listarPropuestas().find(x => x.id === p.id), dato: nuevo }).ok;
      };
      const btn = (t, cls, fn) => {
        const b = h('button', cls, t);
        b.onclick = () => {
          if (!guardarDato()) { if (!aviso.textContent) { aviso.textContent = 'No se pudo guardar el cambio en esta tablet (falta espacio).'; aviso.className = 'mensaje error'; } return; }
          const r = fn();
          if (r && r.ok === false) { aviso.textContent = 'No se pudo guardar el cambio en esta tablet (falta espacio).'; aviso.className = 'mensaje error'; return; }
          panel();
        };
        botones.appendChild(b);
      };
      if (p.estado !== 'aprobada') btn('Aprobar', 'boton-principal', () => { const r = almacen.cambiarEstado(p.id, 'aprobada'); return r.ok ? almacen.activarEnMazo(p.id, true) : r; });
      if (p.estado === 'aprobada') {
        btn(p.enMazo ? 'Sacar del mazo' : 'Poner en el mazo', 'boton-secundario', () => almacen.activarEnMazo(p.id, !p.enMazo));
      }
      btn('Devolver con comentario', 'boton-secundario', () => almacen.cambiarEstado(p.id, 'devuelta', comentario.value.trim()));
      if (p.estado !== 'descartada') btn('Descartar', 'enlace', () => almacen.cambiarEstado(p.id, 'descartada'));
      else btn('Eliminar', 'enlace', () => almacen.eliminarPropuesta(p.id));
      lado.appendChild(botones);
      lado.appendChild(aviso);
      if (p.estado === 'aprobada') lado.appendChild(h('p', 'nota', p.enMazo ? 'Está en el mazo del curso: aparece en las partidas y en la colección.' : 'Aprobada, pero fuera del mazo.'));
      fila.appendChild(lado);
      zona.appendChild(fila);
    }
  }

  // ---------- Editar cartas oficiales ----------
  async function editar(zona) {
    const { pestanaEditar } = await import('./editor.js');
    await pestanaEditar(zona);
  }

  // ---------- Cobertura ----------
  function cobertura(zona) {
    zona.appendChild(h('p', 'nota', 'Qué objetivos de aprendizaje (OA) de las Bases Curriculares toca cada mazo, por unidad. Las cartas aprobadas del banco de ideas se cuentan aparte.'));
    for (const c of [5, 6, 7, 8]) {
      const d = datos[c];
      const com = almacen.cartasComunidad(c);
      const sec = h('section', 'cobertura-curso');
      sec.appendChild(h('h2', '', `${c}° básico · ${d.cartas.length} cartas${com.length ? ` + ${com.length} del banco de ideas` : ''}`));
      const t = h('table', 'tabla');
      t.innerHTML = '<thead><tr><th>Unidad</th><th>Cartas</th><th>OA trabajados</th><th>Dimensiones</th></tr></thead>';
      const tb = h('tbody');
      d.unidades.forEach((u, i) => {
        const cs = d.cartas.filter(x => x.unidad === i + 1);
        const oas = [...new Set(cs.map(x => x.oa))].sort((a, b) => parseInt(a.slice(3)) - parseInt(b.slice(3)));
        const dims = [...new Set(cs.filter(x => x.dimension).map(x => NOMBRE_DIMENSION[x.dimension]))];
        const tipos = ['protagonista', 'personaje', 'acontecimiento', 'lugar'].map(tp => cs.filter(x => x.tipo === tp).length);
        tb.appendChild(h('tr', '', `<td><b>U${i + 1}</b> ${esc(u)}</td><td>${tipos[0]} prot. · ${tipos[1]} pers. · ${tipos[2]} acont. · ${tipos[3]} lugar</td><td>${esc(oas.join(', '))}</td><td>${esc(dims.join(', '))}</td>`));
      });
      t.appendChild(tb);
      sec.appendChild(t);
      zona.appendChild(sec);
    }
    const sec = h('section', 'cobertura-curso');
    sec.appendChild(h('h2', '', 'Cartas Aula · Marco para la Buena Enseñanza 2021'));
    const t = h('table', 'tabla');
    t.innerHTML = '<thead><tr><th>Carta</th><th>Dominio</th><th>Estándar</th><th>En el juego</th></tr></thead>';
    const tb = h('tbody');
    for (const a of aula) tb.appendChild(h('tr', '', `<td><b>${esc(a.nombre)}</b></td><td>${esc(a.mbe.dominio)}: ${esc(a.mbe.nombreDominio)}</td><td>${esc(a.mbe.estandar)}. ${esc(a.mbe.nombre)}</td><td>${esc(a.texto)}</td>`));
    t.appendChild(tb);
    sec.appendChild(t);
    zona.appendChild(sec);
  }

  // ---------- Mover cartas entre tablets ----------
  function compartir(zona) {
    zona.appendChild(h('p', 'nota', 'Las cartas del banco de ideas se guardan en cada tablet. Para juntarlas: en una tablet copia el código y en otra pégalo en "Importar".'));
    const exp = h('section', 'paso');
    exp.appendChild(h('h2', '', 'Exportar'));
    const area = h('textarea', 'codigo'); area.readOnly = true;
    const opciones = h('div', 'opciones');
    const generar = (filtro, t) => {
      const b = h('button', 'boton-secundario', t);
      b.onclick = () => {
        const lista = almacen.listarPropuestas(filtro);
        area.value = lista.length ? exportarCartas(lista) : '';
        const { sinImagen } = resumenExportacion(lista);
        estado.innerHTML = !lista.length ? 'No hay cartas para exportar.'
          : `${lista.length} carta(s) en el código (${Math.round(area.value.length / 1000)} mil caracteres).` +
            (sinImagen.length ? `<br>Estas cartas viajan sin su imagen porque es muy pesada: ${sinImagen.map(esc).join(', ')}.` : '');
      };
      opciones.appendChild(b);
    };
    generar({ estado: 'aprobada' }, 'Cartas aprobadas');
    generar({ estado: 'pendiente' }, 'Cartas pendientes');
    generar({}, 'Todas');
    const copiar = h('button', 'boton-principal', 'Copiar código');
    const estado = h('div', 'mensaje', '');
    copiar.onclick = async () => {
      if (!area.value) return;
      try { await navigator.clipboard.writeText(area.value); estado.textContent = 'Código copiado.'; }
      catch { area.select(); estado.textContent = 'Selecciona el código y cópialo manteniendo presionado.'; }
    };
    exp.append(opciones, area, copiar, estado);
    zona.appendChild(exp);

    const imp = h('section', 'paso');
    imp.appendChild(h('h2', '', 'Importar'));
    const entrada = h('textarea', 'codigo'); entrada.placeholder = 'Pega aquí el código (empieza con CC1:)';
    const msg = h('div', 'mensaje', '');
    const importar = h('button', 'boton-principal', 'Importar cartas');
    importar.onclick = () => {
      const r = importarCartas(entrada.value);
      let n = 0, repetidas = 0, sinEspacio = 0;
      const existentes = new Set(almacen.listarPropuestas().map(p => p.id));
      for (const c of r.cartas) {
        if (existentes.has(c.id)) { repetidas++; continue; }
        const g = almacen.guardarPropuesta({ ...c, enMazo: c.estado === 'aprobada' });
        if (g.ok) n++; else sinEspacio++;
      }
      const lineas = [`${n} carta(s) importadas.`];
      if (repetidas) lineas.push(`${repetidas} ya estaban en esta tablet.`);
      if (sinEspacio) lineas.push(`${sinEspacio} no se pudieron guardar: la tablet no tiene espacio.`);
      lineas.push(...r.errores.map(esc));
      msg.innerHTML = lineas.join('<br>');
      msg.className = `mensaje ${(r.errores.length || sinEspacio) && !n ? 'error' : 'ok'}`;
    };
    imp.append(entrada, importar, msg);
    zona.appendChild(imp);
  }

  // ---------- Ajustes ----------
  function ajustes(zona) {
    const a = almacen.leer(CLAVES.ajustes, {}) || {};
    const guardar = cambios => { almacen.guardar(CLAVES.ajustes, { ...a, ...cambios }); panel(); };
    let s = h('section', 'paso'); s.appendChild(h('h2', '', 'Hitos para ganar'));
    const o1 = h('div', 'opciones');
    for (const n of [2, 3]) {
      const b = h('button', `opcion chica${(a.hitosParaGanar || 3) === n ? ' elegida' : ''}`, `${n} Hitos${n === 2 ? ' · partida corta' : ''}`);
      b.onclick = () => guardar({ hitosParaGanar: n });
      o1.appendChild(b);
    }
    s.appendChild(o1); zona.appendChild(s);

    s = h('section', 'paso'); s.appendChild(h('h2', '', 'Mazos cruzados'));
    s.appendChild(h('p', 'nota', 'Permite que cada jugador use el mazo de un curso distinto (por ejemplo, 7° contra 8°).'));
    const o2 = h('div', 'opciones');
    for (const [val, t] of [[false, 'No'], [true, 'Sí']]) {
      const b = h('button', `opcion chica${!!a.cruzados === val ? ' elegida' : ''}`, t);
      b.onclick = () => guardar({ cruzados: val });
      o2.appendChild(b);
    }
    s.appendChild(o2); zona.appendChild(s);

    s = h('section', 'paso'); s.appendChild(h('h2', '', '"¿Sabías que…?" al derrotar una carta'));
    const o3 = h('div', 'opciones');
    for (const [val, t] of [[true, 'Mostrar'], [false, 'No mostrar']]) {
      const b = h('button', `opcion chica${(a.sabias !== false) === val ? ' elegida' : ''}`, t);
      b.onclick = () => guardar({ sabias: val });
      o3.appendChild(b);
    }
    s.appendChild(o3); zona.appendChild(s);

    s = h('section', 'paso'); s.appendChild(h('h2', '', 'Otros'));
    const o4 = h('div', 'opciones');
    const borrarPartida = h('button', 'boton-secundario', 'Borrar partida guardada');
    borrarPartida.onclick = () => { almacen.borrar(CLAVES.partida); borrarPartida.textContent = 'Partida borrada'; };
    const cambiarPin = h('button', 'boton-secundario', 'Cambiar PIN');
    cambiarPin.onclick = () => { almacen.borrar(CLAVES.pin); desbloqueado = false; pantallaPin(); };
    const salir = h('button', 'enlace', 'Cerrar panel');
    salir.onclick = () => { desbloqueado = false; location.hash = '#inicio'; };
    o4.append(borrarPartida, cambiarPin, salir);
    s.appendChild(o4); zona.appendChild(s);
  }

  if (desbloqueado) panel(); else pantallaPin();
  return v;
}
