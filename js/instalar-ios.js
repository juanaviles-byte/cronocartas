// En iPhone y iPad no hay aviso automático para instalar: en Safari se hace con Compartir → «Agregar a pantalla de inicio».
// La ayuda aparece solo en Safari de iPhone o iPad, si el juego no está instalado y no se cerró antes.
export function mostrarAyudaIOS({ ua = '', toques = 0, instalada = false, cerrada = false } = {}) {
  if (instalada || cerrada) return false;
  const iphone = /iPhone|iPod|iPad/.test(ua);
  const ipadComoMac = /Macintosh/.test(ua) && toques > 1;   // el iPad se presenta como Mac
  if (!iphone && !ipadComoMac) return false;
  // Otros navegadores de iOS (Chrome, Firefox, Edge) no siempre ofrecen la opción: la ayuda habla de Safari.
  return !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

export function estadoDelEquipo() {
  const nav = typeof navigator !== 'undefined' ? navigator : {};
  const instalada = (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches) || nav.standalone === true;
  return { ua: nav.userAgent || '', toques: nav.maxTouchPoints || 0, instalada };
}
