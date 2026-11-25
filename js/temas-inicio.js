// Temas del inicio (los fondos son escenarios en 1536 px, para que se vean nítidos): cada vez que se abre el juego aparece uno al azar. Cada tema junta un paisaje de fondo
// y tres cartas del juego de la misma época (las cartas salen de los mazos, no son fijas).
export const TEMAS_INICIO = [
  { id: 'antiguedad', nombre: 'Antigüedad', fondos: ['img/escenarios/CC-7-U2-007.webp', 'img/escenarios/CC-7-U1-008.webp'],
    cartas: [{ mazo: 'mazo-7', unidades: [1, 2] }] },
  { id: 'medieval', nombre: 'Edad Media', fondos: ['img/escenarios/CC-7-U3-012.webp'],
    cartas: [{ mazo: 'mazo-7', unidades: [3] }] },
  { id: 'colonia', nombre: 'Conquista y Colonia', fondos: ['img/escenarios/CC-5-U1-007.webp', 'img/escenarios/CC-8-U2-007.webp'],
    cartas: [{ mazo: 'mazo-5', unidades: [1, 2] }, { mazo: 'mazo-8', unidades: [2] }] },
  { id: 'republica', nombre: 'Independencia y República', fondos: ['img/escenarios/CC-6-U1-007.webp', 'img/escenarios/CC-6-U2-007.webp'],
    cartas: [{ mazo: 'mazo-6', unidades: [1, 2] }] },
  { id: 'ilustracion', nombre: 'Ilustración e industria', fondos: ['img/escenarios/CC-8-U3-007.webp', 'img/escenarios/CC-8-U1-009.webp'],
    cartas: [{ mazo: 'mazo-8', unidades: [1, 3] }, { mazo: 'mazo-6', unidades: [3] }] },
  { id: 'leyendas', nombre: 'Leyendas del Fin del Mundo', fondos: ['img/escenarios/FM-037.webp', 'img/escenarios/FM-040.webp', 'img/escenarios/FM-038.webp'],
    cartas: [{ mazo: 'exp-fin-del-mundo' }] },
];

// Elige el tema y su fondo (azar ∈ [0,1)); se llama una vez por apertura del juego.
export function elegirTema(azar = Math.random) {
  const tema = TEMAS_INICIO[Math.min(TEMAS_INICIO.length - 1, Math.floor(azar() * TEMAS_INICIO.length))];
  const fondo = tema.fondos[Math.min(tema.fondos.length - 1, Math.floor(azar() * tema.fondos.length))];
  return { tema, fondo };
}

// Protagonistas con ilustración que calzan con el tema.
export function cartasDelTema(tema, mazos, arte) {
  const lista = [];
  for (const f of tema.cartas) {
    for (const c of (mazos[f.mazo] || [])) {
      if (c.tipo === 'protagonista' && arte[c.id] && (!f.unidades || f.unidades.indexOf(c.unidad) >= 0)) lista.push(c);
    }
  }
  return lista;
}
