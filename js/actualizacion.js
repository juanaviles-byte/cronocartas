// Aviso de versión nueva en el APK. En el APK los archivos vienen dentro de la app y no se
// actualizan solos: al abrirla con internet se compara su versión (la de su sw.js) con la publicada
// en GitHub Pages y, si hay una más nueva, se ofrece descargar el último APK en Chrome.
// (En la página web no hace falta: el service worker ya se actualiza solo.)

export const URL_SW_PUBLICADO = 'https://juanaviles-byte.github.io/cronocartas/sw.js';
export const URL_APK = 'https://github.com/juanaviles-byte/cronocartas/releases/latest/download/cronocartas.apk';

// 'cc-v80' → 80 (o null si el texto no trae versión).
export function versionDeSw(texto) {
  const m = /const VERSION = 'cc-v(\d+)'/.exec(texto || '');
  return m ? Number(m[1]) : null;
}

export const hayVersionNueva = (propia, publicada) => propia != null && publicada != null && publicada > propia;

async function leerVersion(url, ms) {
  const control = typeof AbortController === 'function' ? new AbortController() : null;
  const reloj = control ? setTimeout(() => control.abort(), ms) : null;
  try {
    const r = await fetch(url, { cache: 'no-store', signal: control ? control.signal : undefined });
    return r.ok ? versionDeSw(await r.text()) : null;
  } catch (e) {
    return null;   // sin internet: no se avisa nada
  } finally {
    if (reloj) clearTimeout(reloj);
  }
}

// Muestra el aviso una vez por sesión, si hay una versión publicada más nueva que la del APK.
export async function revisarActualizacionApk() {
  if (typeof document === 'undefined') return;
  try { if (sessionStorage.getItem('cc.aviso-apk')) return; } catch (e) { /* sin almacenamiento: se revisa igual */ }
  const [propia, publicada] = await Promise.all([leerVersion('sw.js', 4000), leerVersion(URL_SW_PUBLICADO, 8000)]);
  if (!hayVersionNueva(propia, publicada) || document.querySelector('.aviso-apk')) return;
  const aviso = document.createElement('div');
  aviso.className = 'aviso-apk';
  aviso.setAttribute('role', 'status');
  aviso.innerHTML = '<b>Hay una versión nueva de Cronocartas</b>'
    + '<span>Se descarga en Chrome. Ábrela e instálala encima: no pierdes tu progreso.</span>'
    + '<div class="aviso-apk-botones"><button type="button" class="boton-secundario">Ahora no</button>'
    // Un enlace externo, sin target: el APK lo abre en el navegador del sistema (Chrome).
    + `<a class="boton-principal" href="${URL_APK}">Descargar</a></div>`;
  const cerrar = () => {
    aviso.remove();
    try { sessionStorage.setItem('cc.aviso-apk', '1'); } catch (e) { /* nada */ }
  };
  aviso.querySelector('button').onclick = cerrar;
  aviso.querySelector('a').addEventListener('click', () => setTimeout(cerrar, 300));
  document.body.appendChild(aviso);
}
