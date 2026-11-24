// Utilidades para insertar texto en HTML sin riesgo: todo texto que venga de
// una carta (y sobre todo de las creadas por estudiantes) pasa por esc().
export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

export function pips(n) {
  const k = Math.max(0, Math.min(3, Math.floor(Number(n)) || 0));
  return '<i class="pip"></i>'.repeat(k);
}
