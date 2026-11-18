// Efectos de cartas con el lenguaje del viaje en el tiempo: arena dorada, relojes y huellas de época.
// Una sola capa de granos (canvas fijo, sin eventos de puntero) sirve a todos los efectos y solo
// anima mientras hay granos vivos. Los movimientos de cartas usan la Web Animations API (transform/opacity).

const ORO = ['#E9C46A', '#F3D98B', '#C9A24A', '#FFF1C4'];
let capa = null, ctx = null, granos = [], corriendo = false, dpr = 1;

function asegurarCapa() {
  if (capa && capa.isConnected) return true;
  if (!document.body) return false;
  capa = document.createElement('canvas');
  capa.className = 'capa-granos';
  document.body.appendChild(capa);
  ctx = capa.getContext('2d');
  ajustar();
  addEventListener('resize', ajustar);
  return !!ctx;
}
function ajustar() {
  if (!capa) return;
  dpr = Math.min(devicePixelRatio || 1, 1.5);
  capa.width = Math.round(innerWidth * dpr); capa.height = Math.round(innerHeight * dpr);
}
function bucle() {
  if (!ctx) { corriendo = false; return; }
  ctx.clearRect(0, 0, capa.width, capa.height);
  for (let i = granos.length - 1; i >= 0; i--) {
    const g = granos[i];
    g.vy += g.peso; g.vx *= g.roce; g.vy *= g.roce; g.x += g.vx; g.y += g.vy; g.vida -= g.desgaste;
    if (g.vida <= 0 || g.y > innerHeight + 20) { granos.splice(i, 1); continue; }
    ctx.globalAlpha = Math.min(1, g.vida);
    ctx.fillStyle = g.color;
    ctx.fillRect(g.x * dpr, g.y * dpr, g.t * dpr, g.t * dpr);
  }
  ctx.globalAlpha = 1;
  if (granos.length) requestAnimationFrame(bucle);
  else { corriendo = false; ctx.clearRect(0, 0, capa.width, capa.height); }
}
function agregar(lista) {
  if (!asegurarCapa()) return;
  granos.push(...lista);
  if (granos.length > 1400) granos.splice(0, granos.length - 1400);   // tope para tablets modestas
  if (!corriendo) { corriendo = true; requestAnimationFrame(bucle); }
}
const al = (a, b) => a + Math.random() * (b - a);
const oro = () => ORO[Math.floor(Math.random() * ORO.length)];

// Arena que cae desde una franja (borde de algo que se deshace).
export function arenaQueCae(x0, x1, y, n = 12, color = null) {
  agregar(Array.from({ length: n }, () => ({ x: al(x0, x1), y: y + al(-3, 3), vx: al(-0.5, 0.5), vy: al(0, 0.8), peso: 0.28, roce: 0.995,
    vida: 1, desgaste: al(0.012, 0.02), t: al(1.6, 3), color: color || oro() })));
}

// Estallido de granos desde un punto (impacto, aterrizaje).
export function estallido(x, y, n = 26, fuerza = 4) {
  agregar(Array.from({ length: n }, () => {
    const a = al(0, Math.PI * 2), v = al(fuerza * 0.4, fuerza);
    return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, peso: 0.16, roce: 0.96, vida: 1, desgaste: al(0.018, 0.03), t: al(1.8, 3.2), color: oro() };
  }));
}

// Estela de arena que sigue a un elemento mientras se mueve.
function estela(el, ms) {
  const fin = performance.now() + ms;
  const paso = ahora => {
    if (ahora > fin || !el.isConnected) return;
    const r = el.getBoundingClientRect();
    agregar(Array.from({ length: 3 }, () => ({ x: al(r.left, r.right), y: al(r.top + r.height * 0.3, r.bottom), vx: al(-0.4, 0.4), vy: al(-0.2, 0.4),
      peso: 0.06, roce: 0.97, vida: 0.9, desgaste: al(0.025, 0.04), t: al(1.5, 2.6), color: oro() })));
    requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

const centro = r => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

// La carta viaja desde un origen (la mano, el mazo o donde se soltó) hasta su lugar, en arco, dejando arena.
export function volar(el, desde, { ms = 560, girar = 0 } = {}) {
  if (!el || !desde || !el.animate) return;
  const r = el.getBoundingClientRect(), a = centro(r);
  const dx = desde.x - a.x, dy = desde.y - a.y;
  if (Math.hypot(dx, dy) < 8) return;
  const alto = Math.min(140, Math.hypot(dx, dy) * 0.35);
  el.animate([
    { transform: `translate(${dx}px, ${dy}px) scale(.55) rotate(${girar - 8}deg)`, opacity: 0.3 },
    { offset: 0.55, transform: `translate(${dx * 0.35}px, ${dy * 0.35 - alto}px) scale(1.12) rotate(${girar + 3}deg)`, opacity: 1 },
    { offset: 0.85, transform: 'translate(0, 2px) scale(.97)' },
    { transform: 'none' },
  ], { duration: ms, easing: 'cubic-bezier(.3,.7,.3,1)' });
  estela(el, ms * 0.8);
  setTimeout(() => { if (!el.isConnected) return; const b = el.getBoundingClientRect(); estallido(b.left + b.width / 2, b.bottom - 4, 14, 2.4); }, ms * 0.85);
}

// Golpe: anillo de impacto y arena que salta del defensor.
export function impacto(el) {
  if (!el) return;
  const r = el.getBoundingClientRect(), c = centro(r);
  estallido(c.x, c.y, 34, 5);
  const anillo = document.createElement('div');
  anillo.className = 'anillo-impacto';
  anillo.style.left = `${c.x}px`; anillo.style.top = `${c.y}px`;
  anillo.style.setProperty('--d', `${Math.max(r.width, r.height) * 1.1}px`);
  document.body.appendChild(anillo);
  setTimeout(() => anillo.remove(), 650);
}

// Derrota: la carta se vuelve foto antigua y se deshace en arena de arriba hacia abajo.
export function deshacerEnArena(el, ms = 900) {
  if (!el || !el.animate) return Promise.resolve();
  const r = el.getBoundingClientRect();
  el.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(100% 0 0 0)' }], { duration: ms, easing: 'ease-in', fill: 'forwards' });
  const t0 = performance.now();
  return new Promise(res => {
    const paso = ahora => {
      const k = Math.min(1, (ahora - t0) / ms);
      arenaQueCae(r.left, r.right, r.top + r.height * (1 - Math.pow(1 - k, 1.6)) , 9, Math.random() < 0.5 ? '#B89A6A' : null);
      if (k < 1) requestAnimationFrame(paso); else res();
    };
    requestAnimationFrame(paso);
  });
}

// Evolución: un reloj de arena gira sobre la carta y avanza el tiempo.
export function relojSobre(el) {
  if (!el) return;
  const r = el.getBoundingClientRect(), c = centro(r);
  const reloj = document.createElement('div');
  reloj.className = 'reloj-evolucion';
  reloj.style.left = `${c.x}px`; reloj.style.top = `${c.y}px`;
  reloj.style.setProperty('--d', `${Math.min(r.width, r.height) * 0.62}px`);
  reloj.innerHTML = '<svg viewBox="0 0 40 56" aria-hidden="true"><path d="M8 4h24M8 52h24M10 5c0 12 20 12 20 23S10 41 10 51M30 5c0 12-20 12-20 23s20 13 20 23" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M15 46c2-5 8-5 10 0z" fill="currentColor"/></svg>';
  document.body.appendChild(reloj);
  setTimeout(() => estallido(c.x, c.y, 40, 4.5), 520);
  setTimeout(() => reloj.remove(), 1100);
}

// Saber: un grano de oro viaja hasta la carta.
export function granoHacia(el, desde) {
  if (!el || !desde) return;
  const r = el.getBoundingClientRect(), c = centro(r);
  const g = document.createElement('div');
  g.className = 'grano-saber';
  g.style.left = `${desde.x}px`; g.style.top = `${desde.y}px`;
  document.body.appendChild(g);
  g.animate([{ transform: 'translate(-50%,-50%) scale(.6)' }, { offset: 0.5, transform: `translate(calc(-50% + ${(c.x - desde.x) * 0.5}px), calc(-50% + ${(c.y - desde.y) * 0.5 - 50}px)) scale(1.3)` },
    { transform: `translate(calc(-50% + ${c.x - desde.x}px), calc(-50% + ${c.y - desde.y}px)) scale(.8)` }], { duration: 600, easing: 'ease-in-out', fill: 'forwards' });
  setTimeout(() => { g.remove(); estallido(c.x, c.y, 16, 2.6); }, 600);
}
