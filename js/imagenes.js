// Imágenes de cartas guardadas en IndexedDB (mucho más espacio que localStorage).
// Si IndexedDB no está disponible, todo devuelve {ok:false} o vacío y el juego sigue.
const DB = 'cronocartas', ALMACEN = 'imagenes';
let conexion = null;

function abrir() {
  if (conexion) return conexion;
  conexion = new Promise(resolve => {
    try {
      if (!globalThis.indexedDB) return resolve(null);
      const pet = indexedDB.open(DB, 1);
      pet.onupgradeneeded = () => pet.result.createObjectStore(ALMACEN);
      pet.onsuccess = () => resolve(pet.result);
      pet.onerror = () => resolve(null);
      pet.onblocked = () => resolve(null);
      setTimeout(() => resolve(null), 2500);   // algunos navegadores nunca responden: seguir sin imágenes
    } catch { resolve(null); }
  });
  return conexion;
}

function operar(modo, fn) {
  return abrir().then(db => new Promise(resolve => {
    if (!db) return resolve({ ok: false, error: 'sin-almacenamiento' });
    try {
      const tx = db.transaction(ALMACEN, modo);
      const r = fn(tx.objectStore(ALMACEN));
      tx.oncomplete = () => resolve({ ok: true, valor: r && r.result });
      tx.onerror = () => resolve({ ok: false, error: tx.error && tx.error.name === 'QuotaExceededError' ? 'cuota' : 'error' });
      tx.onabort = () => resolve({ ok: false, error: tx.error && tx.error.name === 'QuotaExceededError' ? 'cuota' : 'error' });
    } catch { resolve({ ok: false, error: 'error' }); }
  }));
}

export const guardarImagen = (id, dataUrl) => operar('readwrite', s => s.put(dataUrl, id));
export const borrarImagen = id => operar('readwrite', s => s.delete(id));

export async function leerImagenes() {
  const db = await abrir();
  if (!db) return {};
  return new Promise(resolve => {
    try {
      const out = {};
      const cur = db.transaction(ALMACEN, 'readonly').objectStore(ALMACEN).openCursor();
      cur.onsuccess = () => { const c = cur.result; if (c) { out[c.key] = c.value; c.continue(); } else resolve(out); };
      cur.onerror = () => resolve(out);
    } catch { resolve({}); }
  });
}

export async function imagenesDisponibles() {
  return !!(await abrir());
}
