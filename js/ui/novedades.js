// Globo de novedades del inicio: una carta con aviso; al tocarlo se abre el panel con la lista de novedades.
// Cada una se abre al tocarla (y recién ahí cuenta como leída); «Volver» regresa a la lista.
import { esc } from '../html.js';
import { noLeidas, esLeida, marcarLeida } from '../novedades.js';

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fechaLarga = f => { const [a, m, d] = String(f).split('-').map(Number); return a && m && d ? `${d} de ${MESES[m - 1]} de ${a}` : esc(f); };
const TIPO = { actualizacion: 'Actualización', noticia: 'Noticia' };
// Una carta con una estrella: la «carta de novedades».
const ICONO = '<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><rect x="7" y="3.5" width="18" height="25" rx="3" transform="rotate(-8 16 16)" fill="#F6F1E3" stroke="#17264F" stroke-width="1.6"/>'
  + '<rect x="9.6" y="6.3" width="12.8" height="19.4" rx="1.8" transform="rotate(-8 16 16)" fill="none" stroke="#C9A24A" stroke-width="1.2"/>'
  + '<path d="M16 10.6l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="#C9A24A"/></svg>';

export function globoNovedades(almacen) {
  const b = h('button', 'globo-novedades', `${ICONO}<span class="globo-rotulo" aria-hidden="true">Novedades</span><span class="globo-cuenta" hidden></span>`);
  b.setAttribute('aria-label', 'Novedades');
  b.title = 'Novedades';
  let novedades = [];
  const cuenta = b.querySelector('.globo-cuenta');
  const pintar = () => {
    const n = noLeidas(novedades, almacen);
    cuenta.hidden = !n;
    cuenta.textContent = n > 9 ? '9+' : String(n);
    b.classList.toggle('con-aviso', n > 0);
    b.setAttribute('aria-label', n ? `Novedades: ${n} sin leer` : 'Novedades');
  };
  fetch('data/novedades.json').then(r => (r.ok ? r.json() : { novedades: [] })).catch(() => ({ novedades: [] }))
    .then(d => { novedades = (d && d.novedades) || []; pintar(); });
  b.onclick = () => abrir(novedades, almacen, pintar);
  return b;
}

function abrir(novedades, almacen, alLeer) {
  const capa = h('div', 'capa capa-novedades');
  const panel = h('div', 'panel-novedades');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Novedades');
  const cab = h('div', 'cab-novedades', '<h2>Novedades</h2>');
  const cerrar = h('button', 'cerrar-novedades', '<span aria-hidden="true">×</span>');
  cerrar.setAttribute('aria-label', 'Cerrar novedades');
  cab.appendChild(cerrar);
  const cuerpo = h('div', 'cuerpo-novedades');
  panel.append(cab, cuerpo);
  const meta = n => `<span class="novedad-meta"><b>${esc(TIPO[n.tipo] || 'Novedad')}</b> · ${fechaLarga(n.fecha)}</span>`;

  // La lista: una fila por novedad, con su marca si todavía no se lee.
  const lista = () => {
    cuerpo.innerHTML = '';
    if (!novedades.length) { cuerpo.appendChild(h('p', 'nota', 'Todavía no hay novedades.')); return; }
    const ul = h('div', 'lista-novedades');
    novedades.forEach(n => {
      const nueva = !esLeida(n, almacen);
      const fila = h('button', `fila-novedad${nueva ? ' nueva' : ''}`, `${meta(n)}<span class="novedad-titulo">${esc(n.titulo)}</span>`
        + `<span class="novedad-resumen">${esc(n.resumen)}</span>${nueva ? '<span class="marca-nueva">Nueva</span>' : ''}<span class="flecha-novedad" aria-hidden="true">›</span>`);
      fila.onclick = () => detalle(n);
      ul.appendChild(fila);
    });
    cuerpo.appendChild(ul);
  };

  // Una novedad abierta, con todos sus puntos.
  const detalle = n => {
    marcarLeida(n, almacen);
    if (alLeer) alLeer();
    cuerpo.innerHTML = '';
    const volver = h('button', 'volver-novedades', '<span aria-hidden="true">‹</span> Volver');
    volver.onclick = () => { lista(); volver.blur(); };
    const art = h('article', `novedad tipo-${esc(n.tipo)}`, `${meta(n)}<h3 class="novedad-titulo">${esc(n.titulo)}</h3><p class="novedad-resumen">${esc(n.resumen)}</p>`);
    for (const sec of n.secciones || []) {
      art.appendChild(h('h4', '', esc(sec.titulo)));
      const ul = h('ul');
      for (const p of sec.puntos) ul.appendChild(h('li', '', esc(p)));
      art.appendChild(ul);
    }
    cuerpo.append(volver, art);
    panel.scrollTop = 0;
    volver.focus();
  };

  lista();
  capa.appendChild(panel);
  const fin = () => { capa.remove(); document.removeEventListener('keydown', tecla); };
  const tecla = ev => { if (ev.key === 'Escape') fin(); };
  cerrar.onclick = fin;
  capa.onclick = ev => { if (ev.target === capa) fin(); };
  document.addEventListener('keydown', tecla);
  document.body.appendChild(capa);
  cerrar.focus();
}
