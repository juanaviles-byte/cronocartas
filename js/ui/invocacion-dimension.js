// Invocación según la dimensión: cada dimensión de Historia entra con su propio emblema animado
// (en vez del destello dorado) y su propio sonido.
//   Economía: una lluvia de monedas.          Política: un sello que golpea el decreto.
//   Sociedad: un círculo de personas.          Cultura: letras y signos que suben.
//   Territorio: montañas que se alzan y una rosa de los vientos.
// Solo usa transform y opacity (CSS), así que también corre en el modo escuela; las partículas de la
// capa de granos se suman solo fuera del modo escuela.

export const DIMENSION_INVOCACION = { Politica: 'politica', Economia: 'economia', Sociedad: 'sociedad', Cultura: 'cultura', Territorio: 'territorio' };

// Color de cada dimensión (los mismos de las cartas) y su versión translúcida para el círculo.
export const COLOR_DIMENSION = {
  politica: ['#C0392B', 'rgba(192,57,43,.35)'],
  economia: ['#E0A526', 'rgba(224,165,38,.35)'],
  sociedad: ['#3B7BD0', 'rgba(59,123,208,.35)'],
  cultura: ['#8E5CD0', 'rgba(142,92,208,.35)'],
  territorio: ['#3A9C64', 'rgba(58,156,100,.35)'],
};

// La dimensión que decide la animación, o null (Acontecimientos, Aula y cartas de expansiones).
export function dimensionDeInvocacion(carta) {
  if (!carta || carta.coleccion) return null;
  const d = carta.tipo === 'lugar' ? (carta.efecto && carta.efecto.dimension) : carta.dimension;
  return DIMENSION_INVOCACION[d] || null;
}

const MONEDA = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="#E9B949" stroke="#8A5A06" stroke-width="2"/>'
  + '<circle cx="20" cy="20" r="12.5" fill="none" stroke="#B9850F" stroke-width="1.6"/><path d="M20 11l2.6 5.4 5.9.8-4.3 4.1 1 5.9L20 24.4l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" fill="#FFF1C4"/></svg>';
const PERSONA = '<svg viewBox="0 0 30 40" aria-hidden="true"><circle cx="15" cy="10" r="7" fill="currentColor"/><path d="M2 40c0-10 6-17 13-17s13 7 13 17z" fill="currentColor"/></svg>';
const SELLO = '<svg viewBox="0 0 120 120" aria-hidden="true">'
  + Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2; return `<circle cx="${(60 + Math.cos(a) * 50).toFixed(1)}" cy="${(60 + Math.sin(a) * 50).toFixed(1)}" r="9" fill="#A82A1C"/>`; }).join('')
  + '<circle cx="60" cy="60" r="52" fill="#B83224"/><circle cx="60" cy="60" r="40" fill="none" stroke="#E9C46A" stroke-width="2.5"/>'
  + '<path d="M38 82h44M41 76h38M44 46v30M54 46v30M66 46v30M76 46v30M38 46h44l-22-12z" stroke="#F3D98B" stroke-width="4" fill="none" stroke-linejoin="round"/></svg>';
const ROSA = '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 5"/>'
  + '<path d="M60 4l9 47 47 9-47 9-9 47-9-47-47-9 47-9z" fill="currentColor" opacity=".9"/><path d="M60 24l5 31 31 5-31 5-5 31-5-31-31-5 31-5z" fill="#F3EAD3" opacity=".85"/></svg>';
const MONTANAS = '<svg viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true"><path d="M0 80L30 38 48 54 78 14 104 46 122 30 150 58 172 34 200 56V80z" fill="currentColor"/>'
  + '<path d="M78 14l-10 16 10-4 8 6zM122 30l-6 10 6-2 5 4z" fill="#F3EAD3" opacity=".85"/></svg>';
const SIGNOS = ['α', 'Ω', '♪', 'π', 'Σ', 'A', 'Ж', '文', '✒', '∞', 'ب', '♫'];

// Lo que va encima de la carta: en Política, el sello de lacre que la timbra como un decreto.
export function adornoEncima(dim) {
  if (dim !== 'politica') return null;
  const e = document.createElement('i');
  e.className = 'sello-encima';
  e.setAttribute('aria-hidden', 'true');
  e.innerHTML = SELLO;
  return e;
}

// El emblema que va detrás de la carta invocada.
export function emblemaDimension(dim) {
  const e = document.createElement('div');
  e.className = `emblema-dim emblema-${dim}`;
  e.setAttribute('aria-hidden', 'true');
  const pieza = (html, i, n, extra = '') => `<i class="pieza" style="--i:${i};--a:${(i / n * 360).toFixed(1)}deg${extra}">${html}</i>`;
  if (dim === 'economia') {
    e.innerHTML = Array.from({ length: 12 }, (_, i) => pieza(`<b>${MONEDA}</b>`, i, 12, `;--r:${(0.62 + (i % 3) * 0.12).toFixed(2)}`)).join('');
  } else if (dim === 'politica') {
    e.innerHTML = '<i class="onda-sello"></i><i class="onda-sello segunda"></i>';
  } else if (dim === 'sociedad') {
    e.innerHTML = `<i class="ronda">${Array.from({ length: 12 }, (_, i) => pieza(PERSONA, i, 12)).join('')}</i>`;
  } else if (dim === 'cultura') {
    e.innerHTML = SIGNOS.map((s, i) => pieza(s, i, SIGNOS.length, `;--x:${((i * 37) % 100 - 50)}%`)).join('');
  } else if (dim === 'territorio') {
    e.innerHTML = `<i class="rosa">${ROSA}</i><i class="montanas">${MONTANAS}</i>`;
  }
  return e;
}
