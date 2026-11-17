// Service worker de Cronocartas: guarda la app en la tablet para jugar sin internet.
// Al publicar una mejora, sube VERSION y agrega aquí los archivos nuevos
// (la prueba tests/sw.test.js avisa si falta alguno).
const VERSION = 'cc-v3';
const ARCHIVOS = [
  "./",
  "css/estilos.css",
  "data/aula.json",
  "data/mazo-5.json",
  "data/mazo-6.json",
  "data/mazo-7.json",
  "data/mazo-8.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon.svg",
  "index.html",
  "js/almacen.js",
  "js/balance.js",
  "js/compartir.js",
  "js/ediciones.js",
  "js/html.js",
  "js/ia.js",
  "js/imagenes.js",
  "js/mazos.js",
  "js/motor.js",
  "js/pin.js",
  "js/rng.js",
  "js/ui/app.js",
  "js/ui/arte.js",
  "js/ui/banco.js",
  "js/ui/carta.js",
  "js/ui/datos.js",
  "js/ui/docente.js",
  "js/ui/editor.js",
  "js/ui/mesa.js",
  "manifest.webmanifest"
];

self.addEventListener('install', e => {
  // cache: 'reload' evita copiar archivos viejos desde la caché HTTP del navegador.
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Responde desde la caché al instante y, si hay internet, la actualiza por detrás.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const guardado = await cache.match(e.request, { ignoreSearch: true });
    const red = fetch(e.request).then(r => { if (r.ok) cache.put(e.request, r.clone()); return r; }).catch(() => null);
    e.waitUntil(red);
    return guardado || (await red) || cache.match('index.html');
  }));
});
