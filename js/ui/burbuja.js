// Dónde va una burbuja de La Cronista: junto al elemento del que habla, en el lado con más espacio,
// sin tapar las zonas prohibidas (los activos, el Lugar, «Pasar turno») ni el propio elemento.
// Si no cabe en ningún lado, va sobre el respaldo (la mano del jugador). Rectángulos { x, y, w, h }.

const cruza = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const entre = (v, a, b) => Math.min(Math.max(v, a), b);

export function colocarBurbuja({ objetivo, tamano, pantalla, prohibidas = [], respaldo = null, separacion = 12, margen = 8 }) {
  const { w: tw, h: th } = tamano;
  const ajustarX = x => entre(x, margen, pantalla.w - margen - tw);
  const ajustarY = y => entre(y, margen, pantalla.h - margen - th);
  const colita = (r, lado) => {
    const o = objetivo || respaldo;
    const cx = o ? o.x + o.w / 2 : r.x + tw / 2, cy = o ? o.y + o.h / 2 : r.y + th / 2;
    const px = entre(cx, r.x + 16, r.x + tw - 16), py = entre(cy, r.y + 16, r.y + th - 16);
    if (lado === 'abajo') return { x: px, y: r.y };
    if (lado === 'izq') return { x: r.x + tw, y: py };
    if (lado === 'der') return { x: r.x, y: py };
    return { x: px, y: r.y + th };   // arriba y respaldo: la burbuja queda sobre lo que señala
  };

  if (objetivo) {
    const o = objetivo, cx = o.x + o.w / 2, cy = o.y + o.h / 2;
    // Espacio que sobra en cada lado una vez puesta la burbuja (es ancha y baja: no basta comparar píxeles).
    const espacio = { arriba: o.y - th, abajo: pantalla.h - (o.y + o.h) - th, izq: o.x - tw, der: pantalla.w - (o.x + o.w) - tw };
    const lados = Object.keys(espacio).sort((a, b) => espacio[b] - espacio[a]);
    for (const lado of lados) {
      // Para cada lado se prueba centrada y alineada a cada borde del elemento.
      const vertical = lado === 'arriba' || lado === 'abajo';
      const fijo = lado === 'arriba' ? o.y - separacion - th : lado === 'abajo' ? o.y + o.h + separacion
        : lado === 'izq' ? o.x - separacion - tw : o.x + o.w + separacion;
      const variantes = vertical ? [cx - tw / 2, o.x, o.x + o.w - tw] : [cy - th / 2, o.y, o.y + o.h - th];
      for (const v of variantes) {
        const r = vertical ? { x: ajustarX(v), y: ajustarY(fijo) } : { x: ajustarX(fijo), y: ajustarY(v) };
        const c = { x: r.x, y: r.y, w: tw, h: th };
        if (cruza(c, o) || prohibidas.some(p => cruza(c, p))) continue;
        return { ...r, lado, colita: colita(r, lado) };
      }
    }
  }
  const base = respaldo || { x: 0, y: pantalla.h, w: pantalla.w, h: 0 };
  const r = { x: base.x + (base.w - tw) / 2, y: Math.max(margen, base.y - th - margen) };
  return { ...r, lado: 'respaldo', colita: colita(r, 'respaldo') };
}
