// Ambiente sonoro de cada escenario: un sonido de fondo en bucle (puerto, cordillera, palacio…).
// Entra y sale con fundido, baja cuando habla una voz y respeta el botón de sonido.
// Si el audio falla (sin archivo, bloqueado por el navegador), el juego sigue en silencio.
import { sonidoActivo } from './sonido.js';

const PASO = 50;   // ms entre pasos de fundido
const ATENUADO = 0.3;

export function crearAmbiente({ crearAudio = ruta => new Audio(ruta), activo = () => true, volumen = 0.22, fundido = 1200 } = {}) {
  let deseada = null;   // la que corresponde al escenario, suene o no
  let actual = null;    // { ruta, el, timer }
  let factor = 1;

  function fundir(p, hacia, ms, alFin) {
    clearInterval(p.timer);
    const desde = p.el.volume ?? 0;
    const pasos = Math.max(1, Math.round(ms / PASO));
    let i = 0;
    p.timer = setInterval(() => {
      i++;
      try { p.el.volume = Math.max(0, Math.min(1, desde + (hacia - desde) * (i / pasos))); } catch { /* volumen no editable */ }
      if (i >= pasos) { clearInterval(p.timer); p.timer = null; if (alFin) alFin(); }
    }, PASO);
  }

  function apagar(p) {
    if (!p) return;
    fundir(p, 0, fundido, () => { try { p.el.pause(); } catch { /* ya detenido */ } });
  }

  function sonar() {
    const ruta = activo() ? deseada : null;
    if ((actual && actual.ruta) === ruta) return;
    apagar(actual);
    actual = null;
    if (!ruta) return;
    try {
      const el = crearAudio(ruta);
      el.loop = true;
      el.volume = 0;
      const p = el.play && el.play();
      if (p && p.catch) p.catch(() => { /* el navegador lo bloqueó: queda en silencio */ });
      actual = { ruta, el, timer: null };
      fundir(actual, volumen * factor, fundido);
    } catch { actual = null; }
  }

  return {
    poner(ruta) { deseada = ruta || null; sonar(); },
    // Volver a mirar si el sonido está activo (tras el botón de sonido).
    refrescar: sonar,
    // Mientras habla una voz, el fondo baja.
    atenuar(si) {
      factor = si ? ATENUADO : 1;
      if (actual) fundir(actual, volumen * factor, 300);
    },
    // La pestaña se ocultó o volvió: pausa sin perder el escenario.
    pausar(si) {
      if (!actual) return;
      try { if (si) actual.el.pause(); else { const p = actual.el.play(); if (p && p.catch) p.catch(() => {}); } } catch { /* sin audio */ }
    },
    get ruta() { return actual ? actual.ruta : null; },
  };
}

// data/ambientes.json: { "<id del Lugar>": { ruta, licencia, autor?, url? } }
export const rutaDeAmbiente = (ambientes, lugarId) => (ambientes && lugarId && ambientes[lugarId] && ambientes[lugarId].ruta) || null;

let AMBIENTES = {};
export const ambientesListos = (typeof fetch === 'function' && typeof location !== 'undefined')
  ? fetch('data/ambientes.json').then(r => (r.ok ? r.json() : null)).then(a => { if (a) AMBIENTES = a; }).catch(() => {})
  : Promise.resolve();
export const rutaAmbiente = lugarId => rutaDeAmbiente(AMBIENTES, lugarId);

export const ambiente = crearAmbiente({ activo: sonidoActivo });

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => ambiente.pausar(document.hidden));
}
