// "Arena del reloj": el escenario anterior se deshace en granos que caen y deja ver el nuevo.
// Se dibuja en un canvas detrás de las cartas (z-index -1 dentro de .mesa). Solo usa canvas 2D,
// liviano para tablets: la imagen se borra por bloques y los granos son rectángulos pequeños.

const ORO = [233, 196, 106];

function cargarImagen(url) {
  return new Promise(res => {
    if (!url) return res(null);
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = url;
  });
}

// Dibuja la imagen cubriendo todo (como background-size: cover) y la oscurece como la mesa.
function pintarEscena(ctx, im, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  if (im) {
    const k = Math.max(w / im.width, h / im.height), iw = im.width * k, ih = im.height * k;
    ctx.drawImage(im, (w - iw) / 2, (h - ih) / 2, iw, ih);
    ctx.fillStyle = 'rgba(12,14,18,.24)';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.1, w / 2, h / 2, Math.max(w, h) * 0.62);
    g.addColorStop(0, 'rgba(12,14,18,0)');
    g.addColorStop(1, 'rgba(12,14,18,.5)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
}

/**
 * Crea la capa y empieza el viaje. Devuelve el elemento (la mesa lo vuelve a poner tras cada redibujo);
 * el elemento se quita solo al terminar y queda con dataset.fin = '1'.
 * @param {{ ancho:number, alto:number, imagen?:string, color?:string, duracion?:number }} op
 */
export function arenaDelTiempo({ ancho, alto, imagen = null, color = '#17264F', duracion = 1500 }) {
  const capa = document.createElement('div');
  capa.className = 'viaje-arena';
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const W = Math.max(1, Math.round(ancho * dpr)), H = Math.max(1, Math.round(alto * dpr));
  const base = document.createElement('canvas'), granos = document.createElement('canvas');
  for (const c of [base, granos]) { c.width = W; c.height = H; capa.appendChild(c); }
  const cb = base.getContext('2d'), cg = granos.getContext('2d');
  cb.fillStyle = color; cb.fillRect(0, 0, W, H);   // mientras carga la imagen, el color tapa el cambio

  const terminar = () => { capa.dataset.fin = '1'; capa.remove(); };

  cargarImagen(imagen).then(im => {
    pintarEscena(cb, im, W, H, color);
    // Cuadrícula de bloques; el color de cada grano sale de una versión chica de la escena.
    const lado = Math.round(9 * dpr), cols = Math.ceil(W / lado), filas = Math.ceil(H / lado);
    let muestra = null;
    try {
      const chica = document.createElement('canvas');
      chica.width = cols; chica.height = filas;
      const cc = chica.getContext('2d');
      cc.drawImage(base, 0, 0, cols, filas);
      muestra = cc.getImageData(0, 0, cols, filas).data;
    } catch { muestra = null; }   // sin acceso a los píxeles, los granos son dorados

    // Orden de borrado: de arriba hacia abajo, con un borde irregular como arena que se escurre.
    const bloques = [];
    for (let f = 0; f < filas; f++) for (let c = 0; c < cols; c++) {
      const umbral = (f / filas) * 0.72 + Math.random() * 0.22 + 0.05 * Math.sin((c / cols) * 9 + f * 0.15);
      bloques.push({ c, f, umbral });
    }
    bloques.sort((a, b) => a.umbral - b.umbral);

    const lista = [];
    let i = 0, t0 = performance.now();
    cb.globalCompositeOperation = 'destination-out';
    cb.fillStyle = '#000';
    const g = 0.42 * dpr, tam = Math.max(2, Math.round(2.4 * dpr));
    function cuadro(ahora) {
      if (!capa.isConnected && capa.dataset.fin) return;
      const p = ((ahora - t0) / (duracion * 0.82)) * 1.1;
      while (i < bloques.length && bloques[i].umbral <= p) {
        const { c, f } = bloques[i++];
        // Borrado con "pinceladas" redondas y desplazadas: el borde queda irregular, como arena.
        cb.beginPath();
        cb.arc((c + 0.5 + (Math.random() - 0.5) * 0.6) * lado, (f + 0.5 + (Math.random() - 0.5) * 0.6) * lado, lado * (0.62 + Math.random() * 0.3), 0, Math.PI * 2);
        cb.fill();
        if (Math.random() < 0.4) {
          let r = ORO[0], gg = ORO[1], b = ORO[2];
          if (muestra) { const k = (f * cols + c) * 4; r = muestra[k]; gg = muestra[k + 1]; b = muestra[k + 2]; }
          // Mezcla con oro: la escena "se vuelve arena".
          r = Math.round(r * 0.55 + ORO[0] * 0.45); gg = Math.round(gg * 0.55 + ORO[1] * 0.45); b = Math.round(b * 0.55 + ORO[2] * 0.45);
          lista.push({ x: (c + Math.random()) * lado, y: (f + Math.random()) * lado, vx: (Math.random() - 0.5) * 0.9 * dpr, vy: Math.random() * 0.6 * dpr,
            a: 1, color: `rgb(${r},${gg},${b})` });
        }
      }
      cg.clearRect(0, 0, W, H);
      for (let k = lista.length - 1; k >= 0; k--) {
        const q = lista[k];
        q.vy += g; q.x += q.vx; q.y += q.vy; q.a -= 0.012;
        if (q.y > H || q.a <= 0) { lista.splice(k, 1); continue; }
        cg.globalAlpha = q.a; cg.fillStyle = q.color; cg.fillRect(q.x, q.y, tam, tam);
      }
      cg.globalAlpha = 1;
      if (i >= bloques.length) cb.clearRect(0, 0, W, H);   // los últimos restos sueltos
      if ((i >= bloques.length && !lista.length) || ahora - t0 > duracion + 1200) return terminar();
      requestAnimationFrame(cuadro);
    }
    requestAnimationFrame(cuadro);
  });
  return capa;
}
