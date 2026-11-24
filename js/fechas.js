// Rango de años que muestra el texto de una fecha. En la línea de tiempo lo correcto se juzga
// con este rango: si la carta dice «siglo XV», cualquier lugar dentro del siglo XV es válido.

const ROMANOS = { I: 1, V: 5, X: 10, L: 50, C: 100 };
function romano(s) {
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const v = ROMANOS[s[i]], sig = ROMANOS[s[i + 1]] || 0;
    total += v < sig ? -v : v;
  }
  return total;
}
// Siglo n: d.C. 1–100 es el I; a.C. el siglo V va de 500 a 401 a.C.
const siglo = (n, aC) => (aC ? { desde: -n * 100, hasta: -(n - 1) * 100 - 1 } : { desde: (n - 1) * 100 + 1, hasta: n * 100 });

export function rangoDeFecha(fecha) {
  if (fecha.desde != null && fecha.hasta != null) return { desde: fecha.desde, hasta: fecha.hasta };
  const t = String(fecha.texto || '').trim();
  const aC = /a\.\s*C\./i.test(t);
  let m = /siglos?\s+([IVXLC]+)(?:\s*[–-]\s*([IVXLC]+))?/.exec(t);
  if (m) {
    const a = siglo(romano(m[1]), aC), b = siglo(romano(m[2] || m[1]), aC);
    return { desde: Math.min(a.desde, b.desde), hasta: Math.max(a.hasta, b.hasta) };
  }
  m = /(\d{1,4})\s*[–-]\s*(\d{1,4})/.exec(t);
  if (m) {
    const s = aC ? -1 : 1, x = s * Number(m[1]), y = s * Number(m[2]);
    return { desde: Math.min(x, y), hasta: Math.max(x, y) };
  }
  m = /^(?:c\.|hacia)\s*(\d{1,4})/i.exec(t);
  if (m) {
    const anio = (aC ? -1 : 1) * Number(m[1]), margen = aC ? 100 : 25;
    return { desde: anio - margen, hasta: anio + margen };
  }
  return { desde: fecha.anio, hasta: fecha.anio };
}
