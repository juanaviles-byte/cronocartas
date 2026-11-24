// Sorteo de quién parte, con la moneda SIU: un jugador al azar elige un lado, se lanza la moneda y,
// si acierta, parte él; si no, parte el otro. Como la moneda es justa, cada uno parte la mitad de las veces.
export const LADOS = ['anverso', 'reverso'];

export const quienElige = (azar = Math.random) => (azar() < 0.5 ? 'A' : 'B');
export const lanzarMoneda = (azar = Math.random) => (azar() < 0.5 ? 'anverso' : 'reverso');
export const quienParte = (elige, eleccion, salio) => (eleccion === salio ? elige : elige === 'A' ? 'B' : 'A');
