// Colecciones además de los cursos: las expansiones. Cada una trae sus propias fuerzas (en lugar de
// las cinco dimensiones de Historia), su ronda de ventajas y las rutas de sus datos y su arte.
// Las claves de las fuerzas no se repiten con las de Historia ni entre colecciones: así un solo mapa
// de ventajas sirve para todo, y los mazos de distintas colecciones nunca se mezclan.
// Este módulo no depende del motor (el motor lo importa).

export const COLECCIONES = [
  {
    id: 'fin-del-mundo',
    nombre: 'Leyendas del Fin del Mundo',
    sigla: 'FM',
    descripcion: 'Mitología de Chile: seres del mar, la tierra, el cielo y el bosque.',
    archivo: 'data/exp-fin-del-mundo.json',
    fondo: 'img/escenarios/FM-ME00.webp',
    dorso: 'img/dorsos/FM-general.webp',
    etiquetaDato: 'De dónde viene',
    ambiente: 'audio/ambientes/FM-ME00.ogg',   // suena mientras no hay un Lugar de la expansión en juego
    fuerzas: {
      Mar: {
        nombre: 'Mar',
        tema: { base: '#1F6E8C', claro: '#A9DCEB', oscuro: '#0B3550', papel: '#E6F4F8', icono: 'ola' },
        frase: 'El mar apaga el fuego',
      },
      TierraFuego: {
        nombre: 'Tierra y Fuego',
        tema: { base: '#B8432A', claro: '#F4BFA6', oscuro: '#5A1A0E', papel: '#FBEDE5', icono: 'volcan' },
        frase: 'La ceniza de los volcanes cubre el cielo',
      },
      CieloViento: {
        nombre: 'Cielo y Viento',
        tema: { base: '#5B4FA8', claro: '#CFC8F2', oscuro: '#2A2160', papel: '#F0EEFB', icono: 'estrella' },
        frase: 'El viento y la luz disipan la noche',
      },
      BosqueNoche: {
        nombre: 'Bosque y Noche',
        tema: { base: '#2F6B3A', claro: '#B9DDB9', oscuro: '#13301A', papel: '#EAF4EA', icono: 'arbol' },
        frase: 'Los brujos del Caleuche gobiernan el mar',
      },
    },
    ventaja: { Mar: 'TierraFuego', TierraFuego: 'CieloViento', CieloViento: 'BosqueNoche', BosqueNoche: 'Mar' },
  },
];

export const coleccion = id => COLECCIONES.find(c => c.id === id) || null;

// Todas las fuerzas de todas las colecciones: { clave: { nombre, tema, frase } }.
export const FUERZAS = Object.assign({}, ...COLECCIONES.map(c => c.fuerzas));
export const VENTAJA_FUERZAS = Object.assign({}, ...COLECCIONES.map(c => c.ventaja));
