// Motivo de invocación de cada carta: lo que la carta ES (un tren, un barco, una marcha, un campo…).
// El motivo decide la animación y el sonido con que entra a la mesa; reemplaza al emblema de su
// dimensión (que conserva su color). Los Personajes no tienen motivo: entran diciendo su frase.
// Las cartas sin motivo (las del banco de ideas, por ejemplo) entran según su dimensión o su tipo.

export const MOTIVO_DE_CARTA = {
  // 5° básico
  'CC-5-U1-005': 'barco', 'CC-5-U1-006': 'campana', 'CC-5-U1-007': 'barco', 'CC-5-U1-008': 'marcha', 'CC-5-U1-009': 'originario',
  'CC-5-U2-001': 'comunidad', 'CC-5-U2-002': 'comunidad', 'CC-5-U2-004': 'barco', 'CC-5-U2-005': 'campana', 'CC-5-U2-006': 'comunidad',
  'CC-5-U2-007': 'originario',
  'CC-5-U3-001': 'desierto', 'CC-5-U3-002': 'campo', 'CC-5-U3-003': 'hielo', 'CC-5-U3-004': 'mina', 'CC-5-U3-005': 'sismo',
  'CC-5-U3-006': 'cordillera',
  'CC-5-U4-001': 'pergamino', 'CC-5-U4-002': 'votacion', 'CC-5-U4-003': 'comunidad', 'CC-5-U4-004': 'columnas', 'CC-5-U4-005': 'escuela',
  'CC-5-U4-006': 'escuela',
  // 6° básico
  'CC-6-U1-001': 'independencia', 'CC-6-U1-002': 'independencia', 'CC-6-U1-006': 'campana', 'CC-6-U1-007': 'cordillera',
  'CC-6-U1-008': 'marcha', 'CC-6-U1-009': 'marcha', 'CC-6-U1-010': 'marcha',
  'CC-6-U2-002': 'pergamino', 'CC-6-U2-003': 'mina', 'CC-6-U2-004': 'fabrica', 'CC-6-U2-005': 'pergamino', 'CC-6-U2-006': 'tren',
  'CC-6-U2-007': 'barco',
  'CC-6-U3-002': 'votacion', 'CC-6-U3-003': 'votacion', 'CC-6-U3-004': 'escuela', 'CC-6-U3-005': 'votacion', 'CC-6-U3-006': 'escuela',
  'CC-6-U4-001': 'columnas', 'CC-6-U4-002': 'mazo', 'CC-6-U4-003': 'mina', 'CC-6-U4-004': 'originario', 'CC-6-U4-005': 'pergamino',
  'CC-6-U4-006': 'columnas',
  // 7° básico
  'CC-7-U1-001': 'fuego', 'CC-7-U1-002': 'campo', 'CC-7-U1-003': 'piramide', 'CC-7-U1-004': 'escritura', 'CC-7-U1-005': 'escritura',
  'CC-7-U1-006': 'campo',
  'CC-7-U2-001': 'votacion', 'CC-7-U2-002': 'marcha', 'CC-7-U2-003': 'columnas', 'CC-7-U2-004': 'corona', 'CC-7-U2-005': 'ciencia',
  'CC-7-U2-006': 'olimpico', 'CC-7-U2-007': 'barco',
  'CC-7-U3-001': 'castillo', 'CC-7-U3-002': 'campo', 'CC-7-U3-003': 'escritura', 'CC-7-U3-004': 'mercado', 'CC-7-U3-005': 'mercado',
  'CC-7-U3-006': 'ciencia', 'CC-7-U3-007': 'escuela',
  'CC-7-U4-001': 'templo', 'CC-7-U4-002': 'lago', 'CC-7-U4-003': 'comunidad', 'CC-7-U4-004': 'camino', 'CC-7-U4-005': 'escritura',
  'CC-7-U4-006': 'campo', 'CC-7-U4-007': 'camino', 'CC-7-U4-009': 'ciencia', 'CC-7-U4-010': 'lago',
  // 8° básico
  'CC-8-U1-003': 'corona', 'CC-8-U1-004': 'corona', 'CC-8-U1-005': 'mercado', 'CC-8-U1-006': 'imprenta', 'CC-8-U1-007': 'ciencia',
  'CC-8-U1-009': 'corona',
  'CC-8-U2-002': 'marcha', 'CC-8-U2-003': 'campo', 'CC-8-U2-004': 'campo', 'CC-8-U2-005': 'originario', 'CC-8-U2-006': 'barroco',
  'CC-8-U2-007': 'barco',
  'CC-8-U3-002': 'independencia', 'CC-8-U3-003': 'independencia', 'CC-8-U3-004': 'escritura', 'CC-8-U3-005': 'pergamino',
  'CC-8-U3-006': 'independencia', 'CC-8-U3-007': 'barroco',
  'CC-8-U4-001': 'campo', 'CC-8-U4-002': 'hielo', 'CC-8-U4-003': 'mina', 'CC-8-U4-004': 'moai', 'CC-8-U4-005': 'camino',
  // Cartas del plan equilibrado (noviembre 2026)
  'CC-5-U1-011': 'originario', 'CC-5-U1-012': 'originario', 'CC-5-U2-008': 'campo', 'CC-5-U2-009': 'justicia', 'CC-5-U2-010': 'castillo',
  'CC-5-U2-012': 'originario', 'CC-5-U2-013': 'mercado', 'CC-5-U3-007': 'desierto', 'CC-5-U3-008': 'cordillera', 'CC-5-U3-009': 'hielo',
  'CC-5-U3-010': 'mina', 'CC-5-U3-012': 'barco', 'CC-5-U4-007': 'comunidad', 'CC-5-U4-008': 'comunidad', 'CC-5-U4-009': 'fuego',
  'CC-5-U4-010': 'justicia', 'CC-5-U4-011': 'votacion', 'CC-6-U1-013': 'marcha', 'CC-6-U1-014': 'marcha', 'CC-6-U1-015': 'barco',
  'CC-6-U2-009': 'marcha', 'CC-6-U2-010': 'pergamino', 'CC-6-U2-012': 'desierto', 'CC-6-U3-007': 'comunidad', 'CC-6-U3-009': 'columnas',
  'CC-6-U3-010': 'mina', 'CC-6-U3-011': 'escuela', 'CC-6-U4-007': 'votacion', 'CC-6-U4-008': 'hielo', 'CC-6-U4-009': 'originario',
  'CC-7-U1-007': 'piramide', 'CC-7-U1-008': 'rio', 'CC-7-U1-009': 'escritura', 'CC-7-U1-010': 'templo', 'CC-7-U1-011': 'justicia',
  'CC-7-U1-012': 'templo', 'CC-7-U2-009': 'marcha', 'CC-7-U2-010': 'columnas', 'CC-7-U3-009': 'mazo', 'CC-7-U3-010': 'castillo',
  'CC-7-U3-011': 'peste', 'CC-7-U3-012': 'mercado', 'CC-7-U4-012': 'lago', 'CC-8-U1-011': 'marcha', 'CC-8-U1-012': 'corona',
  'CC-8-U1-013': 'barco', 'CC-8-U2-009': 'justicia', 'CC-8-U2-010': 'justicia', 'CC-8-U2-012': 'campana', 'CC-8-U3-010': 'independencia',
  'CC-8-U3-011': 'independencia', 'CC-8-U4-006': 'campo', 'CC-8-U4-007': 'campo', 'CC-8-U4-009': 'comunidad', 'CC-8-U4-010': 'tren',
  'CC-8-U4-011': 'camino',
};

export const MOTIVOS = [...new Set(Object.values(MOTIVO_DE_CARTA))].sort();

// El motivo de una carta, o null. Las cartas Aula (buenas prácticas de la sala de clases) entran como «escuela».
export function motivoDeCarta(carta) {
  if (!carta || carta.coleccion || carta.tipo === 'personaje') return null;
  if (carta.tipo === 'aula') return 'escuela';
  return MOTIVO_DE_CARTA[carta.id] || null;
}
