// Colecciones además de los cursos: las expansiones. Cada una trae sus propias fuerzas (en lugar de
// las cinco dimensiones de Historia), su ronda de ventajas y las rutas de sus datos y su arte.
// Las claves de las fuerzas no se repiten con las de Historia ni entre colecciones: así un solo mapa
// de ventajas sirve para todo, y los mazos de distintas colecciones nunca se mezclan.
// Este módulo no depende del motor (el motor lo importa).

export const COLECCIONES = [
  {
    id: 'fin-del-mundo',
    nombre: 'Leyendas del Fin del Mundo',
    corto: 'Fin del Mundo',   // en botones angostos (modo libre)
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
        frase: 'La bruma del mar cubre el cielo',
      },
      TierraFuego: {
        nombre: 'Tierra y Fuego',
        tema: { base: '#B8432A', claro: '#F4BFA6', oscuro: '#5A1A0E', papel: '#FBEDE5', icono: 'volcan' },
        frase: 'El fuego de los volcanes ilumina la noche',
      },
      CieloViento: {
        nombre: 'Cielo y Viento',
        tema: { base: '#5B4FA8', claro: '#CFC8F2', oscuro: '#2A2160', papel: '#F0EEFB', icono: 'estrella' },
        frase: 'El viento y la lluvia apagan el fuego',
      },
      BosqueNoche: {
        nombre: 'Bosque y Noche',
        tema: { base: '#2F6B3A', claro: '#B9DDB9', oscuro: '#13301A', papel: '#EAF4EA', icono: 'arbol' },
        frase: 'Los brujos del Caleuche gobiernan el mar',
      },
    },
    // Ronda: Mar → Cielo y Viento → Tierra y Fuego → Bosque y Noche → Mar. Los rivales de cada Duelo
    // (Mar contra Tierra y Fuego; Cielo y Viento contra Bosque y Noche) quedan opuestos: ninguno tiene ventaja.
    ventaja: { Mar: 'CieloViento', CieloViento: 'TierraFuego', TierraFuego: 'BosqueNoche', BosqueNoche: 'Mar' },
  },
  {
    id: 'ocaso-de-los-dioses',
    nombre: 'El Ocaso de los Dioses',
    corto: 'Ocaso',
    sigla: 'OC',
    descripcion: 'Seis mitologías del mundo entre la luz y la sombra.',
    archivo: 'data/exp-ocaso-de-los-dioses.json',
    fondo: 'img/escenarios/OC-OE00.webp',
    dorso: 'img/dorsos/OC-general.webp',
    etiquetaDato: 'De dónde viene',
    ciclo: true,      // día y noche: la luz pega +10 de día y la sombra de noche (lo activa el motor al ver cartas con aspecto)
    oculta: true,     // fuera de los menús hasta que su arte esté en img/ (sw.js exige caché de todo img/)
    fuerzas: {
      Olimpo: { nombre: 'Olimpo', tema: { base: '#2E5C9A', claro: '#BFD4EE', oscuro: '#16305A', papel: '#EEF3FA', icono: 'columna' },
        frase: 'Los barcos griegos llegan a las costas del Nilo' },
      Nilo: { nombre: 'Nilo', tema: { base: '#C8962E', claro: '#F2DDA6', oscuro: '#6E4D0E', papel: '#FBF3E0', icono: 'piramide' },
        frase: 'El sol de Ra disipa a los espíritus de la noche' },
      Yokai: { nombre: 'Tierra de Yōkai', tema: { base: '#B23A48', claro: '#F2B9C0', oscuro: '#5C1520', papel: '#FBEAEC', icono: 'montana' },
        frase: 'Los espíritus burlones enredan a los gigantes del norte' },
      Asgard: { nombre: 'Asgard', tema: { base: '#5E6B7A', claro: '#CDD5DE', oscuro: '#2A323C', papel: '#F0F2F5', icono: 'escudo' },
        frase: 'El gran invierno apaga el quinto sol' },
      QuintoSol: { nombre: 'Quinto Sol', tema: { base: '#1E8A7A', claro: '#AEE3D9', oscuro: '#0C4A41', papel: '#E6F6F3', icono: 'sol' },
        frase: 'El viento de la serpiente emplumada dispersa las nubes del dragón' },
      Jade: { nombre: 'Reino de Jade', tema: { base: '#2F8F4E', claro: '#B6E2C2', oscuro: '#13492A', papel: '#E8F6EC', icono: 'arbol' },
        frase: 'Las nubes del dragón cubren la cumbre del Olimpo' },
    },
    // Ronda: Olimpo → Nilo → Yōkai → Asgard → Quinto Sol → Jade → Olimpo. Los rivales de cada Duelo
    // (Olimpo y Asgard, Nilo y Quinto Sol, Yōkai y Jade) quedan opuestos: ninguno tiene ventaja sobre el otro.
    ventaja: { Olimpo: 'Nilo', Nilo: 'Yokai', Yokai: 'Asgard', Asgard: 'QuintoSol', QuintoSol: 'Jade', Jade: 'Olimpo' },
  },
];

// Las que se ofrecen en los menús (una colección «oculta» existe para el motor y las pruebas, pero aún no se juega).
export const COLECCIONES_VISIBLES = COLECCIONES.filter(c => !c.oculta);

export const coleccion = id => COLECCIONES.find(c => c.id === id) || null;

// Todas las fuerzas de todas las colecciones: { clave: { nombre, tema, frase } }.
export const FUERZAS = Object.assign({}, ...COLECCIONES.map(c => c.fuerzas));
export const VENTAJA_FUERZAS = Object.assign({}, ...COLECCIONES.map(c => c.ventaja));
