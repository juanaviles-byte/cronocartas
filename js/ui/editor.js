// Editor de cartas (solo docente): textos, poder, emblema e imagen de las cartas
// oficiales y Aula. Exporta e importa las ediciones como archivo para otras tablets.
import { almacen, CLAVES } from '../almacen.js';
import { guardarImagen, borrarImagen, leerImagenes, imagenesDisponibles } from '../imagenes.js';
import { aplicarEdiciones, crearPaquete, sanearPaquete } from '../ediciones.js';
import { validarCarta } from '../mazos.js';
import { comprimirImagen } from './banco.js';
import { renderCarta } from './carta.js';
import { EMBLEMAS, iconoEmblema } from './arte.js';
import { esc } from '../html.js';

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
let grupo = 7;   // 5, 6, 7, 8 o 'aula'

async function datosOriginales() {
  const out = {};
  for (const c of [5, 6, 7, 8]) out[c] = await fetch(`data/mazo-${c}.json`).then(r => r.json());
  out.aula = { unidades: [], cartas: (await fetch('data/aula.json').then(r => r.json())).cartas };
  return out;
}

export async function pestanaEditar(zona) {
  const originales = await datosOriginales();
  const hayImagenes = await imagenesDisponibles();

  async function dibujar() {
    zona.innerHTML = '';
    zona.appendChild(h('p', 'nota', 'Toca una carta para cambiar su nombre, dato, poder o imagen. Los cambios se guardan en esta tablet; para llevarlos a otras, usa "Exportar ediciones".'));
    if (!hayImagenes) zona.appendChild(h('p', 'mensaje error', 'Este navegador no permite guardar imágenes. Los textos sí se guardan.'));

    const herramientas = h('div', 'opciones');
    const exp = h('button', 'boton-secundario', 'Exportar ediciones');
    exp.onclick = exportar;
    const imp = h('label', 'boton-secundario archivo', 'Importar ediciones');
    const inp = h('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = () => inp.files[0] && importar(inp.files[0]);
    imp.appendChild(inp);
    herramientas.append(exp, imp);
    zona.appendChild(herramientas);
    const msg = h('div', 'mensaje', '');
    zona.appendChild(msg);
    zona._msg = msg;

    const pestanas = h('div', 'opciones');
    for (const [g, t] of [[5, '5°'], [6, '6°'], [7, '7°'], [8, '8°'], ['aula', 'Aula · MBE']]) {
      const b = h('button', `opcion chica${grupo === g ? ' elegida' : ''}`, t);
      b.onclick = () => { grupo = g; dibujar(); };
      pestanas.appendChild(b);
    }
    zona.appendChild(pestanas);

    const ediciones = almacen.leer(CLAVES.ediciones, {}) || {};
    const imagenes = await leerImagenes();
    const base = originales[grupo];
    const cartas = aplicarEdiciones(base.cartas, ediciones, imagenes);
    const grilla = h('div', 'grilla-cartas');
    for (const c of cartas) {
      const el = renderCarta(c, { tamano: 'normal', unidades: base.unidades });
      if (ediciones[c.id] || imagenes[c.id]) el.classList.add('editada');
      el.onclick = () => abrirEditor(base.cartas.find(x => x.id === c.id), c, base.unidades);
      grilla.appendChild(el);
    }
    zona.appendChild(grilla);
  }

  function mensaje(texto, error = false) {
    if (zona._msg) { zona._msg.innerHTML = texto; zona._msg.className = `mensaje ${error ? 'error' : 'ok'}`; }
  }

  function abrirEditor(original, actual, unidades) {
    const borrador = JSON.parse(JSON.stringify({ ...actual }));
    let imagenNueva = undefined;   // undefined: sin cambio; null: quitar; string: nueva
    const capa = h('div', 'capa');
    const panel = h('div', 'panel-aviso editor');
    const form = h('div', 'editor-form');
    const vista = h('div', 'editor-vista');
    panel.append(form, vista);
    capa.appendChild(panel);
    document.body.appendChild(capa);

    const previsualizar = () => {
      vista.innerHTML = '';
      const muestra = { ...borrador };
      if (imagenNueva === null) delete muestra.imagen; else if (imagenNueva) muestra.imagen = imagenNueva;
      vista.appendChild(renderCarta(muestra, { tamano: 'grande', unidades }));
      const err = validarCarta(muestra);
      vista.appendChild(h('div', `mensaje ${err.length ? 'error' : ''}`, err.length ? esc(err[0]) : `Código: <b>${esc(original.id)}</b>`));
    };
    const campo = (etiqueta, valor, max, area, fn) => {
      const l = h('label', 'campo-texto', `<span>${etiqueta}</span>`);
      const i = h(area ? 'textarea' : 'input'); i.value = valor ?? ''; i.maxLength = max;
      i.oninput = () => { fn(i.value); previsualizar(); };
      l.appendChild(i); form.appendChild(l);
    };
    const rango = (cont, etiqueta, valor, min, max, paso, fn) => {
      const l = h('label', 'campo-rango', `<span>${etiqueta} <b>${valor}</b></span>`);
      const i = h('input'); i.type = 'range'; i.min = min; i.max = max; i.step = paso; i.value = valor;
      i.oninput = () => { fn(Number(i.value)); l.querySelector('b').textContent = i.value; previsualizar(); };
      l.appendChild(i); cont.appendChild(l);
    };

    form.appendChild(h('h2', '', `Editar · ${esc(original.nombre)}`));
    campo('Nombre', borrador.nombre, 30, false, v => { borrador.nombre = v; });
    campo('Dato histórico (máx. 220 letras)', borrador.dato, 220, true, v => { borrador.dato = v; });
    if (original.tipo === 'protagonista') {
      rango(form, 'Resistencia', borrador.resistencia, 50, 120, 10, v => { borrador.resistencia = v; });
      borrador.acciones.forEach((a, i) => {
        const caja = h('div', 'accion-edit');
        caja.appendChild(h('div', 'subtitulo', `Acción ${i + 1}`));
        const l = h('label', 'campo-texto', '<span>Nombre</span>');
        const inp = h('input'); inp.value = a.nombre; inp.maxLength = 22;
        inp.oninput = () => { a.nombre = inp.value; previsualizar(); };
        l.appendChild(inp); caja.appendChild(l);
        rango(caja, 'Saber necesario', a.costo, 1, 3, 1, v => { a.costo = v; });
        rango(caja, 'Daño', a.danio, 0, 100, 10, v => { a.danio = v; });
        form.appendChild(caja);
      });
    }
    form.appendChild(h('div', 'subtitulo', 'Imagen (4:3, se reduce a 640×480)'));
    const filaImg = h('div', 'opciones');
    const subir = h('label', 'boton-secundario archivo', 'Subir imagen');
    const fi = h('input'); fi.type = 'file'; fi.accept = 'image/*';
    fi.onchange = async () => {
      if (!fi.files[0]) return;
      try { imagenNueva = await comprimirImagen(fi.files[0], 640, 0.82); previsualizar(); }
      catch { vista.appendChild(h('div', 'mensaje error', 'No se pudo leer esa imagen.')); }
    };
    subir.appendChild(fi);
    const quitar = h('button', 'boton-secundario', 'Quitar imagen');
    quitar.onclick = () => { imagenNueva = null; previsualizar(); };
    filaImg.append(subir, quitar);
    form.appendChild(filaImg);
    form.appendChild(h('div', 'subtitulo', 'Emblema (si no hay imagen)'));
    const emb = h('div', 'opciones emblemas');
    for (const e of EMBLEMAS) {
      const b = h('button', `opcion chica${borrador.emblema === e ? ' elegida' : ''}`, iconoEmblema(e));
      b.onclick = () => { borrador.emblema = e; emb.querySelectorAll('.elegida').forEach(x => x.classList.remove('elegida')); b.classList.add('elegida'); previsualizar(); };
      emb.appendChild(b);
    }
    form.appendChild(emb);

    const botones = h('div', 'opciones');
    const guardar = h('button', 'boton-principal', 'Guardar');
    const restaurar = h('button', 'boton-secundario', 'Restaurar original');
    const cancelar = h('button', 'enlace', 'Cancelar');
    botones.append(guardar, restaurar, cancelar);
    form.appendChild(botones);
    const aviso = h('div', 'mensaje', '');
    form.appendChild(aviso);

    guardar.onclick = async () => {
      const muestra = { ...original, ...borrador };
      delete muestra.imagen;
      const err = validarCarta(muestra);
      if (err.length) { aviso.textContent = err[0]; aviso.className = 'mensaje error'; return; }
      const cambios = {};
      for (const k of ['nombre', 'dato', 'resistencia', 'emblema']) if (borrador[k] !== undefined && borrador[k] !== original[k]) cambios[k] = borrador[k];
      if (original.acciones && JSON.stringify(borrador.acciones) !== JSON.stringify(original.acciones)) cambios.acciones = borrador.acciones;
      const todas = almacen.leer(CLAVES.ediciones, {}) || {};
      if (Object.keys(cambios).length) todas[original.id] = cambios; else delete todas[original.id];
      const r = almacen.guardar(CLAVES.ediciones, todas);
      if (!r.ok) { aviso.textContent = 'No se pudo guardar en esta tablet (falta espacio).'; aviso.className = 'mensaje error'; return; }
      if (imagenNueva) {
        const g = await guardarImagen(original.id, imagenNueva);
        if (!g.ok) { aviso.textContent = 'Los textos se guardaron, pero la imagen no: la tablet no tiene espacio o no permite guardar imágenes.'; aviso.className = 'mensaje error'; return; }
      } else if (imagenNueva === null) await borrarImagen(original.id);
      capa.remove();
      await dibujar();
      mensaje(`Se guardó "${esc(borrador.nombre)}".`);
    };
    restaurar.onclick = async () => {
      const todas = almacen.leer(CLAVES.ediciones, {}) || {};
      delete todas[original.id];
      almacen.guardar(CLAVES.ediciones, todas);
      await borrarImagen(original.id);
      capa.remove();
      await dibujar();
      mensaje(`"${esc(original.nombre)}" volvió a su versión original.`);
    };
    cancelar.onclick = () => capa.remove();
    previsualizar();
  }

  async function exportar() {
    const paquete = crearPaquete(almacen.leer(CLAVES.ediciones, {}) || {}, await leerImagenes());
    const n = new Set([...Object.keys(paquete.ediciones), ...Object.keys(paquete.imagenes)]).size;
    if (!n) return mensaje('Todavía no hay ediciones para exportar.', true);
    const blob = new Blob([JSON.stringify(paquete)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cronocartas-ediciones-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    mensaje(`Se descargó un archivo con ${n} carta(s) editadas (${(blob.size / 1e6).toFixed(1)} MB). Envíalo a las otras tablets e impórtalo allí.`);
  }

  async function importar(archivo) {
    const r = sanearPaquete(await archivo.text().catch(() => ''));
    if (r.errores.length) return mensaje(r.errores.map(esc).join('<br>'), true);
    const todas = { ...(almacen.leer(CLAVES.ediciones, {}) || {}), ...r.ediciones };
    const g = almacen.guardar(CLAVES.ediciones, todas);
    let imgOk = 0, imgMal = 0;
    for (const [id, img] of Object.entries(r.imagenes)) ((await guardarImagen(id, img)).ok ? imgOk++ : imgMal++);
    await dibujar();
    const lineas = [`Importadas: ${Object.keys(r.ediciones).length} edición(es) de texto y ${imgOk} imagen(es).`];
    if (!g.ok) lineas.push('Los textos no se pudieron guardar: falta espacio.');
    if (imgMal) lineas.push(`${imgMal} imagen(es) no se pudieron guardar: falta espacio.`);
    lineas.push(...r.avisos.map(esc));
    mensaje(lineas.join('<br>'), !g.ok || imgMal > 0);
  }

  await dibujar();
}
