// Qué mesa se dibuja: contra la tablet, la «vista del jugador» (tu lado manda, el rival arriba y más
// chico, el Lugar al centro); cara a cara, la mesa dividida, con cada mitad mirando a su jugador.
export const disposicionDeMesa = config => (config.modo === 'caraacara' ? 'dividida' : 'jugador');
